import {
  instagramPostCommentRequest,
  instagramReplyToCommentRequest,
} from "@/lib/instagram";
import LogError from "@/lib/prisma-log-error";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const SendIGCommentSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("reply"),
    comment_id: z.string().min(1),
    message: z.string().min(1),
  }),
  z.strictObject({
    type: z.literal("post"),
    media_id: z.string().min(1),
    message: z.string().min(1),
  }),
]);

export type SendIGCommentBody = z.infer<typeof SendIGCommentSchema>;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expectedKey = process.env.SECRET_KEY_PUBLIC_API;
  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = SendIGCommentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const response =
      body.type === "reply"
        ? await instagramReplyToCommentRequest(body.comment_id, body.message)
        : await instagramPostCommentRequest(body.media_id, body.message);

    if (response.error || !response.id) {
      await LogError("instagram.send", "Instagram Graph API error", response);
      return NextResponse.json(
        {
          error: "Failed to send Instagram comment",
          details: response.error,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ data: { id: response.id } });
  } catch (e) {
    await LogError("instagram.send", e);
    return NextResponse.json(
      { error: "Failed to send Instagram comment" },
      { status: 502 }
    );
  }
}
