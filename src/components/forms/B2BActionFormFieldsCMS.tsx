"use client";
import { B2B_ACTION_PRIORITIES, B2B_ACTION_STATUSES } from "@/lib/b2b-action";
import type {
  B2BActionPriorityEnum,
  B2BActionStatusEnum,
} from "@prisma/client";
import { Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import AppTextArea from "../fields/AppTextArea";

export interface B2BActionFormValues {
  name: string;
  summary: string;
  status: B2BActionStatusEnum;
  priority: B2BActionPriorityEnum;
  due_date: string;
  assignee_id: string;
}

interface AssigneeOption {
  label: string;
  value: string;
  image: string;
}

interface B2BActionFormFieldsCMSProps {
  initialValues: B2BActionFormValues;
  assigneeOptions: AssigneeOption[];
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit: (values: B2BActionFormValues) => void;
}

export default function B2BActionFormFieldsCMS({
  initialValues,
  assigneeOptions,
  submitLabel,
  isSubmitting,
  onSubmit,
}: B2BActionFormFieldsCMSProps) {
  const [formData, setFormData] = useState<B2BActionFormValues>(initialValues);

  const handleInputChange = (fieldName: string) => (value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    onSubmit(formData);
  };

  return (
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
          textAreaName="Summary"
          textAreaHeight="h-48"
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
          {submitLabel}
        </AppButton>
      </div>
    </form>
  );
}
