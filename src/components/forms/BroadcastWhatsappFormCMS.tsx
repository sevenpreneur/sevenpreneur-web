"use client";
import { trpc } from "@/trpc/client";
import { Loader2, Search, TimerOff, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LeadStatus } from "@/lib/app-types";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import AppBasedLabel from "../labels/AppBasedLabel";
import LeadStatusLabelCMS from "../labels/LeadStatusLabelCMS";
import {
  WhatsappTemplateQualityLabelCMS,
  WhatsappTemplateStatusLabelCMS,
} from "../labels/WhatsappTemplateLabelCMS";
import AppLoadingComponents from "../states/AppLoadingComponents";

interface BroadcastWhatsappFormCMSProps {
  sessionToken: string;
  isOpen: boolean;
  onClose: () => void;
}

type TemplateComponent = {
  text?: string;
};

type RawTemplateComponent = {
  type?: string;
  format?: string;
  text?: string;
  buttons?: { type?: string; text?: string }[];
};

// Replaces {{param}} placeholders with the entered values for a live preview,
// keeping the placeholder when no value has been typed yet.
function substituteParams(text: string, parameters: Record<string, string>) {
  return text.replace(/\{\{([0-9a-z_]+)\}\}/gi, (whole, key) => {
    const value = parameters[key]?.trim();
    return value ? value : whole;
  });
}

function parseTemplateComponents(components: unknown) {
  const list = Array.isArray(components)
    ? (components as RawTemplateComponent[])
    : [];
  const byType = (type: string) =>
    list.find((component) => (component.type ?? "").toUpperCase() === type);
  return {
    header: byType("HEADER"),
    body: byType("BODY"),
    footer: byType("FOOTER"),
    buttons: byType("BUTTONS")?.buttons ?? [],
  };
}

type BroadcastTemplate = {
  template_id: string;
  lang_code: string;
  status: string;
  quality_rating: string | null;
  components: unknown;
};

type BroadcastConversation = {
  id: string;
  full_name: string;
  user_full_name?: string | null;
  phone_number: string;
  lead_status: string;
  window_expired: boolean;
};

function extractTemplateParams(components: unknown) {
  const params = new Set<string>();
  if (!Array.isArray(components)) return [];

  for (const component of components as TemplateComponent[]) {
    if (typeof component.text !== "string") continue;
    const matches = component.text.matchAll(/\{\{([0-9a-z_]+)\}\}/gi);
    for (const match of matches) {
      params.add(match[1]);
    }
  }

  return Array.from(params);
}

export default function BroadcastWhatsappFormCMS({
  sessionToken,
  isOpen,
  onClose,
}: BroadcastWhatsappFormCMSProps) {
  const utils = trpc.useUtils();
  const broadcastTemplate = trpc.send.wa.broadcast_template.useMutation();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(
    null
  );
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [leadStatusFilter, setLeadStatusFilter] = useState<string | null>(null);
  const [windowFilter, setWindowFilter] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, string>>({});

  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    isError: isErrorTemplates,
  } = trpc.list.wa.templates.useQuery(
    {},
    { enabled: isOpen && !!sessionToken }
  );
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    isError: isErrorConversations,
  } = trpc.list.wa.conversations.useQuery(
    {},
    { enabled: isOpen && !!sessionToken }
  );
  const templates = useMemo(
    () =>
      ((templatesData as { list?: BroadcastTemplate[] } | undefined)?.list ??
        []) as BroadcastTemplate[],
    [templatesData]
  );
  const conversations = useMemo(
    () =>
      ((conversationsData as { list?: BroadcastConversation[] } | undefined)
        ?.list ?? []) as BroadcastConversation[],
    [conversationsData]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const templateOptions = useMemo(
    () =>
      templates.map((template) => ({
        label: template.template_id,
        value: `${template.template_id}::${template.lang_code}`,
      })),
    [templates]
  );

  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) =>
          `${template.template_id}::${template.lang_code}` ===
          selectedTemplateKey
      ),
    [selectedTemplateKey, templates]
  );

  const templateParams = useMemo(
    () => extractTemplateParams(selectedTemplate?.components),
    [selectedTemplate?.components]
  );

  const previewComponents = useMemo(
    () => parseTemplateComponents(selectedTemplate?.components),
    [selectedTemplate?.components]
  );

  const filteredConversations = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    return conversations.filter((conversation) => {
      if (keyword) {
        const name = (
          conversation.user_full_name || conversation.full_name
        ).toLowerCase();
        if (
          !name.includes(keyword) &&
          !conversation.phone_number.toLowerCase().includes(keyword)
        ) {
          return false;
        }
      }
      if (leadStatusFilter && conversation.lead_status !== leadStatusFilter) {
        return false;
      }
      if (windowFilter === "ACTIVE" && conversation.window_expired) return false;
      if (windowFilter === "EXPIRED" && !conversation.window_expired) {
        return false;
      }
      return true;
    });
  }, [conversations, searchValue, leadStatusFilter, windowFilter]);

  const leadStatusOptions = [
    { label: "All lead status", value: null },
    { label: "Hot Leads", value: "HOT" },
    { label: "Warm Leads", value: "WARM" },
    { label: "Cold Leads", value: "COLD" },
  ];

  const windowOptions = [
    { label: "All windows", value: null },
    { label: "Inside 24h window", value: "ACTIVE" },
    { label: "Window expired (24h)", value: "EXPIRED" },
  ];

  const selectedTemplatePayload = selectedTemplate
    ? {
        template_name: selectedTemplate.template_id,
        lang_code: selectedTemplate.lang_code,
      }
    : null;

  const toggleConversation = (convId: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedConvIds((prev) =>
      Array.from(
        new Set([
          ...prev,
          ...filteredConversations.map((conversation) => conversation.id),
        ])
      )
    );
  };

  const clearAllSelected = () => setSelectedConvIds([]);

  const handleParameterChange = (param: string) => (value: string) => {
    setParameters((prev) => ({ ...prev, [param]: value }));
  };

  const handleClose = () => {
    setSelectedTemplateKey(null);
    setSelectedConvIds([]);
    setSearchValue("");
    setLeadStatusFilter(null);
    setWindowFilter(null);
    setParameters({});
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedTemplatePayload) {
      toast.error("Please choose a WhatsApp template");
      return;
    }
    if (selectedConvIds.length < 1) {
      toast.error("Please select at least one recipient");
      return;
    }
    const emptyParam = templateParams.find(
      (param) => !parameters[param]?.trim()
    );
    if (emptyParam) {
      toast.error(`Please fill ${emptyParam}`);
      return;
    }
    const templateParameterValues = Object.fromEntries(
      templateParams.map((param) => [param, parameters[param].trim()])
    );

    broadcastTemplate.mutate(
      {
        conv_ids: selectedConvIds,
        template_name: selectedTemplatePayload.template_name,
        lang_code: selectedTemplatePayload.lang_code,
        parameters: templateParameterValues,
      },
      {
        onSuccess: (result) => {
          utils.list.wa.conversations.invalidate();
          utils.list.wa.chats.invalidate();
          if (result.failed > 0) {
            toast.warning(
              `Broadcast sent to ${result.sent} recipient(s), ${result.failed} failed`
            );
          } else {
            toast.success(`Broadcast sent to ${result.sent} recipient(s)`);
          }
          handleClose();
        },
        onError: () => {
          toast.error("Failed to send broadcast");
        },
      }
    );
  };

  if (!isOpen) return null;

  const isLoading = isLoadingTemplates || isLoadingConversations;
  const isError = isErrorTemplates || isErrorConversations;

  return (
    <div
      className="modal-root fixed inset-0 flex w-full h-full items-center justify-center bg-black/65 z-[999]"
      onClick={handleClose}
    >
      <div
        className="modal-container fixed flex bg-card-bg max-w-[calc(100%-2rem)] p-6 w-full max-h-[calc(100vh-2rem)] rounded-lg shadow-md sm:max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col w-full gap-5 min-h-0">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="flex flex-col gap-1">
              <h2 className="font-bold text-lg">Broadcast Message</h2>
              <p className="text-sm font-medium text-emphasis">
                Send a WhatsApp template to selected conversations.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-card-inside-bg border border-dashboard-border text-sm font-semibold text-emphasis">
              <Users className="size-4" />
              {selectedConvIds.length} selected
            </div>
          </div>

          {isLoading && <AppLoadingComponents />}
          {isError && (
            <p className="text-sm font-semibold text-destructive">
              Failed to load broadcast data.
            </p>
          )}

          {!isLoading && !isError && (
            <div className="grid min-h-0 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
              <div className="flex flex-col gap-4 min-h-0">
                <AppSelect
                  selectId="broadcast-template"
                  selectPlaceholder="Choose template"
                  variant="CMS"
                  value={selectedTemplateKey}
                  onChange={(value) => setSelectedTemplateKey(value as string)}
                  options={templateOptions}
                />

                {selectedTemplate && (
                  <div className="template-preview flex flex-col gap-1.5">
                    <div className="flex flex-col gap-1 rounded-lg bg-[#E5DDD5] p-3 dark:bg-[#0b141a]">
                      <div className="relative max-w-[88%] rounded-lg rounded-tl-none bg-white px-3 py-2 shadow-sm dark:bg-[#202c33]">
                        {previewComponents.header &&
                          (previewComponents.header.format === "TEXT" &&
                          previewComponents.header.text ? (
                            <p className="mb-1 break-words text-sm font-bold text-foreground">
                              {substituteParams(
                                previewComponents.header.text,
                                parameters
                              )}
                            </p>
                          ) : (
                            <div className="mb-1.5 flex h-20 items-center justify-center rounded bg-card-inside-bg text-xs font-semibold text-emphasis">
                              {previewComponents.header.format ?? "MEDIA"}{" "}
                              HEADER
                            </div>
                          ))}
                        {previewComponents.body?.text && (
                          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                            {substituteParams(
                              previewComponents.body.text,
                              parameters
                            )}
                          </p>
                        )}
                        {previewComponents.footer?.text && (
                          <p className="mt-1.5 break-words text-xs text-emphasis">
                            {substituteParams(
                              previewComponents.footer.text,
                              parameters
                            )}
                          </p>
                        )}
                      </div>
                      {previewComponents.buttons.length > 0 && (
                        <div className="flex max-w-[88%] flex-col gap-1">
                          {previewComponents.buttons.map((button, index) => (
                            <div
                              key={index}
                              className="rounded-lg bg-white px-3 py-2 text-center text-sm font-semibold text-tertiary shadow-sm dark:bg-[#202c33]"
                            >
                              {button.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTemplate && (
                  <div className="flex flex-col gap-2 rounded-md border border-dashboard-border bg-card-inside-bg p-3">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="text-emphasis">Status</span>
                      <WhatsappTemplateStatusLabelCMS
                        status={selectedTemplate.status}
                      />
                    </div>
                    {selectedTemplate.quality_rating && (
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                        <span className="text-emphasis">Quality</span>
                        <WhatsappTemplateQualityLabelCMS
                          quality={selectedTemplate.quality_rating}
                        />
                      </div>
                    )}
                  </div>
                )}

                {templateParams.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <p className="pl-1 text-sm font-semibold text-sb-text-strong">
                      Template Parameters
                    </p>
                    {templateParams.map((param) => (
                      <AppInput
                        key={param}
                        inputId={`broadcast-param-${param}`}
                        inputName={param}
                        inputType="text"
                        inputPlaceholder={`Value for ${param}`}
                        variant="CMS"
                        value={parameters[param] ?? ""}
                        onInputChange={handleParameterChange(param)}
                        required
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 min-h-0">
                <AppInput
                  inputId="broadcast-recipient-search"
                  inputType="text"
                  inputIcon={<Search className="size-4" />}
                  inputPlaceholder="Search name or phone"
                  variant="CMS"
                  value={searchValue}
                  onInputChange={setSearchValue}
                />
                <div className="grid grid-cols-2 gap-2">
                  <AppSelect
                    selectId="broadcast-filter-lead-status"
                    selectPlaceholder="Lead status"
                    variant="CMS"
                    value={leadStatusFilter}
                    onChange={(value) =>
                      setLeadStatusFilter((value as string | null) ?? null)
                    }
                    options={leadStatusOptions}
                  />
                  <AppSelect
                    selectId="broadcast-filter-window"
                    selectPlaceholder="24h window"
                    variant="CMS"
                    value={windowFilter}
                    onChange={(value) =>
                      setWindowFilter((value as string | null) ?? null)
                    }
                    options={windowOptions}
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-emphasis">
                    {filteredConversations.length} recipient(s)
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="text-sm font-semibold text-tertiary hover:underline"
                      onClick={selectAllFiltered}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      className="text-sm font-semibold text-emphasis hover:underline"
                      onClick={clearAllSelected}
                    >
                      Clear all
                    </button>
                  </div>
                </div>
                <div className="flex max-h-[44vh] min-h-72 flex-col overflow-y-auto rounded-lg border border-dashboard-border bg-card-inside-bg">
                  {filteredConversations.map((conversation) => {
                    const isSelected = selectedConvIds.includes(
                      conversation.id
                    );
                    return (
                      <label
                        key={conversation.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-dashboard-border px-3 py-2.5 last:border-b-0 hover:bg-card-bg"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleConversation(conversation.id)}
                          className="size-4 shrink-0 accent-tertiary"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-sm font-semibold text-foreground">
                            {conversation.user_full_name ||
                              conversation.full_name}
                          </span>
                          <span className="truncate text-xs font-medium text-emphasis">
                            {conversation.phone_number}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <LeadStatusLabelCMS
                            variants={conversation.lead_status as LeadStatus}
                          />
                          {conversation.window_expired && (
                            <span title="24-hour messaging window closed — only templates can be sent">
                              <AppBasedLabel variant="gray">
                                <TimerOff className="size-3" />
                                24h
                              </AppBasedLabel>
                            </span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              variant="neutral"
              onClick={handleClose}
              disabled={broadcastTemplate.isPending}
            >
              Cancel
            </AppButton>
            <AppButton
              type="button"
              variant="tertiary"
              onClick={handleSubmit}
              disabled={broadcastTemplate.isPending || isLoading || isError}
            >
              {broadcastTemplate.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Send Broadcast
            </AppButton>
          </div>
        </div>
        <button
          type="button"
          className="absolute right-4 top-4 flex hover:cursor-pointer"
          onClick={handleClose}
          aria-label="Close broadcast modal"
        >
          <X className="size-6" />
        </button>
      </div>
    </div>
  );
}
