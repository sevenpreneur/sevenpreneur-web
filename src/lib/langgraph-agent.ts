// Shared helpers for delivering webhook events to the LangGraph agent on Railway.
// Triggers are routed through QStash so a transient Railway outage gets retried
// instead of silently dropping the message.

const QSTASH_BASE = "https://api.sevenpreneur.com/qstash";

export const TRIGGER_LANGGRAPH_WA_URL = `${QSTASH_BASE}/trigger-whatsapp-langgraph`;
export const TRIGGER_LANGGRAPH_IG_URL = `${QSTASH_BASE}/trigger-instagram-langgraph`;
export const LANGGRAPH_FAILURE_CALLBACK_URL = `${QSTASH_BASE}/langgraph-failed`;

// Number of QStash retries before the failure callback fires. Chosen so the
// exponential backoff spans a multi-minute Railway cold start / restart window.
export const LANGGRAPH_TRIGGER_RETRIES = 5;

// Lightweight readiness probe against the agent's /health endpoint. Doubles as a
// wake-up ping for a scaled-to-zero dyno, so a later retry likely lands warm.
export async function isAgentHealthy(): Promise<boolean> {
  const agentUrl = process.env.AGENT_URL;
  if (!agentUrl) return false;
  try {
    const res = await fetch(`${agentUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
