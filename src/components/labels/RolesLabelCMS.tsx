"use client";
import { RolesUser } from "@/lib/app-types";
import {
  faBuildingUser,
  faBullhorn,
  faChalkboardUser,
  faPenNib,
  faUser,
  faUserGear,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  RolesUser,
  {
    variant: AppBasedLabelVariant;
    labelIcon: ReactNode;
  }
> = {
  superAdmin: {
    variant: "purple",
    labelIcon: <FontAwesomeIcon icon={faBuildingUser} />,
  },
  administrator: {
    variant: "yellow",
    labelIcon: <FontAwesomeIcon icon={faUserGear} />,
  },
  educator: {
    variant: "blue",
    labelIcon: <FontAwesomeIcon icon={faChalkboardUser} />,
  },
  classManager: {
    variant: "green",
    labelIcon: <FontAwesomeIcon icon={faPenNib} />,
  },
  generalUser: {
    variant: "gray",
    labelIcon: <FontAwesomeIcon icon={faUser} />,
  },
  marketer: {
    variant: "pink",
    labelIcon: <FontAwesomeIcon icon={faBullhorn} />,
  },
};

interface RolesLabelCMSProps {
  labelName: string;
  variants: RolesUser;
}

export default function RolesLabelCMS({
  labelName,
  variants,
}: RolesLabelCMSProps) {
  const { variant, labelIcon } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {labelName}
    </AppBasedLabel>
  );
}
