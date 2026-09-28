import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config/app-url";
import { ensureProfileForConfirmedUser } from "@/lib/auth/service";
import { setSessionCookie } from "@/lib/auth/session";
import { getRoleHomePath } from "@/lib/auth/rbac";
import { logger } from "@/lib/logging/logger";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      logger.info("auth_callback_failed", { message: error.message });
      return NextResponse.redirect(new URL("/login?error=callback", url.origin));
    }
  }

  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    if (next.startsWith("/reset-password")) {
      return NextResponse.redirect(new URL("/reset-password", url.origin));
    }
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  const profile = await ensureProfileForConfirmedUser({
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata as { first_name?: string; last_name?: string },
  });

  if (!profile || profile.status !== "active") {
    const destination =
      profile?.status === "inactive" ? "/login?error=disabled" : "/login?error=pending";
    return NextResponse.redirect(new URL(destination, url.origin));
  }

  const destination = next.startsWith("/") ? next : getRoleHomePath(profile.role);
  await setSessionCookie(profile);
  return NextResponse.redirect(
    new URL(destination === "/" ? getRoleHomePath(profile.role) : destination, url.origin)
  );
}
