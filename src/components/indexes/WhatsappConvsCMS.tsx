"use client";
import { LeadStatus } from "@/lib/app-types";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/trpc/client";
import { WALeadStatus, WAMode } from "@prisma/client";
import { ListFilter, Megaphone, MessageCircle, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import AppButton from "../buttons/AppButton";
import SectionContainerCMS from "../cards/SectionContainerCMS";
import WhatsappLeadDetailsCMS from "../elements/WhatsappLeadDetailsCMS";
import AppSelect from "../fields/AppSelect";
import BroadcastWhatsappFormCMS from "../forms/BroadcastWhatsappFormCMS";
import WhatsappConvItemCMS from "../items/WhatsappConvItemCMS";
import WhatsappChatsCMS from "../messages/WhatsappChatsCMS";
import PageContainerCMS from "../pages/PageContainerCMS";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";
import PageHeaderCMS from "../titles/PageHeaderCMS";

interface WhatsappConvsCMSProps {
  sessionToken: string;
}

const CONV_PAGE_SIZE = 30;

type LeadStatusFilter = WALeadStatus | "ALL";
type ModeFilter = WAMode | "ALL";
type HandlerFilter = "ALL" | "UNASSIGNED" | string;

type ConvHeaderSnapshot = {
  id: string;
  full_name: string;
  user_full_name?: string;
  phone_number: string;
  handler_id: string | null;
  mode: WAMode;
};

export default function WhatsappConvsCMS(props: WhatsappConvsCMSProps) {
  const { resolvedTheme } = useTheme();
  const buttonVariant = resolvedTheme === "dark" ? "dark" : "light";
  const [selectedConvId, setSelectedConvId] = useState("");
  // Cached header data so the middle panel survives filter changes that
  // exclude the selected conv. Set when the user clicks a conv item; fresh
  // values from the live list take priority over this snapshot when present.
  const [selectedConvSnapshot, setSelectedConvSnapshot] =
    useState<ConvHeaderSnapshot | null>(null);
  const [leadStatusFilter, setLeadStatusFilter] =
    useState<LeadStatusFilter>("ALL");
  const [modeFilter, setModeFilter] = useState<ModeFilter>("ALL");
  const [handlerFilter, setHandlerFilter] = useState<HandlerFilter>("ALL");
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const utils = trpc.useUtils();
  const readMessage = trpc.update.wa.conversation_as_read.useMutation();

  // Build query input from filters. page_size drives the infinite-scroll
  // pagination (30 conversations per request).
  const conversationsInput = useMemo(() => {
    const input: {
      lead_status?: WALeadStatus;
      mode?: WAMode;
      handler_id?: string | null;
      page_size: number;
    } = { page_size: CONV_PAGE_SIZE };
    if (leadStatusFilter !== "ALL") input.lead_status = leadStatusFilter;
    if (modeFilter !== "ALL") input.mode = modeFilter;
    if (handlerFilter === "UNASSIGNED") input.handler_id = null;
    else if (handlerFilter !== "ALL") input.handler_id = handlerFilter;
    return input;
  }, [leadStatusFilter, modeFilter, handlerFilter]);

  // Fetch tRPC data (paginated, loads the next 30 on scroll)
  const {
    data: convPages,
    isLoading: isLoadingConvs,
    isError: isErrorConvs,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.list.wa.conversations.useInfiniteQuery(conversationsInput, {
    enabled: !!props.sessionToken,
    initialCursor: 1,
    getNextPageParam: (lastPage) => lastPage.metapaging.next_page ?? undefined,
  });

  // Flatten loaded pages into a single conversation list
  const convItems = useMemo(
    () => convPages?.pages.flatMap((page) => page.list) ?? [],
    [convPages]
  );
  const totalConvCount = convPages?.pages[0]?.metapaging.total_data;

  // Load the next page when scrolled near the bottom of the list
  const handleConvScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (
      el.scrollHeight - el.scrollTop - el.clientHeight < 200 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  // Fetch admin handler list for filter dropdown
  const { data: handlerList } = trpc.list.users.useQuery(
    { role_id: 0, page_size: 100 },
    { enabled: !!props.sessionToken }
  );

  const convFromList = useMemo(
    () => convItems.find((c) => c.id === selectedConvId),
    [convItems, selectedConvId]
  );

  // Prefer fresh data from the list; fall back to the click-time snapshot so
  // the middle panel survives filter changes that exclude the selected conv.
  const selectedConv =
    convFromList ??
    (selectedConvSnapshot?.id === selectedConvId
      ? selectedConvSnapshot
      : undefined);

  const handleSelectConv = (conv: {
    id: string;
    full_name: string;
    user_full_name?: string;
    phone_number: string;
    handler_id: string | null;
    mode: WAMode;
  }) => {
    setSelectedConvId(conv.id);
    setSelectedConvSnapshot({
      id: conv.id,
      full_name: conv.full_name,
      user_full_name: conv.user_full_name,
      phone_number: conv.phone_number,
      handler_id: conv.handler_id,
      mode: conv.mode,
    });
  };

  const hasActiveFilter =
    leadStatusFilter !== "ALL" ||
    modeFilter !== "ALL" ||
    handlerFilter !== "ALL";

  const resetFilters = () => {
    setLeadStatusFilter("ALL");
    setModeFilter("ALL");
    setHandlerFilter("ALL");
  };

  // Subscribe to Realtime to keep convList updated even when no conversation is selected
  useEffect(() => {
    const channel = supabase
      .channel("wa_convs_change", { config: { private: true } })
      .on("broadcast", { event: "*" }, () => {
        utils.list.wa.conversations.invalidate();
      })
      .subscribe((status, err) => {
        if (err) {
          console.error("Subscription error:", err);
        } else if (status === "SUBSCRIBED") {
          console.log("Channel subscribed");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Channel encountered an error");
        } else if (status === "TIMED_OUT") {
          console.error("Subscription timed out");
        } else if (status === "CLOSED") {
          console.log("Channel closed");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Optimistically zero the unread count for a conversation across all
  // loaded pages of the infinite query.
  const markConvReadInCache = (convId: string) => {
    utils.list.wa.conversations.setInfiniteData(conversationsInput, (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          list: page.list.map((conv) =>
            conv.id === convId ? { ...conv, unread_count: 0 } : conv
          ),
        })),
      };
    });
  };

  // Read message when click conv item
  useEffect(() => {
    if (!selectedConvId) return;
    markConvReadInCache(selectedConvId);
    readMessage.mutate({ id: selectedConvId });
  }, [selectedConvId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark as read when new messages arrive for the currently open conversation
  useEffect(() => {
    if (!selectedConvId) return;
    const conv = convItems.find((c) => c.id === selectedConvId);
    if (!conv || conv.unread_count === 0) return;
    markConvReadInCache(selectedConvId);
    readMessage.mutate({ id: selectedConvId });
  }, [convItems]); // eslint-disable-line react-hooks/exhaustive-deps

  const leadStatusOptions = [
    { label: "Hot Leads", value: "HOT" },
    { label: "Warm Leads", value: "WARM" },
    { label: "Cold Leads", value: "COLD" },
  ];

  const modeOptions = [
    { label: "AI Mode", value: "AI" },
    { label: "Human Mode", value: "HUMAN" },
  ];

  const handlerOptions = [
    { label: "Unassigned", value: "UNASSIGNED" },
    ...(handlerList?.list.map((u) => ({
      label: u.full_name,
      value: u.id,
      image: u.avatar ?? undefined,
    })) ?? []),
  ];

  return (
    <PageContainerCMS className="h-screen">
      <div className="page-wrapper flex flex-col w-full h-full gap-4">
        <PageHeaderCMS name="Whatsapp Chats" icon={MessageCircle}>
          <AppButton
            type="button"
            variant="tertiary"
            onClick={() => setIsBroadcastOpen(true)}
          >
            <Megaphone className="size-4" />
            Broadcast Message
          </AppButton>
        </PageHeaderCMS>
        <div className="conv-details flex flex-1 w-full min-h-0 gap-4">
          {/* LEFT PANEL */}
          <div className="left-panel flex flex-col w-80 shrink-0 gap-4 min-h-0">
            {/* Filters card */}
            <SectionContainerCMS
              title="Filters"
              icon={ListFilter}
              className="shrink-0"
              headerAction={
                <AppButton
                  type="button"
                  variant={buttonVariant}
                  size="small"
                  onClick={resetFilters}
                  disabled={!hasActiveFilter}
                >
                  <RotateCcw className="size-3.5" />
                  Reset
                </AppButton>
              }
            >
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <AppSelect
                    selectId="filter-mode"
                    selectPlaceholder="Mode"
                    variant="CMS"
                    value={modeFilter === "ALL" ? null : modeFilter}
                    onChange={(value) =>
                      setModeFilter((value as ModeFilter) ?? "ALL")
                    }
                    options={modeOptions}
                  />
                  <AppSelect
                    selectId="filter-lead-status"
                    selectPlaceholder="Status"
                    variant="CMS"
                    value={leadStatusFilter === "ALL" ? null : leadStatusFilter}
                    onChange={(value) =>
                      setLeadStatusFilter((value as LeadStatusFilter) ?? "ALL")
                    }
                    options={leadStatusOptions}
                  />
                </div>
                <AppSelect
                  selectId="filter-handler"
                  selectPlaceholder="Assigned to"
                  variant="CMS"
                  value={handlerFilter === "ALL" ? null : handlerFilter}
                  onChange={(value) =>
                    setHandlerFilter((value as HandlerFilter) ?? "ALL")
                  }
                  options={handlerOptions}
                />
              </div>
            </SectionContainerCMS>

            {/* Conversations list card */}
            <div className="convs-panels flex flex-col flex-1 min-h-0 shrink-0 bg-card-bg border border-dashboard-border rounded-lg overflow-hidden">
              <div className="column-title flex items-center justify-between p-3 bg-card-bg  border-b border-dashboard-border shrink-0">
                <p className="font-bold text-[15px] dark:text-sevenpreneur-white">
                  Chats{" "}
                  {totalConvCount !== undefined && (
                    <span className="font-medium">({totalConvCount})</span>
                  )}
                </p>
                <ListFilter className="size-4 text-emphasis" />
              </div>

              <div
                className="flex flex-col flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                onScroll={handleConvScroll}
              >
                {isLoadingConvs && <AppLoadingComponents />}
                {isErrorConvs && <AppErrorComponents />}

                {!isLoadingConvs && !isErrorConvs && (
                  <div className="conv-list p-2 flex flex-col">
                    {convItems.map((post, index) => (
                      <WhatsappConvItemCMS
                        key={index}
                        convId={post.id}
                        convUserFullName={post.user_full_name || post.full_name}
                        convUserAvatar={post.user_avatar ?? null}
                        convLastMessage={post.last_message}
                        convLastMessageStatus={post.last_message_status}
                        convLastMessageDirection={post.last_message_direction}
                        convLastMessageType={post.last_message_type}
                        convLastMessageAt={post.last_message_at}
                        convLeadStatus={post.lead_status as LeadStatus}
                        convUnreadMessage={post.unread_count}
                        convMode={post.mode}
                        convWindowExpired={post.window_expired}
                        selectedConvId={selectedConvId}
                        onClick={() => handleSelectConv(post)}
                      />
                    ))}
                    {isFetchingNextPage && (
                      <div className="py-2">
                        <AppLoadingComponents />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MIDDLE PANEL */}
          <div className="middle-panel flex flex-[2] min-w-0">
            {selectedConvId && selectedConv ? (
              <div className="chat-card flex flex-col w-full min-w-0 bg-card-bg border border-dashboard-border rounded-lg overflow-hidden">
                <WhatsappChatsCMS
                  sessionToken={props.sessionToken}
                  convId={selectedConvId}
                  headerName={
                    selectedConv.user_full_name || selectedConv.full_name
                  }
                  headerPhoneNumber={selectedConv.phone_number}
                  mode={selectedConv.mode}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full gap-3 px-8 bg-card-bg border border-dashboard-border rounded-lg">
                <div className="state-illustration flex max-w-72 overflow-hidden">
                  <Image
                    className="object-cover w-full h-full"
                    src={
                      "https://tskubmriuclmbcfmaiur.supabase.co/storage/v1/object/public/sevenpreneur/sales-illustration.svg"
                    }
                    alt="chat-cms"
                    width={500}
                    height={400}
                  />
                </div>
                <div className="flex flex-col gap-1.5 text-center">
                  <h3 className=" font-bold text-2xl">
                    Siap Cuan Hari Ini?
                  </h3>
                  <p className=" font-medium text-emphasis max-w-sm">
                    Pilih chat di sebelah kiri dan ubah setiap percakapan jadi
                    closing deals!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          {selectedConvId && (
            <div className="right-panel flex flex-col w-80 shrink-0 min-h-0">
              <WhatsappLeadDetailsCMS
                key={selectedConvId}
                sessionToken={props.sessionToken}
                convId={selectedConvId}
              />
            </div>
          )}
        </div>
      </div>
      <BroadcastWhatsappFormCMS
        sessionToken={props.sessionToken}
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
      />
    </PageContainerCMS>
  );
}
