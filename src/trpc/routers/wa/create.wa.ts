import {
  STATUS_CREATED,
  STATUS_INTERNAL_SERVER_ERROR,
} from "@/lib/status_code";
import { administratorProcedure } from "@/trpc/init";
import { readFailedNotFound } from "@/trpc/utils/errors";
import {
  stringIsNanoid,
  stringIsTimestampTz,
  stringNotBlank,
} from "@/trpc/utils/validation";
import { WAAssetType, WATCategory, WATFormat, WATStatus } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const createWA = {
  asset: administratorProcedure
    .input(
      z.object({
        url: stringNotBlank(),
        type: z.enum(WAAssetType),
        description: stringNotBlank().nullable().optional(),
      })
    )
    .mutation(async (opts) => {
      const createdAsset = await opts.ctx.prisma.wAAsset.create({
        data: {
          url: opts.input.url,
          type: opts.input.type,
          description: opts.input.description,
        },
      });
      const theAsset = await opts.ctx.prisma.wAAsset.findFirst({
        where: { id: createdAsset.id },
      });
      if (!theAsset) {
        throw new TRPCError({
          code: STATUS_INTERNAL_SERVER_ERROR,
          message: "Failed to create a new asset.",
        });
      }

      return {
        code: STATUS_CREATED,
        message: "Success",
        asset: theAsset,
      };
    }),

  template: administratorProcedure
    .input(
      z.object({
        name: stringNotBlank(),
        lang_code: stringNotBlank().max(5),
        category: z.enum(WATCategory),
        format: z.enum(WATFormat),
        components: z.array(
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
        ),
        status: z.enum(WATStatus),
      })
    )
    .mutation(async (opts) => {
      const waTemplate = await opts.ctx.prisma.wATemplate.create({
        data: {
          name: opts.input.name,
          lang_code: opts.input.lang_code,
          category: opts.input.category,
          format: opts.input.format,
          components: opts.input.components,
          status: opts.input.status,
        },
      });
      const theTemplate = await opts.ctx.prisma.wATemplate.findFirst({
        where: { id: waTemplate.id },
      });
      if (!theTemplate) {
        throw new TRPCError({
          code: STATUS_INTERNAL_SERVER_ERROR,
          message: "Failed to create a new template.",
        });
      }

      return {
        code: STATUS_CREATED,
        message: "Success",
        template: theTemplate,
      };
    }),

  alert: administratorProcedure
    .input(
      z.object({
        conv_id: stringIsNanoid(),
        scheduled_at: stringIsTimestampTz(),
      })
    )
    .mutation(async (opts) => {
      const waConversation = await opts.ctx.prisma.wAConversation.findFirst({
        select: { id: true },
        where: { id: opts.input.conv_id },
      });
      if (!waConversation) {
        throw readFailedNotFound("conversation");
      }

      const createdAlert = await opts.ctx.prisma.wAAlert.create({
        data: {
          conv_id: opts.input.conv_id,
          scheduled_at: opts.input.scheduled_at,
        },
      });
      const theAlert = await opts.ctx.prisma.wAAlert.findFirst({
        where: { id: createdAlert.id },
      });
      if (!theAlert) {
        throw new TRPCError({
          code: STATUS_INTERNAL_SERVER_ERROR,
          message: "Failed to create a new alert.",
        });
      }

      return {
        code: STATUS_CREATED,
        message: "Success",
        alert: theAlert,
      };
    }),
};
