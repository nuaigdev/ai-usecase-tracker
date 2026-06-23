# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # dev server at localhost:4321
npm run build    # static build → dist/
npm run preview  # preview the dist/ output locally
```

## Architecture

**Stack:** Astro 4 (static output) + React islands + Tailwind CSS 3. No database — all data is in `src/data/usecases.ts`.

**Two pages:**
- `/` (`src/pages/index.astro`) — dashboard with stats header, filter bar, and expandable use-case cards
- `/present` (`src/pages/present.astro`) — full-screen slideshow mode

**React islands (interactive):**
- `src/components/CardGrid.tsx` — handles search/filter state and accordion expand/collapse for cards
- `src/components/PresentMode.tsx` — full-screen slideshow with keyboard nav (←/→/Space/Esc/L), touch swipe, slide transitions, and a slide-in limitations panel

**Static Astro components:**
- `src/layouts/Layout.astro` — base HTML shell; accepts `present` boolean to switch body styles
- `src/components/Header.astro` — sticky header with logo and Present button
- `src/pages/index.astro` — renders stats and passes `usecases` array to `CardGrid`

**Data model** (`src/data/usecases.ts`):
```ts
{ id, title, category, status, summary, description,
  businessValue[], techStack[], limitations[], complianceFlags[],
  owner?, lastUpdated? }
```
Status is `"planned" | "in-progress" | "live"`. To update content, edit this file directly.

**Brand colors** (from `NuAig-Black-2.svg`):
- Blue accent: `#069BDF` (used as `brand` in Tailwind config)
- Dark: `#111111`
- Two logo variants: `public/logo.svg` (dark text, for light bg) and `public/logo-white.svg` (white text, for dark bg/present mode)

## Deployment

`astro build` produces a fully static `dist/` folder. Deploy to Vercel by pointing it at this repo — no adapter, no environment variables, no server-side code.
