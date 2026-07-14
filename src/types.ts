export type TrackerType = 'usecases' | 'integrations' | 'automation' | 'bi';

// ── Use-case content (items.data for type 'usecases') ────────────────────────

export interface SubCase {
  id: string;
  title: string;
  summary: string;
  description: string;
  businessValue: string[];
  techStack: string[];
}

export interface UseCase {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  businessValue: string[];
  techStack: string[];
  limitations: string[];
  complianceFlags: string[];
  subCases?: SubCase[];
  owner?: string;
  lastUpdated?: string;
}

// ── Integration content (items.data for type 'integrations') ─────────────────

export interface Integration {
  id: string;
  categoryId: string | null;
  title: string;   // platform name
  summary: string; // short blurb (card description)
  tag?: string;    // e.g. "EHR", "Accounting"
  url?: string;    // optional link to the platform
}

// ── Automation content (items.data for type 'automation') ────────────────────

export type AutomationStepKind = 'trigger' | 'action' | 'branch' | 'end';

export interface AutomationStep {
  id: string;
  title: string;
  desc?: string;
  kind: AutomationStepKind;
  next: string[]; // ids of downstream steps (supports simple branching)
}

export interface AutomationProcess {
  id: string;
  categoryId: string | null;
  title: string;
  summary: string;
  description: string;
  businessValue: string[];
  techStack: string[];
  steps: AutomationStep[];
}

// ── Business intelligence content (items.data for type 'bi') ─────────────────

export interface BIScreenshot {
  url: string;      // public URL in the 'dashboards' storage bucket
  caption?: string;
}

export interface BIDashboard {
  id: string;
  categoryId: string | null;
  title: string;
  description: string;
  kpis: string[];               // spelled out in full, e.g. "Average Length of Stay"
  screenshots: BIScreenshot[];  // unbounded — the carousel pages through them
}

// ── Structural ───────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  slug: string;
  label: string;
  icon?: string;
  position: number;
}

// Per-type page configuration stored on trackers.config.
export interface TrackerConfig {
  hero?: {
    eyebrow?: string;
    heading?: string;      // may contain <em>…</em> for the teal accent word
    sub?: string;
  };
  // `num` is a literal value. `auto` instead derives it from the tracker's own
  // content at render time, so the scorecard can't drift as items are added:
  //   'platforms'  — distinct platform names (a platform listed in two
  //                  categories, e.g. ADP, still counts once)
  //   'categories' — categories that actually hold at least one item
  stats?: { num?: string; label: string; auto?: 'platforms' | 'categories' }[];
  cta?: { label?: string; title?: string; sub?: string; href?: string; email?: string };
}

export interface Tracker {
  id: string;
  slug: string;
  title: string;
  description?: string;
  type: TrackerType;
  config: TrackerConfig;
  categories: Category[];
  // For 'usecases' trackers these are the use cases (backwards-compatible with
  // the previous shape). For other types the raw items are read via `items`.
  usecases: UseCase[];
  integrations: Integration[];
  processes: AutomationProcess[];
  dashboards: BIDashboard[];
}

export interface TrackerData {
  trackers: Tracker[];
}
