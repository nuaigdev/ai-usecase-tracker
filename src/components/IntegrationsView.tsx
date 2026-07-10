import { useMemo, useState } from 'react';
import type { Tracker, Integration, Category } from '../types';

// Dark, teal-accented integrations page ported from nuaig-integrations.html.
// All styles are scoped under `.iv-root` so the dark theme never leaks into the
// rest of the (light) app. Content is data-driven from the tracker.

const STYLES = `
.iv-root{
  --teal:#1a8585;--teal-light:#229999;--teal-dim:rgba(26,133,133,0.12);
  --teal-glow:rgba(26,133,133,0.22);--teal-border:rgba(26,133,133,0.18);
  --dark2:#0b1a1a;--font-d:'Outfit',sans-serif;--font-b:'Nunito Sans',sans-serif;
  position:relative;background:var(--dark2);color:#fff;font-family:var(--font-b);
  font-size:16px;line-height:1.7;min-height:100vh;overflow:hidden;
}
.iv-root *,.iv-root *::before,.iv-root *::after{box-sizing:border-box;}
.iv-grain{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.028;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:128px;}
.iv-grid{position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:linear-gradient(rgba(26,133,133,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(26,133,133,.04) 1px,transparent 1px);
  background-size:52px 52px;}

.iv-hero{padding:72px 52px 48px;text-align:center;position:relative;z-index:1;}
.iv-hero::after{content:'';position:absolute;left:50%;top:0;transform:translateX(-50%);width:700px;height:500px;
  background:radial-gradient(ellipse,rgba(26,133,133,.12) 0%,transparent 65%);pointer-events:none;z-index:-1;}
.iv-eyebrow{display:inline-flex;align-items:center;gap:9px;background:rgba(26,133,133,.1);border:1px solid rgba(26,133,133,.22);border-radius:100px;padding:6px 16px;font-family:var(--font-d);font-size:10.5px;font-weight:700;color:var(--teal-light);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:24px;}
.iv-eyebrow::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--teal-light);animation:ivpulse 2s infinite;}
@keyframes ivpulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(1.4);}}
.iv-hero h1{font-family:var(--font-d);font-size:clamp(30px,4vw,50px);font-weight:800;line-height:1.08;letter-spacing:-1.5px;margin:0 0 18px;color:#fff;}
.iv-hero h1 em{color:var(--teal-light);font-style:normal;}
.iv-sub{font-size:16px;color:rgba(255,255,255,.45);max-width:560px;margin:0 auto;line-height:1.85;}

.iv-stats{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;margin-top:38px;}
.iv-stat{padding:14px 34px;border-right:1px solid rgba(26,133,133,.14);}
.iv-stat:last-child{border-right:none;}
.iv-stat-num{font-family:var(--font-d);font-size:26px;font-weight:800;color:var(--teal-light);letter-spacing:-1px;line-height:1;}
.iv-stat-label{font-size:11.5px;color:rgba(255,255,255,.35);margin-top:3px;}

.iv-filter{padding:0 52px 36px;position:relative;z-index:1;}
.iv-filter-bar{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
.iv-fbtn{font-family:var(--font-d);font-size:12px;font-weight:600;padding:8px 18px;border-radius:100px;border:1.5px solid rgba(26,133,133,.2);color:rgba(255,255,255,.4);background:transparent;cursor:pointer;transition:all .18s;letter-spacing:.3px;}
.iv-fbtn:hover{border-color:rgba(26,133,133,.5);color:rgba(255,255,255,.8);}
.iv-fbtn.active{background:var(--teal);border-color:var(--teal);color:#fff;box-shadow:0 0 18px var(--teal-glow);}

.iv-cats{padding:0 52px 72px;position:relative;z-index:1;display:flex;flex-direction:column;gap:20px;max-width:1200px;margin:0 auto;}
.iv-cat{border:1px solid rgba(26,133,133,.14);border-radius:16px;background:rgba(255,255,255,.02);overflow:hidden;}
.iv-cat-head{display:flex;align-items:center;gap:16px;padding:20px 22px;cursor:pointer;user-select:none;transition:background .18s;width:100%;text-align:left;background:transparent;border:none;color:inherit;}
.iv-cat-head:hover{background:rgba(26,133,133,.05);}
.iv-cat-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid rgba(26,133,133,.2);background:rgba(26,133,133,.08);}
.iv-cat-label{font-family:var(--font-d);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--teal-light);opacity:.7;margin-bottom:2px;}
.iv-cat-title{font-family:var(--font-d);font-size:19px;font-weight:800;letter-spacing:-0.4px;color:#fff;}
.iv-cat-count{font-family:var(--font-d);font-size:11px;font-weight:700;color:rgba(255,255,255,.3);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);padding:3px 12px;border-radius:100px;flex-shrink:0;}
.iv-chevron{margin-left:auto;color:rgba(255,255,255,.3);transition:transform .22s;flex-shrink:0;}
.iv-chevron.open{transform:rotate(180deg);}
.iv-cat-body{padding:0 22px 22px;}
.iv-logo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;}
.iv-card{background:rgba(255,255,255,.03);border:1px solid rgba(26,133,133,.12);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:9px;position:relative;overflow:hidden;transition:border-color .22s,background .22s,transform .18s,box-shadow .22s;min-height:96px;}
.iv-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1.5px;background:linear-gradient(90deg,transparent,var(--teal),transparent);opacity:0;transition:opacity .22s;}
.iv-card:hover{border-color:rgba(26,133,133,.35);background:rgba(26,133,133,.07);transform:translateY(-2px);box-shadow:0 8px 32px rgba(26,133,133,.12);}
.iv-card:hover::before{opacity:1;}
.iv-card-name{font-family:var(--font-d);font-size:16px;font-weight:700;color:rgba(255,255,255,.9);letter-spacing:-0.2px;line-height:1.2;}
.iv-card-desc{font-size:12px;color:rgba(255,255,255,.4);line-height:1.55;}
.iv-card-foot{display:flex;align-items:center;gap:10px;margin-top:auto;padding-top:4px;}
.iv-tag{font-family:var(--font-d);font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--teal-light);opacity:.8;background:rgba(26,133,133,.1);border:1px solid rgba(26,133,133,.15);padding:2px 9px;border-radius:3px;}
.iv-link{font-family:var(--font-d);font-size:11px;font-weight:600;color:var(--teal-light);text-decoration:none;opacity:.85;}
.iv-link:hover{opacity:1;text-decoration:underline;}

.iv-cta{padding:64px 52px;text-align:center;position:relative;z-index:1;border-top:1px solid rgba(26,133,133,.1);}
.iv-cta-label{font-family:var(--font-d);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--teal-light);margin-bottom:14px;opacity:.8;}
.iv-cta-title{font-family:var(--font-d);font-size:clamp(22px,3vw,34px);font-weight:800;letter-spacing:-1px;color:#fff;margin-bottom:12px;line-height:1.1;}
.iv-cta-sub{font-size:15px;color:rgba(255,255,255,.4);max-width:480px;margin:0 auto 28px;line-height:1.8;}
.iv-btn{display:inline-flex;align-items:center;gap:8px;background:var(--teal);color:#fff;padding:13px 26px;border-radius:7px;font-family:var(--font-d);font-size:14px;font-weight:700;text-decoration:none;box-shadow:0 4px 22px var(--teal-glow);transition:background .18s,transform .15s;}
.iv-btn:hover{background:var(--teal-light);transform:translateY(-2px);}
.iv-btn-ghost{display:inline-flex;align-items:center;gap:8px;background:transparent;color:rgba(255,255,255,.45);padding:13px 22px;border-radius:7px;font-family:var(--font-d);font-size:14px;font-weight:600;text-decoration:none;border:1.5px solid rgba(26,133,133,.2);transition:all .18s;margin-left:10px;}
.iv-btn-ghost:hover{border-color:rgba(26,133,133,.4);color:rgba(255,255,255,.75);}
.iv-empty{text-align:center;color:rgba(255,255,255,.35);padding:60px 20px;font-size:14px;}

@media(max-width:860px){
  .iv-hero{padding:56px 18px 40px;}
  .iv-filter{padding:0 18px 28px;}
  .iv-cats{padding:0 18px 56px;}
  .iv-logo-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;}
  .iv-stat{padding:12px 20px;}
  .iv-cta{padding:48px 18px;}
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
  const cta = config.cta;

  const toggle = (id: string) => setOpen(o => ({ ...o, [id]: !o[id] }));

  const visibleCats = filter === 'all' ? categories : categories.filter(c => c.slug === filter);
  const showUncat = (filter === 'all' || filter === 'other') && uncategorized.length > 0;

  return (
    <div className="iv-root">
      <style>{STYLES}</style>
      <div className="iv-grain" />
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

      {/* CTA */}
      {cta && (cta.title || cta.label) && (
        <div className="iv-cta">
          {cta.label && <div className="iv-cta-label">{cta.label}</div>}
          {cta.title && <h2 className="iv-cta-title" dangerouslySetInnerHTML={{ __html: cta.title }} />}
          {cta.sub && <p className="iv-cta-sub">{cta.sub}</p>}
          {cta.href && <a className="iv-btn" href={cta.href}>→ Start a Conversation</a>}
          {cta.email && <a className="iv-btn-ghost" href={`mailto:${cta.email}`}>{cta.email}</a>}
        </div>
      )}
    </div>
  );
}
