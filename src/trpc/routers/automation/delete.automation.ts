import { STATUS_NO_CONTENT } from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { checkDeleteResult } from "@/trpc/utils/errors";
import { objectHasOnlyUUID } from "@/trpc/utils/validation";

export const deleteAutomation = {
  automation: administratorProcedure
    .input(objectHasOnlyUUID())
    .mutation(async (opts) => {
      const deletedAutomation = await opts.ctx.prisma.automation.deleteMany({
        where: {
          id: opts.input.id,
        },
      });
      await checkDeleteResult(
        deletedAutomation.count,
        "automations",
        "automation"
      );
      return {
        code: STATUS_NO_CONTENT,
        message: "Success",
      };
    }),
};
