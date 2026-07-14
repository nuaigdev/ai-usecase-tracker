export const prerender = false;

import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

// Verifies the caller's Supabase access token belongs to an admin.
// Returns the admin client on success, or a Response to short-circuit with.
// The `ok` discriminant is what lets the callers narrow this to a plain
// Response — an `'error' in gate` check leaves the result `Response | undefined`
// and breaks the APIRoute contract.
type Gate =
  | { ok: true; admin: ReturnType<typeof supabaseAdmin> }
  | { ok: false; response: Response };

async function requireAdmin(request: Request): Promise<Gate> {
  const auth = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return { ok: false, response: new Response('Missing bearer token', { status: 401 }) };

  const admin = supabaseAdmin();
  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) return { ok: false, response: new Response('Invalid session', { status: 401 }) };

  const { data: profile } = await admin
    .from('profiles').select('role').eq('id', userData.user.id).single();
  if (profile?.role !== 'admin') return { ok: false, response: new Response('Admins only', { status: 403 }) };

  return { ok: true, admin };
}

// Create an editor account and assign it to a tracker.
export const POST: APIRoute = async ({ request }) => {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;
  const { admin } = gate;

  let body: { email?: string; password?: string; trackerId?: string };
  try { body = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }

  const email = body.email?.trim();
  const password = body.password;
  const trackerId = body.trackerId || null;
  if (!email || !password || password.length < 6) {
    return new Response('Email and a password of at least 6 characters are required.', { status: 400 });
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
  });
  if (createErr || !created.user) {
    return new Response(createErr?.message ?? 'Could not create user', { status: 400 });
  }

  const { error: profileErr } = await admin.from('profiles').insert({
    id: created.user.id, role: 'editor', tracker_id: trackerId, email,
  });
  if (profileErr) {
    // Roll back the orphaned auth user so a retry with the same email works.
    await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
    return new Response(profileErr.message, { status: 400 });
  }

  return new Response(JSON.stringify({ id: created.user.id, email, trackerId }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// Remove an editor account (auth user + profile via cascade).
export const DELETE: APIRoute = async ({ request }) => {
  const gate = await requireAdmin(request);
  if (!gate.ok) return gate.response;
  const { admin } = gate;

  let body: { userId?: string };
  try { body = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (!body.userId) return new Response('userId is required', { status: 400 });

  const { error } = await admin.auth.admin.deleteUser(body.userId);
  if (error) return new Response(error.message, { status: 400 });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};
