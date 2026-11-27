# PARTHA: Landing Page Spec v2 (Epic Theme, Brand Colors, Interaction)

> **Status:** This file supersedes parts of `PARTHA_LANDING_PAGE_SPEC.md` (v1). It replaces v1 Sections 4 (visual system), 6 (section specs), 7 (visual parts only), and 10 (cultural rules). Everything else in v1 still applies, including the scroll engine (5.1), reduced motion rules (5.3), performance budget (5.4), login functions (7.1 to 7.6), accessibility (8), responsive rules (9), and the placeholder list (14).
>
> **Where they conflict, v2 wins.**
>
> **Keep both files** in the project's `docs/` folder.

> **For the coding agent:** Read this whole file. Then read v1 Sections 5.1, 5.3, 5.4, 7.1 to 7.6, 8, and 9. Build only the phase you were asked for. Use placeholders where marked. Log every decision in `DECISIONS.md`.

---

## 1. What changed and why

Feedback after Phase 4:

1. **Not interactive enough.** The only interaction was scrolling.
2. **Theme too thin.** Only diyas and lotuses appeared. The brief asked for the Ramayana and Mahabharata world, including people, weapons, and vehicles.
3. **Colors do not match the client's website.** The client's site is mostly white with light green. The midnight-and-saffron palette feels like a different product.

Changes in v2:

- **Theme:** adds anonymous characters (archer, charioteer, sage-teacher, students, warriors), equipment (bow, arrows, shield, sword, mace, conch, drum, palm-leaf manuscripts), vehicles (chariot, horses, war elephant, boat, flying palace), and places (gurukul, banyan forest, river ghat, palace gate).
- **Colors:** blends the epic palette with the client's brand white and light green. Light "gurukul" sections alternate with dark "epic" sections.
- **Interaction:** the archer shoots on load, the chariot moves with scroll, the arrow lands on a word, students and motifs react to taps and hovers, milestone gates light up, palm-leaf testimonials unroll, and the login gate opens with an arrow.
- **Character rule changed:** v1 banned all figures. **v2 allows anonymous silhouettes** (see Section 9). Named epic characters and deities remain banned.

---

## 2. Goals

- The page feels like an epic journey you can play: every section responds to the visitor.
- The Ramayana and Mahabharata world is recognizable at a glance: a chariot, a bow, students under a banyan tree, a palace gate, a lamp-lit river.
- The site looks like part of the client's brand, not a separate product.
- Every interaction works with a mouse, a keyboard, touch, and reduced motion.

---

## 3. Stack

Use the stack in v1 Section 3. No new libraries are required.

- Draw art as inline SVG or SVG files in `public/svg/`.
- Animate paths with `stroke-dashoffset`. Do not rely on a paid GSAP plugin.
- Animate only `transform` and `opacity`. The only exception is the Epic Path road, which uses `stroke-dashoffset`.

---

## 4. Visual system v2

### 4.1 Brand bridge (client colors)

Two values come from the client. They replace the placeholders below.

| Token | Meaning | Placeholder until supplied |
|---|---|---|
| `--c-brand-white` | Client's main white | `#FFFFFF` |
| `--c-brand-green` | Client's light green | `#DDF3E0` |

If the client supplies a website URL instead, read the colors from that site's CSS and record the source in `DECISIONS.md`.

**Rules for brand colors**
- Use brand white and brand green only as backgrounds in light sections: Gurukul, Highlights, and Testimonials.
- Never use brand green for errors or focus rings.
- Mark the placeholders in `tokens.css` with `/* PLACEHOLDER: replace with client brand */`.

### 4.2 Epic palette tokens

Define these in `src/styles/tokens.css`. Use these exact names.

```css
:root {
  /* Dark epic sections */
  --c-night-0: #0B1026;        /* deepest background */
  --c-night-1: #1B1F4B;        /* indigo section background */
  --c-forest: #1E4D3B;         /* banyan forest green */
  --c-forest-900: #14382A;     /* deep forest: headings on light, footer background */
  --c-peacock: #1F7A7A;        /* secondary accent */

  /* Accents */
  --c-saffron: #F4A21B;        /* primary accent, CTAs */
  --c-marigold: #FF7A1A;       /* gradient partner for saffron */
  --c-vermilion: #B83227;      /* war banner red. Sparing use only. */
  --c-terracotta: #B5652B;     /* road, chariot wood */
  --c-bronze: #8C6A3B;         /* armor, shadows, equipment */
  --c-gold: #D4AF37;           /* borders, ornaments, hairlines */
  --c-lotus: #E88DB0;          /* lotus accent */

  /* Text and surfaces */
  --c-ivory: #FFF6E3;          /* text on dark */
  --c-ivory-dim: #D9CFB8;      /* secondary text on dark (must pass 4.5:1 on night-1) */
  --c-parchment: #F3E5C0;      /* palm-leaf and manuscript surfaces */
  --c-ink: #1B1F4B;            /* body text on light */
  --c-ink-soft: #3B4170;       /* secondary text on light */

  /* Feedback */
  --c-error: #F2B8A2;          /* error text on dark */
  --c-error-light: #9B2C1F;    /* error text on light */
  --c-focus: #FFD166;          /* focus ring on dark */

  /* Client brand (placeholders, see 4.1) */
  --c-brand-white: #FFFFFF;    /* PLACEHOLDER */
  --c-brand-green: #DDF3E0;    /* PLACEHOLDER */
}
```

**Gradients**
- CTA: `linear-gradient(135deg, var(--c-saffron), var(--c-marigold))`
- Dark sky: `linear-gradient(180deg, var(--c-night-0) 0%, var(--c-night-1) 70%, var(--c-forest) 100%)`

**Rules**
- Dividers: 1px gold at 40% opacity.
- Never use pure white on dark sections. Never use pure black.

### 4.3 Section modes

Each section sets `data-section-mode="dark"` or `data-section-mode="light"`. Text, focus, and background colors follow the mode.

| Section | Mode | Background | Text and headings | Accents |
|---|---|---|---|---|
| Navbar | Follows the section underneath | Dark: night-0 at 85% with blur. Light: brand-white at 92% with blur. | Dark: ivory. Light: forest-900. | Saffron CTA on both |
| Hero | dark | Dark sky gradient | Ivory | Saffron, gold |
| The Question | dark | night-0 with forest mist at the bottom | Ivory | Saffron on "question" |
| The Gurukul | light | brand-white, with a forest silhouette strip at the bottom | Forest-900 headings, ink body | Terracotta, saffron, vermilion for small marks |
| App Highlights | light | brand-green | Ink body, forest-900 titles | Gold-leaf card borders, forest icons |
| The Epic Path | dark | night-1 with terracotta road | Ivory | Saffron chariot, gold gates |
| Testimonials | light | brand-white with a faint kalamkari vine (6%) | Ink body | Forest border on parchment cards |
| Login: The Gate | dark | night-0 with a saffron glow | Ivory | Saffron, gold |
| Footer | dark | forest-900 | Ivory | Gold |

**Focus rings**
- Dark sections: 2px solid `--c-focus`, 2px offset.
- Light sections: 2px solid `--c-forest-900`, with a 2px outer ring in `--c-gold`.

### 4.4 Typography

Same as v1 Section 4.2, with these additions:
- In light sections, Cinzel headings use `--c-forest-900`, not gold.
- Body text in light sections uses `--c-ink`.
- Secondary text in light sections uses `--c-ink-soft`.

### 4.5 Theme vocabulary (what to draw)

| Category | Allowed (anonymous and generic) | Not allowed |
|---|---|---|
| **Characters** | Archer drawing a bow. Charioteer holding reins. Seated sage-teacher with a palm-leaf book. Seated students on mats. Standing warriors with shields, in the background only. | Named epic characters (see Section 9). Deities. Faces with detail. Crowns or halos. |
| **Equipment** | Bow and arrows, quiver, shield, sword (khadga), mace (gada), spear, conch horn (shankha), war drum, palm-leaf manuscript, oil lamp (diya), lotus | Deity-specific weapons: the Sudarshan chakra, trishul, and named divine missiles |
| **Vehicles** | Chariot (ratha) with two horses, war horse, war elephant (generic), river boat, flying palace (generic vimana, temple-like) | Deity vahanas: Garuda, Nandi, Mushaka, hamsa, lion mounts |
| **Places** | Gurukul hut with thatched roof, banyan and peepal forest, river ghat with diyas, temple gopuram, palace gate (dwara), lotus pond, banner flags (dhvaja) | Battlefield carnage, damaged or burning buildings |
| **Ornament** | Rangoli-style borders, kalamkari-inspired vines and paisley, mandala medallions, gold-leaf frames, jharokha arches | Painted figures inside frames |

**Chariot and horse:** use plain, generic forms. No armor details that copy a specific character.

### 4.6 Patterns and textures

- **Rangoli border:** repeatable SVG tile of geometric dots and curves. Use on section top edges and card frames. Original design only.
- **Kalamkari vine:** repeatable paisley and vine tile at 6% to 8% opacity. Use in dark sections and the Testimonials background.
- **Gold-leaf frame:** a gradient border with a light grain. Use on highlight cards.
- **Parchment:** `--c-parchment` with grain. Use on testimonial cards.
- **Jharokha arch:** an arched window outline. Use as the frame behind the Gurukul scene.
- **Mandala medallion:** a circular ornament. Use behind the Epic Path and in the footer.

### 4.7 Art sources and copyright

- Use **original art, licensed stock, or public-domain material** only.
- Do not copy comic panels, book covers, modern illustrations, or film stills.
- Historical paintings in the public domain may inspire the style, but do not trace them.
- Hand-coded SVG must look intentional. If the designer's art is not ready, use the simplified placeholders in Section 10, and mark each one `// ART: PLACEHOLDER`.

---

## 5. Motion and interaction system

### 5.1 Scroll engine

v1 Section 5.1 applies unchanged.

### 5.2 Timing

v1 Section 5.2 applies, plus:

| Motion | Duration | Easing |
|---|---|---|
| Bow draw | 0.6s | `sine.inOut` |
| Arrow flight | 0.9s | `power2.out` |
| Button flare after hit | 0.4s | `power2.out` |
| Chariot wheel rotation | Scroll-linked, `scrub: 0.8` | `linear` |
| Spark burst | 0.4s | `power2.out` |
| Magnetic pull | 0.25s | `power2.out` |
| Palm-leaf unroll | 0.6s | `power2.inOut` |
| Gate light flare | 0.4s | `power2.out` |

### 5.3 Reduced motion

v1 Section 5.3 applies. In addition, every interaction in Section 5.5 has a reduced-motion version:
- No arrow flight. The arrow appears at its target.
- No chariot drift and no wheel rotation. The chariot stays still.
- No bow draw. The bow is already drawn.
- No sparks, no magnetic pull, and no unroll. Elements appear in their final state.
- Click, tap, and keyboard interactions still work. They switch state instantly.

### 5.4 Performance budget

v1 Section 5.4 applies, plus:
- Each character or equipment SVG: under 20 KB gzipped.
- Hero SVG total (archer, chariot, arrow, road, silhouettes): under 60 KB gzipped.
- Split moving parts into separate SVG groups (wheel group, bow group, bowstring path, arrow). Animate only those groups.

### 5.5 Interaction catalog

Every interaction has a mouse path, a keyboard path, a touch path, and a reduced-motion path.

| ID | Section | Trigger | Behavior | Keyboard and touch | Reduced motion |
|---|---|---|---|---|---|
| **I-1** | Hero | Page load (once), or click or Enter on the archer | Bow draws (0.6s). Arrow flies to the "Enter the Gurukul" button (0.9s). Button flares and pulses once. | Archer is a button labelled "Replay the archer's shot". Enter or Space replays. Tap replays. | Arrow already on the button. No flight. |
| **I-2** | Hero | Scroll | Chariot drifts left to right by about 30% of the viewport. Wheel spokes rotate with scroll distance. | Decorative only. `aria-hidden`. | Chariot static. |
| **I-3** | The Question | Scroll | Arrow flies left to right across the section as the sentence reveals. It lands on "question", which glows. | Decorative only. The text is complete without it. | Arrow at its landing point. Word glows. |
| **I-4** | The Gurukul | Click, tap, Enter, or Space on a student | The chosen student lights up. The guru turns toward them (0.4s). Their panel appears. Only one panel shows at a time. | Students are buttons labelled with their panel title. Arrow keys move between students. | Panel appears. No turn. |
| **I-5** | App Highlights | Hover (fine pointer), focus, or tap on a card | The card's motif reacts once (see 6.4). The lamp keeps a slow flicker while hovered. | Same reaction on focus. | Motif changes color only. |
| **I-6** | App Highlights | Learn more button | Card expands with a height animation. Details appear. | Button with `aria-expanded` and `aria-controls`. | Instant expand. |
| **I-7** | The Epic Path | Scroll. Click on a gate (desktop). | Chariot follows the road. Each gate lights up when progress reaches it. On desktop, clicking a gate scrolls to its point. | Gates are labelled buttons. Enter scrolls to that point. | Gates light instantly. Chariot jumps. |
| **I-8** | Testimonials | Card becomes active | Leaf unrolls from the center (0.6s). Quote fades in. | Previous and next buttons. Swipe on touch. | Leaf appears in its final state. |
| **I-9** | All primary CTAs | Pointer hover (fine pointer) and click | Hover: button moves up to 6px toward the pointer. Click: 6 to 8 small gold sparks, removed after 0.4s. | Focus and Enter work as normal. Sparks are decorative. | No magnetic pull. No sparks. |
| **I-10** | Login | Successful sign-in | Saffron arrow flies from the left edge into the gate center (0.8s). Light flares. Doors open 90° (1.2s). Route changes to `/dashboard`. | Enter submits. Focus moves to the dashboard heading after routing. | Crossfade in 300ms. No arrow. |
| **I-11** | Desktop only (stretch) | Pointer moves | A small gold arrow follows the pointer on fine-pointer devices. Native cursor stays visible. | Not applicable. | Off. |
| **I-12** | Footer (stretch) | Toggle button | Ambient sound toggle. Off by default. Never autoplays. Uses `aria-pressed`. | Button. | Not affected. |

**Global rules**
- Never hide the native cursor.
- Never autoplay sound.
- Stretch items (I-11, I-12) are built only after every other item passes Phase 4R-C.

---

## 6. Page structure v2

Page order is unchanged from v1 Section 6.

### 6.0 Navbar

- Mode follows the section underneath (see 4.3). Use a `data-section-mode` attribute, updated by a ScrollTrigger. Color transitions take 200ms.
- Logo: a small lotus-and-bow mark, with the "Partha" wordmark in Cinzel.
- Links and buttons: as in v1 Section 6.0.
- Mobile drawer: as in v1 Section 6.0.

### 6.1 Hero (dark)

**Layers, back to front**
1. **Dark sky:** the gradient from 4.2.
2. **Phase 4 ambient 3D layer:** lotus, diya, and stars, at 60% opacity so the new art reads clearly.
3. **Silhouette layer (SVG):** a gopuram and a banyan tree. Parallax at 0.4× scroll speed.
4. **Road:** a terracotta strip at the bottom.
5. **Chariot (SVG):** body, two horses, and a separate wheel group. Drifts per I-2.
6. **Archer (SVG):** standing in the chariot. Separate bow group and bowstring path. Bow draws per I-1.
7. **Arrow (SVG):** its own element. Flies to the button per I-1.
8. **Text:** title "Partha", tagline, subline, and the **Enter the Gurukul** button. The button is the arrow's target.
9. **Scroll cue:** a chakra icon at the bottom with a slow pulse.

**Arrow path**
- Compute from `getBoundingClientRect()` on load, on resize, and on orientation change.
- The arrow hits the button's left edge, not its text.
- The arrow sits above the text layer and below the navbar.

**Copy** (unchanged from v1):
- Title: **Partha**
- Tagline: *Where every student finds a guru.*
- Subline: *Mentorship for the path ahead.*
- CTA: **Enter the Gurukul** (scrolls to Section 7)
- Secondary link: *Explore the journey*

**Mobile (below 640px)**
- Chariot sits at the bottom. Archer is visible. The flight path is shorter.
- No pointer effects.

### 6.2 The Question (dark)

- Text: *Every seeker begins with a question.* Cinzel, the word "question" in saffron. Word-by-word scrubbed reveal (v1 6.2).
- I-3: arrow crosses the section and lands on "question".
- Second line fades in after the first is complete: *Partha answers it by connecting you with someone who has already walked that road.*
- Background: kalamkari vine at 8%, forest mist at the bottom edge, and the footpath of diya dots from v1 leading toward the text.

### 6.3 The Gurukul (light)

- Heading: *The Gurukul, reimagined.* (forest-900)
- Body: *Partha connects students with mentors who have walked the road before them.* (ink)
- **Scene:** a gurukul under a banyan tree. Contents: thatched hut, banyan silhouette, a guru seated on a low platform with a palm-leaf book, and three student silhouettes seated on mats.
- The arch ring from v1 6.3 is **removed**. The jharokha arch frames the scene instead.
- **Three students, one per panel:**

| Student | Panel title | Panel body |
|---|---|---|
| Student 1 | Who it serves | Students from school to postgraduate level, across fields and cities. |
| Student 2 | How it works | Browse verified mentors, book a session, and grow over time. |
| Student 3 | Why it matters | Good guidance turns a question into a direction. |

- I-4 applies. The selected student lights up, the guru turns, and the panel shows. The unselected students dim to 60%.
- **Mobile:** the scene stacks above the panel. Students become tabs with arrow-key support.

### 6.4 App Highlights (light)

- Heading: *Everything a seeker needs.*
- Sub: *Six tools for the road ahead.*
- Layout and entrance motion: v1 Section 6.4.
- Hover tilt (fine pointer): v1 Section 6.4.
- Learn more: I-6.

**Cards and motifs**

| # | Card title | Motif (equipment) | Reaction (I-5) |
|---|---|---|---|
| 1 | Find Your Guru | Lamp (diya) | Flame flares, then flickers while hovered |
| 2 | Book Guidance Sessions | Lotus | Petals open |
| 3 | Discover Opportunities | Bow | Bowstring pulls back and releases |
| 4 | Track Your Growth | Dharma wheel (plain spokes, no deity attributes) | Wheel turns one step |
| 5 | Community of Shishyas | War drum | Drum pulses twice |
| 6 | Mentor Insights | Conch horn | Conch pulses once |

Card descriptions and detail bullets: v1 Section 6.4 (copy unchanged).

### 6.5 The Epic Path (dark)

- Heading: *Your path, step by step.*
- **Scene:** a terracotta road from the river ghat to the forest. A chariot (same SVG as the hero, smaller) travels the road. Four dwara arches mark the milestones. A mandala medallion sits behind the road.
- **Desktop and tablet (viewport height at least 700px):** pin the section for about 300vh. The road draws with `stroke-dashoffset`. The chariot rides along, and its wheel rotates with progress.
- **Mobile or short viewports:** vertical road. The chariot sits at the leading edge of the fill.
- Milestones and copy: v1 Section 6.5.
- Gate thresholds: 0.20, 0.45, 0.70, 0.90.
- I-7 applies.

### 6.6 Stories of Guidance (light)

- Heading: *Words from the road.* (forest-900)
- Cards: parchment with a gold-leaf border, a faint rangoli corner, and a slight rotation between -1° and 1°.
- I-8 applies. Auto-advance every 6 seconds, pause on hover and focus, buttons, and dots (v1 6.6).
- Placeholder content and labels: v1 Section 6.6.

### 6.7 Login: The Gate (dark)

- **Scene:** a palace gate (dwara) in night-0, with a saffron glow behind it. Lattice doors sit slightly ajar at 8°.
- The login card sits in front of the gate. Use the glass style from v1 6.7.
- Functional spec: v1 Section 7.
- I-10 applies on success.

### 6.8 Footer (dark, forest-900)

- Background: forest-900.
- Gold lotus divider along the top edge.
- Four columns: Product, Company, Legal, Social (v1 6.8).
- Copyright line and the Devanagari shloka, marked with the VERIFY comment (v1 6.8).
- Mandala medallion watermark at 5% opacity.
- Credit line: *Inspired by the Ramayana and the Mahabharata.*
- I-12 toggle appears here only if the stretch is built.

---

## 7. Login (v2 deltas)

- **Functional spec:** v1 Sections 7.1 to 7.6 apply unchanged. That includes fields, buttons, states, validation copy, the auth adapter, and the mock account.
- **Visual:** dark glass card on the gate scene (6.7). Errors use `--c-error`. Icons accompany every error.
- **Interaction:** I-10 on success.

---

## 8. Accessibility and performance (v2 deltas)

- **Keyboard:** every interaction in 5.5 has a keyboard path. Decorative art is `aria-hidden="true"`.
- **Contrast on light sections:**
  - Ink on brand-white and brand-green: at least 4.5:1.
  - Forest-900 headings: at least 4.5:1.
  - Error text on light: `--c-error-light`.
- **Reduced motion:** the hero's final frame shows the bow drawn and the arrow already on the button.
- **Touch targets:** student buttons, gates, carousel buttons, and CTAs are at least 44×44px on mobile.
- **Screen readers:** the chariot, archer, arrows, and gates are decorative unless they carry state. Students and gates are announced with their labels.
- **Performance:** v1 Section 5.4 plus the SVG limits in Section 5.4 above.

---

## 9. Cultural rules v2 (replaces v1 Section 10)

**Allowed**
- Anonymous silhouettes: archers, charioteers, sage-teachers, students, and warriors. No faces with detail, no named costumes, no divine attributes.
- Equipment and vehicles listed in 4.5.
- Original rangoli, kalamkari-inspired, gold-leaf, jharokha, and mandala patterns.
- Short Sanskrit and Hindi phrases, verified by a native speaker, marked with `// VERIFY: native speaker review before launch`.

**Not allowed**
- **Named epic characters** in art, file names, alt text, or code comments. This includes Rama, Sita, Lakshmana, Hanuman, Ravana, Krishna, Arjuna, Bhima, Karna, Draupadi, and others.
- **Deities** in any form, and **deity vahanas** (Garuda, Nandi, Mushaka, hamsa, lion mounts).
- **Deity weapons and symbols**, such as the Sudarshan chakra, trishul, and named divine missiles.
- **Halos, crowns, or divine light** on any figure.
- **Violence, injury, blood, or death.** The archer shoots at a **target** (a ring or a tree), never at a person.
- **Stereotypes:** no elephants with bindis, no cartoon gods, no sitar stingers, no "exotic" display fonts.
- **Copied art** (see 4.7).

**Copy**
- The Ramayana and the Mahabharata appear as inspiration. Marketing copy does not name characters.
- Keep the footer credit line from 6.8.

---

## 10. Asset list

| Asset | Used in | Format | Needed for | Status |
|---|---|---|---|---|
| Archer silhouette (standing, bow drawn) | Hero | SVG with bow group and bowstring path | 4R-B | PLACEHOLDER OK. Designer to replace. |
| Chariot with two horses | Hero, Epic Path | SVG with wheel group | 4R-B | PLACEHOLDER OK. Designer to replace. |
| Arrow | Hero, Question, Login | SVG | 4R-B | Build in code |
| Guru silhouette (seated, palm-leaf book) | Gurukul | SVG | 4R-A | PLACEHOLDER OK |
| Three student silhouettes | Gurukul | SVG (each a separate group) | 4R-A | PLACEHOLDER OK |
| Thatched hut and banyan silhouette | Gurukul, Hero | SVG | 4R-A | PLACEHOLDER OK |
| Six equipment icons (lamp, lotus, bow, dharma wheel, drum, conch) | Highlights | SVG, each with an animatable part | 4R-A | PLACEHOLDER OK |
| Dwara (palace gate) with lattice doors | Login | SVG | 5 | PLACEHOLDER OK |
| Gopuram and temple tower | Hero, Footer | SVG | 4R-B | PLACEHOLDER OK |
| Rangoli border tile | Section edges, cards | SVG tile | 4R-A | Original design |
| Kalamkari vine tile | Dark sections, Testimonials | SVG tile | 4R-A | Original design |
| Gold-leaf frame | Highlight cards | CSS gradient and texture | 4R-A | Build in code |
| Parchment texture | Testimonials | WebP | 4R-A | Build in code or stock |
| Mandala medallion | Epic Path, Footer | SVG | 4R-A | Original design |
| Jharokha arch frame | Gurukul | SVG | 4R-A | Build in code |

**Placeholder policy**
- Build the placeholders first, using simple shapes that keep the same silhouette groups. This keeps the animation work independent of the final art.
- Mark each one `// ART: PLACEHOLDER — replace with designer SVG`.
- Before launch, replace the archer and chariot with professional art. These two carry the hero, so they matter most.

---

## 11. Phase plan v2

| Phase | Name | Status |
|---|---|---|
| Tools setup | Context7, Playwright MCP, axe-core, frontend-design | Run if not done. Otherwise skip. |
| 1 | Scaffold | Done |
| 2 | Static content | Done |
| 3 | Section motion | Done |
| 4 | Hero 3D (ambient layer) | Done. Accepted as the ambient layer. The theme is rebuilt in 4R. |
| **4R-A** | **Theme and color rebuild** | **Next** |
| **4R-B** | **Hero scene: archer, chariot, arrow** | After 4R-A |
| **4R-C** | **Section interactions I-3 to I-9** | After 4R-B |
| 5 | Login (v2) | After 4R-C |
| 6 | Responsive, reduced motion, accessibility (v2) | After Phase 5 |
| 7 | Performance (v2) | After Phase 6 |
| 8 | QA and deployment (v2) | After Phase 7 |

---

## 12. Phase prompts

Paste each prompt into the coding agent only after the previous phase is reported.

### Phase 4R-A: Theme and color rebuild

```
Read PARTHA_LANDING_PAGE_SPEC_v2.md fully. Then read PARTHA_LANDING_PAGE_SPEC.md Sections 5.1, 5.3, 8, and 9. Do Phase 4R-A only. Do not add interactions, hero characters, or new motion. Those come in later phases.

BRAND VALUES (fill in before pasting; leave blank if not known):
- Brand white hex: ________
- Brand light green hex: ________
- Website URL (optional): ________

Goal: rebuild colors, section modes, and visual vocabulary to match v2, and bridge to the client's brand.

1. Brand bridge: use the brand values above. If a hex value is blank and a URL is given, read the colors from the live site's CSS and record the source. If both are blank, use the placeholders from v2 Section 4.1. Mark each placeholder in tokens.css.
2. tokens.css: replace the v1 palette with the v2 palette in Section 4.2. Include all forest, terracotta, bronze, parchment, and light-section tokens.
3. Section modes: apply the mode for each section from Section 4.3. Add data-section-mode="dark" or "light" to each section element. Light sections use the ink and forest-900 tokens. Dark sections use ivory.
4. Navbar: switch between dark and light mode as the user scrolls, using a ScrollTrigger that toggles a class. Color transition of 200ms only.
5. Focus rings: apply the dark and light focus rings from Section 4.3.
6. Patterns: add the rangoli border tile, kalamkari vine tile, gold-leaf frame, parchment texture, jharokha arch, and mandala medallion as listed in v2 Section 10. Use each one only where Section 6 names it.
7. Vocabulary (static placeholders only):
   - Gurukul scene: guru, three students, thatched hut, and banyan, as SVG placeholders. Students are separate groups so they can be targeted later.
   - Highlights: six equipment icons as SVG placeholders, each with an animatable part for later.
   - Mark each placeholder with // ART: PLACEHOLDER.
8. Copy: do not change any text. Keep all copy in copy.ts.
9. Contrast: check every text and background pair in every section. Light sections must pass WCAG AA (4.5:1 body, 3:1 large text). Error text on light surfaces uses --c-error-light. Report failures and fix them.
10. The hero: keep the Phase 4 layers, but at 60% opacity, so the new art reads once it is added in 4R-B.

Verify:
- Screenshot every section at 390px, 768px, and 1440px into screenshots/4RA-<section>-<width>.png.
- Confirm no horizontal scroll at any width.

Report:
- Brand values used and their source.
- Contrast table: pair, ratio, pass or fail.
- Sections changed.
- Any spec item you could not meet, and why.
- DECISIONS.md additions.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phase 4R-B: Hero scene (archer, chariot, arrow)

```
Read PARTHA_LANDING_PAGE_SPEC_v2.md Sections 4.5, 5.2, 5.3, 5.4, 5.5 (I-1 and I-2), 6.1, 8, 9, and 10. Do Phase 4R-B only.

Goal: make the hero a visible epic scene. An archer on a chariot shoots an arrow at the "Enter the Gurukul" button. The Phase 4 3D layer stays as the background.

Build in src/sections/Hero.tsx and the supporting SVG files:

1. Layers, back to front (v2 Section 6.1): dark sky gradient; Phase 4 ambient 3D layer at 60% opacity; gopuram and banyan silhouettes (parallax at 0.4× scroll speed); terracotta road strip; chariot; archer; arrow; text; scroll cue.

2. Chariot SVG: body, two horses (one horse is acceptable if it is simpler), and a separate wheel group. The chariot drifts left to right by about 30% of the viewport as the hero scrolls out (I-2). Wheel rotation is tied to scroll distance.

3. Archer SVG: standing silhouette in the chariot. Separate groups for the bow and the bowstring path. The bowstring path pulls back during the draw.

4. Arrow: its own element. Compute the flight path from the archer's hand to the center of the left edge of the "Enter the Gurukul" button, using getBoundingClientRect(). Recalculate on resize and orientation change.

5. Sequence on first load (once per page load): draw the bow (0.6s, sine.inOut). Release. Fly the arrow to the button (0.9s, power2.out). The button flares and pulses once.
   - The archer is a button labelled "Replay the archer's shot". Enter, Space, and tap all replay the sequence.

6. The arrow hits the button's left edge, not its text. The arrow sits above the text layer and below the navbar.

7. Mobile (below 640px): chariot sits at the bottom; archer is visible; the flight path is shorter. No pointer effects.

8. Reduced motion: no bow draw, no flight, no drift. Show the final frame: bow drawn, arrow already on the button. The replay button still works as an instant state change.

9. Fallbacks:
   - No WebGL: remove the Phase 4 ambient 3D layer. Everything else still works.
   - No JavaScript animation: show the final frame.

10. Performance: only the wheel group, bowstring path, and arrow animate, and only with transform and opacity. Total hero SVG under 60 KB gzipped.

Art: if the designer's SVG is not available, use simple geometric placeholders that keep the same silhouette groups. Mark each one with // ART: PLACEHOLDER — replace with designer SVG.

Do not add named characters, deity attributes, or violence. The archer shoots at a target, never at a person.

Verify:
- Screenshots of the hero at 390px, 768px, and 1440px, plus one frame mid-flight. Record each file name.
- With reduced motion on: confirm the final frame and no motion.
- With WebGL disabled: confirm the scene still displays and works.
- Confirm the first paint shows the sky and the headline before the archer animation starts.

Report:
- What was built.
- Hero SVG total size, gzipped.
- Screenshot file names.
- Placeholder list.
- Any spec change, logged in DECISIONS.md.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phase 4R-C: Section interactions (I-3 to I-9)

```
Read PARTHA_LANDING_PAGE_SPEC_v2.md Sections 5.5 (I-3 to I-9), 6.2 to 6.6, and 8. Do Phase 4R-C only. Do not build I-10 (login gate). That comes in Phase 5.

Build:

1. I-3 Question arrow (6.2): a scroll-linked arrow crosses the section from left to right as the sentence reveals. It lands on the word "question", which then glows. The arrow is decorative and aria-hidden. The text is complete without it.

2. I-4 Gurukul students (6.3):
   - Three student silhouettes, each a button labelled with its panel title (Who it serves, How it works, Why it matters).
   - Click, tap, Enter, or Space selects a student. The student lights up, and the guru group turns toward them (rotate by a small angle, 0.4s). The matching panel appears.
   - Arrow keys move between students.
   - Only one panel is visible at a time on all widths.
   - Remove the v1 CSS 3D arch ring.

3. I-5 Highlight motif reactions (6.4): each card's motif reacts on hover (fine pointer), focus, and tap, using the reaction table in v2 Section 6.4.
   - The reaction runs once per activation and resets when the pointer leaves or focus moves.
   - The lamp keeps a slow flicker while hovered.

4. I-6 Learn more: keep the v1 expand animation and ARIA attributes.

5. I-7 Epic Path gates (6.5):
   - The chariot follows the road as the section pins (desktop) or scrolls (mobile).
   - Each gate lights when progress reaches its threshold.
   - On desktop only, clicking a gate scrolls to its progress point.
   - Gates are labelled buttons. Enter scrolls to the gate's point.
   - The road draws with stroke-dashoffset. The chariot wheel rotates with progress.

6. I-8 Palm-leaf unroll (6.6): when a testimonial becomes active, its leaf unrolls from the center over 0.6s (clip-path or scaleY). Keep the v1 auto-advance, pause on hover and focus, swipe, and buttons.

7. I-9 CTA spark and magnetic pull:
   - Fine pointers only: primary CTA buttons move up to 6px toward the pointer (0.25s ease).
   - Click spawns 6 to 8 small gold sparks, which fade in 0.4s. Sparks are aria-hidden and removed from the DOM after they fade.

8. Every interaction must have a keyboard path, a touch path, and a reduced-motion path. Do not hide the native cursor anywhere.

9. Skip I-11 and I-12 for now. They are stretch items, built only after every other item passes.

Verify:
- Each interaction works with the mouse, the keyboard only, and touch emulation in DevTools.
- Each interaction has a reduced-motion version. Turn the setting on and check.
- No console errors. No duplicate ScrollTrigger instances after hot reload.
- Screenshots of each affected section at 390px, 768px, and 1440px, named screenshots/4RC-<section>-<width>.png.

Report:
- A table with these columns: ID, section, mouse, keyboard, touch, reduced motion, status.
- Spec deviations.
- DECISIONS.md additions.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phase 5: Login (v2)

```
Read PARTHA_LANDING_PAGE_SPEC_v2.md Sections 6.7, 7, 5.5 (I-10), and 8. Read PARTHA_LANDING_PAGE_SPEC.md Sections 7.1 to 7.6 in full. Do Phase 5 only.

Goal: make the login section fully working in the v2 style, with the gate arrow interaction on success. Keep every functional rule from v1 Section 7.

Build:

1. Routes: "/", "/signup", "/forgot-password", and "/dashboard". The last three are placeholder pages in the v2 style, each with a heading and a link back to the landing page.

2. Auth adapter: implement v1 Section 7.6 exactly, including the mock behavior and the VITE_ENABLE_MOCK_AUTH flag.

3. Validation: v1 Section 7.4 rules and copy, stored in copy.ts. Validate on blur, then on change after the first blur, and always on submit.

4. Form states and interactions: v1 Sections 7.3 and 7.5.

5. Visual: the glass card from v2 Section 6.7 sits on a dark background. Use --c-error for errors. The dwara (gate) SVG sits behind the card.

6. I-10 gate arrow: on successful sign-in:
   - A saffron arrow flies from the left edge into the gate center over 0.8s.
   - The light flares.
   - The doors open 90° over 1.2s.
   - The route changes to /dashboard.
   - Reduced motion: crossfade in 300ms, no arrow.

7. Keyboard: Enter submits. On a failed submit, focus moves to the first invalid field. Tab order is logical. After routing to the dashboard, focus moves to the dashboard heading.

Tests:
- Unit tests for the validation rules and the mock auth adapter: valid demo login, wrong password, and network failure.
- A test that inputs are disabled during submit.

Verify:
- The demo login succeeds, plays the arrow and gate, and reaches /dashboard.
- A wrong password shows the exact v1 copy.
- The OTP flow works end to end.
- With VITE_ENABLE_MOCK_AUTH unset, the demo login cannot succeed.
- Screenshots of each login state at 390px, 768px, and 1440px.

Report:
- Test results.
- Screenshot list.
- Spec deviations.
- DECISIONS.md additions.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phase 6: Responsive, reduced motion, accessibility (v2)

```
Read PARTHA_LANDING_PAGE_SPEC_v2.md Sections 5.3, 5.5, 8, and 9. Read PARTHA_LANDING_PAGE_SPEC.md Sections 8 and 9. Do Phase 6 only. Do not add features.

Audit the whole site, including the v2 interactions.

1. Layout: test widths 320, 390, 768, 1024, 1440, and 1920. No horizontal scroll anywhere. The timeline pin switches at 700px height. The hero archer and chariot scale correctly at each width, and the arrow still reaches the button.

2. Reduced motion: check the reduced-motion version of every interaction in v2 Section 5.5. Confirm Lenis is off, the 3D layer is still, and carousels don't auto-advance.

3. Keyboard: Tab through the whole page. Confirm every interaction works without a mouse: archer replay, student buttons, highlight focus reactions, Learn more, gates, testimonial buttons, CTA buttons, the login form, and the mobile drawer focus trap.

4. Touch: emulate touch in DevTools. Confirm tap equivalents for I-4, I-5, I-7, I-8, and I-9.

5. Screen reader: use VoiceOver or NVDA. Confirm that decorative art is ignored, that students and gates are announced with their labels, that the Learn more state is announced, and that login errors are announced.

6. Contrast: recheck every text pair in light and dark sections. Light sections use ink on brand-white and brand-green, and forest-900 headings. Errors on light surfaces use --c-error-light.

7. axe-core: run on each section and on each login state. Fix every serious and critical violation. Report counts before and after.

8. Touch targets: at least 44×44px on mobile for student buttons, gates, carousel buttons, and CTAs.

9. No-animation case: with animations disabled, every piece of text and every control still works.

Report:
- An issues table: issue, location, fix, status.
- axe results before and after.
- Anything still open, and why.
- DECISIONS.md additions.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phase 7: Performance (v2)

```
Read PARTHA_LANDING_PAGE_SPEC_v2.md Sections 5.4 and 8. Read PARTHA_LANDING_PAGE_SPEC.md Sections 5.4 and 12. Do Phase 7 only.

Meet the performance budget with the new art and interactions. Measure before changing anything.

1. Baseline: production build. Record the gzipped size of the landing page's initial JS (excluding Three.js), the Three.js chunk, the total hero SVG size, and the total size of all SVG. Use a bundle visualizer.

2. Budgets:
   - Landing initial JS: under 200 KB gzipped.
   - Three.js chunk: under 250 KB gzipped, loaded after first paint.
   - Hero SVG total: under 60 KB gzipped.
   - Each character or equipment SVG: under 20 KB gzipped.
   Fix anything over budget.

3. SVG cleanup: run SVGO or an equivalent on every SVG. Remove metadata, merge paths, and round numbers to 2 decimal places. Confirm the animations still work after optimization.

4. LCP: the hero headline must paint before the archer animation starts. Measure on Slow 4G with 4× CPU slowdown. Target under 2.5s. The headline must render without waiting for the 3D layer.

5. CLS: under 0.1. The arrow's computed path must not shift layout.

6. Frame rate: record a Performance profile at 4× CPU slowdown while scrolling through the hero (chariot drift), the Question arrow, the Epic Path pin, and the highlights. Report average frame rate and any long task over 50ms. Target 60fps on mid-range hardware. Accept 45fps or higher at 4× throttling, and log it.

7. Off-screen pausing: confirm the 3D loop and the chariot wheel animation stop when their sections are off screen.

8. Cleanup: remove unused SVG groups, unused icons, and any development-only code.

Report:
- A table with these columns: metric, target, measured, status, change made.
- DECISIONS.md additions.

Don't ask me questions mid-phase. If something is unclear, make the most reasonable choice, log it in DECISIONS.md, and keep going.
```

### Phase 8: QA and deployment (v2)

```
Read PARTHA_LANDING_PAGE_SPEC_v2.md Sections 10, 11, and 12. Read PARTHA_LANDING_PAGE_SPEC.md Sections 13 and 14. Do Phase 8 only.

Goal: verify the site against the updated definition of done, finish the production basics, and prepare the deploy.

1. Tests:
   - Vitest unit tests pass.
   - Playwright smoke tests cover: the landing page loads; section headings appear in order; "Log in" scrolls to the login section; the archer shot runs and reaches the button (check the final frame); student buttons open panels; the login form renders; the demo login reaches /dashboard only when mock auth is enabled.
   Fix any failures.

2. Metadata: title, description, and Open Graph tags, all from copy.ts. Use a branded OG image placeholder.

3. Production safety: confirm VITE_ENABLE_MOCK_AUTH is off in the production build, and that the demo credentials do not appear in the bundle. Report how you checked.

4. Lighthouse (mobile, motion on). Targets: performance 90 or higher, accessibility 100, best practices 90 or higher, SEO 90 or higher.

5. Definition of done: check every item in v1 Section 13, plus these additions. Go one item at a time. Mark each pass or fail, with evidence.
   - Every light section passes contrast.
   - Every interaction in v2 Section 5.5 works with mouse, keyboard, and touch, and has a reduced-motion version.
   - No named epic character, deity, deity vahana, or violent imagery appears in any art or copy. Check every SVG file name, title, and alt text.
   - Every SVG has a title or is aria-hidden.
   - Every placeholder art item is either replaced or listed in KNOWN_ISSUES.md.

6. KNOWN_ISSUES.md: unfinished items, art placeholders still in use, and the content placeholders from v1 Section 14.

7. Deployment: static build config for Vercel or Netlify. Add the build command, the output folder, and a deploy section in README.md. Log the choice in DECISIONS.md.

8. Final README.md: installation, running, testing, building, environment variables, where auth connects, developer tools, and deployment.

Report:
- Test results.
- Lighthouse scores.
- Definition-of-done table with pass or fail and evidence.
- KNOWN_ISSUES.md contents.
- The deploy command.

Don't ask me questions mid-phase. Log every decision in DECISIONS.md.
```

---

**End of v2 spec.**
