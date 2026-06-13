import { STATUS_OK } from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { checkUpdateResult } from "@/trpc/utils/errors";
import {
  numberIsID,
  numberIsNonNegInt,
  stringIsNanoid,
  stringIsTimestampTz,
  stringIsUUID,
  stringNotBlank,
} from "@/trpc/utils/validation";
import {
  WAAssetType,
  WALeadStatus,
  WAMode,
  WATCategory,
  WATFormat,
  WATQuality,
  WATStatus,
} from "@prisma/client";
import z from "zod";

export const updateWA = {
  conversation: administratorProcedure
    .input(
      z.object({
        id: stringIsNanoid(),
        user_id: stringIsUUID().nullable().optional(),
        handler_id: stringIsUUID().nullable().optional(),
        lead_status: z.enum(WALeadStatus).optional(),
        winning_rate: numberIsNonNegInt().optional(),
        mode: z.enum(WAMode).optional(),
        note: stringNotBlank().nullable().optional(),
      })
    )
    .mutation(async (opts) => {
      const updatedConversation =
        await opts.ctx.prisma.wAConversation.updateManyAndReturn({
          data: {
            user_id: opts.input.user_id,
            handler_id: opts.input.handler_id,
            lead_status: opts.input.lead_status,
            winning_rate: opts.input.winning_rate,
            mode: opts.input.mode,
            note: opts.input.note,
          },
          where: {
            id: opts.input.id,
          },
        });
      await checkUpdateResult(
        updatedConversation.length,
        "WA conversation",
        "WA conversations",
        "wa.conversation"
      );
      return {
        code: STATUS_OK,
        message: "Success",
        conversation: updatedConversation[0],
      };
    }),

  conversation_as_read: administratorProcedure
    .input(
      z.object({
        id: stringIsNanoid(),
      })
    )
    .mutation(async (opts) => {
      const latestChat = await opts.ctx.prisma.wAChat.findFirst({
        select: { id: true },
        where: { conv_id: opts.input.id },
        orderBy: [{ created_at: "desc" }],
      });

      const updatedConversation =
        await opts.ctx.prisma.wAConversation.updateManyAndReturn({
          data: {
            last_read_id: latestChat?.id || null,
          },
          where: {
            id: opts.input.id,
          },
        });
      await checkUpdateResult(
        updatedConversation.length,
        "WA conversation",
        "WA conversations",
        "wa.conversation"
      );

      return {
        code: STATUS_OK,
        message: "Success",
        conversation: updatedConversation[0],
      };
    }),

  asset: administratorProcedure
    .input(
      z.object({
        id: numberIsID(),
        url: stringNotBlank(),
        type: z.enum(WAAssetType),
        description: stringNotBlank().nullable().optional(),
      })
    )
    .mutation(async (opts) => {
      const updatedAssets = await opts.ctx.prisma.wAAsset.updateManyAndReturn({
        data: {
          url: opts.input.url,
          type: opts.input.type,
          description: opts.input.description,
        },
        where: { id: opts.input.id },
      });
      await checkUpdateResult(
        updatedAssets.length,
        "WA asset",
        "WA assets",
        "wa.asset"
      );

      return {
        code: STATUS_OK,
        message: "Success",
        asset: updatedAssets[0],
      };
    }),

  template: administratorProcedure
    .input(
      z.object({
        id: numberIsID(),
        template_id: stringNotBlank().optional(),
        lang_code: stringNotBlank().optional(),
        category: z.enum(WATCategory).optional(),
        format: z.enum(WATFormat).optional(),
        components: z
          .array(
            z.union([
              z.object({
                type: z.literal("HEADER"),
                format: z.literal("TEXT"),
                text: stringNotBlank(),
              }),
              z.object({
                type: z.union([z.literal("BODY"), z.literal("FOOTER")]),
                text: stringNotBlank(),
              }),
            ])
          )
          .optional(),
        status: z.enum(WATStatus).optional(),
        quality_rating: z.enum(WATQuality).nullable().optional(),
        rejected_reason: stringNotBlank().nullable().optional(),
      })
    )
    .mutation(async (opts) => {
      const updatedTemplate =
        await opts.ctx.prisma.wATemplate.updateManyAndReturn({
          data: {
            template_id: opts.input.template_id,
            lang_code: opts.input.lang_code,
            category: opts.input.category,
            format: opts.input.format,
            components: opts.input.components,
            status: opts.input.status,
            quality_rating: opts.input.quality_rating,
            rejected_reason: opts.input.rejected_reason,
          },
          where: {
            id: opts.input.id,
          },
        });
      await checkUpdateResult(
        updatedTemplate.length,
        "WA template",
        "WA templates",
        "wa.template"
      );

      return {
        code: STATUS_OK,
        message: "Success",
        template: updatedTemplate[0],
      };
    }),

  alert: administratorProcedure
    .input(
      z.object({
        id: numberIsID(),
        scheduled_at: stringIsTimestampTz(),
      })
    )
    .mutation(async (opts) => {
      const updatedAlerts = await opts.ctx.prisma.wAAlert.updateManyAndReturn({
        data: { scheduled_at: opts.input.scheduled_at },
        where: { id: opts.input.id },
      });
      await checkUpdateResult(
        updatedAlerts.length,
        "WA alert",
        "WA alerts",
        "wa.alert"
      );

      return {
        code: STATUS_OK,
        message: "Success",
        alert: updatedAlerts[0],
      };
    }),
};
