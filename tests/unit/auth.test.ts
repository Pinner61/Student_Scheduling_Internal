import { describe, expect, it, beforeEach } from "vitest";
import { asuEmailError, isAsuEmail, normalizeEmail } from "@/lib/auth/email";
import { validatePassword } from "@/lib/auth/passwords";
import { createInvitationToken, hashInvitationToken } from "@/lib/auth/tokens";
import { canAccessPath, requireRole } from "@/lib/auth/rbac";
import {
  authenticateDemo,
  getProfileByEmail,
  resetDemoStore,
} from "@/lib/demo/store";
import {
  activateInvitation,
  inviteUserAccount,
  publicInvitationState,
  registerStudent,
  signInWithPassword,
} from "@/lib/auth/service";
import { deactivateUser } from "@/lib/services/data-service";
import { studentRegisterSchema } from "@/lib/validations/auth";
import type { SessionUser } from "@/types";

function asSession(email: string): SessionUser {
  const profile = getProfileByEmail(email);
  if (!profile) throw new Error(`missing profile ${email}`);
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
}

describe("email rules", () => {
  it("requires @asu.edu and lowercases addresses", () => {
    expect(normalizeEmail("  Alex.Chen@ASU.EDU ")).toBe("alex.chen@asu.edu");
    expect(isAsuEmail("alex.chen@asu.edu")).toBe(true);
    expect(isAsuEmail("someone@gmail.com")).toBe(false);
    expect(asuEmailError("someone@gmail.com")).toMatch(/@asu.edu/);
  });
});

describe("password rules", () => {
  it("requires length and confirmation match", () => {
    expect(validatePassword("short")).toMatch(/at least/);
    expect(validatePassword("longenough", "different")).toMatch(/do not match/);
    expect(validatePassword("longenough", "longenough")).toBeNull();
  });
});

describe("invitation tokens", () => {
  it("stores a hash rather than the raw token", () => {
    const { token, tokenHash } = createInvitationToken();
    expect(token).not.toBe(tokenHash);
    expect(hashInvitationToken(token)).toBe(tokenHash);
    expect(token.length).toBeGreaterThan(20);
  });
});

describe("registration and invitations", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("registers a student with a server-assigned student role", async () => {
    const parsed = studentRegisterSchema.parse({
      firstName: "Riley",
      lastName: "Ng",
      email: "riley.ng@asu.edu",
      password: "securepass",
      confirmPassword: "securepass",
    });
    const { profile, needsEmailConfirmation } = await registerStudent(parsed);
    expect(profile.role).toBe("student");
    expect(profile.status).toBe("active");
    expect(needsEmailConfirmation).toBe(false);
    const signedIn = await signInWithPassword("riley.ng@asu.edu", "securepass");
    expect(signedIn.id).toBe(profile.id);
  });

  it("rejects duplicate student registration", async () => {
    await expect(
      registerStudent({
        firstName: "Alex",
        lastName: "Chen",
        email: "alex.chen@asu.edu",
        password: "securepass",
        confirmPassword: "securepass",
      })
    ).rejects.toThrow(/already has an account/);
  });

  it("lets an administrator invite a supervisor who then activates", async () => {
    const admin = asSession("preyes@asu.edu");
    const invited = await inviteUserAccount(admin, {
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan.lee@asu.edu",
      role: "supervisor",
      teamId: null,
    });
    expect(invited.profile.role).toBe("supervisor");
    expect(invited.profile.status).toBe("pending");
    expect(invited.emailSent).toBe(false);
    expect(invited.activateUrl).toContain("/invite/");

    const token = invited.activateUrl.split("/invite/")[1];
    expect(publicInvitationState(token).status).toBe("valid");

    const activated = await activateInvitation(token, {
      firstName: "Jordan",
      lastName: "Lee",
      password: "supervisor1",
    });
    expect(activated.role).toBe("supervisor");
    expect(activated.status).toBe("active");
    const signedIn = await signInWithPassword("jordan.lee@asu.edu", "supervisor1");
    expect(signedIn.role).toBe("supervisor");
  });

  it("lets an administrator invite another administrator", async () => {
    const admin = asSession("preyes@asu.edu");
    const invited = await inviteUserAccount(admin, {
      firstName: "Pat",
      lastName: "Kim",
      email: "pat.kim@asu.edu",
      role: "administrator",
      teamId: null,
    });
    const token = invited.activateUrl.split("/invite/")[1];
    const activated = await activateInvitation(token, {
      firstName: "Pat",
      lastName: "Kim",
      password: "adminpass1",
    });
    expect(activated.role).toBe("administrator");
  });

  it("blocks deactivated users from demo sign-in", async () => {
    const admin = asSession("preyes@asu.edu");
    const student = asSession("alex.chen@asu.edu");
    deactivateUser(admin, student.id);
    expect(authenticateDemo("alex.chen@asu.edu", "Demo123!")).toBeNull();
    await expect(signInWithPassword("alex.chen@asu.edu", "Demo123!")).rejects.toThrow(
      /deactivated/
    );
  });
});

describe("route RBAC", () => {
  beforeEach(() => {
    resetDemoStore();
  });
  it("blocks students from admin and supervisor routes", () => {
    expect(canAccessPath("student", "/admin/users")).toBe(false);
    expect(canAccessPath("student", "/supervisor/overview")).toBe(false);
    expect(canAccessPath("supervisor", "/admin/settings")).toBe(false);
    expect(canAccessPath("administrator", "/admin/overview")).toBe(true);
  });

  it("requireRole rejects the wrong role", () => {
    const student = asSession("alex.chen@asu.edu");
    expect(() => requireRole(student, "administrator")).toThrow(/permission/);
    expect(requireRole(asSession("preyes@asu.edu"), "administrator").role).toBe("administrator");
  });
});
