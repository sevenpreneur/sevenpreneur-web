import LogError from "@/lib/prisma-log-error";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";

// QStash failure callback: fired once after a LangGraph trigger exhausts all
// retries. Logs the dead-lettered job so a genuinely lost message is visible.
export const POST = verifySignatureAppRouter(async (req: Request) => {
  const body = await req.json().catch(() => ({}));
  await LogError(
    "langgraph.trigger",
    "LangGraph trigger exhausted all QStash retries.",
    body
  );
  return Response.json({ received: true });
});
