export const prerender = false;

import type { APIRoute } from 'astro';
import { readData, writeData } from '../../lib/storage';
import type { TrackerData } from '../../types';

export const GET: APIRoute = async () => {
  const data = await readData();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const adminSecret = import.meta.env.ADMIN_SECRET;
  if (!adminSecret) {
    return new Response('ADMIN_SECRET not configured', { status: 500 });
  }

  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${adminSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body || typeof body !== 'object' || !Array.isArray((body as any).trackers)) {
    return new Response('Expected { trackers: [] }', { status: 400 });
  }

  await writeData(body as TrackerData);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
