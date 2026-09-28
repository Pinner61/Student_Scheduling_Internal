-- Authentication invitations and profile activation fields.
-- Forward-only. Reuses public.profiles rather than creating a second user table.

do $$ begin
  alter type user_status add value if not exists 'pending';
exception
  when duplicate_object then null;
end $$;

alter table public.profiles
  add column if not exists last_login_at timestamptz,
  add column if not exists invited_by uuid references public.profiles(id) on delete set null,
  add column if not exists activated_at timestamptz;

create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role user_role not null,
  team_id uuid references public.teams(id) on delete set null,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_invitations_open_email
  on public.invitations (email)
  where accepted_at is null and cancelled_at is null;

create index if not exists idx_invitations_profile on public.invitations (profile_id);
create index if not exists idx_invitations_expires on public.invitations (expires_at);

alter table public.invitations enable row level security;

drop policy if exists invitations_admin_all on public.invitations;
create policy invitations_admin_all on public.invitations
  for all using (public.current_role() = 'administrator')
  with check (public.current_role() = 'administrator');

comment on table public.invitations is
  'Invite-only activation for supervisor and administrator accounts. Tokens are stored hashed.';
