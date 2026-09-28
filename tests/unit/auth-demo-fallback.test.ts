import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  tryCreateSupabaseServerClient: vi.fn(),
}));

import { tryCreateSupabaseServerClient } from "@/lib/supabase/server";
import { resetDemoStore } from "@/lib/demo/store";
import { signInWithPassword } from "@/lib/auth/service";
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/auth/errors";

function mockRejectedSupabaseLogin() {
  vi.mocked(tryCreateSupabaseServerClient).mockResolvedValue({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Invalid login credentials" },
      }),
      signOut: vi.fn(),
    },
  } as never);
}

describe("hosted demo auth fallback", () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const originalDemoAuth = process.env.ENABLE_DEMO_AUTH;
  const originalPublicDemoAuth = process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH;

  beforeEach(() => {
    resetDemoStore();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.ENABLE_DEMO_AUTH = "true";
    mockRejectedSupabaseLogin();
  });

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    if (originalDemoAuth === undefined) delete process.env.ENABLE_DEMO_AUTH;
    else process.env.ENABLE_DEMO_AUTH = originalDemoAuth;
    if (originalPublicDemoAuth === undefined) delete process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH;
    else process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH = originalPublicDemoAuth;
    vi.clearAllMocks();
  });

  it("signs in seeded demo accounts when Supabase is configured but rejects the password", async () => {
    const student = await signInWithPassword("alex.chen@asu.edu", "Demo123!");
    expect(student.email).toBe("alex.chen@asu.edu");
    expect(student.role).toBe("student");

    const supervisor = await signInWithPassword("smitchell@asu.edu", "Demo123!");
    expect(supervisor.email).toBe("smitchell@asu.edu");
    expect(supervisor.role).toBe("supervisor");

    const admin = await signInWithPassword("preyes@asu.edu", "Demo123!");
    expect(admin.email).toBe("preyes@asu.edu");
    expect(admin.role).toBe("administrator");
  });

  it("does not use demo accounts when demo auth is disabled", async () => {
    process.env.ENABLE_DEMO_AUTH = "false";
    process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH = "false";
    await expect(signInWithPassword("alex.chen@asu.edu", "Demo123!")).rejects.toThrow(
      INVALID_CREDENTIALS_MESSAGE
    );
  });
});
