-- ============================================================================
-- Business Intelligence tracker (type 'bi')
--
-- Run once, either with `npm run db:schema`-style tooling or by pasting this
-- whole file into Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run: every statement is idempotent and none of them overwrite
-- content that an admin may have edited since.
--
-- No table changes are needed:
--   • trackers.type has no CHECK constraint, so 'bi' is accepted as-is.
--   • items.data is jsonb, so the BI payload
--     { description, kpis[], screenshots[] } needs no new columns.
-- What this file DOES add is the storage bucket the dashboard screenshots live
-- in, plus the tracker row itself.
-- ============================================================================

-- ── Screenshot storage ──────────────────────────────────────────────────────
-- Public bucket: the images are embedded in a public page, so reads are open.
-- Writes are restricted to signed-in users (admins + editors) — uploads go
-- straight from the admin panel to storage with the user's JWT, which keeps the
-- large PNGs off the serverless function request path.

insert into storage.buckets (id, name, public)
values ('dashboards', 'dashboards', true)
on conflict (id) do update set public = true;

drop policy if exists dashboards_public_read on storage.objects;
create policy dashboards_public_read on storage.objects
  for select using (bucket_id = 'dashboards');

drop policy if exists dashboards_auth_insert on storage.objects;
create policy dashboards_auth_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'dashboards');

drop policy if exists dashboards_auth_update on storage.objects;
create policy dashboards_auth_update on storage.objects
  for update to authenticated
  using (bucket_id = 'dashboards') with check (bucket_id = 'dashboards');

drop policy if exists dashboards_auth_delete on storage.objects;
create policy dashboards_auth_delete on storage.objects
  for delete to authenticated using (bucket_id = 'dashboards');

-- ── The tracker row ─────────────────────────────────────────────────────────
-- Created empty on purpose: no dashboards seeded. Categories are added from
-- Manage → Content → Categories.
-- `do nothing` (not `do update`) so re-running never clobbers later edits.

insert into trackers (slug, title, description, type, config, position)
values (
  'business-intelligence',
  'Business Intelligence',
  'Dashboards and reporting we have built across the business — the KPIs each one tracks and what they look like in production.',
  'bi',
  '{}'::jsonb,
  coalesce((select max(position) from trackers), 0) + 1
)
on conflict (slug) do nothing;
