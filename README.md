# PARTHA — Alumni Mentorship & Opportunity Platform

This repository houses the PARTHA React + Vite + Express + Firebase application (`src/`) along with the epic-themed landing page (`src/landing/`) on branch `landing-epic-theme`.

## Running Locally

```bash
npm install --legacy-peer-deps
npm run dev      # Starts Express + Vite dev middleware on port 3000
```

## Verification & Quality Gates

```bash
npm run lint     # TypeScript check (tsc --noEmit)
npm run build    # Production Vite build -> dist/
npm test         # Vitest unit/contrast/copy/DOM tests (tests/phase4ra.test.tsx)
```

## Phase 4R-A Status

- **Palette & Tokens**: Uses `--c-brand-white: #FAF7F0` and `--c-brand-green: #ECFDF5` paired with v2 epic palette tokens registered via Tailwind 4 `@theme` in `src/landing/styles/tokens.css` (without overwriting logged-in app tokens in `src/index.css`).
- **Fonts**: `Cormorant Garamond` (display), `Montserrat` (body/UI), and `Noto Serif Devanagari` (Sanskrit accents).
- **Section Modes**: Alternating dark (`#hero`, `#question`, `#epic-path`, `#login-gate`, `#footer`) and light (`#gurukul`, `#highlights`, `#stories`, `#give-back`) sections with ScrollTrigger-driven navbar mode switching.
- **Placeholder Art & Copy Markers**: Static SVG placeholders (`// ART: PLACEHOLDER`) and owner-review copy items (`// CONFIRM: copy owner`) are ready for Phases 4R-B/4R-C/5.

## Phase 4R-B Status

- **Hero Scene**: Nine-layer stack (dark sky, 60% Phase 4 ambient 3D layer, `0.4x` parallax banyan + gopuram silhouettes, terracotta road strip, drifting chariot with scroll-linked rotating wheel, anonymous standing archer replay button `"Replay the archer's shot"`, flying arrow aiming at the left edge of `"Enter the Gurukul"`, text, and chakra scroll cue).
- **Tests**: Unit checks in `tests/phase4ra.test.tsx` and `tests/phase4rb.test.tsx`.
