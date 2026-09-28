import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/constants";
import { canAccessPath, getRoleHomePath } from "@/lib/auth/rbac";
import { isPublicPath } from "@/lib/auth/public-paths";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import type { SessionUser } from "@/types";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response: NextResponse;
  let supabaseUser = null;
  try {
    const session = await updateSupabaseSession(request);
    response = session.response;
    supabaseUser = session.user;
  } catch {
    response = NextResponse.next({ request });
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return response;
  }

  if (isPublicPath(pathname)) {
    return response;
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  let sessionUser: SessionUser | null = null;
  if (sessionCookie?.value) {
    try {
      sessionUser = JSON.parse(sessionCookie.value) as SessionUser;
    } catch {
      sessionUser = null;
    }
  }

  const authenticated = Boolean(sessionUser || supabaseUser);
  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/") {
    if (!sessionUser) return response;
    const redirect = NextResponse.redirect(new URL(getRoleHomePath(sessionUser.role), request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  if (sessionUser && !canAccessPath(sessionUser.role, pathname)) {
    const redirect = NextResponse.redirect(new URL(getRoleHomePath(sessionUser.role), request.url));
    copyCookies(response, redirect);
    return redirect;
  }

  return response;
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.png$).*)"],
};
