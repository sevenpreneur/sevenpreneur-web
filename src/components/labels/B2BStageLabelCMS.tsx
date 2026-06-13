"use client";
import { B2BStageEnum } from "@prisma/client";
import {
  CheckCircle2,
  Handshake,
  MessagesSquare,
  PauseCircle,
  PhoneCall,
  Target,
  XCircle,
} from "lucide-react";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  B2BStageEnum,
  {
    variant: AppBasedLabelVariant;
    labelIcon: ReactNode;
    labelName: string;
  }
> = {
  LEAD_IDENTIFIED: {
    variant: "gray",
    labelIcon: <Target className="size-3" />,
    labelName: "Lead Identified",
  },
  CONTACTED: {
    variant: "blue",
    labelIcon: <PhoneCall className="size-3" />,
    labelName: "Contacted",
  },
  NEGOTIATION: {
    variant: "purple",
    labelIcon: <MessagesSquare className="size-3" />,
    labelName: "Negotiation",
  },
  VERBAL_COMMIT: {
    variant: "yellow",
    labelIcon: <Handshake className="size-3" />,
    labelName: "Verbal Commit",
  },
  CLOSED_WON: {
    variant: "green",
    labelIcon: <CheckCircle2 className="size-3" />,
    labelName: "Closed Won",
  },
  CLOSED_LOST: {
    variant: "red",
    labelIcon: <XCircle className="size-3" />,
    labelName: "Closed Lost",
  },
  ON_HOLD: {
    variant: "gray",
    labelIcon: <PauseCircle className="size-3" />,
    labelName: "On Hold",
  },
};

interface B2BStageLabelCMSProps {
  variants: B2BStageEnum;
}

export default function B2BStageLabelCMS({ variants }: B2BStageLabelCMSProps) {
  const { variant, labelIcon, labelName } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {labelName}
    </AppBasedLabel>
  );
}
