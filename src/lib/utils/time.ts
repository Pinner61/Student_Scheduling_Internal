import { format, parse, addMinutes, addDays, isBefore, isEqual } from "date-fns";
import { enUS } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import type { AppSettings } from "@/types";

export const BUSINESS_TIMEZONE = "America/Phoenix";

export function parseTime(time: string): Date {
  return parse(time, "HH:mm", new Date(2000, 0, 1));
}

export function formatTime12(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour24 = Number(hourStr);
  const minute = minuteStr ?? "00";
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minute} ${suffix}`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  const aS = timeToMinutes(aStart);
  const aE = timeToMinutes(aEnd);
  const bS = timeToMinutes(bStart);
  const bE = timeToMinutes(bEnd);
  return aS < bE && bS < aE;
}

export function isWithinWorkingHours(
  startTime: string,
  endTime: string,
  settings: Pick<AppSettings, "workingDayStart" | "workingDayEnd">
): boolean {
  const dayStart = timeToMinutes(settings.workingDayStart);
  const dayEnd = timeToMinutes(settings.workingDayEnd);
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return start >= dayStart && end <= dayEnd;
}

export function alignToInterval(minutes: number, interval: number): number {
  return Math.round(minutes / interval) * interval;
}

export function nowInBusinessTimezone(): Date {
  return toZonedTime(new Date(), BUSINESS_TIMEZONE);
}

export function formatBusinessDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDayName(dayOfWeek: number): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[dayOfWeek] ?? "Unknown";
}

export function getShortDayName(dayOfWeek: number): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return names[dayOfWeek] ?? "?";
}

export function isTimeInRange(now: string, start: string, end: string): boolean {
  const n = timeToMinutes(now);
  return n >= timeToMinutes(start) && n < timeToMinutes(end);
}

export function compareTimes(a: string, b: string): number {
  return timeToMinutes(a) - timeToMinutes(b);
}

export function mergeAdjacentBlocks<T extends { startTime: string; endTime: string; workMode: string }>(
  blocks: T[]
): T[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort((a, b) => compareTimes(a.startTime, b.startTime));
  const merged: T[] = [{ ...sorted[0] }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (last.workMode === current.workMode && last.endTime === current.startTime) {
      last.endTime = current.endTime;
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

export function splitBlockAtTime<T extends { startTime: string; endTime: string }>(
  block: T,
  splitTime: string
): [T | null, T | null] {
  const start = timeToMinutes(block.startTime);
  const end = timeToMinutes(block.endTime);
  const split = timeToMinutes(splitTime);
  if (split <= start || split >= end) {
    return [block, null];
  }
  return [
    { ...block, endTime: splitTime },
    { ...block, startTime: splitTime },
  ];
}

export function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number
): string[] {
  const slots: string[] = [];
  let current = parseTime(start);
  const endDate = parseTime(end);
  while (isBefore(current, endDate) || isEqual(current, endDate)) {
    slots.push(format(current, "HH:mm", { locale: enUS }));
    current = addMinutes(current, intervalMinutes);
  }
  return slots;
}

export function generateSlotStarts(
  start: string,
  end: string,
  intervalMinutes: number
): string[] {
  const slots: string[] = [];
  for (
    let minutes = timeToMinutes(start);
    minutes < timeToMinutes(end);
    minutes += intervalMinutes
  ) {
    slots.push(minutesToTime(minutes));
  }
  return slots;
}

export function formatWeekRange(weekStart: string): string {
  const start = parse(`${weekStart} 12:00`, "yyyy-MM-dd HH:mm", new Date());
  const end = addDays(start, 4);
  return `${format(start, "MMM d", { locale: enUS })}–${format(end, "d", { locale: enUS })}`;
}

export function formatFriendlyDate(date: string): string {
  return format(parse(`${date} 12:00`, "yyyy-MM-dd HH:mm", new Date()), "EEE, MMM d", {
    locale: enUS,
  });
}

export function formatLongWeekday(date: string): string {
  return format(parse(`${date} 12:00`, "yyyy-MM-dd HH:mm", new Date()), "EEEE, MMMM d", {
    locale: enUS,
  });
}

export function formatLongWeekdayYear(date: string): string {
  return format(parse(`${date} 12:00`, "yyyy-MM-dd HH:mm", new Date()), "EEEE, MMMM d, yyyy", {
    locale: enUS,
  });
}

export function addDaysToDateString(date: string, days: number): string {
  const parsed = parse(`${date} 12:00`, "yyyy-MM-dd HH:mm", new Date());
  return format(addDays(parsed, days), "yyyy-MM-dd", { locale: enUS });
}
