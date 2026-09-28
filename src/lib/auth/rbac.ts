import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import type { SessionUser, UserRole } from "@/types";

export type Permission =
  | "read:own_profile"
  | "read:own_schedule"
  | "write:own_availability"
  | "submit:own_schedule"
  | "read:own_exceptions"
  | "write:own_exceptions"
  | "cancel:own_exceptions"
  | "read:own_notifications"
  | "read:team_schedules"
  | "read:team_exceptions"
  | "review:exceptions"
  | "read:all_users"
  | "write:users"
  | "read:all_teams"
  | "write:teams"
  | "read:audit_log"
  | "write:settings"
  | "write:schedule_periods"
  | "read:all_schedules";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    "read:own_profile",
    "read:own_schedule",
    "write:own_availability",
    "submit:own_schedule",
    "read:own_exceptions",
    "write:own_exceptions",
    "cancel:own_exceptions",
    "read:own_notifications",
  ],
  supervisor: [
    "read:own_profile",
    "read:own_schedule",
    "write:own_availability",
    "submit:own_schedule",
    "read:own_exceptions",
    "write:own_exceptions",
    "cancel:own_exceptions",
    "read:own_notifications",
    "read:team_schedules",
    "read:team_exceptions",
    "review:exceptions",
  ],
  administrator: [
    "read:own_profile",
    "read:own_schedule",
    "write:own_availability",
    "submit:own_schedule",
    "read:own_exceptions",
    "write:own_exceptions",
    "cancel:own_exceptions",
    "read:own_notifications",
    "read:team_schedules",
    "read:team_exceptions",
    "review:exceptions",
    "read:all_users",
    "write:users",
    "read:all_teams",
    "write:teams",
    "read:audit_log",
    "write:settings",
    "write:schedule_periods",
    "read:all_schedules",
  ],
};

export function hasPermission(user: SessionUser | null, permission: Permission): boolean {
  if (!user) return false;
  return ROLE_PERMISSIONS[user.role].includes(permission);
}

export function requirePermission(user: SessionUser | null, permission: Permission): void {
  if (!hasPermission(user, permission)) {
    logger.warn("authorization_denied", {
      permission,
      userId: user?.id,
      role: user?.role,
    });
    throw new AppError("You don’t have permission to do that.", "unauthorized");
  }
}

export function requireRole(user: SessionUser | null, roles: UserRole | UserRole[]): SessionUser {
  if (!user) {
    logger.warn("authorization_denied", { reason: "unauthenticated" });
    throw new AppError("You need to sign in again.", "unauthorized");
  }
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    logger.warn("authorization_denied", {
      userId: user.id,
      role: user.role,
      required: allowed,
    });
    throw new AppError("You don’t have permission to do that.", "unauthorized");
  }
  return user;
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "student":
      return "Student";
    case "supervisor":
      return "Supervisor";
    case "administrator":
      return "Administrator";
  }
}

export function getRoleHomePath(role: UserRole): string {
  switch (role) {
    case "student":
      return "/schedule";
    case "supervisor":
      return "/supervisor/overview";
    case "administrator":
      return "/admin/overview";
  }
}

export function canAccessPath(role: UserRole, path: string): boolean {
  if (role === "administrator") return true;
  if (role === "supervisor") {
    return (
      path.startsWith("/supervisor") ||
      path.startsWith("/schedule") ||
      path.startsWith("/availability") ||
      path.startsWith("/exceptions") ||
      path.startsWith("/profile")
    );
  }
  return (
    path.startsWith("/schedule") ||
    path.startsWith("/availability") ||
    path.startsWith("/exceptions") ||
    path.startsWith("/profile")
  );
}

export function getNavItems(role: UserRole) {
  switch (role) {
    case "student":
      return [
        { href: "/schedule", label: "Schedule" },
        { href: "/exceptions", label: "Exceptions" },
        { href: "/profile", label: "Profile" },
      ];
    case "supervisor":
      return [
        { href: "/supervisor/overview", label: "Overview" },
        { href: "/supervisor/team", label: "Team Schedule" },
        { href: "/supervisor/availability", label: "Find Availability" },
        { href: "/supervisor/students", label: "Students" },
        { href: "/supervisor/exceptions", label: "Exceptions" },
      ];
    case "administrator":
      return [
        { href: "/admin/overview", label: "Overview" },
        { href: "/admin/users", label: "Users" },
        { href: "/admin/teams", label: "Teams" },
        { href: "/admin/periods", label: "Schedule Periods" },
        { href: "/admin/schedule", label: "Coverage" },
        { href: "/admin/exceptions", label: "Exceptions" },
        { href: "/admin/audit", label: "Audit Log" },
        { href: "/admin/settings", label: "Settings" },
      ];
  }
}
