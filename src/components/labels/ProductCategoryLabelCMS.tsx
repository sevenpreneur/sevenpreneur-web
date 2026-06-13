"use client";
import { ProductCategory } from "@/lib/app-types";
import {
  faFlag,
  faPenNib,
  faPersonChalkboard,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ReactNode } from "react";
import AppBasedLabel, { AppBasedLabelVariant } from "./AppBasedLabel";

const variantStyles: Record<
  ProductCategory,
  {
    variant: AppBasedLabelVariant;
    labelIcon: ReactNode;
    labelName: string;
  }
> = {
  COHORT: {
    variant: "purple",
    labelIcon: <FontAwesomeIcon icon={faPersonChalkboard} className="size-3" />,
    labelName: "Cohort",
  },
  PLAYLIST: {
    variant: "blue",
    labelIcon: <FontAwesomeIcon icon={faPlay} className="size-3" />,
    labelName: "Playlist",
  },
  AI: {
    variant: "green",
    labelIcon: <FontAwesomeIcon icon={faPenNib} className="size-3" />,
    labelName: "AI",
  },
  EVENT: {
    variant: "green",
    labelIcon: <FontAwesomeIcon icon={faFlag} className="size-3" />,
    labelName: "Event",
  },
};

interface ProductCategoryLabelCMSProps {
  variants: ProductCategory;
}

export default function ProductCategoryLabelCMS({
  variants,
}: ProductCategoryLabelCMSProps) {
  const { variant, labelIcon, labelName } = variantStyles[variants];

  return (
    <AppBasedLabel variant={variant}>
      {labelIcon}
      {labelName}
    </AppBasedLabel>
  );
}
