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
} from "@/lib/services/data-service";
import { validateAvailabilityRanges } from "@/lib/schedule/engine";
import { getSettings } from "@/lib/services/data-service";
import { availabilityFormSchema, exceptionFormSchema } from "@/lib/validations/availability";
import { notify } from "@/lib/notifications";
import type { Profile, Team } from "@/types";

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

  const settings = getSettings();
  const errors = validateAvailabilityRanges(
    ranges,
    settings.workingDayStart,
    settings.workingDayEnd
  );
  if (errors.length > 0) {
    return { error: errors.join(" ") };
  }

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

  const exception = submitException(user, {
    exceptionDate: data.exceptionDate,
    startTime: data.startTime,
    endTime: data.endTime,
    exceptionType: data.exceptionType,
    replacementMode: data.replacementMode ?? null,
    reason: data.reason ?? null,
  });

  const { notify } = await import("@/lib/notifications");
  await notify({
    name: "exception_submitted",
    recipientUserIds: [user.id],
    payload: { exceptionId: exception.id },
  });

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

  const updated = reviewExceptionRequest(user, exceptionId, status, reviewNote);
  const { notify } = await import("@/lib/notifications");
  await notify({
    name: status === "APPROVED" ? "exception_approved" : "exception_declined",
    recipientUserIds: updated ? [updated.userId] : [],
    payload: { exceptionId },
  });
  revalidatePath("/exceptions");
  revalidatePath("/supervisor/exceptions");
  revalidatePath("/admin/exceptions");
  revalidatePath("/schedule");
  return { success: true };
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
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { createUserAccount } = await import("@/lib/services/data-service");
  createUserAccount(user, data);
  revalidatePath("/admin/users");
  return { success: true };
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
  coverageThresholdOffice?: number;
  coverageThresholdRemote?: number;
  coverageThresholdTotal?: number;
  exceptionApprovalRequired?: boolean;
}) {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");

  const { updateSettings } = await import("@/lib/services/data-service");
  updateSettings(user, settings);
  revalidatePath("/admin/settings");
  return { success: true };
}
