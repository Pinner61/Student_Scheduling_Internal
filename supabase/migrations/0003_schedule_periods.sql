-- Schedule periods, submissions, notifications, and period-scoped availability.
-- Forward-only. Existing demo/history rows are backfilled onto a default OPEN period.

do $$ begin
  create type schedule_period_status as enum ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type schedule_submission_status as enum ('DRAFT', 'SUBMITTED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('unread', 'read');
exception when duplicate_object then null; end $$;

create table if not exists public.schedule_periods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  status schedule_period_status not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create table if not exists public.schedule_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  schedule_period_id uuid not null references public.schedule_periods(id) on delete cascade,
  status schedule_submission_status not null default 'DRAFT',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, schedule_period_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  title text not null,
  body text not null,
  status notification_status not null default 'unread',
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.schedule_periods (id, name, start_date, end_date, status)
values (
  'a1e1c0de-0001-4000-8000-000000000001',
  'Fall 2026',
  '2026-08-17',
  '2026-12-18',
  'OPEN'
)
on conflict (id) do nothing;

insert into public.schedule_periods (id, name, start_date, end_date, status)
values (
  'a1e1c0de-0001-4000-8000-000000000002',
  'Spring 2027',
  '2027-01-11',
  '2027-05-07',
  'DRAFT'
)
on conflict (id) do nothing;

alter table public.recurring_availability
  add column if not exists schedule_period_id uuid references public.schedule_periods(id) on delete cascade;

update public.recurring_availability
set schedule_period_id = 'a1e1c0de-0001-4000-8000-000000000001'
where schedule_period_id is null;

alter table public.recurring_availability
  alter column schedule_period_id set not null;

alter table public.schedule_exceptions
  add column if not exists schedule_period_id uuid references public.schedule_periods(id) on delete cascade;

update public.schedule_exceptions
set schedule_period_id = 'a1e1c0de-0001-4000-8000-000000000001'
where schedule_period_id is null;

alter table public.schedule_exceptions
  alter column schedule_period_id set not null;

insert into public.schedule_submissions (user_id, schedule_period_id, status, submitted_at)
select p.id, 'a1e1c0de-0001-4000-8000-000000000001', 'SUBMITTED', now()
from public.profiles p
where p.role = 'student'
  and exists (
    select 1 from public.recurring_availability a
    where a.user_id = p.id
      and a.schedule_period_id = 'a1e1c0de-0001-4000-8000-000000000001'
  )
on conflict (user_id, schedule_period_id) do nothing;

create index if not exists idx_periods_status on public.schedule_periods (status);
create index if not exists idx_periods_dates on public.schedule_periods (start_date, end_date);
create index if not exists idx_submissions_period on public.schedule_submissions (schedule_period_id);
create index if not exists idx_submissions_user_status on public.schedule_submissions (user_id, status);
create index if not exists idx_availability_period_user
  on public.recurring_availability (schedule_period_id, user_id);
create index if not exists idx_exceptions_period_user
  on public.schedule_exceptions (schedule_period_id, user_id);
create index if not exists idx_exceptions_period_date
  on public.schedule_exceptions (schedule_period_id, exception_date);
create index if not exists idx_notifications_user_status
  on public.notifications (user_id, status, created_at desc);
create index if not exists idx_teams_supervisor on public.teams (supervisor_id);
create index if not exists idx_audit_entity on public.audit_logs (entity_type, entity_id);

alter table public.schedule_periods enable row level security;
alter table public.schedule_submissions enable row level security;
alter table public.notifications enable row level security;

drop policy if exists periods_read on public.schedule_periods;
create policy periods_read on public.schedule_periods
  for select using (true);

drop policy if exists periods_admin_write on public.schedule_periods;
create policy periods_admin_write on public.schedule_periods
  for all using (public.current_role() = 'administrator')
  with check (public.current_role() = 'administrator');

drop policy if exists submissions_self_read on public.schedule_submissions;
create policy submissions_self_read on public.schedule_submissions
  for select using (
    user_id = public.current_profile_id()
    or public.current_role() = 'administrator'
    or (
      public.current_role() = 'supervisor'
      and exists (
        select 1
        from public.team_memberships m
        join public.teams t on t.id = m.team_id
        where m.user_id = schedule_submissions.user_id
          and t.supervisor_id = public.current_profile_id()
      )
    )
  );

drop policy if exists submissions_self_write on public.schedule_submissions;
create policy submissions_self_write on public.schedule_submissions
  for all using (
    user_id = public.current_profile_id()
    or public.current_role() = 'administrator'
  )
  with check (
    user_id = public.current_profile_id()
    or public.current_role() = 'administrator'
  );

drop policy if exists notifications_self on public.notifications;
create policy notifications_self on public.notifications
  for select using (user_id = public.current_profile_id() or public.current_role() = 'administrator');

drop policy if exists notifications_self_update on public.notifications;
create policy notifications_self_update on public.notifications
  for update using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

comment on table public.schedule_periods is
  'Admin-defined scheduling windows. Names are data, not hardcoded ASU terms.';
comment on table public.schedule_submissions is
  'Explicit DRAFT/SUBMITTED lifecycle per student per period. No required weekly hours.';
comment on table public.notifications is
  'In-app notifications. Append-only except read-state updates.';
