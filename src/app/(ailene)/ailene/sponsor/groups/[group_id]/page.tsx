import GroupDetailsSponsorAILN from "@/components/pages/GroupDetailsSponsorAILN";
import AppPageState from "@/components/states/AppPageState";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Sponsor - Departemen",
};

export default async function SponsorGroupPage({
  params,
}: {
  params: Promise<{ group_id: string }>;
}) {
  const { group_id } = await params;
  const groupId = Number(group_id);

  if (!Number.isInteger(groupId) || groupId <= 0) {
    return <AppPageState variant="NOT_FOUND" />;
  }

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <GroupDetailsSponsorAILN sessionToken={sessionToken} groupId={groupId} />;
}
