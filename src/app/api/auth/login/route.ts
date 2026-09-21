import { NextResponse } from "next/server";
import { authenticateDemo } from "@/lib/demo/store";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { getRoleHomePath } from "@/lib/auth/rbac";
import { isDemoMode } from "@/lib/config";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  if (!isDemoMode()) {
    return NextResponse.json(
      { error: "Configure Supabase auth for production login" },
      { status: 501 }
    );
  }

  const profile = authenticateDemo(email, password);
  if (!profile || profile.status === "inactive") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const sessionUser = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };

  const response = NextResponse.json({
    success: true,
    redirect: getRoleHomePath(profile.role),
  });

  response.cookies.set(SESSION_COOKIE, JSON.stringify(sessionUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
