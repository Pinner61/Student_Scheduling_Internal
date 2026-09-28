import { describe, expect, it, beforeEach } from "vitest";
import { getProfileByEmail, listNotifications, resetDemoStore } from "@/lib/demo/store";
import {
  markNotificationRead,
  reviewExceptionRequest,
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

describe("notifications", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("notifies the supervisor when a student submits an exception", () => {
    const student = asSession("alex.chen@asu.edu");
    const supervisor = asSession("smitchell@asu.edu");
    submitException(student, {
      exceptionDate: "2026-10-08",
      startTime: "09:00",
      endTime: "10:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Appointment",
    });
    const notes = listNotifications(supervisor.id);
    expect(notes.some((note) => note.eventType === "exception_submitted" && note.status === "unread")).toBe(
      true
    );
  });

  it("notifies the student with a rejection reason and supports read state", () => {
    const student = asSession("alex.chen@asu.edu");
    const supervisor = asSession("smitchell@asu.edu");
    const exception = submitException(student, {
      exceptionDate: "2026-10-09",
      startTime: "09:00",
      endTime: "10:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Appointment",
    });
    reviewExceptionRequest(supervisor, exception.id, "DECLINED", "Need office coverage.");
    const notes = listNotifications(student.id);
    const rejected = notes.find((note) => note.eventType === "exception_declined");
    expect(rejected?.body).toContain("Need office coverage.");
    expect(rejected?.status).toBe("unread");
    markNotificationRead(student, rejected!.id);
    expect(listNotifications(student.id).find((note) => note.id === rejected?.id)?.status).toBe("read");
  });
});
