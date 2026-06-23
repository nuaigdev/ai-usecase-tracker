import { useState, useEffect } from 'react';
import type { UseCase, Status } from '../data/usecases';

const CATEGORIES = [
  'Resident Care',
  'Operations & Admin',
  'Staff & Workforce',
  'Sales & Admissions',
  'Quality & Compliance',
  'Family & Community',
];

const STATUSES: { value: Status; label: string }[] = [
  { value: 'planned', label: 'Planned' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'live', label: 'Live' },
];

const STATUS_STYLES: Record<Status, string> = {
  planned: 'bg-slate-100 text-slate-600',
  'in-progress': 'bg-amber-50 text-amber-700',
  live: 'bg-emerald-50 text-emerald-700',
};

// ── Form helpers ──────────────────────────────────────────────────────────────

interface FormState {
  id: string;
  title: string;
  category: string;
  status: Status;
  summary: string;
  description: string;
  businessValue: string;
  techStack: string;
  limitations: string;
  complianceFlags: string;
  owner: string;
  lastUpdated: string;
}

function toForm(uc: Partial<UseCase>): FormState {
  return {
    id: uc.id ?? '',
    title: uc.title ?? '',
    category: uc.category ?? 'Resident Care',
    status: uc.status ?? 'planned',
    summary: uc.summary ?? '',
    description: uc.description ?? '',
    businessValue: (uc.businessValue ?? []).join('\n'),
    techStack: (uc.techStack ?? []).join('\n'),
    limitations: (uc.limitations ?? []).join('\n'),
    complianceFlags: (uc.complianceFlags ?? []).join('\n'),
    owner: uc.owner ?? 'NuAig',
    lastUpdated: uc.lastUpdated ?? new Date().toISOString().split('T')[0],
  };
}

function fromForm(f: FormState): UseCase {
  const lines = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean);
  return {
    id: f.id || f.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    title: f.title,
    category: f.category,
    status: f.status,
    summary: f.summary,
    description: f.description,
    businessValue: lines(f.businessValue),
    techStack: lines(f.techStack),
    limitations: lines(f.limitations),
    complianceFlags: lines(f.complianceFlags),
    owner: f.owner || undefined,
    lastUpdated: f.lastUpdated || undefined,
  };
}

function blankForm(): FormState {
  return toForm({});
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{children}</label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent';
const textareaCls = `${inputCls} resize-y min-h-[80px]`;

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const [keyInput, setKeyInput] = useState('');
  const [authKey, setAuthKey] = useState('');
  const [usecases, setUsecases] = useState<UseCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // 'new' = creating, string = editing by id, null = nothing selected
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());
  const [dirty, setDirty] = useState(false);

  // Restore key from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('nuaig_admin_key') ?? '';
    setAuthKey(saved);
    setKeyInput(saved);
  }, []);

  // Load use cases
  useEffect(() => {
    fetch('/api/usecases')
      .then(r => r.json())
      .then((data: UseCase[]) => {
        setUsecases(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function saveKey() {
    sessionStorage.setItem('nuaig_admin_key', keyInput);
    setAuthKey(keyInput);
    setMessage({ type: 'ok', text: 'Admin key saved for this session.' });
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
      // Auto-generate id from title when creating
      if (key === 'title' && selectedId === 'new' && !dirty) {
        next.id = (value as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return next;
    });
    setDirty(true);
  }

  async function persist(list: UseCase[]) {
    const res = await fetch('/api/usecases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authKey}`,
      },
      body: JSON.stringify(list),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt === 'Unauthorized' ? 'Wrong admin key.' : txt);
    }
    return list;
  }

  async function handleSave() {
    if (!authKey) {
      setMessage({ type: 'error', text: 'Enter and save your admin key first.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const uc = fromForm(form);
      let next: UseCase[];
      if (selectedId === 'new') {
        if (usecases.some(u => u.id === uc.id)) {
          setMessage({ type: 'error', text: `ID "${uc.id}" already exists. Change the title or edit the ID.` });
          setSaving(false);
          return;
        }
        next = [...usecases, uc];
      } else {
        next = usecases.map(u => (u.id === selectedId ? uc : u));
      }
      await persist(next);
      setUsecases(next);
      setSelectedId(uc.id);
      setDirty(false);
      setMessage({ type: 'ok', text: 'Saved! Changes are live immediately.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? 'Save failed.' });
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!authKey) {
      setMessage({ type: 'error', text: 'Enter and save your admin key first.' });
      return;
    }
    const target = usecases.find(u => u.id === selectedId);
    if (!target || !confirm(`Delete "${target.title}"? This cannot be undone.`)) return;

    setSaving(true);
    setMessage(null);
    try {
      const next = usecases.filter(u => u.id !== selectedId);
      await persist(next);
      setUsecases(next);
      setSelectedId(null);
      setDirty(false);
      setMessage({ type: 'ok', text: 'Deleted successfully.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? 'Delete failed.' });
    }
    setSaving(false);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Admin key bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 rounded-xl bg-neutral-50 border border-neutral-200">
        <div className="flex-1">
          <Label>Admin Key</Label>
          <input
            type="password"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveKey()}
            placeholder="Paste your ADMIN_SECRET here…"
            className={inputCls}
          />
        </div>
        <button
          onClick={saveKey}
          className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-neutral-700 transition-colors"
        >
          Save Key
        </button>
        {authKey && (
          <span className="text-xs text-emerald-600 font-semibold self-center">Key set</span>
        )}
      </div>

      {/* Message banner */}
      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${
          message.type === 'ok'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sidebar — use case list */}
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
              <button
                className="w-full text-left px-4 py-3 border-b border-neutral-100 bg-brand/5 border-l-2 border-l-brand"
              >
                <div className="text-sm font-semibold text-brand">New Use Case</div>
                <div className="text-xs text-neutral-500 mt-0.5">Unsaved</div>
              </button>
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
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[uc.status]}`}>
                    {uc.status}
                  </span>
                  <span className="text-xs text-neutral-400">{uc.category}</span>
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

              <div className="grid grid-cols-2 gap-4">
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
                <Field label="Status">
                  <select
                    className={inputCls}
                    value={form.status}
                    onChange={e => setField('status', e.target.value as Status)}
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Summary (one-line description shown on card)">
                <textarea
                  className={textareaCls}
                  style={{ minHeight: 60 }}
                  value={form.summary}
                  onChange={e => setField('summary', e.target.value)}
                  placeholder="Short sentence shown on the card…"
                />
              </Field>

              <Field label="Description (full detail shown when expanded)">
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
                    placeholder={"Reduce admin overhead\nFaster care decisions"}
                  />
                </Field>
                <Field label="Tech Stack (one per line)">
                  <textarea
                    className={textareaCls}
                    value={form.techStack}
                    onChange={e => setField('techStack', e.target.value)}
                    placeholder={"Claude AI\nEMR Integration\nLLM"}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Limitations (one per line)">
                  <textarea
                    className={textareaCls}
                    value={form.limitations}
                    onChange={e => setField('limitations', e.target.value)}
                    placeholder={"Requires EMR integration\nNeeds clinical review"}
                  />
                </Field>
                <Field label="Compliance Flags (one per line)">
                  <textarea
                    className={textareaCls}
                    value={form.complianceFlags}
                    onChange={e => setField('complianceFlags', e.target.value)}
                    placeholder={"HIPAA\nPHI Handling\nAudit Logging"}
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

              {/* Action buttons */}
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
