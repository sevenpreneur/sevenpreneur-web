"use client";
import { B2BProbabilityStatusEnum } from "@prisma/client";
import { Flame, Snowflake, ThermometerSun } from "lucide-react";
import { ReactNode } from "react";

const variantStyles: Record<
  B2BProbabilityStatusEnum,
  {
    labelColor: string;
    labelIcon: ReactNode;
    labelName: string;
  }
> = {
  COLD: {
    labelColor:
      "text-[#164EA6] bg-[#E2F0FF] dark:text-[#6f96d4] dark:bg-primary/15",
    labelIcon: <Snowflake className="size-3" />,
    labelName: "Cold",
  },
  WARM: {
    labelColor: "text-warning-foreground bg-warning-background",
    labelIcon: <ThermometerSun className="size-3" />,
    labelName: "Warm",
  },
  HOT: {
    labelColor: "text-danger-foreground bg-danger-background",
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
  const { labelColor, labelIcon, labelName } = variantStyles[variants];
  return (
    <div
      className={`label-container inline-flex w-fit py-0.5 px-2 rounded-sm items-center justify-center gap-1 text-[13px] font-semibold  truncate ${labelColor}`}
    >
      {labelIcon}
      {labelName}
    </div>
  );
}
