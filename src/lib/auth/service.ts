import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { isDemoAuthEnabled } from "@/lib/config";
import { getAppUrl, isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/config/app-url";
import { normalizeEmail } from "@/lib/auth/email";
import { createInvitationToken, hashInvitationToken, invitationExpiry } from "@/lib/auth/tokens";
import {
  ACCOUNT_DISABLED_MESSAGE,
  AUTH_NOT_CONFIGURED_MESSAGE,
  DUPLICATE_ACCOUNT_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  PENDING_ACCOUNT_MESSAGE,
  assertActiveProfileStatus,
  mapSupabaseAuthError,
} from "@/lib/auth/errors";
import { persistInvitation, persistProfile, hydrateAuthStateFromDatabase } from "@/lib/auth/persist";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/data/supabase-admin";
import { isEmailConfigured } from "@/lib/notifications/email";
import {
  acceptInvitationRecord,
  activateProfile,
  addAuditLog,
  authenticateDemo,
  cancelInvitationRecord,
  createInvitationRecord,
  createUser,
  getAllProfiles,
  getInvitationById,
  getInvitationByTokenHash,
  getOpenInvitationByEmail,
  getProfileByEmail,
  getProfileById,
  listInvitations,
  reissueInvitationRecord,
  setDemoAccountPassword,
  setProfileAuthUserId,
} from "@/lib/demo/store";
import type { Invitation, Profile, SessionUser, UserRole } from "@/types";
import type { InviteUserInput, StudentRegisterInput } from "@/lib/validations/auth";

export const PASSWORD_RESET_NOTICE =
  "If that address has an account, we sent reset instructions. Check your ASU email.";

function applyBootstrapAdmin(profile: Profile): Profile {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!email || profile.email !== email) return profile;
  const hasAdmin = getAllProfiles().some(
    (item) => item.role === "administrator" && item.status === "active" && item.id !== profile.id
  );
  if (hasAdmin) return profile;
  profile.role = "administrator";
  return profile;
}

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return null;
    return data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
  } catch {
    return null;
  }
}

async function upsertAuthUser(email: string, password: string): Promise<string> {
  if (!isSupabaseAdminConfigured()) {
    throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
  }
  const admin = createSupabaseAdminClient();
  const existingId = await findAuthUserIdByEmail(email);
  if (existingId) {
    const { data, error } = await admin.auth.admin.updateUserById(existingId, {
      password,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new AppError(mapSupabaseAuthError(error?.message), "unavailable");
    }
    return data.user.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new AppError(mapSupabaseAuthError(error?.message), "unavailable");
  }
  return data.user.id;
}

function signInWithDemoPassword(email: string, password: string): Profile {
  if (!isDemoAuthEnabled()) {
    throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
  }

  const profile = authenticateDemo(email, password);
  if (!profile) {
    const existing = getProfileByEmail(email);
    if (existing?.status === "inactive") {
      throw new AppError(ACCOUNT_DISABLED_MESSAGE, "unauthorized");
    }
    if (existing?.status === "pending") {
      throw new AppError(PENDING_ACCOUNT_MESSAGE, "unauthorized");
    }
    throw new AppError(INVALID_CREDENTIALS_MESSAGE, "unauthorized");
  }
  assertActiveProfileStatus(profile.status);
  return profile;
}

function isInvalidLoginMessage(message: string | undefined): boolean {
  const value = (message ?? "").toLowerCase();
  return !value || value.includes("invalid login") || value.includes("invalid credentials");
}

export async function signInWithPassword(email: string, password: string): Promise<Profile> {
  await hydrateAuthStateFromDatabase();
  const normalized = normalizeEmail(email);

  if (isSupabaseConfigured()) {
    let supabaseErrorMessage: string | undefined;
    try {
      const supabase = await tryCreateSupabaseServerClient();
      if (!supabase) {
        if (isDemoAuthEnabled()) return signInWithDemoPassword(normalized, password);
        throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalized,
        password,
      });
      if (!error && data.user) {
        const profile = getProfileByEmail(normalized);
        if (!profile) {
          await supabase.auth.signOut();
          throw new AppError("This account is not set up for the scheduling application.", "unauthorized");
        }
        assertActiveProfileStatus(profile.status);
        if (!profile.authUserId) {
          setProfileAuthUserId(profile.id, data.user.id);
          profile.authUserId = data.user.id;
          await persistProfile(profile);
        }
        return profile;
      }
      supabaseErrorMessage = error?.message;
      logger.info("auth_login_failed", { email: normalized, message: supabaseErrorMessage });
    } catch (error) {
      if (error instanceof AppError) throw error;
      supabaseErrorMessage = error instanceof Error ? error.message : "unknown";
      logger.info("auth_login_failed", { email: normalized, message: supabaseErrorMessage });
    }

    if (isDemoAuthEnabled()) {
      try {
        return signInWithDemoPassword(normalized, password);
      } catch (demoError) {
        if (demoError instanceof AppError && demoError.message !== INVALID_CREDENTIALS_MESSAGE) {
          throw demoError;
        }
      }
    }

    throw new AppError(
      isInvalidLoginMessage(supabaseErrorMessage)
        ? INVALID_CREDENTIALS_MESSAGE
        : mapSupabaseAuthError(supabaseErrorMessage) || INVALID_CREDENTIALS_MESSAGE,
      "unauthorized"
    );
  }

  return signInWithDemoPassword(normalized, password);
}

export async function registerStudent(
  input: StudentRegisterInput
): Promise<{ profile: Profile; needsEmailConfirmation: boolean }> {
  await hydrateAuthStateFromDatabase();
  const email = normalizeEmail(input.email);
  const existing = getProfileByEmail(email);
  if (existing) {
    throw new AppError(DUPLICATE_ACCOUNT_MESSAGE, "conflict");
  }
  const openInvite = getOpenInvitationByEmail(email);
  if (openInvite) {
    throw new AppError("This email already has an invitation. Use the invitation link sent to you.", "conflict");
  }

  if (isSupabaseConfigured()) {
    const supabase = await tryCreateSupabaseServerClient();
    if (!supabase) throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        emailRedirectTo: `${getAppUrl()}/auth/callback?next=/schedule`,
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
        },
      },
    });
    if (error) {
      throw new AppError(mapSupabaseAuthError(error.message), "validation");
    }
    const confirmed = Boolean(data.session && data.user);
    const profile = createUser(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        role: "student",
        teamId: null,
        status: confirmed ? "active" : "pending",
        invitedBy: null,
        authUserId: data.user?.id ?? null,
      },
      "self"
    );
    applyBootstrapAdmin(profile);
    if (profile.role !== "student") {
      addAuditLog("self", "user_role_changed", "profile", profile.id, {
        after: profile.role,
        bootstrap: true,
      });
    }
    await persistProfile(profile);
    return { profile, needsEmailConfirmation: !confirmed };
  }

  if (!isDemoAuthEnabled()) {
    throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
  }

  const profile = createUser(
    {
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      role: "student",
      teamId: null,
      status: "active",
      invitedBy: null,
      password: input.password,
    },
    "self"
  );
  applyBootstrapAdmin(profile);
  return { profile, needsEmailConfirmation: false };
}

export async function requestPasswordReset(email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!isSupabaseConfigured()) {
    logger.info("password_reset_skipped_unconfigured", { email: normalized });
    return;
  }
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) return;
  const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
    redirectTo: `${getAppUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    logger.info("password_reset_request_failed", { message: error.message });
  }
}

export async function updateAuthenticatedPassword(password: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
  }
  const supabase = await tryCreateSupabaseServerClient();
  if (!supabase) throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new AppError("This reset link is invalid or has expired.", "unauthorized");
  }
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    throw new AppError(mapSupabaseAuthError(error.message), "validation");
  }
  const profile = getProfileByEmail(userData.user.email ?? "");
  if (profile && isDemoAuthEnabled()) {
    setDemoAccountPassword(profile.id, password);
  }
}

export function invitationActivateUrl(token: string): string {
  return `${getAppUrl()}/invite/${token}`;
}

export async function inviteUserAccount(
  actor: SessionUser,
  input: InviteUserInput
): Promise<{ profile: Profile; invitation: Invitation; activateUrl: string; emailSent: boolean }> {
  await hydrateAuthStateFromDatabase();
  const email = normalizeEmail(input.email);
  const role = input.role;
  const existing = getProfileByEmail(email);
  if (existing && existing.status === "active") {
    throw new AppError(DUPLICATE_ACCOUNT_MESSAGE, "conflict");
  }
  if (existing && existing.status === "inactive") {
    throw new AppError("Reactivate this account instead of sending a new invitation.", "conflict");
  }

  let profile = existing;
  if (!profile) {
    profile = createUser(
      {
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        role,
        teamId: input.teamId ?? null,
        status: "pending",
        invitedBy: actor.id,
      },
      actor.id
    );
  } else {
    profile.role = role;
    profile.firstName = input.firstName;
    profile.lastName = input.lastName;
    profile.status = "pending";
    profile.invitedBy = actor.id;
    profile.updatedAt = new Date().toISOString();
  }
  await persistProfile(profile);

  const open = getOpenInvitationByEmail(email);
  const { token, tokenHash } = createInvitationToken();
  const expiresAt = invitationExpiry();
  let invitation: Invitation;
  if (open) {
    const updated = reissueInvitationRecord(open.id, tokenHash, expiresAt, actor.id);
    if (!updated) throw new AppError("Unable to reissue that invitation.", "unavailable");
    invitation = updated;
  } else {
    invitation = createInvitationRecord({
      email,
      role,
      teamId: input.teamId ?? null,
      invitedBy: actor.id,
      profileId: profile.id,
      tokenHash,
      expiresAt,
    });
  }
  await persistInvitation(invitation);

  if (isEmailConfigured()) {
    logger.warn("invitation_email_not_implemented", { email, invitationId: invitation.id });
  }

  return {
    profile,
    invitation,
    activateUrl: invitationActivateUrl(token),
    emailSent: false,
  };
}

export function publicInvitationState(token: string): {
  status: "valid" | "expired" | "used" | "missing";
  email?: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
} {
  const invitation = getInvitationByTokenHash(hashInvitationToken(token));
  if (!invitation) return { status: "missing" };
  if (invitation.cancelledAt) return { status: "missing" };
  if (invitation.acceptedAt) return { status: "used" };
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) return { status: "expired" };
  const profile = getProfileById(invitation.profileId);
  return {
    status: "valid",
    email: invitation.email,
    role: invitation.role,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
  };
}

export async function activateInvitation(
  token: string,
  input: { firstName: string; lastName: string; password: string }
): Promise<Profile> {
  await hydrateAuthStateFromDatabase();
  const invitation = getInvitationByTokenHash(hashInvitationToken(token));
  if (!invitation || invitation.cancelledAt) {
    throw new AppError("This invitation is invalid.", "not_found");
  }
  if (invitation.acceptedAt) {
    throw new AppError("This invitation has already been used. Sign in instead.", "conflict");
  }
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    throw new AppError("Your invitation has expired.", "validation");
  }

  const profile = getProfileById(invitation.profileId);
  if (!profile) {
    throw new AppError("This invitation is invalid.", "not_found");
  }

  let authUserId = profile.authUserId;
  if (isSupabaseConfigured()) {
    authUserId = await upsertAuthUser(invitation.email, input.password);
    const supabase = await tryCreateSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password: input.password,
      });
      if (error) {
        throw new AppError(mapSupabaseAuthError(error.message), "unauthorized");
      }
    }
  } else if (isDemoAuthEnabled()) {
    setDemoAccountPassword(profile.id, input.password);
  } else {
    throw new AppError(AUTH_NOT_CONFIGURED_MESSAGE, "unavailable");
  }

  const activated = activateProfile(profile.id, {
    firstName: input.firstName,
    lastName: input.lastName,
    authUserId,
  });
  if (!activated) throw new AppError("Unable to activate that account.", "unavailable");
  activated.role = invitation.role;
  acceptInvitationRecord(invitation.id);
  const accepted = getInvitationById(invitation.id);
  if (accepted) await persistInvitation(accepted);
  addAuditLog(activated.id, "user_activated", "profile", activated.id, {
    role: activated.role,
    invitationId: invitation.id,
  });
  await persistProfile(activated);
  return activated;
}

export async function resendInvitation(
  actor: SessionUser,
  invitationId: string
): Promise<{ activateUrl: string; emailSent: boolean }> {
  const invitation = getInvitationById(invitationId);
  if (!invitation || invitation.acceptedAt || invitation.cancelledAt) {
    throw new AppError("That invitation cannot be resent.", "validation");
  }
  const { token, tokenHash } = createInvitationToken();
  const updated = reissueInvitationRecord(invitation.id, tokenHash, invitationExpiry(), actor.id);
  if (!updated) throw new AppError("That invitation cannot be resent.", "validation");
  await persistInvitation(updated);
  return { activateUrl: invitationActivateUrl(token), emailSent: false };
}

export async function cancelInvitation(actor: SessionUser, invitationId: string): Promise<void> {
  const invitation = cancelInvitationRecord(invitationId, actor.id);
  if (!invitation) throw new AppError("That invitation cannot be cancelled.", "validation");
  await persistInvitation(invitation);
}

export function listUserInvitations(): Invitation[] {
  return listInvitations();
}

export async function ensureProfileForConfirmedUser(auth: {
  id: string;
  email?: string | null;
  user_metadata?: { first_name?: string; last_name?: string };
}): Promise<Profile | null> {
  const email = auth.email ? normalizeEmail(auth.email) : "";
  if (!email) return null;
  let profile = getProfileByEmail(email);
  if (!profile) {
    profile = createUser(
      {
        firstName: auth.user_metadata?.first_name || email.split("@")[0],
        lastName: auth.user_metadata?.last_name || "Student",
        email,
        role: "student",
        teamId: null,
        status: "active",
        invitedBy: null,
        authUserId: auth.id,
      },
      "self"
    );
    applyBootstrapAdmin(profile);
  } else {
    if (profile.status === "inactive") return profile;
    setProfileAuthUserId(profile.id, auth.id);
    if (profile.status === "pending" && profile.role === "student") {
      activateProfile(profile.id, { authUserId: auth.id });
    }
  }
  const latest = getProfileByEmail(email);
  if (latest) await persistProfile(latest);
  return latest ?? null;
}

export async function terminateUserSessions(profile: Profile): Promise<void> {
  if (!isSupabaseAdminConfigured() || !profile.authUserId) return;
  try {
    const admin = createSupabaseAdminClient();
    await admin.auth.admin.signOut(profile.authUserId, "global");
  } catch (error) {
    logger.warn("auth_session_terminate_failed", {
      userId: profile.id,
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function persistAccountStatus(profile: Profile): Promise<void> {
  await persistProfile(profile);
  if (profile.status === "inactive") {
    await terminateUserSessions(profile);
  }
}
