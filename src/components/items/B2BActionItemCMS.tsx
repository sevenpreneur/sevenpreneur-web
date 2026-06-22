"use client";

import B2BActionPriorityLabelCMS from "@/components/labels/B2BActionPriorityLabelCMS";
import type { B2BActionPriorityEnum } from "@prisma/client";
import dayjs from "dayjs";
import { CalendarClock, Trash2 } from "lucide-react";
import Image from "next/image";

interface B2BActionItemCMSProps {
  action: {
    id: number;
    name: string;
    priority: B2BActionPriorityEnum;
    due_date: Date | string | null;
    assignee_name: string | null;
    assignee_avatar: string | null;
  };
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const initials = (name: string | null) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
};

const dueLabel = (due: Date | string | null) => {
  if (!due) return null;
  const target = dayjs(due).startOf("day");
  const diff = target.diff(dayjs().startOf("day"), "day");
  if (diff < 0) return { text: `${Math.abs(diff)}d late`, late: true };
  if (diff === 0) return { text: "Today", late: false };
  return { text: target.format("MMM D"), late: false };
};

export default function B2BActionItemCMS({
  action,
  isDragging,
  onDragStart,
  onDragEnd,
  onEdit,
  onDelete,
}: B2BActionItemCMSProps) {
  const due = dueLabel(action.due_date);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onEdit}
      className={`kanban-card group relative flex flex-col gap-2 rounded-md border border-dashboard-border bg-background p-3 transition-all hover:border-tertiary/40 hover:bg-[#F7F4FF] dark:hover:bg-[#080020] hover:cursor-pointer active:cursor-grabbing ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold line-clamp-3 text-foreground dark:text-sevenpreneur-white">
          {action.name}
        </p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="shrink-0 text-emphasis opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive hover:cursor-pointer"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <B2BActionPriorityLabelCMS variants={action.priority} />
          {due && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                due.late ? "text-destructive" : "text-emphasis"
              }`}
            >
              <CalendarClock className="size-3.5" />
              {due.text}
            </span>
          )}
        </div>
        <div className="assignee flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card-inside-bg text-[10px] font-semibold text-emphasis">
          {action.assignee_avatar ? (
            <Image
              src={action.assignee_avatar}
              alt={action.assignee_name ?? ""}
              width={24}
              height={24}
              className="size-full object-cover"
            />
          ) : (
            initials(action.assignee_name)
          )}
        </div>
      </div>
    </div>
  );
}
