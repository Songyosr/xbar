# XBAR Style Guide — “Code Bar” (v1)

Minimal, modern, high‑contrast, white background. Navy + orange accents. Subtle coding cues (colored `[]`, blinking cursor) without becoming a terminal theme. Applies to **homepage** and **applets** (React or vanilla JS canvas).

---

## 1) Brand Tokens

### Colors

* **Ink (Primary Text):** `#001524`
* **Navy (Primary Accent):** `#15616D`
* **Orange (CTA / Active):** `#FF7D00`
* **Navy‑Light (Lines / Tops):** `#2199AB`
* **Maroon (Sampling Dist Accent):** `#901328`
* **Maroon‑Light (Tops):** `#B51732`
* **Band (Tray BG):** `rgba(0,0,0,0.04)`
* **Ticks:** `#EAECEF`
* **Info (Text‑muted):** `#475569`
* **Success:** `#10B981`
* **Warning:** `#F59E0B`
* **Error:** `#EF4444`

> **Usage:** Text = Ink. CTAs & active highlights = Orange. Primary accents/edges/parameter lines = Navy. Sampling‑dist mean or secondary emphasis can use Maroon.

### Typography

* **Font family:** `Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`; mono: `JetBrains Mono`
* **Exact scale (homepage/app shells):**
  * H1: clamp(28px, 4vw, 44px) at 800 weight
  * H2: 22px at 600 weight
  * H3: 16px at 700 weight (card titles)
  * Body: 16px at 400 weight
  * Nav: 15.2px (0.95rem) at 600 weight
  * Small: 13.6px (0.85rem); Badge: 12px (0.75rem)
* **Line-height:** H1 1.2; Body 1.6; Tight 1.4

### Spacing (8px grid)

Exact layout rhythm used in the homepage example:

- Container: max-width 1140px; padding 24px top/bottom, 16px left/right
- Header bottom margin: 32px
- Section spacing: 24px between major sections
- Hero padding: 32px top, 24px sides, 40px bottom
- Card padding: 16px; Card grid gap: 16px
- CTA group gap: 8px
- Button padding: 9.6px x 16px; radius: 10px

### Motion

* **Easing:** `cubic-bezier(0.4, 0.0, 0.2, 1)`
* **Durations:** micro 150ms; state 250ms; page 400ms; teaching anim 800–1200ms
* **Signature cues:** subtle float on hover (`translateY(-1px)`), blink cursor (1.15s steps), gentle fades

### Coding Motifs (sparingly)

* Colored brackets: navy `[` and orange `]`
* Blinking cursor `_` / `|` after hero or section labels

---

## 2) Implementation Tokens

### CSS Variables (drop into global stylesheet)

```css
:root {
  --ink: #001524;
  --navy: #15616D;
  --navy-top: #2199AB;
  --orange: #FF7D00;
  --maroon: #901328;
  --maroon-top: #B51732;
  --band: rgba(0,0,0,0.04);
  --ticks: #EAECEF;
  --info: #475569;
  --success: #10B981; --warning: #F59E0B; --error: #EF4444;
  /* Layout + type */
  --container-max: 1140px;
  --container-px: 16px;
  --container-py: 24px;
  --space-1: 8px;  /* CTA gaps */
  --space-2: 16px; /* grid/card padding */
  --space-3: 24px; /* section spacing */
  --space-4: 32px; /* hero top, header margin */
  --space-5: 40px; /* hero bottom */
  --radius: 12px;  /* cards */
  --radius-btn: 10px;
}
@keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
```

### Tailwind (optional utility mapping)

Add to `tailwind.config.js` theme.extend:

```js
colors: {
  ink: '#001524', navy: '#15616D', orange: '#FF7D00',
  maroon: '#901328', band: 'rgba(0,0,0,0.04)', ticks: '#EAECEF',
},
fontFamily: { sans: ['Inter','-apple-system','BlinkMacSystemFont','sans-serif'] },
```

### JS Token Object (for non‑CSS modules)

```js
export const XBAR_COLORS = {
  text: '#001524', band: 'rgba(0,0,0,0.04)', tick: '#EAECEF',
  popFill: '#15616D', popTop: '#2199AB',
  midFill: '#FF7D00', midTop: '#ff9c33',
  botFill: '#901328', botTop: '#B51732',
  flash: 'rgba(255,125,0,0.85)', sampleMean: '#FF7D00',
  paramLine: '#15616D', samplingLine: '#901328'
};
```

---

## 3) Homepage Patterns (React/shadcn)

### Header (hero) spec

* White bg, Ink text.
* Logo text: `[` in Navy, `]` in Orange. Blinking cursor at end of “xbar”.
* Tagline: **“xbar — where stat serves cool”** (or **“average drinks, standard error”**), Body size, Info color.
* Primary CTA: Orange button; Secondary: Navy outline.

**Snippet**

```tsx
<h1 className="text-3xl md:text-5xl font-extrabold text-ink">
  <span className="text-navy">[</span>xbar<span className="text-orange">]</span>
  <span className="inline-block w-[0.6ch] h-[1em] bg-ink ml-1 animate-[blink_1.15s_steps(1)_infinite]" />
</h1>
<p className="text-[--info] mt-3">xbar — where stat serves cool</p>
```

### Cards

* Rounded 12–16px, subtle shadow, white bg, 16px padding
* Hover: raise by 1px

### Buttons

* **Primary:** bg Orange, text white, hover darken
* **Secondary (outline):** border Navy, text Navy, hover light Navy bg

---

## 4) Applet (Canvas) Visual Rules

### Trays & Scales

* Tray BG = `band`, ticks = `ticks`, labels in Ink
* Axis endpoints: “0” and “1” centered under first/last grid cell

### Stacks & Particles

* **Population:** fill Navy, top stroke Navy‑Light
* **Sample (middle):** fill Orange, top stroke `#ff9c33`
* **Sampling Dist (bottom):** fill Maroon, top stroke Maroon‑Light

### Lines (parameter/stat/sampling)

* Parameter (population): dashed, **Navy**, 3px
* Sample stat (current): dashed, **Orange**, 2px
* Sampling mean: dashed, **Maroon**, 3px
* **Masking rule:** When a vertical line overlaps boxes/particles, draw a white (bg‑colored) stroke beneath so the line remains readable without overpowering boxes.
* **Label placement:**

  * Put the parameter label to the **opposite side** of the sample stat label (auto‑detect >/<).
  * Avoid overlap with particles; shift by ±8px.

### Stats Text

* Top‑right: `μ=…`, `σ=…` in Ink 18px/600
* Bottom: left `runs=…`; right `E[•]=…`, `SD[•]=…`

### Motion

* Drop time per sample run: \~800–1200ms
* „Finalize previous then start new” allowed: previous completes instantly if user re‑clicks
* Flash sampled boxes (population) with Orange translucent overlay for \~160ms

### Accessibility

* Min color contrast WCAG AA for text vs white
* Button focus rings visible (2px outline offset)
* Labels use real text in DOM when feasible; otherwise ARIA labels on canvas controls

---

## 5) Mapping to Current Codebase

| Area            | File                             | What to change                                                                       |
| --------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| Color tokens    | `renderer.js` DEFAULT\_CONFIG    | Replace colors with **XBAR\_COLORS** mapping above                                   |
| Engine colors   | `stat-engine.js` `config.colors` | Sync text/background/accent to Ink/Navy/Orange                                       |
| UI panel        | `ui-components.js` styles        | Set fonts, button styles, panel bg `#FFF7EB` optional, or white for absolute minimal |
| Lines + masking | `rendering-utils.js`             | Ensure parameter/sample/sampling line colors + white masking segment under overlaps  |
| Homepage        | React MVP (Canvas)               | Keep brackets + blinking cursor; CTAs in Orange/Navy                                 |

---

## 6) Content Voice & Microcopy

* Friendly, concise, a bit playful. Stat‑bar puns sparingly.
* Section names: **What’s on Tap**, **Bartender’s Notes**, **Coming Soon**.

---

## 7) QA / “Smoke Tests”

* **Color sanity:** render blocks of Ink/Navy/Orange on white; verify contrast with a11y tool.
* **Blink check:** cursor anim visible and not distracting (>1s cadence).
* **Line overlap:** draw parameter/sample/sampling lines with dense stacks; confirm white masking keeps labels legible.
* **Responsive:** at 360px–1200px widths, grid centers and text doesn’t overlap.

**Optional helper**

```js
function xbarSmoke() {
  const hex = s => /^#[0-9A-Fa-f]{6}$/.test(s);
  return {
    ink: hex('#001524'), navy: hex('#15616D'), orange: hex('#FF7D00')
  };
}
```

---

## 8) Example: Applying to CLT (quick checklist)

1. Import tokens (CSS vars or JS object).
2. Swap renderer colors to Navy/Orange/Maroon + tops.
3. Ensure dashed lines + masking; place parameter/sample labels opposite sides.
4. Increase stats typography to 18px/600 and align as spec.
5. Confirm flash effect on sampled population boxes.
6. Run smoke tests; adjust contrast/spacings.

---

## 9) Tagline Options

* “xbar — where stat serves cool”
* “average drinks, standard error”
* “on tap: applets that teach”

---

**Version:** 1.0 (Code Bar baseline).\\
