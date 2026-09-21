"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateDemo } from "@/lib/demo/store";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getRoleHomePath } from "@/lib/auth/rbac";
import { isDemoMode } from "@/lib/config";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password required" };
  }
  if (!isDemoMode()) {
    return { error: "Configure Supabase auth for production login" };
  }

  const profile = authenticateDemo(email, password);
  if (!profile || profile.status === "inactive") {
    return { error: "Invalid credentials" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE,
    JSON.stringify({
      id: profile.id,
      email: profile.email,
      role: profile.role,
      firstName: profile.firstName,
      lastName: profile.lastName,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }
  );

  redirect(getRoleHomePath(profile.role));
}
