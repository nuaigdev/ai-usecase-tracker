-- ============================================================================
-- Automation workflow images
--
-- Run once, either with `node --env-file=.env.local scripts/apply-sql.mjs …`
-- or by pasting this whole file into Supabase Dashboard → SQL Editor.
-- Safe to re-run: every statement is idempotent.
--
-- No table changes are needed: an automation process stores its single
-- workflow image as a `workflowImage` URL string inside the existing
-- items.data jsonb column. This file only adds the storage bucket the image
-- lives in — nothing here touches existing rows or their data.
-- ============================================================================

-- ── Workflow image storage ──────────────────────────────────────────────────
-- Public bucket (the image is embedded in a public page), same access shape as
-- the 'dashboards' bucket: anyone may read, only signed-in users may write.
-- Uploads go straight from the admin panel to storage with the user's JWT,
-- keeping large images off the serverless function request path.

insert into storage.buckets (id, name, public)
values ('workflows', 'workflows', true)
on conflict (id) do update set public = true;

drop policy if exists workflows_public_read on storage.objects;
create policy workflows_public_read on storage.objects
  for select using (bucket_id = 'workflows');

drop policy if exists workflows_auth_insert on storage.objects;
create policy workflows_auth_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'workflows');

drop policy if exists workflows_auth_update on storage.objects;
create policy workflows_auth_update on storage.objects
  for update to authenticated
  using (bucket_id = 'workflows') with check (bucket_id = 'workflows');

drop policy if exists workflows_auth_delete on storage.objects;
create policy workflows_auth_delete on storage.objects
  for delete to authenticated using (bucket_id = 'workflows');
