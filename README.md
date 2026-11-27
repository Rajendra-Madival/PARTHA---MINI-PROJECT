# PARTHA — Alumni Mentorship & Opportunity Platform

This repository houses the PARTHA React + Vite + Express + Firebase application (`src/`) along with the Phase V3 landing experience (`src/landing/`) on branch `landing-arrows-path`.

## Running Locally

```bash
npm install --legacy-peer-deps
npm run dev      # Starts Express + Vite dev middleware on port 3000
```

## Verification & Quality Gates

```bash
npm run lint     # TypeScript check (tsc --noEmit)
npm run build    # Production Vite build -> dist/
npm test         # Vitest unit/contrast/copy/DOM tests (tests/phaseV31.test.tsx)
```

## Phase V3-1: Foundation ("The Arrow's Path")

- **Architecture**: Lazy-loaded landing page (`src/landing/LandingPage.tsx`) split into its own Vite chunk (`React.lazy` in `src/App.tsx`), wired to the app's `AuthScreen` (`Log in` and `Create your account` at Scene 5: The Gate).
- **Scenes & Waypoints**: Six `min-h-[120vh]` scroll scenes (`hero`, `ashram`, `bridge`, `kurukshetra`, `dawn-lake`, `gate`) with placeholder CSS gradient backdrops (`SceneBackdrop`), alternating light (`#FAF7F0`, `#ECFDF5`) and dark (`#14382A`, `#1B1F4B`, `#0B1026`) modes, five keyboard-accessible waypoints (`Stop 1..5`), and single-open expandable step cards (`Escape` collapses).
- **The Arrow's Path**: Continuous dynamic SVG Bezier curve (`ArrowsPathOverlay`) drawn with `stroke-dashoffset` via GSAP `ScrollTrigger` synced to `Lenis` (vertical rail `< 768px`, `prefers-reduced-motion` static full-path fallback).
