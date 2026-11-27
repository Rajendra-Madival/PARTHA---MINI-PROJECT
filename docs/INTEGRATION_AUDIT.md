# PARTHA Integration Audit (`docs/INTEGRATION_AUDIT.md`)

Audited repository: `https://github.com/Rajendra-Madival/PARTHA---MINI-PROJECT.git` (`main` at commit `885171e`), branched to `landing-epic-theme`.

---

## a. Repository Structure & View Switching

### Directory inventory

- **`src/`** (React 19 frontend):
  - `src/main.tsx`, `src/App.tsx`, `src/index.css`
  - `src/types/index.ts` — shared TypeScript domain types (`AuthUser`, `AuthSession`, `UserRole`, `BranchCode`, `AlumniProfile`, `MentorshipRequest`, `Opportunity`, `KnowledgeGuide`, etc.)
  - `src/lib/firebase.ts` — Firebase initialization (`initializeApp`, `getAuth`) and in-memory Google Forms OAuth token helper (`requestGoogleFormsPermission`, `getWorkspaceAccessToken`, `clearWorkspaceAccessToken`)
  - `src/services/api.ts` — `parthaApi` HTTP client calling `/api/*` with an in-memory Bearer token (`getAuthToken`, `setAuthToken`)
  - `src/services/googleForms.ts` — Google Forms REST API integration (`createSeniorIntakeGoogleForm`, `fetchSeniorFormResponses`)
  - `src/utils/matchingEngine.ts` — client matching helper utilities
  - `src/assets/images/` — 5 portrait `.jpg` files (`alumna_*`, `alumnus_*`)
  - `src/components/`:
    - Landing & Auth: `ParthaLandingPage.tsx`, `ParthaLandingPage.css`, `AuthScreen.tsx`, `FrostgateHero.tsx` (unused alternative hero), `kokonutui/ink-background.tsx`, `kokonutui/avatar-picker.tsx`
    - App Chrome & Shared: `Navbar.tsx`, `ErrorBoundary.tsx`, `Avatar.tsx`, `SkeletonLoaders.tsx`, `DomainSelect.tsx`, `SkillPicker.tsx`, `ProfileAvatarEditor.tsx`, `profileOptions.ts`
    - Role Views & Modals: `StudentDiscoveryView.tsx`, `AlumniCard.tsx`, `ConnectionsView.tsx`, `OpportunitiesFeedView.tsx`, `AlumniDashboardView.tsx`, `AdminDashboardView.tsx`, `SeniorIntakeFormPanel.tsx`, `ProfileDetailsView.tsx`, `MentorshipModal.tsx`, `PostModal.tsx`, `GuideReaderModal.tsx`
- **`server/`** (Express + PostgreSQL backend helpers used by `server.ts`):
  - `server/db/client.ts` — `pg.Pool` + `drizzle-orm/node-postgres` client and runtime `CREATE TABLE IF NOT EXISTS` schema bootstrap
  - `server/db/schema.ts` — Drizzle PostgreSQL table definitions
  - `server/postgresStore.ts` — auth (`login`, `registerStudent`, `registerAlumni`, `claimFirstAdmin`, `requestPasswordReset`, `confirmPasswordReset`, `verifyToken`) and CRUD/query operations
  - `server/email.ts` — Resend HTTPS transactional email sender
  - `server/rateLimit.ts` — `authLimiter` and `writeLimiter`
  - `server/validation.ts` — input validation and pagination helpers
- **`lib/`** (root):
  - `lib/utils.ts` — re-exports `cn` from `"cn"` (referenced by `components.json`)
- **`components/ui/`** (root):
  - `components/ui/button.tsx` — shadcn `base-nova` button built on `@base-ui/react/button` and `class-variance-authority`
- **Root config & security files**:
  - `server.ts`, `vite.config.ts`, `tsconfig.json`, `components.json`, `eslint.config.js`, `firebase-applet-config.json`, `firebase-blueprint.json`, `firestore.rules`, `firestore.rules.test.ts`, `security_spec.md`

### Pages / views & switching mechanism

The app has **no URL router library** (`react-router-dom` is not installed). View switching is driven entirely by React state in `src/App.tsx`:

1. **Logged-out gate (`!user` in `src/App.tsx:719-732`)**:
   - Renders `ParthaLandingPage` wrapping `AuthScreen` (`embedded`), with internal `AuthScreen` state switching across `role` (`student` | `alumni` | `admin`) and `mode` (`login` | `register` | `forgot`, plus first-run `needsAdminClaim`).
2. **Logged-in workspace (`user !== null` in `src/App.tsx:783-1032`)**:
   - Switches tabs via `const [activeTab, setActiveTab] = useState<ActiveTab>('discover')` (`src/App.tsx:89`) controlled by `Navbar` (`src/components/Navbar.tsx`):
     - `discover` → `StudentDiscoveryView` (`src/App.tsx:839-862`)
     - `connections` → `ConnectionsView` (`src/App.tsx:864-873`)
     - `opportunities` / `guides` → `OpportunitiesFeedView` (`src/App.tsx:875-921`)
     - `alumni-inbox` → `AlumniDashboardView` (`src/App.tsx:923-940`)
     - `admin-queue` → `AdminDashboardView` (`src/App.tsx:942-958`)
     - `senior-form` → `SeniorIntakeFormPanel` (`src/App.tsx:960-978`)
     - `profile` → `ProfileDetailsView` (`src/App.tsx:980-989`)
   - Modals open via local IDs/flags (`selectedAlumniId` → `MentorshipModal`, `postModalState` → `PostModal`, `activeGuideId` → `GuideReaderModal`).

---

## b. Existing Landing & Login

- **Landing files**: `src/components/ParthaLandingPage.tsx` and `src/components/ParthaLandingPage.css` (plus unused `src/components/FrostgateHero.tsx` and `src/components/kokonutui/ink-background.tsx`).
  - `ParthaLandingPage.tsx` renders:
    1. A GSAP ScrollTrigger + Lenis pinned story (`5.2×` viewport height) over `/assets/aistudio/24506908-d5d7-4763-8b9b-3051f12b91ef_71482280.png` with an SVG bowstring/arrow animation and 4 feature cards (*Alumni Mentorship*, *Opportunities*, *Prep Guides*, *Your Journey*).
    2. A reduced-motion static 2×2 feature grid (`.partha-static-features`).
    3. `.partha-auth-section` with "PARTHA — Guiding Your Journey" story copy on the left and `{children}` (`<AuthScreen embedded />`) on the right.
- **Login & Sign-up (`src/components/AuthScreen.tsx`)**:
  - **Wired sign-in methods**:
    - **Email or USN + Password** via `parthaApi.login({ role, identifier, password })` → `POST /api/auth/login` (`server.ts:138-159`). (Note: **Google Sign-In is NOT wired for app authentication**; Firebase Google popup in `src/lib/firebase.ts:24-36` is used solely for Admin Google Forms import permissions.)
    - **Forgot / Reset Password**: 6-digit email verification code via `parthaApi.requestPasswordReset` (`POST /api/auth/forgot-password`, `server.ts:231-271`) and `parthaApi.resetPassword` (`POST /api/auth/reset-password`, `server.ts:274-302`) for `student` and `alumni`.
  - **Sign-up & role selection**:
    - Top role tablist (`ROLE_TABS`, `src/components/AuthScreen.tsx:35-43,372-409`) selects `student`, `alumni`, or `admin`.
    - Mode tablist (`Sign In` / `Register`, `src/components/AuthScreen.tsx:440-486`) switches between sign-in and registration for `student` (`POST /api/auth/register-student`: name, USN, branch, semester, email, password, domain, skills, mentorship goals, optional PDF resume) and `alumni` (`POST /api/auth/register-alumni`: name, USN, branch, graduation year, optional phone, email, password).
    - If `role === 'admin'` and `!bootstrapStatus.hasAdmin`, shows first-run Admin Claim (`POST /api/auth/claim-admin`).
  - **Post-sign-in destination (`src/App.tsx:46-50,340-358`)**:
    - `handleAuthenticated` sets `user` and switches `activeTab` using `defaultTabForRole(session.user.role)`:
      - `student` → `'discover'` (`StudentDiscoveryView`)
      - `alumni` → `'alumni-inbox'` (`AlumniDashboardView`)
      - `admin` → `'admin-queue'` (`AdminDashboardView`)

---

## c. Theme, Brand Colors, Fonts, and shadcn Setup

- **Exact hex values in the app (`src/index.css:15-19,75-108`, `index.html:25`, `src/App.tsx:784`, `src/components/AuthScreen.tsx:47-51,370`, `src/components/ParthaLandingPage.css:1-6`)**:
  - **App Whites / Surfaces**:
    - `#FAF7F0` — primary warm paper background (`--background`, `--primary-foreground`, `body`, `index.html`, `App.tsx`)
    - `#FFFEFA` — raised card / surface white (`--card`, `--popover`, `--sidebar`, `AuthScreen` card, `Navbar`, `Footer`)
    - `#FFFFFF` — input backgrounds (`AuthScreen.tsx` `INPUT_CLASS`) and button text on emerald (`text-white`)
    - `#F3EFE4` — secondary / muted warm surface (`--secondary`, `--muted`, role/mode tab tracks)
    - `#E5DFD0` — warm stone border / input border (`--border`, `--input`)
    - `#EEE9DC` — subtle divider (`AuthScreen.tsx`, `AdminDashboardView.tsx`)
  - **App Light Greens & Brand Greens**:
    - `#ECFDF5` — light mint accent surface (`--accent`, `--sidebar-accent`, Tailwind `emerald-50`)
    - `#A7F3D0` — soft mint chart / highlight (`--chart-4`, Tailwind `emerald-200`)
    - `#C9D0B8` — `--partha-sage` in `ParthaLandingPage.css:2` (alongside `#F5F0DF` `--partha-ivory`, `#263D30` `--partha-forest`, `#AA8D55` `--partha-gold`)
    - `#065F46` — primary brand deep emerald (`--primary`, `--ring`, `--chart-1`, Tailwind `emerald-800`)
    - `#047857` — `--chart-2` (`emerald-700`)
    - `#064E3B` — `--accent-foreground` (`emerald-900`)
    - `#10B981` — `--chart-3` (`emerald-500`)
  - **Text / Inks**:
    - `#18221D` — primary dark forest ink (`--foreground`, `--card-foreground`, `body`)
    - `#57534E` — muted secondary text (`--muted-foreground`)
- **Fonts**:
  - `index.html:20-23` loads Google Fonts: `Plus Jakarta Sans`, `DM Sans`, `JetBrains Mono`, `Jost`.
  - `src/index.css:4,8-12` imports `@fontsource-variable/geist` and defines `@theme`:
    - `--font-display: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;`
    - `--font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;`
    - `--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;`
  - `src/components/ParthaLandingPage.tsx:1-5` & `ParthaLandingPage.css:9,154,238` import and use `@fontsource/cormorant-garamond` (500, 600) and `@fontsource/montserrat` (400, 500, 600).
- **Tailwind 4 `@theme` & shadcn (`components.json`)**:
  - `src/index.css:33-73` defines `@theme inline` mapping `--color-*`, `--font-heading`, and `--radius-*` to CSS variables in `:root`.
  - `components.json` configures shadcn `"style": "base-nova"`, `"rsc": false`, `"tsx": true`, `"css": "src/index.css"`, `"baseColor": "neutral"`, `"cssVariables": true`, `"iconLibrary": "lucide"`, aliases `@/components` → `components/`, `@/lib/utils` → `lib/utils.ts`.
- **Dark mode**:
  - `src/index.css:6,110-142` includes `@custom-variant dark (&:is(.dark *));` and `.dark { ... }` shadcn tokens, but no dark-mode toggle or `.dark` class is applied in the UI.

---

## d. Location of Phases 1 to 4 Landing Work

- **In `PARTHA---MINI-PROJECT` (`main` at `885171e`)**: The Phases 1–4 landing implementation (3D hero, `copy.ts`, `Question`, `Gurukul`, `Highlights`, `EpicPath`, `Testimonials`, `LoginGate`, `Footer`, Vitest/Playwright suites) was **not present**. `main` only had `src/components/ParthaLandingPage.tsx` (+ `.css`).
- **Found & ported**: Phases 1–4 had been built in the standalone scratch workspace `C:\Users\YASH\.t3\scratch\2026-11-27-doc-20261126-wa0002-1-md-d40df70d` (archived cleanly at `C:\Users\YASH\.t3\scratch\partha-v1-phases-1-4`). Note: `D:\PARTHA` on this machine is a separate older clone of `https://github.com/NikhilHatti/PARTHA` (Supabase-based), not this repository.
- In Phase 0, the Phases 1–4 codebase is ported into `src/landing/` (`sections/`, `components/`, `motion/`, `three/`, `content/copy.ts`, `lib/router.tsx`, `styles/tokens.css`, `styles/landing.css`, `LandingPage.tsx`) plus SVG motifs in `public/svg/`, and mounted for logged-out users (`!user`) in `src/App.tsx`.

---

## e. Dependencies

- **Already installed in `PARTHA---MINI-PROJECT` (`package.json`)**:
  - `react@^19.0.1`, `react-dom@^19.0.1`, `vite@^8.3.0`, `@vitejs/plugin-react@^6.1.1`, `@tailwindcss/vite@^4.3.3`, `tailwindcss@^4.3.3`, `gsap@^3.15.1`, `lenis@^1.3.28`, `motion@^12.23.24`, `lucide-react@^0.546.0`, `firebase@^13.4.0`, `express@^4.21.2`, `drizzle-orm@^0.45.4`, `pg@^8.23.1`, `@base-ui/react@^1.9.0`, `shadcn@^4.23.0`, `@fontsource/cormorant-garamond@^5.3.0`, `@fontsource/montserrat@^5.3.0`, `@fontsource-variable/geist@^5.3.0`, `typescript@^7.0.2`.
- **Needed for landing + 3D + testing** (verified against npm registry `peerDependencies` for React 19 & Vite 8; Context7 MCP was not available in this environment):
  - Runtime: `three`, `@react-three/fiber` (`^9.8.2` — React 19 reconciler), `@react-three/drei` (`^10.7.9` — requires `react ^19` and `@react-three/fiber ^9`)
  - Dev: `@types/three`, `vitest` (`^5.1.2` — supports `vite ^8.0.0`), `jsdom` (`^31.0.1`), `@testing-library/react` (`^16.3.3` — supports `react ^19`), `@playwright/test`, `@axe-core/playwright`

---

## f. Dev Server & Routing

- `npm run dev` executes `tsx server.ts` (`package.json:7`), listening on `process.env.PORT || 3000` (`server.ts:31,1004`).
- **Dev mode (`NODE_ENV !== 'production'`, `server.ts:990-996`)**: mounts Vite via `createViteServer({ server: { middlewareMode: true }, appType: 'spa' })`, so unknown non-`/api/*` routes serve `index.html` automatically.
- **Production mode (`server.ts:997-1002`)**: serves `dist/` via `express.static` and serves `dist/index.html` for all unknown GET routes (`app.get('*', ...)`). Unknown `/api/*` routes return JSON `404` (`server.ts:936-938`).

---

## g. Auth & Firebase Initialization

- **Primary app auth (Express + PostgreSQL)**:
  - `src/services/api.ts` (`parthaApi`) → `server.ts` → `server/postgresStore.ts`:
    - Sign in: `parthaApi.login` (`POST /api/auth/login`)
    - Sign up: `parthaApi.registerStudent` (`POST /api/auth/register-student`), `parthaApi.registerAlumni` (`POST /api/auth/register-alumni`), `parthaApi.claimAdmin` (`POST /api/auth/claim-admin`)
    - Sign out: `parthaApi.logout()` clears in-memory Bearer token (`setAuthToken(null)`), paired with `clearWorkspaceAccessToken()` in `src/App.tsx:360-362`
    - Password reset: `parthaApi.requestPasswordReset` (`POST /api/auth/forgot-password`) and `parthaApi.resetPassword` (`POST /api/auth/reset-password`)
- **Firebase (`src/lib/firebase.ts`)**:
  - Initializes `app = initializeApp(firebaseConfig)` (`../../firebase-applet-config.json`) and `auth = getAuth(app)`.
  - Currently exports only `GOOGLE_FORMS_SCOPES`, `getWorkspaceAccessToken`, `clearWorkspaceAccessToken`, and `requestGoogleFormsPermission` (using `GoogleAuthProvider` + `signInWithPopup` for Admin Google Forms access). It is **not** currently wired to student/alumni login or Firestore data queries in `src/`.

---

## h. Risks & Open Questions

1. **Auth backend mismatch (Critical for Phase 5)**: Addendum v2.1 Section 4 assumed Firebase Auth (`signInWithEmailAndPassword` / Google Sign-In) is the app's login system, whereas the audited repository (`885171e`) uses Express `/api/auth/*` + PostgreSQL (`server/postgresStore.ts`) with Email/USN + Password and 6-digit email reset codes, and no Google Sign-In for users. Phase 5 must adapt `authClient.ts` to `parthaApi` (or confirm if Firebase Auth should be re-introduced).
2. **Global CSS collision**: Phase 1–4 `globals.css` styled `html`, `body`, and `h1-h4` directly in dark `#0B1026`. In `src/landing/styles/landing.css`, base rules must stay scoped under `.partha-landing-v1` so the logged-in `#FAF7F0` app UI is unaffected.
3. **React 19 + R3F v9 upgrade**: Phase 4 was built on `@react-three/fiber@8` (React 18). Upgrading to `@react-three/fiber@9` + `@react-three/drei@10` requires verifying R3F v9 JSX types and Canvas rendering under React 19.
4. **Existing `npm` peer dependency conflict in `package.json`**: The repo's `package.json` specifies `typescript@^7.0.2` alongside `@firebase/eslint-plugin-security-rules@0.0.2` (which pulls `@typescript-eslint/parser` requiring `typescript <6.1.0`) and `esbuild@^0.25.0` alongside `vite@^8.3.0` (`peerOptional esbuild@^0.27.0 || ^0.28.0`), causing `npm install` without `--legacy-peer-deps` to fail `ERESOLVE`.
5. **Dev server port & Vite build plugin**: `npm run dev` serves on port `3000` (not `5173`), and `vite.config.ts` includes `copy-unbundled-src-assets` and `DISABLE_HMR` which must be kept intact.
6. **Brand palette confirmation**: The app actually uses warm ivory `#FAF7F0` / `#FFFEFA`, deep emerald `#065F46`, light mint `#ECFDF5`, and `ParthaLandingPage.css` sage `#C9D0B8` / `#F5F0DF` rather than `#FFFFFF` / `#DDF3E0`.
