"use client";
import { SubmissionStatus } from "@/lib/app-types";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  SubmissionStatus,
  {
    variant: AppBasedLabelVariant;
    labelText: string;
  }
> = {
  SUBMITTED: {
    variant: "green",
    labelText: "SUBMITTED",
  },
  NOT_SUBMITTED: {
    variant: "red",
    labelText: "NOT SUBMITTED",
  },
};

interface SubmissionStatusLabelLMSProps {
  variant: SubmissionStatus;
}

export default function SubmissionStatusLabelLMS({
  variant,
}: SubmissionStatusLabelLMSProps) {
  const { variant: labelVariant, labelText } = variantStyles[variant];

  return <AppBasedLabel variant={labelVariant}>{labelText}</AppBasedLabel>;
}
