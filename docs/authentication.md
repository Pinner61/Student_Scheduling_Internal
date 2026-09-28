# Authentication

This application uses **Supabase Auth** for passwords and sessions, plus an application `profiles` table for roles and status. It does **not** implement ASU SSO.

Student employees may self-register with an `@asu.edu` email. Supervisors and administrators are **invite-only**. The browser cannot choose a privileged role.

## Current modes

### Development / demo

Set `ENABLE_DEMO_AUTH=true` when Supabase is not configured. Seeded accounts sign in with email and password. Roles are re-read from the profile store on every request.

The role switcher is available only when demo auth is enabled **and** either the app is in development or `NEXT_PUBLIC_ENABLE_ROLE_SWITCHER=true`.

Student registration still works locally by creating a profile in the demo store. Privileged users are invited; the admin UI shows a copyable activation link because email is not sent unless a provider is actually implemented.

### Production

Set:

```
NEXT_PUBLIC_DEMO_MODE=false
ENABLE_DEMO_AUTH=false
NEXT_PUBLIC_ENABLE_DEMO_AUTH=false
NEXT_PUBLIC_ENABLE_ROLE_SWITCHER=false
NEXT_PUBLIC_APP_URL=https://<your-render-host>
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Demo login and role switching must stay off.

Apply `supabase/migrations` (including `0004_auth_invitations.sql`) in the Supabase SQL editor or CLI.

## Supabase Auth URL configuration

In the Supabase dashboard → Authentication → URL configuration:

- Site URL: `https://<your-render-host>` (local: `http://localhost:3000`)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-render-host>/auth/callback`
  - `http://localhost:3000/reset-password`
  - `https://<your-render-host>/reset-password`

Enable email confirmation if you want students to verify before first sign-in. The app handles both confirmed and unconfirmed sign-up.

## First administrator

If the database has no administrator yet, set `BOOTSTRAP_ADMIN_EMAIL` to that person’s `@asu.edu` address. The first matching registration or activation is promoted server-side. After an administrator exists, additional admins must be invited.

Alternatively insert a `profiles` row with `role = 'administrator'` linked to `auth.users`.

## Future ASU identity provider

Do not invent ASU OAuth URLs or ASURITE endpoints.

A real campus identity provider should be added later by:

1. Completing an institutional IdP registration with ASU UTO / identity services.
2. Mapping the authenticated subject to `profiles.auth_user_id`.
3. Replacing password login with that provider’s session while keeping `src/lib/auth/rbac.ts` unchanged.
