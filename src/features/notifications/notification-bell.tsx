"use client";

import { useState, useTransition } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AppNotification } from "@/types";
import { Button } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/scheduling";

export function NotificationBell({ notifications }: { notifications: AppNotification[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((item) => item.status === "unread").length;

  function markOne(id: string) {
    startTransition(async () => {
      await markNotificationReadAction(id);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--color-primary)]">
            <span className="sr-only">{unread} unread</span>
          </span>
        )}
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-80 rounded-md border bg-white p-3 shadow-lg"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={markAll} disabled={pending}>
                Mark all read
              </Button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No notifications yet.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {notifications.slice(0, 12).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
                    onClick={() => markOne(item.id)}
                  >
                    <span className="block font-medium">
                      {item.status === "unread" ? "Unread · " : "Read · "}
                      {item.title}
                    </span>
                    <span className="block text-[var(--color-muted-foreground)]">{item.body}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
