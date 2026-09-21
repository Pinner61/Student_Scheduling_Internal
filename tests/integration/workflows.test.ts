import { describe, expect, it, beforeEach } from "vitest";
import { getProfileByEmail, resetDemoStore } from "@/lib/demo/store";
import {
  saveAvailability,
  submitException,
  reviewExceptionRequest,
  deactivateUser,
  getEffectiveSchedule,
  getUser,
  findAvailableStudents,
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

describe("data service authorization and workflows", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("lets a student save availability", () => {
    const student = asSession("alex.chen@asu.edu");
    const saved = saveAvailability(student, student.id, [
      {
        userId: student.id,
        dayOfWeek: 1,
        startTime: "10:00",
        endTime: "13:00",
        workMode: "OFFICE",
        effectiveFrom: null,
        effectiveUntil: null,
      },
    ]);
    expect(saved).toHaveLength(1);
  });

  it("lets a student submit an exception", () => {
    const student = asSession("alex.chen@asu.edu");
    const exception = submitException(student, {
      exceptionDate: "2026-09-25",
      startTime: "14:00",
      endTime: "16:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Appointment",
    });
    expect(exception.status).toBe("PENDING");
  });

  it("lets a supervisor approve an exception and updates effective schedule", () => {
    const student = asSession("alex.chen@asu.edu");
    const supervisor = asSession("smitchell@asu.edu");
    const exception = submitException(student, {
      exceptionDate: "2026-09-21",
      startTime: "10:00",
      endTime: "11:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Appointment",
    });
    const reviewed = reviewExceptionRequest(supervisor, exception.id, "APPROVED");
    expect(reviewed?.status).toBe("APPROVED");
    const blocks = getEffectiveSchedule(student.id, "2026-09-21");
    expect(blocks.some((b) => b.startTime === "10:00" && b.endTime === "11:00")).toBe(false);
  });

  it("lets an administrator deactivate a user", () => {
    const admin = asSession("preyes@asu.edu");
    const student = asSession("alex.chen@asu.edu");
    const updated = deactivateUser(admin, student.id);
    expect(updated?.status).toBe("inactive");
    expect(getUser(student.id)?.status).toBe("inactive");
  });

  it("finds students using effective schedule after approved exceptions", () => {
    const supervisor = asSession("smitchell@asu.edu");
    const results = findAvailableStudents({
      date: "2026-09-21",
      startTime: "09:00",
      endTime: "10:00",
      viewer: supervisor,
    });
    expect(results.some((r) => r.student.email === "alex.chen@asu.edu")).toBe(true);
  });

  it("rejects unauthorized deactivation", () => {
    const student = asSession("alex.chen@asu.edu");
    expect(() => deactivateUser(student, student.id)).toThrow("Unauthorized");
  });
});
