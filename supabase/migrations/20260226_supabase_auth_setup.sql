-- ============================================================
-- Supabase Auth Setup: user_profiles, saved_quotes, shared_quotes
-- Feb 25, 2026
-- ============================================================

-- --------------------------------
-- 1. USER PROFILES
-- Mirrors key fields from auth.users for fast sync reads.
-- --------------------------------
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  first_name  text not null default '',
  last_name   text not null default '',
  company     text,
  job_title   text,
  tier        text not null default 'free'
              check (tier in ('free','starter','pro','advanced','business')),
  account_type text not null default 'individual'
              check (account_type in ('individual','company')),
  profile_completed boolean not null default false,
  bio         text,
  phone       text,
  linkedin    text,
  company_website text,
  public_profile_slug text unique,
  profile_visibility text default 'private'
              check (profile_visibility in ('public','private')),
  preferences jsonb default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Add columns that may be missing if the table already existed
alter table public.user_profiles add column if not exists job_title text;
alter table public.user_profiles add column if not exists bio text;
alter table public.user_profiles add column if not exists phone text;
alter table public.user_profiles add column if not exists linkedin text;
alter table public.user_profiles add column if not exists company_website text;
alter table public.user_profiles add column if not exists public_profile_slug text;
alter table public.user_profiles add column if not exists profile_visibility text default 'private';
alter table public.user_profiles add column if not exists preferences jsonb default '{}'::jsonb;
alter table public.user_profiles add column if not exists profile_completed boolean not null default false;

-- Add check constraint only if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_profile_visibility_check'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_profile_visibility_check
      check (profile_visibility in ('public','private'));
  end if;
end;
$$;

-- Add unique constraint on slug only if not already present
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_profiles_public_profile_slug_key'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint user_profiles_public_profile_slug_key unique (public_profile_slug);
  end if;
end;
$$;

alter table public.user_profiles enable row level security;

-- Users can read their own profile
drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = id);

-- Users can insert their own profile
drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Users can update their own profile
drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = id);

-- Public profiles are readable by anyone
drop policy if exists "user_profiles_select_public" on public.user_profiles;
create policy "user_profiles_select_public"
  on public.user_profiles for select
  using (profile_visibility = 'public');

-- Auto-update updated_at
create or replace function public.update_user_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.update_user_profiles_updated_at();

-- --------------------------------
-- 2. SAVED QUOTES
-- Server-side quote storage, replaces localStorage.
-- --------------------------------
create table if not exists public.saved_quotes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  project_name  text not null default 'Unnamed Project',
  use_case_slug text,
  storage_size_mw numeric,
  total_cost    numeric,
  quote_data    jsonb not null default '{}'::jsonb,
  tags          text,
  notes         text,
  is_favorite   boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.saved_quotes enable row level security;

drop policy if exists "saved_quotes_select_own" on public.saved_quotes;
create policy "saved_quotes_select_own"
  on public.saved_quotes for select
  using (auth.uid() = user_id);

drop policy if exists "saved_quotes_insert_own" on public.saved_quotes;
create policy "saved_quotes_insert_own"
  on public.saved_quotes for insert
  with check (auth.uid() = user_id);

drop policy if exists "saved_quotes_update_own" on public.saved_quotes;
create policy "saved_quotes_update_own"
  on public.saved_quotes for update
  using (auth.uid() = user_id);

drop policy if exists "saved_quotes_delete_own" on public.saved_quotes;
create policy "saved_quotes_delete_own"
  on public.saved_quotes for delete
  using (auth.uid() = user_id);

create or replace function public.update_saved_quotes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_saved_quotes_updated_at on public.saved_quotes;
create trigger trg_saved_quotes_updated_at
  before update on public.saved_quotes
  for each row execute function public.update_saved_quotes_updated_at();

-- --------------------------------
-- 3. SHARED QUOTES
-- Public share links (no auth required to read).
-- --------------------------------
create table if not exists public.shared_quotes (
  id            uuid primary key default gen_random_uuid(),
  short_code    text not null unique,
  quote_data    jsonb not null,
  created_by    uuid references auth.users(id) on delete set null,
  is_public     boolean not null default true,
  password_hash text,
  expires_at    timestamptz,
  view_count    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.shared_quotes enable row level security;

-- Anyone can read public, non-expired share links
drop policy if exists "shared_quotes_select_public" on public.shared_quotes;
create policy "shared_quotes_select_public"
  on public.shared_quotes for select
  using (is_public = true and (expires_at is null or expires_at > now()));

-- Authenticated users can insert
drop policy if exists "shared_quotes_insert_auth" on public.shared_quotes;
create policy "shared_quotes_insert_auth"
  on public.shared_quotes for insert
  with check (auth.uid() is not null);

-- Creator can update their own links
drop policy if exists "shared_quotes_update_own" on public.shared_quotes;
create policy "shared_quotes_update_own"
  on public.shared_quotes for update
  using (auth.uid() = created_by);
