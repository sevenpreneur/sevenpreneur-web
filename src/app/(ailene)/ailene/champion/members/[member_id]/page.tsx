import MemberDetailsChampionAILN from "@/components/pages/MemberDetailsChampionAILN";
import AppPageState from "@/components/states/AppPageState";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Champion - Member Detail",
};

export default async function ChampionMemberPage({
  params,
}: {
  params: Promise<{ member_id: string }>;
}) {
  const { member_id } = await params;
  const memberId = Number(member_id);

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return <AppPageState variant="NOT_FOUND" />;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <MemberDetailsChampionAILN sessionToken={sessionToken} memberId={memberId} />;
}
