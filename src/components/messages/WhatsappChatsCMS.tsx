"use client";
import { playNotificationSound } from "@/lib/sounds";
import { supabase } from "@/lib/supabase";
import { WhatsAppTypeAttachmentPairUnion } from "@/lib/whatsapp-types";
import { trpc } from "@/trpc/client";
import { WAMode } from "@prisma/client";
import dayjs from "dayjs";
import { Bot, X } from "lucide-react";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import WAImagePickerModal from "../modals/WAImagePickerModal";
import AppErrorComponents from "../states/AppErrorComponents";
import AppLoadingComponents from "../states/AppLoadingComponents";
import WhatsappChatItemCMS, {
  WhatsappReplyTarget,
} from "./WhatsappChatItemCMS";
import WhatsappChatSubmitterCMS from "./WhatsappChatSubmitterCMS";

interface WhatsappChatsCMSProps {
  sessionToken: string;
  convId: string;
  headerName: string;
  headerPhoneNumber: string;
  mode: WAMode;
}

export default function WhatsappChatsCMS(props: WhatsappChatsCMSProps) {
  // State for auto-scroll
  const conversationRef = useRef<HTMLDivElement | null>(null);
  // State for play notification
  const prevConvIdRef = useRef<string>(props.convId);
  const prevChatIdsRef = useRef<Set<string>>(new Set());

  const [textValue, setTextValue] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [replyTarget, setReplyTarget] = useState<WhatsappReplyTarget | null>(
    null
  );
  const sendChat = trpc.send.wa.chat.useMutation();
  const sendImage = trpc.send.wa.image.useMutation();

  const utils = trpc.useUtils();

  // Fetch tRPC data
  const { data, isLoading, isError } = trpc.list.wa.chats.useQuery(
    {
      conv_id: props.convId,
    },
    {
      enabled: !!props.sessionToken && !!props.convId,
    }
  );
  const sortedChatList = useMemo(
    () =>
      [...(data?.list ?? [])].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [data?.list]
  );

  // Subscribe to Supabase Realtime for live wa_chats updates.
  useEffect(() => {
    const channel = supabase
      .channel("wa_chats_change", { config: { private: true } })
      .on("broadcast", { event: "*" }, (payload) => {
        utils.list.wa.chats.invalidate({ conv_id: props.convId });

        if (payload.event === "INSERT") {
          utils.list.wa.conversations.invalidate();
        }
      })
      .subscribe((status, err) => {
        if (err) {
          console.error("WA Chats Subscription error:", err);
        } else if (status === "SUBSCRIBED") {
          console.log("WA Chats subscribed");
        } else if (status === "CHANNEL_ERROR") {
          console.error("WA Chats channel encountered an error");
        } else if (status === "TIMED_OUT") {
          console.error("WA Chats subs timed out");
        } else if (status === "CLOSED") {
          console.log("WA Chats channel closed");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Play notification sound when a new INBOUND message arrives.
  useEffect(() => {
    const currentIds = new Set(sortedChatList.map((chat) => chat.id));
    if (prevConvIdRef.current !== props.convId) {
      prevConvIdRef.current = props.convId;
    } else if (prevChatIdsRef.current.size > 0) {
      const hasNewInbound = sortedChatList.some(
        (chat) =>
          !prevChatIdsRef.current.has(chat.id) && chat.direction === "INBOUND"
      );
      if (hasNewInbound) playNotificationSound();
    }
    prevChatIdsRef.current = currentIds;
  }, [sortedChatList, props.convId]);

  // Auto-scrolls to the bottom whenever new chats arrive.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (conversationRef.current) {
        conversationRef.current.scrollTo({
          top: conversationRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 50);
    return () => clearTimeout(timeout);
  }, [sortedChatList]);

  // Clear reply target when switching conversations
  useEffect(() => {
    queueMicrotask(() => setReplyTarget(null));
  }, [props.convId]);

  // Automatically scrolls to the bottom when the page first loads.
  useLayoutEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTo({
        top: conversationRef.current.scrollHeight,
        behavior: "instant",
      });
    }
  }, []);

  const handleSendImage = (image_url: string, caption: string) => {
    sendImage.mutate(
      { conv_id: props.convId, image_url, caption },
      {
        onSuccess: () =>
          utils.list.wa.chats.invalidate({ conv_id: props.convId }),
        onError: () => toast.error("Failed to send image"),
      }
    );
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textValue.trim() || sendChat.isPending) {
      return;
    }

    try {
      sendChat.mutate(
        {
          conv_id: props.convId,
          message: textValue.trim(),
          reply_to_id: replyTarget?.id,
        },
        {
          onSuccess: () => {
            setTextValue("");
            setReplyTarget(null);
            utils.list.wa.chats.invalidate({ conv_id: props.convId });
          },
          onError: () => {
            toast.error("Failed to send chat");
          },
        }
      );
    } catch (error) {
      console.error("Failed to send chat", error);
    }
  };

  return (
    <div className="hidden lg:flex flex-col w-full h-full min-h-0">
      <div className="chat-header flex items-center gap-3 p-4 border-b border-dashboard-border shrink-0 bg-card-bg">
        <div className="flex flex-col min-w-0">
          <p className=" font-bold text-base leading-snug line-clamp-1 dark:text-sevenpreneur-white">
            {props.headerName}
          </p>
          <p className="text-sm text-emphasis  font-medium leading-snug">
            {props.headerPhoneNumber}
          </p>
        </div>
      </div>
      <div
        ref={conversationRef}
        className="chats-panel relative flex flex-col w-full flex-1 min-h-0 bg-linear-to-t from-0% from-[#DDE4F1] to-100% to-[#F2F2F2] dark:from-sevenpreneur-coal dark:to-sevenpreneur-surface-black overflow-y-auto"
      >
        <div className="chats-conversation relative flex flex-col w-full p-3 min-h-full">
          {isLoading && <AppLoadingComponents />}
          {isError && <AppErrorComponents />}

          {!isLoading && !isError && sortedChatList.length > 0 && (
            <div className="chat-list w-full flex flex-col pt-5 mb-5 flex-grow">
              {sortedChatList.map((post, index, sorted) => {
                const currentDate = dayjs(post.created_at).format("YYYY-MM-DD");
                const prevDate =
                  index > 0
                    ? dayjs(sorted[index - 1].created_at).format("YYYY-MM-DD")
                    : null;
                const showDateLabel = currentDate !== prevDate;

                return (
                  <React.Fragment key={index}>
                    {showDateLabel && (
                      <div className="sticky top-3 z-20 flex w-full justify-center py-1 pointer-events-none">
                        <p className="flex w-[138px] justify-center px-3 py-1 text-xs font-medium text-[#333333]/70 bg-white/80 border border-dashboard-border rounded-full backdrop-blur-sm dark:bg-card-bg/80 dark:text-sevenpreneur-white/70">
                          {dayjs(post.created_at).format("ddd, DD MMM YYYY")}
                        </p>
                      </div>
                    )}
                    <div
                      className={`chat-wrapper flex w-full gap-10 ${
                        post.direction === "INBOUND"
                          ? "justify-start"
                          : "justify-end"
                      }`}
                    >
                      <WhatsappChatItemCMS
                        chat={
                          post as unknown as WhatsAppTypeAttachmentPairUnion
                        }
                        chatId={post.id}
                        chatMessage={post.message}
                        chatDirection={post.direction}
                        chatStatus={post.status}
                        createdAt={post.created_at}
                        sentAt={post.sent_at}
                        deliveredAt={post.delivered_at}
                        readAt={post.read_at}
                        failedAt={post.failed_at}
                        onReply={setReplyTarget}
                        replyTo={post.reply_to}
                        customerName={props.headerName}
                      />
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          )}
          {props.mode === "AI" ? (
            <div className="ai-mode-notice sticky bottom-3 flex items-center gap-2 w-full p-3 px-4 bg-card-bg border border-dashboard-border rounded-xl text-sm text-emphasis  font-medium z-10">
              <Bot className="size-4 shrink-0 text-tertiary" />
              <p>
                AI is currently handling this chat. Switch to Human mode to send
                a message.
              </p>
            </div>
          ) : (
            <form
              className="send-chat sticky flex flex-col bottom-3 w-full items-center justify-center gap-2 rounded-t-xl z-10"
              onSubmit={handleSendChat}
            >
              {replyTarget && (
                <div className="reply-preview flex items-stretch w-full bg-white dark:bg-card-bg border border-dashboard-border rounded-xl overflow-hidden">
                  <div className="w-1 bg-primary shrink-0" />
                  <div className="flex flex-col flex-1 min-w-0 py-2 px-3">
                    <p className="text-xs  font-semibold text-primary leading-snug">
                      {replyTarget.direction === "INBOUND"
                        ? `Replying to ${props.headerName}`
                        : "Replying to yourself"}
                    </p>
                    <p className="text-sm  text-emphasis line-clamp-1 break-words">
                      {replyTarget.message?.trim() ||
                        (replyTarget.type === "IMAGE"
                          ? "Photo"
                          : replyTarget.type === "VIDEO"
                            ? "Video"
                            : replyTarget.type === "AUDIO"
                              ? "Voice message"
                              : replyTarget.type === "DOCUMENT"
                                ? "Document"
                                : replyTarget.type === "STICKER"
                                  ? "Sticker"
                                  : "Message")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    aria-label="Cancel reply"
                    className="flex items-center justify-center w-10 shrink-0 text-emphasis hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
              <WhatsappChatSubmitterCMS
                value={textValue}
                onTextAreaChange={(value) => setTextValue(value)}
                onSubmit={handleSendChat}
                onOpenImagePicker={() => setShowImagePicker(true)}
                isLoadingSubmit={sendChat.isPending}
              />
            </form>
          )}
        </div>
      </div>

      <WAImagePickerModal
        isOpen={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        isLoading={sendImage.isPending}
        onSubmit={(image_url, caption) => {
          handleSendImage(image_url, caption);
          setShowImagePicker(false);
        }}
      />
    </div>
  );
}
