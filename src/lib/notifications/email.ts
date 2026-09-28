import { logger } from "@/lib/logging/logger";
import type { NotificationEvent } from "./index";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_URL ||
      process.env.RESEND_API_KEY ||
      process.env.EMAIL_PROVIDER_API_KEY
  );
}

export async function sendEmailNotification(event: NotificationEvent): Promise<void> {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      logger.info("email_skipped_unconfigured", {
        name: event.name,
        recipients: event.recipientUserIds.length,
      });
    }
    return;
  }

  logger.warn("email_provider_not_implemented", {
    name: event.name,
    recipients: event.recipientUserIds.length,
  });
}
