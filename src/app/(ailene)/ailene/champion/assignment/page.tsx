import AssignmentChampionAILN from "@/components/pages/AssignmentChampionAILN";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Assignment",
};

export default async function ChampionAssignmentPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <AssignmentChampionAILN sessionToken={sessionToken} />;
}
