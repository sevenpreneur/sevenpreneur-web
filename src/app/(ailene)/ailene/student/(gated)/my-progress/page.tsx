import MyProgressStudentAILN from "@/components/pages/MyProgressStudentAILN";
import { setSessionToken } from "@/trpc/server";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Progress Saya",
};

export default async function StudentMyProgressPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  return <MyProgressStudentAILN sessionToken={sessionToken} />;
}
