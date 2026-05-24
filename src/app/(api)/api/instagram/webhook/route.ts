import GetPrismaClient from "@/lib/prisma";
import LogError from "@/lib/prisma-log-error";
import { NextRequest, NextResponse } from "next/server";
import {
  handleCommentEvent,
  handleMessagingEvent,
  IGWebhookBody,
} from "./util.ig.webhook";

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

  const prisma = GetPrismaClient();

  for (const entry of reqBody.entry) {
    // Comments (and other change-based events)
    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.field === "comments") {
          const isSuccess = await handleCommentEvent(
            prisma,
            entry.id,
            change.value
          );
          if (!isSuccess) {
            await LogError(
              "instagram.webhook",
              "Failed to handle comment event."
            );
            return new NextResponse(undefined, { status: 500 });
          }
        }
        // Other change fields (mentions, story_insights, etc.) are ignored for now
      }
    }

    // Direct Messages (Instagram Messaging — Messenger-style payload)
    if (entry.messaging) {
      for (const event of entry.messaging) {
        const isSuccess = await handleMessagingEvent(prisma, entry.id, event);
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
