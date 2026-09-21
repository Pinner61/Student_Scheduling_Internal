import { cookies } from "next/headers";
import type { SessionUser } from "@/types";
import { getProfileById, getProfileByEmail } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/config";
import { SESSION_COOKIE } from "@/lib/auth/constants";

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const data = JSON.parse(sessionCookie.value) as SessionUser;
    if (isDemoMode()) {
      const profile = getProfileById(data.id) ?? getProfileByEmail(data.email);
      if (!profile || profile.status === "inactive") return null;
      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        firstName: profile.firstName,
        lastName: profile.lastName,
      };
    }
    return data;
  } catch {
    return null;
  }
}

export function buildSessionCookie(user: SessionUser): string {
  return JSON.stringify(user);
}

export { SESSION_COOKIE };
