"use client";
import type {
  B2BProbabilityStatusEnum,
  B2BProductEnum,
  B2BStageEnum,
} from "@/lib/app-types";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import AppButton from "../buttons/AppButton";
import AppSelect from "../fields/AppSelect";

export const B2B_YEAR_OPTIONS = [2026, 2027, 2028, 2029, 2030].map((y) => ({
  label: String(y),
  value: y,
}));

const PRODUCT_OPTIONS: { label: string; value: B2BProductEnum }[] = [
  { label: "Sponsorship", value: "SPONSORSHIP" },
  { label: "Corporate Training", value: "CORPORATE_TRAINING" },
  { label: "Corporate AI Training", value: "CORPORATE_AI_TRAINING" },
];

const STAGE_OPTIONS: { label: string; value: B2BStageEnum }[] = [
  { label: "Lead Identified", value: "LEAD_IDENTIFIED" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Negotiation", value: "NEGOTIATION" },
  { label: "Verbal Commit", value: "VERBAL_COMMIT" },
  { label: "Closed Won", value: "CLOSED_WON" },
  { label: "Closed Lost", value: "CLOSED_LOST" },
  { label: "On Hold", value: "ON_HOLD" },
];

const PROBABILITY_STATUS_OPTIONS: {
  label: string;
  value: B2BProbabilityStatusEnum;
}[] = [
  { label: "Cold", value: "COLD" },
  { label: "Warm", value: "WARM" },
  { label: "Hot", value: "HOT" },
];

// Enum filters surfaced in the modal — keyed by the tRPC input field.
export const B2B_FILTER_CONFIGS = [
  { key: "product", label: "Product", options: PRODUCT_OPTIONS },
  { key: "stage", label: "Stage", options: STAGE_OPTIONS },
  {
    key: "probability_status",
    label: "Status",
    options: PROBABILITY_STATUS_OPTIONS,
  },
] as const;

export type B2BFilterKey = (typeof B2B_FILTER_CONFIGS)[number]["key"];

export interface B2BPipelineFilters {
  year: number | "";
  product: string;
  stage: string;
  probability_status: string;
}

export const EMPTY_B2B_FILTERS: B2BPipelineFilters = {
  year: "",
  product: "",
  stage: "",
  probability_status: "",
};

// Human-readable label for an applied enum filter (used by the chips outside).
export function getB2BFilterLabel(key: B2BFilterKey, value: string) {
  const config = B2B_FILTER_CONFIGS.find((c) => c.key === key);
  return config?.options.find((o) => o.value === value)?.label ?? value;
}

interface FilterB2BPipelineProps {
  isOpen: boolean;
  initialFilters: B2BPipelineFilters;
  onClose: () => void;
  onApply: (filters: B2BPipelineFilters) => void;
}

export default function FilterB2BPipeline({
  isOpen,
  initialFilters,
  onClose,
  onApply,
}: FilterB2BPipelineProps) {
  const [draft, setDraft] = useState<B2BPipelineFilters>(initialFilters);

  // Block scroll behind the modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Sync the draft to the currently-applied filters each time the modal opens.
  // Only keyed on `isOpen` so in-modal edits aren't reset on every re-render.
  useEffect(() => {
    if (isOpen) setDraft(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const setField = (key: keyof B2BPipelineFilters, value: string | number) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => setDraft(EMPTY_B2B_FILTERS);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <div
      className="root fixed inset-0 flex w-full h-full items-end justify-center bg-black/40 z-50 dark:bg-black/70"
      onClick={onClose}
    >
      <div
        className="container-filter fixed flex flex-col bg-white w-full max-w-[calc(100%-2rem)] p-6 gap-5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg shadow-md dark:bg-surface-black sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="filter-header flex flex-col">
          <h2 className="text-lg font-semibold">Filter Pipeline</h2>
          <p className="text-emphasis text-sm font-medium">
            Narrow down leads by year, product, stage, or status.
          </p>
        </div>

        <div className="filter-body flex flex-col gap-4">
          <AppSelect
            variant="CMS"
            selectId="filter-year"
            selectName="Year"
            selectPlaceholder="All years"
            value={draft.year}
            onChange={(value) =>
              setField("year", value === null ? "" : Number(value))
            }
            options={B2B_YEAR_OPTIONS}
          />
          {B2B_FILTER_CONFIGS.map((config) => (
            <AppSelect
              key={config.key}
              variant="CMS"
              selectId={`filter-${config.key}`}
              selectName={config.label}
              selectPlaceholder={`All ${config.label.toLowerCase()}`}
              value={draft[config.key]}
              onChange={(value) =>
                setField(config.key, value === null ? "" : String(value))
              }
              options={config.options}
            />
          ))}
        </div>

        <div className="button-action flex gap-2 justify-end">
          <AppButton variant="light" size="medium" onClick={handleReset}>
            Reset
          </AppButton>
          <AppButton variant="tertiary" size="medium" onClick={handleApply}>
            Apply Filters
          </AppButton>
        </div>

        <div
          className="absolute flex top-4 right-4 hover:cursor-pointer"
          onClick={onClose}
        >
          <X className="size-6" />
        </div>
      </div>
    </div>
  );
}
