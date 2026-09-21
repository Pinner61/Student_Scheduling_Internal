import type {
  RecurringAvailability,
  ScheduleBlock,
  ScheduleException,
  TimeRange,
  WorkMode,
} from "@/types";
import {
  compareTimes,
  formatBusinessDate,
  getDayName,
  mergeAdjacentBlocks,
  minutesToTime,
  nowInBusinessTimezone,
  rangesOverlap,
  timeToMinutes,
} from "@/lib/utils/time";
import { addDays, format, startOfWeek } from "date-fns";

export interface AvailabilityInput {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  workMode: WorkMode;
}

export function validateAvailabilityRanges(
  ranges: AvailabilityInput[],
  workingDayStart: string,
  workingDayEnd: string
): string[] {
  const errors: string[] = [];
  const byDay = new Map<number, AvailabilityInput[]>();

  for (const range of ranges) {
    if (timeToMinutes(range.startTime) >= timeToMinutes(range.endTime)) {
      errors.push(`${getDayName(range.dayOfWeek)}: End time must be after start time.`);
    }
    if (
      timeToMinutes(range.startTime) < timeToMinutes(workingDayStart) ||
      timeToMinutes(range.endTime) > timeToMinutes(workingDayEnd)
    ) {
      errors.push(
        `${getDayName(range.dayOfWeek)}: Range must be within working hours (${workingDayStart}–${workingDayEnd}).`
      );
    }
    const dayRanges = byDay.get(range.dayOfWeek) ?? [];
    for (const existing of dayRanges) {
      if (
        rangesOverlap(
          range.startTime,
          range.endTime,
          existing.startTime,
          existing.endTime
        )
      ) {
        errors.push(`${getDayName(range.dayOfWeek)}: Overlapping time ranges detected.`);
      }
    }
    dayRanges.push(range);
    byDay.set(range.dayOfWeek, dayRanges);
  }

  return [...new Set(errors)];
}

export function recurringToBlocksForDate(
  recurring: RecurringAvailability[],
  date: string
): ScheduleBlock[] {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
  return recurring
    .filter((r) => r.dayOfWeek === dayOfWeek)
    .map((r) => ({
      id: r.id,
      date,
      dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
      workMode: r.workMode,
      source: "recurring" as const,
    }))
    .sort((a, b) => compareTimes(a.startTime, b.startTime));
}

export function applyExceptionToBlocks(
  blocks: ScheduleBlock[],
  exception: ScheduleException
): ScheduleBlock[] {
  if (exception.status !== "APPROVED") return blocks;

  const { exceptionType, startTime, endTime, replacementMode } = exception;
  let result = [...blocks];

  if (exceptionType === "UNAVAILABLE") {
    result = subtractTimeRange(result, startTime, endTime);
    return result;
  }

  if (exceptionType === "REMOTE_INSTEAD" || exceptionType === "OFFICE_INSTEAD") {
    const mode: WorkMode =
      exceptionType === "REMOTE_INSTEAD" ? "REMOTE" : "OFFICE";
    result = replaceModeInRange(result, startTime, endTime, mode);
    return result;
  }

  if (exceptionType === "ALTERNATE_AVAILABILITY" && replacementMode) {
    result = subtractTimeRange(result, startTime, endTime);
    result.push({
      date: exception.exceptionDate,
      dayOfWeek: new Date(`${exception.exceptionDate}T12:00:00`).getDay(),
      startTime,
      endTime,
      workMode: replacementMode,
      source: "exception",
      exceptionId: exception.id,
    });
    result.sort((a, b) => compareTimes(a.startTime, b.startTime));
    return mergeAdjacentScheduleBlocks(result);
  }

  return result;
}

function subtractTimeRange(
  blocks: ScheduleBlock[],
  rangeStart: string,
  rangeEnd: string
): ScheduleBlock[] {
  const result: ScheduleBlock[] = [];
  for (const block of blocks) {
    if (
      !rangesOverlap(block.startTime, block.endTime, rangeStart, rangeEnd)
    ) {
      result.push(block);
      continue;
    }
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = timeToMinutes(block.endTime);
    const cutStart = timeToMinutes(rangeStart);
    const cutEnd = timeToMinutes(rangeEnd);

    if (blockStart < cutStart) {
      result.push({ ...block, endTime: rangeStart });
    }
    if (blockEnd > cutEnd) {
      result.push({ ...block, startTime: rangeEnd });
    }
  }
  return mergeAdjacentScheduleBlocks(result);
}

function replaceModeInRange(
  blocks: ScheduleBlock[],
  rangeStart: string,
  rangeEnd: string,
  mode: WorkMode
): ScheduleBlock[] {
  const overlapping = blocks.filter((b) =>
    rangesOverlap(b.startTime, b.endTime, rangeStart, rangeEnd)
  );

  if (overlapping.length === 0) {
    return blocks;
  }

  const clipStartMinutes = Math.max(
    timeToMinutes(rangeStart),
    Math.min(...overlapping.map((b) => timeToMinutes(b.startTime)))
  );
  const clipEndMinutes = Math.min(
    timeToMinutes(rangeEnd),
    Math.max(...overlapping.map((b) => timeToMinutes(b.endTime)))
  );
  const clipStart = minutesToTime(clipStartMinutes);
  const clipEnd = minutesToTime(clipEndMinutes);

  const before = subtractTimeRange(blocks, clipStart, clipEnd);
  const newBlock: ScheduleBlock = {
    date: blocks[0]?.date ?? "",
    dayOfWeek: blocks[0]?.dayOfWeek ?? 0,
    startTime: clipStart,
    endTime: clipEnd,
    workMode: mode,
    source: "exception",
  };

  const combined = [...before, newBlock].sort((a, b) =>
    compareTimes(a.startTime, b.startTime)
  );
  return mergeAdjacentScheduleBlocks(combined);
}

function mergeAdjacentScheduleBlocks(blocks: ScheduleBlock[]): ScheduleBlock[] {
  return mergeAdjacentBlocks(blocks).map((b) => ({
    ...b,
    date: blocks[0]?.date ?? "",
    dayOfWeek: blocks[0]?.dayOfWeek ?? 0,
    source: b.source ?? "recurring",
  }));
}

export function previewExceptionOnDate(
  recurring: RecurringAvailability[],
  existingExceptions: ScheduleException[],
  exception: ScheduleException,
  date: string
): ScheduleBlock[] {
  const others = existingExceptions.filter((e) => e.id !== exception.id);
  const asApproved: ScheduleException = { ...exception, status: "APPROVED" };
  return getEffectiveScheduleForDate(recurring, [...others, asApproved], date);
}

export function getEffectiveScheduleForDate(
  recurring: RecurringAvailability[],
  exceptions: ScheduleException[],
  date: string
): ScheduleBlock[] {
  let blocks = mergeAdjacentScheduleBlocks(recurringToBlocksForDate(recurring, date));
  const dayExceptions = exceptions
    .filter((e) => e.exceptionDate === date && e.status === "APPROVED")
    .sort((a, b) => compareTimes(a.startTime, b.startTime));

  for (const exception of dayExceptions) {
    blocks = applyExceptionToBlocks(blocks, exception);
  }

  return blocks.sort((a, b) => compareTimes(a.startTime, b.startTime));
}

export function getEffectiveScheduleForWeek(
  recurring: RecurringAvailability[],
  exceptions: ScheduleException[],
  weekStartDate: string
): Map<string, ScheduleBlock[]> {
  const result = new Map<string, ScheduleBlock[]>();
  const start = new Date(`${weekStartDate}T12:00:00`);
  for (let i = 0; i < 7; i++) {
    const date = format(addDays(start, i), "yyyy-MM-dd");
    result.set(date, getEffectiveScheduleForDate(recurring, exceptions, date));
  }
  return result;
}

export function getCurrentWeekStart(referenceDate?: Date): string {
  const ref = referenceDate ?? nowInBusinessTimezone();
  const monday = startOfWeek(ref, { weekStartsOn: 1 });
  return format(monday, "yyyy-MM-dd");
}

export function recurringToWeeklyRanges(
  recurring: RecurringAvailability[]
): Map<number, TimeRange[]> {
  const map = new Map<number, TimeRange[]>();
  for (const r of recurring) {
    const ranges = map.get(r.dayOfWeek) ?? [];
    ranges.push({
      startTime: r.startTime,
      endTime: r.endTime,
      workMode: r.workMode,
    });
    map.set(r.dayOfWeek, ranges);
  }
  for (const [day, ranges] of map) {
    map.set(
      day,
      mergeAdjacentBlocks(ranges).sort((a, b) =>
        compareTimes(a.startTime, b.startTime)
      )
    );
  }
  return map;
}

export function isCurrentlyWorking(blocks: ScheduleBlock[], nowTime: string): boolean {
  return blocks.some(
    (b) =>
      compareTimes(b.startTime, nowTime) <= 0 &&
      compareTimes(b.endTime, nowTime) > 0
  );
}

export function getScheduleStatus(
  recurring: RecurringAvailability[],
  minHoursPerWeek = 5
): "complete" | "incomplete" | "not_started" {
  if (recurring.length === 0) return "not_started";
  const totalMinutes = recurring.reduce(
    (sum, r) => sum + (timeToMinutes(r.endTime) - timeToMinutes(r.startTime)),
    0
  );
  return totalMinutes >= minHoursPerWeek * 60 ? "complete" : "incomplete";
}

export function getTodayDateString(): string {
  return formatBusinessDate(nowInBusinessTimezone());
}

export function getNowTimeString(): string {
  return format(nowInBusinessTimezone(), "HH:mm");
}
