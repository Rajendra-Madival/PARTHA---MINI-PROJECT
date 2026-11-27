# PARTHA Spec v2.1 Addendum: Real App Integration

> **Precedence:** this addendum **overrides v2**, and v2 overrides v1. Keep all three in `docs/`.
>
> **Why it exists:** the specs were written before the real app was reviewed. The real app is an existing React + Firebase project, and its features differ from the generic copy in v1 and v2. This file aligns the landing page with the real app.
>
> **Repository:** https://github.com/Rajendra-Madival/PARTHA---MINI-PROJECT

---

## 1. What is known about the real app

**Verified** from the public repo root, `package.json`, and `firebase-blueprint.json`:

| Area | Finding |
|---|---|
| Product | Alumni networking and mentorship platform: students connect with alumni for guidance, mentorship, and opportunities |
| Template | Generated from Google AI Studio (`package.json` name is `react-example`) |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), shadcn + `@base-ui/react`, `lucide-react`, `class-variance-authority` |
| Motion already installed | `gsap`, `lenis`, `motion` (the Framer Motion successor) |
| Fonts already installed | Cormorant Garamond, Montserrat, Geist Variable |
| Backend | `server.ts` (Express, run with `tsx`; `npm run dev` runs `tsx server.ts`), Firebase 13 (Auth and Firestore), plus `drizzle-orm` and `pg` (use unclear) |
| Security files | `firestore.rules`, `firestore.rules.test.ts`, `security_spec.md` |
| Lint | `npm run lint` runs `tsc --noEmit` |
| Lockfiles | Both `bun.lock` and `package-lock.json` exist |
| Not installed | `three`, `@react-three/fiber`, `@react-three/drei`, any router (no `react-router` or similar), `vitest`, Playwright, Testing Library, Zod, React Hook Form |
| Roles | `student`, `alumni`, `admin` (Placement & Alumni Cell) |
| Student profile | Name, email, USN, branch (CSE, ISE, ECE, ME, EEE), semester, target skills, target domain, target company, looking for internship, looking for project help |
| Alumni profile | Public profile (name, graduation year, branch, role, company, domain, skills, location, bio, open to internship referrals, open to project mentoring), a verification status (`pending`, `verified`, `rejected`), and privacy-gated contact details (email, phone, LinkedIn) |
| Mentorship | A student sends a request with a goal (Career Guidance, Resume Review, Internship Referral, Project Help) and a message. The alumnus accepts or declines. Accepted pairs can message each other. |
| Opportunities | Internships, full-time jobs, and collaborative projects posted by verified alumni |
| Knowledge Hub | Career and interview guides written by alumni, with upvotes |
| Bookmarks | Students save alumni and opportunities |
| Alumni intake | Google Form for senior alumni, shared on WhatsApp, with imported responses |

**Not verified** (GitHub blocked automated access to these):
- The contents of `src/` and `server/`. This includes existing pages, any existing landing or login, the auth code, navigation, and the app's actual color tokens.
- Which sign-in methods are wired (Google, email and password, other).
- Whether the Phase 1 to 4 landing work lives in this repo. `three` and `@react-three/fiber` are **not** in `package.json` on `main`, so the Phase 4 3D hero is on an unpushed branch, in a separate folder, or not in this repo.

**Phase 0 (Section 7) exists to settle these.**

---

## 2. Integration rules (apply to every phase from now on)

1. **Build inside this repository.** Do not create a new Vite project. Work on a branch named `landing-epic-theme`. Commit at the end of each phase with the message `Phase <id>: <summary>`.
2. **Reuse the installed stack:** Tailwind 4, `gsap`, `lenis`, `motion`, `lucide-react`, and the existing shadcn components. Use `motion/react` for component-level motion. Do **not** install `framer-motion`.
3. **Add only what is missing:** `three`, `@react-three/fiber`, `@react-three/drei` (use versions that support React 19; confirm with Context7 before installing), plus test tooling (`vitest`, `jsdom`, `@testing-library/react`, `@playwright/test`, `@axe-core/playwright`) as dev dependencies. Do not add Zod or React Hook Form. Use plain state for the login form unless the audit finds an existing form library.
4. **Package manager:** use `npm`. Do not edit `bun.lock`.
5. **Do not modify** `server.ts`, `firestore.rules`, `firestore.rules.test.ts`, `security_spec.md`, or the Firebase config files, unless a phase says so. Never commit secrets. Any new environment variable goes into `.env.example`.
6. **Navigation:** no router library is installed. Use the app's existing view-switching mechanism. Add `react-router` only if the audit shows the existing mechanism cannot support the landing page, and log the reason in `DECISIONS.md`. If a router is added, confirm `server.ts` serves `index.html` for client routes in production.
7. **Theme tokens:** Tailwind 4 uses `@theme` in CSS, not `tailwind.config.js`. Register the v2 tokens through `@theme` (or `:root` variables that `@theme` references). Do not overwrite the app's existing tokens. Prefix the epic tokens (`--c-...`, as in v2) so they cannot collide.
8. **Fonts:** reuse the fonts the app already ships.
   - Display headings: **Cormorant Garamond**.
   - Body and UI: **Montserrat**.
   - Sanskrit and Hindi accents: Noto Serif Devanagari (add only this one).
   - Drop Cinzel, Inter, and Mukta from the v1 and v2 specs.
9. **Brand colors:** read the app's actual white and light green from its CSS or theme. Do not use the v2 placeholders. Record the exact values and their source file in `docs/INTEGRATION_AUDIT.md`.
10. **Landing scope:** the landing page appears at the app's root for logged-out users. Logged-in users see a "Go to your dashboard" link in the navbar instead of the login gate, and no app page is removed.
11. **Quality gate:** before reporting any phase, `npm run lint` and `npm run build` must pass. Fix only what you broke.
12. **Figures:** the name Partha is itself an epic name. Never caption, name, or label any figure. The archer stays anonymous (v2 Section 9).

---

## 3. Copy changes (replace v1 and v2 copy where it conflicts)

All text lives in `copy.ts`. Mark every item marked **(confirm)** with `// CONFIRM: copy owner`.

### 3.1 Positioning

- Audience: students of one engineering college and its alumni. The college name is not known. Use `[COLLEGE NAME]` as a placeholder in `copy.ts`, and show it only where the copy needs it (for example the footer).
- The guru in the epic metaphor is the **alumnus**: a senior who has walked the road.
- Tagline (unchanged): *Where every student finds a guru.*
- Subline (replaces *Mentorship for the path ahead.*) **(confirm)**: *Alumni mentorship for the path ahead.*
- Gurukul body (replaces the v2 body) **(confirm)**: *Partha connects students with alumni who have walked the road before them.*

### 3.2 Gurukul panels (v2 Section 6.3)

| Student | Title | Body **(confirm)** |
|---|---|---|
| 1 | Who it serves | Students looking for guidance, and alumni ready to give back. |
| 2 | How it works | Find an alumnus, send a request, and keep talking once they accept. |
| 3 | Why it matters | A senior's advice turns a question into a direction. |

### 3.3 App Highlights (replaces the v2 Section 6.4 card table)

These six cards match what the app does. **Do not add scholarships, competitions, fellowships, peer study circles, or session booking**, because the app has none of them.

| # | Title | Description **(confirm)** | Motif | Reaction (I-5) | Detail bullets **(confirm)** |
|---|---|---|---|---|---|
| 1 | Find Your Guru | Browse verified alumni by branch, company, domain, and skills. | Lamp | Flame flares, then flickers | Filter by branch, domain, and company · See what each alumnus is open to · Read public profiles |
| 2 | Request Mentorship | Ask for career guidance, a resume review, an internship referral, or project help. | Lotus | Petals open | Choose your goal · Send a short message · Chat once the alumnus accepts |
| 3 | Discover Opportunities | Internships, jobs, and projects posted by verified alumni. | Bow | Bowstring pulls back and releases | Internships, full-time roles, and collaborative projects · Posted by verified alumni · Apply through the listed link |
| 4 | Knowledge Hub | Interview prep and career guides written by alumni. | Palm-leaf manuscript | Leaf unrolls | Guides by domain · Read time shown · Upvote the ones that help |
| 5 | Verified and Private | Alumni are verified, and their contact details unlock only after they accept you. | Shield | Light sweeps across the shield | Verification status on every profile · Email, phone, and LinkedIn stay private · Shared only after acceptance |
| 6 | Save for Later | Bookmark alumni and opportunities to come back to. | Conch | Conch pulses once | Save mentors and listings · Keep a shortlist · Return when you are ready |

The six equipment icons become: lamp, lotus, bow, palm-leaf manuscript, shield, conch. The drum and the dharma wheel are dropped from the highlights. The dharma wheel remains in the hero scroll cue and the timeline gate badges.

### 3.4 Epic Path milestones (replaces v1 Section 6.5 copy)

1. **Create your profile:** Share your branch, semester, and the skills, domain, and company you are aiming for.
2. **Meet your alumni mentor:** Browse verified alumni and find someone who has walked your road.
3. **Ask and learn:** Send a mentorship request, and chat once it is accepted.
4. **Unlock opportunities:** Find internships, jobs, and projects posted by alumni.

### 3.5 Testimonials

Unchanged: placeholder quotes only, each labelled "Sample testimonial". No invented names or statistics.

### 3.6 New section: Give Back (alumni call to action)

Insert between Testimonials and the Login gate. Light mode, `--c-brand-green` background.

- Heading: **Walked the road? Guide the next seeker.**
- Body **(confirm)**: *Alumni can mentor students, post internships and jobs, and share guides.*
- Primary button: **Join as alumni**. It opens the app's sign-up flow with the alumni role preselected, if the app supports that. Otherwise it opens the normal sign-up and logs the gap in `DECISIONS.md`.
- Uses the I-9 sparks and magnetic pull on its button. Has a reduced-motion version like every other interaction.
- Add `give-back` to the navbar only if there is room. Do not crowd the navbar.

### 3.7 Footer

Keep the v2 footer. Add `[COLLEGE NAME]` and the line *A Placement & Alumni Cell initiative* **only if the owner confirms**. Otherwise leave both out.

---

## 4. Login gate changes (replaces v1 Sections 7.4 to 7.6 where they conflict)

The real app uses **Firebase Authentication**, so the mock adapter from v1 7.6 is not used in production.

1. **Adapter:** keep the `AuthClient` interface idea, but implement it as a thin wrapper around the auth code **already in the app** (found in the audit). Do not create a new Firebase project or a second Firebase initialization.
2. **Methods:** show only the sign-in methods the app already supports. If the audit finds Google sign-in but no email OTP, remove the "Continue with Email OTP" button. If it finds no password reset flow, remove the "Forgot password?" link. Do not ship a button that does nothing.
3. **Mock auth:** keep a mock `AuthClient` **only inside tests** (Vitest and Playwright). It must not exist in the production bundle. There is no `VITE_ENABLE_MOCK_AUTH` flag and no demo account in the app.
4. **Roles:** after sign-in, route by the user's role, using the app's existing logic: student, alumni, or admin. The gate animation plays first, then routing happens.
5. **Destination:** route to the app's existing post-login screen (found in the audit). Do not create a placeholder `/dashboard`.
6. **Errors:** map Firebase error codes to the v1 Section 7.4 copy. Never show raw Firebase error text. Use one generic message for wrong email or password, so the form does not reveal whether an account exists.
7. **Sign-up:** "New seeker? Create your account" opens the app's existing sign-up flow. Do not rebuild sign-up in this project.
8. **Everything else** in v2 Section 6.7 and Section 5.5 (I-10) still applies: the gate scene, the arrow, the door animation, reduced motion, and the focus rules.

---

## 5. Phase plan v2.1

| Phase | Name | Change from v2 |
|---|---|---|
| **0** | **Repo audit and integration** | **New. Runs first.** |
| 1 to 4 | Scaffold, static content, section motion, hero 3D | Done. Phase 0 confirms where the work lives and ports it if needed. |
| 4R-A | Theme and color rebuild | Uses the app's real brand colors and fonts. Also applies the copy changes in Section 3. |
| 4R-B | Hero scene: archer, chariot, arrow | Unchanged |
| 4R-C | Section interactions (I-3 to I-9) | Uses the new highlight motifs (shield, manuscript, conch) and the new Give Back section |
| 5 | Login | Firebase, per Section 4 |
| 6 | Responsive, reduced motion, accessibility | Unchanged |
| 7 | Performance | Unchanged. Budgets now include the existing app bundle. Measure only the landing route's added weight. |
| 8 | QA and deployment | Adds checks for the real-app rules in Section 2 |

---

## 6. Prompt preamble (paste at the top of every phase prompt from 4R-A onward)

```
REPO RULES for this phase:
- Work inside this repository on the branch landing-epic-theme. Do not create a new project.
- Precedence: docs/PARTHA_SPEC_v2_1_ADDENDUM.md overrides docs/PARTHA_LANDING_PAGE_SPEC_v2.md, which overrides docs/PARTHA_LANDING_PAGE_SPEC.md.
- Use the theme tokens, fonts, auth code, and navigation recorded in docs/INTEGRATION_AUDIT.md. Follow the integration rules in Section 2 of the addendum.
- Do not modify server.ts, firestore.rules, firestore.rules.test.ts, security_spec.md, or Firebase config files unless the phase says so.
- Use npm. Do not edit bun.lock.
- Before reporting, run `npm run lint` and `npm run build`. Both must pass.
- Commit at the end with the message "Phase <id>: <summary>".
```

---

## 7. Phase prompts that change

Paste each one only after the previous phase is reported.

### Phase 0: Repo audit and integration

```
Read docs/PARTHA_SPEC_v2_1_ADDENDUM.md, docs/PARTHA_LANDING_PAGE_SPEC_v2.md, and docs/PARTHA_LANDING_PAGE_SPEC.md. Precedence: addendum, then v2, then v1. Do only Phase 0. Do not change any visuals or styles.

Context: the real app lives in this repository (React 19, Vite, Tailwind 4, Express server.ts, Firebase Auth and Firestore). The landing page must be built inside it, not as a separate project.

1. Git: create the branch landing-epic-theme from main. If the git state is unclear, report it and continue.

2. Audit the repository and write docs/INTEGRATION_AUDIT.md. Answer each question with file paths as evidence:
   a. Structure: what are in src/, server/, lib/, and components/ui? List every page or view, and how the app switches between them (router, state, or something else).
   b. Existing landing and login: which files, what they render, which sign-in methods are wired (Google, email and password, other), how sign-up and role selection work (student, alumni), and where a user lands after sign-in.
   c. Theme: the exact hex values of the app's white and light green, any other brand colors, the fonts in use, the Tailwind 4 @theme tokens, the shadcn setup (components.json), and any dark mode.
   d. Phases 1 to 4: is the landing work (Lenis and GSAP setup, sections, copy.ts, the 3D hero) already inside this repository? If it is in a separate folder or branch on this machine, search likely locations and list the path and what exists. If it cannot be found, say so.
   e. Dependencies: list what is installed and what is needed. Needed: three, @react-three/fiber, @react-three/drei, vitest, jsdom, @testing-library/react, @playwright/test, @axe-core/playwright. Use Context7 to confirm which versions work with React 19 and Vite 8 before you choose.
   f. Dev server: how `npm run dev` serves the app (port, whether server.ts serves index.html for unknown routes).
   g. Auth: where the Firebase initialization lives, and which functions the app already uses to sign in, sign up, sign out, and reset a password.
   h. Risks: anything in this plan that could break auth, Firestore rules, or the server.

3. If the Phase 1 to 4 work is in a separate folder: port it into this repository on the branch.
   - Put it under src/landing/ (sections, motion, three, copy, assets).
   - Adapt imports. Do not copy the old package.json. Add only the dependencies from (e).
   - Mount the landing page at the app's root for logged-out users, using the app's existing navigation mechanism.
   - Remove nothing from the existing app.
   If the work is already in this repository, only record where it lives.

4. Install the missing dependencies from (e). Add `test` and `test:e2e` scripts only if they do not already exist.

5. Run `npm run lint` and `npm run build`. Fix only what you broke.

6. Commit with the message "Phase 0: audit and integrate".

Report:
- A short summary of docs/INTEGRATION_AUDIT.md: structure, navigation, auth methods, the exact brand colors and fonts, and where the landing work lives.
- What you ported, if anything.
- The dependency versions you added.
- Lint and build results.
- Risks and open questions.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phase 4R-A: additions

Paste the Section 6 preamble first. Then use the Phase 4R-A prompt from v2 Section 12, with these changes:

```
Changes for this run (these override the matching parts of the v2 Phase 4R-A prompt):
1. Brand values: do not use placeholders and do not ask me. Read the exact white and light green from docs/INTEGRATION_AUDIT.md.
2. Fonts: use the fonts in the addendum Section 2, item 8 (Cormorant Garamond, Montserrat, and Noto Serif Devanagari only). Remove any Cinzel, Inter, or Mukta from the landing page.
3. Tokens: register the v2 epic tokens through Tailwind 4 @theme, without overwriting the app's existing tokens.
4. Copy: apply every copy change in addendum Section 3 to copy.ts (positioning, Gurukul panels, the six highlight cards, the Epic Path milestones, and the new Give Back section). Items marked (confirm) get a "// CONFIRM: copy owner" comment.
5. Highlight icons: use the six motifs from addendum Section 3.3 (lamp, lotus, bow, palm-leaf manuscript, shield, conch) as placeholder SVGs, each with an animatable part.
6. Give Back section: build it statically (light mode, brand-green background) between Testimonials and the Login gate. No motion yet.
7. Do not add scholarships, competitions, fellowships, peer study circles, or session booking anywhere.
```

### Phase 4R-C: additions

Paste the Section 6 preamble first. Then use the Phase 4R-C prompt from v2 Section 12, with these changes:

```
Changes for this run:
1. I-5 reactions follow addendum Section 3.3: lamp flares and flickers; lotus petals open; bow pulls and releases; palm-leaf manuscript unrolls; shield gets a light sweep; conch pulses once.
2. Add the I-9 sparks and magnetic pull to the "Join as alumni" button in the Give Back section, with the same keyboard and reduced-motion rules as the other CTAs.
3. The Give Back section's reveal is a simple fade and rise, run once.
```

### Phase 5: Login (Firebase version)

Paste the Section 6 preamble first. Then use this prompt **instead of** the v2 Phase 5 prompt:

```
Read docs/PARTHA_SPEC_v2_1_ADDENDUM.md Section 4, docs/PARTHA_LANDING_PAGE_SPEC_v2.md Sections 6.7, 5.5 (I-10), and 8, and docs/PARTHA_LANDING_PAGE_SPEC.md Sections 7.1 to 7.5. Read docs/INTEGRATION_AUDIT.md for the app's real auth code. Do Phase 5 only.

Goal: make the login gate work with the app's real Firebase authentication, in the v2 style, with the gate-arrow interaction on success.

1. Adapter: write src/landing/auth/authClient.ts as a thin wrapper around the existing auth functions listed in the audit. Do not initialize Firebase a second time and do not create a new Firebase project. Return a result object with ok or a reason: invalid_credentials, network, too_many_requests, or unknown.

2. Methods: show only the sign-in methods the app already supports. Remove any button or link whose method does not exist in the app (for example Email OTP or Forgot password). Do not ship dead buttons.

3. Validation and copy: v1 Sections 7.1 to 7.5 (labels, validation timing, states, Caps Lock hint). Map Firebase error codes to the v1 Section 7.4 messages. Show one generic message for a wrong email or password. Never show raw Firebase error text.

4. Roles and routing: after sign-in, play the gate animation, then route using the app's existing role logic (student, alumni, admin) to the existing post-login screen. Move focus to that screen's main heading. Do not create a placeholder dashboard.

5. Sign-up: "Create your account" opens the app's existing sign-up flow. Do not rebuild sign-up. The "Join as alumni" button opens it with the alumni role preselected if the app supports that. Otherwise it opens the normal sign-up, and you log the gap in DECISIONS.md.

6. Logged-in users: if a user is already signed in, the landing page shows a "Go to your dashboard" link in the navbar and a short signed-in note in place of the form.

7. Gate: build the I-10 arrow and door animation as in v2 (arrow 0.8s, doors 1.2s, reduced motion crossfade 300ms).

8. Tests: write a test-only mock of the auth client (in the tests folder, never imported by app code). Unit-test validation, the error mapping, and the disabled-inputs-while-submitting state. Confirm with a production build that no mock auth code or demo credentials appear in the bundle.

Verify:
- A real sign-in works against the app's Firebase setup, and the gate plays and routes by role. If you cannot sign in because no test account is available, say so, test everything else, and tell me exactly what you need.
- A wrong password shows the generic message.
- No raw Firebase error text appears anywhere.
- Screenshots of each login state at 390px, 768px, and 1440px.
- `npm run lint` and `npm run build` pass.

Report: what you built, test results, the screenshot list, what you could not verify and why, and your DECISIONS.md additions.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phases 4R-B, 6, 7, and 8

Paste the Section 6 preamble first, then the matching prompt from v2 Section 12, with these changes:

- **4R-B and 6:** no changes.
- **7:** measure only the weight the landing page adds to the app. Report the existing app bundle size as the baseline.
- **8:** replace the "demo login" and "mock auth" checks with these:
  - Firebase sign-in works for each role the owner can test.
  - No mock auth code appears in the production bundle.
  - `npm run lint` and `npm run build` pass.
  - `firestore.rules`, `server.ts`, and the Firebase config files are unchanged (show `git diff main --stat`).
  - Logged-in users are not forced to see the landing page.
  - The Give Back button opens the sign-up flow.

---

**End of addendum.**
