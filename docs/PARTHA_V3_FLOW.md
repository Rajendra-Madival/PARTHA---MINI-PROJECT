# PARTHA V3: Scroll & Scene Flow Plan

> Branch: `landing-arrows-path`  
> Supersedes/extends the visual layout in [`docs/PARTHA_V3_PLAN.md`](./PARTHA_V3_PLAN.md) with exact scroll, animation, card, and interaction behavior.

---

## 1. Big Picture & Look
- **Core Journey:** One continuous long scroll. Rama shoots a glowing arrow at the top. The arrow follows the visitor down the page, drawing a golden path behind it and passing five glowing stops. Each stop is an epic painted scene showcasing one Partha feature. At the end, the arrow lands on the palace gate, which opens to the real login.
- **Visual Arc:** Bright dawn start (Hero & Ashram), dusk-to-night epic middle (Bridge of Stones & Kurukshetra), bright dawn return (Dawn Lake & Gate), using Partha's white (`#FAF7F0`), light mint (`#ECFDF5`), gold, and deep night blue.
- **Device Priority:** Laptops/desktops first; phones get a lighter, vertical-rail version.

## 2. Page-Wide Elements
- **Navbar (only fixed element):** Always visible at the top — "Partha" wordmark on the left, "Log in" button on the right. Clicking "Log in" scrolls smoothly down to the Gate. Colors automatically switch between light and dark modes to match the current scene.
- **Golden Path:** One continuous golden line from the top-left of the Hero, winding across the five stops (alternating roughly 70% right and 30% left) down to the Gate. The line draws in sync with scrolling, and the glowing arrow sits at the leading tip, rotating to follow the curve's direction.
- **Stop Rings:** Five numbered circles (`1` to `5`) placed along the path (one per scene). Each ring lights up when the arrow reaches it. Clicking, tapping, or pressing `Enter` / `Space` on a ring scrolls smoothly to that scene and opens its card.
- **Step Cards:** One per scene (`1` to `5`). Shows a small label (`Stop N of 5 · Scene name`), step title, and a `"Read step details"` button that expands the full description. Only one card is open at a time; `Escape` closes it.
- **Reduced Motion:** No scroll smoothing; path is fully drawn; arrow rests at the Gate; all rings are lit; cards still open and close normally; no sway, no sparkle, no zoom.
- **Phones (`< 768px`):** The golden path becomes a straight vertical line down the left edge with stop rings on the rail and step cards stacked to the right. Scene art is cropped cleanly to fit the screen width.

## 3. Scene-by-Scene Baseline
- **0. Hero (Bright dawn — white & light green):** Centered top copy (`"Partha"`, `"Where every student finds a guru."`, `"Alumni mentorship for the path ahead."`, `"Follow the arrow"` button scrolling to Scene 1). Rama stands small on the left hilltop below the title. No step card.
- **1. The Ashram (Warm golden morning):** Seated sage-teacher slightly left of center; small brass diya to his right. Arrival: arrow lands with a golden sparkle, sage fades in, diya lights up by itself, `"Find your guru"` card opens (`"Browse verified alumni from your college and find the guide who has walked your path."`).
- **2. The Bridge of Stones (Dusk — violet & orange):** Stone causeway into the sea. The sun is the centerpiece and sinks slowly behind the sea line as the visitor scrolls; stars may brighten slightly. No extra pictures. `"Request mentorship"` card opens on arrival (`"Send a request with your goal: Career Guidance, Resume Review, Internship Referral, or Project Help. Once your guru accepts, you can chat."`).
- **3. Kurukshetra (Dark night — gold accents):** Moon at upper left; chariot in center with Krishna and Arjuna (Partha); conch on the left. Arrival: `"Discover opportunities"` card opens (`"Internships, jobs, and projects posted by verified alumni, all in one place."`).
- **4. The Dawn Lake (Bright — lotus & diyas):** Still lake with a large central lotus in the water (starting closed as `lotus-bud` and opening to `lotus-open` as the visitor scrolls past), floating diyas, and a temple on the right. `"Knowledge Hub"` card opens on arrival (`"Guides written by alumni, upvoted so the most useful rise to the top. Save what you need for later."` + `"Alumni: pass the lamp on."`).
- **5. The Gate (Bright — gold):** Arrow lands in the middle of the closed palace doorway. Login card heading `"Enter the Gurukul"` with `"Log in"` and `"Create your account"` buttons (real login form wired later). Under reduced motion: no zoom, doors already open, login card visible immediately.

---

## 4. Flow Decisions (Interview Q&A)

### A. Hero Bow Shot
- **Single unified arrow & straight sky launch:** One single glowing arrow rests nocked at Rama's bow, fires straight out horizontally further right into the Hero sky, and then sweeps smoothly downward along the golden path through Stops 1–5. Scrolling back up to the top returns the arrow smoothly back into Rama's bow.
- **Who starts the bow shot:** Both — the visitor can pull and release the bow (or tap on phones), and if they do nothing for about 5 seconds, Rama shoots automatically.
- **If the visitor scrolls before shooting:** Rama shoots right away as soon as scrolling begins, and the arrow travels out from the bow and follows the golden path with the scroll position.

### B. Path & Mouse Trail
- **Laptop/desktop mouse trail:** Removed — keep only the clean scroll-drawn golden arrow path with no extra cursor canvas trail.
- **Phones & touch screens:** Straight vertical left-edge rail at `x = 28px` with rings on it and cards stacked to the right.

### C. Step Cards & Scene Cleanliness
- **Auto-open & auto-close on scroll:** Step cards in Stops 1–4 open automatically as the arrow reaches each stop and collapse back to compact pills when scrolling away (one open at a time; manual click/tap and `Escape` also work).
- **Clean scenes:** Painted characters and props (`sage`, `chariot`, etc.) stay visible from the start, standalone Kurukshetra `wheel` removed, Dawn Lake lotus starts closed (`lotus-bud`) and blooms open (`lotus-open`) as you scroll past, and no extra floating HTML torch/scroll/diya boxes clutter the paintings.

### D. Hover Reactions (for a later phase)
- **Enabled reactions (each plays once per hover/activation):**
  1. Diya flame flares on hover
  2. Conch pulses on hover
  3. Chariot wheel spins on hover
  4. Lotus opens on hover
  5. Moon glows on hover
  6. Stars twinkle on hover

### E. The Gate (Final Scene)
- **No sky card/buttons above the gate:** Only the small `"5"` ring sits above the arch peak (`Log in` / `Create your account` buttons removed from the sky card).
- **Pinned zoom into flash + real login fade-in:** The Gate pins in place as you scroll: first the doors open (`closed` → `open`), then the view zooms deep into the glowing doorway (`1 → 3.4x`) as a white-gold flash fills the screen, and then the real Login / Sign-up screen (`AuthScreen`) fades in inside the light.
- **Reduced motion fallback:** No pin or zoom; doors start open and the real Login screen is visible immediately.

### F. Alumni Sign-Up Button
- **Button behavior:** Clicking the glowing `"Join as alumni"` diya button in Scene 4 (The Dawn Lake) opens the standard sign-up screen, where the visitor can switch to the Alumni role manually.
