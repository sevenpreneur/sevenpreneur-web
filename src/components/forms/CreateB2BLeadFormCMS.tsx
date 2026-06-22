"use client";
import { trpc } from "@/trpc/client";
import {
  B2BProbabilityStatusEnum,
  B2BProductEnum,
  B2BSourceEnum,
  B2BStageEnum,
} from "@prisma/client";
import { Loader2 } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import AppSheet from "../modals/AppSheet";
import { Switch } from "../ui/switch";
import { Slider } from "../ui/slider";

interface CreateB2BLeadFormCMSProps {
  sessionToken: string;
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

export default function CreateB2BLeadFormCMS(props: CreateB2BLeadFormCMSProps) {
  const utils = trpc.useUtils();
  const createPipeline = trpc.create.b2b.pipeline.useMutation();
  const { data: sessionData } = trpc.auth.checkSession.useQuery(undefined, {
    enabled: !!props.sessionToken,
  });

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
    { enabled: !!props.sessionToken && props.isOpen }
  );
  const companyOptions =
    companiesData?.list.map((entry) => ({
      label: entry.name,
      value: entry.id,
    })) ?? [];

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

  // Default is creating a new company; toggle on to pick an existing one.
  const [useExistingCompany, setUseExistingCompany] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company_id: "" as number | "",
    company_name: "",
    industry_id: "" as number | "",
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

  // Default the assignee to the current user once the session is ready.
  useEffect(() => {
    const currentUserId = sessionData?.user.id;
    if (currentUserId && !formData.assignee_id) {
      queueMicrotask(() =>
        setFormData((prev) => ({ ...prev, assignee_id: currentUserId }))
      );
    }
  }, [sessionData?.user.id, formData.assignee_id]);

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

    if (useExistingCompany) {
      if (!formData.company_id) return fail("Pick a company.");
    } else {
      if (!formData.company_name.trim())
        return fail("Company name is required.");
      if (!formData.industry_id) return fail("Pick an industry.");
    }

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

    createPipeline.mutate(
      {
        name: formData.name.trim(),
        ...(useExistingCompany
          ? { company_id: Number(formData.company_id) }
          : {
              new_company: {
                name: formData.company_name.trim(),
                industry_id: Number(formData.industry_id),
                pic_name: formData.pic_name.trim() || null,
                pic_job_title: formData.pic_job_title.trim() || null,
                pic_wa: formData.pic_wa.trim() || null,
                pic_email: formData.pic_email.trim() || null,
              },
            }),
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
      },
      {
        onSuccess: () => {
          toast.success("Lead created.");
          setIsSubmitting(false);
          utils.list.b2b.pipelines.invalidate();
          utils.list.b2b.companies.invalidate();
          props.onClose();
        },
        onError: (err) => {
          setIsSubmitting(false);
          toast.error("Failed to create lead.", { description: err.message });
        },
      }
    );
  };

  return (
    <AppSheet
      sheetName="Add New Lead"
      sheetDescription="Capture a new B2B lead. You can manage activities after creating it."
      isOpen={props.isOpen}
      onClose={props.onClose}
    >
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

            {/* Company: create a new one (default) or pick an existing one */}
            <div className="flex flex-col gap-3 p-4 bg-card-bg/50 border border-dashboard-border rounded-md dark:bg-card-inside-bg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-sb-text-strong">
                    Use existing company
                  </span>
                  <span className="text-[13px] text-emphasis">
                    Off creates a new company inline.
                  </span>
                </div>
                <Switch
                  className="data-[state=checked]:bg-tertiary"
                  checked={useExistingCompany}
                  onCheckedChange={(checked) => setUseExistingCompany(checked)}
                />
              </div>

              {useExistingCompany ? (
                <AppSelect
                  variant="CMS"
                  selectId="lead-company"
                  selectName="Company"
                  selectPlaceholder="Pick a company"
                  value={formData.company_id}
                  onChange={handleInputChange("company_id")}
                  options={companyOptions}
                  required
                />
              ) : (
                <div className="flex flex-col gap-4">
                  <AppInput
                    variant="CMS"
                    inputId="lead-company-name"
                    inputName="Company Name"
                    inputType="text"
                    inputPlaceholder="e.g. PT Maju Bersama"
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
                    inputPlaceholder="e.g. Budi Santoso"
                    value={formData.pic_name}
                    onInputChange={handleInputChange("pic_name")}
                  />
                  <AppInput
                    variant="CMS"
                    inputId="lead-pic-job-title"
                    inputName="PIC Job Title"
                    inputType="text"
                    inputPlaceholder="e.g. Head of L&D"
                    value={formData.pic_job_title}
                    onInputChange={handleInputChange("pic_job_title")}
                  />
                  <AppInput
                    variant="CMS"
                    inputId="lead-pic-wa"
                    inputName="PIC WhatsApp"
                    inputType="text"
                    inputPlaceholder="e.g. 6281234567890"
                    value={formData.pic_wa}
                    onInputChange={handleInputChange("pic_wa")}
                  />
                  <AppInput
                    variant="CMS"
                    inputId="lead-pic-email"
                    inputName="PIC Email"
                    inputType="email"
                    inputPlaceholder="e.g. budi@majubersama.co.id"
                    value={formData.pic_email}
                    onInputChange={handleInputChange("pic_email")}
                  />
                </div>
              )}
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
            Create Lead
          </AppButton>
        </div>
      </form>
    </AppSheet>
  );
}
