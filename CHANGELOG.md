# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) once a public release is cut. Pre-release work is tracked under `[Unreleased]` and grouped by Phase / Unit per `MASTER_PROMPT.md` §12.

## [Unreleased]

### Phase 0 — Foundation

#### Unit 0.0 — Repo bootstrap

- Added `README.md` (project intro + reading order for contributors).
- Added `CHANGELOG.md` (this file).
- Added `OPEN_QUESTIONS.md` seeded with Q1–Q9 from `MASTER_PROMPT.md` §17 and Q10–Q13 surfaced during the Unit 0.0 THINK stage.
- Added `.gitignore` (Node / Next.js / Playwright / Storybook / Turbo / Vercel / common editor folders).
- Added `.editorconfig` (2-space, UTF-8, LF, trim trailing whitespace, final newline).
- Added `docs/thinking/0.0-repo-bootstrap.md` (THINK artifact).
- Renamed `OpenProblems_MASTER_PROMPT.md` → `MASTER_PROMPT.md` to match the doc's self-references and Appendix A.

#### Unit 0.1 — Initial ADRs (0001–0005)

- Added `docs/adr/README.md` with MADR convention, numbering rule, status lifecycle, and index.
- Added ADR-0001 — Next.js 15 App Router as the application framework.
- Added ADR-0002 — Velite for the MDX content pipeline.
- Added ADR-0003 — Zod 4 as the schema source of truth.
- Added ADR-0004 — File-first storage; no database through Phase 3.
- Added ADR-0005 — Rating-action immutability.
- Added `docs/thinking/0.1-adrs.md` (THINK artifact).
- All five ADRs landed in `accepted` status following same-day human sign-off (`Date accepted: 2026-05-14`).
- Resolved `OPEN_QUESTIONS.md` Q12 (package manager): **pnpm**.

#### Unit 0.2 — Next.js 15 + React 19 + TypeScript strict scaffold

- Installed `next@15.5.18`, `react@19.2.6`, `react-dom@19.2.6`, `typescript@5.9.3`, plus matching `@types/node@22`, `@types/react@19`, `@types/react-dom@19` via pnpm 11.1.2.
- Added `package.json` with scripts `dev` / `build` / `start` / `typecheck`; `engines.node = ">=22 <24"`; `packageManager = "pnpm@11.1.2"`.
- Added `tsconfig.json` with TypeScript strict mode plus `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` (per MASTER_PROMPT.md §14.1), `@/*` path alias, `moduleResolution: bundler`, Next.js plugin.
- Added `next.config.ts` (TS-typed); React strict mode on; Next's bundled ESLint disabled in build (Unit 0.8 owns lint); TS errors fail the build.
- Added minimal App Router stub: `app/layout.tsx` (root layout + metadata), `app/page.tsx` (RSC-only placeholder), `app/globals.css` (CSS reset + two-tone foundation, no Tailwind yet — Unit 0.3 owns that).
- Added `.nvmrc` pinning Node 22.
- Added `pnpm-workspace.yaml` with `allowBuilds.sharp: true` (pnpm 10+ canonical project-level config; required to silence ERR_PNPM_IGNORED_BUILDS and let sharp fetch its native binary for `next/image` optimization).
- Committed `pnpm-lock.yaml` for reproducibility.
- Added `docs/thinking/0.2-nextjs-scaffold.md` (THINK artifact).
- Smoke tests green: `pnpm typecheck` passes, `pnpm build` produces 4 static prerendered pages (`/`, `/_not-found`, framework routes); home page ships 123 B of route code on top of 102 kB shared framework chunks (RSC-only).
- Surfaced two new open questions: Q14 (React Compiler opt-in timing) and Q15 (Node version pin policy).

#### Unit 0.3 — Styling primitives: Tailwind v4, shadcn/ui, fonts

- Installed `tailwindcss@4.3.0`, `@tailwindcss/postcss@4.3.0`, `postcss@8.5.14`. v4 is CSS-first (no `tailwind.config.ts` required); `postcss.config.mjs` wires `@tailwindcss/postcss`.
- Installed shadcn/ui runtime deps directly: `clsx@2.1.1`, `tailwind-merge@3.6.0`, `class-variance-authority@0.7.1`, `lucide-react@1.14.0`. Authored `components.json` and `lib/utils.ts` (the `cn` helper) manually — `pnpm dlx shadcn@latest init` is interactive and provided no flags for a clean non-interactive install at this version.
- Loaded Inter (UI), Source Serif 4 (body), and JetBrains Mono (code) via `next/font/google` as variable fonts. Each exposes a CSS variable (`--font-inter`, `--font-source-serif`, `--font-jetbrains-mono`) wired into `app/layout.tsx` and aliased to Tailwind theme tokens (`--font-sans`, `--font-serif`, `--font-mono`) in `app/globals.css`.
- `app/globals.css`: `@import "tailwindcss"` + `@theme inline` block defining color and font tokens via CSS variables; shadcn-flavored neutral palette as a Unit 0.4 placeholder (OKLCH values; will be replaced with the project's two-tone foundation and brand-accent in Unit 0.4). Added `prefers-reduced-motion` guard.
- `app/page.tsx`: end-to-end pipeline test — serif heading via `font-serif`, mono caption via `font-mono`, muted-foreground utility via shadcn token alias.
- `next/font/google` resolves font files at build time and self-hosts them — no third-party font requests at runtime.
- Smoke tests green: `pnpm typecheck` passes, `pnpm build` clean (102 kB First Load JS, unchanged from Unit 0.2 — fonts inline locally without bundle bloat).
- Surfaced Q16 (font subset — `latin` for now, `latin-ext` when content with diacritics arrives) and Q17 (shadcn base color — `neutral` placeholder).

#### Unit 0.4 — Design tokens

- Replaced Unit 0.3's shadcn-neutral placeholder palette with the project's two-tone foundation per MASTER_PROMPT §10.1: `#FAFAF7` paper-white / `#0B0D10` near-black, encoded in OKLCH for clean light↔dark interpolation. Light and dark are declared independently (not a tinted invert — §10.1's "true second design" rule).
- Brand accent landed as a **deep-cyan placeholder** (`oklch(0.55 0.12 215)` light, `oklch(0.70 0.14 215)` dark). OPEN_QUESTIONS Q5 (vermilion vs deep cyan) is unresolved; flipping to vermilion is a single-line edit on `--accent` and `--ring` in both light and dark blocks. Picked cyan as the more defensible default for §10.1's "academic-industrial" register and because cyan separates well from the warm chart hues 3 and 5.
- Added the five rating-dimension chart hues (Difficulty, Saturation, Urgency, Value, Industry Call) as `--chart-difficulty` … `--chart-industry-call`. Each is ≥ 50° hue-separated; light variants meet WCAG AA contrast against `--background`; dark variants lifted ~0.15 in lightness to preserve AA-equivalent contrast on the inverted background. Aliased into Tailwind's `bg-chart-1`…`bg-chart-5` utilities via `@theme inline`.
- Added motion tokens per §10.1 ("subtle, 150 ms ease, no bouncing"): `--ease-out`, `--ease-in-out`, `--duration-instant`/`-fast`/`-base`/`-slow` (50/100/150/250 ms). The Unit 0.3 `prefers-reduced-motion` guard remains and overrides these.
- Added a five-dimension legend on `app/page.tsx` to validate the token wiring end-to-end (rating dimensions render as `bg-chart-N` swatches with semantic labels).
- Smoke tests green: `pnpm typecheck` passes, `pnpm build` clean (still 102 kB First Load JS; tokens are pure CSS).
- THINK artifact: `docs/thinking/0.4-design-tokens.md`. No new open questions surfaced (Q5 placeholder is documented; not a blocker).

#### Unit 0.5 — Zod schemas (lib/schemas/)

- Installed `zod@4.4.3` (ADR-0003) and `vitest@4.1.6` (the test runner subset of Unit 0.9 — Playwright, Storybook, and Lighthouse-CI still belong to 0.9).
- Authored 8 Zod schemas in `lib/schemas/`, one entity per file per §14.1 (no barrels): `taxonomy.ts` (Taxonomy + Domain + Subdomain), `benchmark.ts`, `problem.ts` (OpenProblem + ExternalLinks + Editorial + ProblemStatus), `rating-action.ts` (with the five dimensions strictly required — every action is a complete snapshot per ADR-0005), `paper.ts` (Paper + Contribution), `entry.ts` (LeaderboardEntry), `author.ts` (with ORCID regex), `institution.ts` (with ROR id regex). Shared `_primitives.ts` exposes `slug` (kebab-case `[a-z0-9-]+`) and `isoDate` (`YYYY-MM-DD`).
- `TaxonomySchema` enforces per-domain subdomain uniqueness but allows cross-domain id collisions (resolves the design intent of OPEN_QUESTIONS Q11 at the schema layer; the validate-content script in Unit 0.7 will additionally verify `Problem.subdomain` exists under `Problem.domain`).
- `posed_year` and `Paper.year` use a runtime refinement against `new Date().getFullYear()` rather than a static upper bound — the "future year" check stays correct over the project lifetime.
- 41 tests across 8 files, all passing in 471 ms. Each schema has ≥ 3 tests (valid / invalid / edge) per §14.2.
- Added `vitest.config.ts` with the `@/*` alias matching `tsconfig.json`. `pnpm test` and `pnpm test:watch` scripts added.
- Smoke tests green: `pnpm typecheck` / `pnpm build` clean. Schemas don't bloat the client bundle (server-only).
- Surfaced Q18 (saturation N/A encoding) for a future Phase-3 ADR.

#### Unit 0.6 — content/taxonomy.yaml

- Authored `content/taxonomy.yaml` with all 8 top-level domains and their subdomains from MASTER_PROMPT §4. Short-form lists from the master prompt (general-ml, optimization, probabilistic-methods, reinforcement-learning, theory, social-aspects) expanded to full `{ id, title }` form for consistency with the schema and editor-friendly diffs.
- Confirmed cross-domain id collisions explicitly: `robustness` under both `deep-learning` and `social-aspects`; `representation-learning` under both `deep-learning` and `general-ml`; `theory` as both a top-level domain id and a `deep-learning` subdomain id. URL strategy is domain-scoped (`/domains/[domain]/[subdomain]`), so this is by design (OPEN_QUESTIONS Q11).
- Added `lib/content/load-taxonomy.ts` — a thin async helper that reads, parses (via `yaml@2.9.0`, new devDep), and validates against `TaxonomySchema`. Used by tests in this unit; will be reused by the validate-content script (Unit 0.7) and by taxonomy-rendering routes (Unit 0.10).
- Added `lib/content/load-taxonomy.test.ts` (4 tests): file parses + validates, 8 domains in §4 order, every domain has ≥ 1 subdomain, expected cross-domain id collisions are present.
- 45 tests across 9 files now passing in 594 ms. `pnpm typecheck` and `pnpm build` clean.

#### Unit 0.7 — scripts/validate-content.ts

- Added `lib/content/validate.ts`: walks `content/` and validates every YAML / JSON file against the matching Zod schema from Unit 0.5. Returns a structured `{ filesChecked, errors }` result; each error carries `file`, `schema`, and a list of `{ path, message }` issues. Includes one cross-document FK check: `Problem.domain` and `Problem.subdomain` must exist in `content/taxonomy.yaml`. Other cross-FK validation (rating-action → problem, paper.contributions → benchmark, etc.) is deferred to Phase 2's separate `scripts/cross-link-audit.ts`.
- Added `scripts/validate-content.ts`: thin CLI wrapper that calls `validateContent(process.cwd()/content)`, prints results, exits 0/1. Wired as `pnpm validate-content` (uses `tsx@4.21.0`, new devDep, to run the `.ts` file directly).
- Added `test/fixtures/content-valid/` and `test/fixtures/content-invalid/` (duplicate domain id) so the validator can be Vitest-tested on happy and sad paths in addition to the real `content/`.
- `lib/content/validate.test.ts` (4 tests): valid fixture → 0 errors, invalid fixture → ≥ 1 error pointing at `Taxonomy`, real `content/` → 0 errors, tolerant of missing optional subdirs.
- 49 tests across 10 files green in 630 ms. `pnpm validate-content` on this repo reports "✓ 1 content file(s) validated against schemas."
- One Zod 4 typing wrinkle: `issue.path` is `PropertyKey[]` (includes `symbol`), not `(string|number)[]`; the `pushIssues` helper accepts the wider type and coerces with `.map(String)`.
- `esbuild` postinstall (pulled in by `tsx`) added to `pnpm-workspace.yaml#allowBuilds` (same `pnpm approve-builds --all` flow we hit for `sharp` in Unit 0.2).

#### Unit 0.8 — Lint, format, git hooks, ADR-0005 enforcement

- **ESLint 9 flat config** (`eslint.config.mjs`) with `typescript-eslint`, `eslint-plugin-jsx-a11y`, and `eslint-config-prettier`. `js.configs.recommended` + `tseslint.configs.recommended` + `jsxA11y.flatConfigs.recommended` + prettier last. Per-area rule overrides: tests relax unsafe-any rules; `scripts/**` plus root `.mjs` files get Node globals via `globals.node` and allow `console`. Bumped from ESLint 10 → 9 because `eslint-plugin-import` (transitive dep of `eslint-config-next`) calls `scopeManager.addGlobals` which the 10.x scope manager dropped — surfaces as a separate question for re-enabling Next-specific rules once that lands.
- **Prettier 3** (`prettier.config.mjs`): `endOfLine: "lf"`, `printWidth: 100`, double quotes, trailing commas, `proseWrap: "preserve"`, `prettier-plugin-tailwindcss` for class-order. Prettier owns formatting; ESLint owns correctness; `eslint-config-prettier` disables conflicting stylistic rules. Ran one-shot `pnpm format` to normalize the existing tree.
- **Husky 9** initialized (`prepare: husky`). `.husky/pre-commit` runs three gates in order: (1) `node scripts/check-rating-action-immutability.mjs` (ADR-0005 enforcement — refuses commits that touch existing `content/problems/*/ratings/*.yaml` via `git diff --cached --name-status` for `M`/`D`/`R`/`C`; only `A` net-new files pass); (2) `pnpm exec lint-staged`; (3) `pnpm test`. `.husky/commit-msg` runs `pnpm exec commitlint --edit "$1"`.
- **lint-staged** (config block in `package.json`): TS/JS files → `eslint --fix && prettier --write`; JSON / YAML / Markdown / CSS → `prettier --write`.
- **commitlint** (`commitlint.config.mjs`) extends `@commitlint/config-conventional`. Conventional Commits enforced locally; Unit 0.11 mirrors this in CI.
- New scripts in `package.json`: `lint`, `lint:fix`, `format`, `format:check`, `prepare`.
- All Phase 0 gates green together: `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm validate-content`. 49 tests across 10 files in 680 ms.
- Surfaced two open questions: Q19-style note about ESLint 10 + `eslint-config-next` regression (re-enable Next-specific rules once upstream stabilizes) and a corresponding ADR-0005 hook edge case around git rename detection (treats `R`/`C` as forbidden alongside `M`/`D`).

#### Unit 0.9 — Playwright, Storybook 10, Lighthouse CI

- Installed `@playwright/test@1.60` with `playwright.config.ts`: spec dir `e2e/`, chromium project, webServer boots `pnpm build && pnpm start` so e2e + Lighthouse share the production surface.
- `e2e/smoke.spec.ts`: home renders the project title and the five rating-dimension labels.
- Installed `@lhci/cli@0.15` with `lighthouserc.json`: desktop preset, 3 runs against `pnpm start`, assertions perf / a11y / SEO ≥ 0.95 (error), best-practices ≥ 0.95 (warn).
- Installed `storybook@10.3` + `@storybook/nextjs-vite@10.3` + `@storybook/addon-a11y` + `@storybook/addon-docs`. `.storybook/main.ts` globs stories from `components/**` and `app/**`; `.storybook/preview.ts` imports `app/globals.css` for tokens + fonts and registers `paper` / `ink` background swatches. `.storybook/Introduction.mdx` documents the stories-co-located convention.
- `vitest.config.ts` extended to a two-project config: the existing `**/*.test.ts` unit suite (49 passing) plus a Storybook stories-as-Vitest-browser-tests project via `@storybook/addon-vitest` + `@vitest/browser-playwright`. Currently no stories → no extra tests; Phase 1 components will populate it. `vitest.shims.d.ts` types `@vitest/browser-playwright`.
- New scripts: `test:e2e`, `test:e2e:install`, `lhci`, `storybook`, `build-storybook`.
- Surfaced Q23 (Vite vs Webpack — resolved in favor of Vite via `@storybook/nextjs-vite`) and Q24 (Storybook init timing — landed in Phase 0 after all).

#### Unit 0.10 — App Router stub IA for every §9 route

- Every URL from MASTER_PROMPT §9 is now a buildable Next.js App Router stub. 19 page routes + 4 API routes; the `next build` summary lists all 23 routes (10 static prerendered, 13 server-rendered on demand for dynamic / API paths). Home page route code 165 B; every other page 177 B; First Load JS = 103 kB.
- Added `components/ui/stub-page.tsx`: shared `<StubPage title description? phase?>` renderer that every page route uses. One h1 + an optional description + a "Phase N content pending" tail line.
- Added `lib/api/stub.ts`: `stubJsonResponse(endpoint)` returns HTTP 501 with `{ endpoint, status: "not-implemented", phase: 0, message }`. Every `/api/v1/*` GET handler is a one-line call to it.
- `/api/v1/rss.xml` returns a minimal valid RSS 2.0 feed with a placeholder item (W3C feed validator passes).
- `/methodology/v[N]` encoded as `app/methodology/[version]/page.tsx` (param is the literal `v1` / `v1.0` / …; alternatives documented in OPEN_QUESTIONS Q20-style note in the THINK doc).
- Home page (`app/page.tsx`) grew a "Routes" nav section linking to every top-level section, so Phase 0 reviewers (and future Playwright crawl tests) can discover the IA from `/`.
- All dynamic-segment pages use `params: Promise<{ ... }>` per the Next 15 async-params convention.
- Surfaced Q25 (API envelope shape) and Q26 (per-segment `not-found.tsx` strategy).
- Smoke gates all green: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` (49/49), `pnpm validate-content`, `pnpm build`.

#### Unit 0.11 — GitHub Actions CI + PR template

- `.github/workflows/ci.yml` — fast-path CI on `pull_request` and `push` to `main`. Single `verify` job runs (in order): checkout (full history), pnpm + Node 22 setup with pnpm cache, `HUSKY=0 pnpm install --frozen-lockfile`, then the six gates `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm validate-content`, `pnpm build`, plus the ADR-0005 base-branch immutability check (PR events only).
- `.github/workflows/e2e-lighthouse.yml` — slow-path with two parallel jobs: Playwright e2e (caches `~/.cache/ms-playwright` keyed on the pnpm lockfile, downloads chromium with `--with-deps`, uploads the HTML report on failure) and Lighthouse CI (`pnpm build && pnpm lhci`). Both marked `continue-on-error: true` in Phase 0; Q27 covers the cutover to required at Phase 1.
- `.github/pull_request_template.md` mirroring §14.4: schemas validated, ADR if architectural, CHANGELOG, tests, Lighthouse delta, OPEN_QUESTIONS updated, ADR-0005 rule for rating actions.
- `scripts/check-rating-action-immutability-ci.mjs` — Layer-3 CI variant of the local pre-commit script. Takes a base ref (e.g., `origin/main`) and compares the PR head to it via `git diff --name-status base...HEAD`, blocking any M/D/R/C against `content/problems/*/ratings/`.
- Added `docs/thinking/**` to `.prettierignore` after Prettier reinterpreted `MASTER_PROMPT.md` as italic emphasis (`_..._`) inside THINK docs and mangled it on reformat. ADRs were already excluded for the same reason.
- Surfaced Q27 (e2e + Lighthouse advisory → required at Phase 1 kickoff) and Q28 (GitHub branch-protection rules — out-of-code, set at first push to GitHub during Unit 0.12).

#### Unit 0.12 — Phase 0 acceptance gate

- Verified the local half of the §13 acceptance gate: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` (49/49 across 10 files), `pnpm validate-content` (1 file), `pnpm build` (23 routes — 8 static, 15 dynamic; home route code 165 B on top of 103 kB shared framework chunks).
- Two gates remain external and trigger automatically on first GitHub push: (a) Vercel preview deploy renders the stub landing; (b) Lighthouse CI runs and asserts perf / a11y / SEO ≥ 0.95 on `/`. Both are wired in `.github/workflows/e2e-lighthouse.yml` (Unit 0.11) and `lighthouserc.json` (Unit 0.9).
- README updated to reflect Phase 0 closeout and Phase 1 readiness; preserves the §13 phased rhythm and points new contributors to the same reading order.
- Phase 0 closed across 12 units / 12 commits: `0eb5b70` → `a3db1f2`. Five accepted ADRs (0001–0005). ~28 OPEN_QUESTIONS surfaced (Q1–Q9 from §17 plus Q10–Q28); Q12 and Q13 resolved.
- Handoff items (user-action): (1) push to GitHub, (2) connect Vercel, (3) configure branch protection requiring the `verify` job. None of these can be performed from the local session.
- THINK artifact: `docs/thinking/0.12-phase-0-acceptance.md` (incl. the OPEN_QUESTIONS triage for Phase 1 blockers).

### Phase 1 — Core MVP

#### Unit 1.0 — Phase 1 prep (license, brand, accent)

- Resolved three OPEN_QUESTIONS items that Unit 0.12's triage flagged as Phase-1-blocking:
  - **Q1 — Brand name:** confirmed **LLM OpenProblems** (working title stands).
  - **Q4 — License:** **Apache-2.0** for code (explicit patent grant; defensible for a project intending a citable methodology paper) + **CC-BY-4.0** for `content/` (standard for academic-adjacent published content).
  - **Q5 — Brand accent:** **deep cyan in the "HKU green" register**, OKLCH hue 170° (between pure cyan ~195° and pure green ~145°). Replaces the Unit 0.4 placeholder at hue 215°.
- Added `LICENSE` (full Apache-2.0 text) at repo root; `content/LICENSE.md` (CC-BY-4.0 scope + canonical-text pointer + recommended citation). `package.json#license = "Apache-2.0"` (SPDX). README license section updated.
- `app/globals.css` accent values updated in light + dark blocks: `--accent`/`--ring` shifted to `oklch(0.5 0.1 170)` light / `oklch(0.7 0.13 170)` dark. `--chart-saturation` nudged from hue 160° → 140° in both blocks to preserve ≥ 30° hue separation from the new accent (otherwise chart-2 and the UI accent would be within 10° of each other).
- WCAG AA preserved: accent on background ≈ 4.7:1 light / ≈ 5.0:1 dark (≥ 4.5:1 floor); chart-2 contrast unchanged in magnitude.
- THINK artifact: `docs/thinking/1.0-phase-1-prep.md`. Smoke gates green: `pnpm typecheck`, `pnpm build` (still 103 kB First Load JS, 23 routes — no functional change, only token + license metadata).

#### Unit 1.1 — Velite content pipeline (ADR-0002)

- Installed `velite@0.3.1` as a devDep. `velite.config.ts` at repo root defines one collection — `taxonomy` (single-file YAML against `content/taxonomy.yaml`) — and produces `.velite/{index.js, index.d.ts, taxonomy.json}` on every `pnpm velite` / `pnpm build` / `pnpm dev`.
- Build chain updated: `"build": "velite && next build"` and `"dev": "velite && next dev"`. Standalone scripts: `pnpm velite`, `pnpm velite:watch`. Velite runs in 50–60 ms on the current 1-file content tree.
- `tsconfig.json` paths: added `"#site/content"` → `./.velite` and `"#site/content/*"` → `./.velite/*`. `.velite/**/*` added to `include`. Convention: routes and components import via `import { taxonomy, ... } from "#site/content"` to avoid colliding with the canonical `@/*` source namespace.
- `.gitignore`: added `.velite/`.
- Smoke proof: migrated `app/domains/page.tsx` from a Phase 0 `<StubPage>` to a real list rendered from `#site/content` — 8 domains, each linking to `/domains/[id]` and showing subdomain count. Route stays statically prerendered (no client JS for the taxonomy data); First Load JS for `/domains` is 106 kB (+3 kB over the stub, from the inlined taxonomy.json embed and `next/link`). All other routes unchanged at 103 kB.
- **Velite + Zod 4 wrinkle.** Velite 0.3.x bundles Zod 3 internally and its runtime calls `schema._parse(...)`, which Zod 4 renamed. Passing the canonical schemas in `lib/schemas/*` directly to `defineCollection({ schema })` throws. Interim workaround: the taxonomy schema is duplicated in `velite.config.ts` using Velite's bundled `s` factory. Single-file duplication; cross-validated against the canonical Zod-4 schema by `scripts/validate-content.ts` (Unit 0.7), so drift surfaces in CI. Tracked as OPEN_QUESTIONS Q31 with the upstream-monitoring action item. Later content units (1.3 methodology, 1.4 first problem) extend `velite.config.ts` with their collections; the duplication remains contained until Velite ships Zod-4 support.
- New OPEN_QUESTIONS: Q29 (Velite MDX plugins — KaTeX + Shiki land in Unit 1.3, Mermaid deferred), Q30 (publishing the snapshot via `/api/v1/snapshot.json` — defer to Unit 1.10+), Q31 (Velite + Zod 4 — see above).
- THINK artifact: `docs/thinking/1.1-velite-pipeline.md`. Smoke gates green: `pnpm typecheck`, `pnpm test` (49/49), `pnpm validate-content` (1 file), `pnpm build` (23 routes).

#### Unit 1.2 — Dark-mode toggle (persisted)

- Installed `next-themes@0.4.6`. `<ThemeProvider>` (`components/theme-provider/`) wraps the root with `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`. `<html>` gets `suppressHydrationWarning` and the className list now flows through `cn(...)` again.
- `app/globals.css` activation swapped from `@media (prefers-color-scheme: dark) :root { ... }` to `.dark { ... }`. Same OKLCH values, same variable names — only the selector that activates them changed.
- Added `<ThemeToggle>` (`components/theme-toggle/`): three-state cycle button (`light → dark → system → light`) with lucide icons (`Sun`, `Moon`, `Monitor`). aria-label and tooltip reflect the *next* state. Renders a transparent placeholder of equal footprint before hydration so layout doesn't shift.
- Smoke proof: home page (`/`) gets `<ThemeToggle>` in the top-right of `<main>`. Will move to a global header in Unit 1.10.
- Bundle: `/` route went from 165 B → 11.7 kB (First Load JS 103 kB → 118 kB) because the toggle pulls in next-themes + tree-shaken lucide icons. Under the 180 kB Problem-detail budget; same bump amortises across every page once the toggle moves into the shared header.
- Closes OPEN_QUESTIONS Q18 (dark-mode activation mechanism — proposed in the Unit 0.4 THINK doc; never landed in OPEN_QUESTIONS.md). The decision: `next-themes` + `.dark` class, system-default with localStorage persistence.
- THINK artifact: `docs/thinking/1.2-dark-mode-toggle.md`. Smoke gates: `pnpm typecheck` clean, `pnpm build` clean (23 routes, /  bundle 118 kB).

#### Unit 1.3 — Methodology page (MDX + KaTeX + Shiki)

- Authored `content/methodology/v1.mdx` (~180 lines): the v1.0.0 rating methodology covering §8.1–§8.6 — first principles, the five dimensions (with the Difficulty grade table), the saturation formula in KaTeX, the composite formula and default weights, confidence + WATCH treatment, the rating-actions log, the COI policy, and the methodology-versioning SemVer rules.
- Wired the Velite MDX pipeline. New deps: `remark-math@6`, `rehype-katex@7`, `rehype-pretty-code@0.14`, `shiki@4`, `katex@0.16`. `velite.config.ts` gains the `methodology` collection with `s.mdx({ ... })` and `mdx.{remarkPlugins, rehypePlugins}` configured for math + code highlight. Default Shiki theme: `github-light` / `github-dark` (next-themes drives the class switch).
- `lib/mdx/mdx-content.tsx` — server component that takes a Velite-compiled MDX `code` string and renders it via `new Function(code)({ ...jsxRuntime })`. Reusable by Unit 1.4 problem MDX.
- `app/methodology/page.tsx` — sorts the collection by SemVer-aware comparator and renders the highest version. Header shows version, date, and links to every other version snapshot.
- `app/methodology/[version]/page.tsx` — `generateStaticParams` from the collection so every `v<X.Y.Z>` URL is statically built. `notFound()` on unknown versions.
- `app/layout.tsx` imports `katex/dist/katex.min.css` once so any MDX page rendering math gets correct typography.
- Closes Q29 (Velite MDX plugin set — KaTeX + Shiki in, Mermaid deferred until first content author asks). Opens Q32 (Shiki single vs dual theme — landed dual; revisit if it bites perf).
- Smoke gates green: Velite builds in ~840 ms (vs ~60 ms before MDX); `pnpm typecheck` / `pnpm validate-content` / `pnpm test` (49/49) / `pnpm build` all clean. `/methodology` is statically prerendered (106 kB First Load JS); `/methodology/v1.0.0` is SSG-prerendered (103 kB).
- THINK artifact: `docs/thinking/1.3-methodology-page.md`.

#### Unit 1.4 — First seed problem: `hallucination-reduction`

- Authored the first end-to-end §16 seed:
  - `content/problems/hallucination-reduction/problem.yaml` — `OpenProblem` for "Faithful & Calibrated Hallucination Reduction in LLMs"; `deep-learning / large-language-models`; status `open`; posed-year 2022; 4 benchmarks (HaluEval, TruthfulQA-2026, SimpleQA, FACTS Grounding) with `metric_direction` only — no scores yet (§15.6: don't invent numbers).
  - `background.mdx` / `definition.mdx` / `history.mdx` — three MDX prose files framing (a) the faithfulness / factuality / calibration distinction; (b) a working formal definition with KaTeX notation; (c) the 2020–2026 chronology, ending on the Yang et al. NeurIPS 2025 inverse-scaling finding.
  - `ratings/2026-05-14-initial.yaml` — editorial baseline rating action: **Difficulty A · Saturation 35 (`TODO(curate)` actual SOTA) · Urgency 5 · Value 5 · Industry Call 5**; confidence 0.55–0.80 per dimension; one-paragraph rationale per dimension. Lists the five signals weighed (Yang et al. 2025 inverse-scaling, HaluEval, TruthfulQA-2026, SimpleQA, FACTS Grounding, 2026 safety reports).
- Extended `velite.config.ts` with three new collections: `problems` (per-dir `problem.yaml`), `ratings` (per-dir `ratings/*.yaml`), `problemPages` (the three MDX files; transformed to `{ problem_slug, kind: "background"|"definition"|"history", body, title, summary }`). Same `s`-based duplication pattern as Unit 1.1 (Q31).
- Velite now emits `problems.json`, `ratings.json`, `problemPages.json` in `.velite/`. Build takes ~860 ms (≈unchanged from Unit 1.3 — MDX compilation dominates).
- Smoke gates green: `pnpm velite` clean; `pnpm validate-content` reports **3 content files** validated (was 1 — taxonomy + problem.yaml + rating); `pnpm typecheck`, `pnpm test` (49/49), `pnpm build` (23 routes) all clean.
- Opens Q33 (`<Cite paper="…">` component shape, deferred to Phase 2's citation system) and Q34 (`entries.json` for this seed, deferred to Phase 2 with first verified entries).
- The first rating-action file lands as net-new under `content/problems/*/ratings/` — the Unit 0.8 ADR-0005 pre-commit hook allows `A` (new) status; only `M`/`D`/`R` are blocked. Verifies the immutability-by-construction flow end-to-end.
- THINK artifact: `docs/thinking/1.4-first-seed-problem.md`.
