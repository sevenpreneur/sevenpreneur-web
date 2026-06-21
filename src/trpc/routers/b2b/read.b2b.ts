import { STATUS_OK } from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { readFailedNotFound } from "@/trpc/utils/errors";
import { objectHasOnlyID } from "@/trpc/utils/validation";

export const readB2B = {
  company: administratorProcedure
    .input(objectHasOnlyID())
    .query(async (opts) => {
      const theCompany = await opts.ctx.prisma.b2BCompany.findFirst({
        include: {
          industry: { select: { id: true, industry_name: true } },
        },
        where: { id: opts.input.id },
      });
      if (!theCompany) {
        throw readFailedNotFound("company");
      }
      return {
        code: STATUS_OK,
        message: "Success",
        company: {
          id: theCompany.id,
          name: theCompany.name,
          industry_id: theCompany.industry.id,
          industry_name: theCompany.industry.industry_name,
          pic_name: theCompany.pic_name,
          pic_job_title: theCompany.pic_job_title,
          pic_wa: theCompany.pic_wa,
          pic_email: theCompany.pic_email,
          created_at: theCompany.created_at,
          updated_at: theCompany.updated_at,
        },
      };
    }),

  pipeline: administratorProcedure
    .input(objectHasOnlyID())
    .query(async (opts) => {
      const thePipeline = await opts.ctx.prisma.b2BPipeline.findFirst({
        include: {
          owner: { select: { id: true, full_name: true, avatar: true } },
          company: {
            include: {
              industry: { select: { id: true, industry_name: true } },
            },
          },
        },
        where: { id: opts.input.id },
      });
      if (!thePipeline) {
        throw readFailedNotFound("pipeline");
      }
      return {
        code: STATUS_OK,
        message: "Success",
        pipeline: {
          id: thePipeline.id,
          name: thePipeline.name,
          company_id: thePipeline.company.id,
          company_name: thePipeline.company.name,
          industry_id: thePipeline.company.industry.id,
          industry_name: thePipeline.company.industry.industry_name,
          pic_name: thePipeline.company.pic_name,
          pic_job_title: thePipeline.company.pic_job_title,
          pic_wa: thePipeline.company.pic_wa,
          pic_email: thePipeline.company.pic_email,
          product: thePipeline.product,
          source: thePipeline.source,
          stage: thePipeline.stage,
          probability: thePipeline.probability,
          probability_status: thePipeline.probability_status,
          project_value: thePipeline.project_value,
          project_start_month: thePipeline.project_start_month,
          project_end_month: thePipeline.project_end_month,
          owner_id: thePipeline.owner.id,
          owner_name: thePipeline.owner.full_name,
          owner_avatar: thePipeline.owner.avatar,
          created_at: thePipeline.created_at,
          updated_at: thePipeline.updated_at,
        },
      };
    }),

  action: administratorProcedure
    .input(objectHasOnlyID())
    .query(async (opts) => {
      const theAction = await opts.ctx.prisma.b2BAction.findFirst({
        where: { id: opts.input.id },
      });
      if (!theAction) {
        throw readFailedNotFound("action");
      }
      return {
        code: STATUS_OK,
        message: "Success",
        action: theAction,
      };
    }),
};
