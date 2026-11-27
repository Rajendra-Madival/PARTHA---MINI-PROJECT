# Architecture & Implementation Decisions (`DECISIONS.md`)

Choices made during Phase 1 (Scaffold) where the specification allowed defaults or did not prescribe exact implementation details:

1. **Workspace root as project root**
   - Placed the Vite + React + TypeScript project directly in the workspace root (`package.json`, `src/`, `public/`, `tests/`) rather than nesting an extra `partha-landing/` directory, so commands run directly from the repository root.
2. **React 18.3.1 + Vite 8 + Tailwind CSS v4**
   - Selected React 18.3.1 for compatibility across GSAP, Lenis, Framer Motion, and the upcoming React Three Fiber v8 scene.
   - Configured Tailwind CSS v4 via `@tailwindcss/vite` (`@import "tailwindcss";` in `src/styles/globals.css`), layered with the exact `--c-*` custom properties in `src/styles/tokens.css`.
3. **Self-hosted fonts via `@fontsource`**
   - Installed `@fontsource/cinzel`, `@fontsource/inter`, `@fontsource/noto-serif-devanagari`, and `@fontsource/mukta` and imported their Latin/Devanagari weights in `src/main.tsx` instead of loading from Google Fonts CDN, ensuring zero external font network requests.
4. **Paper grain overlay implementation (Section 4.4)**
   - Implemented `.paper-grain-overlay` in `src/styles/globals.css` using an inline SVG `<feTurbulence>` data URI at `opacity: 0.05` (`pointer-events: none`, `z-index: 40`) rather than an external PNG file.
5. **Lightweight History API client router**
   - Built a minimal History API router (`src/lib/router.tsx`) supporting `/`, `/signup`, `/forgot-password`, `/dashboard`, `/privacy`, and `/terms` instead of adding `react-router-dom`, keeping the initial landing JS bundle lean.
6. **Section IDs and `aria-labelledby` scaffold**
   - Mapped Section 6 order to semantic landmarks: `<header id="navbar">`, `<main id="main-content">` containing `#hero`, `#question`, `#gurukul`, `#highlights`, `#epic-path`, `#stories`, `#login-gate`, and `<footer id="footer">`, each wired with `aria-labelledby` pointing to its heading.
7. **Theme & Language Defaults (Section 15)**
   - Dark theme only (`color-scheme: dark`, `lang="en"`).
   - Centralized all visible copy in `src/content/copy.ts` and marked Sanskrit/Devanagari phrases with `// VERIFY: native speaker review before launch` and placeholder details with `// PLACEHOLDER` / `// TODO(content):`.
8. **Empty `public/svg/` placeholder motifs prepared**
   - Placed lightweight 1.5px gold-stroke SVG motif assets (`lotus.svg`, `diya.svg`, `chakra.svg`, `gopuram.svg`, `ratha.svg`, `dwara.svg`, `shankha.svg`, `dhanush.svg`) in `public/svg/` matching the Section 11 project layout; inline rendering in sections is deferred to Phase 2+.
9. **Playwright browser channel**
   - Configured `playwright.config.ts` with `channel: 'chrome'` so E2E verification uses the system Chrome installation directly without downloading a separate Playwright headless-shell binary.
10. **Lotusesque SVG favicon**
    - Linked `/svg/lotus.svg` as `<link rel="icon" type="image/svg+xml" href="/svg/lotus.svg" />` in `index.html` so browsers do not log a 404 for `/favicon.ico`.
11. **Phase 2 static layouts for Gurukul, Epic Path, and Testimonials**
    - **Gurukul**: Rendered the six golden arches in a responsive `sm:grid-cols-3 lg:grid-cols-6` grid paired with the three text panels (`Who it serves`, `How it works`, `Why it matters`) visible simultaneously on tablet/desktop, and a snap-scrolling horizontal row on mobile (`< 640px`).
    - **Epic Path**: Used a static vertical `<ol>` timeline with chakra step markers so all four milestones read cleanly without scroll pinning until Phase 3.
    - **Testimonials**: Rendered all three `#F3E5C0` palm-leaf cards together (each clearly badged `"Sample testimonial"`) with accessible Previous/Next buttons cycling the featured card indicator (`aria-current` + `aria-live="polite"`), deferring auto-advance and touch-swipe carousel motion to Phase 3.
12. **Input placeholder opacity for readability**
    - Used `rgba(217, 207, 184, 0.7)` for form placeholders on `--c-night-0` inputs so placeholder hints remain legible without competing with `--c-ivory` user input.
13. **Mobile drawer focus trap**
    - Added `Tab` / `Shift+Tab` focus wrapping inside `#mobile-nav-drawer` alongside `Escape` close and focus restoration to the hamburger trigger.

14. **Phase 3 reduced-motion choices (Section 5.3)**
    - **Navbar**: Uses a short (`150ms`) color-only transition for scrolled backdrop and `160ms` opacity-only fade for the mobile drawer.
    - **The Question**: Replaces word-by-word `y: 8` scrubbed slides with a single `200ms` opacity fade (`once: true`) and lights all diya footpath dots statically.
    - **The Gurukul**: Disables the CSS 3D rotating arch ring under reduced motion and displays the three pillar cards in a flat responsive grid with a `200ms` opacity fade (`once: true`).
    - **App Highlights**: Replaces alternating 60px slide entrances with a `200ms` opacity fade (`once: true`), disables pointer 3D tilt and icon rotation, and replaces "Learn more" height expansion with a `180ms` opacity fade.
    - **The Epic Path**: Disables horizontal pinning (`ScrollTrigger` `pin: true`) under reduced motion and renders the vertical timeline with all four milestones visible at full opacity.
    - **Testimonials**: Disables the 6-second auto-advance interval, sets card tilt to `0deg`, and uses a `180ms` opacity crossfade on slide changes.
15. **Gurukul 3D ring accessibility**
    - Marked the repeating back-half arch faces (`idx >= 3`) `aria-hidden="true"` and used a `(min-width: 640px)` media query hook so screen readers encounter each of the three pillar headings exactly once while all six arches rotate visually on tablet/desktop.
16. **ScrollTrigger cleanup & throttling**
    - Wrapped every GSAP/ScrollTrigger setup in `gsap.context(..., element)` and reverted on unmount (`ctx.revert()`), preventing duplicate `ScrollTrigger` instances across React StrictMode, route changes, and HMR.
    - Rounded `useScrollProgress` updates to `0.005` steps to prevent redundant React state updates on sub-pixel scroll deltas.

17. **Post-first-paint 3D chunk gating (`PerformanceObserver`)**
    - Deferred mounting the lazy `HeroScene` until `PerformanceObserver({ type: 'paint', buffered: true })` reports first paint (with a 2000ms fallback timeout) in `src/sections/Hero.tsx`, guaranteeing the 2D SVG fallback paints first and `HeroScene` + `three-vendor` are requested strictly after `first-paint` / `first-contentful-paint`.
18. **WebGL & low-power fallback detection (`src/three/capabilities.ts`)**
    - Checks `WebGLRenderingContext` and `webgl2`/`webgl` context creation (cached once per session to avoid context churn and `jsdom` noise), and treats `navigator.connection.saveData`, `deviceMemory <= 2`, or `hardwareConcurrency <= 2` as low-power mode so constrained devices stay on the 2D fallback without fetching Three.js.
19. **Procedural Lotus & Diya draw-call and shader budget**
    - Shared one curved `ExtrudeGeometry` and Fresnel-rimmed `MeshStandardMaterial` across all 8 lotus petals (`src/three/Lotus.tsx`) and used a `LatheGeometry` bowl + procedural `CanvasTexture` flame sprite (`src/three/Diya.tsx`), keeping the scene at 12 draw calls (`< 20`), 1 directional light, and 1 noise-flickered point light (`±15%`).
20. **React Three Fiber v8 JSX type bridge**
    - Added `src/three/r3f-jsx.d.ts` augmenting `react` `JSX.IntrinsicElements` with `@react-three/fiber` `ThreeElements` so strict `tsc` checks pass cleanly under `@types/react` 19.
21. **Phase 0: Repository clone, branch setup, and Phase 1–4 archival**
    - The active T3 scratch workspace previously held only the standalone Phase 1–4 landing build rather than the `PARTHA---MINI-PROJECT` git repository (`https://github.com/Rajendra-Madival/PARTHA---MINI-PROJECT.git`). Archived the standalone Phase 1–4 files to `C:\Users\YASH\.t3\scratch\partha-v1-phases-1-4`, replaced the active workspace with a clean clone of `PARTHA---MINI-PROJECT`, checked out branch `landing-epic-theme` from `main` (`885171e`), placed all three spec documents in `docs/`, and ported the Phase 1–4 landing implementation into `src/landing/` and `public/svg/`.
22. **Phase 0: Dependency version verification without Context7 MCP**
    - Context7 MCP was not attached in this session, so React 19 + Vite 8 compatibility was verified directly against the npm registry (`peerDependencies`): installed `three@^0.187.0`, `@react-three/fiber@^9.8.2`, `@react-three/drei@^10.7.9`, `@types/three@^0.187.0`, `vitest@^5.1.2`, `jsdom@^31.0.1`, `@testing-library/react@^16.3.3`, `@playwright/test@^1.65.1`, and `@axe-core/playwright@^4.14.1`.
    - Installed with `npm install --legacy-peer-deps` because the upstream `package.json` pairs `typescript@^7.0.2` with `@firebase/eslint-plugin-security-rules@0.0.2` (`peer typescript <6.1.0`) and `esbuild@^0.25.0` with `vite@^8.3.0` (`peerOptional esbuild@^0.27.0 || ^0.28.0`), leaving `bun.lock` untouched.
23. **Phase 0: Motion import and CSS scoping for existing app preservation**
    - Updated `src/landing/` component animations from `framer-motion` to `motion/react` (using the repo's already-installed `motion@^12.23.24`) per Addendum Section 2.
    - Scoped `src/landing/styles/tokens.css` and `src/landing/styles/globals.css` under `.partha-landing-v1` (and omitted duplicate `@import "tailwindcss";`) so the ported landing page preserves its Phase 1–4 visuals without clobbering the logged-in app's `#FAF7F0` / `#18221D` Tailwind theme or `--font-display`.
24. **Phase 0: Root mount for logged-out users (`src/App.tsx`)**
    - Mounted `<LandingPage />` (`src/landing/LandingPage.tsx`) when `!user` in `src/App.tsx` using the app's existing React-state view switching, while keeping `ParthaLandingPage.tsx` and `AuthScreen.tsx` intact in `src/components/` (no existing app code removed; auth wiring is deferred to Phase 5).
25. **Phase 0: Test scripts added (`package.json`)**
    - Added `"test": "vitest run"` and `"test:e2e": "playwright test"` to `package.json` alongside existing scripts (`dev`, `start`, `build`, `preview`, `clean`, `lint`).
