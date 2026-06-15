import { Optional } from "@/lib/optional-type";
import { STATUS_OK } from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { calculatePage } from "@/trpc/utils/paging";
import { numberIsPosInt, stringNotBlank } from "@/trpc/utils/validation";
import { StatusEnum } from "@prisma/client";
import z from "zod";

export const listAutomation = {
  automations: administratorProcedure
    .input(
      z.object({
        page: numberIsPosInt().optional(),
        page_size: numberIsPosInt().optional(),
        keyword: stringNotBlank().optional(),
        status: z.enum(StatusEnum).optional(),
      })
    )
    .query(async (opts) => {
      const whereClause = {
        key: undefined as Optional<{ contains: string; mode: "insensitive" }>,
        status: opts.input.status,
      };

      if (opts.input.keyword !== undefined) {
        whereClause.key = {
          contains: opts.input.keyword,
          mode: "insensitive",
        };
      }

      const paging = calculatePage(
        opts.input,
        await opts.ctx.prisma.automation.aggregate({
          _count: true,
          where: whereClause,
        })
      );

      const automationList = await opts.ctx.prisma.automation.findMany({
        orderBy: [{ created_at: "desc" }],
        where: whereClause,
        skip: paging.prisma.skip,
        take: paging.prisma.take,
      });

      return {
        code: STATUS_OK,
        message: "Success",
        list: automationList,
        metapaging: {
          ...paging.metapaging,
          keyword: opts.input.keyword,
        },
      };
    }),
};
