"use client";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/trpc/client";
import { WAMode } from "@prisma/client";
import {
  BellPlus,
  Bot,
  Loader,
  Loader2,
  PenBox,
  Save,
  TextAlignStart,
  User,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import AppButton from "../buttons/AppButton";
import SectionContainerCMS from "../cards/SectionContainerCMS";
import AppTextArea from "../fields/AppTextArea";
import CreateWhatsappAlertFormCMS from "../forms/CreateWhatsappAlertFormCMS";
import EditLeadStatusFormCMS from "../forms/EditLeadStatusFormCMS";
import AppBasedLabel from "../labels/AppBasedLabel";
import LeadStatusLabelCMS from "../labels/LeadStatusLabelCMS";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";
import { Slider } from "../ui/slider";
import { toast } from "sonner";

interface WhatsappLeadDetailsCMSProps {
  sessionToken: string;
  convId: string;
}

export default function WhatsappLeadDetailsCMS(
  props: WhatsappLeadDetailsCMSProps
) {
  const utils = trpc.useUtils();
  const updateConversation = trpc.update.wa.conversation.useMutation();
  const { resolvedTheme } = useTheme();
  const buttonVariant = resolvedTheme === "dark" ? "dark" : "light";
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoadingUnassign, setIsLoadingUnassign] = useState(false);
  const [createAlert, setCreateAlert] = useState(false);
  const [noteValue, setNoteValue] = useState("");

  // Fetch tRPC Data
  const { data, isLoading, isError } = trpc.read.wa.conversation.useQuery(
    { id: props.convId },
    { enabled: !!props.sessionToken && !!props.convId }
  );
  const leadDetails = data?.conversation;

  useEffect(() => {
    if (!props.sessionToken || !props.convId) return;

    const channel = supabase
      .channel("wa_convs_change", { config: { private: true } })
      .on("broadcast", { event: "*" }, () => {
        utils.read.wa.conversation.invalidate({ id: props.convId });
        utils.list.wa.conversations.invalidate();
      })
      .subscribe((status, err) => {
        if (err) {
          console.error("WA Conversation Details Subscription error:", err);
        } else if (status === "CHANNEL_ERROR") {
          console.error("WA Conversation Details channel encountered an error");
        } else if (status === "TIMED_OUT") {
          console.error("WA Conversation Details subscription timed out");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [props.sessionToken, props.convId, utils]);

  // State for winning rate
  const [winningRate, setWinningRate] = useState(
    leadDetails?.winning_rate ?? 0
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setWinningRate(leadDetails?.winning_rate ?? 0);
  }, [leadDetails?.winning_rate, props.convId]);

  useEffect(() => {
    setNoteValue(leadDetails?.note ?? "");
  }, [leadDetails?.note, props.convId]);

  // Unassign handler
  const handleUnassigned = () => {
    setIsLoadingUnassign(true);

    try {
      updateConversation.mutate(
        { id: props.convId, handler_id: null },
        {
          onSuccess: () => {
            utils.read.wa.conversation.invalidate({ id: props.convId });
            utils.list.wa.conversations.invalidate();
          },
        }
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingUnassign(false);
    }
  };

  // Update winning rate change
  const handleWinningRateChange = (value: number[]) => {
    const newRate = value[0];
    setWinningRate(newRate);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateConversation.mutate(
        { id: props.convId, winning_rate: newRate },
        {
          onSuccess: () =>
            utils.read.wa.conversation.invalidate({ id: props.convId }),
        }
      );
    }, 600);
  };

  // Update mode (AI / HUMAN)
  const handleChangeMode = (nextMode: WAMode) => {
    if (!leadDetails || leadDetails.mode === nextMode) return;
    updateConversation.mutate(
      { id: props.convId, mode: nextMode },
      {
        onSuccess: () => {
          utils.read.wa.conversation.invalidate({ id: props.convId });
          utils.list.wa.conversations.invalidate();
        },
      }
    );
  };

  const handleSaveNote = () => {
    updateConversation.mutate(
      {
        id: props.convId,
        note: noteValue.trim() ? noteValue : null,
      },
      {
        onSuccess: () => {
          toast.success("Notes saved");
          utils.read.wa.conversation.invalidate({ id: props.convId });
        },
        onError: () => {
          toast.error("Failed to save notes");
        },
      }
    );
  };

  const leadName =
    leadDetails?.user?.full_name || leadDetails?.full_name || "-";

  const initialName = leadName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const currentMode: WAMode = leadDetails?.mode ?? "AI";
  const isNoteDirty = noteValue !== (leadDetails?.note ?? "");

  return (
    <React.Fragment>
      <div className="flex w-full h-full overflow-y-auto">
        {isLoading && <AppLoadingComponents />}
        {isError && <AppErrorComponents />}

        {leadDetails && !isLoading && !isError && (
          <div className="lead-informations flex flex-col w-full gap-4">
            {/* AI / Human Mode card */}
            <SectionContainerCMS title="AI / Human Mode" icon={Bot}>
              <div className="flex w-full p-1 bg-card-inside-bg border border-dashboard-border rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => handleChangeMode("AI")}
                  disabled={updateConversation.isPending}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-sm  font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${
                    currentMode === "AI"
                      ? "bg-tertiary text-tertiary-foreground shadow-sm"
                      : "text-emphasis hover:bg-sb-item-active-bg dark:hover:bg-card-bg"
                  }`}
                >
                  <Bot className="size-4" />
                  AI Mode
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeMode("HUMAN")}
                  disabled={updateConversation.isPending}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2 text-sm  font-semibold rounded-md transition-colors disabled:cursor-not-allowed ${
                    currentMode === "HUMAN"
                      ? "bg-tertiary text-tertiary-foreground shadow-sm"
                      : "text-emphasis hover:bg-sb-item-active-bg dark:hover:bg-card-bg"
                  }`}
                >
                  <User className="size-4" />
                  Human Mode
                </button>
              </div>
            </SectionContainerCMS>

            {/* Lead Identity card */}
            <SectionContainerCMS title="Lead Identity" icon={User}>
              <div className="flex w-full items-center justify-between">
                <div className="lead-identity flex items-center gap-3 flex-1 min-w-0">
                  <div className="lead-avatar size-10 rounded-full overflow-hidden shrink-0">
                    {leadDetails.user?.avatar ? (
                      <Image
                        src={leadDetails.user.avatar}
                        alt={leadName}
                        width={500}
                        height={500}
                      />
                    ) : (
                      <div className="flex w-full h-full items-center justify-center bg-secondary-soft-background text-secondary-soft-foreground dark:bg-sevenpreneur-pink-midgnight dark:text-sevenpreneur-pink-blush">
                        <p className=" font-medium text-base">{initialName}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="lead-name text-[15px] font-bold leading-snug line-clamp-2 dark:text-sevenpreneur-white">
                      {leadName}
                    </p>
                    <p className="lead-phone-number text-sm text-emphasis leading-snug line-clamp-1">
                      {leadDetails.user?.phone_number ||
                        leadDetails.phone_number}
                    </p>
                    {leadDetails.user?.email && (
                      <p className="lead-email text-sm text-emphasis font-semibold  leading-snug line-clamp-1">
                        {leadDetails.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <AppButton
                  variant={buttonVariant}
                  size="icon"
                  onClick={() => setCreateAlert(true)}
                >
                  <BellPlus className="size-4.5" />
                </AppButton>
              </div>
            </SectionContainerCMS>

            {/* Lead Details card */}
            <SectionContainerCMS
              title="Lead Details"
              icon={PenBox}
              headerAction={
                <AppButton
                  variant={buttonVariant}
                  size="small"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <PenBox className="size-3.5" />
                  Edit
                </AppButton>
              }
            >
              <div className="flex flex-col gap-2">
                <div className="flex w-full items-center">
                  <p className="label w-32 text-sm text-emphasis  font-medium">
                    Handled by
                  </p>
                  <div className="flex w-full">
                    {leadDetails.handler_id ? (
                      <div className="input flex w-fit items-center gap-2 bg-card-inside-bg py-1 px-2 rounded-full border border-dashboard-border">
                        <div className="size-5 rounded-full shrink-0 overflow-hidden">
                          <Image
                            className="object-cover w-full h-full"
                            src={
                              leadDetails.handler?.avatar ||
                              "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur//default-avatar.svg.png"
                            }
                            alt="user"
                            width={500}
                            height={500}
                          />
                        </div>
                        <p className="text-sm text-[#333333]  font-semibold line-clamp-1 dark:text-sevenpreneur-white">
                          {leadDetails.handler?.full_name}
                        </p>
                        <AppButton
                          className="shrink-0"
                          variant="destructiveSoft"
                          size="smallIconRounded"
                          onClick={handleUnassigned}
                          disabled={isLoadingUnassign}
                        >
                          {isLoadingUnassign ? (
                            <Loader2 className="animate-spin size-4" />
                          ) : (
                            <X className="size-4" />
                          )}
                        </AppButton>
                      </div>
                    ) : (
                      <AppBasedLabel variant="pink">Unassigned</AppBasedLabel>
                    )}
                  </div>
                </div>
                <div className="flex w-full items-center">
                  <p className="label w-32 text-sm text-emphasis  font-medium">
                    Status
                  </p>
                  <div className="input w-full">
                    <LeadStatusLabelCMS
                      variants={leadDetails?.lead_status ?? "COLD"}
                    />
                  </div>
                </div>
              </div>
            </SectionContainerCMS>

            {/* Winning Rate card */}
            <SectionContainerCMS title="Winning Rate" icon={Loader}>
              <div className="flex w-full items-center gap-2">
                <Slider
                  value={[winningRate]}
                  max={100}
                  step={5}
                  onValueChange={handleWinningRateChange}
                  disabled={currentMode === "AI"}
                />
                <div className="input w-fit text-sm text-emphasis  font-medium">
                  {winningRate}%
                </div>
              </div>
            </SectionContainerCMS>

            {/* Notes card */}
            <SectionContainerCMS
              title="Notes"
              icon={TextAlignStart}
              headerAction={
                <AppButton
                  type="button"
                  variant={buttonVariant}
                  size="small"
                  onClick={handleSaveNote}
                  disabled={!isNoteDirty || updateConversation.isPending}
                >
                  {updateConversation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Save
                </AppButton>
              }
            >
              <AppTextArea
                variant="CMS"
                textAreaId="chat-notes"
                textAreaPlaceholder="Take notes for important things"
                textAreaHeight="h-32"
                value={noteValue}
                onTextAreaChange={setNoteValue}
                disabled={updateConversation.isPending}
              />
            </SectionContainerCMS>
          </div>
        )}
      </div>

      {/* Create alert */}
      {createAlert && (
        <CreateWhatsappAlertFormCMS
          sessionToken={props.sessionToken}
          convId={props.convId}
          isOpen={createAlert}
          onClose={() => setCreateAlert(false)}
        />
      )}

      {/* Edit status lead */}
      <EditLeadStatusFormCMS
        sessionToken={props.sessionToken}
        convId={props.convId}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </React.Fragment>
  );
}
