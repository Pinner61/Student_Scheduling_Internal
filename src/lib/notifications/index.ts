export type NotificationEventName =
  | "exception_submitted"
  | "exception_approved"
  | "exception_declined"
  | "schedule_changed"
  | "missing_schedule_reminder";

export interface NotificationEvent {
  name: NotificationEventName;
  recipientUserIds: string[];
  payload: Record<string, unknown>;
}

export interface NotificationChannel {
  send(event: NotificationEvent): Promise<void> | void;
}

class InAppNotificationChannel implements NotificationChannel {
  send(): void {
    // In-app feedback is currently delivered through toasts at the UI layer.
  }
}

const channels: NotificationChannel[] = [new InAppNotificationChannel()];

export function registerNotificationChannel(channel: NotificationChannel): void {
  channels.push(channel);
}

export async function notify(event: NotificationEvent): Promise<void> {
  await Promise.all(channels.map((channel) => channel.send(event)));
}
