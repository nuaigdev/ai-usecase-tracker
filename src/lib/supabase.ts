import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Public client — anon key, safe in the browser (every table is gated by RLS).
// Used server-side in .astro pages for public reads, and in the admin island for
// auth + writes (writes run as the logged-in user, enforced by RLS).
//
// This module is imported by client-side code, so it must ONLY ever reference
// PUBLIC_* env vars. The service-role key lives in ./supabaseAdmin.ts, which is
// imported exclusively from server-only routes.

const url = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey && !url.includes('YOUR-PROJECT'));
}

let browserClient: SupabaseClient | null = null;

// Singleton client for the browser (persists the auth session in localStorage).
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured — set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.');
  }
  if (browserClient) return browserClient;
  browserClient = createClient(url, anonKey);
  return browserClient;
}

// Fresh client for server-side reads (no session persistence needed).
export function createServerClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured — set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.');
  }
  return createClient(url, anonKey, { auth: { persistSession: false } });
}
