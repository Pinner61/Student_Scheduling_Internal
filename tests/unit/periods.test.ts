import { describe, expect, it, beforeEach } from "vitest";
import { getProfileByEmail, resetDemoStore } from "@/lib/demo/store";
import {
  changePeriodStatus,
  createPeriod,
  getAvailability,
  getCurrentPeriod,
  getEffectiveSchedule,
  reopenSchedule,
  saveAvailability,
  submitException,
  submitSchedule,
  updatePeriod,
} from "@/lib/services/data-service";
import type { SessionUser } from "@/types";

function asSession(email: string): SessionUser {
  const profile = getProfileByEmail(email);
  if (!profile) throw new Error(`missing profile ${email}`);
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
}

describe("schedule periods", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("creates a valid period as draft", () => {
    const admin = asSession("preyes@asu.edu");
    const period = createPeriod(admin, {
      name: "Summer 2027",
      startDate: "2027-05-17",
      endDate: "2027-08-13",
    });
    expect(period.status).toBe("DRAFT");
  });

  it("rejects an invalid date range", () => {
    const admin = asSession("preyes@asu.edu");
    expect(() =>
      createPeriod(admin, {
        name: "Broken",
        startDate: "2027-08-13",
        endDate: "2027-05-17",
      })
    ).toThrow(/End date/);
  });

  it("does not allow archived periods to be edited", () => {
    const admin = asSession("preyes@asu.edu");
    const period = createPeriod(admin, {
      name: "Archive Me",
      startDate: "2028-01-01",
      endDate: "2028-05-01",
    });
    changePeriodStatus(admin, period.id, "OPEN");
    changePeriodStatus(admin, period.id, "CLOSED");
    changePeriodStatus(admin, period.id, "ARCHIVED");
    expect(() => updatePeriod(admin, period.id, { name: "Nope" })).toThrow(/Archived/);
  });

  it("loads the current period schedule independently", () => {
    const student = asSession("alex.chen@asu.edu");
    const current = getCurrentPeriod();
    expect(current?.name).toBe("Fall 2026");
    expect(getAvailability(student.id, current?.id).length).toBeGreaterThan(0);
  });
});

describe("submission lifecycle", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("moves draft to submitted and records a timestamp", () => {
    const student = asSession("alex.chen@asu.edu");
    reopenSchedule(student, student.id);
    const submitted = submitSchedule(student, student.id);
    expect(submitted.status).toBe("SUBMITTED");
    expect(submitted.submittedAt).toBeTruthy();
  });

  it("returns a submitted schedule to draft on edit", () => {
    const student = asSession("alex.chen@asu.edu");
    const reopened = reopenSchedule(student, student.id);
    expect(reopened.status).toBe("DRAFT");
    saveAvailability(student, student.id, [
      {
        userId: student.id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "12:00",
        workMode: "OFFICE",
        effectiveFrom: null,
        effectiveUntil: null,
      },
    ]);
    const submitted = submitSchedule(student, student.id);
    expect(submitted.status).toBe("SUBMITTED");
  });
});

describe("pending exceptions do not change effective availability", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("keeps pending and rejected exceptions off the effective schedule", () => {
    const student = asSession("alex.chen@asu.edu");
    const pending = submitException(student, {
      exceptionDate: "2026-10-05",
      startTime: "09:00",
      endTime: "12:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Hold",
    });
    expect(pending.status).toBe("PENDING");
    const before = getEffectiveSchedule(student.id, "2026-10-05");
    expect(before.some((block) => block.exceptionId === pending.id)).toBe(false);
  });
});
