import type { UseCase, TrackerData } from '../types';

// The pathname used before versioning existed — kept only as a read
// fallback for the very first read after this change, before any write
// has happened yet.
const LEGACY_PATHNAME = 'usecases.json';

// Every save writes a brand-new pathname under this prefix instead of
// overwriting one fixed pathname. Vercel Blob serves content through a CDN,
// and overwriting a fixed pathname doesn't reliably invalidate every edge
// immediately — some edges kept serving pre-write content for a window
// after a save, so a plain page refresh could momentarily miss another
// admin's just-saved change. A brand-new pathname has never been cached
// anywhere, so there's nothing stale for any edge to serve.
const VERSION_PREFIX = 'usecases/v-';

let devMemory: TrackerData | null = null;

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function fetchBlobJson(url: string): Promise<unknown | null> {
  const bustUrl = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;
  const res = await fetch(bustUrl, {
    headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

function normalize(raw: unknown): TrackerData {
  // Migrate old flat UseCase[] format → TrackerData
  if (Array.isArray(raw)) {
    const usecases = raw.map(({ status, ...rest }: any) => rest) as UseCase[];
    return { trackers: [{ id: 'ai-usecases', title: 'AI Usecases', usecases }] };
  }
  return raw as TrackerData;
}

export async function readData(): Promise<TrackerData> {
  if (!isBlobConfigured()) {
    return devMemory ?? { trackers: [] };
  }
  try {
    const { list } = await import('@vercel/blob');

    const { blobs } = await list({ prefix: VERSION_PREFIX });
    if (blobs.length > 0) {
      const latest = blobs.reduce((a, b) => (a.uploadedAt > b.uploadedAt ? a : b));
      const raw = await fetchBlobJson(latest.url);
      if (raw !== null) return normalize(raw);
    }

    // No versioned snapshot yet — fall back to the legacy fixed pathname.
    const legacy = await list({ prefix: LEGACY_PATHNAME });
    if (legacy.blobs.length === 0) return { trackers: [] };
    const raw = await fetchBlobJson(legacy.blobs[0].url);
    return raw === null ? { trackers: [] } : normalize(raw);
  } catch (e) {
    console.error('[storage] Blob read error:', e);
    return { trackers: [] };
  }
}

export async function writeData(data: TrackerData): Promise<void> {
  if (!isBlobConfigured()) {
    devMemory = data;
    return;
  }
  const { put, list, del } = await import('@vercel/blob');
  const pathname = `${VERSION_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`;

  await put(pathname, JSON.stringify(data), {
    access: 'private',
    contentType: 'application/json',
  });

  // Best-effort cleanup of older versions (and the legacy pathname) so
  // storage doesn't grow unbounded. Never let a cleanup failure fail the
  // write itself — readData() always resolves to the newest upload anyway.
  try {
    const [{ blobs: versioned }, { blobs: legacy }] = await Promise.all([
      list({ prefix: VERSION_PREFIX }),
      list({ prefix: LEGACY_PATHNAME }),
    ]);
    const stale = [...versioned.filter(b => b.pathname !== pathname), ...legacy];
    if (stale.length > 0) {
      await del(stale.map(b => b.url));
    }
  } catch (e) {
    console.error('[storage] Blob cleanup error (non-fatal):', e);
  }
}
