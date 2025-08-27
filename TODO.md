# XBAR Development TODO List

*Last updated: 2025-08-27*

## 🚀 Next Session Priorities

### 1. Improve Banner Design for App and Blog Pages
**Status:** Pending  
**Current:** App pages have basic logo + buttons layout  
**Goal:** Create consistent, polished banner design
- [ ] Refine spacing, typography, and visual hierarchy
- [ ] Ensure mobile responsiveness  
- [ ] Match XBAR brand aesthetic
- [ ] Test across different screen sizes

**Files to modify:**
- `themes/xbar-hugo/layouts/apps/single.html`
- `themes/xbar-hugo/static/css/main.css`

### 2. Create Blog Post Template
**Status:** Pending  
**Current:** Blog posts use basic default template  
**Goal:** Custom template with banner (logo left, nav right) + clean R Markdown layout
- [ ] Design template: `layouts/_default/single.html` or `layouts/posts/single.html`
- [ ] Banner: `[x̄]` logo (left) + navigation links (right)  
- [ ] Content: Left-aligned title + clean R Markdown styling
- [ ] Test with actual R Markdown posts containing code chunks

### 3. Test R Markdown Functionality
**Status:** Pending  
- [ ] Create sample `.Rmd` blog post with R code chunks
- [ ] Verify code execution and output rendering
- [ ] Test plots, tables, and statistical output
- [ ] Ensure applet shortcode works in R Markdown

### 4. Consider PR Integration
**Status:** Pending  
- [ ] Review and merge dynamic homepage PR into `exp/blogdown_migration`
- [ ] Test merged functionality
- [ ] Resolve any conflicts or integration issues

## 🔄 Current Project State

**Active Branch:** `exp/blogdown_migration`  
**Pending PR:** `exp/dynamic-homepage-content` → `exp/blogdown_migration`  
**External Repo:** `xbar-apps` (cleaned and PR'd to main)

**Working Features:**
- ✅ Complete Hugo/blogdown integration
- ✅ XBAR theme with original design
- ✅ Dynamic homepage with automatic app/blog listing
- ✅ Flexible applet embedding via shortcode
- ✅ Clean applet separation (xbar-apps repo)
- ✅ Fixed logo spacing and navigation

**Development Commands:**
```r
# Start local development
blogdown::serve_site()

# Build for deployment  
blogdown::build_site()
```

## 📝 Development Notes

- **Homepage:** Now controlled by `content/_index.md` (dynamic)
- **Applet Embedding:** Use `{{< applet src="URL" width="100%" height="500" >}}`
- **Theme Location:** `themes/xbar-hugo/`
- **Config:** Local development needs `baseURL: "http://localhost:4321/"`

## 🎯 Future Enhancements (After Core TODO)

- [ ] Mobile navigation improvements
- [ ] Search functionality
- [ ] RSS feeds for blog posts
- [ ] Contact page template
- [ ] Deployment pipeline optimization
- [ ] SEO meta tags and structured data

---

**Resume development:** Start with banner improvements, then blog post template!