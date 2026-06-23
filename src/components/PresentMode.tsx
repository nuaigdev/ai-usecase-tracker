import { useState, useEffect, useCallback, useRef } from 'react';
import type { UseCase } from '../data/usecases';

// ─── Brand / style constants ──────────────────────────────────────────────────

const BRAND = '#069BDF';
const BG = '#070c1a'; // slide background — must match gradient base for fade to work

const CAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Operations:             { bg: 'rgba(167,139,250,0.15)', text: '#c4b5fd', border: 'rgba(167,139,250,0.4)' },
  Clinical:               { bg: 'rgba(248,113,113,0.15)', text: '#fca5a5', border: 'rgba(248,113,113,0.4)' },
  'Voice AI':             { bg: 'rgba(56,189,248,0.15)',  text: '#7dd3fc', border: 'rgba(56,189,248,0.4)'  },
  'Staff Tools':          { bg: 'rgba(129,140,248,0.15)', text: '#a5b4fc', border: 'rgba(129,140,248,0.4)' },
  'Marketing & Comms':    { bg: 'rgba(52,211,153,0.15)',  text: '#6ee7b7', border: 'rgba(52,211,153,0.4)'  },
  'Sales & Finance':      { bg: 'rgba(251,146,60,0.15)',  text: '#fdba74', border: 'rgba(251,146,60,0.4)'  },
  'Quality & Compliance': { bg: 'rgba(74,222,128,0.15)',  text: '#86efac', border: 'rgba(74,222,128,0.4)'  },
};

const STATUS_COLORS = {
  planned:       { text: '#94a3b8', bg: 'rgba(148,163,184,0.15)', dot: '#94a3b8', label: 'Planned'     },
  'in-progress': { text: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  dot: '#fbbf24', label: 'In Progress' },
  live:          { text: '#34d399', bg: 'rgba(52,211,153,0.15)',  dot: '#34d399', label: 'Live'        },
};

function catColor(cat: string) {
  return CAT_COLORS[cat] ?? { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8', border: 'rgba(148,163,184,0.4)' };
}

// Fade-to-bg gradient that clips content gracefully without a scrollbar
function BottomFade({ height = 64 }: { height?: number }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{ height, background: `linear-gradient(to bottom, transparent, ${BG})` }}
    />
  );
}

// ─── CSS keyframes ────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes pmFadeInRight {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pmFadeInLeft {
    from { opacity: 0; transform: translateX(-48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes pmFadeIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pmSlideUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pmPulse {
    0%, 100% { opacity: 0.5; }
    50%       { opacity: 1; }
  }
`;

// ─── Title slide ──────────────────────────────────────────────────────────────

function TitleSlide() {
  return (
    <div
      className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-8"
      style={{ animation: 'pmFadeIn 0.7s ease-out forwards' }}
    >
      <div style={{ animation: 'pmSlideUp 0.6s 0.1s ease-out both' }}>
        <img src="/logo-white.svg" alt="NuAig" className="h-14 w-auto mx-auto mb-10" />
      </div>

      <div
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-semibold tracking-widest uppercase"
        style={{
          background: 'rgba(6,155,223,0.15)',
          color: BRAND,
          border: '1px solid rgba(6,155,223,0.35)',
          animation: 'pmSlideUp 0.6s 0.2s ease-out both',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND, animation: 'pmPulse 2s infinite' }} />
        AI Strategy Briefing
      </div>

      <h1
        className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight"
        style={{ animation: 'pmSlideUp 0.6s 0.3s ease-out both' }}
      >
        AI-Powered Solutions<br />
        <span style={{ color: BRAND }}>for Senior Living</span>
      </h1>

      <p className="text-lg text-white/50 mb-12 font-light tracking-wide" style={{ animation: 'pmSlideUp 0.6s 0.4s ease-out both' }}>
        Intelligent Agents · Reducing Caregiver Burnout Through Automation
      </p>

      <div className="text-sm text-white/30 mb-16" style={{ animation: 'pmSlideUp 0.6s 0.5s ease-out both' }}>
        {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>

      <div className="flex items-center gap-2 text-xs text-white/25" style={{ animation: 'pmSlideUp 0.6s 0.7s ease-out both' }}>
        Press{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">→</kbd>
        {' '}or{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-xs">Space</kbd>
        {' '}to begin
      </div>
    </div>
  );
}

// ─── Closing slide ────────────────────────────────────────────────────────────

function ClosingSlide() {
  return (
    <div
      className="flex-1 min-h-0 flex flex-col items-center justify-center text-center px-8"
      style={{ animation: 'pmFadeIn 0.7s ease-out forwards' }}
    >
      <div style={{ animation: 'pmSlideUp 0.6s 0.1s ease-out both' }}>
        <img src="/logo-white.svg" alt="NuAig" className="h-12 w-auto mx-auto mb-12" />
      </div>

      <h2
        className="text-6xl sm:text-7xl font-extrabold text-white mb-6 tracking-tight"
        style={{ animation: 'pmSlideUp 0.6s 0.2s ease-out both' }}
      >
        Thank You
      </h2>

      <div className="w-16 h-0.5 mx-auto mb-8" style={{ background: BRAND, animation: 'pmSlideUp 0.6s 0.3s ease-out both' }} />

      <p className="text-white/40 text-lg font-light mb-4" style={{ animation: 'pmSlideUp 0.6s 0.4s ease-out both' }}>
        Transforming senior care through intelligent automation.
      </p>
      <p className="text-white/25 text-sm" style={{ animation: 'pmSlideUp 0.6s 0.5s ease-out both' }}>
        nuaig.ai
      </p>
    </div>
  );
}

// ─── Use case slide ───────────────────────────────────────────────────────────
//
// Layout invariant: every node in the chain uses flex-1 min-h-0 (or flex-shrink-0
// for fixed-size items) so the container never exceeds viewport height. Content
// that doesn't fit fades out via BottomFade — no scrollbar, no overflow.

function UseCaseSlide({
  uc,
  ucIndex,
  direction,
}: {
  uc: UseCase;
  ucIndex: number;
  direction: 'forward' | 'backward';
}) {
  const cc = catColor(uc.category);
  const sc = STATUS_COLORS[uc.status];
  const numStr = String(ucIndex).padStart(2, '0');
  const hasSubCases = !!uc.subCases?.length;

  return (
    // flex-1 min-h-0 — fills the outer flex-col container exactly, no overflow
    <div
      className="flex-1 min-h-0 flex flex-col relative overflow-hidden"
      style={{
        animation: `${direction === 'forward' ? 'pmFadeInRight' : 'pmFadeInLeft'} 0.45s cubic-bezier(0.16,1,0.3,1) forwards`,
      }}
    >
      {/* Ghost number watermark — decorative only */}
      <div
        className="absolute bottom-2 right-4 font-black text-white pointer-events-none select-none leading-none"
        style={{ fontSize: 'clamp(80px, 12vw, 160px)', opacity: 0.025, letterSpacing: '-0.04em' }}
      >
        {numStr}
      </div>

      {/* Left accent bar */}
      <div
        className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full"
        style={{ background: cc.text, opacity: 0.5 }}
      />

      {/* ── Two-column body ── */}
      {/* flex-1 min-h-0 ensures this never pushes past the outer boundary */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden pl-6 pt-3">

        {/* ──────── Left column ──────── */}
        {/* flex-1 min-h-0: takes leftover width; overflow-hidden clips children */}
        <div className="flex-1 min-h-0 flex flex-col pr-6 overflow-hidden">

          {/* Badges row — fixed height */}
          <div
            className="flex-shrink-0 flex flex-wrap items-center gap-2 mb-2"
            style={{ animation: 'pmSlideUp 0.4s 0.05s ease-out both' }}
          >
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: cc.bg, color: cc.text, border: `1px solid ${cc.border}` }}
            >
              {uc.category}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: sc.bg, color: sc.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
              {sc.label}
            </span>
          </div>

          {/* Tech stack chips — fixed height */}
          <div
            className="flex-shrink-0 flex flex-wrap gap-1.5 mb-3"
            style={{ animation: 'pmSlideUp 0.4s 0.1s ease-out both' }}
          >
            {uc.techStack.map((t, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-medium"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.45)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Title — fixed height */}
          <h2
            className="flex-shrink-0 font-extrabold text-white leading-tight mb-3"
            style={{
              fontSize: 'clamp(1.4rem, 2.8vw, 2.2rem)',
              letterSpacing: '-0.02em',
              animation: 'pmSlideUp 0.4s 0.15s ease-out both',
            }}
          >
            {uc.title}
          </h2>

          {/* Blue divider — fixed height */}
          <div
            className="flex-shrink-0 w-10 h-0.5 rounded-full mb-3"
            style={{ background: BRAND, animation: 'pmSlideUp 0.4s 0.18s ease-out both' }}
          />

          {/* Description — flex-1 min-h-0: expands to fill ALL remaining column height */}
          <div
            className="flex-1 min-h-0 overflow-hidden relative"
            style={{ animation: 'pmSlideUp 0.4s 0.2s ease-out both' }}
          >
            <p
              className="text-white/58 leading-relaxed"
              style={{ fontSize: 'clamp(0.82rem, 1.2vw, 0.95rem)' }}
            >
              {uc.description}
            </p>
            {/* Graceful fade at bottom instead of hard clip or scrollbar */}
            <BottomFade height={72} />
          </div>
        </div>

        {/* ──────── Right column ──────── */}
        <div
          className="lg:w-[40%] flex-shrink-0 min-h-0 flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l pt-4 lg:pt-0 lg:pl-7 mt-3 lg:mt-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)', animation: 'pmSlideUp 0.4s 0.15s ease-out both' }}
        >
          {/* Section label — fixed height */}
          <p className="flex-shrink-0 text-xs font-semibold uppercase tracking-widest text-white/25 mb-3">
            {hasSubCases ? `${uc.subCases!.length} Use Cases` : 'Business Value'}
          </p>

          {/* List — flex-1 min-h-0: expands to fill remaining right-column height */}
          <div className="flex-1 min-h-0 overflow-hidden relative">
            {hasSubCases ? (
              <ul className="space-y-2.5">
                {uc.subCases!.map((sc, i) => (
                  <li key={sc.id} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold mt-0.5"
                      style={{ background: 'rgba(6,155,223,0.2)', color: BRAND, border: '1px solid rgba(6,155,223,0.3)' }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-white/75 font-medium leading-snug">{sc.title}</p>
                      <p
                        className="text-xs text-white/35 leading-snug mt-0.5 overflow-hidden"
                        style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const }}
                      >
                        {sc.summary}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {uc.businessValue.map((v, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(6,155,223,0.2)', border: '1px solid rgba(6,155,223,0.3)' }}
                    >
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke={BRAND} strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/65 leading-snug">{v}</span>
                  </li>
                ))}
              </ul>
            )}
            <BottomFade height={48} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type SlideType = 'title' | 'usecase' | 'closing';
interface Slide { type: SlideType; usecase?: UseCase; ucIndex?: number; }

export default function PresentMode({ usecases }: { usecases: UseCase[] }) {
  const slides: Slide[] = [
    { type: 'title' },
    ...usecases.map((uc, i) => ({ type: 'usecase' as SlideType, usecase: uc, ucIndex: i + 1 })),
    { type: 'closing' },
  ];

  const total = slides.length;
  const totalUc = usecases.length;

  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [slideKey, setSlideKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const navigate = useCallback(
    (newIdx: number, dir: 'forward' | 'backward') => {
      if (newIdx < 0 || newIdx >= total) return;
      setDirection(dir);
      setIdx(newIdx);
      setSlideKey(k => k + 1);
    },
    [total],
  );

  const next = useCallback(() => navigate(idx + 1, 'forward'), [idx, navigate]);
  const prev = useCallback(() => navigate(idx - 1, 'backward'), [idx, navigate]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case 'ArrowRight': case ' ': e.preventDefault(); next(); break;
        case 'ArrowLeft':            e.preventDefault(); prev(); break;
        case 'Escape':               window.location.href = '/'; break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 50) return;
    delta < 0 ? next() : prev();
  }

  const slide = slides[idx];
  const progressPct = total > 1 ? (idx / (total - 1)) * 100 : 0;

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/*
        Root: fixed inset-0 flex-col — the entire viewport, no scroll.
        Every child must be either flex-shrink-0 (fixed bars) or flex-1 min-h-0
        (the slide content area). Nothing inside may exceed this boundary.
      */}
      <div
        className="fixed inset-0 flex flex-col overflow-hidden select-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 50% -10%, rgba(6,155,223,0.12) 0%, transparent 60%),
            linear-gradient(rgba(6,155,223,0.04) 1px, transparent 1px),
            linear-gradient(to right, rgba(6,155,223,0.04) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 48px 48px, 48px 48px',
          backgroundColor: BG,
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* ── Progress bar — flex-shrink-0, 2px ── */}
        <div className="flex-shrink-0 h-0.5 w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full"
            style={{
              width: `${progressPct}%`,
              background: `linear-gradient(to right, ${BRAND}, rgba(6,155,223,0.6))`,
              transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </div>

        {/* ── Top bar — flex-shrink-0 ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <a href="/">
            <img src="/logo-white.svg" alt="NuAig" className="h-8 w-auto hover:opacity-75 transition-opacity" style={{ opacity: 0.92 }} />
          </a>
          <div className="flex items-center gap-5">
            {slide.type === 'usecase' && (
              <span className="text-xs font-mono text-white/40 tabular-nums">
                {String(slide.ucIndex!).padStart(2, '0')} / {String(totalUc).padStart(2, '0')}
              </span>
            )}
            <button
              onClick={() => (window.location.href = '/')}
              className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/70 transition-colors px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              <span className="hidden sm:inline">Exit</span>
              <span className="hidden sm:inline opacity-40 font-mono ml-0.5">[Esc]</span>
            </button>
          </div>
        </div>

        {/* ── Slide content area — flex-1 min-h-0, the only stretchy element ── */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          {/*
            absolute inset-0: matches parent height exactly.
            flex flex-col: stacks slide children vertically.
            Each child (TitleSlide / UseCaseSlide / ClosingSlide) must use
            flex-1 min-h-0 so it fills this container without overflowing.
          */}
          <div key={slideKey} className="absolute inset-0 px-6 pt-4 pb-2 flex flex-col">
            {slide.type === 'title'   && <TitleSlide />}
            {slide.type === 'usecase' && slide.usecase && (
              <UseCaseSlide uc={slide.usecase} ucIndex={slide.ucIndex!} direction={direction} />
            )}
            {slide.type === 'closing' && <ClosingSlide />}
          </div>
        </div>

        {/* ── Bottom navigation — flex-shrink-0 ── */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-6 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <button
            onClick={prev}
            disabled={idx === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            style={
              idx > 0
                ? { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }
                : { background: 'transparent', color: 'rgba(255,255,255,0.2)', border: '1px solid transparent' }
            }
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => {
              const isActive = i === idx;
              const distance = Math.abs(i - idx);
              if (distance > 7 && !isActive) return null;
              return (
                <button
                  key={i}
                  onClick={() => navigate(i, i > idx ? 'forward' : 'backward')}
                  className="rounded-full flex-shrink-0 transition-all duration-300"
                  aria-label={`Slide ${i + 1}`}
                  style={{
                    width: isActive ? '20px' : '5px',
                    height: '5px',
                    background: isActive ? BRAND : 'rgba(255,255,255,0.22)',
                    opacity: distance > 4 ? 0.35 : 1,
                  }}
                />
              );
            })}
          </div>

          <button
            onClick={next}
            disabled={idx === total - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            style={
              idx < total - 1
                ? { background: BRAND, color: '#fff', boxShadow: `0 0 24px rgba(6,155,223,0.4)` }
                : { background: 'transparent', color: 'rgba(255,255,255,0.2)', border: '1px solid transparent' }
            }
          >
            <span className="hidden sm:inline">{idx === total - 2 ? 'Finish' : 'Next'}</span>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
