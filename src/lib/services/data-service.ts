import type {
  AppSettings,
  AuditLog,
  Profile,
  RecurringAvailability,
  ScheduleException,
  SessionUser,
  Team,
  UserWithTeam,
} from "@/types";
import * as demo from "@/lib/demo/store";
import { hasPermission, requirePermission } from "@/lib/auth/rbac";
import {
  getEffectiveScheduleForDate,
  getEffectiveScheduleForWeek,
  getCurrentWeekStart,
} from "@/lib/schedule/engine";
import type { ScheduleBlock } from "@/types";
import { rangesOverlap, timeToMinutes } from "@/lib/utils/time";

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

export function getUser(userId: string): UserWithTeam | undefined {
  return demo.getUserWithTeam(userId);
}

export function listUsers(filters?: {
  search?: string;
  role?: string;
  team?: string;
  status?: string;
}): UserWithTeam[] {
  let users = demo.getAllUsersWithTeams();
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

export function getAvailability(userId: string): RecurringAvailability[] {
  return demo.getUserAvailability(userId);
}

export function saveAvailability(
  user: SessionUser,
  userId: string,
  ranges: Omit<RecurringAvailability, "id" | "createdAt" | "updatedAt">[]
): RecurringAvailability[] {
  if (user.id !== userId) {
    requirePermission(user, "write:users");
  } else {
    requirePermission(user, "write:own_availability");
  }
  return demo.setUserAvailability(userId, ranges, user.id);
}

export function getExceptions(userId?: string): ScheduleException[] {
  if (userId) return demo.getUserExceptions(userId);
  return demo.getAllExceptions();
}

export function getExceptionsForTeam(teamId: string): ScheduleException[] {
  const members = demo.getStudentsByTeam(teamId);
  const memberIds = new Set(members.map((m) => m.id));
  return demo.getAllExceptions().filter((e) => memberIds.has(e.userId));
}

export function submitException(
  user: SessionUser,
  data: Omit<
    ScheduleException,
    "id" | "userId" | "status" | "reviewedBy" | "reviewedAt" | "reviewNote" | "createdAt" | "updatedAt"
  >
): ScheduleException {
  requirePermission(user, "write:own_exceptions");
  return demo.createException({ ...data, userId: user.id }, user.id);
}

export function reviewExceptionRequest(
  user: SessionUser,
  exceptionId: string,
  status: "APPROVED" | "DECLINED",
  reviewNote?: string
): ScheduleException | undefined {
  requirePermission(user, "review:exceptions");
  return demo.reviewException(exceptionId, status, user.id, reviewNote);
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
  const recurring = demo.getUserAvailability(userId);
  const exceptions = demo.getUserExceptions(userId);
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
      const coversWindow = blocks.some(
        (b) =>
          timeToMinutes(b.startTime) <= timeToMinutes(params.startTime) &&
          timeToMinutes(b.endTime) >= timeToMinutes(params.endTime)
      );
      results.push({ student: details, blocks, coversWindow });
    }
  }

  return results.sort((a, b) => a.student.lastName.localeCompare(b.student.lastName));
}

export function getEffectiveWeekSchedule(
  userId: string,
  weekStart?: string
): Map<string, ScheduleBlock[]> {
  const start = weekStart ?? getCurrentWeekStart();
  const recurring = demo.getUserAvailability(userId);
  const exceptions = demo.getUserExceptions(userId);
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
  }
): Profile {
  requirePermission(user, "write:users");
  return demo.createUser(data, user.id);
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

export function getAuditLogs(filters?: {
  action?: string;
  entityType?: string;
  userId?: string;
  from?: string;
  to?: string;
}): AuditLog[] {
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
  if (filters?.from) {
    logs = logs.filter((l) => l.createdAt.slice(0, 10) >= filters.from!);
  }
  if (filters?.to) {
    logs = logs.filter((l) => l.createdAt.slice(0, 10) <= filters.to!);
  }
  return logs;
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
  const incomplete = students.filter(
    (s) => s.scheduleStatus === "incomplete" || s.scheduleStatus === "not_started"
  );
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
  };
}
