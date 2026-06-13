"use client";
import { B2BProductEnum } from "@prisma/client";
import { Briefcase, GraduationCap, Sparkles } from "lucide-react";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  B2BProductEnum,
  {
    variant: AppBasedLabelVariant;
    labelIcon: ReactNode;
    labelName: string;
  }
> = {
  SPONSORSHIP: {
    variant: "purple",
    labelIcon: <Briefcase className="size-3" />,
    labelName: "Sponsorship",
  },
  CORPORATE_TRAINING: {
    variant: "blue",
    labelIcon: <GraduationCap className="size-3" />,
    labelName: "Corporate Training",
  },
  CORPORATE_AI_TRAINING: {
    variant: "green",
    labelIcon: <Sparkles className="size-3" />,
    labelName: "Corporate AI Training",
  },
};

interface B2BProductLabelCMSProps {
  variants: B2BProductEnum;
}

export default function B2BProductLabelCMS({
  variants,
}: B2BProductLabelCMSProps) {
  const { variant, labelIcon, labelName } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {labelName}
    </AppBasedLabel>
  );
}
