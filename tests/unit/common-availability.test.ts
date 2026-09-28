import { describe, expect, it } from "vitest";
import { findCommonAvailabilityWindows } from "@/lib/schedule/common-availability";
import { getEffectiveScheduleForDate } from "@/lib/schedule/engine";
import type { RecurringAvailability, ScheduleException } from "@/types";

function recurring(
  userId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string
): RecurringAvailability {
  return {
    id: `${userId}-${dayOfWeek}-${startTime}`,
    userId,
    schedulePeriodId: "p1",
    dayOfWeek,
    startTime,
    endTime,
    workMode: "OFFICE",
    effectiveFrom: null,
    effectiveUntil: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function exception(overrides: Partial<ScheduleException> & Pick<ScheduleException, "userId" | "status">): ScheduleException {
  return {
    id: overrides.id ?? "e1",
    schedulePeriodId: "p1",
    exceptionDate: "2026-09-15",
    startTime: "14:00",
    endTime: "15:00",
    exceptionType: "UNAVAILABLE",
    replacementMode: null,
    reason: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("common availability", () => {
  const tuesday = "2026-09-15";

  it("calculates full overlap correctly", () => {
    const students = ["a", "b", "c", "d"].map((id) => ({
      id,
      blocksByDate: new Map([
        [
          tuesday,
          getEffectiveScheduleForDate(
            [recurring(id, 2, "14:00", "16:00")],
            [],
            tuesday
          ),
        ],
      ]),
    }));
    const result = findCommonAvailabilityWindows({
      students,
      startDate: tuesday,
      endDate: tuesday,
      durationMinutes: 60,
      intervalMinutes: 30,
      workingDayStart: "08:00",
      workingDayEnd: "18:00",
    });
    expect(result.full.some((window) => window.startTime === "14:00" && window.endTime === "15:00")).toBe(
      true
    );
    expect(result.full[0].availableCount).toBe(4);
  });

  it("lets an approved exception change the result and ignores pending", () => {
    const approved = exception({ id: "approved", userId: "a", status: "APPROVED" });
    const pending = exception({ id: "pending", userId: "b", status: "PENDING" });
    const students = ["a", "b"].map((id) => ({
      id,
      blocksByDate: new Map([
        [
          tuesday,
          getEffectiveScheduleForDate(
            [recurring(id, 2, "14:00", "16:00")],
            id === "a" ? [approved] : [pending],
            tuesday
          ),
        ],
      ]),
    }));
    const result = findCommonAvailabilityWindows({
      students,
      startDate: tuesday,
      endDate: tuesday,
      durationMinutes: 60,
      intervalMinutes: 30,
      workingDayStart: "08:00",
      workingDayEnd: "18:00",
    });
    expect(
      result.full.some((window) => window.startTime === "14:00" && window.endTime === "15:00")
    ).toBe(false);
    expect(
      result.partial.some(
        (window) => window.startTime === "14:00" && window.availableCount === 1
      )
    ).toBe(true);
  });
});
