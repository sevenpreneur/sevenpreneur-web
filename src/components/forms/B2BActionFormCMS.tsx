"use client";
import { B2B_ACTION_PRIORITIES, B2B_ACTION_STATUSES } from "@/lib/b2b-action";
import { trpc } from "@/trpc/client";
import type {
  B2BActionPriorityEnum,
  B2BActionStatusEnum,
} from "@prisma/client";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import AppTextArea from "../fields/AppTextArea";
import AppSheet from "../modals/AppSheet";

interface B2BActionFormCMSProps {
  sessionToken: string;
  pipelineId: number;
  // When set, the form edits that action; otherwise it creates a new one.
  actionId?: number | null;
  // Pre-selected column when adding from a specific kanban column.
  defaultStatus?: B2BActionStatusEnum;
  isOpen: boolean;
  onClose: () => void;
}

const toDateInput = (value: Date | string | null | undefined) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function B2BActionFormCMS(props: B2BActionFormCMSProps) {
  const isEdit = props.actionId != null;
  const utils = trpc.useUtils();
  const createAction = trpc.create.b2b.action.useMutation();
  const updateAction = trpc.update.b2b.action.useMutation();

  const { data: usersData } = trpc.list.users.useQuery(
    { role_id: 2, page_size: 200 },
    { enabled: !!props.sessionToken && props.isOpen }
  );
  const assigneeOptions = [
    { label: "Unassigned", value: "" },
    ...(usersData?.list.map((u) => ({ label: u.full_name, value: u.id })) ??
      []),
  ];

  const { data: actionData } = trpc.read.b2b.action.useQuery(
    { id: props.actionId ?? 0 },
    { enabled: !!props.sessionToken && props.isOpen && isEdit }
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    summary: "",
    status: (props.defaultStatus ?? "TO_DO") as B2BActionStatusEnum,
    priority: "MEDIUM" as B2BActionPriorityEnum,
    due_date: "",
    assignee_id: "",
  });

  // Prefill on open: edit -> from fetched action, create -> reset to defaults.
  useEffect(() => {
    if (!props.isOpen) return;
    if (isEdit && actionData?.action) {
      const a = actionData.action;
      setFormData({
        name: a.name,
        summary: a.summary ?? "",
        status: a.status,
        priority: a.priority,
        due_date: toDateInput(a.due_date),
        assignee_id: a.assignee_id ?? "",
      });
    } else if (!isEdit) {
      setFormData({
        name: "",
        summary: "",
        status: props.defaultStatus ?? "TO_DO",
        priority: "MEDIUM",
        due_date: "",
        assignee_id: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen, isEdit, actionData]);

  const handleInputChange = (fieldName: string) => (value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setIsSubmitting(true);

    const onSuccess = (message: string) => () => {
      toast.success(message);
      setIsSubmitting(false);
      utils.list.b2b.actions.invalidate();
      props.onClose();
    };
    const onError = (err: { message: string }) => {
      setIsSubmitting(false);
      toast.error("Failed to save action.", { description: err.message });
    };

    if (isEdit) {
      updateAction.mutate(
        {
          id: props.actionId as number,
          name: formData.name.trim(),
          summary: formData.summary.trim() || null,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
          assignee_id: formData.assignee_id || null,
        },
        { onSuccess: onSuccess("Action updated."), onError }
      );
    } else {
      createAction.mutate(
        {
          pipeline_id: props.pipelineId,
          name: formData.name.trim(),
          summary: formData.summary.trim() || null,
          status: formData.status,
          priority: formData.priority,
          due_date: formData.due_date || null,
          assignee_id: formData.assignee_id || null,
        },
        { onSuccess: onSuccess("Action created."), onError }
      );
    }
  };

  return (
    <AppSheet
      sheetName={isEdit ? "Edit Action" : "Add New Action"}
      sheetDescription="Track an activity for this lead and where it sits in your workflow."
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      <form
        className="relative w-full flex-1 min-h-0 flex flex-col"
        onSubmit={handleSubmit}
      >
        <div className="form-container flex flex-col flex-1 min-h-0 px-6 pt-1 pb-40 gap-4 overflow-y-auto">
          <AppInput
            variant="CMS"
            inputId="action-name"
            inputName="Name"
            inputType="text"
            inputPlaceholder="e.g. Follow up proposal with PIC"
            value={formData.name}
            onInputChange={handleInputChange("name")}
            required
          />
          <AppTextArea
            variant="CMS"
            textAreaId="action-summary"
            textAreaName="Summary (optional)"
            textAreaHeight="h-28"
            textAreaPlaceholder="e.g. Sent follow-up proposal to PIC, awaiting reply"
            value={formData.summary}
            onTextAreaChange={handleInputChange("summary")}
          />
          <AppSelect
            variant="CMS"
            selectId="action-status"
            selectName="Status"
            selectPlaceholder="Pick a status"
            value={formData.status}
            onChange={handleInputChange("status")}
            options={B2B_ACTION_STATUSES}
            required
          />
          <AppSelect
            variant="CMS"
            selectId="action-priority"
            selectName="Priority"
            selectPlaceholder="Pick a priority"
            value={formData.priority}
            onChange={handleInputChange("priority")}
            options={B2B_ACTION_PRIORITIES}
            required
          />
          <AppInput
            variant="CMS"
            inputId="action-due-date"
            inputName="Due Date"
            inputType="date"
            value={formData.due_date}
            onInputChange={handleInputChange("due_date")}
          />
          <AppSelect
            variant="CMS"
            selectId="action-assignee"
            selectName="Assignee"
            selectPlaceholder="Unassigned"
            value={formData.assignee_id}
            onChange={handleInputChange("assignee_id")}
            options={assigneeOptions}
          />
        </div>
        <div className="shrink-0 w-full p-4 bg-sb-bg border-t border-dashboard-border">
          <AppButton
            className="w-full"
            variant="tertiary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="animate-spin size-4" />}
            {isEdit ? "Save Changes" : "Create Action"}
          </AppButton>
        </div>
      </form>
    </AppSheet>
  );
}
