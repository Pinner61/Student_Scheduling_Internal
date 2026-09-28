"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/session";
import {
  saveAvailability,
  submitException,
  reviewExceptionRequest,
  cancelExceptionRequest,
  deactivateUser,
  reactivateUser,
  changeUserRole,
  changeUserTeam,
  createTeam,
  updateTeam,
  submitSchedule,
  reopenSchedule,
  createPeriod,
  updatePeriod,
  changePeriodStatus,
  createUserAccount,
  updateUserAccount,
  assignSupervisor,
  previewUserCsv,
  importUserCsv,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/services/data-service";
import { availabilityFormSchema, exceptionFormSchema } from "@/lib/validations/availability";
import { notify } from "@/lib/notifications";
import { toUserFacingError } from "@/lib/errors";
import type { Profile, SchedulePeriodStatus, Team } from "@/types";

export async function saveAvailabilityAction(ranges: {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  workMode: "OFFICE" | "REMOTE";
}[]) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = availabilityFormSchema.safeParse({ ranges });
  if (!parsed.success) {
    return { error: "Invalid availability data" };
  }

  try {
    saveAvailability(
      user,
      user.id,
      ranges.map((r) => ({
        userId: user.id,
        ...r,
        effectiveFrom: null,
        effectiveUntil: null,
      }))
    );
  } catch (error) {
    return { error: toUserFacingError(error, "We couldn’t save your availability.") };
  }

  await notify({
    name: "schedule_changed",
    recipientUserIds: [user.id],
    payload: { rangeCount: ranges.length },
  });

  revalidatePath("/schedule");
  revalidatePath("/availability");
  return { success: true };
}

export async function submitExceptionAction(data: {
  exceptionDate: string;
  startTime: string;
  endTime: string;
  exceptionType: "UNAVAILABLE" | "REMOTE_INSTEAD" | "OFFICE_INSTEAD" | "ALTERNATE_AVAILABILITY";
  replacementMode?: "OFFICE" | "REMOTE" | null;
  reason?: string;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const parsed = exceptionFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: "Invalid exception data" };
  }

  try {
    const exception = submitException(user, {
      exceptionDate: data.exceptionDate,
      startTime: data.startTime,
      endTime: data.endTime,
      exceptionType: data.exceptionType,
      replacementMode: data.replacementMode ?? null,
      reason: data.reason ?? null,
    });

    await notify({
      name: "exception_submitted",
      recipientUserIds: [user.id],
      payload: { exceptionId: exception.id },
    });
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to submit this exception.") };
  }

  revalidatePath("/exceptions");
  revalidatePath("/schedule");
  return { success: true };
}

export async function reviewExceptionAction(
  exceptionId: string,
  status: "APPROVED" | "DECLINED",
  reviewNote?: string
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  if (status === "DECLINED" && !reviewNote?.trim()) {
    return { error: "A rejection reason is required." };
  }

  try {
    const updated = reviewExceptionRequest(user, exceptionId, status, reviewNote);
    const { notify } = await import("@/lib/notifications");
    await notify({
      name: status === "APPROVED" ? "exception_approved" : "exception_declined",
      recipientUserIds: updated ? [updated.userId] : [],
      payload: { exceptionId },
    });
    revalidatePath("/exceptions");
    revalidatePath("/supervisor/exceptions");
    revalidatePath("/supervisor/students");
    revalidatePath("/supervisor/overview");
    revalidatePath("/supervisor/team");
    revalidatePath("/admin/exceptions");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to review this exception.",
    };
  }
}

export async function cancelExceptionAction(exceptionId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  cancelExceptionRequest(user, exceptionId);
  revalidatePath("/exceptions");
  return { success: true };
}

export async function deactivateUserAction(userId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };

  try {
    deactivateUser(user, userId);
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "You don’t have permission to change user status." };
  }
}

export async function reactivateUserAction(userId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };

  try {
    reactivateUser(user, userId);
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "You don’t have permission to change user status." };
  }
}

export async function changeUserRoleAction(userId: string, role: Profile["role"]) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  changeUserRole(user, userId, role);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function changeUserTeamAction(userId: string, teamId: string | null) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  changeUserTeam(user, userId, teamId);
  revalidatePath("/admin/users");
  return { success: true };
}

export async function createTeamAction(
  name: string,
  description: string,
  supervisorId: string | null
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  createTeam(user, name, description, supervisorId);
  revalidatePath("/admin/teams");
  return { success: true };
}

export async function updateTeamAction(
  teamId: string,
  updates: Partial<Pick<Team, "name" | "description" | "supervisorId" | "status">>
) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  updateTeam(user, teamId, updates);
  revalidatePath("/admin/teams");
  return { success: true };
}

export async function createUserAction(data: {
  firstName: string;
  lastName: string;
  email: string;
  role: Profile["role"];
  teamId: string | null;
  supervisorId?: string | null;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  try {
    createUserAccount(user, data);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to create that user.") };
  }
}

export async function requestScheduleUpdateAction(userId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };

  try {
    const { requestScheduleUpdate } = await import("@/lib/services/data-service");
    requestScheduleUpdate(user, userId);
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "You don’t have permission to request a schedule update." };
  }
}

export async function updateSettingsAction(settings: {
  workingDayStart?: string;
  workingDayEnd?: string;
  schedulingIntervalMinutes?: number;
  timezone?: string;
  coverageThresholdsEnabled?: boolean;
  coverageThresholdOffice?: number;
  coverageThresholdRemote?: number;
  coverageThresholdTotal?: number;
  exceptionApprovalRequired?: boolean;
  notifyStudentsOnPeriodOpen?: boolean;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { updateSettings } = await import("@/lib/services/data-service");
  updateSettings(user, settings);
  revalidatePath("/admin/settings");
  return { success: true };
}

export async function submitScheduleAction() {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    const submission = submitSchedule(user, user.id);
    await notify({
      name: "schedule_submitted",
      recipientUserIds: [user.id],
      payload: { submittedAt: submission.submittedAt },
    });
    revalidatePath("/schedule");
    revalidatePath("/availability");
    revalidatePath("/supervisor/students");
    return { success: true, submittedAt: submission.submittedAt };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to submit your schedule.") };
  }
}

export async function reopenScheduleAction() {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    reopenSchedule(user, user.id);
    revalidatePath("/schedule");
    revalidatePath("/availability");
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to reopen this schedule.") };
  }
}

export async function createPeriodAction(data: {
  name: string;
  startDate: string;
  endDate: string;
}) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    createPeriod(user, data);
    revalidatePath("/admin/periods");
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to create that schedule period.") };
  }
}

export async function updatePeriodAction(
  periodId: string,
  updates: { name?: string; startDate?: string; endDate?: string }
) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    updatePeriod(user, periodId, updates);
    revalidatePath("/admin/periods");
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to update that schedule period.") };
  }
}

export async function changePeriodStatusAction(
  periodId: string,
  status: SchedulePeriodStatus
) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    changePeriodStatus(user, periodId, status);
    revalidatePath("/admin/periods");
    revalidatePath("/schedule");
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to change that period status.") };
  }
}

export async function updateUserAccountAction(
  userId: string,
  updates: Partial<Pick<Profile, "firstName" | "lastName" | "email" | "role">>
) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    updateUserAccount(user, userId, updates);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to update that user.") };
  }
}

export async function assignSupervisorAction(teamId: string, supervisorId: string | null) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    assignSupervisor(user, teamId, supervisorId);
    revalidatePath("/admin/users");
    revalidatePath("/admin/teams");
    return { success: true };
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to assign that supervisor.") };
  }
}

export async function previewCsvAction(csvText: string) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    return previewUserCsv(user, csvText);
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to read that CSV file.") };
  }
}

export async function importCsvAction(csvText: string) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  try {
    const result = importUserCsv(user, csvText);
    revalidatePath("/admin/users");
    revalidatePath("/admin/audit");
    return result;
  } catch (error) {
    return { error: toUserFacingError(error, "Unable to import users.") };
  }
}

export async function markNotificationReadAction(notificationId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  markNotificationRead(user, notificationId);
  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const user = await getSessionUser();
  if (!user) return { error: "You need to sign in again." };
  markAllNotificationsRead(user);
  revalidatePath("/");
  return { success: true };
}
