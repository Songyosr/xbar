# Repository Guidelines

## Project Structure & Module Organization
- `public/`: Deployed static site and applets.
  - `public/apps/central-limit-theorem/`: CLT applet.
  - `public/shared/`: Shared JS/CSS (tokens, engine, utilities).
- `xbar/`: React (CRA) shell used for building and hosting assets.
- `themes/`: Site/theme assets.
- `stat_app/`: Early prototypes (R/TSX).
- `.github/workflows/deploy.yml`: GitHub Pages build/deploy.
- `xbar_style_guide.md`: Visual/UX tokens and CSS guidance.

## Build, Test, and Development Commands
- `npm run dev`: Start CRA shell in `xbar/` for local development.
- `npm run serve`: Serve `public/` at `http://localhost:8000` (static applets).
- `npm run build`: Build CRA (`xbar/build`) and copy `public/` into the build.
- `npm run deploy`: Publish `xbar/build` to GitHub Pages.
- Tests: `cd xbar && npm test` (CRA + Testing Library).

## Coding Style & Naming Conventions
- Formatting: Prettier (`.prettierrc`) + `.editorconfig` (2 spaces, LF, UTF‑8).
- Linting: CRA ESLint in `xbar/` (extends `react-app` and `react-app/jest`).
- JS/TS: camelCase variables; PascalCase React components; kebab-case files in `public/` when not React.
- CSS: Prefer tokens and variables defined in `xbar_style_guide.md` and `public/shared/*.css`; avoid inline styles.
- Paths/URLs: Keep applets under `public/apps/<applet-name>/`.

## Testing Guidelines
- Framework: React Testing Library + Jest via CRA (`xbar/`).
- Location: Place tests next to source (e.g., `App.test.js`).
- Scope: Add tests for new UI logic and utilities; keep existing tests passing.
- Running: `cd xbar && npm test` (watch mode) or `CI=true npm test` for CI-like runs.

## Commit & Pull Request Guidelines
- Branches: `feat/<name>`, `fix/<name>`, `exp/<name>`, `dev/<topic>` (see README).
- Commits: Imperative, concise subject (≤72 chars). Example: `feat(clt): add particle avoidance`.
- PRs: Include description, linked issues, before/after screenshots or GIFs for UI, and steps to validate (`npm run dev` or `npm run serve`).
- CI: GitHub Actions builds on PRs; merges to `main` deploy to Pages. Ensure `npm run build` and tests pass locally.

## Security & Configuration Tips
- Do not commit secrets; Pages uses `GITHUB_TOKEN` only.
- Keep large media out of Git; host externally if needed.
- Validate external links/assets used by `public/` applets.
