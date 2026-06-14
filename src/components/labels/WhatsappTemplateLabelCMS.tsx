"use client";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

// WhatsApp message template status (Meta values).
const statusStyles: Record<
  string,
  { variant: AppBasedLabelVariant; label: string }
> = {
  APPROVED: { variant: "green", label: "Approved" },
  PENDING: { variant: "yellow", label: "Pending" },
  IN_APPEAL: { variant: "blue", label: "In Appeal" },
  PAUSED: { variant: "orange", label: "Paused" },
  PENDING_DELETION: { variant: "orange", label: "Pending Deletion" },
  DISABLED: { variant: "gray", label: "Disabled" },
  REJECTED: { variant: "red", label: "Rejected" },
  DELETED: { variant: "red", label: "Deleted" },
  LIMIT_EXCEEDED: { variant: "red", label: "Limit Exceeded" },
};

export function WhatsappTemplateStatusLabelCMS({ status }: { status: string }) {
  const style = statusStyles[status.toUpperCase()] ?? {
    variant: "gray" as AppBasedLabelVariant,
    label: status,
  };

  return <AppBasedLabel variant={style.variant}>{style.label}</AppBasedLabel>;
}

// WhatsApp message template quality rating (Meta quality_score.score).
const qualityStyles: Record<
  string,
  { variant: AppBasedLabelVariant; label: string }
> = {
  GREEN: { variant: "green", label: "High" },
  YELLOW: { variant: "yellow", label: "Medium" },
  RED: { variant: "red", label: "Low" },
  UNKNOWN: { variant: "gray", label: "Unknown" },
};

export function WhatsappTemplateQualityLabelCMS({
  quality,
}: {
  quality: string;
}) {
  const style = qualityStyles[quality.toUpperCase()] ?? {
    variant: "gray" as AppBasedLabelVariant,
    label: quality,
  };

  return <AppBasedLabel variant={style.variant}>{style.label}</AppBasedLabel>;
}
