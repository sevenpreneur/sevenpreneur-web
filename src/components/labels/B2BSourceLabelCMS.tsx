"use client";
import { B2BSourceEnum } from "@prisma/client";
import { Calendar, Globe, Hash, Network, UserPlus, Users } from "lucide-react";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  B2BSourceEnum,
  {
    variant: AppBasedLabelVariant;
    labelIcon: ReactNode;
    labelName: string;
  }
> = {
  SOCIAL_MEDIA: {
    variant: "blue",
    labelIcon: <Hash className="size-3" />,
    labelName: "Social Media",
  },
  FOUNDER_NETWORK: {
    variant: "purple",
    labelIcon: <Network className="size-3" />,
    labelName: "Founder Network",
  },
  EVENT_CONFERENCE: {
    variant: "yellow",
    labelIcon: <Calendar className="size-3" />,
    labelName: "Event / Conference",
  },
  REFERRAL_PARTNER: {
    variant: "green",
    labelIcon: <UserPlus className="size-3" />,
    labelName: "Referral Partner",
  },
  REFERRAL_CLIENT: {
    variant: "green",
    labelIcon: <Users className="size-3" />,
    labelName: "Referral Client",
  },
  WEBSITE: {
    variant: "gray",
    labelIcon: <Globe className="size-3" />,
    labelName: "Website",
  },
};

interface B2BSourceLabelCMSProps {
  variants: B2BSourceEnum;
}

export default function B2BSourceLabelCMS({
  variants,
}: B2BSourceLabelCMSProps) {
  const { variant, labelIcon, labelName } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {labelName}
    </AppBasedLabel>
  );
}
