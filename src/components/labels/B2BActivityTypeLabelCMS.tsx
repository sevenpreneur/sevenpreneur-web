"use client";
import { B2BActivityTypeEnum } from "@prisma/client";
import {
  CalendarClock,
  FileSignature,
  FileText,
  Headphones,
  Mail,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  B2BActivityTypeEnum,
  {
    variant: AppBasedLabelVariant;
    labelIcon: ReactNode;
    labelName: string;
  }
> = {
  CHAT_WHATSAPP: {
    variant: "green",
    labelIcon: <MessageCircle className="size-3" />,
    labelName: "WhatsApp Chat",
  },
  COLD_EMAIL: {
    variant: "blue",
    labelIcon: <Mail className="size-3" />,
    labelName: "Cold Email",
  },
  PHONE_CALL: {
    variant: "yellow",
    labelIcon: <Phone className="size-3" />,
    labelName: "Phone Call",
  },
  CONFERENCE_CALL: {
    variant: "purple",
    labelIcon: <Headphones className="size-3" />,
    labelName: "Conference Call",
  },
  OFFLINE_MEETING: {
    variant: "blue",
    labelIcon: <Users className="size-3" />,
    labelName: "Offline Meeting",
  },
  IN_PERSON_MEETING: {
    variant: "blue",
    labelIcon: <Users className="size-3" />,
    labelName: "In-Person Meeting",
  },
  SENT_PROPOSAL: {
    variant: "gray",
    labelIcon: <FileText className="size-3" />,
    labelName: "Sent Proposal",
  },
  SENT_CONTRACT: {
    variant: "green",
    labelIcon: <FileSignature className="size-3" />,
    labelName: "Sent Contract",
  },
  FOLLOW_UP: {
    variant: "yellow",
    labelIcon: <CalendarClock className="size-3" />,
    labelName: "Follow Up",
  },
};

interface B2BActivityTypeLabelCMSProps {
  variants: B2BActivityTypeEnum;
}

export default function B2BActivityTypeLabelCMS({
  variants,
}: B2BActivityTypeLabelCMSProps) {
  const { variant, labelIcon, labelName } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {labelName}
    </AppBasedLabel>
  );
}
