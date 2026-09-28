import { cookies } from "next/headers";
import type { Profile, SessionUser } from "@/types";
import {
  getProfileByAuthUserId,
  getProfileByEmail,
  getProfileById,
  markLastLogin,
} from "@/lib/demo/store";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookies";
import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchPersistedProfileByAuthId,
  fetchPersistedProfileByEmail,
  hydrateAuthStateFromDatabase,
  persistProfile,
} from "@/lib/auth/persist";
import { AppError } from "@/lib/errors";
import { requireRole } from "@/lib/auth/rbac";

export function toSessionUser(profile: Profile): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };
}

export async function resolveProfileForAuthUser(auth: {
  id: string;
  email?: string | null;
}): Promise<Profile | null> {
  await hydrateAuthStateFromDatabase();
  const email = auth.email?.toLowerCase() ?? "";
  let profile =
    getProfileByAuthUserId(auth.id) ??
    (email ? getProfileByEmail(email) : undefined) ??
    null;
  if (!profile) {
    profile =
      (await fetchPersistedProfileByAuthId(auth.id)) ??
      (email ? await fetchPersistedProfileByEmail(email) : null);
  }
  return profile;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  await hydrateAuthStateFromDatabase();

  const supabase = await tryCreateSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const profile = await resolveProfileForAuthUser({
        id: data.user.id,
        email: data.user.email,
      });
      if (!profile || profile.status !== "active") {
        if (profile?.status === "inactive") {
          await supabase.auth.signOut();
        }
        return null;
      }
      return toSessionUser(profile);
    }
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const data = JSON.parse(sessionCookie.value) as SessionUser;
    const profile = getProfileById(data.id) ?? getProfileByEmail(data.email);
    if (!profile || profile.status !== "active") return null;
    return toSessionUser(profile);
  } catch {
    return null;
  }
}

export const getCurrentUser = getSessionUser;

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AppError("You need to sign in again.", "unauthorized");
  }
  return user;
}

export async function setSessionCookie(profile: Profile): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(toSessionUser(profile)), sessionCookieOptions());
  markLastLogin(profile.id);
  await persistProfile({ ...profile, lastLoginAt: new Date().toISOString() });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", sessionCookieOptions(0));
}

export { SESSION_COOKIE, requireRole };
