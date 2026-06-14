"use client";
import { LeadStatus } from "@/lib/app-types";
import {
  faFire,
  faMugHot,
  faSnowflake,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  LeadStatus,
  {
    variant: AppBasedLabelVariant;
    name: string;
    labelIcon: ReactNode;
  }
> = {
  HOT: {
    variant: "red",
    name: "Hot",
    labelIcon: <FontAwesomeIcon icon={faFire} />,
  },
  WARM: {
    variant: "orange",
    name: "Warm",
    labelIcon: <FontAwesomeIcon icon={faMugHot} />,
  },
  COLD: {
    variant: "blue",
    name: "Cold",
    labelIcon: <FontAwesomeIcon icon={faSnowflake} />,
  },
};

interface LeadStatusLabelCMSProps {
  variants: LeadStatus;
}

export default function LeadStatusLabelCMS(props: LeadStatusLabelCMSProps) {
  const { variant, name, labelIcon } = variantStyles[props.variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {name}
    </AppBasedLabel>
  );
}
