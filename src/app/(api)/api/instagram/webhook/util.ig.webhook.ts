import GetPrismaClient from "@/lib/prisma";
import LogError from "@/lib/prisma-log-error";

// Instagram Webhook Types //

type IGWebhookOtherChangeField =
  | "live_comments"
  | "mentions"
  | "message_reactions"
  | "messaging_handover"
  | "messaging_optins"
  | "messaging_postbacks"
  | "messaging_referral"
  | "messaging_seen"
  | "standby"
  | "story_insights";

export type IGWebhookCommentValue = {
  id: string;
  from?: {
    id: string;
    username?: string;
  };
  media: {
    id: string;
    media_product_type?: string;
    ad_id?: string;
    ad_title?: string;
    original_media_id?: string;
  };
  parent_id?: string;
  text: string;
  created_time?: number;
};

export type IGWebhookMessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    is_deleted?: boolean;
    is_unsupported?: boolean;
    reply_to?: {
      mid?: string;
      story?: {
        url: string;
        id: string;
      };
    };
    attachments?: {
      type:
        | "audio"
        | "file"
        | "image"
        | "ig_reel"
        | "share"
        | "story_mention"
        | "video";
      payload: {
        url?: string;
        sticker_id?: number;
        title?: string;
      };
    }[];
    quick_reply?: {
      payload: string;
    };
    referral?: {
      ref: string;
      source: string;
      type: string;
    };
  };
  read?: {
    mid: string;
  };
  reaction?: {
    mid: string;
    action: "react" | "unreact";
    emoji?: string;
    reaction?: string;
  };
  postback?: {
    mid: string;
    title: string;
    payload: string;
  };
};

export type IGWebhookBody = {
  object: string;
  entry: {
    id: string;
    time: number;
    changes?: (
      | {
          field: "comments";
          value: IGWebhookCommentValue;
        }
      | {
          field: IGWebhookOtherChangeField;
          value: unknown;
        }
    )[];
    messaging?: IGWebhookMessagingEvent[];
  }[];
};

// Handlers //

export async function handleCommentEvent(
  _prisma: ReturnType<typeof GetPrismaClient>,
  ig_business_account_id: string,
  comment: IGWebhookCommentValue
): Promise<boolean> {
  try {
    // Ignore comments made by our own IG business account to avoid loops
    if (
      comment.from?.id &&
      comment.from.id === process.env.META_IG_ACCOUNT_ID
    ) {
      return true;
    }

    console.log(
      `[instagram.webhook] comment received account=${ig_business_account_id} comment_id=${comment.id} from=${comment.from?.username ?? comment.from?.id ?? "unknown"} media=${comment.media.id} parent=${comment.parent_id ?? "none"} text=${JSON.stringify(comment.text)}`
    );

    // TODO: persist to DB once IG models exist in Prisma schema.

    return true;
  } catch (e) {
    await LogError("instagram.webhook", "Failed to handle comment event.", e);
    return false;
  }
}

export async function handleMessagingEvent(
  _prisma: ReturnType<typeof GetPrismaClient>,
  ig_business_account_id: string,
  event: IGWebhookMessagingEvent
): Promise<boolean> {
  try {
    // Skip echoes (messages we sent ourselves) to avoid loops
    if (event.message?.is_echo) {
      return true;
    }

    // Skip deleted/unsupported messages
    if (event.message?.is_deleted || event.message?.is_unsupported) {
      return true;
    }

    if (event.message) {
      console.log(
        `[instagram.webhook] message received account=${ig_business_account_id} mid=${event.message.mid} from=${event.sender.id} to=${event.recipient.id} text=${JSON.stringify(event.message.text ?? null)} attachments=${event.message.attachments?.length ?? 0} reply_to=${event.message.reply_to?.mid ?? "none"}`
      );
    } else if (event.read) {
      console.log(
        `[instagram.webhook] read receipt account=${ig_business_account_id} mid=${event.read.mid} from=${event.sender.id}`
      );
    } else if (event.reaction) {
      console.log(
        `[instagram.webhook] reaction account=${ig_business_account_id} mid=${event.reaction.mid} action=${event.reaction.action} emoji=${event.reaction.emoji ?? event.reaction.reaction ?? "none"}`
      );
    } else if (event.postback) {
      console.log(
        `[instagram.webhook] postback account=${ig_business_account_id} mid=${event.postback.mid} payload=${event.postback.payload}`
      );
    } else {
      console.log(
        `[instagram.webhook] unhandled messaging event account=${ig_business_account_id} payload=${JSON.stringify(event)}`
      );
    }

    // TODO: persist to DB once IG models exist in Prisma schema.

    return true;
  } catch (e) {
    await LogError("instagram.webhook", "Failed to handle messaging event.", e);
    return false;
  }
}
