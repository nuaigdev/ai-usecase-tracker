import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. SERVER ONLY. Never import this from a
// React island or any code that ships to the browser; it would leak the key.
// Used solely by /api/admin/* routes after verifying the caller is an admin.

export function supabaseAdmin(): SupabaseClient {
  const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY / PUBLIC_SUPABASE_URL are not configured.');
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
