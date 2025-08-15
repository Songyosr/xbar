# XBAR 🍸📊
**Stat serves cool — average drinks, standard error**

> Side project, mostly vibe‑code; native R user learning JS — please help lol.

## 🤷‍♂️ What Is This?

A vibe-coded collection of interactive statistics applets. Started as a way to learn JavaScript while procrastinating on actual R work. Somehow it... kinda works?

Perfect (hopefully?) for:
- Students who learn better when things move
- Anyone tired of static textbook plots  
- People who think stats should be more fun
- Me, trying to understand JavaScript 😅

## 🧮 What Actually Works

### ✅ Central Limit Theorem Lab
*Status: Surprisingly functional!*

Animated particles falling from population to samples. Has lines that don't wiggle anymore (took way too long to fix). Mobile-friendly because accidentally learned about CSS media queries.

**Location**: https://Songyosr.github.io/xbar/apps/central-limit-theorem/

**Features that somehow work:**
- 🎯 Lines that avoid particles (fancy!)
- 📱 Swipe to close panels on mobile  
- 🎨 Labels that stay put (finally!)
- ⚡ Smooth animations (thanks Claude!)

### 🚧 Maybe Someday
- Confidence Intervals (if I figure out more JavaScript)
- p-Value stuff (probably will break something)  
- Bayes things (help wanted!)
- Whatever seems fun to code

## 🔧 Branching Rules

Because even vibe-coding needs some structure:

- `main` - The stable stuff (relatively speaking)
- `dev/` - General development (where things break first)
- `feat/feature-name` - New features (like `feat/better-animations`)
- `fix/issue-name` - Bug fixes (like `fix/wiggling-labels`)
- `exp/experiment` - Wild experiments (like `exp/3d-particles` - probably won't work)

Example: `git checkout -b feat/confidence-intervals`

## 🚀 Getting Started

```bash
# Serve locally and pray it works
npm run serve
# Visit http://localhost:8000

# Deploy (if you're brave)
npm run deploy
```

## 📁 What's Where

```
xbar/
├── public/               # Deployed static site
│   ├── apps/             # Individual applets (vanilla JS/canvas)
│   └── shared/           # Shared JS/CSS for applets + homepage
├── xbar/                 # CRA shell (React) used for builds/assets
├── stat_app/             # Where this journey started (R/TSX)
└── xbar_style_guide.md   # Current visual/UX guide (Code Bar)

## 🎛️ XBAR Style Guide (Code Bar)

The repo uses the XBAR "Code Bar" style defined in `xbar_style_guide.md`.

**Harmonized CSS Variables**: All stylesheets now use consistent variable names (`--ink`, `--info`, `--navy`, `--orange`, etc.)

- **Homepage**: `public/shared/xbar-homepage.css` - Landing page with harmonized variables
- **Applets**: `public/shared/xbar-applets.css` - Minimal applet styling  
- **React**: `xbar/src/xbar-tokens.css` + `xbar/src/theme.css` - Full token system

**Design Principles**:
- Typography: Inter; spacing on an 8px grid; calm motion; high contrast
- Accessibility: visible focus rings, AA contrast, touch targets ≥44px
- Use provided classes/utilities instead of ad-hoc inline styles

**Implementation**:
- `public/index.html` → `shared/xbar-homepage.css` (bracket + cursor motif)
- Applet pages → `shared/xbar-applets.css` (distraction-free)
- React shell → imports from `xbar/src/` (build tools only)

Prefer CSS variables and shared classes over custom inline CSS.
```

## 🎨 Design Vibe

Loosely following:
- **Colors**: Navy & Orange (looks professional-ish)
- **Font**: Inter (because it's trendy)  
- **Style**: Clean & minimal (hides my CSS skills)
- **Animation**: Smooth when it works

## 🔧 Tech Stack (aka Things I'm Learning)

- **R**: My comfort zone 💪
- **JavaScript**: Still figuring out `this` vs `that`
- **Canvas**: Drawing rectangles in a loop
- **CSS**: Copy-paste from Stack Overflow
- **Git**: Commit often, push when scared

## 📚 How to Use

### In Your Slides
```html
<iframe 
  src="https://Songyosr.github.io/xbar/apps/central-limit-theorem/" 
  width="100%" 
  height="600">
</iframe>
```

### In Bookdown (my people!)
```markdown
```{r, echo=FALSE}
knitr::include_url("https://Songyosr.github.io/xbar/apps/central-limit-theorem/")
```
```

## 🤝 Contributing

**Please help!** Especially if you actually know JavaScript.

- Found a bug? Open an issue (probably my CSS)
- Have ideas? PRs welcome (please explain like I'm 5)
- Want to add R integration? Let's talk!
- Think my code is weird? You're probably right

**Branching etiquette:**
1. Use the prefixes above (`feat/`, `fix/`, etc.)
2. Keep commits small and descriptive  
3. Test on mobile (I forget this constantly)
4. Don't judge my variable names

## ⚠️ Disclaimers

- This is a learning project (be gentle)
- Code quality varies by caffeine levels
- Mobile testing happens on my phone
- Comments written for future confused me
- R users trying JavaScript: we're in this together

## 📄 License

Do whatever. Just maybe mention it came from someone learning to code.

---

*Built with R background, JavaScript dreams, and lots of Stack Overflow* 🤷‍♂️✨
