"use client";
import { trpc } from "@/trpc/client";
import type { B2BActionStatusEnum } from "@prisma/client";
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

interface CreateB2BActionFormCMSProps {
  sessionToken: string;
  pipelineId: number;
  defaultStatus?: B2BActionStatusEnum;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateB2BActionFormCMS(
  props: CreateB2BActionFormCMSProps
) {
  const utils = trpc.useUtils();
  const createAction = trpc.create.b2b.action.useMutation();
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

  const initialValues: B2BActionFormValues = {
    name: "",
    summary: "",
    status: props.defaultStatus ?? "TO_DO",
    priority: "MEDIUM",
    due_date: "",
    assignee_id: "",
  };

  const handleSubmit = (values: B2BActionFormValues) => {
    setIsSubmitting(true);
    createAction.mutate(
      {
        pipeline_id: props.pipelineId,
        name: values.name.trim(),
        summary: values.summary.trim() || null,
        status: values.status,
        priority: values.priority,
        due_date: values.due_date || null,
        assignee_id: values.assignee_id || null,
      },
      {
        onSuccess: () => {
          toast.success("Action created.");
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
      sheetName="Add New Action"
      sheetDescription="Track an activity for this lead and where it sits in your workflow."
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      {isAssigneesError ? (
        <AppErrorComponents />
      ) : isAssigneesLoading ? (
        <div className="flex w-full flex-1 items-center justify-center text-emphasis">
          <Loader2 className="animate-spin size-6" />
        </div>
      ) : (
        <B2BActionFormFieldsCMS
          initialValues={initialValues}
          assigneeOptions={assigneeOptions}
          submitLabel="Create Action"
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
        />
      )}
    </AppSheet>
  );
}
