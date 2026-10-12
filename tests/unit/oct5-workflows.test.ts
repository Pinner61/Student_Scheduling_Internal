import { describe, expect, it, beforeEach } from "vitest";
import {
  getAuditLogs,
  getProfileByEmail,
  getTeamMembers,
  getUserTeamId,
  listNotifications,
  resetDemoStore,
} from "@/lib/demo/store";
import {
  cancelExceptionRequest,
  getEffectiveSchedule,
  getExceptionsForTeam,
  getUser,
  reviewExceptionRequest,
  saveTeamEdits,
  submitException,
} from "@/lib/services/data-service";
import { getTodayDateString } from "@/lib/schedule/engine";
import { addDaysToDateString } from "@/lib/utils/time";
import { canCancelApprovedException, canWithdrawException } from "@/lib/schedule/exceptions";
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

describe("October 5 exception and team workflows", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("lets a student withdraw a pending exception without affecting the schedule", async () => {
    const student = asSession("alex.chen@asu.edu");
    const future = addDaysToDateString(getTodayDateString(), 5);
    const exception = submitException(student, {
      exceptionDate: future,
      startTime: "14:00",
      endTime: "16:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Appointment",
    });
    expect(canWithdrawException(exception, student.id)).toBe(true);
    const withdrawn = cancelExceptionRequest(student, exception.id);
    expect(withdrawn?.status).toBe("WITHDRAWN");
    expect(getExceptionsForTeam(getUser(student.id)?.teamId ?? "").some((e) => e.id === exception.id && e.status === "PENDING")).toBe(false);
    const mondayBlocks = getEffectiveSchedule(student.id, future);
    expect(mondayBlocks.every((block) => block.source !== "exception" || block.exceptionId !== exception.id)).toBe(true);
    expect(getAuditLogs().some((log) => log.action === "exception_withdrawn" && log.entityId === exception.id)).toBe(true);
  });

  it("prevents another student from withdrawing a request", () => {
    const student = asSession("alex.chen@asu.edu");
    const other = asSession("jordan.patel@asu.edu");
    const exception = submitException(student, {
      exceptionDate: addDaysToDateString(getTodayDateString(), 6),
      startTime: "09:00",
      endTime: "10:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Class",
    });
    expect(() => cancelExceptionRequest(other, exception.id)).toThrow(/own exceptions/);
  });

  it("cancels an approved future exception, restores baseline availability, and notifies the supervisor", () => {
    const student = asSession("alex.chen@asu.edu");
    const supervisor = asSession("smitchell@asu.edu");
    const future = addDaysToDateString(getTodayDateString(), 8);
    const exception = submitException(student, {
      exceptionDate: future,
      startTime: "10:00",
      endTime: "11:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Conflict",
    });
    reviewExceptionRequest(supervisor, exception.id, "APPROVED");
    const approved = { ...exception, status: "APPROVED" as const };
    expect(canCancelApprovedException({ ...approved, userId: student.id }, student.id, getTodayDateString())).toBe(true);
    const before = getEffectiveSchedule(student.id, future);
    const cancelled = cancelExceptionRequest(student, exception.id);
    expect(cancelled?.status).toBe("CANCELLED");
    const after = getEffectiveSchedule(student.id, future);
    expect(after.map((b) => `${b.startTime}-${b.endTime}:${b.workMode}`)).not.toEqual(
      before.map((b) => `${b.startTime}-${b.endTime}:${b.workMode}`)
    );
    expect(after.some((block) => block.exceptionId === exception.id)).toBe(false);
    expect(getAuditLogs().some((log) => log.action === "exception_cancelled" && log.entityId === exception.id)).toBe(true);
    expect(
      listNotifications(supervisor.id).some(
        (item) => item.eventType === "exception_cancelled" && item.metadata.exceptionId === exception.id
      )
    ).toBe(true);
  });

  it("prevents a student from cancelling another student's exception", () => {
    const student = asSession("alex.chen@asu.edu");
    const other = asSession("jordan.patel@asu.edu");
    const supervisor = asSession("smitchell@asu.edu");
    const exception = submitException(student, {
      exceptionDate: addDaysToDateString(getTodayDateString(), 9),
      startTime: "10:00",
      endTime: "11:00",
      exceptionType: "UNAVAILABLE",
      replacementMode: null,
      reason: "Conflict",
    });
    reviewExceptionRequest(supervisor, exception.id, "APPROVED");
    expect(() => cancelExceptionRequest(other, exception.id)).toThrow(/own exceptions/);
  });

  it("lets an administrator add and remove members and change supervisor", () => {
    const admin = asSession("preyes@asu.edu");
    const alex = asSession("alex.chen@asu.edu");
    const jordan = asSession("jordan.patel@asu.edu");
    const designId = getUser(alex.id)?.teamId;
    if (!designId) throw new Error("expected Design team");
    const multimediaSupervisor = asSession("dokonkwo@asu.edu");

    saveTeamEdits(admin, designId, {
      name: "Design Studio",
      description: "Visual design",
      supervisorId: multimediaSupervisor.id,
      memberIds: [alex.id, jordan.id],
    });

    expect(getUserTeamId(jordan.id)).toBe(designId);
    expect(getTeamMembers(designId).some((member) => member.id === jordan.id)).toBe(true);
    expect(getAuditLogs().some((log) => log.action === "team_member_added" && log.metadata.userId === jordan.id)).toBe(true);
    expect(getAuditLogs().some((log) => log.action === "supervisor_assignment_changed")).toBe(true);

    saveTeamEdits(admin, designId, {
      name: "Design Studio",
      description: "Visual design",
      supervisorId: multimediaSupervisor.id,
      memberIds: [jordan.id],
    });
    expect(getUserTeamId(alex.id)).toBeNull();
    expect(getAuditLogs().some((log) => log.action === "team_member_removed" && log.metadata.userId === alex.id)).toBe(true);
  });

  it("blocks students and supervisors from editing teams", () => {
    const student = asSession("alex.chen@asu.edu");
    const supervisor = asSession("smitchell@asu.edu");
    const teamId = getUser(student.id)?.teamId;
    if (!teamId) throw new Error("expected team");
    const payload = {
      name: "Design",
      description: "",
      supervisorId: supervisor.id,
      memberIds: [student.id],
    };
    expect(() => saveTeamEdits(student, teamId, payload)).toThrow(/permission/);
    expect(() => saveTeamEdits(supervisor, teamId, payload)).toThrow(/permission/);
  });
});
