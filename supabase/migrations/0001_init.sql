-- ASU Creative Strategy Scheduling
-- Apply in the Supabase SQL editor or via the CLI (`supabase db push`).

create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('student', 'supervisor', 'administrator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('active', 'inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type work_mode as enum ('OFFICE', 'REMOTE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type exception_type as enum (
    'UNAVAILABLE',
    'REMOTE_INSTEAD',
    'OFFICE_INSTEAD',
    'ALTERNATE_AVAILABILITY'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type exception_status as enum ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type team_status as enum ('active', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  role user_role not null default 'student',
  status user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status team_status not null default 'active',
  supervisor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  membership_role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, team_id)
);

create table if not exists public.recurring_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  work_mode work_mode not null,
  effective_from date,
  effective_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exception_date date not null,
  start_time time not null,
  end_time time not null,
  exception_type exception_type not null,
  replacement_mode work_mode,
  reason text,
  status exception_status not null default 'PENDING',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.application_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_role_status on public.profiles (role, status);
create index if not exists idx_memberships_team on public.team_memberships (team_id);
create index if not exists idx_memberships_user on public.team_memberships (user_id);
create index if not exists idx_availability_user_day on public.recurring_availability (user_id, day_of_week);
create index if not exists idx_exceptions_user_date on public.schedule_exceptions (user_id, exception_date);
create index if not exists idx_exceptions_status on public.schedule_exceptions (status);
create index if not exists idx_audit_created on public.audit_logs (created_at desc);
create index if not exists idx_audit_actor on public.audit_logs (actor_user_id);

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.recurring_availability enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.application_settings enable row level security;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_role()
returns user_role
language sql
stable
as $$
  select role from public.profiles where auth_user_id = auth.uid() limit 1
$$;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (
    auth_user_id = auth.uid()
    or public.current_role() in ('supervisor', 'administrator')
  );

drop policy if exists availability_own_rw on public.recurring_availability;
create policy availability_own_rw on public.recurring_availability
  for all using (
    user_id = public.current_profile_id()
    or public.current_role() = 'administrator'
  )
  with check (
    user_id = public.current_profile_id()
    or public.current_role() = 'administrator'
  );

drop policy if exists exceptions_own on public.schedule_exceptions;
create policy exceptions_own on public.schedule_exceptions
  for select using (
    user_id = public.current_profile_id()
    or public.current_role() in ('supervisor', 'administrator')
  );

drop policy if exists exceptions_student_write on public.schedule_exceptions;
create policy exceptions_student_write on public.schedule_exceptions
  for insert with check (user_id = public.current_profile_id());

drop policy if exists exceptions_review on public.schedule_exceptions;
create policy exceptions_review on public.schedule_exceptions
  for update using (public.current_role() in ('supervisor', 'administrator'));

drop policy if exists teams_read on public.teams;
create policy teams_read on public.teams
  for select using (auth.uid() is not null);

drop policy if exists teams_admin_write on public.teams;
create policy teams_admin_write on public.teams
  for all using (public.current_role() = 'administrator')
  with check (public.current_role() = 'administrator');

drop policy if exists memberships_read on public.team_memberships;
create policy memberships_read on public.team_memberships
  for select using (auth.uid() is not null);

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs
  for select using (public.current_role() = 'administrator');

drop policy if exists settings_admin on public.application_settings;
create policy settings_admin on public.application_settings
  for all using (public.current_role() = 'administrator')
  with check (public.current_role() = 'administrator');

insert into public.application_settings (key, value)
values (
  'app',
  '{
    "workingDayStart": "08:00",
    "workingDayEnd": "18:00",
    "schedulingIntervalMinutes": 30,
    "timezone": "America/Phoenix",
    "coverageThresholdOffice": 2,
    "coverageThresholdRemote": 1,
    "coverageThresholdTotal": 3,
    "exceptionApprovalRequired": true
  }'::jsonb
)
on conflict (key) do nothing;
