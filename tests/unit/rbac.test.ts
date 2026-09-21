import { describe, expect, it } from "vitest";
import { canAccessPath, hasPermission, requirePermission } from "@/lib/auth/rbac";
import type { SessionUser } from "@/types";

const student: SessionUser = {
  id: "s1",
  email: "s@asu.edu",
  role: "student",
  firstName: "Alex",
  lastName: "Chen",
};

const supervisor: SessionUser = {
  ...student,
  id: "sup1",
  role: "supervisor",
};

const admin: SessionUser = {
  ...student,
  id: "a1",
  role: "administrator",
};

describe("RBAC", () => {
  it("allows students to manage their own availability but not users", () => {
    expect(hasPermission(student, "write:own_availability")).toBe(true);
    expect(hasPermission(student, "write:users")).toBe(false);
    expect(hasPermission(student, "review:exceptions")).toBe(false);
  });

  it("allows supervisors to review exceptions but not settings", () => {
    expect(hasPermission(supervisor, "review:exceptions")).toBe(true);
    expect(hasPermission(supervisor, "write:settings")).toBe(false);
    expect(canAccessPath("supervisor", "/admin/users")).toBe(false);
    expect(canAccessPath("supervisor", "/supervisor/overview")).toBe(true);
  });

  it("rejects unauthorized actions", () => {
    expect(() => requirePermission(student, "write:users")).toThrow("Unauthorized");
    expect(hasPermission(admin, "write:users")).toBe(true);
    expect(canAccessPath("administrator", "/admin/audit")).toBe(true);
    expect(canAccessPath("student", "/admin/users")).toBe(false);
  });
});
