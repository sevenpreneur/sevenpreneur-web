"use client";
import { Switch } from "@/components/ui/switch";
import { StatusType } from "@/lib/app-types";
import { trpc } from "@/trpc/client";
import { EllipsisVertical, Settings2, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppDropdown from "../elements/AppDropdown";
import AppDropdownItemList from "../elements/AppDropdownItemList";
import EditAutomationFormCMS from "../forms/EditAutomationFormCMS";
import AppBasedLabel from "../labels/AppBasedLabel";
import StatusLabelCMS from "../labels/StatusLabelCMS";
import AppAlertConfirmDialog from "../modals/AppAlertConfirmDialog";

interface AutomationItemCardCMSProps {
  sessionToken: string;
  automationId: string;
  automationKey: string;
  description: string;
  tags: string | null;
  status: StatusType;
}

// Tags are stored as a single string separated by commas.
// e.g. "GPT Model, Haiku Model" -> ["GPT Model", "Haiku Model"]
function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export default function AutomationItemCardCMS({
  sessionToken,
  automationId,
  automationKey,
  description,
  tags,
  status,
}: AutomationItemCardCMSProps) {
  const utils = trpc.useUtils();
  const [isActionsOpened, setIsActionsOpened] = useState(false);
  const [editAutomation, setEditAutomation] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const tagList = parseTags(tags);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsActionsOpened(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Toggle kill switch (status)
  const toggleAutomation = trpc.update.automation.useMutation();
  const handleToggle = (checked: boolean) => {
    toggleAutomation.mutate(
      { id: automationId, status: checked ? "ACTIVE" : "INACTIVE" },
      {
        onSuccess: () => {
          toast.success(
            checked ? "Automation activated" : "Automation deactivated"
          );
          utils.list.automations.invalidate();
        },
        onError: (err) => {
          toast.error("Failed to update automation", {
            description: err.message,
          });
        },
      }
    );
  };

  // Delete automation
  const deleteAutomation = trpc.delete.automation.useMutation();
  const handleDelete = () => {
    deleteAutomation.mutate(
      { id: automationId },
      {
        onSuccess: () => {
          toast.success("Delete success");
          utils.list.automations.invalidate();
        },
        onError: (err) => {
          toast.error("Failed to delete automation", {
            description: err.message,
          });
        },
      }
    );
  };

  return (
    <React.Fragment>
      <div className="automation-card relative flex flex-col w-full h-full p-4 gap-3 bg-card-bg border border-dashboard-border rounded-lg">
        {/* Header: title + actions */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="automation-key font-jetbrains font-bold text-base text-foreground break-all pr-6 dark:text-sevenpreneur-white">
            {automationKey}
          </h3>
          <div className="automation-actions absolute top-3 right-3" ref={wrapperRef}>
            <div className="flex relative">
              <AppButton
                variant="ghost"
                size="small"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionsOpened((prev) => !prev);
                }}
              >
                <EllipsisVertical className="size-4" />
              </AppButton>
              <AppDropdown
                isOpen={isActionsOpened}
                alignDesktop="right"
                onClose={() => setIsActionsOpened(false)}
              >
                <AppDropdownItemList
                  menuIcon={<Settings2 className="size-4" />}
                  menuName="Edit Details"
                  onClick={() => setEditAutomation(true)}
                />
                <AppDropdownItemList
                  menuIcon={<Trash2 className="size-4" />}
                  menuName="Delete"
                  isDestructive
                  onClick={() => setDeleteConfirmation(true)}
                />
              </AppDropdown>
            </div>
          </div>
        </div>

        {/* Tags */}
        {tagList.length > 0 && (
          <div className="automation-tags flex flex-wrap items-center gap-1.5">
            {tagList.map((tag, index) => (
              <AppBasedLabel key={`${tag}-${index}`} variant="gray">
                {tag}
              </AppBasedLabel>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="automation-description font-medium text-sm text-emphasis line-clamp-3">
          {description}
        </p>

        {/* Footer: kill switch */}
        <div className="automation-switch flex items-center gap-2 mt-auto pt-1">
          <Switch
            className="data-[state=checked]:bg-tertiary"
            checked={status === "ACTIVE"}
            disabled={toggleAutomation.isPending}
            onCheckedChange={handleToggle}
          />
          <StatusLabelCMS variants={status} />
        </div>
      </div>

      {/* Edit Automation */}
      {editAutomation && (
        <EditAutomationFormCMS
          sessionToken={sessionToken}
          automationId={automationId}
          isOpen={editAutomation}
          onClose={() => setEditAutomation(false)}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirmation && (
        <AppAlertConfirmDialog
          alertDialogHeader="Permanently delete this item?"
          alertDialogMessage={`Are you sure you want to delete "${automationKey}"? This action cannot be undone.`}
          alertCancelLabel="Cancel"
          alertConfirmLabel="Delete"
          isOpen={deleteConfirmation}
          onClose={() => setDeleteConfirmation(false)}
          onConfirm={() => {
            handleDelete();
            setDeleteConfirmation(false);
          }}
        />
      )}
    </React.Fragment>
  );
}
