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
