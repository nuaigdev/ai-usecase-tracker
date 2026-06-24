import { useState, useEffect, useRef } from 'react';
import type { UseCase, SubCase, TrackerData } from '../types';

const CATEGORIES = [
  'Resident Care',
  'Operations & Admin',
  'Staff & Workforce',
  'Sales & Admissions',
  'Quality & Compliance',
  'Family & Community',
];

// ── Form helpers ──────────────────────────────────────────────────────────────

interface SubCaseFormState {
  id: string;
  title: string;
  summary: string;
  description: string;
  businessValue: string;
  techStack: string;
}

interface FormState {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  businessValue: string;
  techStack: string;
  limitations: string;
  complianceFlags: string;
  owner: string;
  lastUpdated: string;
  hasSubCases: boolean;
  subCases: SubCaseFormState[];
}

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const splitLines = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean);

function toSubCaseForm(sc: SubCase): SubCaseFormState {
  return {
    id: sc.id,
    title: sc.title,
    summary: sc.summary ?? '',
    description: sc.description ?? '',
    businessValue: (sc.businessValue ?? []).join('\n'),
    techStack: (sc.techStack ?? []).join('\n'),
  };
}

function fromSubCaseForm(f: SubCaseFormState): SubCase {
  return {
    id: f.id || slugify(f.title),
    title: f.title,
    summary: f.summary,
    description: f.description,
    businessValue: splitLines(f.businessValue),
    techStack: splitLines(f.techStack),
  };
}

function toForm(uc: Partial<UseCase>): FormState {
  return {
    id: uc.id ?? '',
    title: uc.title ?? '',
    category: uc.category ?? 'Resident Care',
    summary: uc.summary ?? '',
    description: uc.description ?? '',
    businessValue: (uc.businessValue ?? []).join('\n'),
    techStack: (uc.techStack ?? []).join('\n'),
    limitations: (uc.limitations ?? []).join('\n'),
    complianceFlags: (uc.complianceFlags ?? []).join('\n'),
    owner: uc.owner ?? 'NuAig',
    lastUpdated: uc.lastUpdated ?? new Date().toISOString().split('T')[0],
    hasSubCases: !!uc.subCases?.length,
    subCases: (uc.subCases ?? []).map(toSubCaseForm),
  };
}

function fromForm(f: FormState): UseCase {
  const uc: UseCase = {
    id: f.id || slugify(f.title),
    title: f.title,
    category: f.category,
    summary: f.summary,
    description: f.description,
    businessValue: splitLines(f.businessValue),
    techStack: splitLines(f.techStack),
    limitations: splitLines(f.limitations),
    complianceFlags: splitLines(f.complianceFlags),
    owner: f.owner || undefined,
    lastUpdated: f.lastUpdated || undefined,
  };
  if (f.hasSubCases && f.subCases.length > 0) {
    uc.subCases = f.subCases.map(fromSubCaseForm);
  }
  return uc;
}

function blankSubCase(): SubCaseFormState {
  return { id: '', title: '', summary: '', description: '', businessValue: '', techStack: '' };
}

function blankForm(): FormState {
  return toForm({});
}

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent';
const textareaCls = `${inputCls} resize-y min-h-[80px]`;

// ── Sub-case row ──────────────────────────────────────────────────────────────

function SubCaseRow({
  sc,
  idx,
  expanded,
  onToggleExpand,
  onUpdate,
  onRemove,
}: {
  sc: SubCaseFormState;
  idx: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (key: keyof SubCaseFormState, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-neutral-200 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-50">
        <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
          {idx + 1}
        </span>
        <span className="text-sm font-medium text-neutral-700 flex-1 truncate min-w-0">
          {sc.title || <span className="text-neutral-400 italic">Untitled sub-case</span>}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0"
          title="Remove sub-case"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="p-4 space-y-4 border-t border-neutral-100">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title">
              <input
                className={inputCls}
                value={sc.title}
                onChange={e => onUpdate('title', e.target.value)}
                placeholder="e.g. Post-Visit Feedback"
              />
            </Field>
            <Field label="ID (auto-generated)">
              <input
                className={inputCls}
                value={sc.id}
                onChange={e => onUpdate('id', e.target.value)}
                placeholder="post-visit-feedback"
              />
            </Field>
          </div>
          <Field label="Summary">
            <textarea
              className={textareaCls}
              style={{ minHeight: 56 }}
              value={sc.summary}
              onChange={e => onUpdate('summary', e.target.value)}
              placeholder="One-line description shown as subtitle…"
            />
          </Field>
          <Field label="Description">
            <textarea
              className={textareaCls}
              style={{ minHeight: 100 }}
              value={sc.description}
              onChange={e => onUpdate('description', e.target.value)}
              placeholder="Full description of this sub-case…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Business Value (one per line)">
              <textarea
                className={textareaCls}
                value={sc.businessValue}
                onChange={e => onUpdate('businessValue', e.target.value)}
                placeholder={'Reduces manual work\nSaves staff time'}
              />
            </Field>
            <Field label="Tech Stack (one per line)">
              <textarea
                className={textareaCls}
                value={sc.techStack}
                onChange={e => onUpdate('techStack', e.target.value)}
                placeholder={'Voice AI\nNLP\nLLM'}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-cases section ─────────────────────────────────────────────────────────

function SubCasesSection({
  hasSubCases,
  subCases,
  onToggle,
  onChange,
  onDirty,
}: {
  hasSubCases: boolean;
  subCases: SubCaseFormState[];
  onToggle: () => void;
  onChange: (next: SubCaseFormState[]) => void;
  onDirty: () => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function addSubCase() {
    const next = [...subCases, blankSubCase()];
    onChange(next);
    setExpandedIdx(next.length - 1);
    onDirty();
  }

  function updateSubCaseField(idx: number, key: keyof SubCaseFormState, value: string) {
    const sc = { ...subCases[idx], [key]: value };
    if (key === 'title' && !subCases[idx].id) {
      sc.id = slugify(value);
    }
    onChange(subCases.map((s, i) => (i === idx ? sc : s)));
    onDirty();
  }

  function removeSubCase(idx: number) {
    if (!confirm('Remove this sub-case?')) return;
    onChange(subCases.filter((_, i) => i !== idx));
    if (expandedIdx === idx) setExpandedIdx(null);
    else if (expandedIdx !== null && expandedIdx > idx) setExpandedIdx(expandedIdx - 1);
    onDirty();
  }

  return (
    <div className="border-t border-neutral-100 pt-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-neutral-900">Sub-cases</div>
          <div className="text-xs text-neutral-500 mt-0.5">
            Group multiple related use cases under this entry
          </div>
        </div>
        <button
          type="button"
          onClick={() => { onToggle(); onDirty(); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            hasSubCases ? 'bg-brand' : 'bg-neutral-200'
          }`}
          aria-label="Toggle sub-cases"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              hasSubCases ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {hasSubCases && (
        <div className="space-y-2">
          {subCases.map((sc, idx) => (
            <SubCaseRow
              key={idx}
              sc={sc}
              idx={idx}
              expanded={expandedIdx === idx}
              onToggleExpand={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              onUpdate={(key, val) => updateSubCaseField(idx, key, val)}
              onRemove={() => removeSubCase(idx)}
            />
          ))}

          <button
            type="button"
            onClick={addSubCase}
            className="w-full py-2.5 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-brand hover:text-brand transition-colors flex items-center justify-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Sub-case
          </button>
        </div>
      )}
    </div>
  );
}

// ── Auth modal ────────────────────────────────────────────────────────────────

function AuthModal({ onVerified }: { onVerified: (key: string) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${input}` },
      });
      if (res.ok) {
        onVerified(input);
      } else if (res.status === 401) {
        setError('Incorrect admin key. Please try again.');
        setInput('');
        inputRef.current?.focus();
      } else {
        const text = await res.text();
        setError(text || 'Server error. Check that ADMIN_SECRET is set in Vercel.');
      }
    } catch {
      setError('Could not reach the server. Check your connection.');
    }

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 w-full bg-brand" />
        <div className="px-8 py-8">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center mb-5">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Admin Access</h2>
          <p className="text-sm text-neutral-500 mb-6">Enter your admin key to manage use cases.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Admin Key</Label>
              <input
                ref={inputRef}
                type="password"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Enter admin key…"
                autoComplete="off"
                className={inputCls}
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying…' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [trackerData, setTrackerData] = useState<TrackerData>({ trackers: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [dirty, setDirty] = useState(false);

  // Flat list of all use cases across all trackers (for sidebar display)
  const usecases = trackerData.trackers.flatMap(t => t.usecases);

  function handleVerified(key: string) {
    setAuthKey(key);
    loadUseCases();
  }

  async function loadUseCases() {
    setLoading(true);
    try {
      const data: TrackerData = await fetch('/api/usecases').then(r => r.json());
      setTrackerData(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load data.' });
    }
    setLoading(false);
  }

  function selectCase(uc: UseCase) {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return;
    setSelectedId(uc.id);
    setForm(toForm(uc));
    setDirty(false);
    setMessage(null);
  }

  function startNew() {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return;
    setSelectedId('new');
    setForm(blankForm());
    setDirty(false);
    setMessage(null);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title' && selectedId === 'new' && !dirty) {
        next.id = slugify(value as string);
      }
      return next;
    });
    setDirty(true);
  }

  async function persist(data: TrackerData) {
    const res = await fetch('/api/usecases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt === 'Unauthorized' ? 'Wrong admin key.' : txt);
    }
  }

  function applyUseCase(td: TrackerData, uc: UseCase, isNew: boolean): TrackerData {
    if (isNew) {
      // Add to first tracker (tracker assignment handled in commit 5)
      const firstId = td.trackers[0]?.id;
      return {
        trackers: td.trackers.map(t =>
          t.id === firstId ? { ...t, usecases: [...t.usecases, uc] } : t
        ),
      };
    }
    return {
      trackers: td.trackers.map(t => ({
        ...t,
        usecases: t.usecases.map(u => (u.id === selectedId ? uc : u)),
      })),
    };
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const uc = fromForm(form);
      if (selectedId === 'new' && usecases.some(u => u.id === uc.id)) {
        setMessage({ type: 'error', text: `ID "${uc.id}" already exists. Change the title or edit the ID.` });
        setSaving(false);
        return;
      }
      const next = applyUseCase(trackerData, uc, selectedId === 'new');
      await persist(next);
      setTrackerData(next);
      setSelectedId(uc.id);
      setDirty(false);
      setMessage({ type: 'ok', text: 'Saved! Changes are live immediately.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? 'Save failed.' });
    }
    setSaving(false);
  }

  async function handleDelete() {
    const target = usecases.find(u => u.id === selectedId);
    if (!target || !confirm(`Delete "${target.title}"? This cannot be undone.`)) return;
    setSaving(true);
    setMessage(null);
    try {
      const next: TrackerData = {
        trackers: trackerData.trackers.map(t => ({
          ...t,
          usecases: t.usecases.filter(u => u.id !== selectedId),
        })),
      };
      await persist(next);
      setTrackerData(next);
      setSelectedId(null);
      setDirty(false);
      setMessage({ type: 'ok', text: 'Deleted successfully.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? 'Delete failed.' });
    }
    setSaving(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!authKey) {
    return <AuthModal onVerified={handleVerified} />;
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm font-medium ${
            message.type === 'ok'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <span className="text-sm font-semibold text-neutral-700">
                {loading ? 'Loading…' : `${usecases.length} Use Cases`}
              </span>
              <button
                onClick={startNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New
              </button>
            </div>

            {selectedId === 'new' && (
              <div className="w-full text-left px-4 py-3 border-b border-neutral-100 bg-brand/5 border-l-2 border-l-brand">
                <div className="text-sm font-semibold text-brand">New Use Case</div>
                <div className="text-xs text-neutral-500 mt-0.5">Unsaved</div>
              </div>
            )}

            {usecases.map(uc => (
              <button
                key={uc.id}
                onClick={() => selectCase(uc)}
                className={`w-full text-left px-4 py-3 border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50 ${
                  selectedId === uc.id ? 'bg-brand/5 border-l-2 border-l-brand' : ''
                }`}
              >
                <div className="text-sm font-semibold text-neutral-900 leading-snug">{uc.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-400">{uc.category}</span>
                  {uc.subCases?.length ? (
                    <span className="text-xs text-neutral-400">{uc.subCases.length} sub-cases</span>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Edit form */}
        <div className="lg:col-span-2">
          {selectedId === null ? (
            <div className="h-64 flex items-center justify-center text-neutral-400 rounded-xl border border-dashed border-neutral-200">
              <div className="text-center">
                <svg viewBox="0 0 24 24" className="h-10 w-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <p className="text-sm">Select a use case to edit, or click Add New</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Title">
                  <input
                    className={inputCls}
                    value={form.title}
                    onChange={e => setField('title', e.target.value)}
                    placeholder="e.g. Fall Detection AI"
                  />
                </Field>
                <Field label="ID (auto-generated)">
                  <input
                    className={inputCls}
                    value={form.id}
                    onChange={e => setField('id', e.target.value)}
                    placeholder="e.g. fall-detection-ai"
                  />
                </Field>
              </div>

              <Field label="Category">
                <select
                  className={inputCls}
                  value={form.category}
                  onChange={e => setField('category', e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="Summary (shown on card)">
                <textarea
                  className={textareaCls}
                  style={{ minHeight: 60 }}
                  value={form.summary}
                  onChange={e => setField('summary', e.target.value)}
                  placeholder="Short sentence shown on the card…"
                />
              </Field>

              <Field label="Description (shown when expanded)">
                <textarea
                  className={textareaCls}
                  style={{ minHeight: 120 }}
                  value={form.description}
                  onChange={e => setField('description', e.target.value)}
                  placeholder="Full explanation of the use case…"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business Value (one per line)">
                  <textarea
                    className={textareaCls}
                    value={form.businessValue}
                    onChange={e => setField('businessValue', e.target.value)}
                    placeholder={'Reduce admin overhead\nFaster care decisions'}
                  />
                </Field>
                <Field label="Tech Stack (one per line)">
                  <textarea
                    className={textareaCls}
                    value={form.techStack}
                    onChange={e => setField('techStack', e.target.value)}
                    placeholder={'Claude AI\nEMR Integration\nLLM'}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Limitations (one per line)">
                  <textarea
                    className={textareaCls}
                    value={form.limitations}
                    onChange={e => setField('limitations', e.target.value)}
                    placeholder={'Requires EMR integration\nNeeds clinical review'}
                  />
                </Field>
                <Field label="Compliance Flags (one per line)">
                  <textarea
                    className={textareaCls}
                    value={form.complianceFlags}
                    onChange={e => setField('complianceFlags', e.target.value)}
                    placeholder={'HIPAA\nPHI Handling\nAudit Logging'}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Owner">
                  <input
                    className={inputCls}
                    value={form.owner}
                    onChange={e => setField('owner', e.target.value)}
                    placeholder="NuAig"
                  />
                </Field>
                <Field label="Last Updated">
                  <input
                    type="date"
                    className={inputCls}
                    value={form.lastUpdated}
                    onChange={e => setField('lastUpdated', e.target.value)}
                  />
                </Field>
              </div>

              {/* Sub-cases section */}
              <SubCasesSection
                hasSubCases={form.hasSubCases}
                subCases={form.subCases}
                onToggle={() => setForm(prev => ({ ...prev, hasSubCases: !prev.hasSubCases }))}
                onChange={next => setForm(prev => ({ ...prev, subCases: next }))}
                onDirty={() => setDirty(true)}
              />

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <div>
                  {selectedId !== 'new' && (
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="px-6 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : selectedId === 'new' ? 'Create Use Case' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
