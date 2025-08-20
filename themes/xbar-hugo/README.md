# XBAR Hugo Theme

A Hugo theme for the XBAR project - "Code Bar" style with navy and orange accents, designed for statistics education and interactive applets.

## Features

- 🎨 **XBAR Design System**: Implements the complete XBAR color palette and typography
- 📱 **Responsive**: Mobile-first design that works on all devices
- 🧮 **Applet Integration**: Built-in support for embedding interactive React applets
- ✍️ **Blog Ready**: Optimized layouts for technical writing and R Markdown content
- 🎯 **Minimal & Fast**: Clean HTML, optimized CSS, no JavaScript dependencies

## Installation

### For Hugo Sites

1. Add the theme to your Hugo site:
```bash
git submodule add https://github.com/Songyosr/xbar themes/xbar-hugo
```

2. Update your `config.toml`:
```toml
theme = "xbar-hugo"
```

### For Blogdown (R)

1. Install blogdown and create a new site:
```r
# Install blogdown if you haven't already
install.packages("blogdown")

# Create new site with XBAR theme
blogdown::new_site(theme = "Songyosr/xbar", 
                   theme_example = TRUE,
                   format = "toml")
```

## Configuration

### Basic Setup

```toml
baseURL = "https://yoursite.com"
languageCode = "en-us"
title = "Your Site — Code Bar"
theme = "xbar-hugo"

[params]
  brand = "x̄"
  tagline = "where stat serves cool"
  description = "Your site description"
  github = "https://github.com/yourusername/yourrepo"
  
  # Enable HTML embedding for applets
  [markup.goldmark.renderer]
    unsafe = true
```

### Applets Configuration

Add interactive applets to your homepage:

```toml
[[params.applets]]
  name = "CLT Lab"
  description = "See sampling distributions build up"
  url = "/apps/central-limit-theorem/"
  status = "available"  # or "coming"

[[params.applets]]
  name = "Confidence Intervals"
  description = "Simulate coverage rates"
  url = "#"
  status = "coming"
```

## Content Structure

```
content/
├── _index.md          # Homepage content (optional)
├── posts/             # Blog posts
│   ├── first-post.md
│   └── second-post.md
└── apps/              # Applet pages (optional)
    └── clt/
        └── index.md
```

## Embedding React Applets

### Method 1: Direct Iframe
```html
<iframe src="/static/applets/clt/" 
        width="100%" 
        height="600" 
        frameborder="0">
</iframe>
```

### Method 2: R Markdown Integration
```r
# In your .Rmd file
htmltools::includeHTML("path/to/applet.html")
```

### Method 3: Hugo Shortcode
Create a shortcode for reusable applet embedding:

```html
<!-- layouts/shortcodes/applet.html -->
<iframe src="{{ .Get "src" }}" 
        width="{{ .Get "width" | default "100%" }}" 
        height="{{ .Get "height" | default "600" }}" 
        frameborder="0"
        class="applet-embed">
</iframe>
```

Use in content:
```markdown
{{< applet src="/apps/clt/" height="500" >}}
```

## Development

### Testing the Theme

1. Navigate to the example site:
```bash
cd themes/xbar-hugo/exampleSite
```

2. Run Hugo server:
```bash
hugo server --themesDir ../../
```

### Customization

The theme uses CSS custom properties for easy customization:

```css
:root {
  --ink: #001524;      /* Primary text */
  --navy: #15616D;     /* Primary accent */
  --orange: #FF7D00;   /* CTAs and active states */
  --info: #475569;     /* Secondary text */
}
```

## Migration from Static Site

If you're migrating from a static XBAR site:

1. **Homepage**: Content automatically uses existing design
2. **Applets**: Place built React apps in `static/apps/`
3. **Styling**: Theme maintains identical visual appearance
4. **Navigation**: Automatically generated from site structure

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with CSS Grid support

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Test with the example site
4. Submit a pull request

## Support

- 📚 [Hugo Documentation](https://gohugo.io/documentation/)
- 📖 [Blogdown Book](https://bookdown.org/yihui/blogdown/)
- 🐛 [Issues](https://github.com/Songyosr/xbar/issues)