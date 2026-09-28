import { cn } from "@/lib/utils/cn";
import type { ExceptionStatus, ScheduleStatus, WorkMode } from "@/types";

export function workModeCellClass(mode: WorkMode | null | undefined, options?: { compact?: boolean }) {
  if (mode === "OFFICE") {
    return cn(
      "border-sky-400 bg-sky-200 text-sky-950",
      options?.compact && "text-[10px]"
    );
  }
  if (mode === "REMOTE") {
    return cn(
      "border-violet-400 bg-violet-200 text-violet-950",
      options?.compact && "text-[10px]"
    );
  }
  return "border-transparent bg-transparent text-[var(--color-muted-foreground)]";
}

export function workModeLabel(mode: WorkMode): string {
  return mode === "OFFICE" ? "Office" : "Remote";
}

export function exceptionOverlayClass(unavailable: boolean) {
  if (unavailable) {
    return cn(
      "border-amber-500 bg-amber-100 text-amber-950",
      "bg-[repeating-linear-gradient(135deg,transparent,transparent_5px,rgba(180,83,9,0.18)_5px,rgba(180,83,9,0.18)_9px)]"
    );
  }
  return "ring-1 ring-inset ring-amber-500/80";
}

export function exceptionStatusLabel(status: ExceptionStatus): string {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "APPROVED":
      return "Approved";
    case "DECLINED":
      return "Rejected";
    case "CANCELLED":
      return "Cancelled";
  }
}

export function scheduleStatusLabel(status: ScheduleStatus): string {
  return status === "submitted" ? "Schedule submitted" : "No schedule submitted";
}

export const EXCEPTION_TYPE_LABEL: Record<string, string> = {
  UNAVAILABLE: "Unavailable",
  REMOTE_INSTEAD: "Remote instead of Office",
  OFFICE_INSTEAD: "Office instead of Remote",
  ALTERNATE_AVAILABILITY: "Alternate availability",
};

export const AUDIT_ACTION_LABEL: Record<string, string> = {
  availability_changed: "Updated availability",
  exception_submitted: "Submitted an exception",
  exception_approved: "Approved an exception",
  exception_declined: "Rejected an exception",
  exception_cancelled: "Cancelled an exception",
  user_created: "Created a user",
  user_updated: "Updated a user",
  user_role_changed: "Changed a user role",
  team_assignment_changed: "Changed a team assignment",
  user_deactivated: "Deactivated a user",
  user_reactivated: "Reactivated a user",
  team_created: "Created a team",
  team_updated: "Updated a team",
  team_archived: "Archived a team",
  settings_changed: "Changed settings",
};
