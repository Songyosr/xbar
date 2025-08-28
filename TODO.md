# XBAR Development TODO List

*Last updated: 2025-08-27*

## 🚀 Next Session Priorities

### 1. Homepage Design Decision
**Status:** Ready for Review  
**Options Created:** Three homepage versions available for testing
- [x] Original design (current active)
- [x] Hero + Card Grid layout (`index-hero.html`)
- [x] Magazine/Editorial layout (`index-magazine.html`)  
- [ ] **Decision needed:** Choose final homepage version to implement
- [ ] Remove unused versions and clean up files

### 2. Continue Banner Improvements for App and Blog Pages  
**Status:** Pending
- [ ] Refine spacing, typography, and visual hierarchy
- [ ] Ensure mobile responsiveness
- [ ] Test across different screen sizes
- [ ] Apply consistent XBAR branding

**Files to modify:**
- `themes/xbar-hugo/layouts/apps/single.html`
- `themes/xbar-hugo/static/css/main.css`

### 3. Create Blog Post Template
**Status:** Pending
- [ ] Design custom template with banner layout  
- [ ] Clean R Markdown styling for code chunks
- [ ] Test with actual R Markdown posts

### 4. Test R Markdown Functionality
**Status:** Pending
- [ ] Create sample `.Rmd` blog post with R code chunks
- [ ] Verify code execution and output rendering
- [ ] Ensure applet shortcode works in R Markdown

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