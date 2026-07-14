import { useEffect, useMemo, useState } from 'react';
import type { Tracker, BIDashboard, BIScreenshot } from '../types';

const UNCATEGORIZED = '__uncategorized__';

// ── Full-screen viewer ────────────────────────────────────────────────────────
// Rendered over a blurred backdrop. Arrow keys page through the same set the
// carousel was showing; Esc (or the close button, or the backdrop) dismisses.

function Lightbox({
  shots, index, onIndex, onClose,
}: {
  shots: BIScreenshot[]; index: number; onIndex: (i: number) => void; onClose: () => void;
}) {
  const many = shots.length > 1;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && many) onIndex((index + 1) % shots.length);
      else if (e.key === 'ArrowLeft' && many) onIndex((index - 1 + shots.length) % shots.length);
    }
    window.addEventListener('keydown', onKey);
    // Freeze the page behind the overlay while it's open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, shots.length, many, onIndex, onClose]);

  const shot = shots[index];
  if (!shot) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {many && (
        <>
          <button
            onClick={() => onIndex((index - 1 + shots.length) % shots.length)}
            aria-label="Previous screenshot"
            className="absolute left-2 sm:left-6 z-10 inline-flex items-center justify-center h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => onIndex((index + 1) % shots.length)}
            aria-label="Next screenshot"
            className="absolute right-2 sm:right-6 z-10 inline-flex items-center justify-center h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      <figure className="relative z-[1] max-w-[92vw] max-h-[88vh] flex flex-col items-center gap-3">
        <img
          src={shot.url}
          alt={shot.caption ?? `Screenshot ${index + 1}`}
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-white"
        />
        <figcaption className="flex items-center gap-3 text-sm text-white/80">
          {shot.caption && <span className="font-medium">{shot.caption}</span>}
          {many && <span className="text-white/50">{index + 1} / {shots.length}</span>}
        </figcaption>
      </figure>
    </div>
  );
}

// ── In-card carousel ──────────────────────────────────────────────────────────

function Carousel({ shots, onOpen }: { shots: BIScreenshot[]; onOpen: (i: number) => void }) {
  const [i, setI] = useState(0);
  const many = shots.length > 1;

  // Guard the index if screenshots change underneath us.
  const index = Math.min(i, shots.length - 1);
  const shot = shots[index];
  if (!shot) return null;

  const go = (next: number) => setI((next + shots.length) % shots.length);

  return (
    <div>
      <div className="relative group rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden">
        <button
          onClick={() => onOpen(index)}
          className="block w-full cursor-zoom-in"
          aria-label="Open screenshot full screen"
        >
          <img
            src={shot.url}
            alt={shot.caption ?? `Screenshot ${index + 1}`}
            loading="lazy"
            className="w-full h-[280px] sm:h-[400px] object-contain bg-white"
          />
        </button>

        {many && (
          <>
            <button
              onClick={() => go(index - 1)}
              aria-label="Previous screenshot"
              className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/90 text-neutral-700 shadow-md border border-neutral-200 hover:bg-white hover:text-brand transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => go(index + 1)}
              aria-label="Next screenshot"
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/90 text-neutral-700 shadow-md border border-neutral-200 hover:bg-white hover:text-brand transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-neutral-900/70 text-white text-[11px] font-semibold tabular-nums">
              {index + 1} / {shots.length}
            </span>
          </>
        )}
      </div>

      {shot.caption && (
        <p className="mt-2 text-xs text-neutral-500 text-center">{shot.caption}</p>
      )}

      {many && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {shots.map((s, n) => (
            <button
              key={n}
              onClick={() => setI(n)}
              aria-label={`Show screenshot ${n + 1}`}
              className={`flex-shrink-0 h-14 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                n === index ? 'border-brand ring-2 ring-brand/20' : 'border-neutral-200 opacity-60 hover:opacity-100'
              }`}
            >
              <img src={s.url} alt="" loading="lazy" className="h-full w-full object-cover bg-white" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard card ────────────────────────────────────────────────────────────

function DashboardCard({
  d, expanded, onToggle, onOpenShot,
}: {
  d: BIDashboard; expanded: boolean; onToggle: () => void;
  onOpenShot: (shots: BIScreenshot[], i: number) => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 ${
      expanded ? 'md:col-span-2 border-brand shadow-lg shadow-brand/10' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
    }`}>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left p-5 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {d.kpis.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  {d.kpis.length} KPI{d.kpis.length === 1 ? '' : 's'}
                </span>
              )}
              {d.screenshots.length > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  {d.screenshots.length}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 leading-snug">{d.title}</h3>
            <p className={`text-sm text-neutral-500 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
              {d.description}
            </p>
          </div>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            expanded ? 'bg-brand text-white rotate-180' : 'bg-neutral-100 text-neutral-500'
          }`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 px-5 sm:px-6 pb-6 pt-5 space-y-6">
          {d.kpis.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                Key Performance Indicators
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {d.kpis.map((k, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-brand/10 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-brand" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-sm text-neutral-700">{k}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
              Dashboards
            </h4>
            {d.screenshots.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">No screenshots yet.</p>
            ) : (
              <Carousel shots={d.screenshots} onOpen={i => onOpenShot(d.screenshots, i)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function BIView({ tracker }: { tracker: Tracker }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [lightbox, setLightbox] = useState<{ shots: BIScreenshot[]; index: number } | null>(null);

  const dashboards = tracker.dashboards;
  const cats = tracker.categories;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dashboards.filter(d => {
      const catLabel = cats.find(c => c.id === d.categoryId)?.label ?? '';
      const matchSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        catLabel.toLowerCase().includes(q) ||
        d.kpis.some(k => k.toLowerCase().includes(q));
      const matchCat =
        filterCat === 'All' ||
        (filterCat === UNCATEGORIZED ? !d.categoryId : d.categoryId === filterCat);
      return matchSearch && matchCat;
    });
  }, [dashboards, cats, search, filterCat]);

  // Category order comes from the categories table; anything without a category
  // falls into a trailing "Uncategorized" group so it can never go missing.
  const groups = useMemo(() => {
    const out: { key: string; label: string; icon?: string; items: BIDashboard[] }[] = [];
    for (const c of cats) {
      const items = filtered.filter(d => d.categoryId === c.id);
      if (items.length) out.push({ key: c.id, label: c.label, icon: c.icon, items });
    }
    const loose = filtered.filter(d => !d.categoryId || !cats.some(c => c.id === d.categoryId));
    if (loose.length) out.push({ key: UNCATEGORIZED, label: 'Uncategorized', items: loose });
    return out;
  }, [filtered, cats]);

  if (dashboards.length === 0) {
    return (
      <div className="text-center py-24 text-neutral-400">
        <svg viewBox="0 0 24 24" className="h-12 w-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <p className="text-sm">No dashboards yet. Add some from the Manage section.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none"
            fill="none" stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search dashboards, KPIs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder-neutral-400"
          />
        </div>
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand text-neutral-700 cursor-pointer"
        >
          <option value="All">All Categories</option>
          {cats.map(c => (
            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.label}</option>
          ))}
          {dashboards.some(d => !d.categoryId) && <option value={UNCATEGORIZED}>Uncategorized</option>}
        </select>
      </div>

      <div className="text-xs text-neutral-400 mb-5 font-medium">
        {filtered.length} of {dashboards.length} dashboard{dashboards.length === 1 ? '' : 's'}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-neutral-400">
          <svg viewBox="0 0 24 24" className="h-12 w-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-sm">No dashboards match your filters.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {groups.map(g => (
            <section key={g.key}>
              <div className="flex items-center gap-2.5 mb-4">
                {g.icon && <span className="text-lg leading-none">{g.icon}</span>}
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wide">{g.label}</h2>
                <span className="text-xs font-semibold text-neutral-400">{g.items.length}</span>
                <div className="flex-1 h-px bg-neutral-200 ml-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {g.items.map(d => (
                  <DashboardCard
                    key={d.id}
                    d={d}
                    expanded={expandedId === d.id}
                    onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
                    onOpenShot={(shots, index) => setLightbox({ shots, index })}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {lightbox && (
        <Lightbox
          shots={lightbox.shots}
          index={lightbox.index}
          onIndex={i => setLightbox(lb => (lb ? { ...lb, index: i } : lb))}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
