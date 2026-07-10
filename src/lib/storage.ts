import './nodeWebSocket'; // must load before createClient() runs (Node < 22 WebSocket shim)
import type {
  TrackerData, Tracker, Category, TrackerType, TrackerConfig,
  UseCase, Integration, AutomationProcess,
} from '../types';
import { createServerClient, isSupabaseConfigured } from './supabase';

// Row shapes as stored in Supabase.
interface TrackerRow {
  id: string; slug: string; title: string; description: string | null;
  type: string; config: TrackerConfig | null; position: number;
}
interface CategoryRow {
  id: string; tracker_id: string; slug: string; label: string;
  icon: string | null; position: number;
}
interface ItemRow {
  id: string; tracker_id: string; category_id: string | null;
  slug: string; title: string; summary: string | null;
  position: number; data: Record<string, any>;
}

const asType = (t: string): TrackerType =>
  t === 'integrations' || t === 'automation' ? t : 'usecases';

function toUseCase(row: ItemRow): UseCase {
  const d = row.data ?? {};
  return {
    id: row.slug,
    title: row.title,
    category: d.category ?? 'Resident Care',
    summary: row.summary ?? '',
    description: d.description ?? '',
    businessValue: d.businessValue ?? [],
    techStack: d.techStack ?? [],
    limitations: d.limitations ?? [],
    complianceFlags: d.complianceFlags ?? [],
    subCases: d.subCases,
    owner: d.owner,
    lastUpdated: d.lastUpdated,
  };
}

function toIntegration(row: ItemRow): Integration {
  const d = row.data ?? {};
  return {
    id: row.slug,
    categoryId: row.category_id,
    title: row.title,
    summary: row.summary ?? '',
    tag: d.tag,
    url: d.url,
  };
}

function toProcess(row: ItemRow): AutomationProcess {
  const d = row.data ?? {};
  return {
    id: row.slug,
    categoryId: row.category_id,
    title: row.title,
    summary: row.summary ?? '',
    description: d.description ?? '',
    businessValue: d.businessValue ?? [],
    techStack: d.techStack ?? [],
    steps: d.steps ?? [],
  };
}

export async function readData(): Promise<TrackerData> {
  if (!isSupabaseConfigured()) return { trackers: [] };

  const supabase = createServerClient();
  const [tRes, cRes, iRes] = await Promise.all([
    supabase.from('trackers').select('*').order('position'),
    supabase.from('categories').select('*').order('position'),
    supabase.from('items').select('*').order('position'),
  ]);

  if (tRes.error || cRes.error || iRes.error) {
    console.error('[storage] Supabase read error:',
      tRes.error ?? cRes.error ?? iRes.error);
    return { trackers: [] };
  }

  const trackerRows = (tRes.data ?? []) as TrackerRow[];
  const catRows = (cRes.data ?? []) as CategoryRow[];
  const itemRows = (iRes.data ?? []) as ItemRow[];

  const trackers: Tracker[] = trackerRows.map(tr => {
    const type = asType(tr.type);
    const categories: Category[] = catRows
      .filter(c => c.tracker_id === tr.id)
      .map(c => ({ id: c.id, slug: c.slug, label: c.label, icon: c.icon ?? undefined, position: c.position }));
    const rows = itemRows.filter(i => i.tracker_id === tr.id);

    return {
      id: tr.slug,
      slug: tr.slug,
      title: tr.title,
      description: tr.description ?? undefined,
      type,
      config: tr.config ?? {},
      categories,
      usecases: type === 'usecases' ? rows.map(toUseCase) : [],
      integrations: type === 'integrations' ? rows.map(toIntegration) : [],
      processes: type === 'automation' ? rows.map(toProcess) : [],
    };
  });

  return { trackers };
}
