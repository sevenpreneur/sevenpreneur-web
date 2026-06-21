"use client";
import { trpc } from "@/trpc/client";
import {
  B2BProbabilityStatusEnum,
  B2BProductEnum,
  B2BSourceEnum,
  B2BStageEnum,
} from "@prisma/client";
import dayjs from "dayjs";
import { Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import AppTextArea from "../fields/AppTextArea";
import AppAlertConfirmDialog from "../modals/AppAlertConfirmDialog";
import AppSheet from "../modals/AppSheet";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";

interface EditLeadsPipelineFormCMSProps {
  sessionToken: string;
  pipelineId: number;
  isOpen: boolean;
  onClose: () => void;
}

const PRODUCT_OPTIONS = [
  { label: "Sponsorship", value: B2BProductEnum.SPONSORSHIP },
  { label: "Corporate Training", value: B2BProductEnum.CORPORATE_TRAINING },
  {
    label: "Corporate AI Training",
    value: B2BProductEnum.CORPORATE_AI_TRAINING,
  },
];

const SOURCE_OPTIONS = [
  { label: "Social Media", value: B2BSourceEnum.SOCIAL_MEDIA },
  { label: "Founder Network", value: B2BSourceEnum.FOUNDER_NETWORK },
  { label: "Event / Conference", value: B2BSourceEnum.EVENT_CONFERENCE },
  { label: "Referral Partner", value: B2BSourceEnum.REFERRAL_PARTNER },
  { label: "Referral Client", value: B2BSourceEnum.REFERRAL_CLIENT },
  { label: "Website", value: B2BSourceEnum.WEBSITE },
];

const STAGE_OPTIONS = [
  { label: "Lead Identified", value: B2BStageEnum.LEAD_IDENTIFIED },
  { label: "Contacted", value: B2BStageEnum.CONTACTED },
  { label: "Negotiation", value: B2BStageEnum.NEGOTIATION },
  { label: "Verbal Commit", value: B2BStageEnum.VERBAL_COMMIT },
  { label: "Closed Won", value: B2BStageEnum.CLOSED_WON },
  { label: "Closed Lost", value: B2BStageEnum.CLOSED_LOST },
  { label: "On Hold", value: B2BStageEnum.ON_HOLD },
];

const PROBABILITY_STATUS_OPTIONS = [
  { label: "Cold", value: B2BProbabilityStatusEnum.COLD },
  { label: "Warm", value: B2BProbabilityStatusEnum.WARM },
  { label: "Hot", value: B2BProbabilityStatusEnum.HOT },
];

export default function EditLeadsPipelineFormCMS(
  props: EditLeadsPipelineFormCMSProps
) {
  const utils = trpc.useUtils();
  const updatePipeline = trpc.update.b2b.pipeline.useMutation();
  const updateCompany = trpc.update.b2b.company.useMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch tRPC data
  const {
    data: pipelineData,
    isLoading,
    isError,
  } = trpc.read.b2b.pipeline.useQuery(
    { id: props.pipelineId },
    { enabled: !!props.sessionToken }
  );
  const initialData = pipelineData?.pipeline;

  const { data: industriesData } = trpc.list.industries.useQuery(undefined, {
    enabled: !!props.sessionToken,
  });
  const industryOptions =
    industriesData?.list.map((entry) => ({
      label: entry.name,
      value: entry.id,
    })) ?? [];

  const { data: companiesData } = trpc.list.b2b.companies.useQuery(
    { page: 1, page_size: 200 },
    { enabled: !!props.sessionToken }
  );
  const companyOptions =
    companiesData?.list.map((entry) => ({
      label: entry.name,
      value: entry.id,
    })) ?? [];

  // Beginning State
  const [formData, setFormData] = useState<{
    name: string;
    company_id: number | "";
    company_name: string;
    industry_id: number | "";
    pic_name: string;
    pic_job_title: string;
    pic_wa: string;
    pic_email: string;
    product: B2BProductEnum | "";
    source: B2BSourceEnum | "";
    stage: B2BStageEnum | "";
    probability: string;
    probability_status: B2BProbabilityStatusEnum | "";
    project_value: string;
    project_start_month: string;
    project_end_month: string;
  }>({
    name: initialData?.name || "",
    company_id: initialData?.company_id ?? "",
    company_name: initialData?.company_name || "",
    industry_id: initialData?.industry_id ?? "",
    pic_name: initialData?.pic_name || "",
    pic_job_title: initialData?.pic_job_title || "",
    pic_wa: initialData?.pic_wa || "",
    pic_email: initialData?.pic_email || "",
    product: initialData?.product || "",
    source: initialData?.source || "",
    stage: initialData?.stage || "",
    probability: initialData ? String(initialData.probability) : "",
    probability_status: initialData?.probability_status || "",
    project_value: initialData ? String(initialData.project_value) : "",
    project_start_month: initialData?.project_start_month
      ? dayjs(initialData.project_start_month).format("YYYY-MM")
      : "",
    project_end_month: initialData?.project_end_month
      ? dayjs(initialData.project_end_month).format("YYYY-MM")
      : "",
  });

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: initialData.name || "",
        company_id: initialData.company_id,
        company_name: initialData.company_name || "",
        industry_id: initialData.industry_id,
        pic_name: initialData.pic_name || "",
        pic_job_title: initialData.pic_job_title || "",
        pic_wa: initialData.pic_wa || "",
        pic_email: initialData.pic_email || "",
        product: initialData.product,
        source: initialData.source,
        stage: initialData.stage,
        probability: String(initialData.probability),
        probability_status: initialData.probability_status,
        project_value: String(initialData.project_value),
        project_start_month: initialData.project_start_month
          ? dayjs(initialData.project_start_month).format("YYYY-MM")
          : "",
        project_end_month: initialData.project_end_month
          ? dayjs(initialData.project_end_month).format("YYYY-MM")
          : "",
      });
    }
  }, [initialData]);

  // Handle data changes
  const handleInputChange = (fieldName: string) => (value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  // When the company is reassigned, repopulate the editable company-detail
  // fields from the newly selected company.
  const handleCompanyChange = (value: unknown) => {
    const companyId = Number(value);
    const picked = companiesData?.list.find((c) => c.id === companyId);
    setFormData((prev) => ({
      ...prev,
      company_id: companyId,
      company_name: picked?.name ?? prev.company_name,
      industry_id: picked?.industry_id ?? prev.industry_id,
      pic_name: picked?.pic_name ?? "",
      pic_job_title: picked?.pic_job_title ?? "",
      pic_wa: picked?.pic_wa ?? "",
      pic_email: picked?.pic_email ?? "",
    }));
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const probability = Number(formData.probability);
    if (
      !Number.isInteger(probability) ||
      probability < 0 ||
      probability > 100
    ) {
      toast.error("Probability must be an integer between 0 and 100.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.probability_status) {
      toast.error("Pick a probability status.");
      setIsSubmitting(false);
      return;
    }
    const projectValue = Number(formData.project_value);
    if (!Number.isFinite(projectValue) || projectValue < 0) {
      toast.error("Project value must be a non-negative number.");
      setIsSubmitting(false);
      return;
    }
    if (
      formData.project_start_month &&
      formData.project_end_month &&
      formData.project_end_month < formData.project_start_month
    ) {
      toast.error("Project end month must be on or after start month.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.product || !formData.source || !formData.stage) {
      toast.error("Product, source, and stage are required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.company_id) {
      toast.error("Pick a company.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.company_name.trim()) {
      toast.error("Company name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!formData.industry_id) {
      toast.error("Pick an industry.");
      setIsSubmitting(false);
      return;
    }

    const companyId = Number(formData.company_id);

    try {
      // 1. Save the (selected) company's own details.
      await updateCompany.mutateAsync({
        id: companyId,
        name: formData.company_name.trim(),
        industry_id: Number(formData.industry_id),
        pic_name: formData.pic_name.trim() || null,
        pic_job_title: formData.pic_job_title.trim() || null,
        pic_wa: formData.pic_wa.trim() || null,
        pic_email: formData.pic_email.trim() || null,
      });

      // 2. Save the pipeline (program) fields, including company link.
      await updatePipeline.mutateAsync({
        id: props.pipelineId,
        name: formData.name.trim(),
        company_id: companyId,
        product: formData.product as B2BProductEnum,
        source: formData.source as B2BSourceEnum,
        stage: formData.stage as B2BStageEnum,
        probability,
        probability_status:
          formData.probability_status as B2BProbabilityStatusEnum,
        project_value: projectValue,
        project_start_month: formData.project_start_month
          ? `${formData.project_start_month}-01`
          : null,
        project_end_month: formData.project_end_month
          ? `${formData.project_end_month}-01`
          : null,
      });

      toast.success("Lead updated.");
      setIsSubmitting(false);
      utils.list.b2b.pipelines.invalidate();
      utils.list.b2b.companies.invalidate();
      utils.read.b2b.pipeline.invalidate({ id: props.pipelineId });
      props.onClose();
    } catch (err) {
      setIsSubmitting(false);
      toast.error("Failed to update lead.", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  return (
    <AppSheet
      sheetName="Edit Lead"
      sheetDescription="Update lead details and manage activities."
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      {isLoading && <AppLoadingComponents />}
      {isError && <AppErrorComponents />}

      {initialData && !isLoading && !isError && (
        <form
          className="relative w-full h-full flex flex-col"
          onSubmit={handleSubmit}
        >
          <div className="form-container flex flex-col h-full px-6 pb-32 gap-6 overflow-y-auto">
            <div className="group-input flex flex-col gap-4">
              <AppInput
                variant="CMS"
                inputId="lead-name"
                inputName="Program Name"
                inputType="text"
                value={formData.name}
                onInputChange={handleInputChange("name")}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-company"
                selectName="Company"
                selectPlaceholder="Pick a company"
                value={formData.company_id}
                onChange={handleCompanyChange}
                options={companyOptions}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-product"
                selectName="Product"
                selectPlaceholder="Pick a product type"
                value={formData.product}
                onChange={handleInputChange("product")}
                options={PRODUCT_OPTIONS}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-source"
                selectName="Source"
                selectPlaceholder="How did this lead come in?"
                value={formData.source}
                onChange={handleInputChange("source")}
                options={SOURCE_OPTIONS}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-stage"
                selectName="Stage"
                selectPlaceholder="Current pipeline stage"
                value={formData.stage}
                onChange={handleInputChange("stage")}
                options={STAGE_OPTIONS}
                required
              />
              <AppInput
                variant="CMS"
                inputId="lead-probability"
                inputName="Probability (1–100)"
                inputType="number"
                value={formData.probability}
                onInputChange={handleInputChange("probability")}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-probability-status"
                selectName="Probability Status"
                selectPlaceholder="Pick probability status"
                value={formData.probability_status}
                onChange={handleInputChange("probability_status")}
                options={PROBABILITY_STATUS_OPTIONS}
                required
              />
              <AppInput
                variant="CMS"
                inputId="lead-project-value"
                inputName="Project Value (IDR)"
                inputType="number"
                value={formData.project_value}
                onInputChange={handleInputChange("project_value")}
                required
              />
              <div className="flex gap-3">
                <div className="flex-1">
                  <AppInput
                    variant="CMS"
                    inputId="lead-project-start-month"
                    inputName="Project Start"
                    inputType="month"
                    value={formData.project_start_month}
                    onInputChange={handleInputChange("project_start_month")}
                  />
                </div>
                <div className="flex-1">
                  <AppInput
                    variant="CMS"
                    inputId="lead-project-end-month"
                    inputName="Project End"
                    inputType="month"
                    value={formData.project_end_month}
                    onInputChange={handleInputChange("project_end_month")}
                  />
                </div>
              </div>
            </div>

            <div className="group-input flex flex-col gap-4 pt-2 border-t border-dashboard-border">
              <h4 className="text-sm  font-bold pt-3">Company Details</h4>
              <p className="text-xs text-emphasis -mt-2">
                Edits here update the selected company everywhere it&apos;s used.
              </p>
              <AppInput
                variant="CMS"
                inputId="lead-company-name"
                inputName="Company Name"
                inputType="text"
                value={formData.company_name}
                onInputChange={handleInputChange("company_name")}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-industry"
                selectName="Industry"
                selectPlaceholder="Pick an industry"
                value={formData.industry_id}
                onChange={handleInputChange("industry_id")}
                options={industryOptions}
                required
              />
              <AppInput
                variant="CMS"
                inputId="lead-pic-name"
                inputName="PIC Name"
                inputType="text"
                value={formData.pic_name}
                onInputChange={handleInputChange("pic_name")}
              />
              <AppInput
                variant="CMS"
                inputId="lead-pic-job-title"
                inputName="PIC Job Title"
                inputType="text"
                value={formData.pic_job_title}
                onInputChange={handleInputChange("pic_job_title")}
              />
              <AppInput
                variant="CMS"
                inputId="lead-pic-wa"
                inputName="PIC WhatsApp"
                inputType="text"
                value={formData.pic_wa}
                onInputChange={handleInputChange("pic_wa")}
              />
              <AppInput
                variant="CMS"
                inputId="lead-pic-email"
                inputName="PIC Email"
                inputType="email"
                value={formData.pic_email}
                onInputChange={handleInputChange("pic_email")}
              />
            </div>

            <ActionsSection pipelineId={props.pipelineId} />
          </div>

          <div className="sticky bottom-0 w-full p-4 bg-sb-bg z-40">
            <AppButton
              className="w-full"
              variant="tertiary"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="animate-spin size-4" />}
              Save Changes
            </AppButton>
          </div>
        </form>
      )}
    </AppSheet>
  );
}

// ---------------- B2B Actions inline CRUD ----------------

interface ActionsSectionProps {
  pipelineId: number;
}

function ActionsSection({ pipelineId }: ActionsSectionProps) {
  const utils = trpc.useUtils();
  const { data, isLoading, isError } = trpc.list.b2b.actions.useQuery({
    pipeline_id: pipelineId,
  });

  const createAction = trpc.create.b2b.action.useMutation();
  const updateAction = trpc.update.b2b.action.useMutation();
  const deleteAction = trpc.delete.b2b.action.useMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [newDraft, setNewDraft] = useState({
    name: "",
    summary: "",
  });
  const [editDraft, setEditDraft] = useState({
    name: "",
    summary: "",
  });

  const invalidate = () =>
    utils.list.b2b.actions.invalidate({ pipeline_id: pipelineId });

  const handleCreate = () => {
    if (!newDraft.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    createAction.mutate(
      {
        pipeline_id: pipelineId,
        name: newDraft.name.trim(),
        summary: newDraft.summary.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Activity added.");
          setNewDraft({ name: "", summary: "" });
          invalidate();
        },
        onError: (err) =>
          toast.error("Failed to add activity.", { description: err.message }),
      }
    );
  };

  const handleStartEdit = (id: number, name: string, summary: string) => {
    setEditingId(id);
    setEditDraft({ name, summary });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    if (!editDraft.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    updateAction.mutate(
      {
        id: editingId,
        name: editDraft.name.trim(),
        summary: editDraft.summary.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Activity updated.");
          setEditingId(null);
          invalidate();
        },
        onError: (err) =>
          toast.error("Failed to update activity.", {
            description: err.message,
          }),
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteAction.mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Activity deleted.");
          invalidate();
        },
        onError: (err) =>
          toast.error("Failed to delete activity.", {
            description: err.message,
          }),
      }
    );
  };

  return (
    <div className="group-input flex flex-col gap-4 pt-2 border-t border-dashboard-border">
      <h4 className="text-sm  font-bold pt-3">Activities</h4>

      {/* Add new activity */}
      <div className="p-4 bg-card-inside-bg border border-dashboard-border rounded-md flex flex-col gap-3">
        <AppInput
          variant="CMS"
          inputId="new-action-name"
          inputName="Name"
          inputType="text"
          inputPlaceholder="e.g. Follow up proposal with PIC"
          value={newDraft.name}
          onInputChange={(value) =>
            setNewDraft((prev) => ({ ...prev, name: value }))
          }
        />
        <AppTextArea
          variant="CMS"
          textAreaId="new-action-summary"
          textAreaName="Summary (optional)"
          textAreaPlaceholder="What happened in this activity?"
          textAreaHeight="h-24"
          characterLength={2000}
          value={newDraft.summary}
          onTextAreaChange={(value) =>
            setNewDraft((prev) => ({ ...prev, summary: value }))
          }
        />
        <AppButton
          variant="neutral"
          size="small"
          onClick={handleCreate}
          disabled={createAction.isPending}
          type="button"
        >
          {createAction.isPending ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          Add Activity
        </AppButton>
      </div>

      {/* List existing activities */}
      {isLoading && <AppLoadingComponents />}
      {isError && <AppErrorComponents />}

      {data && !isLoading && !isError && (
        <div className="flex flex-col gap-2">
          {data.list.length === 0 && (
            <p className="text-sm text-center text-emphasis  py-2">
              No activities yet
            </p>
          )}

          {data.list.map((action) => {
            const isEditing = editingId === action.id;
            return (
              <div
                key={action.id}
                className="p-3 bg-white dark:bg-card-inside-bg border border-dashboard-border rounded-md flex flex-col gap-2"
              >
                {isEditing ? (
                  <>
                    <AppInput
                      variant="CMS"
                      inputId={`edit-action-name-${action.id}`}
                      inputName="Name"
                      inputType="text"
                      inputPlaceholder="e.g. Follow up proposal with PIC"
                      value={editDraft.name}
                      onInputChange={(value) =>
                        setEditDraft((prev) => ({ ...prev, name: value }))
                      }
                    />
                    <AppTextArea
                      variant="CMS"
                      textAreaId={`edit-action-summary-${action.id}`}
                      textAreaName="Summary (optional)"
                      textAreaHeight="h-24"
                      characterLength={2000}
                      value={editDraft.summary}
                      onTextAreaChange={(value) =>
                        setEditDraft((prev) => ({ ...prev, summary: value }))
                      }
                    />
                    <div className="flex gap-2 justify-end">
                      <AppButton
                        variant="ghost"
                        size="small"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="size-4" />
                        Cancel
                      </AppButton>
                      <AppButton
                        variant="tertiary"
                        size="small"
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={updateAction.isPending}
                      >
                        {updateAction.isPending ? (
                          <Loader2 className="animate-spin size-4" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        Save
                      </AppButton>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground dark:text-sevenpreneur-white">
                        {action.name}
                      </p>
                      <div className="flex gap-1">
                        <AppButton
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() =>
                            handleStartEdit(
                              action.id,
                              action.name,
                              action.summary ?? ""
                            )
                          }
                        >
                          <Pencil className="size-4" />
                        </AppButton>
                        <AppButton
                          variant="ghost"
                          size="icon"
                          type="button"
                          onClick={() => setDeleteTargetId(action.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </AppButton>
                      </div>
                    </div>
                    {action.summary && (
                      <p className=" text-sm text-foreground whitespace-pre-wrap">
                        {action.summary}
                      </p>
                    )}
                    <p className="text-xs text-emphasis ">
                      {dayjs(action.created_at).format("D MMM YYYY HH:mm")}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deleteTargetId !== null && (
        <AppAlertConfirmDialog
          alertDialogHeader="Delete this activity?"
          alertDialogMessage="This activity will be removed permanently."
          alertCancelLabel="Cancel"
          alertConfirmLabel="Delete"
          isOpen={deleteTargetId !== null}
          onClose={() => setDeleteTargetId(null)}
          onConfirm={() => {
            handleDelete(deleteTargetId);
            setDeleteTargetId(null);
          }}
        />
      )}
    </div>
  );
}
