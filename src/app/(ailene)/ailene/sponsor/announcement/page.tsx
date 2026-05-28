import AnnouncementSponsorAILN from "@/components/pages/AnnouncementSponsorAILN";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Sponsor - Pengumuman",
};

export default async function AnnouncementPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <AnnouncementSponsorAILN sessionToken={sessionToken} />;
}
