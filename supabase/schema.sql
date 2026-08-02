-- ============================================================================
-- CareConnect Supabase Schema (data layer only — auth stays on Firebase)
-- Run this in the Supabase Dashboard → SQL Editor → paste → Run.
-- ============================================================================

create extension if not exists pgcrypto;

-- --- updated_at helper -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- --- profiles (keyed by Firebase UID) ---------------------------------------
create table if not exists public.profiles (
  user_uid     text primary key,
  email        text,
  name         text,
  role         text check (role in ('parent','caregiver','admin')),
  child_name   text,
  parent_email text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- --- families (one row per derived link key) --------------------------------
create table if not exists public.families (
  link_key     text primary key,
  parent_uid   text,
  child_name   text,
  parent_email text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_families_updated before update on public.families
  for each row execute function public.set_updated_at();

-- --- family_members (who belongs to which family) ---------------------------
create table if not exists public.family_members (
  id        uuid primary key default gen_random_uuid(),
  link_key  text not null references public.families(link_key) on delete cascade,
  user_uid  text not null references public.profiles(user_uid) on delete cascade,
  role      text check (role in ('parent','caregiver')),
  joined_at timestamptz not null default now(),
  unique (link_key, user_uid)
);

-- --- activity_logs -----------------------------------------------------------
create table if not exists public.activity_logs (
  id              uuid primary key default gen_random_uuid(),
  link_key        text not null references public.families(link_key) on delete cascade,
  child_id        text,
  caregiver_id    text,
  caregiver_email text,
  activity_type   text,
  details         jsonb not null default '{}'::jsonb,
  location        jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists idx_activity_logs_link_time on public.activity_logs (link_key, created_at desc);

-- --- sos_alerts --------------------------------------------------------------
create table if not exists public.sos_alerts (
  id           uuid primary key default gen_random_uuid(),
  link_key     text not null references public.families(link_key) on delete cascade,
  child_id     text,
  caregiver_id text,
  location     jsonb,
  status       text not null default 'active',
  created_at   timestamptz not null default now()
);
create index if not exists idx_sos_alerts_link on public.sos_alerts (link_key, created_at desc);

-- --- child_events ------------------------------------------------------------
create table if not exists public.child_events (
  id         uuid primary key default gen_random_uuid(),
  link_key   text not null references public.families(link_key) on delete cascade,
  child_id   text,
  title      text,
  type       text,
  date       timestamptz,
  notes      text,
  created_at timestamptz not null default now()
);
create index if not exists idx_child_events_link on public.child_events (link_key, date);

-- --- caregiver_locations (one row per caregiver; upserted) -------------------
create table if not exists public.caregiver_locations (
  caregiver_id text primary key,
  link_key     text,
  lat          double precision,
  lng          double precision,
  updated_at   timestamptz not null default now()
);

-- --- emergency_contacts ------------------------------------------------------
create table if not exists public.emergency_contacts (
  id           uuid primary key default gen_random_uuid(),
  link_key     text not null references public.families(link_key) on delete cascade,
  child_id     text,
  name         text,
  relationship text,
  phone        text,
  is_primary   boolean not null default false,
  created_at   timestamptz not null default now()
);

-- --- notifications -----------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  link_key   text not null references public.families(link_key) on delete cascade,
  type       text,
  title      text,
  body       text,
  read       boolean not null default false,
  priority   text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- Auth stays on Firebase, so the app sends the Firebase UID in the
-- "x-firebase-uid" request header (see src/supabase.js). Policies resolve the
-- caller from that header instead of supabase auth.
-- ============================================================================

create or replace function public.current_firebase_uid()
returns text language sql stable as $$
  select nullif(current_setting('request.headers', true)::json->>'x-firebase-uid', '');
$$;

create or replace function public.is_family_member(lk text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.family_members fm
    where fm.link_key = lk
      and fm.user_uid = public.current_firebase_uid()
  );
$$;

alter table public.profiles            enable row level security;
alter table public.families            enable row level security;
alter table public.family_members      enable row level security;
alter table public.activity_logs       enable row level security;
alter table public.sos_alerts          enable row level security;
alter table public.child_events        enable row level security;
alter table public.caregiver_locations enable row level security;
alter table public.emergency_contacts  enable row level security;
alter table public.notifications       enable row level security;

-- profiles: own row only
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles for select
  using (user_uid = public.current_firebase_uid());
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert
  with check (user_uid = public.current_firebase_uid());
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using (user_uid = public.current_firebase_uid())
  with check (user_uid = public.current_firebase_uid());

-- families: visible to members; anyone signed in can create/join
drop policy if exists "families select member" on public.families;
create policy "families select member" on public.families for select
  using (public.is_family_member(link_key));
drop policy if exists "families insert member" on public.families;
create policy "families insert member" on public.families for insert
  with check (public.current_firebase_uid() is not null);
drop policy if exists "families update member" on public.families;
create policy "families update member" on public.families for update
  using (public.is_family_member(link_key))
  with check (public.current_firebase_uid() is not null);

-- family_members: see own family, join as yourself, leave as yourself
drop policy if exists "members select own family" on public.family_members;
create policy "members select own family" on public.family_members for select
  using (public.is_family_member(link_key));
drop policy if exists "members insert self" on public.family_members;
create policy "members insert self" on public.family_members for insert
  with check (user_uid = public.current_firebase_uid());
drop policy if exists "members delete self" on public.family_members;
create policy "members delete self" on public.family_members for delete
  using (user_uid = public.current_firebase_uid());

-- link-keyed tables: members of the family can read/write/delete
do $$
declare t text;
begin
  foreach t in array array['activity_logs','sos_alerts','child_events','emergency_contacts','notifications'] loop
    execute format('drop policy if exists "lk select" on public.%I', t);
    execute format('create policy "lk select" on public.%I for select using (public.is_family_member(link_key))', t);
    execute format('drop policy if exists "lk insert" on public.%I', t);
    execute format('create policy "lk insert" on public.%I for insert with check (public.is_family_member(link_key))', t);
    execute format('drop policy if exists "lk delete" on public.%I', t);
    execute format('create policy "lk delete" on public.%I for delete using (public.is_family_member(link_key))', t);
  end loop;
end $$;

-- caregiver_locations: members can read; each caregiver upserts their own row
drop policy if exists "loc select member" on public.caregiver_locations;
create policy "loc select member" on public.caregiver_locations for select
  using (public.is_family_member(link_key) or caregiver_id = public.current_firebase_uid());
drop policy if exists "loc insert own" on public.caregiver_locations;
create policy "loc insert own" on public.caregiver_locations for insert
  with check (caregiver_id = public.current_firebase_uid());
drop policy if exists "loc update own" on public.caregiver_locations;
create policy "loc update own" on public.caregiver_locations for update
  using (caregiver_id = public.current_firebase_uid())
  with check (caregiver_id = public.current_firebase_uid());
