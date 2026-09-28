import type { CommonAvailabilityWindow, ScheduleBlock, WorkMode } from "@/types";
import { coversTimeWindow } from "@/lib/schedule/engine";
import {
  addDaysToDateString,
  generateSlotStarts,
  minutesToTime,
  timeToMinutes,
} from "@/lib/utils/time";

export interface CommonAvailabilityInput {
  students: { id: string; blocksByDate: Map<string, ScheduleBlock[]> }[];
  startDate: string;
  endDate: string;
  durationMinutes: number;
  intervalMinutes: number;
  workingDayStart: string;
  workingDayEnd: string;
  workMode?: WorkMode | "all";
}

export function findCommonAvailabilityWindows(
  input: CommonAvailabilityInput
): { full: CommonAvailabilityWindow[]; partial: CommonAvailabilityWindow[] } {
  const total = input.students.length;
  const full: CommonAvailabilityWindow[] = [];
  const partial: CommonAvailabilityWindow[] = [];
  if (total === 0 || input.durationMinutes <= 0) {
    return { full, partial };
  }
  if (input.durationMinutes % input.intervalMinutes !== 0) {
    return { full, partial };
  }

  const slots = generateSlotStarts(
    input.workingDayStart,
    input.workingDayEnd,
    input.intervalMinutes
  );
  const windowSlots = input.durationMinutes / input.intervalMinutes;

  for (
    let date = input.startDate;
    date <= input.endDate;
    date = addDaysToDateString(date, 1)
  ) {
    const dayOfWeek = new Date(`${date}T12:00:00`).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (let i = 0; i + windowSlots <= slots.length; i++) {
      const startTime = slots[i];
      const endTime = minutesToTime(timeToMinutes(startTime) + input.durationMinutes);
      const availableStudentIds: string[] = [];

      for (const student of input.students) {
        const blocks = (student.blocksByDate.get(date) ?? []).filter((block) => {
          if (!input.workMode || input.workMode === "all") return true;
          return block.workMode === input.workMode;
        });
        if (coversTimeWindow(blocks, startTime, endTime)) {
          availableStudentIds.push(student.id);
        }
      }

      const availableCount = availableStudentIds.length;
      if (availableCount === 0) continue;

      const window: CommonAvailabilityWindow = {
        date,
        dayOfWeek,
        startTime,
        endTime,
        availableCount,
        totalCount: total,
        availableStudentIds,
        fullMatch: availableCount === total,
      };

      if (window.fullMatch) full.push(window);
      else if (availableCount > 0 && availableCount < total) {
        const minPartial = total <= 2 ? 1 : Math.max(2, Math.ceil(total * 0.5));
        if (availableCount >= minPartial) partial.push(window);
      }
    }
  }

  return { full, partial };
}
