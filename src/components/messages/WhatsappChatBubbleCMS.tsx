"use client";
import { WhatsappChatDirection, WhatsappChatStatus } from "@/lib/app-types";
import { toCapitalizeEachWord } from "@/lib/convert-case";
import dayjs from "dayjs";
import { ReactNode } from "react";
import { Reply } from "lucide-react";
import { WACType } from "@prisma/client";
import AppButton from "../buttons/AppButton";

export interface WhatsappReplyQuote {
  type: WACType;
  direction: WhatsappChatDirection;
  message: string;
}

interface WhatsappChatBubbleCMSProps {
  chatDirection: WhatsappChatDirection;
  chatStatus: WhatsappChatStatus | null;
  iconStatus: ReactNode | null;
  timestampStatus: string | null;
  createdAt: string;
  children: ReactNode;
  onReply?: () => void;
  replyTo?: WhatsappReplyQuote | null;
  customerName?: string;
}

function describeReplyQuote(quote: WhatsappReplyQuote): string {
  const trimmed = quote.message?.trim();
  if (trimmed) return trimmed;
  switch (quote.type) {
    case "IMAGE":
      return "Photo";
    case "VIDEO":
      return "Video";
    case "AUDIO":
      return "Voice message";
    case "DOCUMENT":
      return "Document";
    case "STICKER":
      return "Sticker";
    default:
      return "Message";
  }
}

export default function WhatsappChatBubbleCMS(
  props: WhatsappChatBubbleCMSProps
) {
  const showReply = props.chatDirection === "INBOUND" && !!props.onReply;

  return (
    <div className="chat-container flex flex-col w-fit max-w-[min(70%,560px)] my-1 gap-1 items-end">
      <div className="flex items-center gap-1">
        <div
          className={`chat-message flex flex-col w-fit max-w-full p-2  text-[15px] font-[450] break-words whitespace-pre-wrap ${props.chatDirection === "INBOUND" ? "bg-white text-[#333333] dark:bg-card-inside-bg dark:text-foreground rounded-r-md rounded-bl-md" : "bg-[#eff6ff] text-[#1e293b] dark:bg-[#1e3a5f] dark:text-foreground rounded-l-md rounded-br-md"}`}
        >
          {props.replyTo && (
            <div className="reply-quote flex items-stretch rounded-md overflow-hidden bg-black/5 dark:bg-white/10 mb-1 max-w-full">
              <div className="w-1 bg-primary shrink-0" />
              <div className="flex flex-col min-w-0 px-2 py-1">
                <span className="text-[11px] font-semibold leading-tight dark:text-sevenpreneur-white">
                  {props.replyTo.direction === "OUTBOUND"
                    ? "You"
                    : (props.customerName ?? "Customer")}
                </span>
                <span className="text-xs leading-snug opacity-80 line-clamp-2 break-words">
                  {describeReplyQuote(props.replyTo)}
                </span>
              </div>
            </div>
          )}
          {props.children}
          {props.chatDirection === "INBOUND" && (
            <span className="chat-timestamp w-full text-right text-xs text-[#333333]/80 dark:text-foreground/60 font-[450] leading-snug">
              {dayjs(props.createdAt).format("HH:mm")}
            </span>
          )}
        </div>
        {showReply && (
          <AppButton
            type="button"
            variant="neutral"
            size="iconRounded"
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            onClick={props.onReply}
            aria-label="Reply"
          >
            <Reply className="size-4" />
          </AppButton>
        )}
      </div>
      {props.chatDirection === "OUTBOUND" && (
        <div className="status-information flex items-center gap-1 justify-end">
          {props.iconStatus}
          {props.chatStatus && (
            <p className="text-sm  font-medium text-[#333333]/80 dark:text-foreground/60">
              {toCapitalizeEachWord(props.chatStatus)}{" "}
              {dayjs(props.timestampStatus).format("HH:mm")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
