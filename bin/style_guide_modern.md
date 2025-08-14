## XBAR Style Guide — Modern Minimalism with 8-Bit Bar Accents

### 🎨 Design Philosophy

Modern First, Retro Second: Clean, breathable interfaces with subtle pixelated accents. Think Airbnb meets Nintendo—sophisticated but approachable. With some fun and informal language. Retain the tagline Stat Serves Cool - Average Drink, Standard Error

Visual Hierarchy: Generous whitespace, clear typography, subtle 8-bit details as delightful surprises rather than the main show.

### 🎨 Color System

:root {
  /* Primary Palette - Day Theme */
  --primary-navy: #15616D;      /* Deep navy blue */
  --primary-orange: #FF7D00;    /* Vibrant orange */
  
  /* Backgrounds */
  --bg-primary: #FFFFFF;         /* Pure white */
  --bg-secondary: #FAFBFC;      /* Almost white */
  --bg-tertiary: #F6F8FA;       /* Light gray */
  
  /* Text Colors */
  --text-primary: #1A1A1A;      /* Almost black */
  --text-secondary: #4A5568;    /* Medium gray */
  --text-muted: #718096;        /* Light gray */
  
  /* Accent Colors */
  --accent-success: #48BB78;    /* Green */
  --accent-warning: #F6AD55;    /* Amber */
  --accent-error: #FC8181;      /* Red */
  --accent-info: #4299E1;       /* Blue */
  
  /* Borders & Dividers */
  --border-light: #E2E8F0;      /* Very light gray */
  --border-medium: #CBD5E0;     /* Light gray */
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);
  
  /* 8-Bit Accents (used sparingly) */
  --pixel-orange-light: #FFB366;
  --pixel-navy-light: #2A8B9B;
  --pixel-gray: #A0AEC0;
}
### 📐 Layout & Spacing

Grid System: 8px base unit (nod to 8-bit)

--space-1: 0.5rem;   /* 8px */
--space-2: 1rem;     /* 16px */
--space-3: 1.5rem;   /* 24px */
--space-4: 2rem;     /* 32px */
--space-5: 2.5rem;   /* 40px */
--space-6: 3rem;     /* 48px */
--space-8: 4rem;     /* 64px */
--space-10: 5rem;    /* 80px */
Container Widths:

--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
### 🔤 Typography

Font Stack:

/* Modern, clean fonts with good readability */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
--font-display: 'Inter', sans-serif; /* Can swap for Poppins or DM Sans for more personality */
Type Scale:

--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */
--text-5xl: 3rem;       /* 48px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
### 🎯 Component Patterns

#### Cards

.card {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: all 200ms ease;
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

/* 8-bit accent: tiny pixel corner */
.card::before {
  content: '';
  position: absolute;
  top: -1px;
  right: -1px;
  width: 16px;
  height: 16px;
  background: 
    linear-gradient(45deg, transparent 50%, var(--primary-orange) 50%);
  clip-path: polygon(50% 0, 100% 0, 100% 50%);
}
#### Buttons

.btn {
  font-family: var(--font-sans);
  font-weight: var(--font-medium);
  padding: var(--space-2) var(--space-4);
  border-radius: 8px;
  transition: all 150ms ease;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-primary {
  background: var(--primary-navy);
  color: white;
  border: 2px solid transparent;
}

.btn-primary:hover {
  background: color-mix(in srgb, var(--primary-navy) 90%, black);
  transform: translateY(-1px);
}

.btn-secondary {
  background: white;
  color: var(--primary-navy);
  border: 2px solid var(--border-light);
}

/* Subtle 8-bit touch: pixel shadow on hover */
.btn:hover::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 4px;
  right: 4px;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    var(--primary-orange) 0,
    var(--primary-orange) 2px,
    transparent 2px,
    transparent 4px
  );
}
### 🍺 Bar-Themed Elements (Subtle)

#### Status Badges

.badge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.badge-on-tap {
  background: color-mix(in srgb, var(--primary-orange) 10%, white);
  color: var(--primary-orange);
  border: 1px solid var(--primary-orange);
}

.badge-brewing {
  background: color-mix(in srgb, var(--primary-navy) 10%, white);
  color: var(--primary-navy);
}

/* 8-bit detail: pixelated edge */
.badge::before {
  content: '▪▪▪';
  font-size: 6px;
  margin-right: 0.5rem;
  opacity: 0.4;
}
#### Progress Indicators

/* Beer tap fill animation */
.progress-bar {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--primary-navy) 0%,
    var(--primary-orange) 100%
  );
  /* 8-bit touch: stepped animation */
  animation: fill 2s steps(8, end);
}
### ✨ Micro-Interactions

#### Hover States

Subtle elevation: translateY(-2px)
Gentle shadow increase
Color shifts using color-mix()
#### Loading States

.loading-dots {
  /* Modern spinner with 8-bit steps */
  animation: pixel-spin 1s steps(8) infinite;
}
#### Active States

.interactive:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}
### 🎮 8-Bit Ornamentations (Use Sparingly)

#### Pixel Borders

.pixel-border {
  border-image: url('data:image/svg+xml;utf8,<svg>...</svg>') 2;
  border-image-slice: 2;
  border-image-repeat: round;
}
#### Retro Corners

.retro-corner {
  clip-path: polygon(
    0 8px, 8px 8px, 8px 0,
    calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px,
    100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px),
    calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px),
    0 calc(100% - 8px)
  );
}
#### ASCII Decorations

.section-divider::before {
  content: '══════════════════';
  font-family: var(--font-mono);
  color: var(--border-light);
  letter-spacing: -2px;
}
### 📱 Responsive Behavior

/* Breakpoints */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }

/* Container padding adjusts */
.container {
  padding: var(--space-4);
}

@media (min-width: 768px) {
  .container {
    padding: var(--space-6);
  }
}
### ♿ Accessibility

Focus rings: 2px solid with 2px offset
Color contrast: All combinations meet WCAG AA
Touch targets: Minimum 44×44px
Keyboard navigation: Tab order logical
Screen readers: Proper ARIA labels
### 🎨 Implementation Examples

#### Hero Section

.hero {
  background: var(--bg-secondary);
  padding: var(--space-10) 0;
  text-align: center;
}

.hero-title {
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

/* Subtle 8-bit accent */
.hero-title::after {
  content: '_';
  animation: blink 1s step-end infinite;
  color: var(--primary-orange);
}
#### Navigation

.nav {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  padding: var(--space-3) 0;
}

.nav-link {
  color: var(--text-secondary);
  font-weight: var(--font-medium);
  transition: color 150ms ease;
}

.nav-link:hover {
  color: var(--primary-navy);
}

.nav-link.active {
  color: var(--primary-orange);
  /* 8-bit touch: pixel underline */
  border-bottom: 2px dotted var(--primary-orange);
}
### 🍺 Bar Terminology (Subtle Integration)

“On Tap” → Available now
“Brewing” → In development
“Happy Hour” → Featured content
“Last Call” → Final section
“Tab” → User account/progress
But keep these minimal and clever, not overwhelming.