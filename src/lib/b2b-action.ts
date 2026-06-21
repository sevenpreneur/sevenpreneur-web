import {
  B2BActionPriorityEnum,
  B2BActionStatusEnum,
  B2BActivityTypeEnum,
} from "@prisma/client";

// Kanban columns, in display order. `dot` is the colored status indicator.
export const B2B_ACTION_STATUSES: {
  value: B2BActionStatusEnum;
  label: string;
  dot: string;
}[] = [
  { value: "TO_DO", label: "To Do", dot: "bg-primary" },
  { value: "IN_PROGRESS", label: "In Progress", dot: "bg-warning-foreground" },
  { value: "REVIEW", label: "Review", dot: "bg-tertiary" },
  { value: "DONE", label: "Done", dot: "bg-success-foreground" },
];

export const B2B_ACTION_PRIORITIES: {
  value: B2BActionPriorityEnum;
  label: string;
}[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export const B2B_ACTION_ACTIVITY_TYPES: {
  value: B2BActivityTypeEnum;
  label: string;
}[] = [
  { value: "CHAT_WHATSAPP", label: "WhatsApp Chat" },
  { value: "COLD_EMAIL", label: "Cold Email" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "CONFERENCE_CALL", label: "Conference Call" },
  { value: "OFFLINE_MEETING", label: "Offline Meeting" },
  { value: "IN_PERSON_MEETING", label: "In-Person Meeting" },
  { value: "SENT_PROPOSAL", label: "Sent Proposal" },
  { value: "SENT_CONTRACT", label: "Sent Contract" },
  { value: "FOLLOW_UP", label: "Follow Up" },
];
