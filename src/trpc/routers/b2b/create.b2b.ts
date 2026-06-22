import { STATUS_BAD_REQUEST, STATUS_CREATED } from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import {
  numberIsID,
  numberIsPosInt,
  stringIsUUID,
  stringNotBlank,
} from "@/trpc/utils/validation";
import {
  B2BActionPriorityEnum,
  B2BActionStatusEnum,
  B2BProbabilityStatusEnum,
  B2BProductEnum,
  B2BSourceEnum,
  B2BStageEnum,
  Prisma,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";

// "YYYY-MM-DD" string from frontend. Day expected to be 01 by convention.
const monthDate = z.iso.date();

// Shape for creating a company inline while creating a pipeline.
const newCompanyInput = z.object({
  name: stringNotBlank(),
  industry_id: numberIsPosInt(),
  pic_name: stringNotBlank().nullable().optional(),
  pic_job_title: stringNotBlank().nullable().optional(),
  pic_wa: stringNotBlank().nullable().optional(),
  pic_email: stringNotBlank().nullable().optional(),
});

export const createB2B = {
  company: administratorProcedure
    .input(newCompanyInput)
    .mutation(async (opts) => {
      const created = await opts.ctx.prisma.b2BCompany.create({
        data: {
          name: opts.input.name,
          industry_id: opts.input.industry_id,
          pic_name: opts.input.pic_name ?? null,
          pic_job_title: opts.input.pic_job_title ?? null,
          pic_wa: opts.input.pic_wa ?? null,
          pic_email: opts.input.pic_email ?? null,
        },
      });
      return {
        code: STATUS_CREATED,
        message: "Company created",
        id: created.id,
      };
    }),

  pipeline: administratorProcedure
    .input(
      z
        .object({
          name: stringNotBlank(),
          // Provide an existing company_id, OR a new_company to create inline.
          company_id: numberIsID().optional(),
          new_company: newCompanyInput.optional(),
          product: z.enum(B2BProductEnum),
          source: z.enum(B2BSourceEnum).nullable().optional(),
          stage: z.enum(B2BStageEnum).optional(),
          probability: z.number().int().min(0).max(100).optional(),
          probability_status: z.enum(B2BProbabilityStatusEnum).optional(),
          project_value: z.number().nonnegative().optional(),
          project_start_month: monthDate.nullable().optional(),
          project_end_month: monthDate.nullable().optional(),
          owner_id: stringIsUUID(),
        })
        .refine((v) => !!v.company_id !== !!v.new_company, {
          message: "Provide exactly one of company_id or new_company.",
        })
    )
    .mutation(async (opts) => {
      const { project_start_month, project_end_month, new_company, company_id } =
        opts.input;
      if (
        project_start_month &&
        project_end_month &&
        new Date(project_end_month) < new Date(project_start_month)
      ) {
        throw new TRPCError({
          code: STATUS_BAD_REQUEST,
          message: "project_end_month must be on or after project_start_month.",
        });
      }

      const company: Prisma.B2BCompanyCreateNestedOneWithoutPipelinesInput =
        new_company
          ? {
              create: {
                name: new_company.name,
                industry_id: new_company.industry_id,
                pic_name: new_company.pic_name ?? null,
                pic_job_title: new_company.pic_job_title ?? null,
                pic_wa: new_company.pic_wa ?? null,
                pic_email: new_company.pic_email ?? null,
              },
            }
          : { connect: { id: company_id } };

      const created = await opts.ctx.prisma.b2BPipeline.create({
        data: {
          name: opts.input.name,
          company,
          product: opts.input.product,
          source: opts.input.source ?? null,
          stage: opts.input.stage,
          probability: opts.input.probability,
          probability_status: opts.input.probability_status,
          project_value: opts.input.project_value,
          project_start_month: project_start_month
            ? new Date(project_start_month)
            : null,
          project_end_month: project_end_month
            ? new Date(project_end_month)
            : null,
          owner: { connect: { id: opts.input.owner_id } },
        },
      });
      return {
        code: STATUS_CREATED,
        message: "Pipeline created",
        id: created.id,
      };
    }),

  action: administratorProcedure
    .input(
      z.object({
        pipeline_id: numberIsID(),
        name: stringNotBlank(),
        summary: stringNotBlank().nullable().optional(),
        status: z.enum(B2BActionStatusEnum).optional(),
        priority: z.enum(B2BActionPriorityEnum).optional(),
        due_date: monthDate.nullable().optional(),
        assignee_id: stringIsUUID().nullable().optional(),
      })
    )
    .mutation(async (opts) => {
      const created = await opts.ctx.prisma.b2BAction.create({
        data: {
          pipeline_id: opts.input.pipeline_id,
          name: opts.input.name,
          summary: opts.input.summary ?? null,
          status: opts.input.status,
          priority: opts.input.priority,
          due_date: opts.input.due_date
            ? new Date(opts.input.due_date)
            : null,
          assignee_id: opts.input.assignee_id ?? null,
        },
      });
      return {
        code: STATUS_CREATED,
        message: "Action created",
        id: created.id,
      };
    }),
};
