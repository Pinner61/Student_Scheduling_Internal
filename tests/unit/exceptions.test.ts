import { describe, expect, it } from "vitest";
import {
  isDeclinedVisibleToStudent,
  studentVisibleExceptions,
} from "@/lib/schedule/exceptions";
import type { ScheduleException } from "@/types";

function exception(overrides: Partial<ScheduleException>): ScheduleException {
  return {
    id: "e1",
    userId: "u1",
    exceptionDate: "2026-09-21",
    startTime: "10:00",
    endTime: "11:00",
    exceptionType: "UNAVAILABLE",
    replacementMode: null,
    reason: null,
    status: "DECLINED",
    reviewedBy: "sup",
    reviewedAt: "2026-09-20T00:00:00.000Z",
    reviewNote: "Need coverage",
    createdAt: "2026-09-19T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("student exception visibility", () => {
  it("keeps rejected exceptions visible for 14 days", () => {
    const now = new Date("2026-09-27T00:00:00.000Z");
    expect(isDeclinedVisibleToStudent(exception({ reviewedAt: "2026-09-20T00:00:00.000Z" }), now)).toBe(
      true
    );
    expect(isDeclinedVisibleToStudent(exception({ reviewedAt: "2026-09-01T00:00:00.000Z" }), now)).toBe(
      false
    );
  });

  it("always shows pending and approved exceptions", () => {
    const items = studentVisibleExceptions([
      exception({ id: "p", status: "PENDING" }),
      exception({ id: "a", status: "APPROVED" }),
      exception({ id: "old", status: "DECLINED", reviewedAt: "2026-01-01T00:00:00.000Z" }),
    ]);
    expect(items.map((e) => e.id)).toEqual(["p", "a"]);
  });
});
