import type { ScheduleException } from "@/types";

export const REJECTED_VISIBLE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isDeclinedVisibleToStudent(
  exception: ScheduleException,
  now = new Date()
): boolean {
  if (exception.status !== "DECLINED") return false;
  const stamp = exception.reviewedAt ?? exception.updatedAt;
  const then = new Date(stamp).getTime();
  if (Number.isNaN(then)) return false;
  return now.getTime() - then <= REJECTED_VISIBLE_DAYS * DAY_MS;
}

export function studentVisibleExceptions(
  exceptions: ScheduleException[],
  now = new Date()
): ScheduleException[] {
  return exceptions.filter((exception) => {
    if (exception.status === "PENDING" || exception.status === "APPROVED") return true;
    if (exception.status === "DECLINED") return isDeclinedVisibleToStudent(exception, now);
    return false;
  });
}
