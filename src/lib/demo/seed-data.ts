import type {
  AppSettings,
  AuditLog,
  Profile,
  RecurringAvailability,
  ScheduleException,
  Team,
  TeamMembership,
} from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
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

export interface DemoDatabase {
  profiles: Profile[];
  teams: Team[];
  memberships: TeamMembership[];
  availability: RecurringAvailability[];
  exceptions: ScheduleException[];
  auditLogs: AuditLog[];
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
  workMode: "OFFICE" | "REMOTE"
): RecurringAvailability {
  const now = new Date().toISOString();
  return {
    id: id(),
    userId,
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

  const exceptions: ScheduleException[] = [
    {
      id: id(),
      userId: studentIds[0],
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
    },
    {
      id: id(),
      userId: studentIds[2],
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
    },
    {
      id: id(),
      userId: studentIds[5],
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
    },
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
      entityId: exceptions[1].id,
      metadata: { studentId: studentIds[2] },
      createdAt: now,
    },
  ];

  const accounts: DemoAccount[] = [
    { email: "preyes@asu.edu", password: DEMO_PASSWORD, profileId: admin1, role: "administrator", label: "Patricia Reyes (Admin)" },
    { email: "smitchell@asu.edu", password: DEMO_PASSWORD, profileId: sup1, role: "supervisor", label: "Sarah Mitchell (Supervisor - Design)" },
    { email: `${firstNames[0].toLowerCase()}.${lastNames[0].toLowerCase()}@asu.edu`, password: DEMO_PASSWORD, profileId: studentIds[0], role: "student", label: `${firstNames[0]} ${lastNames[0]} (Student)` },
  ];

  return {
    profiles,
    teams,
    memberships,
    availability,
    exceptions,
    auditLogs,
    settings: { ...DEFAULT_SETTINGS },
    accounts,
  };
}
