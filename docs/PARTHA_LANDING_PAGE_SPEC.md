# PARTHA: Landing Page and Login Build Specification

> **For the coding agent:** Read this entire file before writing any code. Build in the phases listed in Section 12. Where something is marked `PLACEHOLDER`, use the placeholder value and add a `// TODO(content):` comment. Do not invent statistics, testimonials, partner names, or product features and present them as real.

---

## 1. Product context

**Partha** is a mentorship and opportunities platform for students. Students browse mentors, book guidance sessions, and discover internships, scholarships, competitions, and fellowships.

The landing page presents the product through the **Ramayana and Mahabharata** theme. The student is the *shishya* (seeker), the mentor is the *guru* (guide), and the login is the gate the seeker walks through.

**Audience:** school and college students, mainly in India with international reach. Parents and prospective mentors also visit.

---

## 2. Goals and non-goals

**Goals**
- Tell the full product story in one scroll journey: what Partha is, who it is for, how it works, and what it offers.
- Keep the login reachable at all times (nav link) and make it the clear destination at the end of the journey.
- Feel cinematic and rooted in Indian visual culture without becoming kitschy.
- Work as well on mobile as on desktop.

**Non-goals**
- No backend work beyond the auth adapter in Section 7.6.
- No CMS. All visible text lives in `src/content/copy.ts`.
- No blog, pricing page, or multi-page app in this build. Only the landing page plus placeholder routes `/signup`, `/forgot-password`, and `/dashboard`.

---

## 3. Tech stack

Use this stack unless the repository already has one. If it does, keep the design and motion rules in this file and adapt the implementation. Record the choice in `DECISIONS.md`.

- **React 18+** with **TypeScript**, built with **Vite**
- **Tailwind CSS** for layout, with design tokens as CSS variables
- **GSAP + ScrollTrigger** for scroll-linked animation
- **Lenis** for smooth scrolling, connected to ScrollTrigger
- **Three.js** via **@react-three/fiber** and **@react-three/drei** for the hero scene and the gate. Lazy-load it.
- **Framer Motion** for component-level transitions (button states, dialog and drawer transitions) where GSAP is not needed
- **Zod** with React Hook Form (or plain React state) for form validation
- **Vitest + React Testing Library** for unit tests; **Playwright** for one smoke test on the landing page

---

## 4. Visual system

### 4.1 Color tokens

Define these on `:root` in `src/styles/tokens.css`. Use these exact names everywhere.

```css
:root {
  --c-night-0: #0B1026;    /* deepest background */
  --c-night-1: #1B1F4B;    /* section background */
  --c-night-2: #262B63;    /* raised surfaces, cards */
  --c-saffron: #F4A21B;    /* primary accent, CTAs */
  --c-marigold: #FF7A1A;   /* gradient partner for saffron */
  --c-vermilion: #C0392B;  /* sparing emphasis only. Never for errors. */
  --c-gold: #D4AF37;       /* borders, ornaments, heading details */
  --c-ivory: #FFF6E3;      /* primary text on dark */
  --c-ivory-dim: #D9CFB8;  /* secondary text. Must pass 4.5:1 on night-1. */
  --c-lotus: #E88DB0;      /* secondary accent */
  --c-peacock: #1F7A7A;    /* secondary accent */
  --c-focus: #FFD166;      /* focus ring */
  --c-error: #F2B8A2;      /* form error text on dark */
}
```

**Gradients**
- CTA: `linear-gradient(135deg, var(--c-saffron), var(--c-marigold))`
- Background: `linear-gradient(180deg, var(--c-night-0) 0%, var(--c-night-1) 100%)`

**Rules**
- Dividers are 1px gold lines at 40% opacity.
- Never use pure white.

### 4.2 Typography

Self-host fonts where possible (performance).

- **Display:** Cinzel (hero title, section headings, card titles)
- **Devanagari accent:** Noto Serif Devanagari (Sanskrit and Hindi words, shlokas)
- **Body and UI:** Inter by default. Use Mukta where Devanagari and Latin text appear together in body copy.

**Type scale (desktop / mobile)**

| Role | Size | Font |
|---|---|---|
| Hero title | 96px / 56px, letter-spacing 0.08em, gold gradient | Cinzel |
| H2 section title | 56px / 36px | Cinzel |
| H3 card title | 24px / 20px | Cinzel |
| Body | 18px / 16px, line-height 1.6 | Inter |
| Meta / small | 14px / 13px | Inter |

Keep body paragraphs between 60 and 72 characters per line.

### 4.3 Motifs

Use these as the recurring visual language. Draw them as inline SVG with a 1.5px gold stroke so they stay crisp and light.

- **Lotus:** hero, dividers, logo
- **Diya (oil lamp):** hero, loaders, login glow
- **Chakra:** scroll cue, loaders, section markers
- **Gopuram (temple tower):** silhouette in the hero and footer
- **Shankha (conch):** card icon
- **Dhanush (bow):** card icon, section 2
- **Palm leaf:** testimonial cards, card icon
- **Ratha (chariot):** timeline
- **Dwara (temple gate):** login

Use abstract or geometric forms for anything figurative. **Do not draw or model any deity or epic character.**

### 4.4 Texture and atmosphere

- Subtle paper grain across the page: a repeating noise PNG or an SVG `feTurbulence` filter at 4 to 6% opacity
- Soft radial glows behind the hero and the login (saffron at about 15% opacity, blurred)
- Sparse star particles (see 6.1 for counts)
- Slow upward drifting diya particles, 20 to 40 maximum

---

## 5. Motion system

### 5.1 Scroll engine

- Initialize Lenis once at the app root. Call `lenis.on('scroll', ScrollTrigger.update)` and drive Lenis from GSAP's ticker.
- `src/motion/useScrollProgress.ts` returns a 0 to 1 progress value for a given section, using ScrollTrigger's `progress`. The hero scene and several text effects use it.
- Scroll-linked motion uses `scrub` between 0.6 and 1.0 for smoothness. One-time entrances use `once: true` triggers.

### 5.2 Easing and durations

- Entrances: `power3.out`, 0.8 to 1.1s
- Scrubbed motion: `linear` or `power1.inOut` (scrub already smooths it)
- Stagger: 0.08 to 0.12s between items
- Hover and tap feedback: 180 to 250ms, `power2.out`
- No more than about three unrelated elements animate at the same moment.

### 5.3 Reduced motion

Read `matchMedia('(prefers-reduced-motion: reduce)')` at startup and listen for changes. When it is set:
- Turn off Lenis (use native scroll)
- Turn off 3D camera movement and particle drift. Show the static hero frame.
- Replace slide, tilt, and bounce entrances with opacity fades of 200ms or less
- The page must remain fully usable

### 5.4 Performance budget

- Landing route initial JS, gzipped, excluding Three.js: **under 200 KB**
- Three.js chunk, gzipped, lazy-loaded after first paint: **under 250 KB**
- No external 3D model files over 300 KB. Build the lotus and diya procedurally in Three.js.
- Keep the 3D scene to one directional light, one point light (diya), and under 20 draw calls.
- Pause the render loop when the hero is off-screen (IntersectionObserver).
- Cap `devicePixelRatio` at 1.5 on mobile.
- Images in WebP or AVIF, with explicit `width` and `height` to prevent layout shift.
- LCP under 2.5s on a throttled mid-range mobile profile. The hero must paint its static 2D fallback first.
- Target 60fps on a mid-range Android device.

---

## 6. Page structure and section specs

**Page order**
0. Navigation bar
1. Hero (3D)
2. The Question
3. The Gurukul (what Partha is)
4. App Highlights
5. The Epic Path (timeline)
6. Stories of Guidance (testimonials)
7. Login: The Gate
8. Footer

### 6.0 Navigation bar

- Fixed to the top. Transparent over the hero. After 80px of scroll it becomes night-0 at 85% opacity with a backdrop blur.
- **Left:** lotus logo mark and the "Partha" wordmark in Cinzel
- **Links:** Mentors, Opportunities, How it works, Stories (anchor links to sections)
- **Right:** "Log in" (ghost button, scrolls to Section 7) and "Sign up" (saffron button, routes to `/signup`)
- **Mobile:** hamburger opens a full-screen drawer with the same links. Close with a button or the Escape key. Focus moves into the drawer when it opens and returns to the trigger when it closes.

### 6.1 Hero

**Layout:** full viewport height (`100svh`). Content centered. 3D scene behind it.

**Content**
- Title: **Partha**
- Tagline (Cinzel, ivory): *Where every student finds a guru.*
- Subline (Inter, ivory-dim): *Mentorship for the path ahead.*
- Primary CTA: **Enter the Gurukul** (scrolls to Section 7)
- Secondary text link: *Explore the journey*
- Scroll cue: a chakra icon at the bottom with a slow pulse

**3D scene** (`src/three/HeroScene.tsx`)
- A fixed canvas behind the content, `pointer-events: none`, `aria-hidden="true"`
- Layers, back to front:
  1. **Sky:** gradient background and drifting star points (about 500 on desktop, 150 on mobile)
  2. **Gopuram silhouette:** an SVG layer, not 3D, moving at 0.4 times scroll speed for parallax
  3. **Lotus:** procedural, 8 petals built from lathe or extruded curves. Gold-to-saffron material with emissive edges. Starts closed and opens fully across the first viewport height of scroll.
  4. **Diya:** a small bowl mesh, an emissive flame sprite, and a point light. Flicker the intensity with noise (about ±15%).
- **Camera:** moves forward on the Z axis by 2 to 3 units as scroll progress runs from 0 to 1, with a slight tilt. The title fades and shifts upward over the same range.
- **Pointer parallax** (desktop only): camera moves about ±0.3 units, eased.

**Fallback:** if WebGL is unavailable or the device is in low-power mode, show a static layered 2D composition with the same content: sky gradient, gopuram SVG, lotus SVG, and diya glow. Keep the scroll-linked fade.

**Mobile:** lower particle count and resolution. The lotus still opens on scroll. No pointer parallax.

### 6.2 The Question

- Full-height section on night-0.
- Text: *Every seeker begins with a question.* Cinzel, 56px, ivory, with the word "question" in saffron.
- **Reveal:** split the text into words. Each word moves from 15% opacity to full opacity, with an 8px upward offset to zero, scrubbed across the section.
- **Background:** a footpath of small glowing diya dots receding toward a horizon. The dots light one by one as the user scrolls. Use SVG or canvas.
- After the first line is fully revealed, a second line fades in: *Partha answers it by connecting you with someone who has already walked that road.*

### 6.3 The Gurukul: what Partha is

- **Heading:** *The Gurukul, reimagined.*
- **Body:** *Partha connects students with mentors who have walked the road before them.*
- **Visual:** a ring of six golden arches shaped like temple pillars, outlined with gold stroke. Use CSS 3D transforms (`transform-style: preserve-3d`, each arch rotated 60° on the Y axis). The ring rotates with scroll progress across the section, from 0° to 300°.
- The front arch is active. It shows one of three text panels, each with a title and body. Arches behind it dim to 30% opacity.
  - **Who it serves:** Students from school to postgraduate level, across fields and cities.
  - **How it works:** Browse verified mentors, book a session, and grow over time.
  - **Why it matters:** Good guidance turns a question into a direction.
- **Mobile:** the arches become a horizontal, swipeable row of three cards with snap scrolling. No 3D rotation.

### 6.4 App Highlights

- **Heading:** *Everything a seeker needs.*
- **Sub:** *Six tools for the road ahead.*

Six cards. Each has a motif icon, a gold Cinzel title, and a two-line description.

| # | Title | Icon | Description |
|---|---|---|---|
| 1 | Find Your Guru | Diya | Browse verified mentors by field, skill, and experience. |
| 2 | Book Guidance Sessions | Lotus | Schedule one-to-one or group mentoring calls. |
| 3 | Discover Opportunities | Bow | Internships, scholarships, competitions, and fellowships curated for students. |
| 4 | Track Your Growth | Chakra | A personal dashboard with goals and milestones. |
| 5 | Community of Shishyas | Palm leaf | Peer discussions, study circles, and shared learning. |
| 6 | Mentor Insights | Conch | Ratings, reviews, and profiles to help you choose with confidence. |

**Layout:** 3 columns on desktop, 2 on tablet, 1 on mobile.

**Entrance motion**
- Each card enters when it is 15% into the viewport (ScrollTrigger, `once: true`).
- Entry directions alternate by card: 1 from left, 2 from bottom, 3 from right, 4 from left, 5 from bottom, 6 from right.
- Translate 60px, fade from 0 to 1, 0.9s, `power3.out`. Stagger cards in the same row by 0.1s.

**Hover (fine pointer only)**
- 3D tilt up to 8°, following the pointer
- Gold border glow
- Icon rotates 6°
- Resets over 400ms on leave

**Detail reveal (required)**
- Each card has a "Learn more" button. Activating it (click, tap, or Enter) expands the card in place with a smooth height animation and reveals three detail bullets. Activating it again collapses the card.
- Use `aria-expanded` and `aria-controls` on the button.
- Detail bullets are placeholders. Confirm them with the product team.

| Card | Detail bullets (PLACEHOLDER) |
|---|---|
| Find Your Guru | Filter by field, language, and experience · See availability · Read verified profiles |
| Book Guidance Sessions | One-to-one or group calls · Pick a time that fits · Reminders before each session |
| Discover Opportunities | Internships, scholarships, competitions, fellowships · Matched to your profile · Deadlines in one place |
| Track Your Growth | Set goals with your mentor · Milestones and progress · Session history |
| Community of Shishyas | Topic-based discussion rooms · Study circles · Peer Q&A |
| Mentor Insights | Ratings and reviews · Verified credentials · Clear session summaries |

### 6.5 The Epic Path (timeline)

- **Heading:** *Your path, step by step.*

**Desktop and tablet (viewport height 700px or more):** the section pins for about 300vh of scroll. A horizontal track moves left to right as the user scrolls down. A gold chariot (SVG) travels along a winding road path. The path draws itself with `stroke-dashoffset` as progress increases.

Four milestones appear as progress crosses these thresholds: 0.20, 0.45, 0.70, 0.90.

1. **Create your profile:** Tell us your field, your goals, and where you are starting from.
2. **Meet your mentor:** Match with a guide who has walked a similar road.
3. **Learn and grow together:** Sessions, goals, and feedback that build over time.
4. **Unlock opportunities:** Internships, scholarships, and competitions matched to your growth.

Each milestone shows a number inside a chakra badge, a title, and a one-line description.

**Mobile, or viewport height under 700px:** no pinning. Use a vertical timeline with a gold line that fills with scroll progress. The chariot icon sits at the leading edge of the fill. Milestones fade in as they reach the center of the screen.

### 6.6 Stories of Guidance (testimonials)

- **Heading:** *Words from the road.*
- Cards styled as palm-leaf manuscripts: cream background (`#F3E5C0`) with grain, an ornamental gold border (SVG), and a slight rotation between -1° and 1° for character.
- Each card shows the quote, the student's name, field, and city.
- **Carousel:** auto-advances every 6 seconds. Pauses on hover and focus. Supports swipe on touch. Includes previous and next buttons and dot indicators, all labelled.
- **Content is PLACEHOLDER.** Mark each quote `// PLACEHOLDER`. In development, show a visible "Sample testimonial" tag. Do not publish invented testimonials.
- **Background:** sparse, slow diya particles (CSS or canvas).

### 6.7 Login: The Gate

The conversion point. Full spec in Section 7.

- The section pins for about 100vh of scroll. On entry, the temple gate (two door panels) is slightly ajar, about 8°, with warm gold light showing through the gap.
- The login card sits centered in front of the gate. Glassmorphism: background `rgba(27, 31, 75, 0.6)`, backdrop blur 16px, 1px gold border at 35% opacity, 20px radius.

### 6.8 Footer

- Background night-0, with a gold lotus divider along the top edge (SVG).
- **Four columns:**
  - Product: Mentors, Opportunities, How it works
  - Company: About, Contact
  - Legal: Privacy, Terms
  - Social: placeholder links (`#`)
- **Bottom row:** `© {year} Partha. All rights reserved.` Next to it, the line *विद्या ददाति विनयम्* with the translation "Knowledge gives humility," set in Noto Serif Devanagari in gold. Add `// VERIFY: native speaker review before launch`.
- A small gopuram silhouette behind the footer at 5% opacity.

---

## 7. Login section: full specification

### 7.1 Fields

- **Email:** visible label "Email". `type="email"`, `autocomplete="email"`, required.
- **Password:** visible label "Password". `type="password"`, `autocomplete="current-password"`, required. Include a show and hide toggle: a button with `aria-label` "Show password" or "Hide password" and `aria-pressed`.
- **"Forgot password?"** link under the password field, right-aligned, routes to `/forgot-password`.

Labels are always visible. Placeholder text is never used as a label.

### 7.2 Buttons and layout

- **Primary:** **Begin Your Journey**. Full width. Saffron gradient with night-0 text. Soft glow on hover. Press scale 0.98.
- **Divider:** the word *or* between two gold hairlines.
- **Secondary:** **Continue with Google** (outlined, with the Google mark) and **Continue with Email OTP** (outlined).
- **Footer line:** *New seeker?* followed by **Create your account** (routes to `/signup`).

### 7.3 Form states

| State | Behavior |
|---|---|
| Idle | Default. |
| Submitting | Button shows a small diya or chakra spinner and the label "Opening the gate…". All inputs are disabled. |
| Error | Inline message under the relevant field, or a form-level message above the primary button. Use `aria-live="polite"`. |
| Success | Button shows a check mark. The gate doors open (1.2s). Then route to `/dashboard`. |

### 7.4 Validation and error copy

- Use gold for guidance text. Use `--c-error` (`#F2B8A2`) for errors, with an icon. Never rely on color alone: every error has text and an icon.
- Validate on blur. After a field has been blurred once, validate on each keystroke. Always validate on submit.

| Condition | Message |
|---|---|
| Email invalid | Enter a valid email address. |
| Password empty | Enter your password. |
| Password under 8 characters (sign-up only) | Use at least 8 characters. |
| Wrong credentials | We couldn't find an account with these details. Check the email and password, or try Google. |
| Network failure | Something went wrong on our side. Please try again in a moment. |

### 7.5 Interactions

- Enter submits the form.
- When Caps Lock is on, show a small hint under the password field. Detect it with `getModifierState('CapsLock')` on keydown.
- **Email OTP flow:** after "Continue with Email OTP," show a six-digit code input. Advance focus automatically, support paste, and offer "Resend code" with a 30-second cooldown.

### 7.6 Auth adapter (where real auth plugs in)

Create `src/auth/authClient.ts` with this interface. Implement it with mocks now. The real backend replaces the function bodies later.

```ts
export type AuthUser = { id: string; email: string; name?: string };

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'invalid_credentials' | 'network' | 'unknown' };

export interface AuthClient {
  signInWithPassword(email: string, password: string): Promise<AuthResult>;
  signInWithGoogle(): Promise<AuthResult>;
  requestEmailOtp(email: string): Promise<{ ok: boolean }>;
  verifyEmailOtp(email: string, code: string): Promise<AuthResult>;
  requestPasswordReset(email: string): Promise<{ ok: boolean }>;
}
```

**Mock behavior**
- Add 800ms of simulated latency to every call.
- Accept `demo@partha.dev` with password `password123` only when `import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true'`. Any other credentials return `invalid_credentials`.
- Google sign-in and OTP verification succeed for the demo account only.

In `README.md`, document where real endpoints, OAuth redirect URIs, and session or token storage will go.

### 7.7 Gate animation

- **Doors:** two panels with a carved lattice texture. The pattern is geometric, not figurative. Each panel pivots on its outer edge.
- **Idle:** each door is open about 8°. A radial saffron glow sits behind the gate at 40% opacity.
- **On success:** each panel rotates to 90° over 1.2s (`power2.inOut`). The light intensifies, then the page fades to the next route.
- **Reduced motion:** skip the rotation. Crossfade to the next route in 300ms.

---

## 8. Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `section` with `aria-labelledby`, `footer`.
- A skip-to-content link becomes visible on focus.
- Focus ring: 2px solid `--c-focus`, 2px offset, on every interactive element.
- Body text meets WCAG AA contrast (4.5:1). Large text of 24px or more meets 3:1. Check `--c-ivory-dim` and gold text on navy in particular.
- Decorative SVG is `aria-hidden="true"`. Meaningful SVG gets `role="img"` and an `aria-label`.
- The 3D canvas is `aria-hidden="true"`. Everything it decorates is fully present in the DOM.
- Touch targets are at least 44×44px.
- Carousels have a pause control, keyboard arrow support, and labelled dots.
- The page works with JavaScript animation disabled and with keyboard alone.

---

## 9. Responsive behavior

**Breakpoints:** mobile below 640px, tablet 640 to 1023px, desktop 1024 to 1439px, wide 1440px and above.

**Test widths:** 390×844 (phone), 768×1024 (tablet), 1440×900 (desktop).

| Area | Mobile | Tablet | Desktop |
|---|---|---|---|
| Hero | Layered 2D with lighter 3D | 3D | 3D with pointer parallax |
| Highlight cards | 1 column | 2 columns | 3 columns |
| Gurukul arches | Swipeable row | 3D ring | 3D ring |
| Epic Path | Vertical | Horizontal pinned (if height ≥ 700px) | Horizontal pinned |
| Login card | Full width, 20px gutters | Max 440px | Max 440px, centered |

No horizontal page scroll at any width.

---

## 10. Cultural and content guidelines

- Use mythology as metaphor and as design language. **Do not depict Rama, Sita, Krishna, Arjuna, Hanuman, or any other deity or epic character** in human, animal, or any other form. Do not use their names as marketing hooks.
- Keep mythological references respectful and purposeful: the guru and shishya relationship, the journey, and the question. Avoid battle scenes and violence.
- Every Sanskrit or Hindi phrase must be accurate. Mark each one in code with `// VERIFY: native speaker review before launch`.
- Avoid stereotyped "exotic" styling: no sitar sound effects, no cliché imagery, no cartoon gods.
- The tone is warm, confident, and modern. The mythology drives the visuals. The copy stays in plain English with light Sanskrit accents.
- Present Partha as serving students of every background.

---

## 11. Project structure

```
partha-landing/
├─ public/
│  ├─ fonts/
│  ├─ images/              # WebP or AVIF; placeholders are fine
│  └─ svg/                 # lotus, diya, chakra, gopuram, ratha, dwara, shankha, dhanush
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ content/copy.ts      # all visible text lives here
│  ├─ styles/tokens.css
│  ├─ styles/globals.css
│  ├─ motion/
│  │  ├─ lenis.ts
│  │  ├─ useScrollProgress.ts
│  │  └─ useReducedMotion.ts
│  ├─ three/
│  │  ├─ HeroScene.tsx
│  │  ├─ Lotus.tsx
│  │  ├─ Diya.tsx
│  │  └─ Gate.tsx
│  ├─ sections/
│  │  ├─ Navbar.tsx
│  │  ├─ Hero.tsx
│  │  ├─ Question.tsx
│  │  ├─ Gurukul.tsx
│  │  ├─ Highlights.tsx
│  │  ├─ EpicPath.tsx
│  │  ├─ Testimonials.tsx
│  │  ├─ LoginGate.tsx
│  │  └─ Footer.tsx
│  ├─ components/          # Button, Card, Icon, Divider, Carousel, PasswordField
│  ├─ auth/
│  │  ├─ authClient.ts
│  │  └─ LoginForm.tsx
│  └─ lib/                 # validation, a11y helpers
├─ tests/
├─ DECISIONS.md            # every choice made without asking, with reasons
└─ README.md               # run instructions, env vars, where real auth plugs in
```

---

## 12. Build order

Work in this order. After each phase, run the app, check all three test widths, and update `README.md` with what changed.

1. **Scaffold.** Vite, React, TypeScript, Tailwind, tokens, fonts, grain overlay, Lenis, and ScrollTrigger wired together. Empty sections with the correct IDs.
2. **Static content.** Every section rendered with its copy and layout, with no animation. Confirm contrast and readability.
3. **Section motion.** Add the motion from Section 6 for The Question, The Gurukul, App Highlights, Epic Path, and Testimonials.
4. **Hero 3D.** Build the static 2D fallback first, then the React Three Fiber scene. Confirm the fallback appears when WebGL is unavailable.
5. **Login.** Form, validation, states, mock auth adapter, gate animation, and success routing.
6. **Responsive, reduced motion, accessibility.** Walk every section at every width with reduced motion turned on. Fix what you find.
7. **Performance.** Check bundle sizes, confirm lazy loading, measure LCP, and check frame rate with CPU throttling.
8. **QA.** Run the tests. Aim for Lighthouse 90 or higher on mobile performance (with motion on) and 100 on accessibility. Work through the checklist in Section 13.

Report back after each phase with a short summary.

---

## 13. Definition of done

- [ ] Sections appear in the order defined in Section 6, with smooth scrolling.
- [ ] The hero 3D scene animates on scroll. The 2D fallback works without WebGL.
- [ ] Each section's scroll effect works and matches its spec.
- [ ] Six highlight cards animate in. Each one expands to reveal its details by click, tap, or Enter.
- [ ] The timeline pins on desktop and becomes vertical on mobile.
- [ ] The login form includes every field, state, and error message from Section 7.
- [ ] Mock auth works with the demo account when the env flag is set. Wrong credentials show the correct error.
- [ ] The gate animation plays on success and respects reduced motion.
- [ ] Reduced motion turns off parallax, 3D camera movement, and particle drift.
- [ ] No horizontal scroll at 390px, 768px, or 1440px.
- [ ] Keyboard-only navigation works end to end, with a visible focus ring everywhere.
- [ ] All body text passes WCAG AA contrast.
- [ ] No deity or epic character imagery. Every Devanagari phrase is marked for verification.
- [ ] Initial landing JS is under 200 KB gzipped. Three.js is lazy-loaded.
- [ ] No placeholder testimonial or statistic appears as real.
- [ ] `DECISIONS.md` and `README.md` are complete.

---

## 14. Placeholder content and assets

| Item | Placeholder | Owner |
|---|---|---|
| Logo | Simple lotus mark with "Partha" wordmark | Designer |
| Testimonials | Three sample quotes, labelled as samples | Product team |
| Statistics (mentor count, student count) | Not shown until real numbers exist | Product team |
| Social links | `#` | Marketing |
| Legal pages (Privacy, Terms) | Stub routes | Legal |
| Sanskrit and Hindi phrases | Verify with a native speaker | Content lead |
| Feature details in highlight cards | Confirm against the real app | Product team |

---

## 15. Default decisions

If nothing else is specified, use these defaults and log each one in `DECISIONS.md`. Do not stop mid-build to ask questions.

- **Stack:** as listed in Section 3
- **Theme:** dark only. No light mode in this build.
- **Language:** English only. Set `lang="en"`. Keep all strings in `copy.ts` so they are ready for translation later.
- **Routes:** `/` (landing), `/signup` (placeholder), `/forgot-password` (placeholder), `/dashboard` (placeholder)
- **Track Your Growth:** used as the card title. The "dharma" idea may appear in supporting copy only.

---

**Start with Phase 1 and report back after each phase.**
