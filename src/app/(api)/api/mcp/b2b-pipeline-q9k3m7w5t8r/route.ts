import GetPrismaClient from "@/lib/prisma";
import { createSevenpreneurMcp, mcpJsonText as jsonText } from "@/lib/mcp";
import {
  B2BProbabilityStatusEnum,
  B2BProductEnum,
  B2BSourceEnum,
  B2BStageEnum,
  Prisma,
} from "@prisma/client";
import dayjs from "dayjs";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const dateString = z
  .string()
  .refine((s) => dayjs(s).isValid(), { message: "Invalid date string" })
  .describe(
    "Date string parseable by dayjs, e.g. 2025-01-01 or 2025-01-01T00:00:00Z",
  );

const PRODUCT_ENUM = z.enum(B2BProductEnum);
const SOURCE_ENUM = z.enum(B2BSourceEnum);
const STAGE_ENUM = z.enum(B2BStageEnum);
const PROBABILITY_STATUS_ENUM = z.enum(B2BProbabilityStatusEnum);

// Month-precision input. Accepts "YYYY-MM" (e.g. "2026-06") — converts to
// the first day of the month before persisting.
const monthInput = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "Must be in YYYY-MM format, e.g. 2026-06",
  })
  .describe("Month in YYYY-MM format, e.g. 2026-06");

function parseMonthToDate(month: string): Date {
  return new Date(`${month}-01T00:00:00.000Z`);
}

const companyInclude = {
  industry: { select: { id: true, industry_name: true } },
} satisfies Prisma.B2BCompanyInclude;

type CompanyWithRelations = Prisma.B2BCompanyGetPayload<{
  include: typeof companyInclude;
}>;

function serializeCompany(c: CompanyWithRelations) {
  return {
    id: c.id,
    name: c.name,
    industry: c.industry,
    pic_name: c.pic_name,
    pic_job_title: c.pic_job_title,
    pic_wa: c.pic_wa,
    pic_email: c.pic_email,
    created_at: dayjs(c.created_at).toISOString(),
    updated_at: dayjs(c.updated_at).toISOString(),
  };
}

const pipelineInclude = {
  owner: { select: { id: true, full_name: true, email: true, avatar: true } },
  company: { include: companyInclude },
  _count: { select: { actions: true } },
} satisfies Prisma.B2BPipelineInclude;

type PipelineWithRelations = Prisma.B2BPipelineGetPayload<{
  include: typeof pipelineInclude;
}>;

function serializePipeline(p: PipelineWithRelations) {
  return {
    id: p.id,
    name: p.name,
    company: serializeCompany(p.company),
    product: p.product,
    source: p.source,
    stage: p.stage,
    probability: p.probability,
    probability_status: p.probability_status,
    project_value: Number(p.project_value),
    project_start_month: p.project_start_month
      ? dayjs(p.project_start_month).format("YYYY-MM")
      : null,
    project_end_month: p.project_end_month
      ? dayjs(p.project_end_month).format("YYYY-MM")
      : null,
    owner: p.owner,
    actions_count: p._count.actions,
    created_at: dayjs(p.created_at).toISOString(),
    updated_at: dayjs(p.updated_at).toISOString(),
  };
}

function serializeAction(a: {
  id: number;
  pipeline_id: number;
  name: string;
  summary: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: a.id,
    pipeline_id: a.pipeline_id,
    name: a.name,
    summary: a.summary,
    created_at: dayjs(a.created_at).toISOString(),
    updated_at: dayjs(a.updated_at).toISOString(),
  };
}

function buildPipelineWhere(args: {
  product?: B2BProductEnum;
  source?: B2BSourceEnum;
  stage?: B2BStageEnum;
  probability_status?: B2BProbabilityStatusEnum;
  owner_id?: string;
  industry_id?: number;
  keyword?: string;
  from?: string;
  to?: string;
}): Prisma.B2BPipelineWhereInput {
  const where: Prisma.B2BPipelineWhereInput = {};
  if (args.product) where.product = args.product;
  if (args.source) where.source = args.source;
  if (args.stage) where.stage = args.stage;
  if (args.probability_status)
    where.probability_status = args.probability_status;
  if (args.owner_id) where.owner_id = args.owner_id;
  if (args.industry_id) where.company = { industry_id: args.industry_id };
  if (args.from || args.to) {
    where.created_at = {};
    if (args.from) where.created_at.gte = dayjs(args.from).toDate();
    if (args.to) where.created_at.lte = dayjs(args.to).toDate();
  }
  if (args.keyword) {
    where.OR = [
      { name: { contains: args.keyword, mode: "insensitive" } },
      { company: { name: { contains: args.keyword, mode: "insensitive" } } },
      {
        company: { pic_name: { contains: args.keyword, mode: "insensitive" } },
      },
      {
        company: { pic_email: { contains: args.keyword, mode: "insensitive" } },
      },
      {
        company: {
          pic_job_title: { contains: args.keyword, mode: "insensitive" },
        },
      },
    ];
  }
  return where;
}

const handler = createSevenpreneurMcp(
  "b2b-pipeline-q9k3m7w5t8r",
  (server) => {
    // ─────────────────────────────────────────────────────────────────────
    // PIPELINE CRUD
    // ─────────────────────────────────────────────────────────────────────

    server.tool(
      "list_pipelines",
      "List B2B sales pipeline leads (companies). Each lead includes company name, industry, PIC contact, product type (sponsorship / corporate_training / corporate_ai_training), source channel, current pipeline stage (lead_identified → contacted → negotiation → verbal_commit → closed_won/closed_lost/on_hold), probability (1–100), project_value in IDR, owner badge, and total related actions count. Filter by product, source, stage, owner, industry, keyword (matches company name / PIC name / PIC email / job title), or created_at date range.",
      {
        product: PRODUCT_ENUM.optional(),
        source: SOURCE_ENUM.optional(),
        stage: STAGE_ENUM.optional(),
        probability_status: PROBABILITY_STATUS_ENUM.optional(),
        owner_id: z
          .uuid()
          .optional()
          .describe("Filter to pipelines owned by this user (UUID)"),
        industry_id: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter to pipelines in this industry (industries.id)"),
        keyword: z
          .string()
          .optional()
          .describe(
            "Substring search across company name, PIC name, PIC email, PIC job title (case-insensitive)",
          ),
        from: dateString
          .optional()
          .describe("Earliest created_at (inclusive)"),
        to: dateString.optional().describe("Latest created_at (inclusive)"),
        limit: z.number().int().min(1).max(200).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      },
      async (args) => {
        const prisma = GetPrismaClient();
        const where = buildPipelineWhere(args);
        const [items, total] = await Promise.all([
          prisma.b2BPipeline.findMany({
            where,
            include: pipelineInclude,
            orderBy: { created_at: "desc" },
            take: args.limit,
            skip: args.offset,
          }),
          prisma.b2BPipeline.count({ where }),
        ]);
        return jsonText({
          total,
          count: items.length,
          offset: args.offset,
          limit: args.limit,
          items: items.map(serializePipeline),
        });
      },
    );

    server.tool(
      "get_pipeline",
      "Fetch a single B2B pipeline lead by its numeric ID. Includes owner badge, action count, and (by default) the most recent 50 activity records associated with this lead.",
      {
        id: z.number().int().describe("B2BPipeline.id"),
        include_actions: z
          .boolean()
          .optional()
          .default(true)
          .describe("Include recent activity records inline"),
        actions_limit: z
          .number()
          .int()
          .min(1)
          .max(200)
          .optional()
          .default(50),
      },
      async ({ id, include_actions, actions_limit }) => {
        const prisma = GetPrismaClient();
        const p = await prisma.b2BPipeline.findUnique({
          where: { id },
          include: pipelineInclude,
        });
        if (!p) return jsonText({ error: "Pipeline not found" });

        const actions = include_actions
          ? await prisma.b2BAction.findMany({
              where: { pipeline_id: id },
              orderBy: { created_at: "desc" },
              take: actions_limit,
            })
          : null;

        return jsonText({
          ...serializePipeline(p),
          ...(actions ? { actions: actions.map(serializeAction) } : {}),
        });
      },
    );

    server.tool(
      "create_pipeline",
      "Create a new B2B pipeline lead (a deal/program for a company). 'name' is the program name (e.g. the sponsorship or training engagement), NOT the company name. Link to a company by passing an existing company_id, OR pass new_company to create the company inline (one PIC per company lives on the company record). Owner must be an existing User UUID. Stage defaults to 'lead_identified', probability defaults to 0, project_value defaults to 0 if omitted. Optionally set project_start_month / project_end_month in YYYY-MM format.",
      {
        name: z.string().min(1).describe("Program / deal name"),
        company_id: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Existing company to attach (b2b_company.id)"),
        new_company: z
          .object({
            name: z.string().min(1).describe("Company name"),
            industry_id: z
              .number()
              .int()
              .positive()
              .describe("Industry classification (industries.id)"),
            pic_name: z.string().nullable().optional(),
            pic_job_title: z.string().nullable().optional(),
            pic_wa: z.string().nullable().optional(),
            pic_email: z.string().nullable().optional(),
          })
          .optional()
          .describe("Create a new company inline instead of company_id"),
        owner_id: z.uuid().describe("Owner of this lead (User UUID)"),
        product: PRODUCT_ENUM,
        source: SOURCE_ENUM,
        stage: STAGE_ENUM.optional(),
        probability: z.number().int().min(0).max(100).optional(),
        probability_status: PROBABILITY_STATUS_ENUM.optional(),
        project_value: z
          .number()
          .nonnegative()
          .optional()
          .describe("Projected deal value in IDR (rupiah)"),
        project_start_month: monthInput.optional(),
        project_end_month: monthInput.optional(),
      },
      async (args) => {
        if (
          args.project_start_month &&
          args.project_end_month &&
          args.project_end_month < args.project_start_month
        ) {
          return jsonText({
            error:
              "project_end_month must be on or after project_start_month.",
          });
        }
        if (!args.company_id === !args.new_company) {
          return jsonText({
            error: "Provide exactly one of company_id or new_company.",
          });
        }
        const prisma = GetPrismaClient();
        const company: Prisma.B2BCompanyCreateNestedOneWithoutPipelinesInput =
          args.new_company
            ? {
                create: {
                  name: args.new_company.name.trim(),
                  industry_id: args.new_company.industry_id,
                  pic_name: args.new_company.pic_name?.trim() || null,
                  pic_job_title: args.new_company.pic_job_title?.trim() || null,
                  pic_wa: args.new_company.pic_wa?.trim() || null,
                  pic_email: args.new_company.pic_email?.trim() || null,
                },
              }
            : { connect: { id: args.company_id! } };
        try {
          const created = await prisma.b2BPipeline.create({
            data: {
              name: args.name.trim(),
              company,
              owner: { connect: { id: args.owner_id } },
              product: args.product,
              source: args.source,
              stage: args.stage,
              probability: args.probability,
              probability_status: args.probability_status,
              project_value: args.project_value,
              project_start_month: args.project_start_month
                ? parseMonthToDate(args.project_start_month)
                : null,
              project_end_month: args.project_end_month
                ? parseMonthToDate(args.project_end_month)
                : null,
            },
            include: pipelineInclude,
          });
          return jsonText(serializePipeline(created));
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2025"
          ) {
            return jsonText({ error: "Company (company_id) not found" });
          }
          throw err;
        }
      },
    );

    server.tool(
      "update_pipeline",
      "Update fields on an existing B2B pipeline lead (deal/program). Only the provided fields are changed. Common use: rename the program, advance the stage, update probability after a meeting, revise project_value, reassign to a different company (company_id), or set the project window (project_start_month / project_end_month in YYYY-MM). Pass null to clear a project_*_month. To edit company details (name, industry, PIC), use update_company instead.",
      {
        id: z.number().int().describe("B2BPipeline.id"),
        name: z.string().min(1).optional().describe("Program / deal name"),
        company_id: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Reassign to a different company (b2b_company.id)"),
        owner_id: z.uuid().optional(),
        product: PRODUCT_ENUM.optional(),
        source: SOURCE_ENUM.optional(),
        stage: STAGE_ENUM.optional(),
        probability: z.number().int().min(0).max(100).optional(),
        probability_status: PROBABILITY_STATUS_ENUM.optional(),
        project_value: z.number().nonnegative().optional(),
        project_start_month: monthInput.nullable().optional(),
        project_end_month: monthInput.nullable().optional(),
      },
      async (args) => {
        if (
          args.project_start_month &&
          args.project_end_month &&
          args.project_end_month < args.project_start_month
        ) {
          return jsonText({
            error:
              "project_end_month must be on or after project_start_month.",
          });
        }
        const prisma = GetPrismaClient();
        const { id, ...rest } = args;
        const data: Prisma.B2BPipelineUpdateInput = {};
        if (rest.name !== undefined) data.name = rest.name.trim();
        if (rest.company_id !== undefined)
          data.company = { connect: { id: rest.company_id } };
        if (rest.owner_id !== undefined)
          data.owner = { connect: { id: rest.owner_id } };
        if (rest.product !== undefined) data.product = rest.product;
        if (rest.source !== undefined) data.source = rest.source;
        if (rest.stage !== undefined) data.stage = rest.stage;
        if (rest.probability !== undefined) data.probability = rest.probability;
        if (rest.probability_status !== undefined)
          data.probability_status = rest.probability_status;
        if (rest.project_value !== undefined)
          data.project_value = rest.project_value;
        if (rest.project_start_month !== undefined)
          data.project_start_month = rest.project_start_month
            ? parseMonthToDate(rest.project_start_month)
            : null;
        if (rest.project_end_month !== undefined)
          data.project_end_month = rest.project_end_month
            ? parseMonthToDate(rest.project_end_month)
            : null;

        try {
          const updated = await prisma.b2BPipeline.update({
            where: { id },
            data,
            include: pipelineInclude,
          });
          return jsonText(serializePipeline(updated));
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2025"
          ) {
            return jsonText({ error: "Pipeline or company not found" });
          }
          throw err;
        }
      },
    );

    server.tool(
      "delete_pipeline",
      "Delete a B2B pipeline lead. WARNING: this CASCADES — all associated activity records (b2b_actions) are also permanently removed via the database FK constraint.",
      {
        id: z.number().int().describe("B2BPipeline.id"),
      },
      async ({ id }) => {
        const prisma = GetPrismaClient();
        try {
          const deleted = await prisma.b2BPipeline.delete({ where: { id } });
          return jsonText({
            deleted: true,
            id: deleted.id,
            name: deleted.name,
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2025"
          ) {
            return jsonText({ error: "Pipeline not found" });
          }
          throw err;
        }
      },
    );

    // ─────────────────────────────────────────────────────────────────────
    // COMPANY CRUD — master data shared across pipelines
    // ─────────────────────────────────────────────────────────────────────

    server.tool(
      "list_companies",
      "List B2B companies (account master data). Each company carries its name, industry, and a single PIC contact (name, job title, WhatsApp, email). A company can be linked to many pipeline leads. Filter by keyword (matches company name / PIC name / PIC email) or industry_id.",
      {
        keyword: z
          .string()
          .optional()
          .describe(
            "Substring search across company name, PIC name, PIC email (case-insensitive)",
          ),
        industry_id: z
          .number()
          .int()
          .positive()
          .optional()
          .describe("Filter to companies in this industry (industries.id)"),
        limit: z.number().int().min(1).max(200).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      },
      async (args) => {
        const prisma = GetPrismaClient();
        const where: Prisma.B2BCompanyWhereInput = {};
        if (args.industry_id) where.industry_id = args.industry_id;
        if (args.keyword) {
          where.OR = [
            { name: { contains: args.keyword, mode: "insensitive" } },
            { pic_name: { contains: args.keyword, mode: "insensitive" } },
            { pic_email: { contains: args.keyword, mode: "insensitive" } },
          ];
        }
        const [items, total] = await Promise.all([
          prisma.b2BCompany.findMany({
            where,
            include: companyInclude,
            orderBy: { name: "asc" },
            take: args.limit,
            skip: args.offset,
          }),
          prisma.b2BCompany.count({ where }),
        ]);
        return jsonText({
          total,
          count: items.length,
          offset: args.offset,
          limit: args.limit,
          items: items.map(serializeCompany),
        });
      },
    );

    server.tool(
      "get_company",
      "Fetch a single B2B company by its numeric ID, including its industry and PIC contact.",
      {
        id: z.number().int().describe("B2BCompany.id"),
      },
      async ({ id }) => {
        const prisma = GetPrismaClient();
        const c = await prisma.b2BCompany.findUnique({
          where: { id },
          include: companyInclude,
        });
        if (!c) return jsonText({ error: "Company not found" });
        return jsonText(serializeCompany(c));
      },
    );

    server.tool(
      "create_company",
      "Create a new B2B company (account). Industry is required (industries.id, SMALLINT). PIC fields are optional (one PIC per company). Use this before create_pipeline when the company doesn't exist yet, or pass new_company directly to create_pipeline.",
      {
        name: z.string().min(1).describe("Company name"),
        industry_id: z
          .number()
          .int()
          .positive()
          .describe("Industry classification (industries.id)"),
        pic_name: z.string().nullable().optional(),
        pic_job_title: z.string().nullable().optional(),
        pic_wa: z.string().nullable().optional(),
        pic_email: z.string().nullable().optional(),
      },
      async (args) => {
        const prisma = GetPrismaClient();
        const created = await prisma.b2BCompany.create({
          data: {
            name: args.name.trim(),
            industry_id: args.industry_id,
            pic_name: args.pic_name?.trim() || null,
            pic_job_title: args.pic_job_title?.trim() || null,
            pic_wa: args.pic_wa?.trim() || null,
            pic_email: args.pic_email?.trim() || null,
          },
          include: companyInclude,
        });
        return jsonText(serializeCompany(created));
      },
    );

    server.tool(
      "update_company",
      "Update fields on an existing B2B company. Only provided fields change. Use to fix the company name, reclassify its industry, or update the PIC contact. Changes apply to every pipeline lead linked to this company.",
      {
        id: z.number().int().describe("B2BCompany.id"),
        name: z.string().min(1).optional(),
        industry_id: z.number().int().positive().optional(),
        pic_name: z.string().nullable().optional(),
        pic_job_title: z.string().nullable().optional(),
        pic_wa: z.string().nullable().optional(),
        pic_email: z.string().nullable().optional(),
      },
      async (args) => {
        const prisma = GetPrismaClient();
        const { id, ...rest } = args;
        const data: Prisma.B2BCompanyUpdateInput = {};
        if (rest.name !== undefined) data.name = rest.name.trim();
        if (rest.industry_id !== undefined)
          data.industry = { connect: { id: rest.industry_id } };
        if (rest.pic_name !== undefined)
          data.pic_name = rest.pic_name?.trim() || null;
        if (rest.pic_job_title !== undefined)
          data.pic_job_title = rest.pic_job_title?.trim() || null;
        if (rest.pic_wa !== undefined)
          data.pic_wa = rest.pic_wa?.trim() || null;
        if (rest.pic_email !== undefined)
          data.pic_email = rest.pic_email?.trim() || null;
        try {
          const updated = await prisma.b2BCompany.update({
            where: { id },
            data,
            include: companyInclude,
          });
          return jsonText(serializeCompany(updated));
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2025"
          ) {
            return jsonText({ error: "Company not found" });
          }
          throw err;
        }
      },
    );

    server.tool(
      "delete_company",
      "Delete a B2B company. Fails if any pipeline lead still references it — reassign or delete those pipelines first.",
      {
        id: z.number().int().describe("B2BCompany.id"),
      },
      async ({ id }) => {
        const prisma = GetPrismaClient();
        try {
          const deleted = await prisma.b2BCompany.delete({ where: { id } });
          return jsonText({
            deleted: true,
            id: deleted.id,
            name: deleted.name,
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError) {
            if (err.code === "P2025")
              return jsonText({ error: "Company not found" });
            if (err.code === "P2003")
              return jsonText({
                error:
                  "Company still has linked pipeline leads. Reassign or delete them first.",
              });
          }
          throw err;
        }
      },
    );

    // ─────────────────────────────────────────────────────────────────────
    // ACTIONS CRUD
    // ─────────────────────────────────────────────────────────────────────

    server.tool(
      "list_actions",
      "List activity records (touchpoints) logged against B2B pipeline leads. Each action has a name (the task/activity title) plus an optional free-text summary, a workflow status, priority, due date, and assignee. Filter by pipeline_id to get one lead's history, or by date range.",
      {
        pipeline_id: z
          .number()
          .int()
          .optional()
          .describe("Filter to actions logged for this pipeline lead"),
        from: dateString
          .optional()
          .describe("Earliest created_at (inclusive)"),
        to: dateString.optional().describe("Latest created_at (inclusive)"),
        limit: z.number().int().min(1).max(200).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      },
      async (args) => {
        const prisma = GetPrismaClient();
        const where: Prisma.B2BActionWhereInput = {};
        if (args.pipeline_id !== undefined) where.pipeline_id = args.pipeline_id;
        if (args.from || args.to) {
          where.created_at = {};
          if (args.from) where.created_at.gte = dayjs(args.from).toDate();
          if (args.to) where.created_at.lte = dayjs(args.to).toDate();
        }
        const [items, total] = await Promise.all([
          prisma.b2BAction.findMany({
            where,
            orderBy: { created_at: "desc" },
            take: args.limit,
            skip: args.offset,
          }),
          prisma.b2BAction.count({ where }),
        ]);
        return jsonText({
          total,
          count: items.length,
          offset: args.offset,
          limit: args.limit,
          items: items.map(serializeAction),
        });
      },
    );

    server.tool(
      "get_action",
      "Fetch a single B2B action (activity record) by its numeric ID.",
      {
        id: z.number().int().describe("B2BAction.id"),
      },
      async ({ id }) => {
        const prisma = GetPrismaClient();
        const a = await prisma.b2BAction.findUnique({ where: { id } });
        if (!a) return jsonText({ error: "Action not found" });
        return jsonText(serializeAction(a));
      },
    );

    server.tool(
      "create_action",
      "Log a new activity (touchpoint) against an existing pipeline lead. Use this whenever a meeting, call, email, proposal, or follow-up happens with the lead. The pipeline lead must already exist.",
      {
        pipeline_id: z
          .number()
          .int()
          .describe("B2BPipeline.id this action belongs to"),
        name: z
          .string()
          .min(1)
          .describe("Short name/title of the activity or task"),
        summary: z
          .string()
          .min(1)
          .optional()
          .describe("Optional free-text summary of what happened"),
      },
      async (args) => {
        const prisma = GetPrismaClient();
        try {
          const created = await prisma.b2BAction.create({
            data: {
              pipeline_id: args.pipeline_id,
              name: args.name.trim(),
              summary: args.summary?.trim() ?? null,
            },
          });
          return jsonText(serializeAction(created));
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2003"
          ) {
            return jsonText({ error: "Pipeline (pipeline_id) not found" });
          }
          throw err;
        }
      },
    );

    server.tool(
      "update_action",
      "Edit the name or summary of an existing B2B action record.",
      {
        id: z.number().int().describe("B2BAction.id"),
        name: z.string().min(1).optional(),
        summary: z.string().min(1).optional(),
      },
      async ({ id, name, summary }) => {
        const prisma = GetPrismaClient();
        const data: Prisma.B2BActionUpdateInput = {};
        if (name !== undefined) data.name = name.trim();
        if (summary !== undefined) data.summary = summary.trim();
        try {
          const updated = await prisma.b2BAction.update({
            where: { id },
            data,
          });
          return jsonText(serializeAction(updated));
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2025"
          ) {
            return jsonText({ error: "Action not found" });
          }
          throw err;
        }
      },
    );

    server.tool(
      "delete_action",
      "Delete a single B2B action record. Does NOT affect the parent pipeline lead.",
      {
        id: z.number().int().describe("B2BAction.id"),
      },
      async ({ id }) => {
        const prisma = GetPrismaClient();
        try {
          const deleted = await prisma.b2BAction.delete({ where: { id } });
          return jsonText({
            deleted: true,
            id: deleted.id,
            pipeline_id: deleted.pipeline_id,
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2025"
          ) {
            return jsonText({ error: "Action not found" });
          }
          throw err;
        }
      },
    );

    // ─────────────────────────────────────────────────────────────────────
    // AGGREGATES — funnel + value summary
    // ─────────────────────────────────────────────────────────────────────

    server.tool(
      "aggregate_pipeline",
      "Compute pipeline health metrics: count, total project_value (IDR), avg probability, and weighted_value (sum of project_value × probability/100) — overall, plus optional breakdowns by stage, product, source, or owner. Filters compose with grouping. Use to see funnel distribution, forecast revenue, or compare performance per owner / channel.",
      {
        product: PRODUCT_ENUM.optional(),
        source: SOURCE_ENUM.optional(),
        stage: STAGE_ENUM.optional(),
        owner_id: z.uuid().optional(),
        from: dateString.optional(),
        to: dateString.optional(),
        group_by: z
          .enum(["none", "stage", "product", "source", "owner"])
          .optional()
          .default("none"),
      },
      async (args) => {
        const prisma = GetPrismaClient();
        const where = buildPipelineWhere(args);

        if (args.group_by === "none") {
          const rows = await prisma.b2BPipeline.findMany({
            where,
            select: { probability: true, project_value: true },
          });
          const count = rows.length;
          const totalValue = rows.reduce(
            (s, r) => s + Number(r.project_value),
            0,
          );
          const avgProbability =
            count > 0
              ? rows.reduce((s, r) => s + r.probability, 0) / count
              : 0;
          const weightedValue = rows.reduce(
            (s, r) => s + (Number(r.project_value) * r.probability) / 100,
            0,
          );
          return jsonText({
            filters: {
              product: args.product ?? null,
              source: args.source ?? null,
              stage: args.stage ?? null,
              owner_id: args.owner_id ?? null,
              from: args.from ?? null,
              to: args.to ?? null,
            },
            count,
            total_value: Math.round(totalValue),
            avg_probability: Number(avgProbability.toFixed(2)),
            weighted_value: Math.round(weightedValue),
          });
        }

        // Grouped aggregations
        const rows = await prisma.b2BPipeline.findMany({
          where,
          select: {
            product: true,
            source: true,
            stage: true,
            owner_id: true,
            owner: { select: { id: true, full_name: true, avatar: true } },
            probability: true,
            project_value: true,
          },
        });

        type Key = string;
        const buckets = new Map<
          Key,
          {
            label: string;
            owner?: { id: string; full_name: string; avatar: string | null };
            count: number;
            totalValue: number;
            sumProbability: number;
            weightedValue: number;
          }
        >();

        for (const r of rows) {
          let key: string;
          let label: string;
          let owner: { id: string; full_name: string; avatar: string | null } | undefined;
          if (args.group_by === "stage") {
            key = r.stage;
            label = r.stage;
          } else if (args.group_by === "product") {
            key = r.product;
            label = r.product;
          } else if (args.group_by === "source") {
            key = r.source;
            label = r.source;
          } else {
            key = r.owner_id;
            label = r.owner?.full_name ?? r.owner_id;
            owner = r.owner;
          }
          const value = Number(r.project_value);
          const existing = buckets.get(key);
          if (existing) {
            existing.count += 1;
            existing.totalValue += value;
            existing.sumProbability += r.probability;
            existing.weightedValue += (value * r.probability) / 100;
          } else {
            buckets.set(key, {
              label,
              owner,
              count: 1,
              totalValue: value,
              sumProbability: r.probability,
              weightedValue: (value * r.probability) / 100,
            });
          }
        }

        const groups = Array.from(buckets.entries())
          .map(([key, b]) => ({
            key,
            label: b.label,
            ...(b.owner ? { owner: b.owner } : {}),
            count: b.count,
            total_value: Math.round(b.totalValue),
            avg_probability:
              b.count > 0
                ? Number((b.sumProbability / b.count).toFixed(2))
                : 0,
            weighted_value: Math.round(b.weightedValue),
          }))
          .sort((a, b) => b.weighted_value - a.weighted_value);

        return jsonText({
          group_by: args.group_by,
          filters: {
            product: args.product ?? null,
            source: args.source ?? null,
            stage: args.stage ?? null,
            owner_id: args.owner_id ?? null,
            from: args.from ?? null,
            to: args.to ?? null,
          },
          groups,
        });
      },
    );
  },
  { public: true },
);

export const GET = handler;
export const POST = handler;
export const DELETE = handler;
