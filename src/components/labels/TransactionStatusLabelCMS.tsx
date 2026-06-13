"use client";
import { TransactionStatus } from "@/lib/app-types";
import { Check, ClockFading, X } from "lucide-react";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  TransactionStatus,
  {
    variant: AppBasedLabelVariant;
    statusWord: string;
    statusIcon: ReactNode;
  }
> = {
  PAID: {
    variant: "green",
    statusWord: "Paid",
    statusIcon: <Check className="size-3" />,
  },
  PENDING: {
    variant: "yellow",
    statusWord: "Pending",
    statusIcon: <ClockFading className="size-3" />,
  },
  FAILED: {
    variant: "red",
    statusWord: "Failed",
    statusIcon: <X className="size-3" />,
  },
};

interface TransactionStatusLabelCMSProps {
  variants: TransactionStatus;
}

export default function TransactionStatusLabelCMS({
  variants,
}: TransactionStatusLabelCMSProps) {
  const { variant, statusWord, statusIcon } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {statusIcon}
      {statusWord}
    </AppBasedLabel>
  );
}
