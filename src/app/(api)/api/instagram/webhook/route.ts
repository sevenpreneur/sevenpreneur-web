import LogError from "@/lib/prisma-log-error";
import { NextRequest, NextResponse } from "next/server";
import { IGWebhookBody } from "./type.ig.webhook";
import { handleMessagingEvent } from "./util.ig.webhook";

// Trial allowlist for auto-commenting to prevent abuse while we iterate on the feature.
const AUTO_COMMENT_USERNAME_ALLOWLIST = new Set([
  "akmallfhn",
  "dimasora",
  "bramasta_space",
]);

export async function GET(req: NextRequest) {
  const VERIFY_TOKEN = process.env.META_IG_VERIFICATION_TOKEN;

  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge);
  }

  return new NextResponse("Forbidden", {
    status: 403,
  });
}

export async function POST(req: NextRequest) {
  const reqBody: IGWebhookBody = await req.json();

  // Only accept from Instagram webhook
  if (reqBody.object !== "instagram") {
    return new NextResponse(undefined, { status: 200 });
  }

  for (const entry of reqBody.entry) {
    // Comments (and other change-based events)
    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.field === "comments") {
          const comment = change.value;

          // Skip trigger for comments by own IG account
          if (
            comment.from?.id &&
            comment.from.id === process.env.META_IG_ACCOUNT_ID
          ) {
            continue;
          }

          // Skip trigger if commenter's username not in allowlist
          if (
            !comment.from?.username ||
            !AUTO_COMMENT_USERNAME_ALLOWLIST.has(comment.from.username)
          ) {
            console.log(
              `[instagram.webhook] skip auto-comment trigger — username=${comment.from?.username ?? "unknown"} not in allowlist`
            );
            continue;
          }

          triggerLangGraphAutoComment({
            ig_business_account_id: entry.id,
            comment: {
              id: comment.id,
              text: comment.text,
              from: comment.from
                ? {
                    id: comment.from.id,
                    username: comment.from.username ?? null,
                  }
                : null,
              media: {
                id: comment.media.id,
                media_product_type: comment.media.media_product_type ?? null,
              },
              parent_id: comment.parent_id ?? null,
              created_time: comment.created_time ?? null,
            },
          });
        }
      }
    }

    // Direct Messages (Instagram Messaging — Messenger-style payload)
    if (entry.messaging) {
      for (const event of entry.messaging) {
        const isSuccess = await handleMessagingEvent(entry.id, event);
        if (!isSuccess) {
          await LogError(
            "instagram.webhook",
            "Failed to handle messaging event."
          );
          return new NextResponse(undefined, { status: 500 });
        }
      }
    }
  }

  return new NextResponse(undefined, { status: 200 });
}

async function triggerLangGraphAutoComment(payload: {
  ig_business_account_id: string;
  comment: {
    id: string;
    text: string;
    from: { id: string; username: string | null } | null;
    media: { id: string; media_product_type: string | null };
    parent_id: string | null;
    created_time: number | null;
  };
}) {
  const agentUrl = process.env.AGENT_URL;
  const agentSecretKey = process.env.AGENT_SECRET_KEY;
  if (!agentUrl || !agentSecretKey) {
    await LogError(
      "instagram.webhook",
      "AGENT_URL or AGENT_SECRET_KEY not configured."
    );
    return;
  }
  try {
    await fetch(`${agentUrl}/api/v1/instagram/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${agentSecretKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    await LogError(
      "instagram.webhook",
      "Failed to trigger LangGraph auto-comment.",
      e
    );
  }
}
