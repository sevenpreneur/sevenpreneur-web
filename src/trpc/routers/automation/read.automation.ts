import { STATUS_OK } from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { readFailedNotFound } from "@/trpc/utils/errors";
import { objectHasOnlyUUID } from "@/trpc/utils/validation";

export const readAutomation = {
  automation: administratorProcedure
    .input(objectHasOnlyUUID())
    .query(async (opts) => {
      const theAutomation = await opts.ctx.prisma.automation.findFirst({
        where: {
          id: opts.input.id,
        },
      });

      if (!theAutomation) {
        throw readFailedNotFound("automation");
      }

      return {
        code: STATUS_OK,
        message: "Success",
        automation: theAutomation,
      };
    }),
};
