-- ============================================================================
-- NuAig Tracker — Supabase schema
-- Run this whole file in the Supabase SQL editor (Dashboard → SQL → New query).
-- It is safe to re-run: every object is guarded with "if exists / if not exists".
-- ============================================================================

create extension if not exists pgcrypto;

-- ── Tables ──────────────────────────────────────────────────────────────────

create table if not exists trackers (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  type        text not null default 'usecases',   -- 'usecases' | 'integrations' | 'automation'
  config      jsonb not null default '{}'::jsonb,  -- hero copy, stat strip, theme, icons
  position    int not null default 0,
  updated_at  timestamptz not null default now()
);

create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  tracker_id  uuid not null references trackers(id) on delete cascade,
  slug        text not null,
  label       text not null,
  icon        text,                                -- emoji
  position    int not null default 0,
  unique (tracker_id, slug)
);

create table if not exists items (
  id          uuid primary key default gen_random_uuid(),
  tracker_id  uuid not null references trackers(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  slug        text not null,
  title       text not null,
  summary     text,
  position    int not null default 0,
  data        jsonb not null default '{}'::jsonb,  -- type-specific payload (validated in TS)
  updated_at  timestamptz not null default now()
);

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'editor',      -- 'admin' | 'editor'
  tracker_id  uuid references trackers(id) on delete set null,
  email       text
);

create index if not exists items_tracker_idx     on items(tracker_id, position);
create index if not exists categories_tracker_idx on categories(tracker_id, position);

-- ── updated_at maintenance ──────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_trackers_updated on trackers;
create trigger trg_trackers_updated before update on trackers
  for each row execute function set_updated_at();

drop trigger if exists trg_items_updated on items;
create trigger trg_items_updated before update on items
  for each row execute function set_updated_at();

-- ── Auth helper functions ───────────────────────────────────────────────────
-- SECURITY DEFINER so the RLS policies below can read profiles without being
-- blocked by profiles' own RLS (avoids infinite policy recursion).

create or replace function public.is_admin()
  returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.editor_tracker()
  returns uuid language sql stable security definer set search_path = public as $$
  select tracker_id from profiles where id = auth.uid();
$$;

-- ── Row Level Security ──────────────────────────────────────────────────────

alter table trackers   enable row level security;
alter table categories enable row level security;
alter table items      enable row level security;
alter table profiles   enable row level security;

-- Public read of all content (no auth required)
drop policy if exists read_trackers   on trackers;
drop policy if exists read_categories on categories;
drop policy if exists read_items      on items;
create policy read_trackers   on trackers   for select using (true);
create policy read_categories on categories for select using (true);
create policy read_items      on items      for select using (true);

-- Writes: admin does anything; an editor only within their own tracker
drop policy if exists write_categories on categories;
create policy write_categories on categories for all
  using      (public.is_admin() or tracker_id = public.editor_tracker())
  with check (public.is_admin() or tracker_id = public.editor_tracker());

drop policy if exists write_items on items;
create policy write_items on items for all
  using      (public.is_admin() or tracker_id = public.editor_tracker())
  with check (public.is_admin() or tracker_id = public.editor_tracker());

-- Trackers: admin full CRUD; an editor may UPDATE only their own tracker row
drop policy if exists admin_trackers on trackers;
create policy admin_trackers on trackers for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists editor_update_tracker on trackers;
create policy editor_update_tracker on trackers for update
  using (id = public.editor_tracker()) with check (id = public.editor_tracker());

-- Profiles: a user reads their own row; admins read all; only admins write
drop policy if exists read_own_profile on profiles;
create policy read_own_profile on profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists admin_write_profiles on profiles;
create policy admin_write_profiles on profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Bootstrap the first admin (run AFTER creating the user in Auth → Users):
--
--   insert into profiles (id, role, email)
--   select id, 'admin', email from auth.users where email = 'coe@nuaig.ai'
--   on conflict (id) do update set role = 'admin';
--
-- Trackers + content are populated by `npm run migrate` (service-role script).
-- ============================================================================
