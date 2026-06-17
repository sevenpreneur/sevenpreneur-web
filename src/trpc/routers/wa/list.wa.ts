import { Optional } from "@/lib/optional-type";
import { STATUS_OK } from "@/lib/status_code";
import { whatsappListTemplates } from "@/lib/whatsapp";
import { administratorProcedure } from "@/trpc/init";
import { readFailedNotFound } from "@/trpc/utils/errors";
import { calculatePage } from "@/trpc/utils/paging";
import {
  numberIsPosInt,
  stringIsNanoid,
  stringIsUUID,
  stringNotBlank,
} from "@/trpc/utils/validation";
import {
  Prisma,
  WAAssetType,
  WACDirection,
  WACStatus,
  WACType,
  WALeadStatus,
  WAMode,
} from "@prisma/client";
import z from "zod";
import { convertToWhatsAppChatWithAttachment } from "./type.wa";

export const listWA = {
  conversations: administratorProcedure
    .input(
      z.object({
        full_name: stringNotBlank().optional(),
        lead_status: z.enum(WALeadStatus).optional(),
        mode: z.enum(WAMode).optional(),
        handler_id: stringIsUUID().nullable().optional(),
        page: numberIsPosInt().optional(),
        page_size: numberIsPosInt().optional(),
        // Cursor (= page number) used by the infinite-scroll list. Takes
        // precedence over `page` when present.
        cursor: numberIsPosInt().optional(),
      })
    )
    .query(async (opts) => {
      const whereClause = {
        full_name: undefined as Optional<{
          contains: string;
          mode: "insensitive";
        }>,
        lead_status: undefined as Optional<WALeadStatus>,
        mode: undefined as Optional<WAMode>,
        handler_id: undefined as Optional<string | null>,
      };
      let whereClauseSql = Prisma.sql`WHERE 1 = 1`;

      if (opts.input.full_name !== undefined) {
        whereClause.full_name = {
          contains: opts.input.full_name,
          mode: "insensitive",
        };
        const ilikeFullName = `%${opts.input.full_name}%`;
        whereClauseSql = Prisma.sql`
${whereClauseSql}
AND (
  wa_conversations.full_name ILIKE ${ilikeFullName} OR
  users.full_name ILIKE ${ilikeFullName}
)`;
      }

      if (opts.input.lead_status !== undefined) {
        whereClause.lead_status = opts.input.lead_status;
        whereClauseSql = Prisma.sql`
${whereClauseSql}
AND wa_conversations.lead_status = ${opts.input.lead_status.toLowerCase()}::wa_lead_status`;
      }

      if (opts.input.mode !== undefined) {
        whereClause.mode = opts.input.mode;
        whereClauseSql = Prisma.sql`
${whereClauseSql}
AND wa_conversations.mode = ${opts.input.mode.toLowerCase()}::wa_mode`;
      }

      if (opts.input.handler_id !== undefined) {
        whereClause.handler_id = opts.input.handler_id;
        if (opts.input.handler_id === null) {
          whereClauseSql = Prisma.sql`
${whereClauseSql}
AND wa_conversations.handler_id IS NULL`;
        } else {
          whereClauseSql = Prisma.sql`
${whereClauseSql}
AND wa_conversations.handler_id = ${opts.input.handler_id}::uuid`;
        }
      }

      const paging = calculatePage(
        { page: opts.input.cursor ?? opts.input.page, page_size: opts.input.page_size },
        await opts.ctx.prisma.wAConversation.aggregate({
          _count: true,
          where: whereClause,
        })
      );

      // Only paginate when a page_size is given; callers without it still
      // receive the full list (broadcast picker, leads overview, ...).
      const limitOffsetSql =
        paging.prisma.take !== undefined
          ? Prisma.sql`LIMIT ${paging.prisma.take} OFFSET ${paging.prisma.skip ?? 0}`
          : Prisma.empty;

      type WAConvItem = {
        id: string;
        full_name: string;
        phone_number: string;
        lead_status: WALeadStatus;
        mode: WAMode;
        handler_id: string | null;
        last_message: string;
        last_message_at: Date;
        last_message_status: WACStatus | null;
        last_message_type: WACType;
        last_message_direction: WACDirection;
        last_inbound_message: string | null;
        last_inbound_message_at: Date | null;
        unread_count: number;
        user_full_name?: string;
        user_avatar?: string;
        handler_full_name?: string;
        handler_avatar?: string;
      };
      // Two-stage query. Stage 1 (`paged`) resolves the latest message per
      // conversation, sorts, and applies LIMIT/OFFSET — so only the page's
      // rows survive. Stage 2 then computes the expensive per-conversation
      // aggregates (last inbound message, unread count) via LATERAL joins,
      // which therefore run once per returned row instead of once per chat.
      const conversationList = await opts.ctx.prisma.$queryRaw<WAConvItem[]>`
WITH paged AS (
  SELECT *
  FROM (
    SELECT DISTINCT ON (wa_conversations.id)
      wa_conversations.id, wa_conversations.full_name, wa_conversations.phone_number,
      wa_conversations.lead_status, wa_conversations.mode, wa_conversations.handler_id,
      wa_conversations.user_id, wa_conversations.last_read_id,
      wa_chats.message AS last_message, wa_chats.created_at AS last_message_at,
      wa_chats.status AS last_message_status, wa_chats.type AS last_message_type,
      wa_chats.direction AS last_message_direction
    FROM wa_conversations
      LEFT JOIN wa_chats ON wa_conversations.id = wa_chats.conv_id
      LEFT JOIN users ON wa_conversations.user_id = users.id
    ${whereClauseSql}
    ORDER BY wa_conversations.id, wa_chats.created_at DESC
  ) AS distinct_convs
  ORDER BY last_message_at DESC
  ${limitOffsetSql}
)
SELECT
  paged.id, paged.full_name, paged.phone_number,
  paged.lead_status, paged.mode, paged.handler_id,
  paged.last_message, paged.last_message_at,
  paged.last_message_status, paged.last_message_type, paged.last_message_direction,
  inbound.message AS last_inbound_message,
  inbound.created_at AS last_inbound_message_at,
  COALESCE(unread.unread_count, 0) AS unread_count,
  users.full_name AS user_full_name, users.avatar AS user_avatar,
  handlers.full_name AS handler_full_name, handlers.avatar AS handler_avatar
FROM paged
  LEFT JOIN users ON paged.user_id = users.id
  LEFT JOIN users AS handlers ON paged.handler_id = handlers.id
  LEFT JOIN LATERAL (
    SELECT wci.message, wci.created_at
    FROM wa_chats wci
    WHERE wci.conv_id = paged.id AND wci.direction = 'inbound'
    ORDER BY wci.created_at DESC
    LIMIT 1
  ) AS inbound ON TRUE
  LEFT JOIN LATERAL (
    SELECT COUNT(wc.id) AS unread_count
    FROM wa_chats wc
    WHERE wc.conv_id = paged.id AND wc.direction = 'inbound'
      AND wc.created_at > COALESCE(
        (SELECT wc2.created_at FROM wa_chats wc2 WHERE wc2.id = paged.last_read_id),
        '2000-01-01 00:00:00Z'::TIMESTAMPTZ
      )
  ) AS unread ON TRUE
ORDER BY paged.last_message_at DESC`;

      const WINDOW_MS = 24 * 60 * 60 * 1000;
      const now = Date.now();

      const returnedList = conversationList.map((entry) => {
        entry.lead_status = entry.lead_status.toUpperCase() as WALeadStatus;
        entry.mode = entry.mode.toUpperCase() as WAMode;
        entry.last_message_type =
          entry.last_message_type.toUpperCase() as WACType;
        entry.last_message_direction =
          entry.last_message_direction.toUpperCase() as WACDirection;
        if (entry.last_message_status) {
          entry.last_message_status =
            entry.last_message_status.toUpperCase() as WACStatus;
        }
        entry.unread_count = Number(entry.unread_count);
        const window_expired =
          !entry.last_inbound_message_at ||
          now - new Date(entry.last_inbound_message_at).getTime() >= WINDOW_MS;
        return { ...entry, window_expired };
      });

      const nextPage =
        paging.metapaging.current_page !== undefined &&
        paging.metapaging.total_page !== undefined &&
        paging.metapaging.current_page < paging.metapaging.total_page
          ? paging.metapaging.current_page + 1
          : null;

      const returnedMetapaging = {
        ...paging.metapaging,
        next_page: nextPage,
        full_name: opts.input.full_name,
        lead_status: opts.input.lead_status,
        mode: opts.input.mode,
        handler_id: opts.input.handler_id,
      };

      return {
        code: STATUS_OK,
        message: "Success",
        list: returnedList,
        metapaging: returnedMetapaging,
      };
    }),

  chats: administratorProcedure
    .input(
      z.object({
        conv_id: stringIsNanoid(),
        size: numberIsPosInt().optional(),
        before: stringIsNanoid().optional(),
      })
    )
    .query(async (opts) => {
      const waConversation = await opts.ctx.prisma.wAConversation.findFirst({
        select: { id: true },
        where: { id: opts.input.conv_id },
      });
      if (!waConversation) {
        throw readFailedNotFound("conversation");
      }

      let lastTime: Optional<Date> = undefined;
      if (opts.input.before) {
        const lastChat = await opts.ctx.prisma.wAChat.findFirst({
          select: { created_at: true },
          where: { id: opts.input.before },
        });
        if (lastChat) {
          lastTime = lastChat.created_at;
        }
      }

      const waChatsList = await opts.ctx.prisma.wAChat.findMany({
        where: {
          conv_id: opts.input.conv_id,
          created_at: {
            lt: lastTime,
          },
        },
        include: {
          reply_to: {
            select: {
              id: true,
              type: true,
              direction: true,
              message: true,
            },
          },
        },
        orderBy: [{ created_at: "desc" }],
        take: opts.input.size,
      });

      const returnedList = convertToWhatsAppChatWithAttachment(waChatsList);

      return {
        code: STATUS_OK,
        message: "Success",
        list: returnedList,
      };
    }),

  assets: administratorProcedure
    .input(
      z.object({
        type: z.enum(WAAssetType).optional(),
      })
    )
    .query(async (opts) => {
      const waAssetsList = await opts.ctx.prisma.wAAsset.findMany({
        where: {
          type: opts.input.type,
        },
        orderBy: [{ url: "asc" }],
      });

      const returnedList = waAssetsList.map((entry) => {
        const fileUrl = new URL(entry.url);
        const segments = fileUrl.pathname.split("/").filter(Boolean);
        const fileName = segments.length ? segments[segments.length - 1] : "";
        return {
          ...entry,
          file_name: fileName,
        };
      });

      return {
        code: STATUS_OK,
        message: "Success",
        list: returnedList,
      };
    }),

  templates: administratorProcedure.input(z.object({})).query(async () => {
    const templates = await whatsappListTemplates();
    const list = templates.map((template) => ({
      id: template.id,
      template_id: template.name,
      lang_code: template.language,
      category: template.category,
      status: template.status,
      quality_rating: template.quality_score?.score ?? null,
      components: template.components,
    }));

    return {
      code: STATUS_OK,
      message: "Success",
      list,
    };
  }),

  alerts: administratorProcedure
    .input(
      z.object({
        conv_id: stringIsNanoid(),
      })
    )
    .query(async (opts) => {
      const waAlertList = await opts.ctx.prisma.wAAlert.findMany({
        select: {
          id: true,
          scheduled_at: true,
          status: true,
        },
        where: {
          conv_id: opts.input.conv_id,
        },
        orderBy: { scheduled_at: "asc" },
      });

      const returnedList = waAlertList.map((entry) => {
        return {
          id: entry.id,
          scheduled_at: entry.scheduled_at,
          status: entry.status,
        };
      });

      return {
        code: STATUS_OK,
        message: "Success",
        alerts: returnedList,
      };
    }),
};
