# Migration Agent Instructions

## Objective
Migrate the current site to a Hugo blogdown site deployed to GitHub Pages, while hosting interactive applets in a separate repo and embedding them via iframes. Keep writing simple in RStudio (blogdown) and keep the XBAR visual style.

## Topology
- Main site (this repo): `https://<user>.github.io/xbar/` (Hugo + blogdown + theme).
- Applets repo: `xbar-apps` → `https://<user>.github.io/xbar-apps/apps/<applet>/` (static applets).
- Social link: `https://github.com/Songyosr/xbar`.

## Deliverables (v1)
- Theme scaffold `themes/xbar-hugo/` with header (Blog, Apps) and footer (social).
- Home with two blocks: Latest Posts, Featured Apps.
- Apps listing page and a CLT app page that embeds an iframe.
- CLT app migrated to `xbar-apps/apps/central-limit-theorem/` and publicly reachable.
- CI for both repos deploying to `gh-pages` on push to `main`.

## Repo Structures
- xbar (blog):
  - `themes/xbar-hugo/` (layouts, partials, CSS tokens from `xbar_style_guide.md`).
  - `content/posts/` (Markdown/Rmd via blogdown).
  - `content/apps/_index.md`, `content/apps/central-limit-theorem/index.md`.
  - `shortcodes/iframe.html` for responsive embeds.
  - `config.yaml` with `baseURL: https://<user>.github.io/xbar`.
- xbar-apps (applets):
  - `apps/central-limit-theorem/` (copied from `public/apps/...`).
  - `shared/` (copied from `public/shared/`).

## CI/CD Summary
- xbar: Setup R + Hugo, `blogdown::build_site()`, deploy `public/` → `gh-pages`.
- xbar-apps: Static deploy of repo root (or `dist/` if builds later) → `gh-pages`.

## Embedding Rules
- Use absolute URLs in iframe: `https://<user>.github.io/xbar-apps/apps/<applet>/`.
- Provide “Open full screen” and “Back to Apps” links on app pages.

## Verification
- Local: `blogdown::serve_site()`; confirm header/footer visible around iframe.
- Remote: Both Pages URLs load; CLT works embedded and in full screen.

## Definition of Done (v1)
- CLT iframe renders within the themed page; navigation back to Apps works; both repos deploy on push.
