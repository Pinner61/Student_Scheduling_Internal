export type UserRole = "student" | "supervisor" | "administrator";
export type UserStatus = "active" | "inactive";
export type WorkMode = "OFFICE" | "REMOTE";
export type ExceptionType =
  | "UNAVAILABLE"
  | "REMOTE_INSTEAD"
  | "OFFICE_INSTEAD"
  | "ALTERNATE_AVAILABILITY";
export type ExceptionStatus = "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
export type TeamStatus = "active" | "archived";
export type ScheduleStatus = "complete" | "incomplete" | "not_started";
export type AuditAction =
  | "availability_changed"
  | "exception_submitted"
  | "exception_approved"
  | "exception_declined"
  | "exception_cancelled"
  | "user_created"
  | "user_updated"
  | "user_role_changed"
  | "team_assignment_changed"
  | "user_deactivated"
  | "user_reactivated"
  | "team_created"
  | "team_updated"
  | "team_archived"
  | "settings_changed";

export interface Profile {
  id: string;
  authUserId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  status: TeamStatus;
  supervisorId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMembership {
  id: string;
  userId: string;
  teamId: string;
  membershipRole: "member" | "lead";
  createdAt: string;
}

export interface RecurringAvailability {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  workMode: WorkMode;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleException {
  id: string;
  userId: string;
  exceptionDate: string;
  startTime: string;
  endTime: string;
  exceptionType: ExceptionType;
  replacementMode: WorkMode | null;
  reason: string | null;
  status: ExceptionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ApplicationSetting {
  key: string;
  value: unknown;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ScheduleBlock {
  id?: string;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  workMode: WorkMode;
  source: "recurring" | "exception";
  exceptionId?: string;
}

export interface TimeRange {
  startTime: string;
  endTime: string;
  workMode: WorkMode;
}

export interface UserWithTeam extends Profile {
  teamId: string | null;
  teamName: string | null;
  scheduleStatus: ScheduleStatus;
  availabilityUpdatedAt: string | null;
}

export interface AppSettings {
  workingDayStart: string;
  workingDayEnd: string;
  schedulingIntervalMinutes: number;
  timezone: string;
  coverageThresholdOffice: number;
  coverageThresholdRemote: number;
  coverageThresholdTotal: number;
  exceptionApprovalRequired: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  workingDayStart: "08:00",
  workingDayEnd: "18:00",
  schedulingIntervalMinutes: 30,
  timezone: "America/Phoenix",
  coverageThresholdOffice: 2,
  coverageThresholdRemote: 1,
  coverageThresholdTotal: 3,
  exceptionApprovalRequired: true,
};

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}
