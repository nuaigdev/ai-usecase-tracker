import { useState, useEffect, useRef } from 'react';
import type { UseCase, SubCase, Tracker, TrackerData } from '../types';

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
  trackerId: string;
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

function toForm(uc: Partial<UseCase>, trackerId: string): FormState {
  return {
    id: uc.id ?? '',
    title: uc.title ?? '',
    category: uc.category ?? 'Resident Care',
    trackerId,
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

function blankForm(defaultTrackerId: string): FormState {
  return toForm({}, defaultTrackerId);
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
  sc, idx, expanded, onToggleExpand, onUpdate, onRemove,
}: {
  sc: SubCaseFormState; idx: number; expanded: boolean;
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
        <button type="button" onClick={onRemove} className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors flex-shrink-0" title="Remove">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6M14 11v6M9 6V4h6v2" />
          </svg>
        </button>
        <button type="button" onClick={onToggleExpand} className="p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0">
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="p-4 space-y-4 border-t border-neutral-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Title">
              <input className={inputCls} value={sc.title} onChange={e => onUpdate('title', e.target.value)} placeholder="Sub-case title…" />
            </Field>
            <Field label="ID (auto-generated)">
              <input className={inputCls} value={sc.id} onChange={e => onUpdate('id', e.target.value)} placeholder="sub-case-id" />
            </Field>
          </div>
          <Field label="Summary">
            <textarea className={textareaCls} style={{ minHeight: 56 }} value={sc.summary} onChange={e => onUpdate('summary', e.target.value)} placeholder="One-line description…" />
          </Field>
          <Field label="Description">
            <textarea className={textareaCls} style={{ minHeight: 100 }} value={sc.description} onChange={e => onUpdate('description', e.target.value)} placeholder="Full description…" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Business Value (one per line)">
              <textarea className={textareaCls} value={sc.businessValue} onChange={e => onUpdate('businessValue', e.target.value)} placeholder={'Reduces manual work\nSaves time'} />
            </Field>
            <Field label="Tech Stack (one per line)">
              <textarea className={textareaCls} value={sc.techStack} onChange={e => onUpdate('techStack', e.target.value)} placeholder={'Voice AI\nNLP'} />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-cases section ─────────────────────────────────────────────────────────

function SubCasesSection({
  hasSubCases, subCases, onToggle, onChange, onDirty,
}: {
  hasSubCases: boolean; subCases: SubCaseFormState[];
  onToggle: () => void; onChange: (next: SubCaseFormState[]) => void; onDirty: () => void;
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
    if (key === 'title' && !subCases[idx].id) sc.id = slugify(value);
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
          <div className="text-xs text-neutral-500 mt-0.5">Group related use cases under this entry</div>
        </div>
        <button
          type="button"
          onClick={() => { onToggle(); onDirty(); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hasSubCases ? 'bg-brand' : 'bg-neutral-200'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hasSubCases ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      {hasSubCases && (
        <div className="space-y-2">
          {subCases.map((sc, idx) => (
            <SubCaseRow
              key={idx} sc={sc} idx={idx}
              expanded={expandedIdx === idx}
              onToggleExpand={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
              onUpdate={(key, val) => updateSubCaseField(idx, key, val)}
              onRemove={() => removeSubCase(idx)}
            />
          ))}
          <button
            type="button" onClick={addSubCase}
            className="w-full py-2.5 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-brand hover:text-brand transition-colors flex items-center justify-center gap-1.5"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Sub-case
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tracker management tab ────────────────────────────────────────────────────

function TrackersTab({
  trackers,
  onSave,
  saving,
}: {
  trackers: Tracker[];
  onSave: (next: Tracker[]) => Promise<void>;
  saving: boolean;
}) {
  const [list, setList] = useState<Tracker[]>(trackers);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Keep list in sync when parent data changes
  useEffect(() => { setList(trackers); }, [trackers]);

  function startEdit(t: Tracker) {
    setEditId(t.id);
    setTitleInput(t.title);
    setDescInput(t.description ?? '');
    setDirty(false);
    setMsg(null);
  }

  function startNew() {
    setEditId('new');
    setTitleInput('');
    setDescInput('');
    setDirty(false);
    setMsg(null);
  }

  async function handleSaveTracker() {
    if (!titleInput.trim()) return;
    let next: Tracker[];
    if (editId === 'new') {
      const id = slugify(titleInput);
      if (list.some(t => t.id === id)) {
        setMsg({ type: 'error', text: `A tracker with id "${id}" already exists.` });
        return;
      }
      next = [...list, { id, title: titleInput.trim(), description: descInput.trim() || undefined, usecases: [] }];
    } else {
      next = list.map(t => t.id === editId ? { ...t, title: titleInput.trim(), description: descInput.trim() || undefined } : t);
    }
    try {
      await onSave(next);
      setList(next);
      setEditId(null);
      setDirty(false);
      setMsg({ type: 'ok', text: 'Tracker saved.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message ?? 'Save failed.' });
    }
  }

  async function handleDelete(id: string) {
    const t = list.find(x => x.id === id);
    if (!t) return;
    if (t.usecases.length > 0 && !confirm(`"${t.title}" has ${t.usecases.length} use cases. Delete anyway?`)) return;
    const next = list.filter(x => x.id !== id);
    try {
      await onSave(next);
      setList(next);
      if (editId === id) setEditId(null);
      setMsg({ type: 'ok', text: 'Tracker deleted.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message ?? 'Delete failed.' });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-sm font-semibold text-neutral-700">{list.length} Trackers</span>
            <button
              onClick={startNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add
            </button>
          </div>
          {editId === 'new' && (
            <div className="px-4 py-3 border-b border-neutral-100 bg-brand/5 border-l-2 border-l-brand">
              <div className="text-sm font-semibold text-brand">New Tracker</div>
              <div className="text-xs text-neutral-500 mt-0.5">Unsaved</div>
            </div>
          )}
          {list.map(t => (
            <div
              key={t.id}
              className={`flex items-center gap-2 px-4 py-3 border-b border-neutral-100 last:border-b-0 cursor-pointer hover:bg-neutral-50 transition-colors ${editId === t.id ? 'bg-brand/5 border-l-2 border-l-brand' : ''}`}
              onClick={() => startEdit(t)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-900 truncate">{t.title}</div>
                <div className="text-xs text-neutral-400 mt-0.5">{t.usecases.length} use cases</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(t.id); }}
                className="p-1 rounded text-neutral-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Edit form */}
      <div className="lg:col-span-2">
        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm font-medium mb-4 ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {msg.text}
          </div>
        )}
        {editId === null ? (
          <div className="h-48 flex items-center justify-center text-neutral-400 rounded-xl border border-dashed border-neutral-200">
            <p className="text-sm">Select a tracker to edit, or click Add</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 space-y-4">
            <Field label="Tracker Name">
              <input
                className={inputCls}
                value={titleInput}
                onChange={e => { setTitleInput(e.target.value); setDirty(true); }}
                placeholder="e.g. Automation Processes"
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                className={textareaCls}
                style={{ minHeight: 72 }}
                value={descInput}
                onChange={e => { setDescInput(e.target.value); setDirty(true); }}
                placeholder="Brief description shown on the tracker page…"
              />
            </Field>
            {editId !== 'new' && (
              <p className="text-xs text-neutral-400">
                ID: <span className="font-mono">{editId}</span> · {list.find(t => t.id === editId)?.usecases.length ?? 0} use cases
              </p>
            )}
            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                onClick={handleSaveTracker}
                disabled={saving || !titleInput.trim() || !dirty}
                className="px-6 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : editId === 'new' ? 'Create Tracker' : 'Save Tracker'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth modal ────────────────────────────────────────────────────────────────

function AuthModal({ onVerified }: { onVerified: (key: string) => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Admin Access</h2>
          <p className="text-sm text-neutral-500 mb-6">Enter your admin key to manage trackers and use cases.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Admin Key</Label>
              <input ref={inputRef} type="password" value={input} onChange={e => setInput(e.target.value)} placeholder="Enter admin key…" autoComplete="off" className={inputCls} />
            </div>
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading || !input.trim()} className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? 'Verifying…' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

type AdminTab = 'usecases' | 'trackers';

export default function AdminPanel() {
  const [authKey, setAuthKey] = useState<string | null>(null);
  const [trackerData, setTrackerData] = useState<TrackerData>({ trackers: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('usecases');

  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(blankForm(''));
  const [dirty, setDirty] = useState(false);

  const usecases = trackerData.trackers.flatMap(t => t.usecases);
  const defaultTrackerId = trackerData.trackers[0]?.id ?? '';

  function handleVerified(key: string) {
    setAuthKey(key);
    loadData();
  }

  async function loadData() {
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
    const trackerId = trackerData.trackers.find(t => t.usecases.some(u => u.id === uc.id))?.id ?? defaultTrackerId;
    setSelectedId(uc.id);
    setForm(toForm(uc, trackerId));
    setDirty(false);
    setMessage(null);
  }

  function startNew() {
    if (dirty && !confirm('You have unsaved changes. Discard them?')) return;
    setSelectedId('new');
    setForm(blankForm(defaultTrackerId));
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
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authKey}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt === 'Unauthorized' ? 'Wrong admin key.' : txt);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const uc = fromForm(form);
      const targetTrackerId = form.trackerId || defaultTrackerId;

      if (selectedId === 'new' && usecases.some(u => u.id === uc.id)) {
        setMessage({ type: 'error', text: `ID "${uc.id}" already exists.` });
        setSaving(false);
        return;
      }

      let next: TrackerData;
      if (selectedId === 'new') {
        next = {
          trackers: trackerData.trackers.map(t =>
            t.id === targetTrackerId ? { ...t, usecases: [...t.usecases, uc] } : t
          ),
        };
      } else {
        // If tracker changed, move the use case
        const oldTrackerId = trackerData.trackers.find(t => t.usecases.some(u => u.id === selectedId))?.id;
        if (oldTrackerId && oldTrackerId !== targetTrackerId) {
          next = {
            trackers: trackerData.trackers.map(t => {
              if (t.id === oldTrackerId) return { ...t, usecases: t.usecases.filter(u => u.id !== selectedId) };
              if (t.id === targetTrackerId) return { ...t, usecases: [...t.usecases, uc] };
              return t;
            }),
          };
        } else {
          next = {
            trackers: trackerData.trackers.map(t => ({
              ...t,
              usecases: t.usecases.map(u => (u.id === selectedId ? uc : u)),
            })),
          };
        }
      }

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

  async function handleSaveTrackers(next: Tracker[]) {
    const nextData: TrackerData = { trackers: next };
    await persist(nextData);
    setTrackerData(nextData);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!authKey) {
    return <AuthModal onVerified={handleVerified} />;
  }

  const TAB_CLS = (t: AdminTab) =>
    `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
      activeTab === t
        ? 'bg-brand text-white'
        : 'text-neutral-600 hover:bg-neutral-100'
    }`;

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-2">
        <button className={TAB_CLS('usecases')} onClick={() => setActiveTab('usecases')}>Use Cases</button>
        <button className={TAB_CLS('trackers')} onClick={() => setActiveTab('trackers')}>Trackers</button>
      </div>

      {/* Message banner (use-cases tab only) */}
      {activeTab === 'usecases' && message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {activeTab === 'trackers' ? (
        <TrackersTab trackers={trackerData.trackers} onSave={handleSaveTrackers} saving={saving} />
      ) : (
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
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add New
                </button>
              </div>

              {selectedId === 'new' && (
                <div className="px-4 py-3 border-b border-neutral-100 bg-brand/5 border-l-2 border-l-brand">
                  <div className="text-sm font-semibold text-brand">New Use Case</div>
                  <div className="text-xs text-neutral-500 mt-0.5">Unsaved</div>
                </div>
              )}

              {trackerData.trackers.map(tracker => (
                <div key={tracker.id}>
                  {trackerData.trackers.length > 1 && (
                    <div className="px-4 py-1.5 bg-neutral-50 border-b border-neutral-100">
                      <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{tracker.title}</span>
                    </div>
                  )}
                  {tracker.usecases.map(uc => (
                    <button
                      key={uc.id}
                      onClick={() => selectCase(uc)}
                      className={`w-full text-left px-4 py-3 border-b border-neutral-100 last:border-b-0 transition-colors hover:bg-neutral-50 ${selectedId === uc.id ? 'bg-brand/5 border-l-2 border-l-brand' : ''}`}
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
              <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Title">
                    <input className={inputCls} value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. Fall Detection AI" />
                  </Field>
                  <Field label="ID (auto-generated)">
                    <input className={inputCls} value={form.id} onChange={e => setField('id', e.target.value)} placeholder="fall-detection-ai" />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Tracker">
                    <select className={inputCls} value={form.trackerId} onChange={e => setField('trackerId', e.target.value)}>
                      {trackerData.trackers.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Category">
                    <select className={inputCls} value={form.category} onChange={e => setField('category', e.target.value)}>
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Summary (shown on card)">
                  <textarea className={textareaCls} style={{ minHeight: 60 }} value={form.summary} onChange={e => setField('summary', e.target.value)} placeholder="Short sentence shown on the card…" />
                </Field>

                <Field label="Description (shown when expanded)">
                  <textarea className={textareaCls} style={{ minHeight: 120 }} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Full explanation of the use case…" />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Business Value (one per line)">
                    <textarea className={textareaCls} value={form.businessValue} onChange={e => setField('businessValue', e.target.value)} placeholder={'Reduce admin overhead\nFaster care decisions'} />
                  </Field>
                  <Field label="Tech Stack (one per line)">
                    <textarea className={textareaCls} value={form.techStack} onChange={e => setField('techStack', e.target.value)} placeholder={'Claude AI\nEMR Integration'} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Limitations (one per line)">
                    <textarea className={textareaCls} value={form.limitations} onChange={e => setField('limitations', e.target.value)} placeholder={'Requires EMR integration\nNeeds clinical review'} />
                  </Field>
                  <Field label="Compliance Flags (one per line)">
                    <textarea className={textareaCls} value={form.complianceFlags} onChange={e => setField('complianceFlags', e.target.value)} placeholder={'HIPAA\nPHI Handling'} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Owner">
                    <input className={inputCls} value={form.owner} onChange={e => setField('owner', e.target.value)} placeholder="NuAig" />
                  </Field>
                  <Field label="Last Updated">
                    <input type="date" className={inputCls} value={form.lastUpdated} onChange={e => setField('lastUpdated', e.target.value)} />
                  </Field>
                </div>

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
                      <button onClick={handleDelete} disabled={saving} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors disabled:opacity-50">
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
      )}
    </div>
  );
}
