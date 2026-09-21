import { NextResponse } from "next/server";
import { getProfileByEmail } from "@/lib/demo/store";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { isDevRoleSwitcherEnabled } from "@/lib/config";

export async function POST(request: Request) {
  if (!isDevRoleSwitcherEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { email } = await request.json();
  const profile = getProfileByEmail(email);
  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const sessionUser = {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    firstName: profile.firstName,
    lastName: profile.lastName,
  };

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, JSON.stringify(sessionUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
