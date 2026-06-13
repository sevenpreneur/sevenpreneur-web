"use client";
import { trpc } from "@/trpc/client";
import { Loader2, Search, Send, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import AppButton from "../buttons/AppButton";
import AppInput from "../fields/AppInput";
import AppSelect from "../fields/AppSelect";
import AppLoadingComponents from "../states/AppLoadingComponents";

interface BroadcastWhatsappFormCMSProps {
  sessionToken: string;
  isOpen: boolean;
  onClose: () => void;
}

type TemplateComponent = {
  text?: string;
};

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
        label: `${template.template_id} (${template.lang_code})`,
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

  const filteredConversations = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    if (!keyword) return conversations;
    return conversations.filter((conversation) => {
      const name = (
        conversation.user_full_name || conversation.full_name
      ).toLowerCase();
      return (
        name.includes(keyword) ||
        conversation.phone_number.toLowerCase().includes(keyword)
      );
    });
  }, [conversations, searchValue]);

  const selectedTemplatePayload = selectedTemplate
    ? {
        template_name: selectedTemplate.template_id,
        lang_code: selectedTemplate.lang_code,
      }
    : null;

  const allVisibleSelected =
    filteredConversations.length > 0 &&
    filteredConversations.every((conversation) =>
      selectedConvIds.includes(conversation.id)
    );

  const toggleConversation = (convId: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(convId)
        ? prev.filter((id) => id !== convId)
        : [...prev, convId]
    );
  };

  const toggleVisibleConversations = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(
        filteredConversations.map((conversation) => conversation.id)
      );
      setSelectedConvIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      setSelectedConvIds((prev) =>
        Array.from(
          new Set([
            ...prev,
            ...filteredConversations.map((conversation) => conversation.id),
          ])
        )
      );
    }
  };

  const handleParameterChange = (param: string) => (value: string) => {
    setParameters((prev) => ({ ...prev, [param]: value }));
  };

  const handleClose = () => {
    setSelectedTemplateKey(null);
    setSelectedConvIds([]);
    setSearchValue("");
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
              <Send className="size-4" />
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
            <div className="grid min-h-0 gap-5 md:grid-cols-[1fr_1.15fr]">
              <div className="flex flex-col gap-4 min-h-0">
                <AppSelect
                  selectId="broadcast-template"
                  selectName="Template"
                  selectPlaceholder="Choose template"
                  variant="CMS"
                  value={selectedTemplateKey}
                  onChange={(value) => setSelectedTemplateKey(value as string)}
                  options={templateOptions}
                />

                {selectedTemplate && (
                  <div className="flex flex-col gap-2 rounded-md border border-dashboard-border bg-card-inside-bg p-3">
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                      <span className="text-emphasis">Status</span>
                      <span className="text-foreground">
                        {selectedTemplate.status}
                      </span>
                    </div>
                    {selectedTemplate.quality_rating && (
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                        <span className="text-emphasis">Quality</span>
                        <span className="text-foreground">
                          {selectedTemplate.quality_rating}
                        </span>
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
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-emphasis">
                    {filteredConversations.length} recipient(s)
                  </p>
                  <button
                    type="button"
                    className="text-sm font-semibold text-tertiary hover:underline"
                    onClick={toggleVisibleConversations}
                  >
                    {allVisibleSelected ? "Clear visible" : "Select visible"}
                  </button>
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
                        <span className="shrink-0 text-xs font-semibold text-emphasis">
                          {conversation.lead_status}
                        </span>
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
