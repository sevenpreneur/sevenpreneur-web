import GetPrismaClient from "@/lib/prisma";
import {
  saveWhatsappAttachment,
  triggerLangGraphAgentForMedia,
} from "../../whatsapp/webhook/util.wa.webhook";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

type SaveWhatsappAttachmentJob = {
  media_type: "audio" | "document" | "image" | "sticker" | "video";
  attachment: object & { id: string };
  wam_id: string;
};

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const body: SaveWhatsappAttachmentJob = await req.json();

  const prisma = GetPrismaClient();
  const storageUrl = await saveWhatsappAttachment(
    prisma,
    body.media_type,
    body.attachment,
    body.wam_id
  );

  // storage_url is persisted now — notify the agent with the full attachment.
  await triggerLangGraphAgentForMedia(prisma, body.wam_id);

  return Response.json({ received: true, storage_url: storageUrl });
});
