import "server-only";

import crypto from "crypto";
import { NextResponse } from "next/server";

const BUNNY_STREAM_EMBED_BASE_URL = "https://iframe.mediadelivery.net";
const TOKEN_TTL_SECONDS = 60 * 60 * 4;
const BUNNY_STREAM_VIDEO_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface BunnyStreamEmbedUrlResult {
  embedUrl: string;
  expiresAt: number | null;
  refreshAfterSeconds: number | null;
}

function createBunnyStreamEmbedUrl(videoId: string): BunnyStreamEmbedUrlResult {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID?.trim();
  if (!libraryId) {
    throw new Error("BUNNY_STREAM_LIBRARY_ID is not configured");
  }

  const embedUrl = new URL(
    `/embed/${encodeURIComponent(libraryId)}/${encodeURIComponent(videoId)}`,
    BUNNY_STREAM_EMBED_BASE_URL
  );

  embedUrl.searchParams.set("autoplay", "false");
  embedUrl.searchParams.set("loop", "false");
  embedUrl.searchParams.set("muted", "false");
  embedUrl.searchParams.set("preload", "true");
  embedUrl.searchParams.set("playsinline", "true");

  const tokenSecurityKey = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY?.trim();
  if (!tokenSecurityKey) {
    return {
      embedUrl: embedUrl.toString(),
      expiresAt: null,
      refreshAfterSeconds: null,
    };
  }

  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = crypto
    .createHash("sha256")
    .update(`${tokenSecurityKey}${videoId}${expiresAt}`)
    .digest("hex");

  embedUrl.searchParams.set("token", token);
  embedUrl.searchParams.set("expires", expiresAt.toString());

  return {
    embedUrl: embedUrl.toString(),
    expiresAt,
    refreshAfterSeconds: Math.max(60, TOKEN_TTL_SECONDS - 300),
  };
}

export function createBunnyStreamEmbedUrlResponse(videoId: string) {
  if (!videoId || !BUNNY_STREAM_VIDEO_ID_PATTERN.test(videoId)) {
    return NextResponse.json(
      { status: 400, message: "Invalid Bunny Stream video ID" },
      { status: 400 }
    );
  }

  try {
    const { embedUrl, expiresAt, refreshAfterSeconds } =
      createBunnyStreamEmbedUrl(videoId);

    return NextResponse.json({
      status: 200,
      message: "Success",
      embed_url: embedUrl,
      expires_at: expiresAt,
      refresh_after_seconds: refreshAfterSeconds,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create Bunny Stream embed URL";

    return NextResponse.json({ status: 500, message }, { status: 500 });
  }
}
