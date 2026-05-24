import LogError from "@/lib/prisma-log-error";
import { IGWebhookMessagingEvent } from "./type.ig.webhook";

export async function handleMessagingEvent(
  ig_business_account_id: string,
  event: IGWebhookMessagingEvent
): Promise<boolean> {
  try {
    // Skip echoes (messages we sent ourselves) to avoid loops
    if (event.message?.is_echo) {
      return true;
    }

    // Skip deleted/unsupported messages
    if (event.message?.is_deleted || event.message?.is_unsupported) {
      return true;
    }

    if (event.message) {
      console.log(
        `[instagram.webhook] message received account=${ig_business_account_id} mid=${event.message.mid} from=${event.sender.id} to=${event.recipient.id} text=${JSON.stringify(event.message.text ?? null)} attachments=${event.message.attachments?.length ?? 0} reply_to=${event.message.reply_to?.mid ?? "none"}`
      );
    } else if (event.read) {
      console.log(
        `[instagram.webhook] read receipt account=${ig_business_account_id} mid=${event.read.mid} from=${event.sender.id}`
      );
    } else if (event.reaction) {
      console.log(
        `[instagram.webhook] reaction account=${ig_business_account_id} mid=${event.reaction.mid} action=${event.reaction.action} emoji=${event.reaction.emoji ?? event.reaction.reaction ?? "none"}`
      );
    } else if (event.postback) {
      console.log(
        `[instagram.webhook] postback account=${ig_business_account_id} mid=${event.postback.mid} payload=${event.postback.payload}`
      );
    } else {
      console.log(
        `[instagram.webhook] unhandled messaging event account=${ig_business_account_id} payload=${JSON.stringify(event)}`
      );
    }

    return true;
  } catch (e) {
    await LogError("instagram.webhook", "Failed to handle messaging event.", e);
    return false;
  }
}
