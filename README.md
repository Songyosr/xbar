# Stat Applet Lab

**Not Your Average Bar - Standard Drinks, Standard Errors**

A cohesive collection of animated, interactive web applets that teach core statistics concepts. Perfect for medical, public health, and undergraduate students.

## 🎯 Features

- **Pedagogically Focused**: Every animation designed to illuminate statistical concepts
- **Lightweight & Fast**: Smooth performance on any device  
- **Embeddable**: Drop into slides, Bookdown, or LMS platforms
- **Unified Design**: Consistent experience across all applets
- **Accessible**: WCAG compliant with keyboard navigation
- **Scientifically Accurate**: Numerically stable algorithms

## 🧮 Available Applets

### ✅ Central Limit Theorem Lab
Explore how sample statistics behave as sample size changes. Interactive population distributions with animated sampling.

**Enhanced Features:**
- 🎯 Smart line positioning with particle masking
- 📱 Fully responsive design with mobile gestures  
- 🎨 Enhanced visual feedback with stable labels
- ⚡ Smooth animations showing parameter vs sample statistics

**Location**: `/public/apps/central-limit-theorem/`

### 🚧 Coming Soon
- Confidence Interval Builder
- p-Value Explorer  
- Effect Size Studio
- Regression Sandbox
- Bayes Intuition Board
- Simulation Blocks
- Study Design & Power

## 🚀 Quick Start

### Local Development
```bash
# Serve locally for testing
npm run serve
# Visit http://localhost:8000
```

### GitHub Pages Deployment
```bash
# Build and deploy
npm run deploy
```

## 📁 Project Structure

```
xbar/
├── public/                 # GitHub Pages root
│   ├── index.html         # Main frontpage  
│   ├── apps/              # Individual applets
│   │   └── central-limit-theorem/
│   └── shared/            # Common components & modules
├── xbar/                  # Original React app
├── stat_app/              # Development source
└── style_guide.md         # Design guidelines
```

## 🎨 Design System

All applets follow the unified design guide:

- **Colors**: Navy (#15616D), Orange (#FF7D00), Warm backgrounds
- **Typography**: Inter font family, consistent sizing
- **Layout**: Clean, minimal, accessible
- **Animation**: Purposeful, lightweight animations

See `style_guide.md` for complete specifications.

## 🔧 Tech Stack

- **Framework**: React + TypeScript (development) → Vanilla JS (production)
- **Styling**: TailwindCSS + custom CSS
- **Animation**: Canvas-based smooth animations
- **Math**: Custom numerically stable utilities
- **RNG**: Deterministic Mulberry32
- **Architecture**: Modular components for reusability

## 📚 Usage

### Embedding in Slides
```html
<iframe 
  src="https://yoursite.github.io/xbar/public/apps/central-limit-theorem/" 
  width="100%" 
  height="600"
  frameborder="0">
</iframe>
```

### Bookdown Integration
```markdown
```{r, echo=FALSE}
knitr::include_url("https://yoursite.github.io/xbar/public/apps/central-limit-theorem/")
```
```

## 🤝 Contributing

1. Follow the style guide in `style_guide.md`
2. Ensure components are embeddable and accessible
3. Test across devices and browsers
4. Add educational tooltips and help text

## 📄 License

Educational use. Please attribute when embedding.

---

*Built for statistical education with ❤️*
