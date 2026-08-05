-- ============================================================================
-- CareConnect Supabase Schema — auth + data (Firebase fully removed)
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

-- --- profiles (one row per Supabase auth user) ------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
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

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- --- families (one row per derived link key) --------------------------------
create table if not exists public.families (
  link_key     text primary key,
  parent_uid   uuid references auth.users(id) on delete set null,
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
  user_uid  uuid not null references auth.users(id) on delete cascade,
  role      text check (role in ('parent','caregiver')),
  joined_at timestamptz not null default now(),
  unique (link_key, user_uid)
);

-- --- activity_logs -----------------------------------------------------------
create table if not exists public.activity_logs (
  id              uuid primary key default gen_random_uuid(),
  link_key        text not null references public.families(link_key) on delete cascade,
  child_id        text,
  caregiver_id    uuid references auth.users(id) on delete set null,
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
  caregiver_id uuid references auth.users(id) on delete set null,
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
  caregiver_id uuid primary key references auth.users(id) on delete cascade,
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
-- Row Level Security — caller is the Supabase auth user (auth.uid()).
-- ============================================================================

create or replace function public.is_family_member(lk text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.family_members fm
    where fm.link_key = lk
      and fm.user_uid = auth.uid()
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
  using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert
  with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- families: visible to members; any signed-in user can create/join
drop policy if exists "families select member" on public.families;
create policy "families select member" on public.families for select
  using (public.is_family_member(link_key));
drop policy if exists "families insert member" on public.families;
create policy "families insert member" on public.families for insert
  with check (auth.uid() is not null);
drop policy if exists "families update member" on public.families;
create policy "families update member" on public.families for update
  using (public.is_family_member(link_key))
  with check (auth.uid() is not null);
-- families: deep-link lookup — any signed-in user may look up a family by
-- parent email so a caregiver can adopt the parent's canonical child_name
-- (and therefore the same link_key) before they are a member.
drop policy if exists "families select lookup" on public.families;
create policy "families select lookup" on public.families for select
  using (auth.uid() is not null);

-- family_members: see own family, join as yourself, leave as yourself
drop policy if exists "members select own family" on public.family_members;
create policy "members select own family" on public.family_members for select
  using (public.is_family_member(link_key));
drop policy if exists "members insert self" on public.family_members;
create policy "members insert self" on public.family_members for insert
  with check (user_uid = auth.uid());
drop policy if exists "members delete self" on public.family_members;
create policy "members delete self" on public.family_members for delete
  using (user_uid = auth.uid());

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

-- Realtime: ensure tables are in the supabase_realtime publication
do $$
begin
  perform add_table_to_publication('supabase_realtime', 'public.activity_logs');
  perform add_table_to_publication('supabase_realtime', 'public.sos_alerts');
  perform add_table_to_publication('supabase_realtime', 'public.child_events');
  perform add_table_to_publication('supabase_realtime', 'public.caregiver_locations');
  perform add_table_to_publication('supabase_realtime', 'public.emergency_contacts');
  perform add_table_to_publication('supabase_realtime', 'public.notifications');
exception when others then
  -- fallback for older PG versions / edge cases
  null;
end;
$$;

-- caregiver_locations: members can read; each caregiver upserts their own row
drop policy if exists "loc select member" on public.caregiver_locations;
create policy "loc select member" on public.caregiver_locations for select
  using (public.is_family_member(link_key) or caregiver_id = auth.uid());
drop policy if exists "loc insert own" on public.caregiver_locations;
create policy "loc insert own" on public.caregiver_locations for insert
  with check (caregiver_id = auth.uid());
drop policy if exists "loc update own" on public.caregiver_locations;
create policy "loc update own" on public.caregiver_locations for update
  using (caregiver_id = auth.uid())
  with check (caregiver_id = auth.uid());
