"use client";
import { X } from "lucide-react";
import AppBasedLabel from "./AppBasedLabel";

interface FilterLabelCMSProps {
  filterName: string;
  removeFilter: () => void;
}

export default function FilterLabelCMS({
  filterName,
  removeFilter,
}: FilterLabelCMSProps) {
  return (
    <AppBasedLabel variant="blue">
      {filterName}
      <X
        className="size-4 transform transition-all hover:cursor-pointer active:scale-95"
        onClick={removeFilter}
      />
    </AppBasedLabel>
  );
}
