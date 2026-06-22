"use client";
import { trpc } from "@/trpc/client";
import {
  B2BProbabilityStatusEnum,
  B2BProductEnum,
  B2BSourceEnum,
  B2BStageEnum,
} from "@prisma/client";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import AppSheet from "../modals/AppSheet";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";
import { Slider } from "../ui/slider";

interface EditB2BLeadFormCMSProps {
  sessionToken: string;
  pipelineId: number;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_AVATAR =
  "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur/default-avatar.svg.png";

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

export default function EditB2BLeadFormCMS(props: EditB2BLeadFormCMSProps) {
  const utils = trpc.useUtils();
  const updatePipeline = trpc.update.b2b.pipeline.useMutation();

  // Read the lead first; the form only renders once this is ready.
  const {
    data: pipelineData,
    isLoading,
    isError,
  } = trpc.read.b2b.pipeline.useQuery(
    { id: props.pipelineId },
    { enabled: !!props.sessionToken && props.isOpen }
  );
  const initialData = pipelineData?.pipeline;

  // Internal team members that a lead can be assigned to.
  const { data: usersData } = trpc.list.users.useQuery(
    { role_ids: [0, 2, 4, 6], page_size: 200 },
    { enabled: !!props.sessionToken && props.isOpen }
  );
  const assigneeOptions =
    usersData?.list.map((u) => ({
      label: u.full_name,
      value: u.id,
      image: u.avatar || DEFAULT_AVATAR,
    })) ?? [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_id: "" as number | "",
    company_name: "",
    industry_name: "",
    pic_name: "",
    pic_job_title: "",
    pic_wa: "",
    pic_email: "",
    product: "" as B2BProductEnum | "",
    source: "" as B2BSourceEnum | "",
    stage: B2BStageEnum.LEAD_IDENTIFIED as B2BStageEnum,
    probability_status:
      B2BProbabilityStatusEnum.COLD as B2BProbabilityStatusEnum,
    probability: 50,
    project_value: "",
    project_start_month: "",
    project_end_month: "",
    assignee_id: "" as string,
  });

  // Prefill from the fetched lead.
  useEffect(() => {
    if (!initialData) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      name: initialData.name,
      company_id: initialData.company_id,
      company_name: initialData.company_name,
      industry_name: initialData.industry_name,
      pic_name: initialData.pic_name ?? "",
      pic_job_title: initialData.pic_job_title ?? "",
      pic_wa: initialData.pic_wa ?? "",
      pic_email: initialData.pic_email ?? "",
      product: initialData.product,
      source: initialData.source ?? "",
      stage: initialData.stage,
      probability_status: initialData.probability_status,
      probability: initialData.probability,
      project_value: String(initialData.project_value),
      project_start_month: initialData.project_start_month
        ? dayjs(initialData.project_start_month).format("YYYY-MM")
        : "",
      project_end_month: initialData.project_end_month
        ? dayjs(initialData.project_end_month).format("YYYY-MM")
        : "",
      assignee_id: initialData.owner_id,
    });
  }, [initialData]);

  const handleInputChange = (fieldName: string) => (value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const fail = (message: string) => {
      toast.error(message);
      setIsSubmitting(false);
    };

    if (!formData.name.trim()) return fail("Program name is required.");
    if (!formData.company_id) return fail("Company is missing.");
    if (!formData.product) return fail("Pick a product type.");
    if (!formData.stage) return fail("Pick a pipeline stage.");
    if (!formData.probability_status) return fail("Pick a status.");

    const probability = formData.probability;
    if (!Number.isInteger(probability) || probability < 0 || probability > 100)
      return fail("Probability must be between 0 and 100.");

    const projectValue = Number(formData.project_value);
    if (!Number.isFinite(projectValue) || projectValue < 0)
      return fail("Project value must be a non-negative number.");

    if (
      formData.project_start_month &&
      formData.project_end_month &&
      formData.project_end_month < formData.project_start_month
    )
      return fail("Project end month must be on or after start month.");

    if (!formData.assignee_id)
      return fail("Assign this lead to a team member.");

    try {
      await updatePipeline.mutateAsync({
        id: props.pipelineId,
        name: formData.name.trim(),
        company_id: Number(formData.company_id),
        product: formData.product as B2BProductEnum,
        source: (formData.source as B2BSourceEnum) || null,
        stage: formData.stage,
        probability,
        probability_status: formData.probability_status,
        project_value: projectValue,
        project_start_month: formData.project_start_month
          ? `${formData.project_start_month}-01`
          : null,
        project_end_month: formData.project_end_month
          ? `${formData.project_end_month}-01`
          : null,
        owner_id: formData.assignee_id,
      });

      toast.success("Lead updated.");
      setIsSubmitting(false);
      utils.list.b2b.pipelines.invalidate();
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
      sheetDescription="Update this B2B lead's details."
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
      {isLoading && <AppLoadingComponents />}
      {isError && <AppErrorComponents />}

      {initialData && !isLoading && !isError && (
        <form
          className="relative w-full flex flex-col flex-1 min-h-0"
          onSubmit={handleSubmit}
        >
          <div className="form-container flex flex-col flex-1 min-h-0 px-6 pb-64 gap-5 overflow-y-auto">
            <div className="group-input flex flex-col gap-4">
              <AppInput
                variant="CMS"
                inputId="lead-name"
                inputName="Program Name"
                inputType="text"
                inputPlaceholder="e.g. AI Bootcamp Q3 Sponsorship"
                value={formData.name}
                onInputChange={handleInputChange("name")}
                required
              />

              {/* Company details: read-only breakdown of the linked company */}
              <div className="flex flex-col gap-4 p-4 bg-card-bg/50 border border-dashboard-border rounded-md dark:bg-card-inside-bg">
                <AppInput
                  variant="CMS"
                  inputId="lead-company-name"
                  inputName="Company Name"
                  inputType="text"
                  value={formData.company_name}
                  onInputChange={() => {}}
                  disabled
                />
                <AppInput
                  variant="CMS"
                  inputId="lead-industry"
                  inputName="Industry"
                  inputType="text"
                  value={formData.industry_name}
                  onInputChange={() => {}}
                  disabled
                />
                <AppInput
                  variant="CMS"
                  inputId="lead-pic-name"
                  inputName="PIC Name"
                  inputType="text"
                  value={formData.pic_name}
                  onInputChange={() => {}}
                  disabled
                />
                <AppInput
                  variant="CMS"
                  inputId="lead-pic-job-title"
                  inputName="PIC Job Title"
                  inputType="text"
                  value={formData.pic_job_title}
                  onInputChange={() => {}}
                  disabled
                />
                <AppInput
                  variant="CMS"
                  inputId="lead-pic-wa"
                  inputName="PIC WhatsApp"
                  inputType="text"
                  value={formData.pic_wa}
                  onInputChange={() => {}}
                  disabled
                />
                <AppInput
                  variant="CMS"
                  inputId="lead-pic-email"
                  inputName="PIC Email"
                  inputType="email"
                  value={formData.pic_email}
                  onInputChange={() => {}}
                  disabled
                />
              </div>

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
                selectId="lead-stage"
                selectName="Stage"
                selectPlaceholder="Current pipeline stage"
                value={formData.stage}
                onChange={handleInputChange("stage")}
                options={STAGE_OPTIONS}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-probability-status"
                selectName="Status"
                selectPlaceholder="Pick a status"
                value={formData.probability_status}
                onChange={handleInputChange("probability_status")}
                options={PROBABILITY_STATUS_OPTIONS}
                required
              />

              {/* Probability as a slider, mirroring the WA Lead Details UI */}
              <div className="flex flex-col gap-1">
                <label className="flex pl-1 gap-0.5 text-sm text-sb-text-strong font-semibold">
                  Probability
                  <span className="text-destructive">*</span>
                </label>
                <div className="flex w-full items-center gap-3 pl-1">
                  <Slider
                    value={[formData.probability]}
                    max={100}
                    step={5}
                    onValueChange={(values) =>
                      handleInputChange("probability")(values[0])
                    }
                  />
                  <div className="w-10 text-right text-sm text-emphasis font-medium">
                    {formData.probability}%
                  </div>
                </div>
              </div>

              <AppInput
                variant="CMS"
                inputId="lead-project-value"
                inputName="Project Value (IDR)"
                inputType="number"
                inputPlaceholder="e.g. 50000000"
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

              <AppSelect
                variant="CMS"
                selectId="lead-assignee"
                selectName="Assign To"
                selectPlaceholder="Pick a team member"
                value={formData.assignee_id}
                onChange={handleInputChange("assignee_id")}
                options={assigneeOptions}
                required
              />
              <AppSelect
                variant="CMS"
                selectId="lead-source"
                selectName="Source (optional)"
                selectPlaceholder="How did this lead come in?"
                value={formData.source}
                onChange={handleInputChange("source")}
                options={SOURCE_OPTIONS}
              />
            </div>
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
