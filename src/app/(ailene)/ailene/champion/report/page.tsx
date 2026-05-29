import ReportChampionAILN from "@/components/pages/ReportChampionAILN";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Champion - Reports",
};

export default async function ChampionReportPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <ReportChampionAILN sessionToken={sessionToken} />;
}
