import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import type { TrackerType, AutomationStepKind } from '../types';

// ── Row shapes (with real uuids, unlike the public reshaped types) ────────────
interface TrackerRow {
  id: string; slug: string; title: string; description: string | null;
  type: string; config: any; position: number;
}
interface CategoryRow {
  id: string; tracker_id: string; slug: string; label: string; icon: string | null; position: number;
}
interface ItemRow {
  id: string; tracker_id: string; category_id: string | null;
  slug: string; title: string; summary: string | null; position: number; data: any;
}
interface ProfileRow { id: string; role: string; tracker_id: string | null; email: string | null; }

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const lines = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean);
const joinLines = (a?: string[]) => (a ?? []).join('\n');

const inputCls = 'w-full px-3 py-2 rounded-lg border border-neutral-200 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent';
const textareaCls = `${inputCls} resize-y min-h-[80px]`;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1">{children}</label>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><Label>{label}</Label>{children}</div>;
}
function Banner({ msg }: { msg: { type: 'ok' | 'error'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div className={`px-4 py-3 rounded-lg text-sm font-medium ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
      {msg.text}
    </div>
  );
}

// ── Auth screen ───────────────────────────────────────────────────────────────
function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const { error } = await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
    if (error) setError(error.message);
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
          <h2 className="text-xl font-bold text-neutral-900 mb-1">Manage Trackers</h2>
          <p className="text-sm text-neutral-500 mb-6">Sign in with your NuAig account.</p>
          <form onSubmit={submit} className="space-y-4">
            <Field label="Email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
            </Field>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button type="submit" disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brand/90 transition-colors disabled:opacity-40">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Item editor (type-aware) ──────────────────────────────────────────────────
type ItemForm = {
  id: string | 'new';
  slug: string; title: string; summary: string; categoryId: string;
  // usecases / automation shared
  description: string; businessValue: string; techStack: string;
  // usecases only
  category: string; limitations: string; complianceFlags: string; owner: string; lastUpdated: string;
  // integrations only
  tag: string; url: string;
  // automation only
  steps: { id: string; title: string; desc: string; kind: AutomationStepKind; next: string[] }[];
};

function emptyItemForm(): ItemForm {
  return {
    id: 'new', slug: '', title: '', summary: '', categoryId: '',
    description: '', businessValue: '', techStack: '',
    category: 'Resident Care', limitations: '', complianceFlags: '', owner: 'NuAig',
    lastUpdated: new Date().toISOString().split('T')[0],
    tag: '', url: '', steps: [],
  };
}

function itemToForm(row: ItemRow): ItemForm {
  const d = row.data ?? {};
  return {
    id: row.id, slug: row.slug, title: row.title, summary: row.summary ?? '', categoryId: row.category_id ?? '',
    description: d.description ?? '', businessValue: joinLines(d.businessValue), techStack: joinLines(d.techStack),
    category: d.category ?? 'Resident Care', limitations: joinLines(d.limitations),
    complianceFlags: joinLines(d.complianceFlags), owner: d.owner ?? 'NuAig',
    lastUpdated: d.lastUpdated ?? new Date().toISOString().split('T')[0],
    tag: d.tag ?? '', url: d.url ?? '',
    steps: (d.steps ?? []).map((s: any) => ({ id: s.id, title: s.title, desc: s.desc ?? '', kind: s.kind ?? 'action', next: s.next ?? [] })),
  };
}

function formToData(f: ItemForm, type: TrackerType): any {
  if (type === 'integrations') return { tag: f.tag || undefined, url: f.url || undefined };
  if (type === 'automation') return {
    description: f.description, businessValue: lines(f.businessValue), techStack: lines(f.techStack),
    steps: f.steps.map(s => ({ id: s.id || slugify(s.title), title: s.title, desc: s.desc || undefined, kind: s.kind, next: s.next })),
  };
  return {
    category: f.category, description: f.description,
    businessValue: lines(f.businessValue), techStack: lines(f.techStack),
    limitations: lines(f.limitations), complianceFlags: lines(f.complianceFlags),
    owner: f.owner || undefined, lastUpdated: f.lastUpdated || undefined,
  };
}

function StepsEditor({ steps, onChange }: { steps: ItemForm['steps']; onChange: (s: ItemForm['steps']) => void }) {
  function update(idx: number, patch: Partial<ItemForm['steps'][number]>) {
    onChange(steps.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }
  function add() {
    onChange([...steps, { id: `step-${steps.length + 1}`, title: '', desc: '', kind: 'action', next: [] }]);
  }
  function remove(idx: number) {
    const removed = steps[idx].id;
    onChange(steps.filter((_, i) => i !== idx).map(s => ({ ...s, next: s.next.filter(n => n !== removed) })));
  }
  return (
    <div className="space-y-3">
      {steps.map((s, idx) => (
        <div key={idx} className="rounded-lg border border-neutral-200 p-3 space-y-3 bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-500 w-5">{idx + 1}</span>
            <input className={inputCls} placeholder="Step title" value={s.title}
              onChange={e => update(idx, { title: e.target.value, id: s.id || slugify(e.target.value) })} />
            <select className={`${inputCls} w-36`} value={s.kind} onChange={e => update(idx, { kind: e.target.value as AutomationStepKind })}>
              <option value="trigger">Trigger</option><option value="action">Action</option>
              <option value="branch">Branch</option><option value="end">End</option>
            </select>
            <button type="button" onClick={() => remove(idx)} className="p-1.5 rounded text-neutral-400 hover:text-red-500" title="Remove">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
            </button>
          </div>
          <input className={inputCls} placeholder="Short description (optional)" value={s.desc} onChange={e => update(idx, { desc: e.target.value })} />
          <div>
            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Leads to</div>
            <div className="flex flex-wrap gap-2">
              {steps.filter((_, i) => i !== idx).map(other => {
                const on = s.next.includes(other.id);
                return (
                  <button key={other.id} type="button"
                    onClick={() => update(idx, { next: on ? s.next.filter(n => n !== other.id) : [...s.next, other.id] })}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${on ? 'bg-brand text-white border-brand' : 'bg-white text-neutral-600 border-neutral-200 hover:border-brand'}`}>
                    {other.title || other.id}
                  </button>
                );
              })}
              {steps.length <= 1 && <span className="text-xs text-neutral-400 italic">Add more steps to connect them.</span>}
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={add} className="w-full py-2.5 rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-brand hover:text-brand transition-colors">
        + Add Step
      </button>
    </div>
  );
}

function ItemEditor({
  type, form, categories, onChange, onSave, onDelete, onClose, saving,
}: {
  type: TrackerType; form: ItemForm; categories: CategoryRow[];
  onChange: (f: ItemForm) => void; onSave: () => void; onDelete: () => void; onClose: () => void; saving: boolean;
}) {
  const set = <K extends keyof ItemForm>(k: K, v: ItemForm[K]) => {
    const next = { ...form, [k]: v };
    if (k === 'title' && form.id === 'new') next.slug = slugify(v as string);
    onChange(next);
  };
  const noun = type === 'integrations' ? 'Integration' : type === 'automation' ? 'Process' : 'Use Case';

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-auto sm:mt-0 w-full sm:max-w-3xl sm:mx-4 max-h-[92vh] sm:max-h-[90vh] flex flex-col bg-neutral-50 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 bg-white border-b border-neutral-100">
          <span className="text-sm font-semibold text-neutral-900">{form.id === 'new' ? `New ${noun}` : `Edit ${noun}`}</span>
          <button onClick={onClose} className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-neutral-500 hover:bg-neutral-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6">
          <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={type === 'integrations' ? 'Platform name' : 'Title'}>
                <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} />
              </Field>
              <Field label="ID / slug">
                <input className={inputCls} value={form.slug} onChange={e => set('slug', e.target.value)} />
              </Field>
            </div>

            {categories.length > 0 && (
              <Field label="Category">
                <select className={inputCls} value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.label}</option>)}
                </select>
              </Field>
            )}

            <Field label={type === 'integrations' ? 'Short blurb' : 'Summary'}>
              <textarea className={textareaCls} style={{ minHeight: 56 }} value={form.summary} onChange={e => set('summary', e.target.value)} />
            </Field>

            {type === 'integrations' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Tag (e.g. EHR, Accounting)">
                  <input className={inputCls} value={form.tag} onChange={e => set('tag', e.target.value)} />
                </Field>
                <Field label="Link URL (optional)">
                  <input className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://…" />
                </Field>
              </div>
            )}

            {type === 'usecases' && (
              <>
                <Field label="Category label">
                  <input className={inputCls} value={form.category} onChange={e => set('category', e.target.value)} list="uc-cats" />
                  <datalist id="uc-cats">
                    {['Resident Care', 'Operations & Admin', 'Staff & Workforce', 'Sales & Admissions', 'Quality & Compliance', 'Family & Community'].map(c => <option key={c} value={c} />)}
                  </datalist>
                </Field>
                <Field label="Description">
                  <textarea className={textareaCls} style={{ minHeight: 100 }} value={form.description} onChange={e => set('description', e.target.value)} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Business Value (one per line)"><textarea className={textareaCls} value={form.businessValue} onChange={e => set('businessValue', e.target.value)} /></Field>
                  <Field label="Tech Stack (one per line)"><textarea className={textareaCls} value={form.techStack} onChange={e => set('techStack', e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Limitations (one per line)"><textarea className={textareaCls} value={form.limitations} onChange={e => set('limitations', e.target.value)} /></Field>
                  <Field label="Compliance Flags (one per line)"><textarea className={textareaCls} value={form.complianceFlags} onChange={e => set('complianceFlags', e.target.value)} /></Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Owner"><input className={inputCls} value={form.owner} onChange={e => set('owner', e.target.value)} /></Field>
                  <Field label="Last Updated"><input type="date" className={inputCls} value={form.lastUpdated} onChange={e => set('lastUpdated', e.target.value)} /></Field>
                </div>
              </>
            )}

            {type === 'automation' && (
              <>
                <Field label="Description">
                  <textarea className={textareaCls} style={{ minHeight: 100 }} value={form.description} onChange={e => set('description', e.target.value)} />
                </Field>
                <Field label="Process Flow (steps)">
                  <StepsEditor steps={form.steps} onChange={s => onChange({ ...form, steps: s })} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Business Value (one per line)"><textarea className={textareaCls} value={form.businessValue} onChange={e => set('businessValue', e.target.value)} /></Field>
                  <Field label="Tech Stack (one per line)"><textarea className={textareaCls} value={form.techStack} onChange={e => set('techStack', e.target.value)} /></Field>
                </div>
              </>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
              <div>{form.id !== 'new' && (
                <button onClick={onDelete} disabled={saving} className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50">Delete</button>
              )}</div>
              <button onClick={onSave} disabled={saving || !form.title.trim()} className="px-6 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-40">
                {saving ? 'Saving…' : form.id === 'new' ? `Create ${noun}` : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
type Tab = 'content' | 'trackers' | 'users';

export default function AdminPanel() {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [tab, setTab] = useState<Tab>('content');
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [trackers, setTrackers] = useState<TrackerRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [editors, setEditors] = useState<ProfileRow[]>([]);
  const [selectedTrackerId, setSelectedTrackerId] = useState('');
  const [itemForm, setItemForm] = useState<ItemForm | null>(null);

  // Auth bootstrap
  useEffect(() => {
    if (!configured) { setAuthReady(true); return; }
    const sb = getSupabase();
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  // Load profile + data when signed in
  useEffect(() => { if (session) void loadAll(); else { setProfile(null); setTrackers([]); } }, [session]);

  async function loadAll() {
    const sb = getSupabase();
    const uid = session!.user.id;
    const { data: prof } = await sb.from('profiles').select('*').eq('id', uid).single();
    const p = (prof as ProfileRow) ?? { id: uid, role: 'editor', tracker_id: null, email: session!.user.email ?? null };
    setProfile(p);

    const [tRes, cRes, iRes] = await Promise.all([
      sb.from('trackers').select('*').order('position'),
      sb.from('categories').select('*').order('position'),
      sb.from('items').select('*').order('position'),
    ]);
    let trs = (tRes.data as TrackerRow[]) ?? [];
    if (p.role !== 'admin' && p.tracker_id) trs = trs.filter(t => t.id === p.tracker_id);
    setTrackers(trs);
    setCategories((cRes.data as CategoryRow[]) ?? []);
    setItems((iRes.data as ItemRow[]) ?? []);
    setSelectedTrackerId(prev => (trs.some(t => t.id === prev) ? prev : trs[0]?.id ?? ''));
    if (p.role !== 'admin') setTab('content');

    if (p.role === 'admin') {
      const { data: eds } = await sb.from('profiles').select('*').eq('role', 'editor');
      setEditors((eds as ProfileRow[]) ?? []);
    }
  }

  const isAdmin = profile?.role === 'admin';
  const activeTracker = trackers.find(t => t.id === selectedTrackerId);
  const activeType = (activeTracker?.type ?? 'usecases') as TrackerType;
  const trackerCats = categories.filter(c => c.tracker_id === selectedTrackerId);
  const trackerItems = items.filter(i => i.tracker_id === selectedTrackerId);

  async function accessToken() {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.access_token ?? '';
  }

  // ── Item CRUD ──
  function newItem() {
    const f = emptyItemForm();
    setItemForm(f);
  }
  function editItem(row: ItemRow) { setItemForm(itemToForm(row)); }

  async function saveItem() {
    if (!activeTracker || !itemForm) return;
    setSaving(true); setMsg(null);
    const f = itemForm;
    const payload = {
      tracker_id: activeTracker.id,
      category_id: f.categoryId || null,
      slug: f.slug || slugify(f.title),
      title: f.title.trim(),
      summary: f.summary,
      data: formToData(f, activeType),
    };
    const sb = getSupabase();
    let error;
    if (f.id === 'new') {
      const pos = Math.max(0, ...trackerItems.map(i => i.position)) + 1;
      ({ error } = await sb.from('items').insert({ ...payload, position: pos }));
    } else {
      ({ error } = await sb.from('items').update(payload).eq('id', f.id));
    }
    if (error) { setMsg({ type: 'error', text: error.message }); setSaving(false); return; }
    setItemForm(null);
    await loadAll();
    setMsg({ type: 'ok', text: 'Saved.' });
    setSaving(false);
  }

  async function deleteItem() {
    if (!itemForm || itemForm.id === 'new') return;
    if (!confirm(`Delete "${itemForm.title}"?`)) return;
    setSaving(true);
    const { error } = await getSupabase().from('items').delete().eq('id', itemForm.id);
    if (error) { setMsg({ type: 'error', text: error.message }); setSaving(false); return; }
    setItemForm(null);
    await loadAll();
    setMsg({ type: 'ok', text: 'Deleted.' });
    setSaving(false);
  }

  // ── Render ──
  if (!configured) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
      Supabase is not configured. Set <code>PUBLIC_SUPABASE_URL</code> and <code>PUBLIC_SUPABASE_ANON_KEY</code> in your environment. See <code>supabase/README.md</code>.
    </div>;
  }
  if (!authReady) return <div className="text-neutral-400 text-sm">Loading…</div>;
  if (!session) return <SignIn />;

  const noun = activeType === 'integrations' ? 'integration' : activeType === 'automation' ? 'process' : 'use case';

  return (
    <div className="space-y-6">
      {/* Account bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <button className={tabCls(tab === 'content')} onClick={() => setTab('content')}>Content</button>
          {isAdmin && <button className={tabCls(tab === 'trackers')} onClick={() => setTab('trackers')}>Trackers</button>}
          {isAdmin && <button className={tabCls(tab === 'users')} onClick={() => setTab('users')}>Users</button>}
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm text-neutral-500">
          <span>{profile?.email} · <span className="font-semibold text-neutral-700">{isAdmin ? 'Admin' : 'Editor'}</span></span>
          <button onClick={() => getSupabase().auth.signOut()} className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 text-xs font-semibold hover:bg-neutral-50">Sign out</button>
        </div>
      </div>

      {tab !== 'users' && <Banner msg={msg} />}

      {tab === 'content' && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div className="flex-1 min-w-0 sm:max-w-xs">
              <Label>Tracker</Label>
              <select className={inputCls} value={selectedTrackerId} onChange={e => setSelectedTrackerId(e.target.value)} disabled={trackers.length === 0}>
                {trackers.length === 0 ? <option value="">No trackers</option> :
                  trackers.map(t => <option key={t.id} value={t.id}>{t.title} · {t.type}</option>)}
              </select>
            </div>
            {activeTracker && (
              <button onClick={newItem} className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90">
                + Add {noun}
              </button>
            )}
          </div>

          {activeTracker && (activeType === 'integrations' || activeType === 'automation') && (
            <CategoryManager
              tracker={activeTracker} categories={trackerCats} saving={saving}
              onChanged={loadAll} setSaving={setSaving} setMsg={setMsg}
            />
          )}

          <div className="text-xs text-neutral-400 mb-4 font-medium">
            {trackerItems.length} {noun}{trackerItems.length === 1 ? '' : 's'} in {activeTracker?.title ?? 'this tracker'}
          </div>

          {trackerItems.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-neutral-400 rounded-xl border border-dashed border-neutral-200 text-sm">
              No {noun}s yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {trackerItems.map(it => (
                <button key={it.id} onClick={() => editItem(it)}
                  className="text-left bg-white rounded-xl border border-neutral-200 p-4 hover:border-brand hover:shadow-md transition-all">
                  <h3 className="text-sm font-semibold text-neutral-900 leading-snug">{it.title}</h3>
                  {it.summary && <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{it.summary}</p>}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {it.category_id && (
                      <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-medium">
                        {trackerCats.find(c => c.id === it.category_id)?.label ?? 'Category'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'trackers' && isAdmin && (
        <TrackersTab trackers={trackers} saving={saving} setSaving={setSaving} setMsg={setMsg} onChanged={loadAll} />
      )}

      {tab === 'users' && isAdmin && (
        <UsersTab editors={editors} trackers={trackers} getToken={accessToken} onChanged={loadAll} />
      )}

      {itemForm && activeTracker && (
        <ItemEditor type={activeType} form={itemForm} categories={trackerCats}
          onChange={setItemForm} onSave={saveItem} onDelete={deleteItem} onClose={() => setItemForm(null)} saving={saving} />
      )}
    </div>
  );
}

const tabCls = (active: boolean) => `px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${active ? 'bg-brand text-white' : 'text-neutral-600 hover:bg-neutral-100'}`;

// ── Category manager (integrations / automation) ──────────────────────────────
function CategoryManager({
  tracker, categories, saving, onChanged, setSaving, setMsg,
}: {
  tracker: TrackerRow; categories: CategoryRow[]; saving: boolean;
  onChanged: () => Promise<void>; setSaving: (b: boolean) => void; setMsg: (m: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('');

  async function add() {
    if (!label.trim()) return;
    setSaving(true);
    const pos = Math.max(0, ...categories.map(c => c.position)) + 1;
    const { error } = await getSupabase().from('categories').insert({
      tracker_id: tracker.id, slug: slugify(label), label: label.trim(), icon: icon.trim() || null, position: pos,
    });
    if (error) setMsg({ type: 'error', text: error.message });
    else { setLabel(''); setIcon(''); await onChanged(); }
    setSaving(false);
  }
  async function remove(id: string) {
    if (!confirm('Delete this category? Items in it become uncategorized.')) return;
    setSaving(true);
    const { error } = await getSupabase().from('categories').delete().eq('id', id);
    if (error) setMsg({ type: 'error', text: error.message });
    else await onChanged();
    setSaving(false);
  }

  return (
    <div className="mb-6 rounded-xl border border-neutral-200 bg-white">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-700">
        <span>Categories ({categories.length})</span>
        <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 pt-3">
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 text-sm text-neutral-700">
                {c.icon && <span>{c.icon}</span>}{c.label}
                <button onClick={() => remove(c.id)} className="text-neutral-400 hover:text-red-500">✕</button>
              </span>
            ))}
            {categories.length === 0 && <span className="text-xs text-neutral-400 italic">No categories yet.</span>}
          </div>
          <div className="flex gap-2">
            <input className={`${inputCls} w-16`} placeholder="🏥" value={icon} onChange={e => setIcon(e.target.value)} />
            <input className={inputCls} placeholder="Category label" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
            <button onClick={add} disabled={saving || !label.trim()} className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-40 flex-shrink-0">Add</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Trackers tab (admin) ──────────────────────────────────────────────────────
function TrackersTab({
  trackers, saving, setSaving, setMsg, onChanged,
}: {
  trackers: TrackerRow[]; saving: boolean; setSaving: (b: boolean) => void; setMsg: (m: any) => void; onChanged: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<TrackerRow | 'new' | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TrackerType>('usecases');
  const [configText, setConfigText] = useState('{}');

  function start(t: TrackerRow | 'new') {
    setEdit(t);
    if (t === 'new') { setTitle(''); setSlug(''); setDescription(''); setType('usecases'); setConfigText('{}'); }
    else { setTitle(t.title); setSlug(t.slug); setDescription(t.description ?? ''); setType(t.type as TrackerType); setConfigText(JSON.stringify(t.config ?? {}, null, 2)); }
  }

  async function save() {
    if (!title.trim()) return;
    let config: any = {};
    try { config = configText.trim() ? JSON.parse(configText) : {}; }
    catch { setMsg({ type: 'error', text: 'Config is not valid JSON.' }); return; }
    setSaving(true);
    const sb = getSupabase();
    let error;
    if (edit === 'new') {
      const pos = Math.max(0, ...trackers.map(t => t.position)) + 1;
      ({ error } = await sb.from('trackers').insert({ slug: slug || slugify(title), title: title.trim(), description: description || null, type, config, position: pos }));
    } else if (edit) {
      ({ error } = await sb.from('trackers').update({ slug: slug || slugify(title), title: title.trim(), description: description || null, type, config }).eq('id', edit.id));
    }
    if (error) { setMsg({ type: 'error', text: error.message }); setSaving(false); return; }
    setEdit(null); await onChanged(); setMsg({ type: 'ok', text: 'Tracker saved.' }); setSaving(false);
  }

  async function remove(t: TrackerRow) {
    if (!confirm(`Delete tracker "${t.title}" and all its content?`)) return;
    setSaving(true);
    const { error } = await getSupabase().from('trackers').delete().eq('id', t.id);
    if (error) setMsg({ type: 'error', text: error.message });
    else { if (edit !== 'new' && edit?.id === t.id) setEdit(null); await onChanged(); }
    setSaving(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <span className="text-sm font-semibold text-neutral-700">{trackers.length} Trackers</span>
          <button onClick={() => start('new')} className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand/90">+ Add</button>
        </div>
        {trackers.map(t => (
          <div key={t.id} onClick={() => start(t)} className={`flex items-center gap-2 px-4 py-3 border-b border-neutral-100 last:border-b-0 cursor-pointer hover:bg-neutral-50 ${edit !== 'new' && edit?.id === t.id ? 'bg-brand/5 border-l-2 border-l-brand' : ''}`}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-neutral-900 truncate">{t.title}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{t.type}</div>
            </div>
            <button onClick={e => { e.stopPropagation(); remove(t); }} className="p-1 rounded text-neutral-300 hover:text-red-500">✕</button>
          </div>
        ))}
      </div>

      <div className="lg:col-span-2">
        {edit === null ? (
          <div className="h-48 flex items-center justify-center text-neutral-400 rounded-xl border border-dashed border-neutral-200 text-sm">Select a tracker or click Add</div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name"><input className={inputCls} value={title} onChange={e => { setTitle(e.target.value); if (edit === 'new') setSlug(slugify(e.target.value)); }} /></Field>
              <Field label="Slug"><input className={inputCls} value={slug} onChange={e => setSlug(e.target.value)} /></Field>
            </div>
            <Field label="Type">
              <select className={inputCls} value={type} onChange={e => setType(e.target.value as TrackerType)}>
                <option value="usecases">Use Cases</option>
                <option value="integrations">Integrations</option>
                <option value="automation">Automation Processes</option>
              </select>
            </Field>
            <Field label="Description"><textarea className={textareaCls} style={{ minHeight: 60 }} value={description} onChange={e => setDescription(e.target.value)} /></Field>
            <Field label="Page config (JSON — hero, stats, cta)">
              <textarea className={`${textareaCls} font-mono text-xs`} style={{ minHeight: 140 }} value={configText} onChange={e => setConfigText(e.target.value)} />
            </Field>
            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button onClick={save} disabled={saving || !title.trim()} className="px-6 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-40">
                {saving ? 'Saving…' : edit === 'new' ? 'Create Tracker' : 'Save Tracker'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Users tab (admin) ─────────────────────────────────────────────────────────
function UsersTab({
  editors, trackers, getToken, onChanged,
}: {
  editors: ProfileRow[]; trackers: TrackerRow[]; getToken: () => Promise<string>; onChanged: () => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [trackerId, setTrackerId] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  async function create() {
    if (!email.trim() || password.length < 6) { setMsg({ type: 'error', text: 'Email + password (6+ chars) required.' }); return; }
    setBusy(true); setMsg(null);
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify({ email: email.trim(), password, trackerId: trackerId || null }),
    });
    if (!res.ok) { setMsg({ type: 'error', text: await res.text() }); setBusy(false); return; }
    setEmail(''); setPassword(''); setTrackerId('');
    await onChanged(); setMsg({ type: 'ok', text: 'Editor created.' }); setBusy(false);
  }
  async function remove(u: ProfileRow) {
    if (!confirm(`Remove ${u.email}?`)) return;
    setBusy(true);
    const res = await fetch('/api/admin/users', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getToken()}` },
      body: JSON.stringify({ userId: u.id }),
    });
    if (!res.ok) setMsg({ type: 'error', text: await res.text() });
    else await onChanged();
    setBusy(false);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900">Create editor</h3>
        <Field label="Email"><input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} type="email" /></Field>
        <Field label="Temporary password"><input className={inputCls} value={password} onChange={e => setPassword(e.target.value)} type="text" placeholder="min 6 characters" /></Field>
        <Field label="Assigned tracker">
          <select className={inputCls} value={trackerId} onChange={e => setTrackerId(e.target.value)}>
            <option value="">— None —</option>
            {trackers.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </Field>
        <Banner msg={msg} />
        <button onClick={create} disabled={busy} className="px-5 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand/90 disabled:opacity-40">
          {busy ? 'Working…' : 'Create editor'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 text-sm font-semibold text-neutral-700">{editors.length} editors</div>
        {editors.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-400">No editors yet.</div>
        ) : editors.map(u => (
          <div key={u.id} className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 last:border-b-0">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-neutral-800 truncate">{u.email}</div>
              <div className="text-xs text-neutral-400">{trackers.find(t => t.id === u.tracker_id)?.title ?? 'Unassigned'}</div>
            </div>
            <button onClick={() => remove(u)} className="p-1 rounded text-neutral-300 hover:text-red-500">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
