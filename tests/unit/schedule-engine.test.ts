import { describe, expect, it } from "vitest";
import {
  getEffectiveScheduleForDate,
  validateAvailabilityRanges,
} from "@/lib/schedule/engine";
import type { RecurringAvailability, ScheduleException } from "@/types";

function recurring(
  overrides: Partial<RecurringAvailability> & Pick<RecurringAvailability, "dayOfWeek" | "startTime" | "endTime" | "workMode">
): RecurringAvailability {
  return {
    id: "r1",
    userId: "u1",
    effectiveFrom: null,
    effectiveUntil: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function exception(
  overrides: Partial<ScheduleException> & Pick<ScheduleException, "exceptionDate" | "startTime" | "endTime" | "exceptionType">
): ScheduleException {
  return {
    id: "e1",
    userId: "u1",
    replacementMode: null,
    reason: null,
    status: "APPROVED",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("validateAvailabilityRanges", () => {
  it("detects overlapping ranges on the same day", () => {
    const errors = validateAvailabilityRanges(
      [
        { dayOfWeek: 1, startTime: "09:00", endTime: "12:00", workMode: "OFFICE" },
        { dayOfWeek: 1, startTime: "11:00", endTime: "14:00", workMode: "REMOTE" },
      ],
      "08:00",
      "18:00"
    );
    expect(errors.some((e) => e.includes("Overlapping"))).toBe(true);
  });

  it("rejects invalid start/end and out-of-bounds times", () => {
    const errors = validateAvailabilityRanges(
      [{ dayOfWeek: 1, startTime: "14:00", endTime: "10:00", workMode: "OFFICE" }],
      "08:00",
      "18:00"
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("exception application", () => {
  const monday = "2026-09-14";

  it("splits an unavailable exception out of a recurring block", () => {
    const blocks = getEffectiveScheduleForDate(
      [recurring({ dayOfWeek: 1, startTime: "09:00", endTime: "13:00", workMode: "OFFICE" })],
      [
        exception({
          exceptionDate: monday,
          startTime: "10:00",
          endTime: "11:00",
          exceptionType: "UNAVAILABLE",
        }),
      ],
      monday
    );
    expect(blocks.map((b) => `${b.startTime}-${b.endTime}:${b.workMode}`)).toEqual([
      "09:00-10:00:OFFICE",
      "11:00-13:00:OFFICE",
    ]);
  });

  it("replaces work mode in an overlapping range", () => {
    const blocks = getEffectiveScheduleForDate(
      [recurring({ dayOfWeek: 1, startTime: "13:00", endTime: "16:00", workMode: "OFFICE" })],
      [
        exception({
          exceptionDate: monday,
          startTime: "14:00",
          endTime: "15:00",
          exceptionType: "REMOTE_INSTEAD",
          replacementMode: "REMOTE",
        }),
      ],
      monday
    );
    expect(blocks.map((b) => `${b.startTime}-${b.endTime}:${b.workMode}`)).toEqual([
      "13:00-14:00:OFFICE",
      "14:00-15:00:REMOTE",
      "15:00-16:00:OFFICE",
    ]);
  });

  it("merges adjacent blocks of the same mode through the effective schedule", () => {
    const monday = "2026-09-14";
    const blocks = getEffectiveScheduleForDate(
      [
        recurring({ id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "10:00", workMode: "OFFICE" }),
        recurring({ id: "b", dayOfWeek: 1, startTime: "10:00", endTime: "12:00", workMode: "OFFICE" }),
      ],
      [],
      monday
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].startTime).toBe("09:00");
    expect(blocks[0].endTime).toBe("12:00");
  });

  it("ignores pending exceptions when computing effective schedule", () => {
    const blocks = getEffectiveScheduleForDate(
      [recurring({ dayOfWeek: 1, startTime: "09:00", endTime: "13:00", workMode: "OFFICE" })],
      [
        exception({
          exceptionDate: monday,
          startTime: "09:00",
          endTime: "13:00",
          exceptionType: "UNAVAILABLE",
          status: "PENDING",
        }),
      ],
      monday
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].endTime).toBe("13:00");
  });
});
