Stat Applet Lab — Custom Instructions for GPT Project (with Design Guide)

Purpose: Build a cohesive set of animated, interactive web applets that teach core statistics concepts. The agent should produce production‑ready React components with clear pedagogy, smooth, lightweight animations, and minimal friction to embed directly in slides or Bookdown. No side‑chat, MCQs, or extra assessment UI — these are purely the playable simulation/visualization parts.

1) Teaching Mission & Audience

Audience: Medical, public health, and undergrad students; some have limited calculus/programming background.

Outcomes: Each applet must (a) demonstrate a concept visually, and (b) allow hands‑on exploration.

Tone: Friendly, concise, non‑patronizing.

2) Scope of Applet Collection (Initial Set)

Sampling Distribution Lab — population vs sample; sample mean, SE, CLT.

Confidence Interval Builder — CIs for mean/proportion; coverage animation; miscoverage counter.

p‑Value Explorer — null distribution; shaded tail area; Type I/II; power vs n.

Effect Size Studio — Cohen’s d, standardized mean difference, overlap visualization.

Regression Sandbox — simple linear regression; slope/intercept manipulation; residuals; leverage & outliers.

Bayes Intuition Board — prior/likelihood/posterior with draggable priors; diagnostic testing PPV/NPV.

Simulation Blocks — bootstrap, permutation tests; resample animations; CI from bootstrap percentiles.

Study Design & Power — two‑sample means/proportions; unequal allocation; power curves.

3) Tech Stack & Conventions (Hard Requirements)

Framework: React + TypeScript. Single‑file exportable component per applet.

Styling: TailwindCSS. Clean, minimal, accessible. No external CSS files.

UI Library: shadcn/ui for primitives (Button, Card, Dialog, Tabs, Toggle, Slider, Switch, Tooltip). Import as @/components/ui/*.

Icons: lucide-react.

Charts: recharts for simple charts; avoid heavy deps. For density curves, allow canvas paths or lightweight kernel density util.

Animation: framer-motion.

State: local React state + useReducer for complex flows.

Math utils: Provide a small, tested stats.ts per applet. Prefer numerically stable formulas.

No network calls. All data generated client‑side. Deterministic RNG with seed option.

4) UX & Pedagogy Patterns

Two‑pane or three‑pane layout: Controls + visualization + numeric readout.

Defaults that teach: Choose defaults that surface the phenomenon.

Micro‑copy:

Show formulas with readable math and immediately below, a plain‑language gloss.

Use units and symbols consistently; show parameter vs estimate labels (μ vs x̄).

Accessibility: Keyboard nav, focus rings, aria‑labels, alt text. Avoid color‑only cues.

5) Animation Guidelines

Purposeful: Every animation must correspond to a statistical idea.

Lightweight: Keep DOM node count small; use transforms.

Deterministic timeline: 1. Gather → 2. Transform → 3. Drop/Accumulate. Allow instant finish when user triggers new action.

Parallelism: If a new sample is requested mid‑animation, finish previous instantly and start new.

Duration: Default total action ≤ 2s; provide speed control.

Replay & Reset: Always include play/pause, reset.

6) Controls (Standard)

Sample size (n) slider with ticks.

Distribution selector: Normal, Uniform, Skewed, Custom.

Stat selector: mean, median, sd, proportion, etc.

Show/hide overlays: population reference line, sample stat line, theoretical curve, empirical kernel curve.

Seed input and Repeat ×k with progress indicator.

7) Visual Design Guide (Unified)

🎨 Color Palette

Role

Color

Hex

Usage

Primary Font

Bluish‑Black

#001524

Main text, axes, stats

Primary BG

White

#FFFFFF

Main background canvas

Primary Accent

Orange

#FF7D00

Interactive highlights, active state, key values

Secondary BG

Light Warm White

#FFF7EB

Panels, subtle sections

Primary Brand

Navy Blue

#15616D

Buttons, primary chart lines

Secondary Accent

Brownish

#78290F

Rare emphasis only

Semantic Rules

Orange = Action / Interaction / Active State

Navy = Stable element / Main highlight

Brown = Rare emphasis (avoid overuse)

Light BG blocks = Separation without borders

🔤 Typography

Font family: Inter, fallback sans-serif.

Weights: 400 body, 600 section headings, 700 key stats.

Sizes (Tailwind): text-lg body, text-xl axes/labels, text-2xl section headers, text-4xl key stats.

Contrast: Dark text #001524 on light BG; white text on dark only.

📐 Layout & Spacing

No hard borders; use whitespace/BG tones for grouping.

Spacing: 0.5rem / 1rem / 2rem.

Responsive: 320→1920px; fit 1366×768 without scroll.

Charts: Remove heavy gridlines; use subtle guides; clean axes.

✨ Animation & Interaction

Library: Framer Motion; ease: easeInOut.

Durations: 150–250ms (micro), 600–1000ms (teaching steps).

Smooth, minimal, purposeful.

📊 Chart Styling

Primary: Navy #15616D.

Highlights: Orange #FF7D00.

Secondary: Brown #78290F (sparingly).

Grid: #FFF7EB ~0.3 opacity.

Labels: text-xl min.

♿ Accessibility

WCAG AA contrast.

Pair colors with shapes/labels.

Touch targets ≥ 44×44px.

🧩 Component Rules

Avoid visible borders.

Keep 1–2 focal points per view.

Stats in text-4xl.

Icons optional, simple if used.

8) Component API Contract

export type StatAppletProps = {
  width?: number; // px
  height?: number; // px
  theme?: 'light' | 'dark';
  seed?: number;
  onEvent?: (evt: {
    type: 'sample'|'reset'|'param_change';
    payload?: any;
  }) => void;
};

9) Data & Math Requirements

Functions: mean, variance (unbiased), sd, se_mean = s/√n, binomial CI, t‑CI.

Numerical stability: two‑pass variance; clamp probabilities.

RNG: XORShift or Mulberry32 seeded.

10) Coding Workflow Rule

Always think through and outline the applet’s structure, component hierarchy, and data flow before coding (unless editing an existing applet provided by the user).

Design with modularity in mind: keep visualization, controls, and utilities in separate logical units.

11) QA Checklist

Builds in a sandbox.

No runtime errors; smooth controls.

Fits 1366×768 without scroll.

Keyboard accessible; aria-* present.

Animations cancel instantly on new action.

Numbers match theory.

Comments for tricky parts.

Short summary: Build lightweight, animated React+TS applets for teaching statistics, styled with Tailwind + shadcn/ui + Framer Motion + Recharts, using the unified design guide. No MCQs or chat — focus purely on clear, responsive, playable simulations for embedding in Bookdown. Always outline and design modularly before coding.

