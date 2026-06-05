"use client";
import {
  LeadStatus,
  WhatsappChatDirection,
  WhatsappChatStatus,
  WhatsappChatType,
} from "@/lib/app-types";
import {
  getLabelWhatsappChatType,
  resolveWhatsappChatStatus,
} from "@/lib/whatsapp-utils";
import dayjs from "dayjs";
import Image from "next/image";
import BooleanLabelCMS from "../labels/BooleanLabelCMS";

const variantStyles: Record<
  LeadStatus,
  {
    color: string;
  }
> = {
  COLD: {
    color: "bg-primary-soft-foreground",
  },
  WARM: {
    color: "bg-warning-foreground",
  },
  HOT: {
    color: "bg-destructive",
  },
};

interface WhatsappConvItemCMSProps {
  convId: string;
  convUserFullName: string;
  convUserAvatar: string | null;
  convLastMessage: string;
  convLastMessageDirection: WhatsappChatDirection;
  convLastMessageStatus: WhatsappChatStatus | null;
  convLastMessageType: WhatsappChatType;
  convLastMessageAt: string;
  convLeadStatus: LeadStatus;
  convUnreadMessage: number;
  convIsAssigned: boolean;
  selectedConvId: string;
  onClick?: () => void;
}

export default function WhatsappConvItemCMS(props: WhatsappConvItemCMSProps) {
  const { color } = variantStyles[props.convLeadStatus];
  const isActive = props.convId === props.selectedConvId;

  const initialName = props.convUserFullName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  const { iconStatus } = resolveWhatsappChatStatus(props.convLastMessageStatus);
  const { iconType, labelType } = getLabelWhatsappChatType(
    props.convLastMessageType
  );

  return (
    <div
      onClick={props.onClick}
      className={`conv-item flex gap-2 p-3 justify-between rounded-md overflow-hidden hover:cursor-pointer hover:bg-sb-item-hover ${isActive ? "bg-sb-item-active-bg/50" : ""}`}
    >
      <div className="conv-metadata flex min-w-0 flex-1 items-center gap-3">
        <div className="conv-sender-avatar relative flex">
          <div className="aspect-square size-10 shrink-0 rounded-full overflow-hidden">
            {props.convUserAvatar ? (
              <Image
                className="object-cover w-full h-full"
                src={props.convUserAvatar}
                alt="user"
                width={500}
                height={500}
              />
            ) : (
              <div className="flex w-full h-full items-center justify-center bg-secondary-soft-background text-secondary-soft-foreground dark:bg-sevenpreneur-pink-midgnight dark:text-sevenpreneur-pink-blush">
                <p className=" font-medium">{initialName}</p>
              </div>
            )}
          </div>
          {props.convLeadStatus !== "COLD" && (
            <div
              className={`conv-lead-status absolute bottom-0 -right-1 ${color} aspect-square size-3 rounded-full border-2 border-background`}
            />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <p className="conv-full-name text-[15px] font-semibold  leading-snug line-clamp-1 dark:text-sevenpreneur-white">
            {props.convUserFullName}
          </p>
          <div className="flex items-center gap-1.5">
            {props.convLastMessageDirection === "OUTBOUND" && (
              <div>{iconStatus}</div>
            )}
            <div className="flex items-center gap-1 min-w-0">
              {props.convLastMessageType !== "TEXT" && <div>{iconType}</div>}
              <p className="conv-last-message text-sm text-emphasis  font-[450] line-clamp-1">
                {props.convLastMessageType === "TEXT"
                  ? props.convLastMessage
                  : labelType}
              </p>
            </div>
          </div>
          <div className="mt-1">
            <BooleanLabelCMS
              value={props.convIsAssigned}
              label={props.convIsAssigned ? "Assigned" : "Unassigned"}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-1 items-end shrink-0">
        <p
          className={`conv-last-message-at text-[13px]  font-medium line-clamp-1 ${props.convUnreadMessage > 0 ? "text-cms-primary" : ""}`}
        >
          {dayjs(props.convLastMessageAt).format("HH:mm")}
        </p>
        {props.convUnreadMessage > 0 && (
          <p className="conv-unread-messages w-fit text-[10px] text-tertiary-foreground bg-tertiary-background  font-bold py-0.5 px-2 rounded-full">
            {props.convUnreadMessage}
          </p>
        )}
      </div>
    </div>
  );
}
