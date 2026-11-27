# PARTHA — Alumni Mentorship & Opportunity Platform

This repository houses the PARTHA React + Vite + Express + Firebase application (`src/`) along with the Phase V3 landing experience (`src/landing/`) on branch `landing-arrows-path`.

## Running Locally

```bash
npm install --legacy-peer-deps
npm run art      # Processes art/incoming/*.png -> public/landing/art/*.webp
npm run dev      # Starts Express + Vite dev middleware on port 3000 (reads .env)
```

## Verification & Quality Gates

```bash
npm run lint     # TypeScript check (tsc --noEmit)
npm run build    # Production Vite build -> dist/
npm test         # Vitest unit/contrast/DOM tests (tests/phaseV31.test.tsx, tests/phaseV32.test.tsx)
```

## Phase V3-2: Art Integration ("The Arrow's Path")

- **Artwork Pipeline (`scripts/process-art.mjs`)**: Converts all 27 owner-painted PNGs from `art/incoming/` into `public/landing/art/*.webp` (`1920px` + `960px` scene layers and trimmed `alphaQuality: 90` props/characters) and generates `screenshots/V32-cutouts.png`.
- **Scene Depth & Props (`src/landing/content/scenes.ts`, `SceneBackdrop.tsx`, `SceneProps.tsx`)**: Normalized 60% horizons with `?debug=horizon` (dev-only), GPU `translate3d` ScrollTrigger parallax (`sky 0.15`, `land 0.35`, `fore 0.7`), Scene 2 scroll-driven sun-sinking, eager `<link rel="preload">` hero assets (`192.6 KB` total desktop hero images), lazy `IntersectionObserver` loading (`100% 0px`), and reduced-motion static fallbacks.
