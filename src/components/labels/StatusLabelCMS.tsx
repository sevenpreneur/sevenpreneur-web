"use client";
import { StatusType } from "@/lib/app-types";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  StatusType,
  {
    variant: AppBasedLabelVariant;
    label: string;
  }
> = {
  ACTIVE: {
    variant: "green",
    label: "ACTIVE",
  },
  INACTIVE: {
    variant: "red",
    label: "INACTIVE",
  },
};

interface StatusLabelCMSProps {
  variants: StatusType;
}

export default function StatusLabelCMS({ variants }: StatusLabelCMSProps) {
  const { variant, label } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      <div className="flex size-2 rounded-full bg-current" />
      {label}
    </AppBasedLabel>
  );
}
