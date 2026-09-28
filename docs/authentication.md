# Authentication

This application uses a cookie session plus server-side RBAC. It does **not** implement ASU SSO.

## Current modes

### Development / demo

Set `ENABLE_DEMO_AUTH=true` (default outside production). Seeded accounts sign in with email and password. Roles are re-read from the profile store on every request.

The role switcher is available only when demo auth is enabled **and** either the app is in development or `NEXT_PUBLIC_ENABLE_ROLE_SWITCHER=true`.

### Production

Set:

```
ENABLE_DEMO_AUTH=false
NEXT_PUBLIC_ENABLE_DEMO_AUTH=false
NEXT_PUBLIC_ENABLE_ROLE_SWITCHER=false
NEXT_PUBLIC_DEMO_MODE=false
```

Demo login and role switching must stay off.

Production persistence requires applying `supabase/migrations` and providing:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)

Until those credentials exist, the application continues to use the seed-backed store for local/demo operation. That store is process memory, not a hosted database.

## Future ASU identity provider

Do not invent ASU OAuth URLs or ASURITE endpoints.

A real campus identity provider should be added later by:

1. Completing an institutional IdP registration with ASU UTO / identity services.
2. Mapping the authenticated subject to `profiles.auth_user_id`.
3. Replacing demo cookie login with that provider’s session while keeping `src/lib/auth/rbac.ts` unchanged.

Required configuration will depend on the chosen protocol (typically SAML or OIDC through the university IdP). Those values cannot be guessed from this repository.
