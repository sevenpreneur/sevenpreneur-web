import DashboardOutcomeAILN from "@/components/pages/DashboardOutcomeAILN";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Outcome Report",
};

export default async function OutcomePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <DashboardOutcomeAILN sessionToken={sessionToken} />;
}
