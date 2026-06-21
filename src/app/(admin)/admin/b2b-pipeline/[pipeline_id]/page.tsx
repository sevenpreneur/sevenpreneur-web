import B2BActionsKanbanCMS from "@/components/indexes/B2BActionsKanbanCMS";
import PageContainerCMS from "@/components/pages/PageContainerCMS";
import AppPageState from "@/components/states/AppPageState";
import { setSessionToken, trpc } from "@/trpc/server";
import { cookies } from "next/headers";

export default async function B2BActionsPageCMS({
  params,
}: {
  params: Promise<{ pipeline_id: string }>;
}) {
  const { pipeline_id } = await params;
  const pipelineId = Number(pipeline_id);

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) return null;
  setSessionToken(sessionToken);

  // Client-side Authorization
  const userSession = await trpc.auth.checkSession();
  const allowedRoles = ["Administrator", "Super Admin"];

  if (!allowedRoles.includes(userSession.user.role_name)) {
    return (
      <PageContainerCMS>
        <AppPageState variant="FORBIDDEN" />
      </PageContainerCMS>
    );
  }

  if (!Number.isInteger(pipelineId) || pipelineId <= 0) {
    return (
      <PageContainerCMS>
        <AppPageState variant="NOT_FOUND" />
      </PageContainerCMS>
    );
  }

  return (
    <B2BActionsKanbanCMS sessionToken={sessionToken} pipelineId={pipelineId} />
  );
}
