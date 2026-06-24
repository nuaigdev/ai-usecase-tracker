import type { UseCase, TrackerData } from '../types';

const BLOB_PATHNAME = 'usecases.json';

let devMemory: TrackerData | null = null;

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readData(): Promise<TrackerData> {
  if (!isBlobConfigured()) {
    return devMemory ?? { trackers: [] };
  }
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    if (blobs.length === 0) return { trackers: [] };

    const res = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return { trackers: [] };

    const raw = await res.json();

    // Migrate old flat UseCase[] format → TrackerData
    if (Array.isArray(raw)) {
      const usecases = raw.map(({ status, ...rest }: any) => rest) as UseCase[];
      return { trackers: [{ id: 'ai-usecases', title: 'AI Usecases', usecases }] };
    }

    return raw as TrackerData;
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
  const { put } = await import('@vercel/blob');
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
  });
}
