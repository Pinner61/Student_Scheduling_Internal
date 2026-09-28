import { NextResponse } from "next/server";
import { signInWithPassword } from "@/lib/auth/service";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/cookies";
import { getRoleHomePath } from "@/lib/auth/rbac";
import { toSessionUser } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";
import { toUserFacingError } from "@/lib/errors";
import { persistProfile } from "@/lib/auth/persist";
import { markLastLogin } from "@/lib/demo/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Email and password required" },
      { status: 400 }
    );
  }

  try {
    const profile = await signInWithPassword(parsed.data.email, parsed.data.password);
    markLastLogin(profile.id);
    await persistProfile({ ...profile, lastLoginAt: new Date().toISOString() });
    const response = NextResponse.json({
      success: true,
      redirect: getRoleHomePath(profile.role),
    });
    response.cookies.set(SESSION_COOKIE, JSON.stringify(toSessionUser(profile)), sessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: toUserFacingError(error, "Incorrect email or password.") },
      { status: 401 }
    );
  }
}
