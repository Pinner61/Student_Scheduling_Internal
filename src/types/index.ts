export type UserRole = "student" | "supervisor" | "administrator";
export type UserStatus = "active" | "inactive" | "pending";
export type WorkMode = "OFFICE" | "REMOTE";
export type ExceptionType =
  | "UNAVAILABLE"
  | "REMOTE_INSTEAD"
  | "OFFICE_INSTEAD"
  | "ALTERNATE_AVAILABILITY";
export type ExceptionStatus = "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED";
export type TeamStatus = "active" | "archived";
export type ScheduleStatus = "submitted" | "not_started";
export type SchedulePeriodStatus = "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED";
export type ScheduleSubmissionStatus = "DRAFT" | "SUBMITTED";
export type NotificationStatus = "unread" | "read";
export type AuditAction =
  | "availability_changed"
  | "schedule_submitted"
  | "schedule_reopened"
  | "schedule_updated"
  | "exception_submitted"
  | "exception_approved"
  | "exception_declined"
  | "exception_cancelled"
  | "user_created"
  | "user_invited"
  | "user_activated"
  | "user_updated"
  | "user_role_changed"
  | "team_assignment_changed"
  | "supervisor_assignment_changed"
  | "user_deactivated"
  | "user_reactivated"
  | "team_created"
  | "team_updated"
  | "team_archived"
  | "settings_changed"
  | "schedule_period_created"
  | "schedule_period_updated"
  | "schedule_period_opened"
  | "schedule_period_closed"
  | "schedule_period_archived"
  | "users_imported";

export interface Profile {
  id: string;
  authUserId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  invitedBy: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  invitedBy: string;
  profileId: string;
  tokenHash: string;
  expiresAt: string;
  acceptedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
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

export interface SchedulePeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: SchedulePeriodStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleSubmission {
  id: string;
  userId: string;
  schedulePeriodId: string;
  status: ScheduleSubmissionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringAvailability {
  id: string;
  userId: string;
  schedulePeriodId: string;
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
  schedulePeriodId: string;
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

export interface AppNotification {
  id: string;
  userId: string;
  eventType: string;
  title: string;
  body: string;
  status: NotificationStatus;
  readAt: string | null;
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
  supervisorId: string | null;
  supervisorName: string | null;
  scheduleStatus: ScheduleStatus;
  submissionStatus: ScheduleSubmissionStatus;
  submittedAt: string | null;
  availabilityUpdatedAt: string | null;
}

export interface AppSettings {
  workingDayStart: string;
  workingDayEnd: string;
  schedulingIntervalMinutes: number;
  timezone: string;
  coverageThresholdsEnabled: boolean;
  coverageThresholdOffice: number;
  coverageThresholdRemote: number;
  coverageThresholdTotal: number;
  exceptionApprovalRequired: boolean;
  notifyStudentsOnPeriodOpen: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  workingDayStart: "08:00",
  workingDayEnd: "18:00",
  schedulingIntervalMinutes: 30,
  timezone: "America/Phoenix",
  coverageThresholdsEnabled: false,
  coverageThresholdOffice: 2,
  coverageThresholdRemote: 1,
  coverageThresholdTotal: 3,
  exceptionApprovalRequired: true,
  notifyStudentsOnPeriodOpen: true,
};

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface CommonAvailabilityWindow {
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  availableCount: number;
  totalCount: number;
  availableStudentIds: string[];
  fullMatch: boolean;
}
