import type {
  AppSettings,
  AuditAction,
  AuditLog,
  Profile,
  RecurringAvailability,
  ScheduleException,
  ScheduleStatus,
  Team,
  TeamMembership,
  UserWithTeam,
} from "@/types";
import { getScheduleStatus } from "@/lib/schedule/engine";
import { createSeedDatabase, type DemoDatabase } from "./seed-data";
import { v4 as uuidv4 } from "uuid";

let store: DemoDatabase | null = null;

function getStore(): DemoDatabase {
  if (!store) {
    store = createSeedDatabase();
  }
  return store;
}

export function resetDemoStore(): void {
  store = createSeedDatabase();
}

export function getDemoSettings(): AppSettings {
  return { ...getStore().settings };
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

function addAuditLog(
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

export function getUserWithTeam(userId: string): UserWithTeam | undefined {
  const profile = getProfileById(userId);
  if (!profile) return undefined;
  const membership = getStore().memberships.find((m) => m.userId === userId);
  const team = membership
    ? getStore().teams.find((t) => t.id === membership.teamId)
    : undefined;
  const availability = getUserAvailability(userId);
  return {
    ...profile,
    teamId: team?.id ?? null,
    teamName: team?.name ?? null,
    scheduleStatus: getScheduleStatus(availability) as ScheduleStatus,
    availabilityUpdatedAt:
      availability.length > 0
        ? availability.reduce(
            (latest, a) => (a.updatedAt > latest ? a.updatedAt : latest),
            availability[0].updatedAt
          )
        : null,
  };
}

export function getAllUsersWithTeams(): UserWithTeam[] {
  return getStore()
    .profiles.map((p) => getUserWithTeam(p.id)!)
    .filter(Boolean);
}

export function getUserAvailability(userId: string): RecurringAvailability[] {
  return getStore().availability.filter((a) => a.userId === userId);
}

export function setUserAvailability(
  userId: string,
  ranges: Omit<RecurringAvailability, "id" | "createdAt" | "updatedAt">[],
  actorId: string
): RecurringAvailability[] {
  const db = getStore();
  const before = db.availability.filter((a) => a.userId === userId);
  db.availability = db.availability.filter((a) => a.userId !== userId);
  const now = new Date().toISOString();
  const created = ranges.map((r) => ({
    ...r,
    id: uuidv4(),
    userId,
    createdAt: now,
    updatedAt: now,
  }));
  db.availability.push(...created);
  addAuditLog(actorId, "availability_changed", "recurring_availability", userId, {
    before: before.length,
    after: created.length,
  });
  return created;
}

export function getUserExceptions(userId: string): ScheduleException[] {
  return getStore().exceptions.filter((e) => e.userId === userId);
}

export function getAllExceptions(): ScheduleException[] {
  return [...getStore().exceptions];
}

export function createException(
  data: Omit<
    ScheduleException,
    "id" | "status" | "reviewedBy" | "reviewedAt" | "reviewNote" | "createdAt" | "updatedAt"
  >,
  actorId: string
): ScheduleException {
  const now = new Date().toISOString();
  const exception: ScheduleException = {
    ...data,
    id: uuidv4(),
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
  });
  return exception;
}

export function reviewException(
  exceptionId: string,
  status: "APPROVED" | "DECLINED",
  reviewerId: string,
  reviewNote?: string
): ScheduleException | undefined {
  const exception = getStore().exceptions.find((e) => e.id === exceptionId);
  if (!exception) return undefined;
  exception.status = status;
  exception.reviewedBy = reviewerId;
  exception.reviewedAt = new Date().toISOString();
  exception.reviewNote = reviewNote ?? null;
  exception.updatedAt = new Date().toISOString();
  addAuditLog(
    reviewerId,
    status === "APPROVED" ? "exception_approved" : "exception_declined",
    "schedule_exception",
    exceptionId,
    { reviewNote }
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

export function updateUserTeam(
  userId: string,
  teamId: string | null,
  actorId: string
): void {
  const db = getStore();
  db.memberships = db.memberships.filter((m) => m.userId !== userId);
  if (teamId) {
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
  return team;
}

export function updateTeam(
  teamId: string,
  updates: Partial<Pick<Team, "name" | "description" | "supervisorId" | "status">>,
  actorId: string
): Team | undefined {
  const team = getStore().teams.find((t) => t.id === teamId);
  if (!team) return undefined;
  Object.assign(team, updates, { updatedAt: new Date().toISOString() });
  addAuditLog(actorId, updates.status === "archived" ? "team_archived" : "team_updated", "team", teamId, updates);
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
    if (profile && password === "Demo123!") return profile;
    return null;
  }
  return getProfileById(account.profileId) ?? null;
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
  },
  actorId: string
): Profile {
  const now = new Date().toISOString();
  const profile: Profile = {
    id: uuidv4(),
    authUserId: null,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    role: data.role,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  const db = getStore();
  db.profiles.push(profile);
  db.accounts.push({
    email: profile.email,
    password: "Demo123!",
    profileId: profile.id,
    role: profile.role,
    label: `${profile.firstName} ${profile.lastName}`,
  });
  if (data.teamId) {
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
