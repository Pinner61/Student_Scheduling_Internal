export function isDemoMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isDemoAuthEnabled(): boolean {
  const flag = process.env.ENABLE_DEMO_AUTH ?? process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH;
  if (process.env.NODE_ENV === "production") {
    return flag === "true";
  }
  return flag !== "false";
}

export function isDevRoleSwitcherEnabled(): boolean {
  if (!isDemoAuthEnabled()) return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_ROLE_SWITCHER === "true"
  );
}

export function usesPersistentDatabase(): boolean {
  return !isDemoMode() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
