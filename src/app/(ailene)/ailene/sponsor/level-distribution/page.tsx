import LevelDistributionSponsorAILN from "@/components/pages/LevelDistributionSponsorAILN";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Level Distribution",
};

export default async function LevelDistributionPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <LevelDistributionSponsorAILN sessionToken={sessionToken} />;
}
