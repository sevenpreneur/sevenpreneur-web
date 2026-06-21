"use client";
import PageHeaderCMS from "@/components/titles/PageHeaderCMS";
import { B2B_ACTION_STATUSES } from "@/lib/b2b-action";
import { setSessionToken, trpc } from "@/trpc/client";
import type { B2BActionStatusEnum } from "@prisma/client";
import { KanbanSquare, Plus, PlusCircle } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import B2BActionFormCMS from "../forms/B2BActionFormCMS";
import B2BActionItemCMS from "../items/B2BActionItemCMS";
import AppAlertConfirmDialog from "../modals/AppAlertConfirmDialog";
import PageContainerCMS from "../pages/PageContainerCMS";
import AppErrorComponents from "../states/AppErrorComponents";
import AppPageLoading from "../states/AppPageLoading";

interface B2BActionsKanbanCMSProps {
  sessionToken: string;
  pipelineId: number;
}

type ActionItem = NonNullable<
  ReturnType<typeof useActionsData>["data"]
>["list"][number];

// Small typed wrapper so we can derive the item type above.
function useActionsData(pipelineId: number, enabled: boolean) {
  return trpc.list.b2b.actions.useQuery(
    { pipeline_id: pipelineId, page_size: 500 },
    { enabled }
  );
}

export default function B2BActionsKanbanCMS({
  sessionToken,
  pipelineId,
}: B2BActionsKanbanCMSProps) {
  const utils = trpc.useUtils();

  useEffect(() => {
    if (sessionToken) setSessionToken(sessionToken);
  }, [sessionToken]);

  const {
    data: pipelineData,
    isLoading: isPipelineLoading,
    isError: isPipelineError,
  } = trpc.read.b2b.pipeline.useQuery(
    { id: pipelineId },
    { enabled: !!sessionToken }
  );
  const pipeline = pipelineData?.pipeline;

  const {
    data,
    isLoading: isActionsLoading,
    isError: isActionsError,
  } = useActionsData(pipelineId, !!sessionToken);

  const isLoading = isPipelineLoading || isActionsLoading;
  const isError = isPipelineError || isActionsError;
  const updateAction = trpc.update.b2b.action.useMutation();
  const deleteAction = trpc.delete.b2b.action.useMutation();

  const [movedStatuses, setMovedStatuses] = useState<
    Partial<Record<number, B2BActionStatusEnum>>
  >({});
  const board = useMemo<ActionItem[]>(
    () =>
      data?.list.map((action) => {
        const status = movedStatuses[action.id];
        return status ? { ...action, status } : action;
      }) ?? [],
    [data?.list, movedStatuses]
  );

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverStatus, setDragOverStatus] =
    useState<B2BActionStatusEnum | null>(null);

  const [createStatus, setCreateStatus] = useState<B2BActionStatusEnum | null>(
    null
  );
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActionItem | null>(null);

  const moveTo = (id: number, status: B2BActionStatusEnum) => {
    const current = board.find((b) => b.id === id);
    if (!current || current.status === status) return;
    const prevStatus = current.status;
    setMovedStatuses((prev) => ({ ...prev, [id]: status }));
    updateAction.mutate(
      { id, status },
      {
        onError: (err) => {
          setMovedStatuses((prev) => ({ ...prev, [id]: prevStatus }));
          toast.error("Failed to move action", { description: err.message });
        },
        onSuccess: () => utils.list.b2b.actions.invalidate(),
      }
    );
  };

  const handleDrop =
    (status: B2BActionStatusEnum) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOverStatus(null);
      const id = draggedId;
      setDraggedId(null);
      if (id != null) moveTo(id, status);
    };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAction.mutate(
      { id: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success("Action deleted");
          utils.list.b2b.actions.invalidate();
        },
        onError: (err) =>
          toast.error("Failed to delete action", { description: `${err}` }),
      }
    );
    setDeleteTarget(null);
  };

  if (isLoading) return <AppPageLoading type="CMS" />;

  return (
    <React.Fragment>
      <PageContainerCMS>
        <div className="index w-full flex flex-col gap-4">
          <PageHeaderCMS
            name={`${pipeline?.company_name} - ${pipeline?.name}`}
            desc="Track and move activities across your workflow"
            icon={KanbanSquare}
          >
            <AppButton
              variant="tertiary"
              onClick={() => setCreateStatus("TO_DO")}
            >
              <PlusCircle className="size-5" />
              Add Action
            </AppButton>
          </PageHeaderCMS>

          {isError && <AppErrorComponents />}

          {!isError && (
            <div className="kanban-scroll w-full overflow-x-auto pb-2 h-[calc(100vh-9rem)]">
              <div className="kanban-columns flex gap-4 min-w-max h-full">
                {B2B_ACTION_STATUSES.map((col) => {
                  const items = board.filter((b) => b.status === col.value);
                  const isOver = dragOverStatus === col.value;
                  return (
                    <div
                      key={col.value}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverStatus(col.value);
                      }}
                      onDragLeave={(e) => {
                        if (e.currentTarget === e.target)
                          setDragOverStatus(null);
                      }}
                      onDrop={handleDrop(col.value)}
                      className={`kanban-column flex flex-col w-80 shrink-0 h-full gap-2 rounded-lg border p-2.5 transition-colors ${
                        isOver
                          ? "border-tertiary bg-tertiary/5"
                          : "border-dashboard-border bg-card-inside-bg"
                      }`}
                    >
                      <div className="column-header flex shrink-0 items-center justify-between px-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${col.dot}`} />
                          <span className="text-xs font-bold uppercase tracking-wide text-foreground dark:text-sevenpreneur-white">
                            {col.label}
                          </span>
                        </div>
                        <span
                          className={`flex size-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${col.dot}`}
                        >
                          {items.length}
                        </span>
                      </div>

                      <div className="column-cards flex flex-1 min-h-0 flex-col gap-2 overflow-y-auto pr-0.5">
                        {items.map((action) => (
                          <B2BActionItemCMS
                            key={action.id}
                            action={action}
                            isDragging={draggedId === action.id}
                            onDragStart={() => setDraggedId(action.id)}
                            onDragEnd={() => setDraggedId(null)}
                            onEdit={() => setEditId(action.id)}
                            onDelete={() => setDeleteTarget(action)}
                          />
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setCreateStatus(col.value)}
                        className="column-add flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1.5 text-xs font-medium text-emphasis transition-colors hover:bg-background hover:text-foreground hover:cursor-pointer"
                      >
                        <Plus className="size-4" />
                        Add action
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </PageContainerCMS>

      {createStatus !== null && (
        <B2BActionFormCMS
          sessionToken={sessionToken}
          pipelineId={pipelineId}
          defaultStatus={createStatus}
          isOpen={createStatus !== null}
          onClose={() => setCreateStatus(null)}
        />
      )}

      {editId !== null && (
        <B2BActionFormCMS
          sessionToken={sessionToken}
          pipelineId={pipelineId}
          actionId={editId}
          isOpen={editId !== null}
          onClose={() => setEditId(null)}
        />
      )}

      {deleteTarget && (
        <AppAlertConfirmDialog
          alertDialogHeader="Delete this action?"
          alertDialogMessage={`Are you sure you want to delete "${deleteTarget.name}"? This cannot be undone.`}
          alertCancelLabel="Cancel"
          alertConfirmLabel="Delete"
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </React.Fragment>
  );
}
