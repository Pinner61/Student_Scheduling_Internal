import type {
  AppNotification,
  AppSettings,
  AuditLog,
  Profile,
  RecurringAvailability,
  ScheduleException,
  SchedulePeriod,
  ScheduleSubmission,
  Team,
  TeamMembership,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { getCurrentWeekStart } from "@/lib/schedule/engine";
import { addDaysToDateString } from "@/lib/utils/time";
import { v4 as uuidv4 } from "uuid";

function id() {
  return uuidv4();
}

export const DEMO_PASSWORD = "Demo123!";

export interface DemoAccount {
  email: string;
  password: string;
  profileId: string;
  role: Profile["role"];
  label: string;
}

export const FALL_2026_PERIOD_ID = "period-fall-2026";
export const SPRING_2027_PERIOD_ID = "period-spring-2027";

export interface DemoDatabase {
  profiles: Profile[];
  teams: Team[];
  memberships: TeamMembership[];
  periods: SchedulePeriod[];
  submissions: ScheduleSubmission[];
  availability: RecurringAvailability[];
  exceptions: ScheduleException[];
  auditLogs: AuditLog[];
  notifications: AppNotification[];
  settings: AppSettings;
  accounts: DemoAccount[];
}

const admin1 = "profile-admin-preyes";
const admin2 = "profile-admin-mtorres";
const sup1 = "profile-sup-smitchell";
const sup2 = "profile-sup-dokonkwo";
const sup3 = "profile-sup-efoster";
const sup4 = "profile-sup-jliu";

const teamDesign = "team-design";
const teamMultimedia = "team-multimedia";
const teamWeb = "team-web";
const teamComms = "team-comms";

const studentIds = Array.from({ length: 18 }, (_, i) => `profile-student-${i}`);

const firstNames = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery",
  "Blake", "Cameron", "Dakota", "Emery", "Finley", "Harper", "Jamie", "Kendall",
  "Logan", "Parker",
];
const lastNames = [
  "Chen", "Patel", "Garcia", "Nguyen", "Kim", "Williams", "Martinez", "Johnson",
  "Brown", "Davis", "Miller", "Wilson", "Moore", "Anderson", "Thomas", "Jackson",
  "White", "Harris",
];

function makeProfile(
  profileId: string,
  firstName: string,
  lastName: string,
  email: string,
  role: Profile["role"]
): Profile {
  const now = new Date().toISOString();
  return {
    id: profileId,
    authUserId: null,
    firstName,
    lastName,
    email,
    role,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

function makeAvailability(
  userId: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  workMode: "OFFICE" | "REMOTE",
  schedulePeriodId = FALL_2026_PERIOD_ID
): RecurringAvailability {
  const now = new Date().toISOString();
  return {
    id: id(),
    userId,
    schedulePeriodId,
    dayOfWeek,
    startTime,
    endTime,
    workMode,
    effectiveFrom: null,
    effectiveUntil: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createSeedDatabase(): DemoDatabase {
  const now = new Date().toISOString();
  const profiles: Profile[] = [
    makeProfile(admin1, "Patricia", "Reyes", "preyes@asu.edu", "administrator"),
    makeProfile(admin2, "Michael", "Torres", "mtorres@asu.edu", "administrator"),
    makeProfile(sup1, "Sarah", "Mitchell", "smitchell@asu.edu", "supervisor"),
    makeProfile(sup2, "David", "Okonkwo", "dokonkwo@asu.edu", "supervisor"),
    makeProfile(sup3, "Emily", "Foster", "efoster@asu.edu", "supervisor"),
    makeProfile(sup4, "James", "Liu", "jliu@asu.edu", "supervisor"),
    ...studentIds.map((sid, i) =>
      makeProfile(
        sid,
        firstNames[i],
        lastNames[i],
        `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@asu.edu`,
        "student"
      )
    ),
  ];

  const teams: Team[] = [
    { id: teamDesign, name: "Design", description: "Visual design and branding", status: "active", supervisorId: sup1, createdAt: now, updatedAt: now },
    { id: teamMultimedia, name: "Multimedia", description: "Video and audio production", status: "active", supervisorId: sup2, createdAt: now, updatedAt: now },
    { id: teamWeb, name: "Web", description: "Web development and UX", status: "active", supervisorId: sup3, createdAt: now, updatedAt: now },
    { id: teamComms, name: "Communications", description: "Content and communications", status: "active", supervisorId: sup4, createdAt: now, updatedAt: now },
  ];

  const teamIds = [teamDesign, teamMultimedia, teamWeb, teamComms];
  const memberships: TeamMembership[] = [
    ...studentIds.map((sid, i) => ({
      id: id(),
      userId: sid,
      teamId: teamIds[i % 4],
      membershipRole: "member" as const,
      createdAt: now,
    })),
  ];

  const availability: RecurringAvailability[] = [];
  for (let i = 0; i < studentIds.length; i++) {
    const userId = studentIds[i];
    if (i % 5 === 0) {
      availability.push(
        makeAvailability(userId, 1, "09:00", "12:00", "OFFICE"),
        makeAvailability(userId, 1, "13:00", "16:00", "OFFICE"),
        makeAvailability(userId, 3, "10:00", "14:00", "OFFICE"),
        makeAvailability(userId, 5, "09:00", "13:00", "OFFICE")
      );
    } else if (i % 5 === 1) {
      availability.push(
        makeAvailability(userId, 2, "10:00", "13:00", "REMOTE"),
        makeAvailability(userId, 4, "11:00", "15:00", "REMOTE"),
        makeAvailability(userId, 5, "09:00", "12:00", "REMOTE")
      );
    } else if (i % 5 === 2) {
      availability.push(
        makeAvailability(userId, 1, "08:30", "11:30", "OFFICE"),
        makeAvailability(userId, 2, "14:00", "17:00", "REMOTE"),
        makeAvailability(userId, 4, "09:00", "12:00", "OFFICE")
      );
    } else if (i % 5 === 3) {
      availability.push(
        makeAvailability(userId, 2, "13:00", "17:00", "OFFICE"),
        makeAvailability(userId, 3, "09:00", "12:00", "OFFICE"),
        makeAvailability(userId, 4, "14:00", "17:00", "REMOTE")
      );
    } else {
      availability.push(
        makeAvailability(userId, 1, "10:00", "14:00", "REMOTE"),
        makeAvailability(userId, 3, "13:00", "16:00", "OFFICE")
      );
    }
  }

  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));
  const nextTuesday = new Date();
  nextTuesday.setDate(nextTuesday.getDate() + ((2 - nextTuesday.getDay() + 7) % 7 || 7));
  const thisMonday = getCurrentWeekStart();
  const recentRejectedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const expiredRejectedAt = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();

  const approvedOverlay: ScheduleException = {
    id: id(),
    userId: studentIds[0],
    schedulePeriodId: FALL_2026_PERIOD_ID,
    exceptionDate: thisMonday,
    startTime: "10:00",
    endTime: "11:00",
    exceptionType: "UNAVAILABLE",
    replacementMode: null,
    reason: "Design critique conflict",
    status: "APPROVED",
    reviewedBy: sup1,
    reviewedAt: now,
    reviewNote: "Approved — coverage is already in place.",
    createdAt: now,
    updatedAt: now,
  };
  const pendingAlex: ScheduleException = {
    id: id(),
    userId: studentIds[0],
    schedulePeriodId: FALL_2026_PERIOD_ID,
    exceptionDate: nextFriday.toISOString().split("T")[0],
    startTime: "14:00",
    endTime: "16:00",
    exceptionType: "UNAVAILABLE",
    replacementMode: null,
    reason: "Doctor appointment",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: now,
    updatedAt: now,
  };
  const rejectedRecent: ScheduleException = {
    id: id(),
    userId: studentIds[0],
    schedulePeriodId: FALL_2026_PERIOD_ID,
    exceptionDate: addDaysToDateString(thisMonday, 2),
    startTime: "13:00",
    endTime: "16:00",
    exceptionType: "REMOTE_INSTEAD",
    replacementMode: "REMOTE",
    reason: "Need to work remotely for a shoot",
    status: "DECLINED",
    reviewedBy: sup1,
    reviewedAt: recentRejectedAt,
    reviewNote: "Office coverage is required for that afternoon.",
    createdAt: recentRejectedAt,
    updatedAt: recentRejectedAt,
  };
  const rejectedExpired: ScheduleException = {
    id: id(),
    userId: studentIds[0],
    schedulePeriodId: FALL_2026_PERIOD_ID,
    exceptionDate: addDaysToDateString(thisMonday, -7),
    startTime: "09:00",
    endTime: "10:00",
    exceptionType: "UNAVAILABLE",
    replacementMode: null,
    reason: "Older request kept for audit history",
    status: "DECLINED",
    reviewedBy: sup1,
    reviewedAt: expiredRejectedAt,
    reviewNote: "Too late to change that week’s coverage.",
    createdAt: expiredRejectedAt,
    updatedAt: expiredRejectedAt,
  };
  const approvedTaylor: ScheduleException = {
    id: id(),
    userId: studentIds[2],
    schedulePeriodId: FALL_2026_PERIOD_ID,
    exceptionDate: nextTuesday.toISOString().split("T")[0],
    startTime: "10:00",
    endTime: "14:00",
    exceptionType: "REMOTE_INSTEAD",
    replacementMode: "REMOTE",
    reason: "Working from home due to campus event",
    status: "APPROVED",
    reviewedBy: sup1,
    reviewedAt: now,
    reviewNote: "Approved",
    createdAt: now,
    updatedAt: now,
  };
  const pendingRiley: ScheduleException = {
    id: id(),
    userId: studentIds[5],
    schedulePeriodId: FALL_2026_PERIOD_ID,
    exceptionDate: nextFriday.toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "11:00",
    exceptionType: "UNAVAILABLE",
    replacementMode: null,
    reason: "Class conflict",
    status: "PENDING",
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    createdAt: now,
    updatedAt: now,
  };

  const exceptions: ScheduleException[] = [
    approvedOverlay,
    pendingAlex,
    rejectedRecent,
    rejectedExpired,
    approvedTaylor,
    pendingRiley,
  ];

  const auditLogs: AuditLog[] = [
    {
      id: id(),
      actorUserId: admin1,
      action: "user_created",
      entityType: "profile",
      entityId: studentIds[0],
      metadata: { email: profiles.find((p) => p.id === studentIds[0])?.email },
      createdAt: now,
    },
    {
      id: id(),
      actorUserId: sup1,
      action: "exception_approved",
      entityType: "schedule_exception",
      entityId: approvedTaylor.id,
      metadata: { studentId: studentIds[2] },
      createdAt: now,
    },
  ];

  const accounts: DemoAccount[] = [
    { email: "preyes@asu.edu", password: DEMO_PASSWORD, profileId: admin1, role: "administrator", label: "Patricia Reyes (Admin)" },
    { email: "smitchell@asu.edu", password: DEMO_PASSWORD, profileId: sup1, role: "supervisor", label: "Sarah Mitchell (Supervisor - Design)" },
    { email: `${firstNames[0].toLowerCase()}.${lastNames[0].toLowerCase()}@asu.edu`, password: DEMO_PASSWORD, profileId: studentIds[0], role: "student", label: `${firstNames[0]} ${lastNames[0]} (Student)` },
  ];

  const periods: SchedulePeriod[] = [
    {
      id: FALL_2026_PERIOD_ID,
      name: "Fall 2026",
      startDate: "2026-08-17",
      endDate: "2026-12-18",
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: SPRING_2027_PERIOD_ID,
      name: "Spring 2027",
      startDate: "2027-01-11",
      endDate: "2027-05-07",
      status: "DRAFT",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const submittedAt = "2026-08-28T21:14:00.000Z";
  const submissions: ScheduleSubmission[] = studentIds.map((userId) => ({
    id: id(),
    userId,
    schedulePeriodId: FALL_2026_PERIOD_ID,
    status: "SUBMITTED",
    submittedAt,
    createdAt: now,
    updatedAt: now,
  }));

  const notifications: AppNotification[] = [
    {
      id: id(),
      userId: sup1,
      eventType: "exception_submitted",
      title: "Exception request submitted",
      body: "Alex Chen requested an exception for review.",
      status: "unread",
      readAt: null,
      metadata: { exceptionId: pendingAlex.id, studentId: studentIds[0] },
      createdAt: now,
    },
    {
      id: id(),
      userId: studentIds[0],
      eventType: "exception_declined",
      title: "Exception rejected",
      body: "Your exception was rejected: Office coverage is required for that afternoon.",
      status: "unread",
      readAt: null,
      metadata: { exceptionId: rejectedRecent.id, reviewNote: rejectedRecent.reviewNote },
      createdAt: recentRejectedAt,
    },
  ];

  auditLogs.push({
    id: id(),
    actorUserId: admin1,
    action: "schedule_period_opened",
    entityType: "schedule_period",
    entityId: FALL_2026_PERIOD_ID,
    metadata: { name: "Fall 2026" },
    createdAt: now,
  });

  return {
    profiles,
    teams,
    memberships,
    periods,
    submissions,
    availability,
    exceptions,
    auditLogs,
    notifications,
    settings: { ...DEFAULT_SETTINGS },
    accounts,
  };
}
