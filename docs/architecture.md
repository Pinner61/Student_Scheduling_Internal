# Architecture

## System overview

The application is a Next.js App Router product with three role-specific surfaces:

- Students manage recurring availability and temporary exceptions.
- Supervisors inspect team coverage and review exceptions.
- Administrators manage users, teams, settings, and audit history.

Business rules live in `src/lib/schedule/engine.ts` and `src/lib/services/data-service.ts`. Pages fetch data through the service layer; they do not reimplement schedule math.

## Domain model

- **Profile**: identity, role, status (soft-deactivated users remain in history).
- **Team** and **team membership**: database-driven teams; a user may later belong to more than one team.
- **Recurring availability**: weekday + start/end + office/remote. Unavailability is the absence of a block, not a stored UNAVAILABLE row.
- **Schedule exception**: a dated overlay with pending/approved/declined/cancelled status.
- **Audit log**: actor, action, entity, timestamp, limited metadata.
- **Application settings**: working hours, interval, timezone, coverage thresholds.

## Authentication model

Development and demo builds use email + password against seeded accounts and an httpOnly session cookie. Roles are always re-read from the profile store/database; the client cannot grant itself a role.

Production is designed for **Supabase Auth**. ASU SSO can sit in front later by mapping an IdP identity to `profiles.auth_user_id` without changing RBAC.

The demo role switcher is available only in development unless explicitly enabled.

## Authorization model

Permissions are declared per role in `src/lib/auth/rbac.ts`. Server actions and the data service call `requirePermission`. Middleware blocks routes the current role cannot access, so unauthorized destinations are not shown as dead ends.

Row Level Security policies in `supabase/migrations/0001_init.sql` encode the same intent for PostgreSQL.

## Schedule calculation model

For a given date:

1. Select recurring blocks whose `day_of_week` matches the date (Monday = 1).
2. Merge adjacent same-mode blocks.
3. Apply **approved** exceptions for that date in start-time order.
4. Unavailable exceptions subtract time (splitting remaining fragments).
5. Remote/office-instead exceptions replace mode only on overlapping scheduled time.
6. Alternate availability subtracts the window and inserts a replacement block.

All student, supervisor, and admin views call this engine.

## Auditing

Mutations write an audit row. Administrators can filter by actor, action, entity type, and date. Metadata stores before/after role, team ids, and counts—not passwords.

## Security assumptions

- Secrets stay in environment variables; the service role key is never imported by client components.
- Demo credentials are fictional and documented.
- Destructive actions require an explicit confirmation dialog. Opening a three-dot menu never changes user status.
- Time is interpreted in `America/Phoenix` for business dates, not the browser timezone.
- The demo store is process-local and resets on server restart. It is not a production database.
