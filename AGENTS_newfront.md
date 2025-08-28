# XBAR Homepage Implementation Guide

## Option 1: Hero + Card Grid Layout

### File Structure Required
```
themes/xbar-hugo/
├── layouts/
│   ├── index.html          # Homepage template
│   ├── partials/
│   │   ├── hero.html       # Hero section
│   │   ├── app-grid.html   # Apps grid
│   │   └── blog-grid.html  # Blog posts grid
│   └── _default/
│       └── baseof.html     # Base template
└── static/
    └── css/
        └── hero-grid.css   # Specific styles
```

### Step 1: Update `content/_index.md`
```yaml
---
title: "XBAR"
layout: "hero-grid"
hero:
  title: "XBAR"
  subtitle: "where stat serves cool"
  description: "Interactive statistics that actually make sense"
  cta_text: "Explore Apps"
  cta_link: "#apps"
  show_cursor: true

featured_app:
  name: "central-limit-theorem"
  title: "Central Limit Theorem Lab"
  description: "Watch the magic happen as random samples transform into the bell curve"
  badge: "FEATURED"
  
show_apps: true
apps_title: "Interactive Applets"
apps_per_row: 3

show_blog: true
blog_title: "Latest from the Blog"
blog_posts: 3
---

Optional markdown content here that appears below the hero.
```

### Step 2: Create `themes/xbar-hugo/layouts/index.html`
```html
{{ define "main" }}
<!-- Hero Section -->
{{ if .Params.hero }}
<section class="hero-section">
    <div class="container">
        <h1 class="hero-title">
            {{ .Params.hero.title }}
            {{ if .Params.hero.show_cursor }}<span class="cursor-blink">_</span>{{ end }}
        </h1>
        <p class="hero-subtitle">{{ .Params.hero.subtitle }}</p>
        {{ with .Params.hero.description }}
            <p class="hero-description">{{ . }}</p>
        {{ end }}
        {{ if .Params.hero.cta_text }}
            <a href="{{ .Params.hero.cta_link }}" class="btn-cta">
                {{ .Params.hero.cta_text }}
            </a>
        {{ end }}
    </div>
</section>
{{ end }}

<!-- Featured App Section -->
{{ if .Params.featured_app }}
<section class="featured-app">
    <div class="container">
        <div class="featured-grid">
            <div class="featured-info">
                <span class="badge">{{ .Params.featured_app.badge }}</span>
                <h2>{{ .Params.featured_app.title }}</h2>
                <p>{{ .Params.featured_app.description }}</p>
                <a href="/apps/{{ .Params.featured_app.name }}/" class="app-link">
                    Launch App →
                </a>
            </div>
            <div class="featured-preview">
                <!-- Embed iframe or preview here -->
                <iframe src="https://songyosr.github.io/xbar-apps/apps/{{ .Params.featured_app.name }}/" 
                        width="100%" 
                        height="400" 
                        frameborder="0">
                </iframe>
            </div>
        </div>
    </div>
</section>
{{ end }}

<!-- Apps Grid -->
{{ if .Params.show_apps }}
<section id="apps" class="apps-section">
    <div class="container">
        {{ with .Params.apps_title }}<h2>{{ . }}</h2>{{ end }}
        <div class="apps-grid">
            {{ range where .Site.RegularPages "Section" "apps" }}
            <div class="app-card">
                <h3>{{ .Title }}</h3>
                <p>{{ .Params.description }}</p>
                <div class="app-status">
                    {{ if .Params.available }}✓ Available{{ else }}Coming Soon{{ end }}
                </div>
            </div>
            {{ end }}
        </div>
    </div>
</section>
{{ end }}

<!-- Blog Section -->
{{ if .Params.show_blog }}
<section class="blog-section">
    <div class="container">
        {{ with .Params.blog_title }}<h2>{{ . }}</h2>{{ end }}
        <div class="blog-grid">
            {{ range first .Params.blog_posts (where .Site.RegularPages "Section" "posts") }}
            <article class="blog-card">
                <time class="blog-date">{{ .Date.Format "Jan 2, 2006" }}</time>
                <h4><a href="{{ .RelPermalink }}">{{ .Title }}</a></h4>
                <p>{{ .Summary | truncate 100 }}</p>
            </article>
            {{ end }}
        </div>
    </div>
</section>
{{ end }}

<!-- Main content if any -->
{{ with .Content }}
<section class="content">
    <div class="container">
        {{ . }}
    </div>
</section>
{{ end }}
{{ end }}
```

### Step 3: Add CSS (`themes/xbar-hugo/static/css/hero-grid.css`)
```css
/* Hero Section */
.hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 80px 0;
    text-align: center;
}

.hero-title {
    font-size: clamp(2rem, 5vw, 3rem);
    font-weight: 800;
    margin-bottom: 1rem;
}

.cursor-blink {
    display: inline-block;
    width: 3px;
    height: 1.2em;
    background: var(--orange);
    margin-left: 0.25rem;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
}

/* Featured App */
.featured-app {
    padding: 60px 0;
}

.featured-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
}

.badge {
    display: inline-block;
    padding: 4px 12px;
    background: #28a745;
    color: white;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 600;
}

/* Apps Grid */
.apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    margin-top: 30px;
}

.app-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 25px;
    transition: all 0.3s;
}

.app-card:hover {
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    transform: translateY(-5px);
}

/* Blog Grid */
.blog-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 25px;
    margin-top: 30px;
}

.blog-card {
    border-left: 3px solid var(--orange);
    padding: 20px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Responsive */
@media (max-width: 768px) {
    .featured-grid {
        grid-template-columns: 1fr;
    }
    
    .apps-grid, .blog-grid {
        grid-template-columns: 1fr;
    }
}
```

---

## Option 3: Magazine/Editorial Style Layout

### File Structure Required
```
themes/xbar-hugo/
├── layouts/
│   ├── index.html          # Homepage template  
│   └── partials/
│       ├── magazine-header.html
│       ├── featured-article.html
│       └── content-grid.html
└── static/
    └── css/
        └── magazine.css    # Magazine-specific styles
```

### Step 1: Update `content/_index.md`
```yaml
---
title: "XBAR"
layout: "magazine"
header:
  style: "minimal"
  show_logo: true
  nav_style: "uppercase"
  
featured:
  type: "article"  # or "app"
  title: "The Central Limit Theorem Isn't Just Theory Anymore"
  author: "XBAR Team"
  read_time: "5 min read"
  category: "Interactive Lab"
  excerpt: |
    Stop memorizing formulas and start understanding distributions. 
    Our interactive CLT lab lets you watch sampling distributions emerge in real-time.
  image: "/images/clt-hero.jpg"  # optional
  link: "/apps/central-limit-theorem/"

sidebar:
  show_apps: true
  apps_title: "Interactive Apps"
  show_popular: true
  popular_title: "Popular Posts"
  
content_grid:
  title: ""  # Leave empty for no title
  items: 6   # Number of items to show
  show_category: true
  show_author: true
---

Additional editorial content can go here in markdown.
```

### Step 2: Create `themes/xbar-hugo/layouts/index.html` (Magazine Version)
```html
{{ define "main" }}
<!-- Magazine Header -->
<header class="magazine-header">
    <div class="container">
        <a href="/" class="magazine-logo">
            <span class="bracket">[</span>x̄<span class="bracket">]</span> XBAR
        </a>
        <nav class="magazine-nav">
            {{ range .Site.Menus.main }}
            <a href="{{ .URL }}">{{ .Name }}</a>
            {{ end }}
        </nav>
    </div>
</header>

<!-- Featured Content Section -->
<section class="magazine-featured">
    <div class="container">
        <div class="featured-layout">
            <!-- Main Feature -->
            <article class="main-feature">
                {{ with .Params.featured.image }}
                <div class="feature-image">
                    <img src="{{ . }}" alt="">
                </div>
                {{ else }}
                <div class="feature-placeholder">
                    <iframe src="https://songyosr.github.io/xbar-apps/apps/central-limit-theorem/" 
                            width="100%" 
                            height="400" 
                            frameborder="0">
                    </iframe>
                </div>
                {{ end }}
                
                <h1 class="feature-title">{{ .Params.featured.title }}</h1>
                
                <div class="feature-meta">
                    <span class="category">{{ .Params.featured.category }}</span>
                    <span class="separator">•</span>
                    <span class="read-time">{{ .Params.featured.read_time }}</span>
                    {{ with .Params.featured.author }}
                    <span class="separator">•</span>
                    <span class="author">By {{ . }}</span>
                    {{ end }}
                </div>
                
                <p class="feature-excerpt">{{ .Params.featured.excerpt }}</p>
                
                <a href="{{ .Params.featured.link }}" class="feature-link">
                    Continue Reading →
                </a>
            </article>
            
            <!-- Sidebar -->
            <aside class="magazine-sidebar">
                {{ if .Params.sidebar.show_apps }}
                <div class="sidebar-section">
                    <h3>{{ .Params.sidebar.apps_title }}</h3>
                    <ul class="sidebar-list">
                        {{ range where .Site.RegularPages "Section" "apps" }}
                        <li>
                            <a href="{{ .RelPermalink }}">
                                <span>{{ .Title }}</span>
                                <span class="status {{ if .Params.available }}available{{ end }}">
                                    {{ if .Params.available }}Live{{ else }}Soon{{ end }}
                                </span>
                            </a>
                        </li>
                        {{ end }}
                    </ul>
                </div>
                {{ end }}
                
                {{ if .Params.sidebar.show_popular }}
                <div class="sidebar-section">
                    <h3>{{ .Params.sidebar.popular_title }}</h3>
                    <ul class="sidebar-list">
                        {{ range first 5 (where .Site.RegularPages "Section" "posts") }}
                        <li>
                            <a href="{{ .RelPermalink }}">
                                <span>{{ .Title }}</span>
                                {{ with .Params.views }}
                                <span class="views">{{ . }}</span>
                                {{ end }}
                            </a>
                        </li>
                        {{ end }}
                    </ul>
                </div>
                {{ end }}
            </aside>
        </div>
    </div>
</section>

<!-- Content Grid -->
<section class="magazine-grid">
    <div class="container">
        <div class="content-grid">
            {{ range first .Params.content_grid.items .Site.RegularPages }}
            <article class="grid-item">
                {{ with .Params.thumbnail }}
                <div class="item-thumbnail">
                    <img src="{{ . }}" alt="">
                </div>
                {{ else }}
                <div class="item-placeholder">[{{ .Section | title }}]</div>
                {{ end }}
                
                {{ if $.Params.content_grid.show_category }}
                <div class="item-category">{{ .Section | title }}</div>
                {{ end }}
                
                <h4><a href="{{ .RelPermalink }}">{{ .Title }}</a></h4>
                
                {{ if $.Params.content_grid.show_author }}
                <div class="item-meta">
                    {{ .Params.author | default .Section }} • {{ .ReadingTime }} min read
                </div>
                {{ end }}
            </article>
            {{ end }}
        </div>
    </div>
</section>

<!-- Additional Content -->
{{ with .Content }}
<section class="editorial-content">
    <div class="container">
        {{ . }}
    </div>
</section>
{{ end }}
{{ end }}
```

### Step 3: Add CSS (`themes/xbar-hugo/static/css/magazine.css`)
```css
/* Magazine Header */
.magazine-header {
    text-align: center;
    padding: 40px 0;
    border-bottom: 2px solid var(--navy);
}

.magazine-logo {
    font-size: 36px;
    font-weight: 800;
    color: var(--navy);
    text-decoration: none;
    display: block;
    margin-bottom: 20px;
}

.magazine-nav {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.magazine-nav a {
    margin: 0 20px;
    color: var(--muted);
    text-decoration: none;
    transition: color 0.3s;
}

/* Featured Layout */
.featured-layout {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 40px;
    margin: 60px 0;
}

.main-feature h1 {
    font-size: clamp(1.75rem, 4vw, 2.25rem);
    line-height: 1.2;
    color: var(--navy);
    margin: 30px 0 20px;
}

.feature-meta {
    color: var(--muted);
    font-size: 14px;
    margin-bottom: 20px;
}

.feature-excerpt {
    font-size: 18px;
    line-height: 1.8;
    color: var(--text);
    margin-bottom: 20px;
}

/* Sidebar */
.magazine-sidebar {
    border-left: 1px solid var(--border);
    padding-left: 40px;
}

.sidebar-section h3 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--orange);
}

.sidebar-list {
    list-style: none;
    padding: 0;
}

.sidebar-list li {
    padding: 15px 0;
    border-bottom: 1px solid var(--border);
}

.sidebar-list a {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-decoration: none;
    color: var(--navy);
}

.status {
    font-size: 11px;
    padding: 2px 8px;
    background: var(--light-gray);
    border-radius: 10px;
}

.status.available {
    background: #d4edda;
    color: #155724;
}

/* Content Grid */
.content-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    padding-top: 60px;
    border-top: 1px solid var(--border);
}

.grid-item h4 {
    font-size: 18px;
    line-height: 1.4;
    margin: 10px 0;
}

.item-category {
    color: var(--orange);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
    .featured-layout {
        grid-template-columns: 1fr;
    }
    
    .magazine-sidebar {
        border-left: none;
        border-top: 1px solid var(--border);
        padding-left: 0;
        padding-top: 40px;
        margin-top: 40px;
    }
    
    .content-grid {
        grid-template-columns: 1fr;
    }
}
```

---

## General Implementation Notes for Agents

### 1. **Preserve Existing Functionality**
- Keep all existing Hugo/blogdown integrations intact
- Maintain compatibility with `.Rmd` files
- Preserve the existing applet shortcode functionality

### 2. **Data Sources**
- Apps: Pull from `content/apps/` directory
- Blog posts: Pull from `content/posts/` directory  
- Applet URLs: Use pattern `https://songyosr.github.io/xbar-apps/apps/{name}/`

### 3. **Testing Checklist**
- [ ] Homepage renders correctly with `blogdown::serve_site()`
- [ ] All links work (blog, apps, navigation)
- [ ] Responsive design works on mobile
- [ ] Iframes load correctly for applets
- [ ] R Markdown posts render properly
- [ ] CSS animations (cursor blink) function

### 4. **Configuration Variables**
All customization should be done through:
- `content/_index.md` frontmatter (page-specific)
- `config.yaml` params (site-wide)
- No hardcoded values in templates

### 5. **Fallback Behavior**
Templates should gracefully handle missing data:
```html
{{ with .Params.hero }}
    <!-- Show hero only if defined -->
{{ end }}

{{ .Params.title | default "XBAR" }}
```

### 6. **File Paths**
- Always use `relURL` or `absURL` helpers for paths
- Example: `{{ "/css/main.css" | relURL }}`

### 7. **Development Workflow**
```bash
# Test locally with R
blogdown::serve_site()

# Or with Hugo directly
hugo server -D

# Build for production
blogdown::build_site()
```

### 8. **Deployment**
The GitHub Actions workflow should automatically:
1. Build from `hugo_public/`
2. Deploy to GitHub Pages
3. No changes needed to existing deployment