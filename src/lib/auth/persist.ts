import { logger } from "@/lib/logging/logger";
import { isSupabaseAdminConfigured } from "@/lib/config/app-url";
import { createSupabaseAdminClient } from "@/lib/data/supabase-admin";
import {
  replaceInvitations,
  upsertProfileInStore,
} from "@/lib/demo/store";
import type { Invitation, Profile, UserRole, UserStatus } from "@/types";

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  last_login_at: string | null;
  invited_by: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

type InvitationRow = {
  id: string;
  email: string;
  role: UserRole;
  team_id: string | null;
  invited_by: string;
  profile_id: string;
  token_hash: string;
  expires_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
  created_at: string;
};

function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role,
    status: row.status,
    lastLoginAt: row.last_login_at,
    invitedBy: row.invited_by,
    activatedAt: row.activated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapInvitation(row: InvitationRow): Invitation {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    teamId: row.team_id,
    invitedBy: row.invited_by,
    profileId: row.profile_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  };
}

let hydrated = false;

export function resetAuthPersistenceCache(): void {
  hydrated = false;
}

export async function hydrateAuthStateFromDatabase(): Promise<void> {
  if (hydrated || !isSupabaseAdminConfigured()) return;
  hydrated = true;
  try {
    const admin = createSupabaseAdminClient();
    const [{ data: profiles, error: profileError }, { data: invitations, error: inviteError }] =
      await Promise.all([
        admin.from("profiles").select("*"),
        admin.from("invitations").select("*"),
      ]);
    if (profileError) {
      logger.error("auth_profile_hydrate_failed", { message: profileError.message });
    } else {
      for (const row of (profiles ?? []) as ProfileRow[]) {
        upsertProfileInStore(mapProfile(row));
      }
    }
    if (inviteError) {
      logger.error("auth_invitation_hydrate_failed", { message: inviteError.message });
    } else {
      replaceInvitations(((invitations ?? []) as InvitationRow[]).map(mapInvitation));
    }
  } catch (error) {
    logger.error("auth_hydrate_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function persistProfile(profile: Profile): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = createSupabaseAdminClient();
    const payload = {
      id: profile.id,
      auth_user_id: profile.authUserId,
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      role: profile.role,
      status: profile.status,
      last_login_at: profile.lastLoginAt,
      invited_by: profile.invitedBy,
      activated_at: profile.activatedAt,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
    };
    const { error } = await admin.from("profiles").upsert(payload);
    if (error) {
      const retry = await admin.from("profiles").upsert({ ...payload, invited_by: null });
      if (retry.error) {
        logger.error("auth_profile_persist_failed", { message: retry.error.message });
      }
    }
  } catch (error) {
    logger.error("auth_profile_persist_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function persistInvitation(invitation: Invitation): Promise<void> {
  if (!isSupabaseAdminConfigured()) return;
  try {
    const admin = createSupabaseAdminClient();
    const payload = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      team_id: invitation.teamId,
      invited_by: invitation.invitedBy,
      profile_id: invitation.profileId,
      token_hash: invitation.tokenHash,
      expires_at: invitation.expiresAt,
      accepted_at: invitation.acceptedAt,
      cancelled_at: invitation.cancelledAt,
      created_at: invitation.createdAt,
    };
    const { error } = await admin.from("invitations").upsert(payload);
    if (error) {
      const retry = await admin.from("invitations").upsert({ ...payload, team_id: null });
      if (retry.error) {
        logger.error("auth_invitation_persist_failed", { message: retry.error.message });
      }
    }
  } catch (error) {
    logger.error("auth_invitation_persist_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}

export async function fetchPersistedProfileByEmail(email: string): Promise<Profile | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("email", email.toLowerCase())
      .maybeSingle();
    if (error || !data) return null;
    const profile = mapProfile(data as ProfileRow);
    upsertProfileInStore(profile);
    return profile;
  } catch {
    return null;
  }
}

export async function fetchPersistedProfileByAuthId(authUserId: string): Promise<Profile | null> {
  if (!isSupabaseAdminConfigured()) return null;
  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .eq("auth_user_id", authUserId)
      .maybeSingle();
    if (error || !data) return null;
    const profile = mapProfile(data as ProfileRow);
    upsertProfileInStore(profile);
    return profile;
  } catch {
    return null;
  }
}
