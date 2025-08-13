# XBAR Style Guide — Speakeasy Stats
**"Stat Serves Cool - Average Drinks, Standard Errors"**

> *Where data meets dim lighting and statistical significance is served neat*

## 🍸 Design Philosophy

**Speakeasy Minimalism**: Sophisticated, understated, with just enough warmth to feel approachable. Think dimly-lit cocktail lounge where smart conversations happen over well-crafted drinks.

**Visual Hierarchy**: Less is more. Clean lines, generous whitespace, subtle textures.

## 🎨 Color Palette

### Day Theme (Warm Afternoon Light)
```css
:root {
  /* Primary Colors */
  --text-primary: #2C1810;      /* Rich espresso */
  --text-secondary: #5D4A3A;    /* Warm taupe */
  --bg-primary: #FFF8E7;        /* Cream canvas */
  --bg-secondary: #F5EFE7;      /* Soft linen */
  
  /* Accent Colors */
  --accent-amber: #D4A574;      /* Warm amber */
  --accent-navy: #1B2951;       /* Deep navy */
  --accent-gold: #B8860B;       /* Muted gold */
  
  /* Interactive States */
  --hover-amber: #C19A66;       /* Darker amber on hover */
  --active-navy: #243A6B;       /* Lighter navy when active */
  
  /* Subtle Elements */
  --border-light: #E8DDD4;      /* Barely-there borders */
  --shadow-soft: rgba(44, 24, 16, 0.08); /* Gentle shadows */
}
```

### Night Theme (Coming Soon)
```css
/* Future: Dim gold, charcoal, soft whites */
```

## 📐 Layout & Spacing

**Grid System**: 8px base unit
- Micro: 4px (0.25rem)
- Small: 8px (0.5rem) 
- Base: 16px (1rem)
- Large: 24px (1.5rem)
- XL: 32px (2rem)
- XXL: 48px (3rem)

**Container**: Max-width 1200px, centered

**Header**: Sleek and minimal
- Reduced padding: 1.5rem vertical (down from 2rem)
- Tagline: Smaller, more elegant typography
- Hero section: Tighter line-height, less dramatic

## 🔤 Typography

**Font Stack**: 
```css
font-family: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Hierarchy**:
- **Display**: 2rem (32px), weight 700, for main headings
- **Title**: 1.5rem (24px), weight 600, for section headers  
- **Body**: 1rem (16px), weight 400, for regular text
- **Caption**: 0.875rem (14px), weight 500, for labels/metadata
- **Small**: 0.75rem (12px), weight 400, for fine print

**Line Heights**: 
- Display: 1.2
- Body: 1.6
- Tight: 1.4 (for compact areas)

## 🎯 Component Styling

### Cards
```css
.speakeasy-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-soft);
  transition: all 200ms ease;
}

.speakeasy-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px var(--shadow-soft);
}
```

### Buttons
```css
.btn-primary {
  background: var(--accent-amber);
  color: var(--text-primary);
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: background 150ms ease;
}

.btn-primary:hover {
  background: var(--hover-amber);
}

.btn-secondary {
  background: transparent;
  color: var(--accent-navy);
  border: 1px solid var(--accent-navy);
}
```

## 🍺 Bar-Themed Elements

### Menu-Style Navigation
- **"What's on Tap"** - Available applets
- **"House Specials"** - Featured tools
- **"Coming Soon"** - Future releases
- **"Bartender's Notes"** - Documentation

### Interactive Elements
- Progress bars → **Tap handles** filling glasses
- Loading states → **Cocktail shaker** animations
- Success states → **Glass clink** micro-interactions
- Buttons → **Order** instead of "Launch"

### Status Indicators
```css
.status-available {
  background: #E8F5E8;
  color: #2D5A2D;
  border-left: 3px solid var(--accent-gold);
}

.status-coming-soon {
  background: #FDF4E8;
  color: #8B5A2B;
  border-left: 3px solid var(--accent-amber);
}
```

## ✨ Animation Guidelines

**Easing**: Custom speakeasy curve
```css
transition-timing-function: cubic-bezier(0.4, 0.0, 0.2, 1);
```

**Durations**:
- Micro-interactions: 150ms
- State changes: 250ms  
- Page transitions: 400ms
- Teaching animations: 800-1200ms

**Signature Moves**:
- Gentle float on hover (`transform: translateY(-1px)`)
- Subtle scale on press (`transform: scale(0.98)`)
- Smooth opacity fades for state changes

## 📱 Responsive Behavior

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Mobile-first approach** with progressive enhancement

## 🎨 Visual Texture

**Subtle Details**:
- Paper texture overlay on cards (very subtle, ~2% opacity)
- Soft inner shadows on input fields
- Letterpress effect on primary buttons
- Gentle gradients instead of flat colors (5-10% variation)

## ♿ Accessibility

**Contrast Ratios**: All combinations meet WCAG AA
**Focus States**: Visible amber outline on interactive elements
**Touch Targets**: Minimum 44px × 44px
**Alt Text**: Descriptive for all charts and graphics

---

*This guide embodies the xbar philosophy: sophisticated statistical education served with style and substance*