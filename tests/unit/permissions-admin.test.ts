import { describe, expect, it, beforeEach } from "vitest";
import { getProfileByEmail, resetDemoStore } from "@/lib/demo/store";
import {
  createUserAccount,
  deactivateUser,
  previewUserCsv,
  reactivateUser,
  reviewExceptionRequest,
  saveAvailability,
  submitException,
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

describe("permissions", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("prevents a student from modifying another student", () => {
    const alex = asSession("alex.chen@asu.edu");
    const jordan = asSession("jordan.patel@asu.edu");
    expect(() =>
      saveAvailability(alex, jordan.id, [
        {
          userId: jordan.id,
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "12:00",
          workMode: "OFFICE",
          effectiveFrom: null,
          effectiveUntil: null,
        },
      ])
    ).toThrow(/permission/);
  });

  it("prevents a student from approving an exception", () => {
    const student = asSession("alex.chen@asu.edu");
    const exception = submitException(student, {
      exceptionDate: "2026-10-06",
      startTime: "09:00",
      endTime: "10:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Class",
    });
    expect(() => reviewExceptionRequest(student, exception.id, "APPROVED")).toThrow(/permission/);
  });

  it("prevents a supervisor from reviewing an unauthorized student", () => {
    const student = asSession("alex.chen@asu.edu");
    const otherSupervisor = asSession("dokonkwo@asu.edu");
    const exception = submitException(student, {
      exceptionDate: "2026-10-07",
      startTime: "09:00",
      endTime: "10:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Class",
    });
    expect(() =>
      reviewExceptionRequest(otherSupervisor, exception.id, "APPROVED")
    ).toThrow(/supervise/);
  });

  it("lets an administrator create, deactivate, and reactivate a user", () => {
    const admin = asSession("preyes@asu.edu");
    const created = createUserAccount(admin, {
      firstName: "New",
      lastName: "Student",
      email: "new.student@asu.edu",
      role: "student",
      teamId: null,
    });
    expect(created.email).toBe("new.student@asu.edu");
    expect(deactivateUser(admin, created.id)?.status).toBe("inactive");
    expect(reactivateUser(admin, created.id)?.status).toBe("active");
  });
});

describe("csv import validation", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("flags duplicates instead of overwriting", () => {
    const admin = asSession("preyes@asu.edu");
    const preview = previewUserCsv(
      admin,
      "name,email,role,team\nAlex Chen,alex.chen@asu.edu,student,Web\n"
    );
    expect(preview.issues.some((issue) => issue.severity === "flag")).toBe(true);
    expect(preview.valid.some((row) => row.action === "create" && row.email === "alex.chen@asu.edu")).toBe(
      false
    );
  });

  it("rejects unknown teams before import", () => {
    const admin = asSession("preyes@asu.edu");
    const preview = previewUserCsv(
      admin,
      "name,email,role,team\nPat Lee,pat.lee@asu.edu,student,NotATeam\n"
    );
    expect(preview.issues.some((issue) => issue.message.includes("Unknown team"))).toBe(true);
  });
});
