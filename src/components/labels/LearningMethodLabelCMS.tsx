"use client";
import { SessionMethod } from "@/lib/app-types";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  SessionMethod,
  {
    variant: AppBasedLabelVariant;
  }
> = {
  ONLINE: {
    variant: "blue",
  },
  ONSITE: {
    variant: "purple",
  },
  HYBRID: {
    variant: "green",
  },
};

interface LearningMethodCMSProps {
  labelName: string;
  variants: SessionMethod;
}

export default function LearningMethodLabelCMS({
  labelName,
  variants,
}: LearningMethodCMSProps) {
  const { variant } = variantStyles[variants];

  return <AppBasedLabel variant={variant}>{labelName}</AppBasedLabel>;
}
