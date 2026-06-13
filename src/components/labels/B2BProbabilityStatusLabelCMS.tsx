"use client";
import { B2BProbabilityStatusEnum } from "@prisma/client";
import { Flame, Snowflake, ThermometerSun } from "lucide-react";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  B2BProbabilityStatusEnum,
  {
    variant: AppBasedLabelVariant;
    labelIcon: ReactNode;
    labelName: string;
  }
> = {
  COLD: {
    variant: "blue",
    labelIcon: <Snowflake className="size-3" />,
    labelName: "Cold",
  },
  WARM: {
    variant: "yellow",
    labelIcon: <ThermometerSun className="size-3" />,
    labelName: "Warm",
  },
  HOT: {
    variant: "red",
    labelIcon: <Flame className="size-3" />,
    labelName: "Hot",
  },
};

interface B2BProbabilityStatusLabelCMSProps {
  variants: B2BProbabilityStatusEnum;
}

export default function B2BProbabilityStatusLabelCMS({
  variants,
}: B2BProbabilityStatusLabelCMSProps) {
  const { variant, labelIcon, labelName } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {labelName}
    </AppBasedLabel>
  );
}
