import { instagramGetMediaContextRequest } from "@/lib/instagram";
import {
  LANGGRAPH_FAILURE_CALLBACK_URL,
  LANGGRAPH_TRIGGER_RETRIES,
  TRIGGER_LANGGRAPH_IG_URL,
} from "@/lib/langgraph-agent";
import LogError from "@/lib/prisma-log-error";
import GetQStashClient from "@/lib/qstash";
import { IGWebhookMessagingEvent } from "./type.ig.webhook";

export type IGAutoCommentPayload = {
  ig_business_account_id: string;
  comment: {
    id: string;
    text: string | null;
    from: { id: string; username: string | null } | null;
    media: {
      id: string;
      caption: string | null;
      media_product_type: string | null;
      ad_id: string | null;
      ad_title: string | null;
      original_media_id: string | null;
    };
    parent_id: string | null;
    created_time: number | null;
  };
};

export async function handleMessagingEvent(
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

    return true;
  } catch (e) {
    await LogError("instagram.webhook", "Failed to handle messaging event.", e);
    return false;
  }
}

export async function fetchInstagramMediaCaption(
  mediaId: string
): Promise<string | null> {
  const accessToken = process.env.META_IG_ACCESS_TOKEN;
  if (!accessToken) {
    await LogError("instagram.webhook", "META_IG_ACCESS_TOKEN not configured.");
    return null;
  }

  try {
    const data = await instagramGetMediaContextRequest(mediaId);

    if (data.error) {
      await LogError(
        "instagram.webhook",
        "Failed to fetch Instagram media caption.",
        data
      );
      return null;
    }

    return data.caption ?? null;
  } catch (e) {
    await LogError(
      "instagram.webhook",
      "Failed to fetch Instagram media caption.",
      e
    );
    return null;
  }
}

// Posts a comment event to the LangGraph agent. THROWS on misconfiguration or a
// non-2xx/failed request so the QStash handler can return non-2xx and retry.
export async function triggerLangGraphAutoComment(
  payload: IGAutoCommentPayload
) {
  const agentUrl = process.env.AGENT_URL;
  const agentSecretKey = process.env.AGENT_SECRET_KEY;
  if (!agentUrl || !agentSecretKey) {
    throw new Error("AGENT_URL or AGENT_SECRET_KEY not configured.");
  }

  const response = await fetch(`${agentUrl}/api/v1/webhook/instagram/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${agentSecretKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const responseBody = await response.text().catch(() => "");
    throw new Error(
      `LangGraph agent returned ${response.status} ${response.statusText}: ${responseBody}`
    );
  }
}

// Enqueues the auto-comment trigger through QStash so the /health-gated handler
// retries transient Railway outages instead of dropping the event.
export async function enqueueTriggerAutoComment(payload: IGAutoCommentPayload) {
  try {
    await GetQStashClient().publishJSON({
      url: TRIGGER_LANGGRAPH_IG_URL,
      body: payload,
      retries: LANGGRAPH_TRIGGER_RETRIES,
      failureCallback: LANGGRAPH_FAILURE_CALLBACK_URL,
    });
  } catch (e) {
    await LogError(
      "instagram.webhook",
      "Failed to enqueue auto-comment trigger.",
      e
    );
  }
}
