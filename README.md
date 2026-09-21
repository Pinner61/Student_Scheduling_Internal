# ASU Creative Strategy Scheduling

Internal student-employee scheduling and workforce visibility for Arizona State University University College’s Creative Strategy team.

This platform replaces a shared Excel workbook in which students typed `o` (office), `r` (remote), or left cells blank. The spreadsheet worked, but it was easy to overwrite formulas, edit the wrong tab, and impossible to trust as a real-time coverage view.

The product goal is narrow on purpose:

> Give students an easy way to say when and where they can work, and give supervisors and administrators a trustworthy view of team coverage.

It is an **internal prototype**, not an officially branded ASU production service.

## Architecture

- **Next.js (App Router) + TypeScript** for the UI and server actions
- **PostgreSQL / Supabase** as the production data and auth target
- **Demo in-memory store** when Supabase is not configured, so the app is usable immediately
- **Cookie session + server-side RBAC** for Student, Supervisor, and Administrator
- **Central schedule engine** (`src/lib/schedule/engine.ts`) that computes effective blocks by applying approved exceptions to recurring availability

See `docs/architecture.md` and `docs/product-requirements.md`.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open http://localhost:3000.

Demo mode is on by default (`NEXT_PUBLIC_DEMO_MODE=true` or missing Supabase URL).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_DEMO_MODE` | Force the in-memory demo store and email login |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged jobs; never ship to the client |
| `NEXT_PUBLIC_ENABLE_ROLE_SWITCHER` | Allow the demo role switcher outside `development` |

## Database setup

1. Create a Supabase project.
2. Run `supabase/migrations/0001_init.sql` in the SQL editor (or `supabase db push`).
3. Create Auth users that match profile emails, then set `profiles.auth_user_id`.
4. Set the environment variables above and disable demo mode.

Until that is done, the seeded demo store is the data layer. **It resets when the Next.js server restarts.**

## Demo accounts

Password for all seeded accounts: `Demo123!`

| Role | Email |
| --- | --- |
| Student | `alex.chen@asu.edu` |
| Supervisor | `smitchell@asu.edu` |
| Administrator | `preyes@asu.edu` |

Additional fictional students, supervisors, and an extra administrator are seeded automatically. In development, a role switcher appears in the header. It is disabled in production unless `NEXT_PUBLIC_ENABLE_ROLE_SWITCHER=true`.

## Testing

```bash
npm run lint
npm run typecheck
npm test
npx playwright install
npm run test:e2e
```

- Unit tests cover overlapping ranges, exception overrides, merging, and permissions.
- Integration tests cover save availability, submit/approve exception, deactivate user, and unauthorized rejection.
- Playwright covers student, supervisor, and administrator journeys, including the safe users three-dot menu.

## Deployment (Vercel + Supabase)

1. Push this repository to GitHub.
2. Import the project in Vercel (Next.js defaults).
3. Add the environment variables from `.env.example`. For a demo deploy, set `NEXT_PUBLIC_DEMO_MODE=true`.
4. For a live database, apply the SQL migration, then set the Supabase URL and anon key and leave demo mode off.
5. Do not add `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_` variable.

## Future work

- ASU SSO on top of the current auth boundary
- Persistent Supabase-backed data service (the domain API is already isolated)
- Email / Slack notification channels (`src/lib/notifications`)
- CSV import from the existing Excel workbook (`docs/migration.md`)
- Calendar export and multi-department tenancy

## License

Internal ASU University College prototype. Not for public redistribution as an official ASU product.
