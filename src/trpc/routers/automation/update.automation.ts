import { STATUS_OK } from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { checkUpdateResult } from "@/trpc/utils/errors";
import { stringNotBlank } from "@/trpc/utils/validation";
import { StatusEnum } from "@prisma/client";
import z from "zod";

export const updateAutomation = {
  automation: administratorProcedure
    .input(
      z.object({
        id: z.uuid(),
        key: stringNotBlank().optional(),
        description: stringNotBlank().optional(),
        status: z.enum(StatusEnum).optional(),
        tags: stringNotBlank().nullable().optional(),
      })
    )
    .mutation(async (opts) => {
      const updatedAutomation =
        await opts.ctx.prisma.automation.updateManyAndReturn({
          data: {
            key: opts.input.key,
            description: opts.input.description,
            status: opts.input.status,
            tags: opts.input.tags,
          },
          where: {
            id: opts.input.id,
          },
        });
      await checkUpdateResult(
        updatedAutomation.length,
        "automation",
        "automations"
      );
      return {
        code: STATUS_OK,
        message: "Success",
        automation: updatedAutomation[0],
      };
    }),
};
