import { useState, useMemo } from 'react';
import type { UseCase, SubCase } from '../data/usecases';

const STATUS_CONFIG = {
  planned:       { label: 'Planned',     bg: 'bg-slate-100',   text: 'text-slate-600',  dot: 'bg-slate-400'   },
  'in-progress': { label: 'In Progress', bg: 'bg-amber-50',    text: 'text-amber-700',  dot: 'bg-amber-400'   },
  live:          { label: 'Live',        bg: 'bg-emerald-50',  text: 'text-emerald-700',dot: 'bg-emerald-500' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Operations:             'bg-violet-100 text-violet-700',
  Clinical:               'bg-rose-100 text-rose-700',
  'Voice AI':             'bg-sky-100 text-sky-700',
  'Staff Tools':          'bg-indigo-100 text-indigo-700',
  'Marketing & Comms':    'bg-teal-100 text-teal-700',
  'Sales & Finance':      'bg-orange-100 text-orange-700',
  'Quality & Compliance': 'bg-green-100 text-green-700',
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-neutral-100 text-neutral-700';
}

// ── Shared section header ─────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">{children}</h4>;
}

// ── Value / tech section used by both overview and sub-case views ─────────────

function ValueList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((v, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-brand/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 text-brand" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <span className="text-sm text-neutral-700">{v}</span>
        </li>
      ))}
    </ul>
  );
}

function TechTags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span key={i} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-medium">
          {t}
        </span>
      ))}
    </div>
  );
}

// ── Compliance box (dashboard only) ──────────────────────────────────────────

function ComplianceBox({ uc }: { uc: UseCase }) {
  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Limitations & Compliance</h4>
      </div>
      {uc.complianceFlags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {uc.complianceFlags.map((f, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-xs font-semibold">
              {f}
            </span>
          ))}
        </div>
      )}
      {uc.limitations.length > 0 && (
        <ul className="space-y-2">
          {uc.limitations.map((l, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-amber-500 flex-shrink-0 mt-0.5 text-sm font-bold">·</span>
              <span className="text-xs text-amber-900 leading-relaxed">{l}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Sub-case detail view ──────────────────────────────────────────────────────

function SubCaseDetail({ sc }: { sc: SubCase }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-neutral-700 leading-relaxed">{sc.description}</p>
      <div>
        <SectionLabel>Business Value</SectionLabel>
        <ValueList items={sc.businessValue} />
      </div>
      <div>
        <SectionLabel>Tech Stack</SectionLabel>
        <TechTags items={sc.techStack} />
      </div>
    </div>
  );
}

// ── Expanded card body ────────────────────────────────────────────────────────

function ExpandedBody({ uc }: { uc: UseCase }) {
  const [activeTab, setActiveTab] = useState<'overview' | number>('overview');
  const hasSubCases = !!uc.subCases?.length;

  return (
    <div className="border-t border-neutral-100 px-6 pb-6 pt-5">
      {hasSubCases ? (
        /* ── Sub-case tab layout ── */
        <div>
          {/* Tab bar */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'bg-brand text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              Overview
            </button>
            {uc.subCases!.map((sc, i) => (
              <button
                key={sc.id}
                onClick={() => setActiveTab(i)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === i
                    ? 'bg-brand text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {String(i + 1).padStart(2, '0')} · {sc.title.replace(' via Voice AI', '').replace('-Based ', '-').replace('Voice-Assisted ', '').replace('Voice-Based ', '').replace('AI Family ', 'Family ')}
              </button>
            ))}
          </div>

          {activeTab === 'overview' ? (
            /* Overview tab */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <p className="text-sm text-neutral-700 leading-relaxed">{uc.description}</p>
                <div>
                  <SectionLabel>Business Value</SectionLabel>
                  <ValueList items={uc.businessValue} />
                </div>
                <div>
                  <SectionLabel>Core Tech Stack</SectionLabel>
                  <TechTags items={uc.techStack} />
                </div>
                {(uc.owner || uc.lastUpdated) && (
                  <div className="flex gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                    {uc.owner && <span>Owner: {uc.owner}</span>}
                    {uc.lastUpdated && <span>Updated: {uc.lastUpdated}</span>}
                  </div>
                )}
              </div>
              <div>
                <ComplianceBox uc={uc} />
              </div>
            </div>
          ) : (
            /* Sub-case tab */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h4 className="text-base font-semibold text-neutral-900 mb-1">
                  {uc.subCases![activeTab as number].title}
                </h4>
                <p className="text-sm text-neutral-500 mb-4">{uc.subCases![activeTab as number].summary}</p>
                <SubCaseDetail sc={uc.subCases![activeTab as number]} />
              </div>
              <div>
                <ComplianceBox uc={uc} />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── Standard two-column layout ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <p className="text-sm text-neutral-700 leading-relaxed">{uc.description}</p>
            <div>
              <SectionLabel>Business Value</SectionLabel>
              <ValueList items={uc.businessValue} />
            </div>
            <div>
              <SectionLabel>Tech Stack</SectionLabel>
              <TechTags items={uc.techStack} />
            </div>
            {(uc.owner || uc.lastUpdated) && (
              <div className="flex gap-4 text-xs text-neutral-400 pt-2 border-t border-neutral-100">
                {uc.owner && <span>Owner: {uc.owner}</span>}
                {uc.lastUpdated && <span>Updated: {uc.lastUpdated}</span>}
              </div>
            )}
          </div>
          <div>
            <ComplianceBox uc={uc} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

function Card({ uc, expanded, onToggle }: { uc: UseCase; expanded: boolean; onToggle: () => void }) {
  const st = STATUS_CONFIG[uc.status];
  const cc = categoryColor(uc.category);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-300 ${
        expanded
          ? 'border-brand shadow-lg shadow-brand/10 col-span-1 md:col-span-2 xl:col-span-3'
          : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cc}`}>
                {uc.category}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.bg} ${st.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
              {uc.subCases?.length && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
                  {uc.subCases.length} sub-cases
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 leading-snug">{uc.title}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{uc.summary}</p>
          </div>
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              expanded ? 'bg-brand text-white rotate-180' : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </button>

      {expanded && <ExpandedBody uc={uc} />}
    </div>
  );
}

// ── Main grid ─────────────────────────────────────────────────────────────────

export default function CardGrid({ usecases }: { usecases: UseCase[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(usecases.map(u => u.category)))],
    [usecases],
  );

  const filtered = useMemo(
    () =>
      usecases.filter(u => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          u.title.toLowerCase().includes(q) ||
          u.summary.toLowerCase().includes(q) ||
          u.category.toLowerCase().includes(q) ||
          u.subCases?.some(sc => sc.title.toLowerCase().includes(q));
        return (
          matchSearch &&
          (filterCat === 'All' || u.category === filterCat) &&
          (filterStatus === 'All' || u.status === filterStatus)
        );
      }),
    [usecases, search, filterCat, filterStatus],
  );

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            viewBox="0 0 24 24"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search use cases…"
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
          {categories.map(c => (
            <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand text-neutral-700 cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="live">Live</option>
          <option value="in-progress">In Progress</option>
          <option value="planned">Planned</option>
        </select>
      </div>

      <div className="text-xs text-neutral-400 mb-5 font-medium">
        {filtered.length} of {usecases.length} use cases
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24 text-neutral-400">
          <svg viewBox="0 0 24 24" className="h-12 w-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-sm">No use cases match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(uc => (
            <Card
              key={uc.id}
              uc={uc}
              expanded={expandedId === uc.id}
              onToggle={() => setExpandedId(expandedId === uc.id ? null : uc.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
