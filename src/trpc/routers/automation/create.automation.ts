import {
  STATUS_CREATED,
  STATUS_INTERNAL_SERVER_ERROR,
} from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { stringNotBlank } from "@/trpc/utils/validation";
import { StatusEnum } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const createAutomation = {
  automation: administratorProcedure
    .input(
      z.object({
        key: stringNotBlank(),
        description: stringNotBlank(),
        status: z.enum(StatusEnum).optional(),
        tags: stringNotBlank().nullable().optional(),
      })
    )
    .mutation(async (opts) => {
      const createdAutomation = await opts.ctx.prisma.automation.create({
        data: {
          key: opts.input.key,
          description: opts.input.description,
          status: opts.input.status ?? StatusEnum.ACTIVE,
          tags: opts.input.tags,
        },
      });

      const theAutomation = await opts.ctx.prisma.automation.findFirst({
        where: { id: createdAutomation.id },
      });
      if (!theAutomation) {
        throw new TRPCError({
          code: STATUS_INTERNAL_SERVER_ERROR,
          message: "Failed to create a new automation.",
        });
      }

      return {
        code: STATUS_CREATED,
        message: "Success",
        automation: theAutomation,
      };
    }),
};
