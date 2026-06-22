"use client";
import { trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AppErrorComponents from "../states/AppErrorComponents";
import AppSheet from "../modals/AppSheet";
import B2BActionFormFieldsCMS, {
  B2BActionFormValues,
} from "./B2BActionFormFieldsCMS";

const DEFAULT_AVATAR =
  "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur/default-avatar.svg.png";

interface EditB2BActionFormCMSProps {
  sessionToken: string;
  actionId: number;
  isOpen: boolean;
  onClose: () => void;
}

const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function EditB2BActionFormCMS(props: EditB2BActionFormCMSProps) {
  const utils = trpc.useUtils();
  const updateAction = trpc.update.b2b.action.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: usersData,
    isLoading: isAssigneesLoading,
    isError: isAssigneesError,
  } = trpc.list.users.useQuery(
    { role_ids: [0, 2, 4, 6], page_size: 200 },
    { enabled: !!props.sessionToken && props.isOpen }
  );
  const assigneeOptions = [
    { label: "Unassigned", value: "", image: DEFAULT_AVATAR },
    ...(usersData?.list.map((u) => ({
      label: u.full_name,
      value: u.id,
      image: u.avatar || DEFAULT_AVATAR,
    })) ?? []),
  ];

  const {
    data: actionData,
    isLoading: isActionLoading,
    isError: isActionError,
  } = trpc.read.b2b.action.useQuery(
    { id: props.actionId },
    { enabled: !!props.sessionToken && props.isOpen }
  );

  const isLoading = isAssigneesLoading || isActionLoading;
  const isError = isAssigneesError || isActionError;
  const action = actionData?.action;

  const handleSubmit = (values: B2BActionFormValues) => {
    setIsSubmitting(true);
    updateAction.mutate(
      {
        id: props.actionId,
        name: values.name.trim(),
        summary: values.summary.trim() || null,
        status: values.status,
        priority: values.priority,
        due_date: values.due_date || null,
        assignee_id: values.assignee_id || null,
      },
      {
        onSuccess: () => {
          toast.success("Action updated.");
          setIsSubmitting(false);
          utils.list.b2b.actions.invalidate();
          props.onClose();
        },
        onError: (err) => {
          setIsSubmitting(false);
          toast.error("Failed to save action.", { description: err.message });
        },
      }
    );
  };

  return (
    <AppSheet
      sheetName="Edit Action"
      sheetDescription="Track an activity for this lead and where it sits in your workflow."
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      {isError ? (
        <AppErrorComponents />
      ) : isLoading || !action ? (
        <div className="flex w-full flex-1 items-center justify-center text-emphasis">
          <Loader2 className="animate-spin size-6" />
        </div>
      ) : (
        <B2BActionFormFieldsCMS
          initialValues={{
            name: action.name,
            summary: action.summary ?? "",
            status: action.status,
            priority: action.priority,
            due_date: toDateInput(action.due_date),
            assignee_id: action.assignee_id ?? "",
          }}
          assigneeOptions={assigneeOptions}
          submitLabel="Save Changes"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
    </AppSheet>
  );
}
