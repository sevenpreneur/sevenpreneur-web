"use client";
import { Switch } from "@/components/ui/switch";
import { StatusType } from "@/lib/app-types";
import { setSessionToken, trpc } from "@/trpc/client";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppTextArea from "../fields/AppTextArea";
import StatusLabelCMS from "../labels/StatusLabelCMS";
import AppSheet from "../modals/AppSheet";

interface EditAutomationFormCMSProps {
  sessionToken: string;
  automationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditAutomationFormCMS({
  sessionToken,
  automationId,
  isOpen,
  onClose,
}: EditAutomationFormCMSProps) {
  const editAutomation = trpc.update.automation.useMutation();
  const utils = trpc.useUtils();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (sessionToken) {
      setSessionToken(sessionToken);
    }
  }, [sessionToken]);

  // Fetch tRPC for Initial Data
  const {
    data,
    isLoading: isLoadingInitialData,
    isError: isErrorInitialData,
  } = trpc.read.automation.useQuery(
    { id: automationId },
    { enabled: !!sessionToken && !!automationId }
  );
  const initialData = data?.automation;

  // Beginning State
  const [formData, setFormData] = useState<{
    automationKey: string;
    automationDescription: string;
    automationTags: string;
    automationStatus: StatusType | null;
  }>({
    automationKey: "",
    automationDescription: "",
    automationTags: "",
    automationStatus: null,
  });

  // Iterate initial data (so it doesn't get lost)
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        automationKey: initialData.key,
        automationDescription: initialData.description,
        automationTags: initialData.tags ?? "",
        automationStatus: initialData.status,
      });
    }
  }, [initialData]);

  // Handle data changes
  const handleInputChange = (fieldName: string) => (value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Required field checking
    if (!formData.automationKey.trim()) {
      toast.error("Automation key cannot be empty");
      setIsSubmitting(false);
      return;
    }
    if (/\s/.test(formData.automationKey)) {
      toast.error("Automation key cannot contain spaces");
      setIsSubmitting(false);
      return;
    }
    if (!formData.automationDescription.trim()) {
      toast.error("Don’t forget to describe what this automation does");
      setIsSubmitting(false);
      return;
    }

    // PATCH to Database
    try {
      editAutomation.mutate(
        {
          id: automationId,
          key: formData.automationKey.trim(),
          description: formData.automationDescription.trim(),
          status: formData.automationStatus as StatusType,
          tags: formData.automationTags.trim()
            ? formData.automationTags.trim()
            : null,
        },
        {
          onSuccess: () => {
            toast.success("Automation successfully updated");
            setIsSubmitting(false);
            utils.list.automations.invalidate();
            utils.read.automation.invalidate();
            onClose();
          },
          onError: (err) => {
            toast.error("Something went wrong while updating the automation", {
              description: err.message,
            });
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <AppSheet
      sheetName="Edit Automation"
      sheetDescription="Update the details of an existing automation kill switch"
      isOpen={isOpen}
      onClose={onClose}
    >
      <form
        className="relative w-full h-full flex flex-col"
        onSubmit={handleSubmit}
      >
        <div className="form-container flex flex-col h-full px-6 pb-96 gap-5 overflow-y-auto">
          {isLoadingInitialData && (
            <div className="flex w-full h-full py-4 items-center justify-center text-emphasis">
              <Loader2 className="animate-spin size-5" />
            </div>
          )}
          {isErrorInitialData && (
            <div className="flex w-full h-full py-4 items-center justify-center text-emphasis font-medium">
              No Data
            </div>
          )}
          {initialData && !isLoadingInitialData && !isErrorInitialData && (
            <div className="group-input flex flex-col gap-4">
              <AppInput
                variant="CMS"
                inputId="automation-key"
                inputName="Key"
                inputType="text"
                inputPlaceholder="e.g. whatsapp-ai-agent"
                value={formData.automationKey}
                onInputChange={handleInputChange("automationKey")}
                required
              />
              <AppTextArea
                variant="CMS"
                textAreaId="automation-description"
                textAreaName="Description"
                textAreaHeight="h-24"
                textAreaPlaceholder="e.g. Auto-replies to inbound WhatsApp leads"
                value={formData.automationDescription}
                onTextAreaChange={handleInputChange("automationDescription")}
                required
              />
              <AppInput
                variant="CMS"
                inputId="automation-tags"
                inputName="Tags"
                inputType="text"
                inputPlaceholder="e.g. GPT Model, Haiku Model"
                value={formData.automationTags}
                onInputChange={handleInputChange("automationTags")}
              />
              <div className="status flex flex-col gap-1">
                <label
                  htmlFor="automation-status"
                  className="flex pl-1 gap-0.5 text-sm text-foreground font-semibold"
                >
                  Status <span className="text-red-700">*</span>
                </label>
                <div className="switch-button flex pl-1 gap-2">
                  <Switch
                    className="data-[state=checked]:bg-tertiary"
                    checked={formData.automationStatus === "ACTIVE"}
                    onCheckedChange={(checked) =>
                      handleInputChange("automationStatus")(
                        checked ? "ACTIVE" : "INACTIVE"
                      )
                    }
                  />
                  {formData.automationStatus && (
                    <StatusLabelCMS variants={formData.automationStatus} />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 w-full p-4 bg-sb-bg z-40">
          <AppButton
            className="w-full"
            variant="tertiary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="animate-spin size-4" />}
            Update Automation
          </AppButton>
        </div>
      </form>
    </AppSheet>
  );
}
