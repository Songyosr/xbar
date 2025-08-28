
# Repository Guidelines

## Project Structure & Module Organization

### Main Site (Hugo/Blogdown)
- `content/`: Markdown/R Markdown source files
  - `content/_index.md`: Homepage content (dynamic)
  - `content/posts/`: Blog posts (supports .Rmd)
  - `content/apps/`: App description pages
- `themes/xbar-hugo/`: Custom Hugo theme with XBAR design
  - `layouts/`: Page templates (index, single, apps)
  - `static/css/`: Theme CSS files
  - `shortcodes/applet.html`: Flexible applet embedding
- `hugo_public/`: Generated static site (Hugo output)
- `config.yaml`: Hugo configuration

### Legacy Assets
- `public/`: Original static assets (legacy)
- `xbar/`: React (CRA) shell (legacy development)
- `stat_app/`: Early prototypes (R/TSX)

### External Dependencies  
- **xbar-apps repository**: Standalone interactive applets for iframe embedding
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy
- `xbar_style_guide.md`: Visual/UX tokens and CSS guidance

## Build, Test, and Development Commands

### Blogdown/Hugo Site (Main Development)
- **R**: `blogdown::serve_site()` - Start local Hugo development server (recommended)
- **Hugo**: `hugo server -D -F` - Alternative local development server
- **Build**: `blogdown::build_site()` - Generate static site to `hugo_public/`
- **Deploy**: GitHub Actions builds from `hugo_public/` to GitHub Pages

### Legacy React Development (if needed)
- `npm run dev`: Start CRA shell in `xbar/` for local development
- `npm run build`: Build CRA (`xbar/build`)
- Tests: `cd xbar && npm test` (CRA + Testing Library)

### Standalone Applets (xbar-apps repository)
- **Serve**: `python3 -m http.server 8080` in `xbar-apps/` for testing
- **Deploy**: Separate GitHub Pages deployment from xbar-apps repository

## Coding Style & Naming Conventions

### Blogdown/Hugo Content
- **Markdown**: Use `.md` for static content, `.Rmd` for R code integration
- **Frontmatter**: YAML format for metadata (title, summary, date, etc.)
- **Naming**: kebab-case for file/folder names (`my-blog-post.Rmd`)
- **Applet Embedding**: Use `{{< applet src="URL" >}}` shortcode for flexibility

### Theme Development  
- **CSS**: Prefer CSS variables defined in `themes/xbar-hugo/static/css/main.css`
- **Templates**: Hugo template syntax, avoid inline styles where possible
- **Responsive**: Mobile-first design with breakpoints

### Legacy Code (when needed)
- **Formatting**: Prettier (`.prettierrc`) + `.editorconfig` (2 spaces, LF, UTF‑8)
- **JS/TS**: camelCase variables; PascalCase React components  
- **Linting**: CRA ESLint in `xbar/` (extends `react-app` and `react-app/jest`)

### External Applets
- **Repository**: Separate `xbar-apps` repository for standalone applets
- **URLs**: Deploy to `https://user.github.io/xbar-apps/apps/<applet-name>/`

## Testing Guidelines

### Blogdown/Hugo Testing
- **Local Development**: Use `blogdown::serve_site()` for live preview
- **Build Testing**: Run `blogdown::build_site()` to test static generation
- **Content Validation**: Check Hugo templates render markdown correctly
- **Applet Integration**: Test `{{< applet >}}` shortcode functionality

### Legacy React Testing (if needed)
- **Framework**: React Testing Library + Jest via CRA (`xbar/`)
- **Location**: Place tests next to source (e.g., `App.test.js`)
- **Running**: `cd xbar && npm test` (watch mode) or `CI=true npm test` for CI

### Cross-Platform Testing
- **Browsers**: Test iframe embedding across different browsers
- **Mobile**: Ensure responsive design works on mobile devices
- **R Markdown**: Verify R code execution and output rendering

## Commit & Pull Request Guidelines

- Branches: `feat/<name>`, `fix/<name>`, `exp/<name>`, `dev/<topic>` (see README).
- Commits: Imperative, concise subject (≤72 chars). Example: `feat(clt): add particle avoidance`.
- PRs: Include description, linked issues, before/after screenshots or GIFs for UI, and steps to validate (`npm run dev` or `npm run serve`).
- CI: GitHub Actions builds on PRs; merges to `main` deploy to Pages. Ensure `npm run build` and tests pass locally.

## Security & Configuration Tips

- Do not commit secrets; Pages uses `GITHUB_TOKEN` only.
- Keep large media out of Git; host externally if needed.
- Validate external links/assets used by `public/` applets.
