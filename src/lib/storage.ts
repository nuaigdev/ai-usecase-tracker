import type { UseCase } from '../data/usecases';
import { usecases as seedData } from '../data/usecases';

const BLOB_PATHNAME = 'usecases.json';

// In-memory fallback when Blob is not configured (local dev without setup)
let devMemory: UseCase[] | null = null;

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readUseCases(): Promise<UseCase[]> {
  if (!isBlobConfigured()) {
    return devMemory ?? seedData;
  }
  try {
    const { list } = await import('@vercel/blob');
    const { blobs } = await list({ prefix: BLOB_PATHNAME });
    if (blobs.length === 0) return seedData;

    // Private store: pass the token in the Authorization header
    const res = await fetch(blobs[0].url, {
      headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` },
      cache: 'no-store',
    });
    if (!res.ok) return seedData;
    const blobData = (await res.json()) as UseCase[];
    // Restore subCases from seed when a previous save stripped them
    const seedMap = new Map(seedData.map(u => [u.id, u]));
    return blobData.map(u => (!u.subCases && seedMap.get(u.id)?.subCases)
      ? { ...u, subCases: seedMap.get(u.id)!.subCases }
      : u
    );
  } catch (e) {
    console.error('[storage] Blob read error:', e);
    return seedData;
  }
}

export async function writeUseCases(data: UseCase[]): Promise<void> {
  if (!isBlobConfigured()) {
    devMemory = data;
    return;
  }
  const { put } = await import('@vercel/blob');
  // Use 'private' access to match the store's access configuration
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: 'private',
    allowOverwrite: true,
    contentType: 'application/json',
  });
}
