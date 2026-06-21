"use client";
import { B2BActionPriorityEnum } from "@prisma/client";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUp,
  Equal,
  LucideIcon,
} from "lucide-react";

const variantStyles: Record<
  B2BActionPriorityEnum,
  { icon: LucideIcon; iconColor: string }
> = {
  LOW: { icon: ChevronDown, iconColor: "text-primary" },
  MEDIUM: {
    icon: Equal,
    iconColor: "text-warning-foreground",
  },
  HIGH: {
    icon: ChevronUp,
    iconColor: "text-success-foreground",
  },
  URGENT: {
    icon: ChevronsUp,
    iconColor: "text-destructive",
  },
};

interface B2BActionPriorityLabelCMSProps {
  variants: B2BActionPriorityEnum;
}

export default function B2BActionPriorityLabelCMS({
  variants,
}: B2BActionPriorityLabelCMSProps) {
  const { icon: Icon, iconColor } = variantStyles[variants];

  return (
    <div className="inline-flex items-center justify-center gap-1 rounded-md bg-card-bg border border-dashboard-border size-6 text-emphasis">
      <Icon className={`size-4 ${iconColor}`} />
    </div>
  );
}
