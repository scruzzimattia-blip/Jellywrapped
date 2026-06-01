# Contributing to Jellyfin Wrapped

Thanks for taking the time to contribute! Here's everything you need to get started.

---

## Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22 (see `.nvmrc`) |
| npm | ships with Node 22 |

---

## Local development

```bash
# 1. Clone and install
git clone https://github.com/scruzzimattia-blip/Jellywrapped.git
cd Jellywrapped
npm install

# 2. Create a local env file
cp .env.example .env
# Edit .env and fill in your Jellyfin / Tracearr URLs

# 3. Start the dev server
npm run dev          # http://localhost:5173

# 4. Lint and build
npm run lint
npm run build
```

---

## Contribution workflow

1. **Open an issue first** for anything non-trivial (new features, architectural changes). This
   avoids wasted effort if the direction doesn't align.
2. **Fork** the repo and create a branch from `main`:
   ```
   git checkout -b feat/my-feature
   ```
3. Make your changes, keeping commits focused and descriptive. Follow [Conventional Commits](https://www.conventionalcommits.org/) loosely — e.g. `fix:`, `feat:`, `chore:`, `docs:`.
4. Ensure `npm run lint` and `npm run build` pass before opening a PR.
5. **Open a pull request** against `main`. Fill in the PR template.

---

## Code style

- TypeScript strict mode — avoid `any`, prefer explicit types.
- React functional components with hooks only.
- Tailwind utility classes for styling; extend `@theme` in `src/index.css` for new design tokens.
- Keep API calls in `src/api/`, pure data transforms in `src/lib/`, reusable UI in `src/components/`.

---

## Reporting bugs

Use the **Bug report** issue template. Include your browser, Jellyfin version, and whether Tracearr is configured.

---

## Questions?

Open a [GitHub Discussion](https://github.com/scruzzimattia-blip/Jellywrapped/discussions) or email [scruzzimattia@gmail.com](mailto:scruzzimattia@gmail.com).
