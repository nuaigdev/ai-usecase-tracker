# Supabase setup

The tracker stores all data in Supabase (Postgres). Public pages read with the
**anon** key (gated by Row Level Security); the admin panel writes with the
logged-in user's JWT; a one-off migration script and the user-admin API route use
the **service-role** key server-side only.

## One-time setup

1. **Create a project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Run the schema.** Open Dashboard → SQL Editor → New query, paste all of
   [`schema.sql`](./schema.sql), and run it. This creates the `trackers`,
   `categories`, `items`, and `profiles` tables, the RLS policies, and the
   `is_admin()` / `editor_tracker()` helpers. It is safe to re-run.

3. **Enable email auth.** Dashboard → Authentication → Providers → Email → enable.
   Under Authentication → Sign In / Providers, turn **off** "Allow new users to
   sign up" so only the admin can create editor accounts.

4. **Grab your keys.** Dashboard → Project Settings → API:
   - Project URL → `PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (**server-only, keep secret**)

   Put these in `.env.local` (local dev) and in the Vercel project's Environment
   Variables (production).

5. **Create the admin user.** Dashboard → Authentication → Users → Add user
   (email + password, e.g. `admin@nuaig.ai`). Then promote it in SQL Editor:

   ```sql
   insert into profiles (id, role, email)
   select id, 'admin', email from auth.users where email = 'admin@nuaig.ai'
   on conflict (id) do update set role = 'admin';
   ```

6. **Migrate the existing data.** With `SUPABASE_SERVICE_ROLE_KEY`,
   `PUBLIC_SUPABASE_URL`, and the old `BLOB_READ_WRITE_TOKEN` all present in
   `.env.local`, run:

   ```bash
   npm run migrate
   ```

   This copies every tracker + use case out of Vercel Blob and seeds the
   redesigned Integrations tracker (7 categories / 19 platforms). It is
   idempotent — re-running skips trackers whose slug already exists.

## Migrations

One-off changes that came after the initial schema live in [`migrations/`](./migrations).
Apply one by pasting it into Dashboard → SQL Editor → New query. (Operators with a
direct `SUPABASE_DB_URL` can instead pipe the file through psql; the `scripts/`
folder is local-only tooling and is not committed.) Every migration is idempotent
and safe to re-run.

- **`0001_business_intelligence.sql`** — adds the Business Intelligence tracker
  (`type = 'bi'`) and the public **`dashboards`** storage bucket its screenshots
  live in. No table changes were needed: `trackers.type` has no CHECK constraint
  and the BI payload (`description`, `kpis[]`, `screenshots[]`) fits in the
  existing `items.data` jsonb column. Reads on the bucket are public (the images
  are embedded in a public page); writes require a signed-in user, and the admin
  panel uploads straight from the browser so large PNGs never hit a serverless
  function's request-body limit.

## Roles

- **admin** — `profiles.role = 'admin'`, `tracker_id` null. Manages every tracker,
  creates editor accounts (Admin → Users tab).
- **editor** — `profiles.role = 'editor'`, `tracker_id` set to the one tracker they
  manage. RLS blocks them from touching any other tracker.

Creating an editor from the Admin → Users tab calls `/api/admin/users`, which uses
the service-role key to create the auth user and insert its `profiles` row. If you
prefer, you can do the same manually: add the user under Auth → Users, then
`insert into profiles (id, role, tracker_id, email) values (...)`.
