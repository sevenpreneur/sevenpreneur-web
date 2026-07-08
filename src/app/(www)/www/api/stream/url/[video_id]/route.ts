import { createBunnyStreamEmbedUrlResponse } from "@/lib/bunny-stream";

interface VideoStreamProps {
  params: Promise<{ video_id: string }>;
}

export async function GET(_req: Request, { params }: VideoStreamProps) {
  const videoId = (await params).video_id;

  return createBunnyStreamEmbedUrlResponse(videoId);
}
