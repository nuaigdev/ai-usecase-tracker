import { useState, useEffect } from 'react';
import type { Tracker } from '../types';

export default function MobileNav({
  trackers = [],
  currentTrackerId,
}: {
  trackers?: Tracker[];
  currentTrackerId?: string;
}) {
  const [open, setOpen] = useState(false);
  const presentHref = currentTrackerId ? `/present?tracker=${currentTrackerId}` : '/present';

  // Close on Escape + lock body scroll while the drawer is open
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      {/* Hamburger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay + drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm"
            style={{ animation: 'mnFade 0.2s ease-out' }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col"
            style={{ animation: 'mnSlideIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}
          >
            <style>{`
              @keyframes mnFade { from { opacity: 0; } to { opacity: 1; } }
              @keyframes mnSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>

            {/* Header row */}
            <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-100 flex-shrink-0">
              <img src="/logo.svg" alt="NuAig" className="h-6 w-auto" />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-neutral-500 hover:bg-neutral-100 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {/* Primary links */}
              <div className="space-y-1">
                <DrawerLink href="/" label="Home" icon={
                  <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" />
                } />
                <DrawerLink href="/admin" label="Manage" icon={
                  <>
                    <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                } />
                <DrawerLink href={presentHref} label="Present" icon={
                  <path d="M8 5v14l11-7z" />
                } />
              </div>

              {/* Trackers */}
              {trackers.length > 0 && (
                <div className="mt-6">
                  <div className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Trackers
                  </div>
                  <div className="space-y-1">
                    {trackers.map(t => {
                      const active = t.id === currentTrackerId;
                      return (
                        <a
                          key={t.id}
                          href={`/?tracker=${t.id}`}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            active
                              ? 'bg-brand/10 text-brand'
                              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                              active ? 'bg-brand' : 'bg-neutral-300 group-hover:bg-neutral-400'
                            }`}
                          />
                          <span className="truncate">{t.title}</span>
                          <span className={`ml-auto text-xs tabular-nums flex-shrink-0 ${active ? 'text-brand/60' : 'text-neutral-400'}`}>
                            {t.usecases.length}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

function DrawerLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      {label}
    </a>
  );
}
