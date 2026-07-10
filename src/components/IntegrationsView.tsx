import { useMemo, useState } from 'react';
import type { Tracker, Integration, Category } from '../types';

// Light, brand-accented integrations page. Matches the rest of the (light) app
// with extra color: a soft blue wash in the hero, gradient headings, and colorful
// category chips. All styles are scoped under `.iv-root`. Data-driven from the tracker.

const STYLES = `
.iv-root{
  --brand:#069BDF;--brand-2:#0EA5B5;--brand-3:#6366F1;--brand-dark:#0284b8;
  --ink:#0f172a;--muted:#64748b;--line:#e6ecf3;
  --font-d:'Outfit',sans-serif;--font-b:'Nunito Sans',sans-serif;
  position:relative;color:var(--ink);font-family:var(--font-b);
  font-size:16px;line-height:1.7;min-height:100vh;overflow:hidden;
  background:
    radial-gradient(1100px 460px at 50% -140px,rgba(6,155,223,.13),transparent 70%),
    radial-gradient(900px 420px at 88% 8%,rgba(99,102,241,.07),transparent 65%),
    linear-gradient(180deg,#f6fbff 0%,#ffffff 46%);
}
.iv-root *,.iv-root *::before,.iv-root *::after{box-sizing:border-box;}
.iv-grid{position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(6,155,223,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(6,155,223,.05) 1px,transparent 1px);
  background-size:52px 52px;mask-image:linear-gradient(180deg,#000,transparent 55%);-webkit-mask-image:linear-gradient(180deg,#000,transparent 55%);}

.iv-hero{padding:60px 52px 40px;text-align:center;position:relative;z-index:1;}
.iv-eyebrow{display:inline-flex;align-items:center;gap:9px;background:rgba(6,155,223,.1);border:1px solid rgba(6,155,223,.25);border-radius:100px;padding:6px 16px;font-family:var(--font-d);font-size:10.5px;font-weight:700;color:var(--brand-dark);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:22px;}
.iv-eyebrow::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--brand);animation:ivpulse 2s infinite;}
@keyframes ivpulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(1.4);}}
.iv-hero h1{font-family:var(--font-d);font-size:clamp(30px,4vw,50px);font-weight:800;line-height:1.08;letter-spacing:-1.5px;margin:0 0 18px;color:var(--ink);}
.iv-hero h1 em{background:linear-gradient(90deg,var(--brand),var(--brand-2));-webkit-background-clip:text;background-clip:text;color:transparent;font-style:normal;}
.iv-sub{font-size:16px;color:var(--muted);max-width:560px;margin:0 auto;line-height:1.85;}

.iv-stats{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:34px;}
.iv-stat{padding:12px 34px;border-right:1px solid var(--line);}
.iv-stat:last-child{border-right:none;}
.iv-stat-num{font-family:var(--font-d);font-size:26px;font-weight:800;background:linear-gradient(90deg,var(--brand),var(--brand-2));-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-1px;line-height:1;}
.iv-stat-label{font-size:11.5px;color:var(--muted);margin-top:4px;}

.iv-filter{padding:0 52px 34px;position:relative;z-index:1;}
.iv-filter-bar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
.iv-fbtn{font-family:var(--font-d);font-size:12px;font-weight:600;padding:8px 18px;border-radius:100px;border:1.5px solid var(--line);color:var(--muted);background:#fff;cursor:pointer;transition:all .18s;letter-spacing:.3px;}
.iv-fbtn:hover{border-color:var(--brand);color:var(--ink);}
.iv-fbtn.active{background:var(--brand);border-color:var(--brand);color:#fff;box-shadow:0 6px 16px rgba(6,155,223,.28);}

.iv-cats{padding:0 52px 72px;position:relative;z-index:1;display:flex;flex-direction:column;gap:16px;max-width:1200px;margin:0 auto;}
.iv-cat{border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04);transition:box-shadow .2s,border-color .2s;}
.iv-cat:hover{box-shadow:0 8px 26px rgba(15,23,42,.08);border-color:rgba(6,155,223,.28);}
.iv-cat-head{display:flex;align-items:center;gap:16px;padding:18px 22px;cursor:pointer;user-select:none;transition:background .18s;width:100%;text-align:left;background:transparent;border:none;color:inherit;}
.iv-cat-head:hover{background:rgba(6,155,223,.04);}
.iv-cat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid rgba(6,155,223,.2);background:linear-gradient(135deg,rgba(6,155,223,.14),rgba(14,165,181,.14));}
.iv-cat-label{font-family:var(--font-d);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--brand);margin-bottom:2px;}
.iv-cat-title{font-family:var(--font-d);font-size:19px;font-weight:800;letter-spacing:-0.4px;color:var(--ink);}
.iv-cat-count{font-family:var(--font-d);font-size:11px;font-weight:700;color:var(--muted);background:#f1f5f9;border:1px solid var(--line);padding:3px 12px;border-radius:100px;flex-shrink:0;}
.iv-chevron{margin-left:auto;color:#94a3b8;transition:transform .22s;flex-shrink:0;}
.iv-chevron.open{transform:rotate(180deg);}
.iv-cat-body{padding:0 22px 22px;}
.iv-logo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}
.iv-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:9px;position:relative;overflow:hidden;transition:border-color .22s,background .22s,transform .18s,box-shadow .22s;min-height:96px;}
.iv-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--brand),transparent);opacity:0;transition:opacity .22s;}
.iv-card:hover{border-color:rgba(6,155,223,.4);background:#fbfdff;transform:translateY(-2px);box-shadow:0 12px 28px rgba(6,155,223,.14);}
.iv-card:hover::before{opacity:1;}
.iv-card-name{font-family:var(--font-d);font-size:16px;font-weight:700;color:var(--ink);letter-spacing:-0.2px;line-height:1.2;}
.iv-card-desc{font-size:12px;color:var(--muted);line-height:1.55;}
.iv-card-foot{display:flex;align-items:center;gap:10px;margin-top:auto;padding-top:4px;}
.iv-tag{font-family:var(--font-d);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--brand-dark);background:rgba(6,155,223,.1);border:1px solid rgba(6,155,223,.18);padding:2px 9px;border-radius:3px;}
.iv-link{font-family:var(--font-d);font-size:11px;font-weight:600;color:var(--brand);text-decoration:none;}
.iv-link:hover{text-decoration:underline;}
.iv-empty{text-align:center;color:var(--muted);padding:60px 20px;font-size:14px;}

@media(max-width:860px){
  .iv-hero{padding:48px 18px 34px;}
  .iv-filter{padding:0 18px 26px;}
  .iv-cats{padding:0 18px 56px;}
  .iv-logo-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}
  .iv-stat{padding:10px 20px;}
}
`;

const Chevron = ({ open }: { open: boolean }) => (
  <svg className={`iv-chevron${open ? ' open' : ''}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function IntegrationCard({ it }: { it: Integration }) {
  return (
    <div className="iv-card">
      <div className="iv-card-name">{it.title}</div>
      {it.summary && <div className="iv-card-desc">{it.summary}</div>}
      <div className="iv-card-foot">
        {it.tag && <span className="iv-tag">{it.tag}</span>}
        {it.url && (
          <a className="iv-link" href={it.url} target="_blank" rel="noopener noreferrer">Visit ↗</a>
        )}
      </div>
    </div>
  );
}

export default function IntegrationsView({ tracker }: { tracker: Tracker }) {
  const { config } = tracker;
  const categories = tracker.categories;
  const items = tracker.integrations;

  // Integrations with no category fall into a synthetic "Other" bucket.
  const uncategorized = items.filter(i => !i.categoryId || !categories.some(c => c.id === i.categoryId));

  const [filter, setFilter] = useState<string>('all');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const itemsByCat = useMemo(() => {
    const map: Record<string, Integration[]> = {};
    for (const c of categories) map[c.id] = items.filter(i => i.categoryId === c.id);
    return map;
  }, [categories, items]);

  const heroHeading = config.hero?.heading ?? `${tracker.title}`;
  const stats = config.stats ?? [];

  const toggle = (id: string) => setOpen(o => ({ ...o, [id]: !o[id] }));

  const visibleCats = filter === 'all' ? categories : categories.filter(c => c.slug === filter);
  const showUncat = (filter === 'all' || filter === 'other') && uncategorized.length > 0;

  return (
    <div className="iv-root">
      <style>{STYLES}</style>
      <div className="iv-grid" />

      {/* Hero */}
      <div className="iv-hero">
        {config.hero?.eyebrow && <div className="iv-eyebrow">{config.hero.eyebrow}</div>}
        <h1 dangerouslySetInnerHTML={{ __html: heroHeading }} />
        {config.hero?.sub && <p className="iv-sub">{config.hero.sub}</p>}
        {stats.length > 0 && (
          <div className="iv-stats">
            {stats.map((s, i) => (
              <div className="iv-stat" key={i}>
                <div className="iv-stat-num">{s.num}</div>
                <div className="iv-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter bar */}
      {categories.length > 0 && (
        <div className="iv-filter">
          <div className="iv-filter-bar">
            <button className={`iv-fbtn${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
              All Categories
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                className={`iv-fbtn${filter === c.slug ? ' active' : ''}`}
                onClick={() => { setFilter(c.slug); setOpen(o => ({ ...o, [c.id]: true })); }}
              >
                {c.icon ? `${c.icon} ` : ''}{c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category blocks (collapsible — open to reveal the integrations inside) */}
      <div className="iv-cats">
        {visibleCats.map((c, idx) => {
          const list = itemsByCat[c.id] ?? [];
          const isOpen = !!open[c.id] || filter === c.slug;
          return (
            <div className="iv-cat" key={c.id}>
              <button className="iv-cat-head" onClick={() => toggle(c.id)} aria-expanded={isOpen}>
                <div className="iv-cat-icon">{c.icon ?? '🔗'}</div>
                <div>
                  <div className="iv-cat-label">Category {String(idx + 1).padStart(2, '0')}</div>
                  <div className="iv-cat-title">{c.label}</div>
                </div>
                <div className="iv-cat-count">{list.length} {list.length === 1 ? 'platform' : 'platforms'}</div>
                <Chevron open={isOpen} />
              </button>
              {isOpen && (
                <div className="iv-cat-body">
                  {list.length > 0 ? (
                    <div className="iv-logo-grid">
                      {list.map(it => <IntegrationCard key={it.id} it={it} />)}
                    </div>
                  ) : (
                    <div className="iv-empty">No integrations in this category yet.</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {showUncat && (
          <div className="iv-cat">
            <button className="iv-cat-head" onClick={() => toggle('__uncat')} aria-expanded={!!open['__uncat']}>
              <div className="iv-cat-icon">🔗</div>
              <div>
                <div className="iv-cat-label">Other</div>
                <div className="iv-cat-title">Uncategorized</div>
              </div>
              <div className="iv-cat-count">{uncategorized.length} platforms</div>
              <Chevron open={!!open['__uncat']} />
            </button>
            {open['__uncat'] && (
              <div className="iv-cat-body">
                <div className="iv-logo-grid">
                  {uncategorized.map(it => <IntegrationCard key={it.id} it={it} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {categories.length === 0 && uncategorized.length === 0 && (
          <div className="iv-empty">No integrations yet. Add some from the Manage section.</div>
        )}
      </div>
    </div>
  );
}
