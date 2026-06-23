import type { APIRoute } from 'astro';
import { readUseCases, writeUseCases } from '../../lib/storage';

export const GET: APIRoute = async () => {
  const data = await readUseCases();
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

  if (!Array.isArray(body)) {
    return new Response('Expected an array', { status: 400 });
  }

  await writeUseCases(body as any);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
