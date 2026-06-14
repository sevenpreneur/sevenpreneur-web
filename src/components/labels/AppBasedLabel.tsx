"use client";
import { ReactNode } from "react";

export type AppBasedLabelVariant =
  | "purple"
  | "yellow"
  | "blue"
  | "green"
  | "gray"
  | "pink"
  | "red"
  | "orange";

// Colors are lifted from RolesLabelCMS (and the WARM tint from
// LeadStatusLabelCMS for orange). The border uses the text color while the
// background uses its soft tint.
const variantStyles: Record<
  AppBasedLabelVariant,
  {
    textColor: string;
    borderColor: string;
    backgroundColor: string;
  }
> = {
  purple: {
    textColor: "text-[#42359B] dark:text-[#9088c4]",
    borderColor: "border-[#A19ACD] dark:border-[#484462]",
    backgroundColor: "bg-[#EFEDF9] dark:bg-tertiary/15",
  },
  yellow: {
    textColor: "text-warning-foreground",
    borderColor: "border-[#ECCF80] dark:border-[#6D4F00]",
    backgroundColor: "bg-warning-background",
  },
  blue: {
    textColor: "text-[#164EA6] dark:text-[#6f96d4]",
    borderColor: "border-[#8BA7D3] dark:border-[#384B6A]",
    backgroundColor: "bg-[#E2F0FF] dark:bg-primary/15",
  },
  green: {
    textColor: "text-[#067647] dark:text-success-foreground",
    borderColor: "border-[#83BBA3] dark:border-[#254F4B]",
    backgroundColor: "bg-[#ECFDF3] dark:bg-success/15",
  },
  gray: {
    textColor: "text-[#41474E] dark:text-[#bbbbbb]",
    borderColor: "border-[#A0A3A7] dark:border-[#5E5E5E]",
    backgroundColor: "bg-[#F3F5F9] dark:bg-[#2a2a2a]",
  },
  pink: {
    textColor: "text-secondary-soft-foreground",
    borderColor: "border-[#F3A6BC] dark:border-[#6A4853]",
    backgroundColor: "bg-[#FDE7EE] dark:bg-secondary/15",
  },
  red: {
    textColor: "text-destructive-soft-foreground dark:text-[#f0628a]",
    borderColor: "border-[#F3918A] dark:border-[#7a2438]",
    backgroundColor: "bg-[#FEE6E4] dark:bg-destructive/15",
  },
  orange: {
    textColor: "text-[#FB7A36]",
    borderColor: "border-[#FDBD9B] dark:border-[#7E3D1B]",
    backgroundColor: "bg-[#FEEFE6] dark:bg-[#FB7A36]/15",
  },
};

interface AppBasedLabelProps {
  variant: AppBasedLabelVariant;
  children: ReactNode;
  className?: string;
}

export default function AppBasedLabel({
  variant,
  children,
  className,
}: AppBasedLabelProps) {
  const { textColor, borderColor, backgroundColor } = variantStyles[variant];

  return (
    <div
      className={`label-container inline-flex items-center justify-center gap-1 py-0.5 px-2 rounded-full border text-[13px] font-semibold truncate ${textColor} ${borderColor} ${backgroundColor} ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
