import type {
  AppNotification,
  AppSettings,
  AuditAction,
  AuditLog,
  Invitation,
  Profile,
  RecurringAvailability,
  ScheduleException,
  SchedulePeriod,
  SchedulePeriodStatus,
  ScheduleStatus,
  ScheduleSubmission,
  Team,
  TeamMembership,
  UserWithTeam,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { getScheduleStatus } from "@/lib/schedule/engine";
import { getTodayDateString } from "@/lib/schedule/engine";
import {
  allowedPeriodTransition,
  canCreateException,
  canEditAvailability,
  dateBelongsToPeriod,
  resolveCurrentPeriod,
  resolvePeriodForDate,
  validatePeriodDates,
} from "@/lib/schedule/periods";
import { AppError } from "@/lib/errors";
import { isDemoMode } from "@/lib/config";
import { createEmptyDatabase, createSeedDatabase, FALL_2026_PERIOD_ID, type DemoDatabase } from "./seed-data";
import { v4 as uuidv4 } from "uuid";

let store: DemoDatabase | null = null;

function getStore(): DemoDatabase {
  if (!store) {
    store = isDemoMode() ? createSeedDatabase() : createEmptyDatabase();
  }
  return store;
}

export function resetDemoStore(): void {
  store = createSeedDatabase();
}

export function getDemoSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...getStore().settings };
}

export function updateDemoSettings(
  settings: Partial<AppSettings>,
  actorId: string
): AppSettings {
  const db = getStore();
  db.settings = { ...db.settings, ...settings };
  addAuditLog(actorId, "settings_changed", "settings", "app", settings);
  return db.settings;
}

export function addAuditLog(
  actorId: string,
  action: AuditAction,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
): AuditLog {
  const log: AuditLog = {
    id: uuidv4(),
    actorUserId: actorId,
    action,
    entityType,
    entityId,
    metadata,
    createdAt: new Date().toISOString(),
  };
  getStore().auditLogs.unshift(log);
  return log;
}

export function getProfileById(id: string): Profile | undefined {
  return getStore().profiles.find((p) => p.id === id);
}

export function getProfileByEmail(email: string): Profile | undefined {
  return getStore().profiles.find(
    (p) => p.email.toLowerCase() === email.toLowerCase()
  );
}

export function getAllProfiles(): Profile[] {
  return [...getStore().profiles];
}

export function listSchedulePeriods(): SchedulePeriod[] {
  return [...getStore().periods].sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export function getSchedulePeriod(id: string): SchedulePeriod | undefined {
  return getStore().periods.find((p) => p.id === id);
}

export function getCurrentSchedulePeriod(today = getTodayDateString()): SchedulePeriod | undefined {
  return resolveCurrentPeriod(listSchedulePeriods(), today);
}

export function getPeriodForDate(date: string): SchedulePeriod | undefined {
  return resolvePeriodForDate(listSchedulePeriods(), date) ?? getCurrentSchedulePeriod();
}

export function getSubmission(
  userId: string,
  periodId: string
): ScheduleSubmission | undefined {
  return getStore().submissions.find(
    (s) => s.userId === userId && s.schedulePeriodId === periodId
  );
}

function ensureDraftSubmission(userId: string, periodId: string): ScheduleSubmission {
  const existing = getSubmission(userId, periodId);
  if (existing) return existing;
  const now = new Date().toISOString();
  const created: ScheduleSubmission = {
    id: uuidv4(),
    userId,
    schedulePeriodId: periodId,
    status: "DRAFT",
    submittedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  getStore().submissions.push(created);
  return created;
}

export function getUserWithTeam(
  userId: string,
  periodId?: string
): UserWithTeam | undefined {
  const profile = getProfileById(userId);
  if (!profile) return undefined;
  const membership = getStore().memberships.find((m) => m.userId === userId);
  const team = membership
    ? getStore().teams.find((t) => t.id === membership.teamId)
    : undefined;
  const supervisor = team?.supervisorId ? getProfileById(team.supervisorId) : undefined;
  const period = periodId
    ? getSchedulePeriod(periodId)
    : getCurrentSchedulePeriod();
  const availability = period
    ? getUserAvailability(userId, period.id)
    : [];
  const submission = period ? getSubmission(userId, period.id) : undefined;
  return {
    ...profile,
    teamId: team?.id ?? null,
    teamName: team?.name ?? null,
    supervisorId: team?.supervisorId ?? null,
    supervisorName: supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : null,
    scheduleStatus: getScheduleStatus(submission?.status) as ScheduleStatus,
    submissionStatus: submission?.status ?? "DRAFT",
    submittedAt: submission?.submittedAt ?? null,
    availabilityUpdatedAt:
      availability.length > 0
        ? availability.reduce(
            (latest, a) => (a.updatedAt > latest ? a.updatedAt : latest),
            availability[0].updatedAt
          )
        : null,
  };
}

export function getAllUsersWithTeams(periodId?: string): UserWithTeam[] {
  return getStore()
    .profiles.map((p) => getUserWithTeam(p.id, periodId)!)
    .filter(Boolean);
}

export function getUserAvailability(
  userId: string,
  periodId?: string
): RecurringAvailability[] {
  const pid = periodId ?? getCurrentSchedulePeriod()?.id;
  if (!pid) return [];
  return getStore().availability.filter(
    (a) => a.userId === userId && a.schedulePeriodId === pid
  );
}

export function setUserAvailability(
  userId: string,
  ranges: Omit<RecurringAvailability, "id" | "createdAt" | "updatedAt">[],
  actorId: string,
  periodId?: string
): RecurringAvailability[] {
  const period = periodId
    ? getSchedulePeriod(periodId)
    : getCurrentSchedulePeriod();
  if (!period) {
    throw new AppError("No schedule period is available.", "not_found");
  }
  if (!canEditAvailability(period)) {
    throw new AppError("This schedule period is not open for availability edits.", "conflict");
  }
  const submission = getSubmission(userId, period.id);
  if (submission?.status === "SUBMITTED") {
    throw new AppError(
      "This schedule is submitted. Reopen it for editing before making changes.",
      "conflict"
    );
  }

  const db = getStore();
  const before = db.availability.filter(
    (a) => a.userId === userId && a.schedulePeriodId === period.id
  );
  db.availability = db.availability.filter(
    (a) => !(a.userId === userId && a.schedulePeriodId === period.id)
  );
  const now = new Date().toISOString();
  const created = ranges.map((r) => ({
    ...r,
    id: uuidv4(),
    userId,
    schedulePeriodId: period.id,
    createdAt: now,
    updatedAt: now,
  }));
  db.availability.push(...created);
  ensureDraftSubmission(userId, period.id);
  addAuditLog(actorId, "schedule_updated", "recurring_availability", userId, {
    periodId: period.id,
    before: before.length,
    after: created.length,
  });
  addAuditLog(actorId, "availability_changed", "recurring_availability", userId, {
    periodId: period.id,
    before: before.length,
    after: created.length,
  });
  return created;
}

export function submitUserSchedule(
  userId: string,
  actorId: string,
  periodId?: string
): ScheduleSubmission {
  const period = periodId
    ? getSchedulePeriod(periodId)
    : getCurrentSchedulePeriod();
  if (!period) throw new AppError("No schedule period is available.", "not_found");
  if (period.status !== "OPEN") {
    throw new AppError("Schedules can only be submitted while the period is open.", "conflict");
  }
  const now = new Date().toISOString();
  const submission = ensureDraftSubmission(userId, period.id);
  submission.status = "SUBMITTED";
  submission.submittedAt = now;
  submission.updatedAt = now;
  addAuditLog(actorId, "schedule_submitted", "schedule_submission", submission.id, {
    periodId: period.id,
    userId,
    submittedAt: now,
  });
  return submission;
}

export function reopenUserSchedule(
  userId: string,
  actorId: string,
  periodId?: string
): ScheduleSubmission {
  const period = periodId
    ? getSchedulePeriod(periodId)
    : getCurrentSchedulePeriod();
  if (!period) throw new AppError("No schedule period is available.", "not_found");
  if (period.status !== "OPEN") {
    throw new AppError("Submitted schedules can only be reopened while the period is open.", "conflict");
  }
  const submission = getSubmission(userId, period.id);
  if (!submission || submission.status !== "SUBMITTED") {
    throw new AppError("There is no submitted schedule to reopen.", "conflict");
  }
  submission.status = "DRAFT";
  submission.updatedAt = new Date().toISOString();
  addAuditLog(actorId, "schedule_reopened", "schedule_submission", submission.id, {
    periodId: period.id,
    userId,
    previouslySubmittedAt: submission.submittedAt,
  });
  return submission;
}

export function getUserExceptions(
  userId: string,
  periodId?: string
): ScheduleException[] {
  const pid = periodId ?? getCurrentSchedulePeriod()?.id;
  if (!pid) return [];
  return getStore().exceptions.filter(
    (e) => e.userId === userId && e.schedulePeriodId === pid
  );
}

export function getAllExceptions(periodId?: string): ScheduleException[] {
  const pid = periodId ?? getCurrentSchedulePeriod()?.id;
  const all = [...getStore().exceptions];
  if (!pid) return all;
  return all.filter((e) => e.schedulePeriodId === pid);
}

export function createException(
  data: Omit<
    ScheduleException,
    "id" | "status" | "reviewedBy" | "reviewedAt" | "reviewNote" | "createdAt" | "updatedAt" | "schedulePeriodId"
  > & { schedulePeriodId?: string },
  actorId: string
): ScheduleException {
  const period =
    (data.schedulePeriodId ? getSchedulePeriod(data.schedulePeriodId) : undefined) ??
    getPeriodForDate(data.exceptionDate);
  if (!period) {
    throw new AppError("No schedule period matches that date.", "validation");
  }
  if (!canCreateException(period)) {
    throw new AppError("Exceptions cannot be created for this schedule period.", "conflict");
  }
  if (!dateBelongsToPeriod(period, data.exceptionDate)) {
    throw new AppError("That date is outside the selected schedule period.", "validation");
  }
  const now = new Date().toISOString();
  const exception: ScheduleException = {
    ...data,
    id: uuidv4(),
    schedulePeriodId: period.id,
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: now,
    updatedAt: now,
  };
  getStore().exceptions.push(exception);
  addAuditLog(actorId, "exception_submitted", "schedule_exception", exception.id, {
    type: exception.exceptionType,
    periodId: period.id,
  });
  return exception;
}

export function reviewException(
  exceptionId: string,
  status: "APPROVED" | "DECLINED",
  reviewerId: string,
  reviewNote?: string
): ScheduleException | undefined {
  if (status === "DECLINED" && !reviewNote?.trim()) {
    throw new AppError("A rejection reason is required.", "validation");
  }
  const exception = getStore().exceptions.find((e) => e.id === exceptionId);
  if (!exception) return undefined;
  exception.status = status;
  exception.reviewedBy = reviewerId;
  exception.reviewedAt = new Date().toISOString();
  exception.reviewNote = reviewNote?.trim() || null;
  exception.updatedAt = new Date().toISOString();
  addAuditLog(
    reviewerId,
    status === "APPROVED" ? "exception_approved" : "exception_declined",
    "schedule_exception",
    exceptionId,
    { reviewNote: exception.reviewNote }
  );
  return exception;
}

export function cancelException(
  exceptionId: string,
  actorId: string
): ScheduleException | undefined {
  const exception = getStore().exceptions.find((e) => e.id === exceptionId);
  if (!exception || exception.status !== "PENDING") return undefined;
  exception.status = "CANCELLED";
  exception.updatedAt = new Date().toISOString();
  addAuditLog(actorId, "exception_cancelled", "schedule_exception", exceptionId);
  return exception;
}

export function getAllTeams(): Team[] {
  return [...getStore().teams];
}

export function getTeamMembers(teamId: string): Profile[] {
  const memberIds = getStore()
    .memberships.filter((m) => m.teamId === teamId)
    .map((m) => m.userId);
  return getStore().profiles.filter((p) => memberIds.includes(p.id));
}

export function getUserTeamId(userId: string): string | null {
  return getStore().memberships.find((m) => m.userId === userId)?.teamId ?? null;
}

export function getSupervisorTeamIds(supervisorId: string): string[] {
  return getStore()
    .teams.filter((t) => t.supervisorId === supervisorId)
    .map((t) => t.id);
}

export function updateUserStatus(
  userId: string,
  status: Profile["status"],
  actorId: string
): Profile | undefined {
  const profile = getProfileById(userId);
  if (!profile) return undefined;
  profile.status = status;
  profile.updatedAt = new Date().toISOString();
  addAuditLog(
    actorId,
    status === "active" ? "user_reactivated" : "user_deactivated",
    "profile",
    userId
  );
  return profile;
}

export function updateUserRole(
  userId: string,
  role: Profile["role"],
  actorId: string
): Profile | undefined {
  const profile = getProfileById(userId);
  if (!profile) return undefined;
  const before = profile.role;
  profile.role = role;
  profile.updatedAt = new Date().toISOString();
  addAuditLog(actorId, "user_role_changed", "profile", userId, { before, after: role });
  return profile;
}

export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<Profile, "firstName" | "lastName" | "email" | "role">>,
  actorId: string
): Profile | undefined {
  const profile = getProfileById(userId);
  if (!profile) return undefined;
  if (updates.email) {
    const clash = getProfileByEmail(updates.email);
    if (clash && clash.id !== userId) {
      throw new AppError("Another user already uses that email.", "conflict");
    }
    profile.email = updates.email.toLowerCase();
  }
  if (updates.firstName) profile.firstName = updates.firstName;
  if (updates.lastName) profile.lastName = updates.lastName;
  if (updates.role && updates.role !== profile.role) {
    const before = profile.role;
    profile.role = updates.role;
    addAuditLog(actorId, "user_role_changed", "profile", userId, {
      before,
      after: updates.role,
    });
  }
  profile.updatedAt = new Date().toISOString();
  addAuditLog(actorId, "user_updated", "profile", userId, updates);
  return profile;
}

export function updateUserTeam(
  userId: string,
  teamId: string | null,
  actorId: string
): void {
  const db = getStore();
  db.memberships = db.memberships.filter((m) => m.userId !== userId);
  if (teamId) {
    if (!db.teams.some((t) => t.id === teamId)) {
      throw new AppError("That team does not exist.", "validation");
    }
    db.memberships.push({
      id: uuidv4(),
      userId,
      teamId,
      membershipRole: "member",
      createdAt: new Date().toISOString(),
    });
  }
  addAuditLog(actorId, "team_assignment_changed", "profile", userId, { teamId });
}

export function createTeam(
  name: string,
  description: string,
  supervisorId: string | null,
  actorId: string
): Team {
  const now = new Date().toISOString();
  const team: Team = {
    id: uuidv4(),
    name,
    description,
    status: "active",
    supervisorId,
    createdAt: now,
    updatedAt: now,
  };
  getStore().teams.push(team);
  addAuditLog(actorId, "team_created", "team", team.id, { name });
  if (supervisorId) {
    addAuditLog(actorId, "supervisor_assignment_changed", "team", team.id, {
      supervisorId,
    });
  }
  return team;
}

export function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, "name" | "description" | "supervisorId" | "status">>,
  actorId: string
): Team | undefined {
  const team = getStore().teams.find((t) => t.id === teamId);
  if (!team) return undefined;
  const previousSupervisor = team.supervisorId;
  Object.assign(team, updates, { updatedAt: new Date().toISOString() });
  addAuditLog(actorId, updates.status === "archived" ? "team_archived" : "team_updated", "team", teamId, updates);
  if (
    Object.prototype.hasOwnProperty.call(updates, "supervisorId") &&
    updates.supervisorId !== previousSupervisor
  ) {
    addAuditLog(actorId, "supervisor_assignment_changed", "team", teamId, {
      before: previousSupervisor,
      after: updates.supervisorId ?? null,
    });
  }
  return team;
}

export function getAuditLogs(): AuditLog[] {
  return [...getStore().auditLogs];
}

export function getDemoAccounts() {
  return getStore().accounts;
}

export function authenticateDemo(email: string, password: string): Profile | null {
  const account = getStore().accounts.find(
    (a) => a.email.toLowerCase() === email.toLowerCase() && a.password === password
  );
  if (!account) {
    const profile = getProfileByEmail(email);
    if (profile && password === "Demo123!" && profile.status === "active") return profile;
    return null;
  }
  const profile = getProfileById(account.profileId);
  if (!profile || profile.status !== "active") return null;
  return profile;
}

export function getStudentsByTeam(teamId: string): Profile[] {
  const memberIds = getStore()
    .memberships.filter((m) => m.teamId === teamId)
    .map((m) => m.userId);
  return getStore().profiles.filter(
    (p) => memberIds.includes(p.id) && p.role === "student" && p.status === "active"
  );
}

export function getAllAvailability(): RecurringAvailability[] {
  return [...getStore().availability];
}

export function getAllMemberships(): TeamMembership[] {
  return [...getStore().memberships];
}

export function createUser(
  data: {
    firstName: string;
    lastName: string;
    email: string;
    role: Profile["role"];
    teamId: string | null;
    status?: Profile["status"];
    invitedBy?: string | null;
    authUserId?: string | null;
    password?: string | null;
  },
  actorId: string
): Profile {
  if (getProfileByEmail(data.email)) {
    throw new AppError("A user with that email already exists.", "conflict");
  }
  const now = new Date().toISOString();
  const profile: Profile = {
    id: uuidv4(),
    authUserId: data.authUserId ?? null,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    role: data.role,
    status: data.status ?? "active",
    lastLoginAt: null,
    invitedBy: data.invitedBy === undefined ? actorId : data.invitedBy,
    activatedAt: (data.status ?? "active") === "active" ? now : null,
    createdAt: now,
    updatedAt: now,
  };
  const db = getStore();
  db.profiles.push(profile);
  if (data.password) {
    db.accounts.push({
      email: profile.email,
      password: data.password,
      profileId: profile.id,
      role: profile.role,
      label: `${profile.firstName} ${profile.lastName}`,
    });
  } else if ((data.status ?? "active") === "active") {
    db.accounts.push({
      email: profile.email,
      password: "Demo123!",
      profileId: profile.id,
      role: profile.role,
      label: `${profile.firstName} ${profile.lastName}`,
    });
  }
  if (data.teamId) {
    if (!db.teams.some((t) => t.id === data.teamId)) {
      throw new AppError("That team does not exist.", "validation");
    }
    db.memberships.push({
      id: uuidv4(),
      userId: profile.id,
      teamId: data.teamId,
      membershipRole: "member",
      createdAt: now,
    });
  }
  addAuditLog(actorId, "user_created", "profile", profile.id, {
    email: profile.email,
    role: profile.role,
  });
  return profile;
}

export function requestScheduleUpdate(userId: string, actorId: string): void {
  addAuditLog(actorId, "availability_changed", "recurring_availability", userId, {
    requested: true,
  });
}

export function createSchedulePeriod(
  data: { name: string; startDate: string; endDate: string },
  actorId: string
): SchedulePeriod {
  const dateError = validatePeriodDates(data.startDate, data.endDate);
  if (dateError) throw new AppError(dateError, "validation");
  const now = new Date().toISOString();
  const period: SchedulePeriod = {
    id: uuidv4(),
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  };
  getStore().periods.push(period);
  addAuditLog(actorId, "schedule_period_created", "schedule_period", period.id, {
    name: period.name,
  });
  return period;
}

export function updateSchedulePeriod(
  periodId: string,
  updates: Partial<Pick<SchedulePeriod, "name" | "startDate" | "endDate">>,
  actorId: string
): SchedulePeriod {
  const period = getSchedulePeriod(periodId);
  if (!period) throw new AppError("Schedule period not found.", "not_found");
  if (period.status === "ARCHIVED") {
    throw new AppError("Archived periods cannot be edited.", "conflict");
  }
  const next = {
    name: updates.name?.trim() ?? period.name,
    startDate: updates.startDate ?? period.startDate,
    endDate: updates.endDate ?? period.endDate,
  };
  const dateError = validatePeriodDates(next.startDate, next.endDate);
  if (dateError) throw new AppError(dateError, "validation");
  Object.assign(period, next, { updatedAt: new Date().toISOString() });
  addAuditLog(actorId, "schedule_period_updated", "schedule_period", period.id, next);
  return period;
}

export function setSchedulePeriodStatus(
  periodId: string,
  status: SchedulePeriodStatus,
  actorId: string
): SchedulePeriod {
  const period = getSchedulePeriod(periodId);
  if (!period) throw new AppError("Schedule period not found.", "not_found");
  if (!allowedPeriodTransition(period.status, status)) {
    throw new AppError(
      `Cannot change a ${period.status.toLowerCase()} period to ${status.toLowerCase()}.`,
      "conflict"
    );
  }
  period.status = status;
  period.updatedAt = new Date().toISOString();
  const action: AuditAction =
    status === "OPEN"
      ? "schedule_period_opened"
      : status === "CLOSED"
        ? "schedule_period_closed"
        : status === "ARCHIVED"
          ? "schedule_period_archived"
          : "schedule_period_updated";
  addAuditLog(actorId, action, "schedule_period", period.id, { status });
  return period;
}

export function listNotifications(userId: string): AppNotification[] {
  return getStore()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createNotification(data: {
  userId: string;
  eventType: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}): AppNotification {
  const notification: AppNotification = {
    id: uuidv4(),
    userId: data.userId,
    eventType: data.eventType,
    title: data.title,
    body: data.body,
    status: "unread",
    readAt: null,
    metadata: data.metadata ?? {},
    createdAt: new Date().toISOString(),
  };
  getStore().notifications.unshift(notification);
  return notification;
}

export function markNotificationRead(
  notificationId: string,
  userId: string
): AppNotification | undefined {
  const notification = getStore().notifications.find((n) => n.id === notificationId);
  if (!notification || notification.userId !== userId) return undefined;
  notification.status = "read";
  notification.readAt = new Date().toISOString();
  return notification;
}

export function markAllNotificationsRead(userId: string): void {
  const now = new Date().toISOString();
  for (const notification of getStore().notifications) {
    if (notification.userId === userId && notification.status === "unread") {
      notification.status = "read";
      notification.readAt = now;
    }
  }
}

export function getProfileByAuthUserId(authUserId: string): Profile | undefined {
  return getStore().profiles.find((p) => p.authUserId === authUserId);
}

export function upsertProfileInStore(profile: Profile): Profile {
  const db = getStore();
  const existing = db.profiles.find(
    (p) => p.id === profile.id || p.email.toLowerCase() === profile.email.toLowerCase()
  );
  if (existing) {
    Object.assign(existing, profile, {
      lastLoginAt: profile.lastLoginAt ?? existing.lastLoginAt ?? null,
      invitedBy: profile.invitedBy ?? existing.invitedBy ?? null,
      activatedAt: profile.activatedAt ?? existing.activatedAt ?? null,
    });
    return existing;
  }
  const next: Profile = {
    ...profile,
    lastLoginAt: profile.lastLoginAt ?? null,
    invitedBy: profile.invitedBy ?? null,
    activatedAt: profile.activatedAt ?? null,
  };
  db.profiles.push(next);
  return next;
}

export function markLastLogin(profileId: string): Profile | undefined {
  const profile = getProfileById(profileId);
  if (!profile) return undefined;
  profile.lastLoginAt = new Date().toISOString();
  profile.updatedAt = profile.lastLoginAt;
  return profile;
}

export function setProfileAuthUserId(profileId: string, authUserId: string): Profile | undefined {
  const profile = getProfileById(profileId);
  if (!profile) return undefined;
  profile.authUserId = authUserId;
  profile.updatedAt = new Date().toISOString();
  return profile;
}

export function setDemoAccountPassword(profileId: string, password: string): void {
  const db = getStore();
  const profile = getProfileById(profileId);
  if (!profile) return;
  const existing = db.accounts.find((account) => account.profileId === profileId);
  if (existing) {
    existing.password = password;
    existing.email = profile.email;
    existing.role = profile.role;
    return;
  }
  db.accounts.push({
    email: profile.email,
    password,
    profileId,
    role: profile.role,
    label: `${profile.firstName} ${profile.lastName}`,
  });
}

export function activateProfile(
  profileId: string,
  updates: { firstName?: string; lastName?: string; authUserId?: string | null }
): Profile | undefined {
  const profile = getProfileById(profileId);
  if (!profile) return undefined;
  const now = new Date().toISOString();
  if (updates.firstName) profile.firstName = updates.firstName;
  if (updates.lastName) profile.lastName = updates.lastName;
  if (updates.authUserId) profile.authUserId = updates.authUserId;
  profile.status = "active";
  profile.activatedAt = now;
  profile.updatedAt = now;
  return profile;
}

export function listInvitations(): Invitation[] {
  return [...getStore().invitations].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getInvitationById(id: string): Invitation | undefined {
  return getStore().invitations.find((invitation) => invitation.id === id);
}

export function getInvitationByTokenHash(tokenHash: string): Invitation | undefined {
  return getStore().invitations.find((invitation) => invitation.tokenHash === tokenHash);
}

export function getOpenInvitationByEmail(email: string): Invitation | undefined {
  const now = Date.now();
  return getStore().invitations.find(
    (invitation) =>
      invitation.email === email.toLowerCase() &&
      !invitation.acceptedAt &&
      !invitation.cancelledAt &&
      new Date(invitation.expiresAt).getTime() > now
  );
}

export function upsertInvitationInStore(invitation: Invitation): Invitation {
  const db = getStore();
  const existing = db.invitations.find((item) => item.id === invitation.id);
  if (existing) {
    Object.assign(existing, invitation);
    return existing;
  }
  db.invitations.push(invitation);
  return invitation;
}

export function replaceInvitations(invitations: Invitation[]): void {
  getStore().invitations = [...invitations];
}

export function createInvitationRecord(data: {
  email: string;
  role: Profile["role"];
  teamId: string | null;
  invitedBy: string;
  profileId: string;
  tokenHash: string;
  expiresAt: string;
}): Invitation {
  const invitation: Invitation = {
    id: uuidv4(),
    email: data.email.toLowerCase(),
    role: data.role,
    teamId: data.teamId,
    invitedBy: data.invitedBy,
    profileId: data.profileId,
    tokenHash: data.tokenHash,
    expiresAt: data.expiresAt,
    acceptedAt: null,
    cancelledAt: null,
    createdAt: new Date().toISOString(),
  };
  getStore().invitations.unshift(invitation);
  addAuditLog(data.invitedBy, "user_invited", "invitation", invitation.id, {
    email: invitation.email,
    role: invitation.role,
    profileId: invitation.profileId,
  });
  return invitation;
}

export function reissueInvitationRecord(
  invitationId: string,
  tokenHash: string,
  expiresAt: string,
  actorId: string
): Invitation | undefined {
  const invitation = getInvitationById(invitationId);
  if (!invitation || invitation.acceptedAt || invitation.cancelledAt) return undefined;
  invitation.tokenHash = tokenHash;
  invitation.expiresAt = expiresAt;
  addAuditLog(actorId, "user_invited", "invitation", invitation.id, {
    email: invitation.email,
    reissued: true,
  });
  return invitation;
}

export function cancelInvitationRecord(invitationId: string, actorId: string): Invitation | undefined {
  const invitation = getInvitationById(invitationId);
  if (!invitation || invitation.acceptedAt) return undefined;
  invitation.cancelledAt = new Date().toISOString();
  addAuditLog(actorId, "user_updated", "invitation", invitation.id, {
    email: invitation.email,
    cancelled: true,
  });
  return invitation;
}

export function acceptInvitationRecord(invitationId: string): Invitation | undefined {
  const invitation = getInvitationById(invitationId);
  if (!invitation) return undefined;
  invitation.acceptedAt = new Date().toISOString();
  return invitation;
}

export { FALL_2026_PERIOD_ID };
