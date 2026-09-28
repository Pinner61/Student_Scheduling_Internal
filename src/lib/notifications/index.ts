import { logger } from "@/lib/logging/logger";
import { sendEmailNotification } from "./email";

export type NotificationEventName =
  | "exception_submitted"
  | "exception_approved"
  | "exception_declined"
  | "schedule_changed"
  | "schedule_submitted"
  | "period_opened"
  | "missing_schedule_reminder";

export interface NotificationEvent {
  name: NotificationEventName;
  recipientUserIds: string[];
  payload: Record<string, unknown>;
}

export interface NotificationChannel {
  send(event: NotificationEvent): Promise<void> | void;
}

class EmailNotificationChannel implements NotificationChannel {
  async send(event: NotificationEvent): Promise<void> {
    try {
      await sendEmailNotification(event);
    } catch (error) {
      logger.error("notification_email_failed", {
        name: event.name,
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }
}

const channels: NotificationChannel[] = [new EmailNotificationChannel()];

export function registerNotificationChannel(channel: NotificationChannel): void {
  channels.push(channel);
}

export async function notify(event: NotificationEvent): Promise<void> {
  await Promise.all(channels.map((channel) => channel.send(event)));
}
