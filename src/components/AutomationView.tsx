import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Tracker, AutomationProcess, AutomationStep, AutomationStepKind } from '../types';

// ── Full-screen image viewer ──────────────────────────────────────────────────
// A single workflow image over a blurred backdrop; Esc / backdrop / button close.

function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <img
        src={url}
        alt="Workflow diagram"
        className="relative z-[1] max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl bg-white"
      />
    </div>
  );
}

// ── Flow diagram ──────────────────────────────────────────────────────────────
// Renders steps as depth-ordered columns (left→right) with SVG connectors drawn
// from each step's `next[]`. No external dependency; edges are measured from the
// live DOM so branches and multi-target flows route correctly.

const KIND_STYLE: Record<AutomationStepKind, { box: string; dot: string; label: string }> = {
  trigger: { box: 'bg-emerald-50 border-emerald-300', dot: 'bg-emerald-500', label: 'Trigger' },
  action:  { box: 'bg-white border-brand/40',          dot: 'bg-brand',      label: 'Action' },
  branch:  { box: 'bg-amber-50 border-amber-300',      dot: 'bg-amber-500',  label: 'Branch' },
  end:     { box: 'bg-neutral-100 border-neutral-300', dot: 'bg-neutral-400', label: 'End' },
};

function computeDepths(steps: AutomationStep[]): Map<string, number> {
  const ids = new Set(steps.map(s => s.id));
  const indeg = new Map<string, number>(steps.map(s => [s.id, 0]));
  steps.forEach(s => (s.next ?? []).forEach(n => { if (ids.has(n)) indeg.set(n, (indeg.get(n) ?? 0) + 1); }));

  const depth = new Map<string, number>();
  steps.forEach(s => { if ((indeg.get(s.id) ?? 0) === 0) depth.set(s.id, 0); });
  if (depth.size === 0 && steps.length) depth.set(steps[0].id, 0);

  // Longest-path relaxation (guarded against cycles).
  let guard = 0;
  const max = steps.length * steps.length + 5;
  let changed = true;
  while (changed && guard++ < max) {
    changed = false;
    steps.forEach(s => {
      const d = depth.get(s.id);
      if (d == null) return;
      (s.next ?? []).forEach(n => {
        if (!ids.has(n)) return;
        if ((depth.get(n) ?? -1) < d + 1) { depth.set(n, d + 1); changed = true; }
      });
    });
  }
  steps.forEach(s => { if (!depth.has(s.id)) depth.set(s.id, 0); });
  return depth;
}

function FlowDiagram({ steps }: { steps: AutomationStep[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [edges, setEdges] = useState<{ d: string; key: string }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const columns = useMemo(() => {
    const depth = computeDepths(steps);
    const maxDepth = Math.max(0, ...steps.map(s => depth.get(s.id) ?? 0));
    const cols: AutomationStep[][] = Array.from({ length: maxDepth + 1 }, () => []);
    steps.forEach(s => cols[depth.get(s.id) ?? 0].push(s));
    return cols;
  }, [steps]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function measure() {
      const cont = containerRef.current;
      if (!cont) return;
      const cr = cont.getBoundingClientRect();
      const next: { d: string; key: string }[] = [];
      for (const s of steps) {
        const from = nodeRefs.current[s.id];
        if (!from) continue;
        const fr = from.getBoundingClientRect();
        const x1 = fr.right - cr.left + cont.scrollLeft;
        const y1 = fr.top + fr.height / 2 - cr.top + cont.scrollTop;
        for (const n of s.next ?? []) {
          const to = nodeRefs.current[n];
          if (!to) continue;
          const tr = to.getBoundingClientRect();
          const x2 = tr.left - cr.left + cont.scrollLeft;
          const y2 = tr.top + tr.height / 2 - cr.top + cont.scrollTop;
          const mx = x1 + (x2 - x1) / 2;
          next.push({ key: `${s.id}->${n}`, d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}` });
        }
      }
      setEdges(next);
      setSize({ w: cont.scrollWidth, h: cont.scrollHeight });
    }

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [steps, columns]);

  if (steps.length === 0) {
    return <p className="text-sm text-neutral-400 italic">No flow steps defined.</p>;
  }

  return (
    <div ref={containerRef} className="relative overflow-x-auto pb-2">
      <svg className="absolute top-0 left-0 pointer-events-none" width={size.w} height={size.h}
           style={{ zIndex: 0 }}>
        <defs>
          <marker id="flow-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
          </marker>
        </defs>
        {edges.map(e => (
          <path key={e.key} d={e.d} fill="none" stroke="#94a3b8" strokeWidth="1.5"
                markerEnd="url(#flow-arrow)" opacity="0.7" />
        ))}
      </svg>

      <div className="relative flex gap-12 items-center min-w-min" style={{ zIndex: 1 }}>
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-6 justify-center flex-shrink-0">
            {col.map(step => {
              const st = KIND_STYLE[step.kind] ?? KIND_STYLE.action;
              return (
                <div
                  key={step.id}
                  ref={el => { nodeRefs.current[step.id] = el; }}
                  className={`w-48 rounded-xl border p-3.5 shadow-sm ${st.box}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{st.label}</span>
                  </div>
                  <div className="text-sm font-semibold text-neutral-900 leading-snug">{step.title}</div>
                  {step.desc && <div className="text-xs text-neutral-500 mt-1 leading-relaxed">{step.desc}</div>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Process card ──────────────────────────────────────────────────────────────

function Bullet({ items }: { items: string[] }) {
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

function ProcessCard({ p, expanded, onToggle, onOpenImage }: {
  p: AutomationProcess; expanded: boolean; onToggle: () => void; onOpenImage: (url: string) => void;
}) {
  return (
    <div className={`bg-white rounded-2xl border transition-all duration-300 ${
      expanded ? 'border-brand shadow-lg shadow-brand/10' : 'border-neutral-200 hover:border-neutral-300 hover:shadow-md'
    }`}>
      <button onClick={onToggle} className="w-full text-left p-5 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {p.steps.length} step{p.steps.length === 1 ? '' : 's'}
              </span>
              {p.workflowImage && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                  </svg>
                  Workflow
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 leading-snug">{p.title}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{p.summary}</p>
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
          {p.description && <p className="text-sm text-neutral-700 leading-relaxed">{p.description}</p>}

          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Process Flow</h4>
            <div className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
              <FlowDiagram steps={p.steps} />
            </div>
          </div>

          {p.workflowImage && (
            <div>
              <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Workflow</h4>
              <button
                onClick={() => onOpenImage(p.workflowImage!)}
                className="block w-full rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden cursor-zoom-in group"
                aria-label="Open workflow image full screen"
              >
                <img
                  src={p.workflowImage}
                  alt={`${p.title} workflow`}
                  loading="lazy"
                  className="w-full max-h-[460px] object-contain bg-white transition-transform group-hover:scale-[1.01]"
                />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {p.businessValue.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Business Value</h4>
                <Bullet items={p.businessValue} />
              </div>
            )}
            {p.techStack.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {p.techStack.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-xs font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AutomationView({ tracker }: { tracker: Tracker }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const processes = tracker.processes;

  if (processes.length === 0) {
    return (
      <div className="text-center py-24 text-neutral-400">
        <p className="text-sm">No automation processes yet. Add some from the Manage section.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {processes.map(p => (
        <ProcessCard
          key={p.id}
          p={p}
          expanded={expandedId === p.id}
          onToggle={() => setExpandedId(expandedId === p.id ? null : p.id)}
          onOpenImage={setLightboxUrl}
        />
      ))}
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}
