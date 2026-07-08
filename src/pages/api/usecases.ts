export const prerender = false;

import type { APIRoute } from 'astro';
import { readData, writeData } from '../../lib/storage';
import { applyOp, OpError } from '../../lib/ops';
import type { TrackerOp } from '../../types';

export const GET: APIRoute = async () => {
  const data = await readData();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// Applies a single, targeted operation against the freshest stored data
// (read right before write) rather than accepting a full TrackerData
// snapshot from the client. This keeps two admins editing concurrently from
// clobbering each other's changes, since a stale client can only ever
// describe "add/update/delete this one thing," never overwrite the world.
export const POST: APIRoute = async ({ request }) => {
  const adminSecret = import.meta.env.ADMIN_SECRET;
  if (!adminSecret) {
    return new Response('ADMIN_SECRET not configured', { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let op: TrackerOp;
  try {
    op = (await request.json()) as TrackerOp;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!op || typeof op !== 'object' || typeof (op as any).type !== 'string') {
    return new Response('Expected an operation object with a "type" field', { status: 400 });
  }

  try {
    const current = await readData();
    const next = applyOp(current, op);
    await writeData(next);
    return new Response(JSON.stringify(next), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    if (e instanceof OpError) {
      return new Response(e.message, { status: e.status });
    }
    console.error('[api/usecases] apply op failed:', e);
    return new Response('Failed to apply update', { status: 500 });
  }
};
