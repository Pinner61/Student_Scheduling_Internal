import type { WorkMode } from "@/types";
import {
  formatTime12,
  generateSlotStarts,
  getDayName,
  minutesToTime,
  timeToMinutes,
} from "@/lib/utils/time";

export const WEEKDAYS = [1, 2, 3, 4, 5] as const;

export type PaintTool = "OFFICE" | "REMOTE" | "CLEAR";
export type CellKey = `${number}|${string}`;

export interface AvailabilityRangeLike {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  workMode: WorkMode;
}

export function cellKey(dayOfWeek: number, slotStart: string): CellKey {
  return `${dayOfWeek}|${slotStart}`;
}

export function parseCellKey(key: string): { dayOfWeek: number; slotStart: string } {
  const [day, slotStart] = key.split("|");
  return { dayOfWeek: Number(day), slotStart };
}

export function rangesToCellMap(
  ranges: AvailabilityRangeLike[],
  slotStarts: string[],
  intervalMinutes: number
): Record<string, WorkMode> {
  const map: Record<string, WorkMode> = {};
  for (const range of ranges) {
    for (const slot of slotStarts) {
      const slotEnd = minutesToTime(timeToMinutes(slot) + intervalMinutes);
      if (timeToMinutes(slot) >= timeToMinutes(range.startTime) && timeToMinutes(slotEnd) <= timeToMinutes(range.endTime)) {
        map[cellKey(range.dayOfWeek, slot)] = range.workMode;
      }
    }
  }
  return map;
}

export function cellMapToRanges(
  map: Record<string, WorkMode>,
  slotStarts: string[],
  intervalMinutes: number
): AvailabilityRangeLike[] {
  const ranges: AvailabilityRangeLike[] = [];
  for (const day of WEEKDAYS) {
    let current: AvailabilityRangeLike | null = null;
    for (const slot of slotStarts) {
      const mode = map[cellKey(day, slot)];
      const slotEnd = minutesToTime(timeToMinutes(slot) + intervalMinutes);
      if (!mode) {
        if (current) {
          ranges.push(current);
          current = null;
        }
        continue;
      }
      if (current && current.workMode === mode && current.endTime === slot) {
        current.endTime = slotEnd;
      } else {
        if (current) ranges.push(current);
        current = {
          dayOfWeek: day,
          startTime: slot,
          endTime: slotEnd,
          workMode: mode,
        };
      }
    }
    if (current) ranges.push(current);
  }
  return ranges;
}

export function formatWeeklyAvailabilityCopy(ranges: AvailabilityRangeLike[]): string {
  return WEEKDAYS.map((day) => {
    const dayRanges = ranges
      .filter((r) => r.dayOfWeek === day)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
    if (dayRanges.length === 0) {
      return `${getDayName(day)}\nUnavailable`;
    }
    const office = dayRanges.filter((r) => r.workMode === "OFFICE");
    const remote = dayRanges.filter((r) => r.workMode === "REMOTE");
    const lines = [getDayName(day)];
    if (office.length > 0) {
      lines.push(
        `Office: ${office.map((r) => `${formatTime12(r.startTime)}–${formatTime12(r.endTime)}`).join(", ")}`
      );
    }
    if (remote.length > 0) {
      lines.push(
        `Remote: ${remote.map((r) => `${formatTime12(r.startTime)}–${formatTime12(r.endTime)}`).join(", ")}`
      );
    }
    return lines.join("\n");
  }).join("\n\n");
}

export { generateSlotStarts };
