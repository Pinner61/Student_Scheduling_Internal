import type { SchedulePeriod, SchedulePeriodStatus } from "@/types";

const STATUS_RANK: Record<SchedulePeriodStatus, number> = {
  OPEN: 0,
  CLOSED: 1,
  DRAFT: 2,
  ARCHIVED: 3,
};

export function validatePeriodDates(startDate: string, endDate: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return "Start and end dates must use YYYY-MM-DD.";
  }
  if (endDate <= startDate) {
    return "End date must be after start date.";
  }
  return null;
}

export function dateBelongsToPeriod(period: SchedulePeriod, date: string): boolean {
  return date >= period.startDate && date <= period.endDate;
}

export function isPeriodReadOnly(period: SchedulePeriod): boolean {
  return period.status === "ARCHIVED";
}

export function canEditAvailability(period: SchedulePeriod): boolean {
  return period.status === "OPEN";
}

export function canCreateException(period: SchedulePeriod): boolean {
  return period.status === "OPEN" || period.status === "CLOSED";
}

export function resolvePeriodForDate(
  periods: SchedulePeriod[],
  date: string
): SchedulePeriod | undefined {
  const covering = periods.filter((p) => dateBelongsToPeriod(p, date));
  if (covering.length === 0) return undefined;
  return [...covering].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])[0];
}

export function resolveCurrentPeriod(
  periods: SchedulePeriod[],
  today: string
): SchedulePeriod | undefined {
  const covering = resolvePeriodForDate(periods, today);
  if (covering && covering.status !== "ARCHIVED") return covering;
  const open = periods
    .filter((p) => p.status === "OPEN")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  if (open[0]) return open[0];
  const active = periods
    .filter((p) => p.status !== "ARCHIVED")
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
  return active[0];
}

export function allowedPeriodTransition(
  from: SchedulePeriodStatus,
  to: SchedulePeriodStatus
): boolean {
  if (from === to) return true;
  if (from === "ARCHIVED") return false;
  if (from === "DRAFT") return to === "OPEN" || to === "ARCHIVED";
  if (from === "OPEN") return to === "CLOSED";
  if (from === "CLOSED") return to === "OPEN" || to === "ARCHIVED";
  return false;
}
