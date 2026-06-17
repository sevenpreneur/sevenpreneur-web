import { isAgentHealthy } from "@/lib/langgraph-agent";
import { verifySignatureAppRouter } from "@upstash/qstash/dist/nextjs";
import {
  LangGraphAgentPayload,
  triggerLangGraphAgent,
} from "../../whatsapp/webhook/util.wa.webhook";

export const POST = verifySignatureAppRouter(async (req: Request) => {
  const payload: LangGraphAgentPayload = await req.json();

  // Readiness gate: a cheap GET that also wakes a cold dyno. If the agent isn't
  // ready, return 503 so QStash retries with backoff instead of dropping it.
  if (!(await isAgentHealthy())) {
    return new Response("agent not ready", { status: 503 });
  }

  // Throws on failure -> 500 -> QStash retries (final failure hits the callback).
  await triggerLangGraphAgent(payload);
  return Response.json({ received: true });
});
