import type {
  AppNotification,
  AppSettings,
  AuditLog,
  Profile,
  RecurringAvailability,
  ScheduleBlock,
  ScheduleException,
  SchedulePeriod,
  SchedulePeriodStatus,
  ScheduleSubmission,
  SessionUser,
  Team,
  UserWithTeam,
} from "@/types";
import * as demo from "@/lib/demo/store";
import { hasPermission, requirePermission } from "@/lib/auth/rbac";
import {
  coversTimeWindow,
  getEffectiveScheduleForDate,
  getEffectiveScheduleForWeek,
  getCurrentWeekStart,
} from "@/lib/schedule/engine";
import { findCommonAvailabilityWindows } from "@/lib/schedule/common-availability";
import { addDaysToDateString, rangesOverlap } from "@/lib/utils/time";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { validateAvailabilityInput, validateTimeBlock, userOnboardingSchema } from "@/lib/validations/domain";
import { parseCsvText, validateCsvRows, type CsvRowIssue, type CsvValidatedRow } from "@/lib/admin/csv-import";
import { canCreateException, canEditAvailability } from "@/lib/schedule/periods";

export function getSettings(): AppSettings {
  return demo.getDemoSettings();
}

export function updateSettings(
  user: SessionUser,
  settings: Partial<AppSettings>
): AppSettings {
  requirePermission(user, "write:settings");
  return demo.updateDemoSettings(settings, user.id);
}

export function listPeriods(): SchedulePeriod[] {
  return demo.listSchedulePeriods();
}

export function getPeriod(id: string): SchedulePeriod | undefined {
  return demo.getSchedulePeriod(id);
}

export function getCurrentPeriod(): SchedulePeriod | undefined {
  return demo.getCurrentSchedulePeriod();
}

export function getPeriodForDate(date: string): SchedulePeriod | undefined {
  return demo.getPeriodForDate(date);
}

export function createPeriod(
  user: SessionUser,
  data: { name: string; startDate: string; endDate: string }
): SchedulePeriod {
  requirePermission(user, "write:schedule_periods");
  return demo.createSchedulePeriod(data, user.id);
}

export function updatePeriod(
  user: SessionUser,
  periodId: string,
  updates: Partial<Pick<SchedulePeriod, "name" | "startDate" | "endDate">>
): SchedulePeriod {
  requirePermission(user, "write:schedule_periods");
  return demo.updateSchedulePeriod(periodId, updates, user.id);
}

export function changePeriodStatus(
  user: SessionUser,
  periodId: string,
  status: SchedulePeriodStatus
): SchedulePeriod {
  requirePermission(user, "write:schedule_periods");
  const period = demo.setSchedulePeriodStatus(periodId, status, user.id);
  if (status === "OPEN" && getSettings().notifyStudentsOnPeriodOpen) {
    notifyStudentsPeriodOpened(period);
  }
  return period;
}

export function getUser(userId: string, periodId?: string): UserWithTeam | undefined {
  return demo.getUserWithTeam(userId, periodId);
}

export function listUsers(
  filters?: {
    search?: string;
    role?: string;
    team?: string;
    status?: string;
  },
  periodId?: string
): UserWithTeam[] {
  let users = demo.getAllUsersWithTeams(periodId);
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }
  if (filters?.role && filters.role !== "all") {
    users = users.filter((u) => u.role === filters.role);
  }
  if (filters?.team && filters.team !== "all") {
    users = users.filter((u) => u.teamId === filters.team);
  }
  if (filters?.status && filters.status !== "all") {
    users = users.filter((u) => u.status === filters.status);
  }
  return users;
}

export function getAvailability(userId: string, periodId?: string): RecurringAvailability[] {
  return demo.getUserAvailability(userId, periodId);
}

export function saveAvailability(
  user: SessionUser,
  userId: string,
  ranges: Omit<RecurringAvailability, "id" | "createdAt" | "updatedAt" | "schedulePeriodId">[],
  periodId?: string
): RecurringAvailability[] {
  assertCanEditStudentSchedule(user, userId);
  const period = periodId ? demo.getSchedulePeriod(periodId) : demo.getCurrentSchedulePeriod();
  if (!period) throw new AppError("No schedule period is available.", "not_found");
  if (!canEditAvailability(period)) {
    throw new AppError("This schedule period is not open for availability edits.", "conflict");
  }
  const settings = getSettings();
  const errors = validateAvailabilityInput(ranges, settings);
  if (errors.length > 0) {
    throw new AppError(errors.join(" "), "validation");
  }
  return demo.setUserAvailability(
    userId,
    ranges.map((range) => ({ ...range, schedulePeriodId: period.id })),
    user.id,
    period.id
  );
}

export function submitSchedule(
  user: SessionUser,
  userId: string,
  periodId?: string
): ScheduleSubmission {
  assertCanEditStudentSchedule(user, userId);
  requirePermission(user, "submit:own_schedule");
  return demo.submitUserSchedule(userId, user.id, periodId);
}

export function reopenSchedule(
  user: SessionUser,
  userId: string,
  periodId?: string
): ScheduleSubmission {
  assertCanEditStudentSchedule(user, userId);
  return demo.reopenUserSchedule(userId, user.id, periodId);
}

export function getExceptions(userId?: string, periodId?: string): ScheduleException[] {
  if (userId) return demo.getUserExceptions(userId, periodId);
  return demo.getAllExceptions(periodId);
}

export function getExceptionsForTeam(teamId: string, periodId?: string): ScheduleException[] {
  const members = demo.getStudentsByTeam(teamId);
  const memberIds = new Set(members.map((m) => m.id));
  return demo.getAllExceptions(periodId).filter((e) => memberIds.has(e.userId));
}

export function submitException(
  user: SessionUser,
  data: Omit<
    ScheduleException,
    | "id"
    | "userId"
    | "status"
    | "reviewedBy"
    | "reviewedAt"
    | "reviewNote"
    | "createdAt"
    | "updatedAt"
    | "schedulePeriodId"
  >
): ScheduleException {
  requirePermission(user, "write:own_exceptions");
  const period = demo.getPeriodForDate(data.exceptionDate);
  if (!period) {
    throw new AppError("That date is not inside an active schedule period.", "validation");
  }
  if (!canCreateException(period)) {
    throw new AppError("Exceptions cannot be created for this schedule period.", "conflict");
  }
  const settings = getSettings();
  const timeErrors = validateTimeBlock(data.startTime, data.endTime, settings);
  if (timeErrors.length > 0) {
    throw new AppError(timeErrors.join(" "), "validation");
  }
  const exception = demo.createException({ ...data, userId: user.id }, user.id);
  notifyExceptionSubmitted(exception);
  return exception;
}

export function reviewExceptionRequest(
  user: SessionUser,
  exceptionId: string,
  status: "APPROVED" | "DECLINED",
  reviewNote?: string
): ScheduleException | undefined {
  requirePermission(user, "review:exceptions");
  const exception = demo.getAllExceptions().find((e) => e.id === exceptionId);
  if (!exception) return undefined;
  if (!canReviewStudent(user, exception.userId)) {
    throw new AppError("You can only review exceptions for students you supervise.", "unauthorized");
  }
  const updated = demo.reviewException(exceptionId, status, user.id, reviewNote);
  if (updated) notifyExceptionReviewed(updated);
  return updated;
}

export function cancelExceptionRequest(
  user: SessionUser,
  exceptionId: string
): ScheduleException | undefined {
  const exception = demo.getAllExceptions().find((e) => e.id === exceptionId);
  if (!exception) return undefined;
  if (exception.userId !== user.id) {
    requirePermission(user, "review:exceptions");
  } else {
    requirePermission(user, "cancel:own_exceptions");
  }
  return demo.cancelException(exceptionId, user.id);
}

export function getEffectiveSchedule(
  userId: string,
  date: string
): ScheduleBlock[] {
  const period = demo.getPeriodForDate(date);
  const recurring = demo.getUserAvailability(userId, period?.id);
  const exceptions = demo.getUserExceptions(userId, period?.id);
  return getEffectiveScheduleForDate(recurring, exceptions, date);
}

export function findAvailableStudents(params: {
  date: string;
  startTime: string;
  endTime: string;
  teamId?: string;
  workMode?: string;
  viewer: SessionUser;
}): {
  student: UserWithTeam;
  blocks: ScheduleBlock[];
  coversWindow: boolean;
}[] {
  requireScheduleScope(params.viewer);
  const teams =
    params.viewer.role === "administrator"
      ? demo.getAllTeams().filter((t) => t.status === "active")
      : getSupervisorTeams(params.viewer.id);
  const teamIds = params.teamId && params.teamId !== "all"
    ? [params.teamId]
    : teams.map((t) => t.id);

  const seen = new Set<string>();
  const results: {
    student: UserWithTeam;
    blocks: ScheduleBlock[];
    coversWindow: boolean;
  }[] = [];

  for (const teamId of teamIds) {
    if (params.viewer.role === "supervisor" && !demo.getSupervisorTeamIds(params.viewer.id).includes(teamId)) {
      continue;
    }
    for (const student of demo.getStudentsByTeam(teamId)) {
      if (seen.has(student.id)) continue;
      seen.add(student.id);
      const details = demo.getUserWithTeam(student.id);
      if (!details) continue;
      const blocks = getEffectiveSchedule(student.id, params.date).filter((b) => {
        if (params.workMode && params.workMode !== "all" && b.workMode !== params.workMode) {
          return false;
        }
        return rangesOverlap(b.startTime, b.endTime, params.startTime, params.endTime);
      });
      if (blocks.length === 0) continue;
      const coversWindow = coversTimeWindow(blocks, params.startTime, params.endTime);
      results.push({ student: details, blocks, coversWindow });
    }
  }

  return results.sort((a, b) => a.student.lastName.localeCompare(b.student.lastName));
}

export function findCommonAvailability(params: {
  viewer: SessionUser;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  teamId?: string;
  studentIds?: string[];
  workMode?: string;
}) {
  requireScheduleScope(params.viewer);
  const settings = getSettings();
  if (params.durationMinutes % settings.schedulingIntervalMinutes !== 0) {
    throw new AppError(
      `Duration must be a multiple of ${settings.schedulingIntervalMinutes} minutes.`,
      "validation"
    );
  }
  if (params.endDate < params.startDate) {
    throw new AppError("End date must be on or after the start date.", "validation");
  }

  const authorized = authorizedStudents(params.viewer, params.teamId);
  const selected = params.studentIds?.length
    ? authorized.filter((student) => params.studentIds!.includes(student.id))
    : authorized;
  if (selected.length === 0) {
    throw new AppError("Select at least one authorized student.", "validation");
  }

  const students = selected.map((student) => {
    const blocksByDate = new Map<string, ScheduleBlock[]>();
    for (
      let date = params.startDate;
      date <= params.endDate;
      date = incrementDate(date)
    ) {
      blocksByDate.set(date, getEffectiveSchedule(student.id, date));
    }
    return { id: student.id, blocksByDate };
  });

  const windows = findCommonAvailabilityWindows({
    students,
    startDate: params.startDate,
    endDate: params.endDate,
    durationMinutes: params.durationMinutes,
    intervalMinutes: settings.schedulingIntervalMinutes,
    workingDayStart: settings.workingDayStart,
    workingDayEnd: settings.workingDayEnd,
    workMode:
      params.workMode === "OFFICE" || params.workMode === "REMOTE"
        ? params.workMode
        : "all",
  });

  const directory = new Map(selected.map((s) => [s.id, s]));
  return {
    students: selected,
    full: windows.full.map((window) => ({
      ...window,
      students: window.availableStudentIds.map((id) => directory.get(id)!).filter(Boolean),
    })),
    partial: windows.partial.map((window) => ({
      ...window,
      students: window.availableStudentIds.map((id) => directory.get(id)!).filter(Boolean),
    })),
  };
}

export function getEffectiveWeekSchedule(
  userId: string,
  weekStart?: string
): Map<string, ScheduleBlock[]> {
  const start = weekStart ?? getCurrentWeekStart();
  const period = demo.getPeriodForDate(start);
  const recurring = demo.getUserAvailability(userId, period?.id);
  const exceptions = demo.getUserExceptions(userId, period?.id);
  return getEffectiveScheduleForWeek(recurring, exceptions, start);
}

export function listTeams(): Team[] {
  return demo.getAllTeams();
}

export function getTeamMembers(teamId: string): Profile[] {
  return demo.getTeamMembers(teamId);
}

export function getSupervisorTeams(supervisorId: string): Team[] {
  const teamIds = demo.getSupervisorTeamIds(supervisorId);
  return demo.getAllTeams().filter((t) => teamIds.includes(t.id));
}

export function createUserAccount(
  user: SessionUser,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    role: Profile["role"];
    teamId: string | null;
    supervisorId?: string | null;
  }
): Profile {
  requirePermission(user, "write:users");
  const parsed = userOnboardingSchema.safeParse(data);
  if (!parsed.success) {
    throw new AppError(parsed.error.issues[0]?.message ?? "Invalid user details.", "validation");
  }
  let teamId = parsed.data.teamId || null;
  if (!teamId && parsed.data.supervisorId) {
    const supervised = getSupervisorTeams(parsed.data.supervisorId);
    if (supervised.length === 1) teamId = supervised[0].id;
    else if (supervised.length === 0) {
      throw new AppError("That supervisor has no assigned team.", "validation");
    } else {
      throw new AppError("Choose a team for that supervisor.", "validation");
    }
  }
  return demo.createUser(
    {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
      role: parsed.data.role,
      teamId,
    },
    user.id
  );
}

export function updateUserAccount(
  user: SessionUser,
  targetUserId: string,
  updates: Partial<Pick<Profile, "firstName" | "lastName" | "email" | "role">>
): Profile | undefined {
  requirePermission(user, "write:users");
  return demo.updateUserProfile(targetUserId, updates, user.id);
}

export function requestScheduleUpdate(
  user: SessionUser,
  targetUserId: string
): void {
  requirePermission(user, "write:users");
  demo.requestScheduleUpdate(targetUserId, user.id);
}

export function deactivateUser(
  user: SessionUser,
  targetUserId: string
): Profile | undefined {
  requirePermission(user, "write:users");
  return demo.updateUserStatus(targetUserId, "inactive", user.id);
}

export function reactivateUser(
  user: SessionUser,
  targetUserId: string
): Profile | undefined {
  requirePermission(user, "write:users");
  return demo.updateUserStatus(targetUserId, "active", user.id);
}

export function changeUserRole(
  user: SessionUser,
  targetUserId: string,
  role: Profile["role"]
): Profile | undefined {
  requirePermission(user, "write:users");
  return demo.updateUserRole(targetUserId, role, user.id);
}

export function changeUserTeam(
  user: SessionUser,
  targetUserId: string,
  teamId: string | null
): void {
  requirePermission(user, "write:users");
  demo.updateUserTeam(targetUserId, teamId, user.id);
}

export function assignSupervisor(
  user: SessionUser,
  teamId: string,
  supervisorId: string | null
): Team | undefined {
  requirePermission(user, "write:teams");
  if (supervisorId) {
    const supervisor = demo.getProfileById(supervisorId);
    if (!supervisor || supervisor.role !== "supervisor") {
      throw new AppError("Choose an active supervisor.", "validation");
    }
  }
  return demo.updateTeam(teamId, { supervisorId }, user.id);
}

export function createTeam(
  user: SessionUser,
  name: string,
  description: string,
  supervisorId: string | null
): Team {
  requirePermission(user, "write:teams");
  return demo.createTeam(name, description, supervisorId, user.id);
}

export function updateTeam(
  user: SessionUser,
  teamId: string,
  updates: Partial<Pick<Team, "name" | "description" | "supervisorId" | "status">>
): Team | undefined {
  requirePermission(user, "write:teams");
  return demo.updateTeam(teamId, updates, user.id);
}

export function previewUserCsv(
  user: SessionUser,
  csvText: string
): { valid: CsvValidatedRow[]; issues: CsvRowIssue[]; parseError?: string } {
  requirePermission(user, "write:users");
  const parsed = parseCsvText(csvText);
  if (parsed.parseError) return { valid: [], issues: [], parseError: parsed.parseError };
  const existing = listUsers().map((row) => ({
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    teamName: row.teamName,
  }));
  return validateCsvRows(
    parsed.rows,
    existing,
    listTeams().map((team) => team.name)
  );
}

export function importUserCsv(
  user: SessionUser,
  csvText: string
): { created: number; skipped: number; issues: CsvRowIssue[]; parseError?: string } {
  requirePermission(user, "write:users");
  const preview = previewUserCsv(user, csvText);
  if (preview.parseError) return { created: 0, skipped: 0, issues: [], parseError: preview.parseError };
  if (preview.issues.some((issue) => issue.severity === "error")) {
    return { created: 0, skipped: 0, issues: preview.issues };
  }
  const teams = listTeams();
  let created = 0;
  let skipped = 0;
  for (const row of preview.valid) {
    if (row.action === "skip") {
      skipped += 1;
      continue;
    }
    const team = teams.find((t) => t.name.toLowerCase() === row.teamName.toLowerCase());
    demo.createUser(
      {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        role: row.role,
        teamId: team?.id ?? null,
      },
      user.id
    );
    created += 1;
  }
  demo.addAuditLog(user.id, "users_imported", "profile", "csv", {
    created,
    skipped,
    flagged: preview.issues.length,
  });
  return { created, skipped, issues: preview.issues };
}

export function getAuditLogs(
  user: SessionUser,
  filters?: {
    action?: string;
    entityType?: string;
    userId?: string;
    targetUserId?: string;
    teamId?: string;
    from?: string;
    to?: string;
  }
): AuditLog[] {
  requirePermission(user, "read:audit_log");
  let logs = demo.getAuditLogs();
  if (filters?.action && filters.action !== "all") {
    logs = logs.filter((l) => l.action === filters.action);
  }
  if (filters?.entityType && filters.entityType !== "all") {
    logs = logs.filter((l) => l.entityType === filters.entityType);
  }
  if (filters?.userId) {
    logs = logs.filter((l) => l.actorUserId === filters.userId);
  }
  if (filters?.targetUserId) {
    logs = logs.filter(
      (l) =>
        l.entityId === filters.targetUserId ||
        l.metadata.userId === filters.targetUserId ||
        l.metadata.studentId === filters.targetUserId
    );
  }
  if (filters?.teamId) {
    logs = logs.filter(
      (l) => l.entityId === filters.teamId || l.metadata.teamId === filters.teamId
    );
  }
  if (filters?.from) {
    logs = logs.filter((l) => l.createdAt.slice(0, 10) >= filters.from!);
  }
  if (filters?.to) {
    logs = logs.filter((l) => l.createdAt.slice(0, 10) <= filters.to!);
  }
  return logs;
}

export function getNotifications(user: SessionUser): AppNotification[] {
  requirePermission(user, "read:own_notifications");
  return demo.listNotifications(user.id);
}

export function markNotificationRead(user: SessionUser, notificationId: string) {
  requirePermission(user, "read:own_notifications");
  return demo.markNotificationRead(notificationId, user.id);
}

export function markAllNotificationsRead(user: SessionUser) {
  requirePermission(user, "read:own_notifications");
  demo.markAllNotificationsRead(user.id);
}

export function canViewUserSchedule(viewer: SessionUser, targetUserId: string): boolean {
  if (viewer.id === targetUserId) return true;
  if (hasPermission(viewer, "read:all_schedules")) return true;
  if (hasPermission(viewer, "read:team_schedules")) {
    const viewerTeam = demo.getUserTeamId(viewer.id);
    const targetTeam = demo.getUserTeamId(targetUserId);
    if (viewer.role === "supervisor") {
      const supTeams = demo.getSupervisorTeamIds(viewer.id);
      return targetTeam !== null && supTeams.includes(targetTeam);
    }
    return viewerTeam === targetTeam;
  }
  return false;
}

export function getTeamCoverageData(teamId: string, date: string) {
  const students = demo.getStudentsByTeam(teamId);
  return students.map((student) => {
    const blocks = getEffectiveSchedule(student.id, date);
    return {
      student,
      blocks,
      officeCount: blocks.filter((b) => b.workMode === "OFFICE").length,
      remoteCount: blocks.filter((b) => b.workMode === "REMOTE").length,
    };
  });
}

export function getAdminOverviewStats() {
  const users = demo.getAllUsersWithTeams();
  const students = users.filter((u) => u.role === "student" && u.status === "active");
  const pendingExceptions = demo.getAllExceptions().filter((e) => e.status === "PENDING");
  const incomplete = students.filter((s) => s.scheduleStatus === "not_started");
  const unassigned = students.filter((s) => !s.teamId);
  const teams = demo.getAllTeams().filter((t) => t.status === "active");

  return {
    activeUsers: users.filter((u) => u.status === "active").length,
    studentsMissingAvailability: incomplete.length,
    pendingExceptions: pendingExceptions.length,
    teamCount: teams.length,
    recentAudit: demo.getAuditLogs().slice(0, 10),
    teams,
    incompleteStudents: incomplete,
    unassignedStudents: unassigned,
    pendingExceptionsList: pendingExceptions,
    currentPeriod: getCurrentPeriod() ?? null,
  };
}

function assertCanEditStudentSchedule(user: SessionUser, userId: string) {
  if (user.id === userId) {
    requirePermission(user, "write:own_availability");
    return;
  }
  requirePermission(user, "write:users");
}

function requireScheduleScope(user: SessionUser) {
  if (!hasPermission(user, "read:team_schedules") && !hasPermission(user, "read:all_schedules")) {
    throw new AppError("You don’t have permission to do that.", "unauthorized");
  }
}

function canReviewStudent(user: SessionUser, studentId: string): boolean {
  if (hasPermission(user, "read:all_schedules")) return true;
  const teamId = demo.getUserTeamId(studentId);
  return teamId !== null && demo.getSupervisorTeamIds(user.id).includes(teamId);
}

function authorizedStudents(viewer: SessionUser, teamId?: string): UserWithTeam[] {
  const teams =
    viewer.role === "administrator"
      ? demo.getAllTeams().filter((t) => t.status === "active")
      : getSupervisorTeams(viewer.id);
  const ids = teamId && teamId !== "all" ? [teamId] : teams.map((t) => t.id);
  const seen = new Set<string>();
  const students: UserWithTeam[] = [];
  for (const id of ids) {
    if (viewer.role === "supervisor" && !demo.getSupervisorTeamIds(viewer.id).includes(id)) continue;
    for (const student of demo.getStudentsByTeam(id)) {
      if (seen.has(student.id)) continue;
      seen.add(student.id);
      const details = demo.getUserWithTeam(student.id);
      if (details) students.push(details);
    }
  }
  return students;
}

function incrementDate(date: string): string {
  return addDaysToDateString(date, 1);
}

function notifyExceptionSubmitted(exception: ScheduleException) {
  const teamId = demo.getUserTeamId(exception.userId);
  const team = teamId ? demo.getAllTeams().find((t) => t.id === teamId) : undefined;
  const student = demo.getProfileById(exception.userId);
  if (!team?.supervisorId || !student) return;
  demo.createNotification({
    userId: team.supervisorId,
    eventType: "exception_submitted",
    title: "Exception request submitted",
    body: `${student.firstName} ${student.lastName} submitted an exception for ${exception.exceptionDate}.`,
    metadata: { exceptionId: exception.id, studentId: student.id },
  });
}

function notifyExceptionReviewed(exception: ScheduleException) {
  const approved = exception.status === "APPROVED";
  demo.createNotification({
    userId: exception.userId,
    eventType: approved ? "exception_approved" : "exception_declined",
    title: approved ? "Exception approved" : "Exception rejected",
    body: approved
      ? `Your exception for ${exception.exceptionDate} was approved.`
      : `Your exception for ${exception.exceptionDate} was rejected${
          exception.reviewNote ? `: ${exception.reviewNote}` : "."
        }`,
    metadata: {
      exceptionId: exception.id,
      reviewNote: exception.reviewNote,
    },
  });
}

function notifyStudentsPeriodOpened(period: SchedulePeriod) {
  const students = demo.getAllProfiles().filter((p) => p.role === "student" && p.status === "active");
  for (const student of students) {
    demo.createNotification({
      userId: student.id,
      eventType: "period_opened",
      title: `${period.name} is open`,
      body: `You can now create and submit your ${period.name} availability.`,
      metadata: { periodId: period.id },
    });
  }
}

export function persistFailure(event: string, error: unknown) {
  logger.error(event, {
    message: error instanceof Error ? error.message : "unknown",
  });
}
