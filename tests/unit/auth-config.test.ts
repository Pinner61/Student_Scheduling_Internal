import { describe, expect, it } from "vitest";
import { getAppUrl } from "@/lib/config/app-url";
import { isPublicPath } from "@/lib/auth/public-paths";
import { isDemoAuthEnabled } from "@/lib/config";

describe("app URL", () => {
  it("strips a trailing slash from NEXT_PUBLIC_APP_URL", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://example.onrender.com/";
    expect(getAppUrl()).toBe("https://example.onrender.com");
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previous;
  });
});

describe("public paths", () => {
  it("allows authentication routes without a session", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/register/student")).toBe(true);
    expect(isPublicPath("/invite/abc")).toBe(true);
    expect(isPublicPath("/auth/callback")).toBe(true);
    expect(isPublicPath("/forgot-password")).toBe(true);
    expect(isPublicPath("/admin/users")).toBe(false);
  });
});

describe("demo auth flags", () => {
  it("follows ENABLE_DEMO_AUTH and stays off when the flag is false", () => {
    const previousFlag = process.env.ENABLE_DEMO_AUTH;
    const previousPublic = process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH;

    process.env.ENABLE_DEMO_AUTH = "true";
    expect(isDemoAuthEnabled()).toBe(true);

    process.env.ENABLE_DEMO_AUTH = "false";
    expect(isDemoAuthEnabled()).toBe(false);

    if (previousFlag === undefined) delete process.env.ENABLE_DEMO_AUTH;
    else process.env.ENABLE_DEMO_AUTH = previousFlag;
    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH;
    else process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH = previousPublic;
  });
});
