import AutomationListCMS from "@/components/indexes/AutomationListCMS";
import PageContainerCMS from "@/components/pages/PageContainerCMS";
import AppPageState from "@/components/states/AppPageState";
import { setSessionToken, trpc } from "@/trpc/server";
import { cookies } from "next/headers";

export default async function AutomationsPageCMS() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  // Client-side Authorization
  const userSession = await trpc.auth.checkSession();
  const allowedRolesListAutomation = ["Administrator", "Super Admin"];

  if (!allowedRolesListAutomation.includes(userSession.user.role_name)) {
    return (
      <PageContainerCMS>
        <AppPageState variant="FORBIDDEN" />
      </PageContainerCMS>
    );
  }

  return <AutomationListCMS sessionToken={sessionToken} />;
}
