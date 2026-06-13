"use client";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  "true" | "false",
  {
    variant: AppBasedLabelVariant;
  }
> = {
  true: {
    variant: "green",
  },
  false: {
    variant: "red",
  },
};

interface BooleanLabelCMSProps {
  label: string;
  value: boolean;
}

export default function BooleanLabelCMS(props: BooleanLabelCMSProps) {
  const { variant } = variantStyles[String(props.value) as "true" | "false"];

  return (
    <AppBasedLabel variant={variant}>
      <div className="flex size-2 rounded-full bg-current" />
      {props.label}
    </AppBasedLabel>
  );
}
