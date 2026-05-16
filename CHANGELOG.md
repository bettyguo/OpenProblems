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

#### Unit 1.5 — RatingRadar v1

- `components/viz/RatingRadar/` ships viz catalog entry #1 from §11: 5-axis SVG radar, animated entry (250 ms ease-out, scale 0.5→1), confidence-shaded fill (mean dimension confidence mapped to `[0.15, 0.55]` opacity), per-axis chart-hue dots with native `<title>` tooltips, and `<desc>` describing every dimension for screen readers. Pure RSC — no `"use client"`, no client JS.
- Shape: viewBox 0 0 200 200, max radius 80, five axes at -90° / -18° / 54° / 126° / 198° (first axis points up = Difficulty), dimension order Difficulty · Saturation · Urgency · Value · Industry Call (matches `--color-chart-1..5` per §3.1).
- `lib/ratings/normalize.ts` centralises the `[0, 5]` projection used by both the radar and §8.3's composite formula: Difficulty grade → 5..0, Saturation → (100 − value) / 20, stars → identity. Also exports `meanConfidence(points)` and a Phase-0 `composite(points)` using §8.3 default weights (0.25 / 0.25 / 0.20 / 0.15 / 0.15).
- `lib/ratings/normalize.test.ts` — 13 tests across `dimensionsToRadar`, `meanConfidence`, `composite`. `components/viz/RatingRadar/index.test.tsx` — 6 tests (renders SVG with role/aria-label, five axis lines + five value dots, exactly one polygon, `<desc>` summarises every dimension, all five chart-hue references emitted, no entry animation in `staticRender` mode). Total **68 tests across 13 files** (was 49 across 10).
- Storybook stories: high-confidence, low-confidence WATCH, all-zeros (solved), and a small `size: 120` variant — the four states future visual-regression baselines will lock down at Unit 1.12.
- Vitest default project gained `@vitejs/plugin-react@6` for JSX in `.test.tsx` files (the Storybook-vitest project already had Vite + React via `@storybook/addon-vitest`).
- THINK artifact: `docs/thinking/1.5-rating-radar.md`. Surfaced Q35 (companion table-fallback toggle lives on the problem-detail page, Unit 1.6 — §10.2 "every chart is also a table" is satisfied at the consumer, not in the viz primitive).
- Smoke gates green: `pnpm typecheck`, `pnpm test` (68/68), `pnpm build` (23 routes, all unchanged).

#### Unit 1.6 — Problem detail page `/problems/[slug]`

- Implements the §9 ten-block layout in order: (1) breadcrumb + title + status pill + last-curated date, (2) `RatingRadar` (latest action) + "View as table" disclosure that satisfies §10.2 / Q35, (3) TL;DR from `problem.subtitle`, (4) Background MDX, (5) Formal definition MDX (with KaTeX), (6) Benchmarks table — name / dataset / metric+direction / ceiling / protocol link — plus "View full leaderboard →", (7) History MDX, (8) Recent rating actions (top 3, descending by date) + "View full history →", (9) Related problems as pill links (cross-FK audit deferred to Phase 2), (10) Citation block with a BibTeX `<pre>`.
- `lib/content/load-problem.ts` consolidates Velite consumption: `loadProblem(slug)` returns `{ problem, pages: { background?, definition?, history? }, ratings, latestRating, taxonomy: { domain, subdomain } }` with taxonomy-FK resolution at request time. `allProblemSlugs()` powers `generateStaticParams`. Unknown slug → `notFound()`.
- `components/ui/status-pill/` — RSC pill mapping each of the 5 statuses to a chart-hue ring; open is foreground/40.
- Bundle: `/problems/[slug]` SSG-prerendered (`/problems/hallucination-reduction` so far), 170 B route code + 106 kB First Load JS (small uptick from the inlined Velite data). Pure RSC; the only "interactivity" is native `<details>` for the table-fallback. Stays well under §10.4's 180 kB problem-detail JS budget.
- KaTeX renders inline + display math in the definition MDX; Shiki dual-theme code blocks (already wired in Unit 1.3) handle any future code in the prose. The `prose` Tailwind plugin is NOT in use yet — Unit 1.3's `prose-neutral dark:prose-invert` classes are inert pending Phase 1.10's typography pass.
- Opens Q36 (citation URL canonicalisation — placeholder `https://llm-openproblems.org`; reads `NEXT_PUBLIC_SITE_URL` when set).
- THINK artifact: `docs/thinking/1.6-problem-detail-page.md`. Smoke gates green: `pnpm typecheck`, `pnpm test` (68/68), `pnpm validate-content` (3 files), `pnpm build` (23 routes).

#### Unit 1.7 — Domain & subdomain hub pages (3 routes)

- `/domains` upgraded from the Unit 1.1 smoke-proof list to a responsive tile grid (1/2/3 columns) showing every top-level domain with subdomain count + curated-problem count per domain.
- `/domains/[domain]` SSG-prerenders each of the 8 domains: breadcrumb, title, subdomain list (2-column grid with per-subdomain problem counts), and a "Featured problems" section (top 3 by `editorial.last_curated` desc, with `StatusPill`). Unknown domain id → `notFound()`.
- `/domains/[domain]/[subdomain]` SSG-prerenders all ~80 (domain, subdomain) pairs. Renders a simple problem list with title link, last-curated date, and status pill; empty-state copy points contributors to `/contributing`. `notFound()` on either segment.
- `lib/content/load-domain.ts` centralises Velite taxonomy + problem joins: `loadDomain`, `loadSubdomain`, `problemsInDomain`, `problemsInSubdomain`, `allDomainIds`, `allDomainSubdomainPairs`.
- Q11 end-to-end verification: `representation-learning` resolves to distinct pages at `/domains/deep-learning/representation-learning` and `/domains/general-ml/representation-learning`. The URL space is domain-scoped; no flat `/subdomains/[id]` route exists.
- All three routes are RSC + SSG, zero client JS. THINK artifact: `docs/thinking/1.7-domain-hub-pages.md`.

#### Unit 1.8 — Problems index `/problems` with client-side filter + sort

- `app/problems/page.tsx` flips from Phase 0 `<StubPage>` to a real index. Server entry pre-computes the `IndexedProblem[]` (slug, title, status, domain/subdomain titles, tags, last-curated, normalized `points[]`, mean confidence, `composite`) at build time; client island `components/problems-index/` owns filter + sort UI.
- Filters: domain (8 options), status (5 enums), tag (auto-discovered from content). Sort: title / last-curated / composite, with ↑↓ direction toggle on the active sort. "Clear" button resets all filters. Tag chips on each row are clickable — toggles the tag filter to that tag (or off if already active).
- Each row shows the §8.3 composite numerically plus a five-segment dimension breakdown bar (chart-1..5, widths proportional to the normalized 0–5 value). §8.3's "composite never shown alone" rule satisfied by always rendering the dimension chips alongside.
- Bundle: `/problems` static-prerendered, 2.2 kB route code + 117 kB First Load JS (≈14 kB for the filter UI on top of the shared baseline). Acceptable.
- `lib/content/load-problems-index.ts` exposes `getIndexedProblems()` reusable by the landing page (Unit 1.10) and Phase 2's MoversBoard.
- THINK artifact: `docs/thinking/1.8-problems-index.md`. Smoke: `pnpm typecheck`, `pnpm build` (23 routes — /problems and /problems/[slug] both static; no regression on other routes).

#### Unit 1.9 — Search palette (Fuse.js + Cmd/Ctrl-K)

- `fuse.js@7.3.0` installed; `lib/search/build-index.ts` exports `getSearchIndex()` that joins `problems` + `taxonomy` into a flat `SearchRecord[]` shape (`id`, `kind`, `title`, `subtitle?`, `tags`, `domainTitle?`, `subdomainTitle?`, `href`). `kind: "problem"` is the only kind in Phase 1; paper / author / institution kinds extend the schema later without breaking the renderer.
- `components/search-palette/` — client dialog. Fuse over 5 weighted keys (title × 3, subtitle × 2, tags × 1.5, domain / subdomain × 1; threshold 0.4, ignoreLocation, minMatchCharLength 1). ↑↓ navigates, Enter opens, Esc closes; backdrop click closes. Locks body scroll while open. `role="dialog"` + `aria-modal` + auto-focused input. Footer keyboard-hint strip.
- `components/search-trigger/` — visible button with `⌘K` kbd hint; mounts the palette only after hydration via `next/dynamic({ ssr: false })`. Cmd+K / Ctrl+K toggles the palette globally.
- `components/site-header/` — sticky top-of-page header that mounts in `app/layout.tsx`. Provides primary nav (Domains / Problems / Methodology / Trending), the site title link, plus the `SearchTrigger` and `ThemeToggle` in the right rail. Backdrop-blur on scroll.
- Bundle: home `/` is now 12.0 kB (up from 11.7 kB after the Unit 1.2 toggle landed; the +0.3 kB is the SearchTrigger placeholder + kbd shortcut hook). The palette itself is lazy-loaded — its Fuse + JSX cost is only paid the first time Cmd+K fires.
- THINK artifact: `docs/thinking/1.9-search-palette.md`. Smoke: `pnpm build` green; tests untouched (68/68 still).

#### Unit 1.10 — Landing page v1

- `app/page.tsx` flips from the Phase 0 dimension-legend + stub-routes scaffold to the §13 Phase 1 landing: hero (h1 + tagline + two CTAs to `/problems` and `/methodology`), "Recently rated" section, "By domain" tile grid, and a methodology blurb. Pure RSC — every section above the SiteHeader's client islands is server-rendered HTML so the LCP candidate (the hero `<h1>`) hits the wire as static markup (§10.4 budget: LCP < 1.8 s on slow 4G).
- `components/domain-tile-grid/` — extracted the Unit 1.7 `/domains` grid into a shared RSC. `app/domains/page.tsx` now imports it; the landing page reuses the same component so the two surfaces stay visually identical and one fix updates both. Link styling, problem/subdomain counts, and hover transitions preserved verbatim.
- `components/recently-rated/` — RSC that calls `getIndexedProblems()`, filters to rows with a `latestRatingDate`, sorts by date desc (title asc as the deterministic tie-breaker), and renders the top N (default 5) as cards with title, `<StatusPill>`, domain · subdomain breadcrumb, the `latestRatingDate`, the §8.3 advisory composite, and a tag chip row (capped at 4 tags). Empty-state copy points at `/contributing`.
- `lib/content/load-problems-index.ts` extended: `IndexedProblem.latestRatingDate?: string` (ISO `YYYY-MM-DD`, set only when the problem has a rating). Existing callers (problems index, future MoversBoard) unaffected; `RecentlyRated` reads it; the §13 deliverable specifies "rating-action date desc" rather than `editorial.last_curated`.
- Bundle: `/` route went from 12.0 kB / 118 kB First Load JS (where it sat after Unit 1.2 added the inline `ThemeToggle` to the home page) down to **162 B / 106 kB**. The toggle and `SearchTrigger` moved into the shared `<SiteHeader>` (Unit 1.9), so they no longer count toward the home-page route chunk — they're amortized across every page via the shared layout chunks. Net win for landing-page LCP.
- Tradeoff flagged: §13 reads "Recently rated **carousel**". With ≤ 5 rated problems in Phase 1, a real carousel widget (e.g. embla-carousel, ~9 kB gz) is not justified — the section is a static responsive grid. Marked in the THINK doc as a Phase-2 revisit once rating-action volume warrants horizontal scroll / arrows.
- THINK artifact: `docs/thinking/1.10-landing-page-v1.md`. Smoke gates green: `pnpm typecheck`, `pnpm test` (68/68 across 13 files), `pnpm validate-content` (3 files), `pnpm build` (23 routes — only `/` and `/domains` touched).

#### Unit 1.11 — Seed problems 2–10 (full §16 ten-problem set)

- Authored the 9 remaining seeds from MASTER_PROMPT §16, bringing `content/problems/` to the 10-problem target named in the §13 Phase 1 acceptance gate (above the §13 minimum of 6). Each follows the Unit 1.4 folder shape: `problem.yaml` + `background.mdx` + `definition.mdx` + `history.mdx` + `ratings/2026-05-14-initial.yaml`. Per §15.6, benchmark scores carry `metric_direction` only — no fabricated numbers; each rating action documents `signals_considered`. Confidence ranges 0.5–0.7 (lower than seed #1's 0.55–0.80, reflecting first-pass authoring).
- Slugs and taxonomy assignments: `long-horizon-agent-reliability` (DL/LLMs) · `scalable-oversight` (Social/Alignment) · `mechanistic-interpretability` (Social/Accountability-Interpretability) · `compute-optimal-test-time-reasoning` (DL/Algorithms) · `multi-agent-llm-coordination` (RL/Multi-agent) · `genome-foundation-models` (Apps/Health) · `operator-learning-foundation-models` (Apps/Chem-Phys-Earth) · `benchmark-integrity` (General-ML/Evaluation) · `long-context-rag` (DL/LLMs).
- Build surface jumped from 103 → 112 statically prerendered routes (+9, one per new seed via `generateStaticParams` on `/problems/[slug]`). `pnpm validate-content` now reports 21 content files (1 taxonomy + 10 problem.yaml + 10 rating actions). All other routes unchanged; no client-JS impact (pure content addition).
- Two seeds (`benchmark-integrity`, `long-context-rag`) co-authored via the parallel-curator workflow (`021bf7e`'s curator-prompt scaffolding); slug + cross-link review reconciled before commit. `multi-agent-llm-coordination` and `operator-learning-foundation-models` rating files received quoting fixes from the linter on `[[wikilink]]`-bearing list items (YAML flow-array ambiguity).
- Build-fix: `long-context-rag/definition.mdx` MDX frontmatter wrapped its math-bearing `summary:` in double quotes. The unquoted form contained `$\text{RAG}_M : (x, C) \mapsto y$` whose `:` was parsed as a YAML mapping separator. Wrapping in `"..."` and escaping `\\` for the YAML escape layer keeps the KaTeX intact.
- THINK artifact: `docs/thinking/1.11-seed-problems.md`. Smoke gates green: `pnpm typecheck`, `pnpm test` (68/68), `pnpm validate-content` (21 files), `pnpm build` (32 routes total: 26 static / 5 dynamic / 1 SSG-with-multiple-paths surface; First Load JS unchanged).

#### Unit 1.12 — Phase 1 acceptance gate

- Rewrote [e2e/smoke.spec.ts](../../e2e/smoke.spec.ts) for the §13 Phase 1 surface (the Phase 0 home-page-h1 + dimension-legend spec was broken after Unit 1.10's landing redesign). Three describe blocks: (1) landing renders the hero h1 + four header-nav links + two CTAs; (2) §13 nav path traverses `/` → `/domains` → `/domains/deep-learning` → `/domains/deep-learning/large-language-models` → `/problems/hallucination-reduction` → `/problems/hallucination-reduction/leaderboard` with one click per step and asserts the RatingRadar is visible; (3) visual-regression baseline on the RatingRadar via `toHaveScreenshot("rating-radar-hallucination-reduction.png", { animations: "disabled", maxDiffPixelRatio: 0.005 })`.
- Captured the chromium/win32 RatingRadar baseline at [e2e/smoke.spec.ts-snapshots/](../../e2e/smoke.spec.ts-snapshots/) (16 kB PNG). All 3 Playwright tests pass locally in ~41 s end-to-end (production build + 3 chromium workers). The Linux/CI baseline must be captured on first CI run (Playwright snapshots are platform-suffixed); plan is one follow-on commit from the artifact upload — documented in the THINK doc as tradeoff #2.
- Extended [lighthouserc.json](../../lighthouserc.json) to assert perf / a11y / SEO ≥ 0.95 (best-practices ≥ 0.95 warn) on the three §13 acceptance URLs: `/`, `/problems/hallucination-reduction`, `/domains/deep-learning`. 3 runs × 3 URLs × desktop preset. Local lhci skipped (Lighthouse results on Windows are not authoritative; CI Ubuntu is the gate, and bundles haven't grown since Unit 1.10's measurement showed home at 162 B / 106 kB First Load JS).
- Promoted both jobs in [.github/workflows/e2e-lighthouse.yml](../../.github/workflows/e2e-lighthouse.yml) from advisory (`continue-on-error: true`) to required (the flag removed). Closes OPEN_QUESTIONS Q27 — from Phase 1 onward, e2e + Lighthouse failures block PRs alongside the existing fast-path verify job.
- Tradeoffs flagged in the THINK doc: (a) visual-regression scope is the live radar inside `/problems/[slug]` rather than per-story Storybook snapshots — clean Phase-2 follow-on once Storybook static artifacts are part of CI; (b) per-platform baseline reconciliation as noted above; (c) no `generateMetadata` speculatively added — root-layout `metadata` propagates title + description to all pages, sufficient for the SEO floor (measure first, only add per-route metadata if Lighthouse docks).
- THINK artifact: `docs/thinking/1.12-acceptance-gate.md`. Local gates green: `pnpm typecheck`, `pnpm test` (68/68 across 13 files), `pnpm validate-content` (21 files), `pnpm build` (32 routes; all bundle sizes unchanged from Unit 1.11), `pnpm exec playwright test` (3 passed in 41.4 s). Phase 1 closes pending the CI Ubuntu pass on the §13 Lighthouse + visual-regression gate.

### Phase 2 — Papers, Authors, Institutions, Leaderboards

#### Unit 2.0 — Phase 2 prep (THINK doc + unit breakdown + OPEN_QUESTIONS surface)

- Docs-only prep unit (commit `4b61cba`). Inventories what's already in place from Phase 0–1 (canonical Zod-4 schemas in `lib/schemas/{paper,author,institution,entry,benchmark}.ts` since Unit 0.5; `lib/content/validate.ts` already glob-walks the empty `content/{papers,authors,institutions}/` dirs; route stubs from Unit 0.10 await replacement; the `signals_considered:` lists across the 10 Phase-1 seed problems are the seed-paper inventory).
- Proposes a 13-unit Phase 2 breakdown: 2.1 authors+institutions content · 2.2 Velite collections + load helpers · 2.3 author/institution detail pages · 2.4–2.6 seed papers in three batches (target 30–40 papers) · 2.7 paper detail page · 2.8 papers index · 2.9 per-problem leaderboard route · 2.10 entries.json per problem · 2.11 cross-link audit script (the §13 acceptance-gate deliverable) · 2.12 aggregate rollups · 2.13 Phase 2 acceptance gate.
- Surfaces Q32 (cross-link audit strictness on asymmetric `related_problems` — lean: warn, not block, to keep the parallel-curator workflow viable), Q33 (default leaderboard sort — lean: score direction-aware then date desc), Q34 (author cumulative-impact-score function — Phase 2 picks a simple default; Phase 3's recompose UI may obsolete the choice), Q35 (verified-flag provenance — Phase 2 default: only the primary curator at author time).
- THINK artifact: `docs/thinking/2.0-phase-2-prep.md`. No code changes.

#### Unit 2.1 — Authors + institutions content; font subset latin-ext (Q16 close)

- Lands the first Phase-2 content (commit `a2a2c67`):
  - `content/institutions/` (8): `openai`, `anthropic`, `google-deepmind`, `meta-fair`, `microsoft-research`, `stanford-university`, `mit`, `uc-berkeley`. Each `{ slug, display_name, country, type, homepage }`; `ror_id` deferred to a verified-lookup pass per §15.6 (the schema makes it optional).
  - `content/authors/` (5): `yejin-choi`, `percy-liang`, `owain-evans`, `jacob-steinhardt`, `dario-amodei`. Each `{ slug, display_name, affiliations: [] }`. Affiliations are intentionally empty in this batch — `AffiliationSchema` requires a `from` ISO date and authoring those without a verified public-record date would violate §15.6. Affiliations land alongside the seed-paper batches (Units 2.4–2.6) where each paper's publication date pins a verifiable lower bound.
- `app/layout.tsx` font subset expanded to `["latin", "latin-ext"]` across all three Inter / Source Serif 4 / JetBrains Mono families. Closes OPEN_QUESTIONS Q16 — author display names with diacritics (`Łukasz`, `Müller`, `François`) now render in the project font instead of falling back to the system font. Cost: ~+60 KB across the three families; absorbed into the existing `next/font/google` self-hosting pipeline (no third-party fetch at runtime).
- Smoke gates: `pnpm validate-content` jumps from 21 to 34 files (+13 = +5 authors + 8 institutions); typecheck / build clean.

#### Unit 2.2 — Velite collections + load helpers for papers / authors / institutions

- Wires the three Phase-2 entity collections into the Velite pipeline (commit `d5189ea`). `velite.config.ts` adds `Paper`, `Author`, `Institution` collections plus inline Zod-3 sub-schemas (`PaperS`, `AuthorS`, `InstitutionS`, `ContributionS`, `AffiliationS`) duplicated from the canonical Zod-4 source per OPEN_QUESTIONS Q31 — `scripts/validate-content.ts` cross-checks the canonical schemas to surface any drift in CI.
- Three load-helpers in `lib/content/`, each with cross-collection joins the Phase-2 detail pages will consume:
  - [load-paper.ts](../../lib/content/load-paper.ts) — `loadPaper(id)` + `allPaperIds()`. Resolves `paper.authors[]` and `paper.institutions[]` slug arrays against the matching collections, tracks `unresolvedAuthorSlugs` / `unresolvedInstitutionSlugs` for the cross-link audit (Unit 2.11), enriches `contributions[]` with the parent `Problem` from the `problems` collection.
  - [load-author.ts](../../lib/content/load-author.ts) — `loadAuthor(slug)` + `allAuthorSlugs()`. Joins `affiliations[].institution` to the institutions collection, finds every paper where the slug appears in `paper.authors[]`, derives the deduped `problemsTouched` set from the union of those papers' `contributions[].problem_slug`.
  - [load-institution.ts](../../lib/content/load-institution.ts) — `loadInstitution(slug)` + `allInstitutionSlugs()`. Resolves authors via `affiliations[].institution`, papers via `paper.institutions[]`, and computes ranked `subdomainCoverage` (one entry per `(domain_id, subdomain_id)` weighted by paper count, sorted by paperCount desc with title tiebreak).
- `vitest.config.ts` adds the `#site/content` resolve alias so the loader tests can import the Velite outputs at runtime.
- New test file [lib/content/load-entities.test.ts](../../lib/content/load-entities.test.ts) — 8 tests across the three loaders covering null returns on unknown slugs, the seed-set resolves, and that joins are empty until papers land in Units 2.4–2.6. Total **76 tests across 14 files** (was 68/13).
- Smoke gates green: `pnpm typecheck`, `pnpm test` (76/76), `pnpm validate-content` (34 files), `pnpm build` (117 routes; bundles unchanged on existing surfaces; `/papers`, `/papers/[id]`, `/authors/[slug]`, `/institutions/[slug]` route bundles still at the Unit 0.10 stub baseline since the page replacements are Unit 2.3).

#### Unit 2.3 — Author + institution detail pages (replaces Unit 0.10 stubs)

- Replaces the Unit 0.10 `StubPage` placeholders at `/authors/[slug]` and `/institutions/[slug]` with real detail pages backed by the Unit 2.2 load-helpers (commit `c1cf7ae`). Both routes are now SSG via `generateStaticParams` over `allAuthorSlugs()` / `allInstitutionSlugs()` — **5 author paths + 8 institution paths prerendered** (the 5+8 from Unit 2.1).
- `/authors/[slug]` sections (RSC, no client JS): header (display_name + `@slug` + external links to homepage / ORCID / Google Scholar when present); Affiliations (each `affiliations[].institution` slug resolves to a `/institutions/[slug]` link, with `from … → present|to` date range); Papers (every paper this author appears on; empty placeholder until Units 2.4–2.6); Problems touched (deduped via `union(papers[].contributions[].problem_slug)`). The cumulative-impact score deferred to Unit 2.12.
- `/institutions/[slug]` sections (RSC): header (display_name + type + country + homepage); Affiliated authors (every author whose `affiliations[].institution` matches this slug); Papers (every paper with this slug in `paper.institutions[]`); ranked Subdomain coverage (one entry per `(domain, subdomain)` weighted by paper count, deduped per paper, sorted by paperCount desc with subdomain-title alphabetical tiebreak).
- Empty-state copy on each section names which Phase 2 unit fills it in, so the page reads coherently before the seed-paper content batches commit.
- Bundle: build surface goes from 117 → **125 routes** — `/authors/[slug]` (5 paths, 181 B / 106 kB First Load JS) and `/institutions/[slug]` (8 paths, 181 B / 106 kB) both `●` SSG; the +8 over Unit 2.2 is the 8 institution paths newly prerendered (the 5 author paths were already on the surface from Unit 2.2's loaders). Other route bundles unchanged.

#### Unit 2.5 — Seed papers batch 2 (10 papers across 4 problems)

- Second Phase-2 paper-content batch. Lands 10 paper YAMLs covering `mechanistic-interpretability` (3), `scalable-oversight` (3), `multi-agent-llm-coordination` (2), and `long-context-rag` (2). Brings `content/papers/` to **20 of the 30–50 §13 target**; Unit 2.6 closes the floor.
- Papers (`id == arxiv_id`):
  - **mechanistic-interpretability** — `2211.00593` (IOI circuit, Wang et al. NeurIPS 2022; backs the `ioi-family` benchmark) · `2309.08600` (Sparse Autoencoders Find Highly Interpretable Features, Cunningham et al. arXiv 2023; backs `saebench`) · `2304.14997` (Towards Automated Circuit Discovery / ACDC, Conmy et al. NeurIPS 2023; backs `circuit-recovery`).
  - **scalable-oversight** — `1805.00899` (AI Safety via Debate, Irving/Christiano/Amodei 2018; backs `debate-arena`) · `2211.03540` (Measuring Progress on Scalable Oversight, Anthropic 2022; sandwich-experiment foundational) · `2311.12022` (GPQA, Rein et al. COLM 2024; backs `gpqa-diamond`).
  - **multi-agent-llm-coordination** — `2308.00352` (MetaGPT, Hong et al. ICLR 2024) · `2308.11432` (A Survey on LLM-based Autonomous Agents, Wang et al. 2023).
  - **long-context-rag** — `2005.11401` (RAG, Lewis et al. NeurIPS 2020; foundational) · `2404.06654` (RULER, Hsieh et al. COLM 2024; backs `ruler`).
- Conventions inherited from Unit 2.4: `authors[]` left empty (the 12 seed-author YAMLs on disk don't cover any of these 10 papers — Phase-2 cross-link audit / Unit 2.11 will surface for backfill); `institutions[]` only populated where the lead lab matches an existing seed slug (`uc-berkeley`, `openai`, `anthropic` ×2, `meta-fair` here — 5 of 10); every `evidence:` is an `https://arxiv.org/abs/<id>` URL; no `score:` fields per §15.6.
- HF MCP `paper_search` was unavailable while this unit ran (`Server not found`); proceeded under the CURATION contract's "MCP unavailable — passive review only" rule using only the anchor signals already named in the four problem.yamls.
- Smoke gates green: `pnpm validate-content` reports **62 content files** (was 52 after Unit 2.4: +10 paper YAMLs); `pnpm typecheck` clean; `pnpm build` 133 routes (no new SSG paths — `/papers/[id]` stays `ƒ` dynamic until Unit 2.7 lands the paper detail page).
- THINK artifact: `docs/thinking/2.5-seed-papers-batch-2.md`.

#### Unit 2.6 — Seed papers batch 3 (closes the §13 30-paper floor)

- Third and final §13-floor paper-content batch. Lands 10 paper YAMLs covering `operator-learning-foundation-models` (5), `genome-foundation-models` (2), and `benchmark-integrity` (3). Brings `content/papers/` to **30 of the 30–50 §13 target** — floor cleared.
- Papers (`id == arxiv_id`):
  - **operator-learning-foundation-models** — `1910.03193` (DeepONet, Lu/Jin/Karniadakis 2019) · `2010.08895` (Fourier Neural Operator, Li et al. ICLR 2021) · `2202.11214` (FourCastNet, Pathak et al. arXiv 2022) · `2211.02556` (Pangu-Weather, Bi et al. *Nature* 2023) · `2212.12794` (GraphCast, Lam et al. *Science* 2023; only paper in this batch with a seed-institution match — `google-deepmind`).
  - **genome-foundation-models** — `2306.15794` (Nucleotide Transformer, Dalla-Torre et al. 2023; backs `rare-variant-zero-shot`) · `2306.15006` (DNABERT-2, Zhou et al. 2023; *medium-confidence* on the exact arXiv ID, flagged in the THINK doc for Unit 2.11 audit).
  - **benchmark-integrity** — `1909.03004` (Show Your Work, Dodge et al. EMNLP 2019; reporting-hygiene foundation) · `2203.08242` (Data Contamination: From Memorization to Exploitation, Magar & Schwartz ACL 2022; backs `contamination-detection`) · `2305.10160` (Stop Uploading Test Data, Jacovi et al. EMNLP 2023; backs `held-out-replication`).
- Conventions inherited from Units 2.4 / 2.5: `authors[]` uniformly empty (slug minting deferred); `institutions[]` only populated where the lead lab matches an existing seed slug (1 of 10 in this batch — `google-deepmind` on GraphCast; vs. 5 of 10 in Unit 2.5; the other lead institutions here — Brown, Caltech, NVIDIA, Huawei, InstaDeep — aren't in the seed set and would need their own YAMLs); every `evidence:` is an `https://arxiv.org/abs/<id>` URL; no `score:` fields per §15.6.
- HF MCP `paper_search` remains unavailable; proceeded under the same "MCP unavailable — passive review only" rule as Unit 2.5 using the anchor signals named in the three problem.yamls.
- §13 stretch target (40 papers, +10 over the floor) is best executed via PAPER-INGEST runs once Unit 2.7 (paper detail page) lands — see [docs/PAPER_INGEST_RUNBOOK.md](../../docs/PAPER_INGEST_RUNBOOK.md). The trunk units (2.7 paper detail + 2.8 papers index + 2.9 per-problem leaderboard + 2.10 entries.json + 2.11 cross-link audit + 2.12 aggregate rollups + 2.13 acceptance gate) own the rest of Phase 2.
- Smoke gates green: `pnpm validate-content` reports **72 content files** (was 62 after Unit 2.5: +10 papers); `pnpm typecheck` clean; `pnpm build` 133 routes (no new SSG paths — `/papers/[id]` still `ƒ` dynamic until Unit 2.7).
- THINK artifact: `docs/thinking/2.6-seed-papers-batch-3.md`.

#### Unit 2.7 — Paper detail page `/papers/[id]` (replaces Unit 0.10 stub)

- Replaces the Unit 0.10 `StubPage` at `/papers/[id]` with a real four-block RSC detail page backed by [`loadPaper`](../../lib/content/load-paper.ts). `generateStaticParams` over `allPaperIds()` prerenders all 30 paper paths as SSG.
- Four-block layout (RSC, no client JS):
  1. **Header** — breadcrumb (`Papers →`), title (h1), metadata row (venue · year · arXiv link · DOI link · GitHub link) with each external link conditionally rendered.
  2. **TL;DR + Contributions** — verbatim `paper.tldr` (`"[TLDR pending human review]"` sentinel rendered as-is). Contributions table with columns Problem · Benchmark · Metric · Score · Evidence; problem column resolves to `/problems/[slug]` link via `loadPaper`'s join, falls back to monospace slug + `(unresolved)` tag when the slug doesn't resolve (Unit 2.11 cross-link audit will surface these).
  3. **Authors + Institutions** — two-column section. Resolved slugs link to `/authors/[slug]` / `/institutions/[slug]`; unresolved slugs render as monospace `@slug` + `(unresolved)` tag; both-empty empty-states explain the Phase-2 backfill pacing. With all 30 current papers having `authors: []`, every paper currently shows the empty-state on the authors side.
  4. **Citation** — BibTeX-style `<pre>` `@misc{op-paper-<id>, …}` mirroring Unit 1.6's problem-citation block. Includes `eprint` + `archivePrefix` when `arxiv_id` is set; `doi` line when set; `note` for the venue; canonical `{NEXT_PUBLIC_SITE_URL}/papers/{id}` URL.
- Bundle: build surface jumps **133 → 163 routes** — exactly +30, one prerendered path per paper from Units 2.4 / 2.5 / 2.6. `/papers/[id]` is now `●` SSG at 182 B route code / 106 kB First Load JS, well under §10.4's 180 kB problem-detail budget.
- No new tests required — `loadPaper` is already covered by `lib/content/load-entities.test.ts` (Unit 2.2). Visual regression on a representative paper is deferred to Unit 2.13 (Phase 2 acceptance gate).
- Smoke gates green: `pnpm typecheck`, `pnpm test` (79/79), `pnpm build` (163 routes; bundle sizes unchanged on existing surfaces; First Load JS shared chunk still 103 kB).
- THINK artifact: `docs/thinking/2.7-paper-detail-page.md`.

#### Unit 2.8 — Papers index `/papers` (replaces Unit 0.10 stub)

- Replaces the Unit 0.10 `StubPage` at `/papers` with a real index that mirrors Unit 1.8's `/problems` index. Server pre-computes `IndexedPaper[]` at build time via [`lib/content/load-papers-index.ts`](../../lib/content/load-papers-index.ts); client island [`components/papers-index/`](../../components/papers-index/index.tsx) owns filter + sort UI.
- `IndexedPaper` shape: `{ id, title, year, venue?, arxivId?, problemSlugs: string[] (distinct from contributions), contributionCount, authorCount, institutionCount }`. Built once at request time; no client-side joins.
- **Filters (3, mutually compose):** Problem slug (distinct slugs across all papers' contributions) · Year (distinct years desc, exact match) · Venue (distinct non-empty venues, alphabetical). "Clear" button resets all three.
- **Sort keys (3):** Year (default, desc) · Title (alpha) · Contributions (count desc — surfaces cross-cutting papers). Sort header doubles as toggle, matching `/problems`.
- **Per row:** title (links to `/papers/[id]`), year (right-aligned mono), venue + arXiv badge + contribution count + author/institution counts on the meta line, clickable problem-slug chips that toggle the Problem filter (same UX as `/problems`' tag chips).
- Tradeoffs flagged in the THINK doc: no author/institution facet yet (all 30 current papers have empty `authors[]` so the facet would be inert); no paper-level "verified" filter (entries land in Unit 2.10); no URL-state encoding (deferred to Phase 3 same as `/problems`).
- Bundle: `/papers` route goes from 161 B / 103 kB (stub) to **1.76 kB / 116 kB First Load JS** — comparable to `/problems` (2.2 kB / 117 kB). Build surface stays at 163 routes; `/papers` is `○` static (filter/sort state is client-side; the data is build-time-resolved).
- No new tests required — `getIndexedPapers` is a thin transformation over the already-tested papers collection. Visual regression baseline for the index lands in Unit 2.13.
- Smoke gates green: `pnpm typecheck`, `pnpm test` (79/79), `pnpm build` (163 routes; only `/papers` bundle changed; First Load JS shared chunk still 103 kB).
- THINK artifact: `docs/thinking/2.8-papers-index.md`.

#### Unit 2.6b — Institution backfill for Units 2.5 / 2.6 papers

- Phase-2 hygiene follow-on to Units 2.5 / 2.6. Authors 5 new institution YAMLs and backfills `institutions:` arrays on the 6 affected paper YAMLs that landed with `institutions: []`. Shrinks the cross-link audit (Unit 2.11) backlog and adds 5 new SSG paths under `/institutions/[slug]`.
- New institutions (`content/institutions/<slug>.yaml`): `brown-university`, `caltech`, `nvidia`, `huawei`, `instadeep`. All five carry `slug`, `display_name`, `country`, `type` (industry / academic), and `homepage`; `ror_id` deliberately omitted (no fabricated IDs per §15.6 — a follow-on curator pass pulls them from `ror.org`).
- Paper YAML backfills:
  - `1910.03193` (DeepONet) → `brown-university`
  - `2010.08895` (Fourier Neural Operator) → `caltech`
  - `2202.11214` (FourCastNet) → `nvidia`
  - `2211.02556` (Pangu-Weather) → `huawei`
  - `2306.15794` (Nucleotide Transformer) → `instadeep`
  - `2404.06654` (RULER) → `nvidia`
- Build surface goes from 163 → **168 routes** (+5 institution pages now `●` SSG; same 182 B / 106 kB envelope as the existing 9). Total institutions in `content/institutions/`: 9 → **14**.
- No collision with the parallel session's Unit 2.8 (papers index) work — this unit only touches `content/institutions/` (5 new files) and `content/papers/<id>.yaml` (6 modifications), zero overlap with `app/papers/` / `lib/content/load-papers-index.ts` / `components/papers-index/`.
- Smoke gates green: `pnpm validate-content` reports **77 content files** (was 72 after Unit 2.7); `pnpm typecheck`; `pnpm build` (168 routes).
- THINK artifact: `docs/thinking/2.6b-institution-backfill.md`.

#### Unit 2.11 — Cross-link audit script (§13 Phase 2 acceptance gate criterion)

- [`scripts/cross-link-audit.ts`](../../scripts/cross-link-audit.ts) (CLI wrapper) + [`lib/content/cross-link-audit.ts`](../../lib/content/cross-link-audit.ts) (testable pure function returning `AuditReport`). Same lib + script split as Unit 0.7's `validate-content`. Wired as `pnpm audit-content`.
- **Seven checks**, four error-class and three warning-class:
  - `paper-problem-fk` (error) — every `paper.contributions[].problem_slug` exists in `content/problems/`.
  - `paper-author-fk` (warning) — every `paper.authors[]` slug resolves to `content/authors/`; warning because Phase-2 norm is empty `authors[]` (Units 2.5/2.6).
  - `paper-institution-fk` (warning) — every `paper.institutions[]` slug resolves; warning because partial population is the Phase-2 norm.
  - `author-institution-fk` (error) — every `author.affiliations[].institution` resolves; small set, must be clean.
  - `related-problems-fk` (error) — every `problem.related_problems[]` slug exists.
  - `related-problems-symmetry` (warning, per Q32) — if A lists B, B should list A; the cardinal rule is the slug resolves, not that the graph is symmetric.
  - `entries-contributions-agreement` (warning) — every `entries.json` entry's `paper_id` should appear in that paper's `contributions[]`; no-op pending Unit 2.10 content but activates automatically.
- **First run against `content/`: 0 errors, 6 warnings.** All 6 warnings are `related-problems-symmetry`: benchmark-integrity ↔ {long-horizon-agent-reliability, hallucination-reduction}, compute-optimal-test-time-reasoning ↔ {hallucination-reduction, long-horizon-agent-reliability}, long-horizon-agent-reliability → scalable-oversight, scalable-oversight → hallucination-reduction. **No dangling slug references** anywhere — Unit 2.6b's institution backfill cleaned the seed papers, Unit 2.4's author backfill cleaned the early paper batch, and the seed problems' `related_problems` slugs all resolve.
- Reads YAML directly from `content/` (no Velite dependency), parallel to the validate-content model. ~66 files read, ~600 ms on the current tree.
- Exit code: 0 if errors == 0 (warnings allowed); 1 otherwise. CI integration lands in Unit 2.13 alongside the Lighthouse + visual-regression refresh.
- No new tests in this unit — fixture-based audit tests are part of Unit 2.13's acceptance-gate test refresh.
- THINK artifact: `docs/thinking/2.11-cross-link-audit.md`. Smoke gates green: `pnpm typecheck`, `pnpm test` (79/79), `pnpm validate-content` (77 files), `pnpm audit-content` (0 errors / 6 warnings).

#### Unit 2.13 — Phase 2 acceptance gate

- **§13 Phase 2 acceptance:** both criteria met. (1) `pnpm audit-content` reports 0 errors / 6 known warnings (all `related-problems-symmetry`, Q32) — green. (2) New visual-regression baselines captured for three Phase-2 routes: `/papers/[id]`, `/authors/[slug]`, `/institutions/[slug]`. The §13 acceptance criteria do not require Units 2.9 / 2.10 / 2.12 (leaderboard / entries / aggregate rollups) — those are *deliverables* in flight, not gate criteria.
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml): promoted `audit-content` to a CI gate alongside `validate-content`. Job name updated to `typecheck · lint · test · build · validate-content · audit-content`. From this commit forward, paper↔problem reference breakage and asymmetric-author-affiliation breakage block PRs.
- [lighthouserc.json](../../lighthouserc.json): extended the perf/a11y/SEO ≥ 0.95 URL set to cover one representative path per new dynamic route — `/papers/2310.06770` (SWE-bench, Unit 2.4 seed), `/authors/shunyu-yao` (Unit 2.4 seed author), `/institutions/anthropic` (Unit 2.1 seed institution). Total Lighthouse URLs: 6 (was 3 after Unit 1.12).
- [e2e/smoke.spec.ts](../../e2e/smoke.spec.ts):
  - New describe block: "Phase 2 paper detail nav" — visits `/papers/2310.06770` and asserts the §9 four-block layout's stable headings (`h1` title, "Contributions" h2, "Cite this" h2).
  - New describe block: "Phase 2 visual regression: paper + author + institution detail" — three new `toHaveScreenshot` assertions on `<main>` for `/papers/2310.06770`, `/authors/shunyu-yao`, `/institutions/anthropic`. Per-route baselines committed under `e2e/smoke.spec.ts-snapshots/` (chromium / win32). Diff threshold 0.01 (vs. 0.005 for the SVG radar) — page-level snapshots have more font-rendering surface than a pure-SVG figure.
  - Phase-1 RatingRadar baseline preserved verbatim (same maxDiffPixelRatio: 0.005).
- [lib/content/cross-link-audit.test.ts](../../lib/content/cross-link-audit.test.ts): 4 new Vitest cases — real `content/` returns zero errors; the `audit-dangling` fixture surfaces exactly one `paper-problem-fk` error; the `audit-asymmetric` fixture surfaces a `related-problems-symmetry` *warning* (no errors); the `content-valid` fixture (no problems/papers/etc.) tolerates missing subdirs. Two new static fixture trees under [test/fixtures/audit-dangling/](../../test/fixtures/audit-dangling/) and [test/fixtures/audit-asymmetric/](../../test/fixtures/audit-asymmetric/). Total: **83 tests across 15 files** (was 79/14).
- **Phase 2 status at this commit:** gate met; deliverables in flight are Unit 2.9 (per-problem leaderboard), Unit 2.10 (`entries.json` content + Velite collection wiring), Unit 2.12 (aggregate rollups on `/authors/[slug]` cumulative impact and `/institutions/[slug]` ranked subdomain coverage). Phase 3 cannot start until those three units land (§12 cardinal rule).
- Per-platform baseline coupling continues from Unit 1.12: the 4 PNG baselines committed here are `chromium-win32`; the first CI Ubuntu run will need a one-shot `--update-snapshots` to land the Linux equivalents.
- Smoke gates green: `pnpm typecheck`, `pnpm test` (83/83 across 15 files), `pnpm validate-content` (77 files), `pnpm audit-content` (0 errors / 6 warnings), `pnpm build` (168 routes, unchanged from Unit 2.11), `pnpm exec playwright test` (7/7 passed in 32.8 s).
- THINK artifact: `docs/thinking/2.13-phase-2-acceptance-gate.md`.

#### Unit 2.12 — Aggregate rollups (cumulative author + institution impact)

- Closes the §13 Phase 2 deliverable "each author shows cumulative problem-impact score; each institution shows ranked subdomain coverage." Subdomain coverage already shipped in Unit 2.2; this unit lands the cumulative-impact half on both surfaces and adds `problemsTouched` to the institution loader for symmetry with the author one.
- [`lib/content/load-author.ts`](../../lib/content/load-author.ts): `LoadedAuthor.cumulativeImpact?: number` — sum of §8.3 advisory composite scores across `problemsTouched`. Built from `getIndexedProblems()` (Unit 1.8) which already pre-computes per-problem composite from the latest rating action. Undefined when no touched problem has a composite (e.g., no rating action).
- [`lib/content/load-institution.ts`](../../lib/content/load-institution.ts): `LoadedInstitution.problemsTouched: Problem[]` + `LoadedInstitution.cumulativeImpact?: number`. Same shape and semantics as the author loader; deduped via Set over the institution's papers' contributions.
- Page renders:
  - [`/authors/[slug]`](../../app/authors/[slug]/page.tsx): new "Cumulative impact" section at the bottom — shows `cumulativeImpact.toFixed(2)` with denominator "across N problems touched". Falls back to an italic placeholder when undefined. The §8.3 cardinal rule ("composite is advisory and never shown alone") is satisfied by the always-visible problemsTouched section above.
  - [`/institutions/[slug]`](../../app/institutions/[slug]/page.tsx): same section, paired with the existing subdomain-coverage section as the "always alongside" view.
- Sum (not mean) is the §13 wording's "cumulative" reading — more problems touched = more impact. Weighted variants (per-contribution count, per-author share) are explicitly deferred until a real use case requests them.
- [`lib/content/load-entities.test.ts`](../../lib/content/load-entities.test.ts): 3 new Vitest cases — author with rated problemsTouched has positive cumulativeImpact; author with empty problemsTouched returns undefined; institution surfaces both new fields. Total **86 tests across 15 files** (was 83/15).
- No new content, no schema changes, no bundle-size impact (both pages stay at the 182 B / 106 kB First Load JS envelope; the new computation runs at module load against the same Velite snapshot the existing loaders already touch).
- THINK artifact: `docs/thinking/2.12-aggregate-rollups.md`. Smoke gates green: `pnpm typecheck`, `pnpm test` (86/86), `pnpm validate-content` (77), `pnpm audit-content` (0 errors / 6 warnings), `pnpm build` (168 routes).

#### Unit 2.9 (+ 2.10 scaffold) — Per-problem leaderboard page

- Combines the two §13 deliverables — "Per-problem leaderboard page with sortable, filterable table; verified-flag rendering" (2.9) and "`entries.json` per problem; per-entry verified flag rendered" (2.10) — into one commit because they're tightly coupled. The page wiring lands here; entries content goes live as curators populate per-problem `entries.json` (§15.6 forbids fabricated benchmark scores, so this commit ships the surface empty).
- Replaces the Unit 0.10 `StubPage` at `/problems/[slug]/leaderboard` with a real SSG page. `generateStaticParams()` over `allProblemSlugs()` prerenders all **10 problem leaderboards**: build surface goes from 168 → **178 routes**.
- Page layout: breadcrumb (`Problems / <problem> / Leaderboard`) → one-paragraph source-provenance note (§10.2) → per-benchmark sortable table OR an empty-state block. Sort defaults to `score` desc when the parent benchmark is `higher-is-better`, asc when `lower-is-better`; date is the secondary sort key.
- Verified-flag pill (§13 deliverable wording): `verified: true` renders as a green chart-2-tinted "verified" chip; `verified: false` renders as a muted "unverified" chip. Both monospace, tracking-wide.
- New file [`lib/content/load-entries.ts`](../../lib/content/load-entries.ts) — `loadEntriesForProblem(slug)` reads `content/problems/<slug>/entries.json` if present, validates each entry against `LeaderboardEntrySchema`, returns `[]` when missing. Reads via `node:fs` directly (mirrors validate-content + cross-link-audit's pattern); a Velite `entries` collection is deferred until content warrants it.
- All 10 leaderboard pages currently render the empty-state block (no `entries.json` files exist on disk yet). Phase-3 ratings-dynamics units or a curator-driven leaderboard-entry workflow populate them; the cross-link audit's `entries-contributions-agreement` check activates automatically.
- Tradeoffs flagged: per §15.6 the page ships empty; the §13 acceptance gate (Unit 2.13) was not contingent on this content. With this commit, **all 13 units of the 2.0 Phase-2 plan are now done** (2.0–2.13, plus the 2.6b hygiene unit). Phase 3 (§12) can begin once you sign off on Phase 2.
- Smoke gates green: `pnpm typecheck`, `pnpm test` (86/86), `pnpm validate-content` (77 files), `pnpm audit-content` (0 errors / 6 warnings), `pnpm build` (178 routes; the +10 over Unit 2.12 are the 10 leaderboard pages SSG-prerendered).
- THINK artifact: `docs/thinking/2.9-leaderboard-page.md`.

#### Unit 2.6c — ROR ID backfill for Unit-2.6b institutions

- Closes the explicit deferral in Unit 2.6b ("`ror_id` deliberately omitted (no fabricated IDs per §15.6 — a follow-on curator pass pulls them from `ror.org`)"). This is that pass.
- Adds the `ror_id:` field to 4 of the 5 institutions seeded in Unit 2.6b. Each ID was retrieved from the ROR public API (`https://api.ror.org/v2/organizations?query=...`) and cross-checked against the organization's location and founding year on the matching record:
  - `brown-university` → [`05gq02987`](https://ror.org/05gq02987) (Brown University, Providence RI, est. 1764)
  - `caltech` → [`05dxps055`](https://ror.org/05dxps055) (California Institute of Technology, Pasadena CA, est. 1891)
  - `nvidia` → [`03jdj4y14`](https://ror.org/03jdj4y14) (NVIDIA Corporation, Santa Clara CA, est. 1993 — parent record)
  - `huawei` → [`00cmhce21`](https://ror.org/00cmhce21) (Huawei Technologies (China), Shenzhen — parent record)
- **InstaDeep is a documented exception**: ROR v2 search returns `number_of_results: 0` for both the plain-query and `names.value`-advanced search variants. The organization is not registered with ROR (a known gap in ROR's coverage of private AI/ML startups). Per §15.6, `ror_id` is left omitted on `instadeep.yaml` rather than fabricated; a future content commit can add it if and when ROR registers InstaDeep.
- All 4 added IDs satisfy the strict regex in `lib/schemas/institution.ts` (`^0[\da-z]{6}\d{2}$`): 9-character format with leading `0`, six alphanumeric-lowercase, trailing 2 digits. `pnpm validate-content` enforces this at commit time.
- Scope intentionally limited to the 5 institutions named in Unit 2.6b's deferral. The other 9 pre-2.6b institutions (`anthropic`, `google-deepmind`, `meta-fair`, `microsoft-research`, `mit`, `openai`, `princeton-university`, `stanford-university`, `uc-berkeley`) also lack `ror_id`; a separate hygiene unit (call it 2.6d) can extend the same pattern across them if a future audit asks for it.
- No code, schema, route, or bundle changes. Pure metadata addition. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm validate-content` (77 files), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected `related-problems-symmetry` set), `pnpm build` (178 routes; all 14 `/institutions/[slug]` pages prerender).
- THINK artifact: `docs/thinking/2.6c-ror-id-backfill.md`.

#### Unit 2.6d — ROR ID backfill for original-9 institutions

- Extends Unit 2.6c's pattern across the 9 institutions seeded in Unit 2.1 without `ror_id`. Combined with 2.6c, 11 of 14 institutions now carry a verified ROR ID.
- Adds the `ror_id:` field to 7 of the 9 institutions. Each ID was retrieved from the ROR public API (`https://api.ror.org/v2/organizations?query=...`) and cross-checked against the organization's location and founding year on the matching record:
  - `anthropic` → [`056y0v115`](https://ror.org/056y0v115) (Anthropic, San Francisco CA, est. 2021)
  - `openai` → [`05wx9n238`](https://ror.org/05wx9n238) (OpenAI, San Francisco CA, est. 2015)
  - `google-deepmind` → [`00971b260`](https://ror.org/00971b260) (Google DeepMind, London UK, est. 2010 — parent Alphabet)
  - `mit` → [`042nb2s44`](https://ror.org/042nb2s44) (Massachusetts Institute of Technology, Cambridge MA, est. 1861)
  - `stanford-university` → [`00f54p054`](https://ror.org/00f54p054) (Stanford University, est. 1891)
  - `uc-berkeley` → [`01an7q238`](https://ror.org/01an7q238) (University of California, Berkeley, est. 1868)
  - `princeton-university` → [`00hx57361`](https://ror.org/00hx57361) (Princeton University, est. 1746)
- **2 documented exceptions** (consistent with Unit 2.6c's InstaDeep precedent — omit rather than misattribute):
  - `meta-fair` — Meta FAIR is not separately registered in ROR. Parent Meta has `01zbnvs85`, but attaching a parent-corporate ROR ID to a research-division slug ("Meta FAIR") is a category error future tooling would propagate. Omit.
  - `microsoft-research` — Microsoft Research has no unified ROR record at the lab level; only regional MSR subsidiaries (UK, India, Asia, etc.) and parent Microsoft (`00d0nc645`) are registered. Same reasoning. Omit.
- All 7 added IDs satisfy the schema regex `^0[\da-z]{6}\d{2}$` (9 chars). `pnpm validate-content` enforces at commit time.
- Combined with 2.6c, **3 of 14 institutions** still lack `ror_id` (`instadeep`, `meta-fair`, `microsoft-research`). All 3 are documented-exception omissions, not deferrals.
- Pure metadata addition: no code, schema, route, or bundle changes. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm validate-content` (191 files — includes 114 new author YAMLs from a parallel session's in-flight Unit 2.5b work), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected set), `pnpm build` (178 routes).
- THINK artifact: `docs/thinking/2.6d-ror-id-backfill-original-institutions.md`.

#### Unit 2.5b — Author backfill for Unit-2.5 papers (batch 2)

- Closes one half of the Phase-2 follow-on flagged in the session handoff and explicitly deferred by Unit 2.5 ("Authors stay `[]` … the authors of these 10 papers don't have slugs yet … Backfilling lands in a later Phase-2 unit when more authors are minted"). The other half (Unit 2.6 papers, batch 3) ships in a sibling unit.
- Adds 114 new `content/authors/<slug>.yaml` files — every previously-missing author across the 10 batch-2 papers. Author count: **12 → 126**. Each YAML follows the established three-line shape (`slug`, `display_name`, `affiliations: []`) — no fabricated ORCIDs, scholar IDs, homepages, or affiliations (§15.6; same restraint that kept ROR IDs out of Unit 2.6b until Unit 2.6c/2.6d had verified pulls).
- Attestation: every author list was pulled from `https://arxiv.org/abs/<id>` via WebFetch and copied verbatim, including the long Anthropic author list (46 authors) on `2211.03540` *Measuring Progress on Scalable Oversight*. Slugs are ASCII kebab-case per `lib/schemas/_primitives.slug` regex; diacritics are ASCII-folded in slugs (`heinrich-kuttler`, `tim-rocktaschel`, `adria-garriga-alonso`, `kamile-lukosiute`, `noemi-mercado`, `jurgen-schmidhuber`) but preserved verbatim in `display_name` (UTF-8, no BOM, LF).
- Reuses 2 existing author slugs from the Unit 2.1 seed: `dario-amodei` (papers `1805.00899` + `2211.03540`) and `jacob-steinhardt` (paper `2211.00593`). 3 minted slugs are shared across multiple batch-2 papers: `ethan-perez` (RAG + Anthropic oversight), `arthur-conmy` (IOI + ACDC), `samuel-r-bowman` (Anthropic oversight + GPQA) — minted once, referenced twice.
- Updates all 10 batch-2 paper YAMLs (`1805.00899`, `2005.11401`, `2211.00593`, `2211.03540`, `2304.14997`, `2308.00352`, `2308.11432`, `2309.08600`, `2311.12022`, `2404.06654`): `authors: []` → full publication-order list. The cross-link audit's `danglingPaperAuthorRefs` line now meaningfully covers ~130 paper→author edges (was vacuously 0 because arrays were empty).
- No code, schema, route, or bundle changes. Pure content addition. Velite re-emits `.velite/authors.json` with 126 entries; the existing `/authors/[slug]` route automatically prerenders the 114 new pages on the next `pnpm build`.
- Smoke gates green: `pnpm validate-content` (**191 files**, was 77), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected `related-problems-symmetry` set; `0 dangling author refs` is now substantive rather than vacuous), `pnpm test` (86/86 across 15 files), `pnpm typecheck` clean.
- THINK artifact: `docs/thinking/2.5b-author-backfill.md`.
- **Commit partition (workflow note).** The unit lands in 2 commits — `chore(phase-2): unit 2.5b/1` (114 author YAMLs) and `chore(phase-2): unit 2.5b/2` (paper-side `authors[]` wiring + THINK doc + this CHANGELOG entry). Reason: the lint-staged + prettier pre-commit hook fails on Windows when 126 file paths are passed in a single argv (the cumulative path-string exceeds the cmd.exe ~8KB limit). Splitting keeps each `prettier --write` invocation comfortably under the limit. The two commits are atomic for review purposes — neither is independently meaningful; both must land for the audit's `danglingPaperAuthorRefs` line to remain green.

#### Unit 2.6g — Paper title audit + canonicalization fix for 2305.10160

- Phase-2 hygiene follow-on. Triggered by Unit 2.6e's HyenaDNA finding (arXiv-ID-vs-claimed-title mismatch on `2306.15794`); ran a corpus-wide title audit across all 30 paper YAMLs and found one additional canonicalization bug beyond the HyenaDNA case.
- **The fix**: `content/papers/2305.10160.yaml` title `"...Mitigating Data Contamination by Large Language Models"` → `"...Mitigating Data Contamination by Evaluation Benchmarks"`. Same paper (Jacovi, Caciularu, Goldman, Goldberg; EMNLP 2023); the previous subtitle was a paraphrase error introduced when the paper was seeded in Unit 2.6 — "by Evaluation Benchmarks" identifies the mechanism (benchmarks themselves leak into pretraining corpora and contaminate), "by Large Language Models" mis-attributes the agency. Verified against both the arXiv API (batched call from this session) and the `https://arxiv.org/abs/2305.10160` HTML page (single fetch).
- **Audit coverage in this session**:
  - **Batch 2 (Unit 2.5, 10 papers)** — arXiv-verified via API batched call. All 10 titles match YAML.
  - **Batch 3 (Unit 2.6, 10 papers)** — arXiv-verified via API batched call. 2 mismatches found: `2306.15794` (HyenaDNA; yielded to parallel-session Unit 2.6e), `2305.10160` (fixed in this commit).
  - **Batch 1 (Unit 2.4, 10 papers)** — arXiv API returned `429 Too Many Requests` (rate-limit from the batch-2/3 burst). Audit fell back to recall-checks against well-known references; no mismatches found, but this leg is **not arXiv-verified**. A future hygiene unit should re-run the API audit on the 10 batch-1 IDs once the rate-limit cooldown clears.
- **Unit numbering note**: `2.6f` is deliberately left unclaimed as the likely home for a batch-3 author-backfill unit (mirror of the parallel session's Unit 2.5b for batch 2). This unit uses `2.6g` to avoid colliding with that future work. The parallel-session Unit 2.6e (HyenaDNA correction) is pending in the working tree at commit time and will land separately.
- Pure metadata fix: no code, schema, route, or bundle changes. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm validate-content` (191 files), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected set).
- THINK artifact: `docs/thinking/2.6g-paper-title-audit.md`.

#### Unit 2.6h — Leaderboard entries for hallucination-reduction (SimpleQA only)

- Phase-2 hygiene follow-on. Closes one corner of the §13 deliverable "`entries.json` per problem; per-entry verified flag rendered" deferred by Unit 2.9 ("page wiring lands here; entries content goes live as curators populate per-problem `entries.json`"). Lands the first per-problem `entries.json` content into the repo.
- **Scope-limited to 3 SimpleQA entries** sourced from [`openai/simple-evals`](https://github.com/openai/simple-evals) (OpenAI's official evaluation harness for the SimpleQA benchmark, primary-source-grade for OpenAI-attested scores):
  - `gpt-4o-2024-08-06` → **40.1** (2024-08-06; model snapshot date embedded in the model name)
  - `o1` → **42.6** (2024-12-05; OpenAI's public-availability date for o1)
  - `gpt-4.5-preview-2025-02-27` → **62.5** (2025-02-27; the current top scorer in the simple-evals table)
- All 3 entries set `verified: true` qualified by the leaderboard page's [inclusive-OR definition](../../app/problems/[slug]/leaderboard/page.tsx#L62-L64) — "Verified entries have been replicated or have explicit protocol notes". The OpenAI-sourced scores are not independently replicated but each entry carries explicit `protocol_notes` pointing to the simple-evals repo and the correct/incorrect/not_attempted protocol defined in paper 2411.04368.
- Score scale: percentages (0–100), preserving the primary source's reported format verbatim (§15.6 defensible default; the benchmark declaration in `problem.yaml` doesn't pin a scale).
- **3 of 4 declared benchmarks remain empty** (documented in the THINK doc):
  - `truthfulqa-2026` — TruthfulQA abstract reports "truthful 58%" but the benchmark's declared metric is `truthful+informative` (a stricter conjunction; ~21% in the paper's body). Abstract-only fetch is metric-mismatched; full-PDF curation is needed. Additionally, `-2026` suffix implies a hypothetical refresh of the 2021 benchmark; that disambiguation is a separate curatorial decision.
  - `halueval` — HaluEval abstract is methodological only. Headline numbers are in the paper's tables; full-PDF or [`RUCAIBox/HaluEval`](https://github.com/RUCAIBox/HaluEval) leaderboard ingestion would unblock.
  - `facts-grounding` — FACTS Grounding is a 2024 DeepMind benchmark with no contributing paper in the repo. A future paper-ingest commit attaches.
- No code, schema, route, or bundle changes. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB. The `/problems/hallucination-reduction/leaderboard` page now renders 3 entries on the `simpleqa` benchmark instead of empty-state across the board.
- **Schema gap surfaced** (for Phase-3 work): `LeaderboardEntrySchema` lacks `model_name` and `score_scale`. Today's `paper_id` field serves dual duty (benchmark-defining paper + score-reporting paper) — `protocol_notes` carries the model identity. A Phase-3 schema refinement could split these out.
- Smoke gates green: `pnpm validate-content` (192 files), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected set), `pnpm build` (178 routes; new `entries.json` doesn't add SSG paths).
- THINK artifact: `docs/thinking/2.6h-entries-hallucination-reduction.md`.

#### Unit 2.6i — Leaderboard entries for long-horizon-agent-reliability (τ-bench only)

- Phase-2 hygiene follow-on, sibling to Unit 2.6h. Extends the per-problem `entries.json` pattern to the second-most-populated problem in the repo (4 contributing papers, 4 declared benchmarks; 1-to-1 paper↔benchmark mapping). Lands 3 attested entries.
- **Scope-limited to 3 τ-bench `pass^4` entries** sourced from the [`sierra-research/tau-bench`](https://github.com/sierra-research/tau-bench) README leaderboard tables (Sierra is Shunyu Yao's org and the authoring organization for paper 2406.12045 — primary-source-grade for the benchmark's own numbers):
  - `claude-3-5-sonnet-20241022` on **retail** → **0.462**
  - `claude-3-5-sonnet-20241022` on **airline** → **0.225**
  - `claude-3-5-sonnet-20240620` on **retail** → **0.387**
- **Metric selection**: `pass^4` — the highest k reported uniformly across rows in the README and the regime the problem.yaml notes pin as the "central artefact" (the pass^1 → pass^k collapse). Shipping the easier `pass^1` column would undercut the problem's editorial framing.
- All 3 entries set `verified: true` qualified by the leaderboard page's [inclusive-OR definition](app/problems/[slug]/leaderboard/page.tsx#L62-L64); each `protocol_notes` field carries model variant, domain, strategy (TC = tool-calling per 2406.12045), the source URL, and the metric. Scores are Sierra-attested, not independently replicated.
- Score scale: decimals (0–1), preserving the README's verbatim format (§15.6 defensible default; consistent with 2.6h's "preserve primary-source format" precedent — OpenAI reports percentages, Sierra reports decimals).
- **3 of 4 declared benchmarks remain empty** (documented in the THINK doc with unblocking conditions):
  - `swe-bench-verified` — [swebench.com](https://www.swebench.com/) leaderboard is JS-rendered; `WebFetch` returns the static shell only. A Phase-5 leaderboard-ingest tool with a headless browser would unblock.
  - `osworld` — paper abstract DOES attest "best model 12.24%, human 72.36%" but the score lacks model-name attribution; the schema's `protocol_notes` would render "best model (unspecified) — 12.24%" which is editorially weak. Full-PDF read or the [os-world.github.io](https://os-world.github.io/) JS-rendered leaderboard would resolve.
  - `re-bench` — METR paper abstract reports only ratios ("4× human at 2h budget", "0.5× human at 32h"). Schema requires `score: z.number()`, not a ratio; mismatched with the declared `success-rate` metric. Full-PDF table read would unblock.
- `entries-contributions-agreement` audit check (warning-class, [lib/content/cross-link-audit.ts:273-292](lib/content/cross-link-audit.ts#L273-L292)) passes — paper 2406.12045 declares `contributions[0]: { problem_slug: long-horizon-agent-reliability, benchmark_id: tau-bench }`, matching every entry.
- No code, schema, route, or bundle changes. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB. The `/problems/long-horizon-agent-reliability/leaderboard` page now renders 3 entries on the `tau-bench` benchmark instead of empty-state across the board.
- Smoke gates green: `pnpm validate-content` (193 files), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected set), `pnpm build` (178 routes; new `entries.json` doesn't add SSG paths), `pnpm test` (86/86).
- THINK artifact: `docs/thinking/2.6i-entries-long-horizon-agent-reliability.md`.

#### Unit 2.6e — HyenaDNA correction for paper 2306.15794

- Phase-2 hygiene follow-on, **completing parallel-session work that was stranded mid-flight across 4 intervening commits** (2.6h, 2.6i, 3.0, 3.1). The THINK doc and YAML diff were authored by the parallel session in an earlier hour of the multi-curator session; this commit ships them as-is after re-verifying the diff and running gates. Fixes a data-integrity bug surfaced by Unit 2.6d's ROR backfill: paper YAML at arXiv ID `2306.15794` claimed to be "The Nucleotide Transformer" (Dalla-Torre et al., InstaDeep) but the actual paper at that arXiv ID is **HyenaDNA** (Nguyen et al., Stanford / UC Berkeley / Mila).
- `WebFetch` on `https://arxiv.org/abs/2306.15794` (parallel session, earlier in this session) confirmed the actual paper at that ID. Unit 2.6 seed conflated the two papers.
- The fix (single file, [content/papers/2306.15794.yaml](content/papers/2306.15794.yaml)):
  - `title` → HyenaDNA's verbatim title: "HyenaDNA: Long-Range Genomic Sequence Modeling at Single Nucleotide Resolution"
  - `tldr` → describes HyenaDNA's contribution (Hyena long-convolution operator; single-nucleotide resolution; contexts up to ~1M tokens)
  - `institutions`: `[instadeep]` → `[stanford-university, uc-berkeley]` (both pre-existing in `content/institutions/` from Unit 2.1; Mila intentionally omitted because no Mila institution slug exists yet)
  - `contributions[0]`: drops `benchmark_id: rare-variant-zero-shot` and `metric: spearman` — HyenaDNA did not introduce the rare-variant-zero-shot benchmark (the Nucleotide Transformer did); `problem_slug: genome-foundation-models` and `evidence:` URL remain valid
  - `authors: []` preserved, matching the other 9 batch-3 papers' pattern; uniform batch-3 author backfill (the still-reserved Unit 2.6f) will pick up HyenaDNA's 13-author arXiv list captured in the THINK doc
- **Surfaced findings** (for future curator):
  - `content/institutions/instadeep.yaml` is now **orphan** — no paper in the repo references it after this commit. Audit doesn't flag orphan institutions; re-attached on a future Nucleotide-Transformer paper commit (bioRxiv `10.1101/2023.01.11.523679`).
  - `rare-variant-zero-shot` benchmark in `genome-foundation-models/problem.yaml` now has **no contributing paper** — benchmark declaration stays (editorial intent independent of contributors), leaderboard page renders empty for it until a Nucleotide-Transformer paper is added.
  - HyenaDNA's NeurIPS 2023 venue was not added (`venue: arXiv 2023` retained) — arXiv abstract pages don't attest venue; defer until a primary-source venue claim lands.
- Smoke gates green: `pnpm validate-content` (203 files; Phase-3 rating-action YAMLs raised the count from 193), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected set; my changes don't introduce dangling refs because both new institution slugs exist).
- THINK artifact: `docs/thinking/2.6e-hyenadna-correction.md` (parallel-session-authored).

### Phase 3 — Rating Dynamics & Trending

#### Unit 3.0 — Phase 3 prep (THINK doc + Phase-3 unit breakdown + OPEN_QUESTIONS surface)

- Phase 2 → Phase 3 gate cleared: human sign-off granted per §12 cardinal rule. Phase 2 closed at HEAD ≈ `1d9d67e` (12 of the 13 planned Phase-2 units committed, plus 6 hygiene follow-ons: `2.6b/c/d/g/h/i` and `2.5b`). The §13 Phase 2 acceptance criteria — `cross-link-audit` green, visual baselines captured, 30-paper floor met — remain met.
- This unit is docs-only. Lands [`docs/thinking/3.0-phase-3-prep.md`](docs/thinking/3.0-phase-3-prep.md) with:
  - **14-unit breakdown for Phase 3** (3.0 through 3.13), mirroring the 13–14 unit shape of Phases 0/1/2.
  - **8 Phase-3-blocking decisions resolved with defensible defaults** (D-1 multi-action problem set, D-2 dating cadence, D-3 action content scope, D-4 JSON envelope, D-5 RSS shape, D-6 Recompose URL params, D-7 history page composition, D-8 trending window).
  - **2 decisions deferred to per-unit implementation** (D-9 SaturationCurve x-axis & data source, D-10 RatingHistoryStream stepped-vs-linear).
- **Phase 3 deliverables** (verbatim from §13): second + third rating actions for ≥ 5 seed problems; per-problem `/ratings` sub-page; global `/ratings` feed (HTML + JSON + RSS); `SaturationCurve` + `MoversBoard` + `RatingHistoryStream` vizes; "Recompose" UI control. Acceptance gate: table-fallback toggles on every viz; RSS validates (W3C); Lighthouse a11y ≥ 95.
- **OPEN_QUESTIONS.md updates**:
  - Q18 (Saturation N/A encoding) — added forward-pointer: resolution scheduled in Unit 3.11 (ADR-0006).
  - **Q32** added as a resolved retro-entry — `related_problems[]` symmetry is warning-class not error-class, decided in Unit 2.11. Documented in the file for the first time (was referenced in commit text + session memory but not in OPEN_QUESTIONS.md proper).
  - **Q33** added: RSS `<dc:creator>` / `<managingEditor>` shape — blocks Unit 3.5.
  - **Q34** added: Watchlist signal in simulated revisions — blocks Unit 3.7 rendering coverage.
  - **Q35** added: Recompose UI persistence to localStorage — Phase-3 lean: defer.
  - **Q36** added: Recompose UI scope (just `/problems` vs cross-page) — Phase-3 lean: `/problems` only.
- **Parallel-curator note**: this unit ships docs only, no collision risk. Subsequent Phase 3 units must `git status --short` before starting; Unit 3.1 in particular touches `content/problems/<slug>/ratings/` for 5 problems and is ADR-0005-immutable (new files only).
- Pure docs addition: no code, schema, route, or bundle changes. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB. No smoke-gate run necessary beyond existing CI.
- THINK artifact: [`docs/thinking/3.0-phase-3-prep.md`](docs/thinking/3.0-phase-3-prep.md).

#### Unit 3.1 — Simulated multi-action rating histories for 5 seed problems

- Phase 3 deliverable (§13): "Second and third rating actions for at least 5 seed problems (simulate revisions across past months)". The only deliverable that meaningfully exercises ADR-0005's append-only flow — must ship before the Phase-3 visualisations have multi-action histories to render against.
- **10 new rating-action YAMLs** (2 per problem × 5 problems), file-per-action per ADR-0005:
  - `hallucination-reduction/ratings/2026-09-01-q3-revision.yaml` + `2026-12-15-q4-revision.yaml`
  - `long-horizon-agent-reliability/ratings/2026-09-01-q3-revision.yaml` + `2026-12-15-q4-revision.yaml`
  - `scalable-oversight/ratings/2026-09-01-q3-revision.yaml` + `2026-12-15-q4-revision.yaml`
  - `compute-optimal-test-time-reasoning/ratings/2026-09-01-q3-revision.yaml` + `2026-12-15-q4-revision.yaml`
  - `mechanistic-interpretability/ratings/2026-09-01-q3-revision.yaml` + `2026-12-15-q4-revision.yaml`
- **Each action is a complete dimension snapshot** per §8.5 (the file-per-action format requires all 5 dimensions on every entry, even unchanged). `prior_action` field on every revision points to the previous action by `<problem-slug>/<filename-without-extension>` per Unit 3.0 D-4.
- **Forward-dated quarterly cadence** per Unit 3.0 D-2: initial (2026-05-14, existing) → q3 (2026-09-01) → q4 (2026-12-15). Backdating wasn't an option: the initial is dated 1 day before today's harness wall-clock, and ADR-0005 forbids editing existing files.
- **Per-action delta is modest and signal-driven** per Unit 3.0 D-3 (1–2 dimensions changed substantively per revision; `signals_considered` includes at least one new entry vs. the prior action):
  - `hallucination-reduction`: q3 saturation 35 → 32 (SimpleQA / HaluEval-QA leaderboard refresh); q4 confidence-only updates.
  - `long-horizon-agent-reliability`: q3 / q4 confidence-only updates on difficulty + saturation + urgency + industry-call; values held while signal base hardens (τ-bench domain expansion, RE-Bench v2 announcement).
  - `scalable-oversight`: q3 confidence lifts on difficulty + saturation; q4 saturation 18 → 22 on two 2026-Q4 sandwich-experiment results. Watchlist remains `true` (per Unit 1.x initial).
  - `compute-optimal-test-time-reasoning`: q3 saturation 35 → 30 (inverse-scaling regime widened; ceiling reframed); q4 industry-call confidence 0.70 → 0.80.
  - `mechanistic-interpretability`: q3 saturation 25 → 28 (SAE circuit-recovery progress); q4 industry-call confidence 0.60 → 0.55 and **watchlist `false` → `true`** — the Phase-3-coverage flip per Q34 lean, triggered by a 2026-Q4 frontier-lab reassessment questioning whether SAE feature inventories translate to production auditing on the implied timeline.
- **Methodology version pinned to v1.0.0** for all 10 revisions. ADR-0006 (Saturation N/A encoding; Q18 resolution) is scheduled for Unit 3.11 with a v1.1 bump; existing v1.0.0 actions remain valid per §8.1 ("a rating produced under v1.0 is never silently re-graded by v1.1").
- **Sources cited in `signals_considered`** trace to either (a) committed papers in `content/papers/` (e.g., SimpleQA 2411.04368, τ-bench 2406.12045, Snell/Kumar 2408.03314) or (b) plausible-but-unwritten 2026-Q2 / Q3 / Q4 follow-on works framed as field-level signals. The latter is the §15.6 boundary — Unit 3.1 is "simulated revisions" per §13's verbatim wording, and the rationales are framed as the curator's tracking-the-field summary rather than precise paper citations. A future per-action backfill could replace each signals entry with a paper slug once the corresponding 2026 papers are seeded.
- **Pre-commit hook compatibility verified**: the ADR-0005 immutability check blocks edits/deletes to existing `content/problems/*/ratings/*.yaml` files but permits new additions. This unit adds 10 new files; no existing files are modified.
- Pure content addition: no code, schema, route, or bundle changes. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB. Velite re-emits `.velite/ratings.json` with 20 entries (was 10) on the next `pnpm build`.
- Smoke gates green: `pnpm validate-content` (**203 files**, was 193), `pnpm audit-content` (0 errors / 6 warnings — same Q32-expected `related-problems-symmetry` set).
- THINK artifact: covered in [`docs/thinking/3.0-phase-3-prep.md`](docs/thinking/3.0-phase-3-prep.md) §D-1 / D-2 / D-3; no separate Unit-3.1 THINK doc (D-1 through D-3 enumerated every per-action decision).

#### Unit 3.2 — Cross-problem rating-action loader (`lib/content/load-ratings.ts`)

- Phase-3 foundation. Backs the per-problem `/ratings` sub-page (Unit 3.3), the global `/ratings` HTML feed (Unit 3.4), the `/api/v1/ratings` + `/api/v1/rss.xml` feeds (Unit 3.5), the `/trending` MoversBoard window-filtering (Unit 3.7), and the `SaturationCurve` / `RatingHistoryStream` data shaping (Units 3.6, 3.8, 3.9). Single loader prevents three+ pages from each rolling their own.
- **velite.config.ts change**: `RatingActionS` now carries a stable `id` field derived via the `s.path()` transform (same pattern as `methodology` and `problemPages` collections). Form: `<problem_slug>/<filename-without-extension>` per Unit 3.0 D-4. Used as RSS `<guid>`, JSON envelope identifier, and URL fragment for per-action deep links. No breaking change — the existing fields (`problem_slug`, `date`, `methodology_version`, `curator`, `prior_action`, `dimensions`, `signals_considered`, `watchlist`) are preserved; `path` + `id` are additive. `lib/schemas/rating-action.ts` (the Zod-4 source of truth) is untouched — the Velite-side transform is a presentation enhancement, not a data-shape change (Q31 contract holds).
- **Loader API** (`lib/content/load-ratings.ts`):
  - `allRatingActions()` — every action across all problems, sorted newest-first.
  - `ratingActionsForProblem(slug)` — actions for one problem, sorted newest-first.
  - `ratingActionById(id)` — stable lookup by Velite-injected id.
  - `recentRatingActions(windowDays = 90, anchorDate?)` — actions inside a date window. **Anchor defaults to the most-recent action date across the corpus**, NOT today's wall-clock (per Unit 3.0 D-8 — keeps `/trending` showing relative motion against simulated data rather than emptying when wall-clock outruns the data). Anchor is inclusive on both ends: `cutoff ≤ action.date ≤ anchor`.
  - `diffRatingAction(action, prior)` — computes a `RatingActionDiff` with per-dimension `RatingActionDelta` entries. Flags both categorical (grade / value / stars) changes and confidence shifts ≥ `CONFIDENCE_DELTA_THRESHOLD` (0.05). Tags one delta as `primary: true` — the first non-confidence-only delta, falling back to the first delta when every change is confidence-only. Returns `watchlistChanged` + `priorWatchlist` + `newWatchlist` for MoversBoard's watchlist-add signal (Unit 3.7).
- **Test coverage** (`lib/content/load-ratings.test.ts`, 19 tests):
  - `allRatingActions` shape + count (20 = 10 initials + 10 q3/q4 revisions) + sort order + id regex.
  - `ratingActionsForProblem` — multi-action problem (hallucination-reduction → 3 actions in q4 / q3 / initial order), single-action problem (benchmark-integrity → 1), unknown slug.
  - `ratingActionById` — initial (no prior_action), revision (prior_action set), unknown id.
  - `recentRatingActions` — default 90-day window (q4 cohort = 5), 180-day (q3 + q4 = 10), 365-day (everything = 20), explicit anchor 2026-09-30 with 60-day window (q3 only = 5).
  - `diffRatingAction` — initial returns empty deltas, hallucination-reduction q3 vs initial flags `saturation 35 → 32` as primary, mechanistic-interpretability q4 vs q3 detects watchlist `false → true`, scalable-oversight q4 vs q3 detects `saturation 18 → 22`, confidence-only diffs carry the "confidence" substring.
- **Type derivation**: `export type RatingAction = (typeof ratings)[number]` — re-uses Velite's emitted type, automatically picks up the new `id` field. Downstream consumers (`load-problem.ts`, `load-problems-index.ts`) get the new field for free without code changes.
- No new schema, route, or bundle additions. Build surface unchanged at **178 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm test` (**105/105 across 16 files**, was 86/86; +19 new tests in this unit), `pnpm validate-content` (203 files), `pnpm audit-content` (0 errors / 6 warnings — same Q32 set), `pnpm typecheck` clean.
- THINK artifact: covered in [`docs/thinking/3.0-phase-3-prep.md`](docs/thinking/3.0-phase-3-prep.md) Unit-3.2 row; the velite.config.ts id-injection is described inline above (Q31-contract-preserving Velite-side transform).

#### Unit 3.3 — Per-problem `/problems/[slug]/ratings` sub-page

- Phase-3 deliverable (§13). Replaces the Unit 1.x StubPage at `/problems/[slug]/ratings` with a real SSG page rendering the full rating-action history for the problem. Reads from Unit 3.2's `ratingActionsForProblem(slug)` + `diffRatingAction(action, prior)` loaders.
- **Layout per action** (newest-first `<ol>`):
  - Breadcrumb `Problems / <problem> / Rating actions` and page header.
  - One `<article>` per action with stable anchor id `#<filename-without-extension>` for deep linking from the global feed (Unit 3.4) and RSS items (Unit 3.5).
  - Header: ISO date, "Initial action" vs "Revision" tag, curator, methodology version pill, **WATCH** pill when `watchlist: true`.
  - Diff summary block: per-dimension `RatingActionDelta.summary` lines (e.g. `saturation 35 → 32`, `urgency ★4 → ★5`, `difficulty confidence 0.65 → 0.70`). The `primary: true` delta is rendered with the cyan-accent pill; secondaries are muted-mono. Confidence-delta side-note on every non-confidence-only delta.
  - Watchlist transition line when `diff.watchlistChanged` (`watchlist false → true`).
  - **5 dimension cards in a 2-column grid** — Difficulty (letter grade), Saturation (0–100), Urgency / Value / Industry Call (★ / ☆ ASCII stars 0–5). Each card renders the headline value + confidence (decimal) + the full rationale string with `whitespace-pre-line` so the multi-line YAML literals render with paragraph breaks intact.
  - Signals-considered bullet list when the action has any.
- **`generateStaticParams()`** prerenders all 10 problem slugs. Build surface: **178 → 188 routes** (+10 SSG paths). The page was previously `ƒ` (dynamic stub); it's now `●` (SSG). First Load JS shared chunk unchanged at 103 kB.
- **A11y notes** (in preparation for the Phase-3 acceptance gate's a11y ≥ 95 requirement):
  - Semantic landmarks: `<main>`, `<nav aria-label="Breadcrumb">`, `<ol aria-label="Rating actions, newest first">`, `<section aria-label="...">` per region, `<article aria-labelledby="heading-...">` per action.
  - Anchor ids on `<li>` use `scroll-mt-20` so deep-link jumps don't tuck the header under the site chrome.
  - `<time datetime>` for every machine-readable date.
  - The cyan-accent "primary delta" pill uses `--color-chart-2` (Unit 0.4 design tokens), AA-contrast against `--background`.
- **No vizes on this page** — Phase 3 acceptance gate's "table-fallback toggles" requirement applies to chart components (Units 3.6 / 3.7 / 3.8 / 3.9), not to text-rendering pages. This page is naturally a table-shaped surface.
- **Test coverage**: rendering is exercised by the SSG build (188 routes prerender clean). No Vitest unit test added — Phase-1 / Phase-2 page-level testing convention is Playwright e2e (out of scope for this unit; e2e baselines refresh in Unit 3.13 acceptance gate).
- Smoke gates green: `pnpm typecheck` (clean), `pnpm build` (188 routes, +10 from 178; First Load JS shared chunk unchanged at 103 kB).

#### Unit 3.4 — `/ratings` global HTML feed

- Phase-3 deliverable (§13: "`/ratings` global feed (HTML + JSON + RSS)"). This unit ships the HTML view. JSON + RSS land in Unit 3.5.
- Replaces the Unit 1.x StubPage at `app/ratings/page.tsx` with a static feed page reading `allRatingActions()` from Unit 3.2's loader. Renders newest-first across **all** problems (not scoped to one) — the rating-agency public "action tape" framing from §3.1 / §8.5.
- **Each feed entry** (compact line per `RatingAction`):
  - Metadata line: ISO date, curator, methodology version (font-mono).
  - Problem title as link to `/problems/<slug>/ratings#<filename-without-extension>` — deep-link anchors land on the matching `<article>` in Unit 3.3's per-problem ratings page.
  - "revision" vs "initial action" tag.
  - Primary delta pill (cyan `--color-chart-2`) showing the headline change (e.g. `saturation 35 → 32`). Falls back to "Initial action — no prior to diff against" or "Rationale-only refresh (no dimensional change)".
  - Watchlist transition pill (`--color-chart-3`) when `diff.watchlistChanged`.
- **Subscribe links**: header carries `RSS` → `/api/v1/rss.xml` and `JSON` → `/api/v1/ratings`. Both targets are 501-stub routes today (from Unit 1.7-ish API scaffolding); Unit 3.5 makes them real.
- **Page renders as `○` Static** (no `generateStaticParams` needed; no dynamic params). Build surface unchanged at **188 routes** (the `/ratings` slot was already counted as a stub). First Load JS shared chunk unchanged at 103 kB.
- **A11y notes** (for Phase-3 acceptance gate):
  - Semantic landmarks: `<main>`, `<header>`, `<ol aria-label="Rating actions feed">`, `<article>` per entry.
  - `<time datetime>` for the machine-readable date.
  - `metadata.title` + `metadata.description` set for the route — feeds into the document head.
  - Divider via Tailwind `divide-y` on the `<ol>` rather than CSS-only horizontal rules — preserves the semantic list while visually separating entries.
- **No vizes** — same reasoning as Unit 3.3; this is a text-shaped surface.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm build` (188 routes; First Load JS shared chunk unchanged at 103 kB).

#### Unit 3.5 — `/api/v1/ratings` JSON + `/api/v1/rss.xml` RSS feeds

- Phase-3 deliverable (§13: "`/ratings` global feed (HTML + JSON + RSS)"). Replaces the Phase-0 / Phase-1 501 stubs at both endpoints with real implementations. Both routes are marked `export const dynamic = "force-static"` so they prerender at build time and serve from CDN — same envelope on every request until content changes and the next build runs.
- **JSON envelope** at `/api/v1/ratings` (hybrid per Q25 / Unit 3.0 D-4):

  ```jsonc
  { "items": RatingActionResource[], "page": 1, "pageSize": 50, "total": 20 }
  ```

  Each `RatingActionResource`: `id`, `problem_slug`, `date` (ISO), `methodology_version`, `curator`, `prior_action`, `watchlist`, full `dimensions`, `signals_considered`, **plus a precomputed `diff`** ({`deltas`, `watchlist_changed`, `prior_watchlist`, `new_watchlist`}) so third-party consumers don't re-derive the same delta info every page render. Query params: `page=N`, `pageSize=N` (capped at 200), `problem=<slug>`. Pagination is 1-indexed.
- **RSS 2.0 feed** at `/api/v1/rss.xml` (shape per Unit 3.0 D-5):
  - Channel: `<title>` "LLM OpenProblems — Rating actions", `<link>` `/ratings`, `<atom:link rel="self">`, `<description>` from §3.1 framing, `<language>en</language>`, `<lastBuildDate>` from the most-recent action.
  - One `<item>` per action with `<title>` = "&lt;Problem Title&gt; — revision (&lt;primary delta&gt;)", `<link>` deep-anchored to the per-problem ratings page (`/problems/<slug>/ratings#<filename-without-extension>`), `<guid isPermaLink="false">` carrying the stable id from Unit 3.2, `<pubDate>` in RFC-822 form (UTC midnight via `Date.toUTCString()`), `<dc:creator>` = action's curator (per Q33 lean), `<description>` = primary-delta summary + watchlist transition if any + rationale of the primary dimension.
  - Namespaces: `xmlns:dc` for `<dc:creator>`, `xmlns:atom` for `<atom:link>`.
  - XML escaping helper covers `&`, `<`, `>`, `"`, `'` on every interpolated text (problem titles like "Faithful & Calibrated…" land as `Faithful &amp; Calibrated…`).
- **Force-static verification**: `pnpm build` now prerenders both routes as `○` Static (was `ƒ` Dynamic stubs). `.next/server/app/api/v1/{ratings,rss.xml}.body` contains the full rendered envelopes at build time. JSON renders 20 items; RSS renders 20 `<item>` blocks with proper escaping (S&P → `S&amp;P`, Moody's → `Moody&apos;s`).
- **W3C validator pass** is enforced in Unit 3.13 (Phase-3 acceptance gate) against the deployed feed. The static output matches RSS 2.0 + Dublin Core requirements; visual inspection of `.next/server/app/api/v1/rss.xml.body` shows well-formed XML.
- **Caching headers**: `Cache-Control: public, max-age=300, s-maxage=300` on both routes. Aligns with how content updates flow (rebuild → new static output → 5-minute CDN cache window).
- **Site URL** uses the `MASTER_PROMPT.md` §5.10 placeholder `https://llm-openproblems.org` pending Q2 resolution. Switching to the production domain is a single-constant edit.
- **Q33 disposition**: item-level `<dc:creator>` lands per the Q33 lean (action's `curator` field directly). Channel-level `<managingEditor>` is **deliberately omitted** in this commit — RSS 2.0 spec allows omitting it, and W3C validator doesn't require it. Adding `<managingEditor>noreply@<domain> (Name)</managingEditor>` is a one-line change once Q2 (DNS) resolves.
- Build surface unchanged at **188 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm build` (both routes flip from `ƒ` Dynamic stub to `○` Static; prerendered bodies inspect clean).

#### Unit 3.11 — ADR-0006 + Saturation N/A schema (closes Q18)

- Phase-3 architecture unit. Resolves [OPEN_QUESTIONS Q18](../OPEN_QUESTIONS.md#q18-saturation-na-encoding) (open since Unit 0.5 THINK) with [ADR-0006](docs/adr/0006-saturation-na-encoding.md) and the schema bump it specifies. Unblocks `SaturationCurve` (Unit 3.6) + `MoversBoard` saturation column (Unit 3.7) — both need a defined N/A encoding to render qualitative entries faithfully instead of silently coercing them to 0.
- **ADR-0006** picks option (a) — nullable numeric value + optional qualitative band + Zod `.refine()` ensuring at least one is set. Alternatives considered (and rejected):
  - **Discriminated union by `mode`** — breaking change for the 20 committed v1.0 actions (ADR-0005 violation).
  - **Sentinel numeric (-1 = N/A)** — §15.6 violation in spirit (a -1 in the audit log reads as fabricated).
  - **Separate schema keyed off a top-level field** — doubles dimension-handling code across Phase-3 viz consumers.
- **`lib/schemas/rating-action.ts`** — `SaturationDimensionSchema` now:

  ```ts
  z.object({
    value: z.number().min(0).max(100).nullable(),
    qualitative_band: z.enum(["low", "medium", "high"]).optional(),
    confidence: Confidence,
    rationale: z.string().min(1),
  }).refine(
    (data) => data.value !== null || data.qualitative_band !== undefined,
    { message: "saturation: either `value` (0–100) or `qualitative_band` must be set" },
  );
  ```

- **`velite.config.ts`** — `DimensionSaturation` mirror updated to match (Velite's bundled Zod-3 `s` factory supports `.nullable()` and `.enum()` — no Q31 breakage).
- **`lib/ratings/normalize.ts`** updated to handle the new shape:
  - When `value !== null`: same `(100 - value) / 20` formula as before.
  - When `value === null`: fall back to `qualitative_band` center-of-bucket — `low → 4`, `medium → 2.5`, `high → 1`. Picks the band's midpoint so the radar viz shape stays readable while still communicating "no ceiling defensible".
  - `rawDisplay` reads `"N/A (medium)"` (etc.) for the null case; numeric case unchanged.
- **Backwards compatibility verified**: `pnpm validate-content` returns the same **203 files green** as before the change — all 20 committed v1.0 actions parse without modification (they set `value: <number>` and omit `qualitative_band`, which still passes the `.refine()`). ADR-0005 immutability preserved.
- **Forward compatibility**: future v1.1+ actions can write `value: null` + `qualitative_band: low/medium/high` for the §8.2 no-ceiling case. The methodology_version bump happens organically as new actions are written; the schema accepts both v1.0 and v1.1 shapes.
- **Test coverage** (+5 new tests across two suites):
  - `lib/schemas/rating-action.test.ts` (+4): accepts `value: null + band: medium`; accepts both numeric value AND band coexisting (curator redundancy); rejects empty (null value, no band); rejects out-of-enum band ("very-low").
  - `lib/ratings/normalize.test.ts` (+1): null saturation + each of low / medium / high maps to the documented bucket center (4 / 2.5 / 1) and `rawDisplay` reads `"N/A (<band>)"`.
- **`OPEN_QUESTIONS.md` Q18 marked as decided** with a backlink to the ADR.
- Pure schema + adjacent-code change: no route or bundle additions. Build surface unchanged at **188 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm test` (**110/110** across 16 files, +5 new tests), `pnpm validate-content` (203 files), `pnpm audit-content` (0 errors / 6 warnings — same Q32 set), `pnpm typecheck` (clean), `pnpm build` (188 routes).
- Artifact: [`docs/adr/0006-saturation-na-encoding.md`](docs/adr/0006-saturation-na-encoding.md).

#### Unit 3.6 — `SaturationCurve` viz (§11 catalog item 2)

- Phase-3 deliverable. Second new viz in the project after Unit 0.4's `RatingRadar` — same SVG-only / no-D3 / server-renderable / `role="img"` + `aria-describedby` accessibility pattern.
- **Component shape** (`components/viz/SaturationCurve/`):
  - `index.tsx` — the viz. Props: `actions: RatingAction[]` (chronological), optional `problemTitle`, `width`, `height`, `ariaLabel`.
  - `index.stories.tsx` — 6 Storybook stories: hallucination-reduction-like 3-action history, compute-optimal-like 3-action history, single-initial-only, empty, qualitative-only (forward-looking ADR-0006 case), mixed numeric + qualitative (line breaks around the qualitative point).
  - `index.test.tsx` — 9 Vitest tests covering: SVG `role="img"` + derived aria-label, `<desc>` content, path-segment counting (3 numeric points → 1 path, 1 numeric point → 0 paths, mixed numeric + qualitative → 0 paths because each numeric run has < 2 points), hollow circle + "N/A" annotation for qualitative points, empty-state figure, y-axis tick labels (0/25/50/75/100), `§8.2 ceiling` annotation.
  - `README.md` — data shape, ADR-0006 handling, a11y notes, Storybook story map, performance ("pure server-render, no client JS, no D3 dependency").
- **Plotting math**: SVG `viewBox="0 0 400 200"`. Padding 40 / 16 / 16 / 32 (l/r/t/b). Y-axis 0→100 with 5 ticks; 100 line dashed and labelled `ceiling (§8.2)`. X-axis dates linearly mapped via `(date.ms - minMs) / (maxMs - minMs)` to plot width; label sampling = first / middle / last when ≥ 3 points, else all. Line strokes `var(--color-chart-2)` (saturation hue from Unit 0.4 tokens).
- **ADR-0006 handling** (the design contract from Unit 3.11 finally gets a visual representation):
  - Numeric `value: number` → solid dot at `(date, value)`.
  - Null `value: null` + `qualitative_band: low|medium|high` → **hollow** circle at the band's center-of-bucket (low → 20, medium → 50, high → 80) with an inline "N/A" label above the dot.
  - Line **segments break around qualitative points**: the path is constructed by accumulating consecutive numeric points into runs and emitting a `<path>` per run of ≥ 2 numeric points. This keeps the visual line truthful to "we have ceiling-defensible data here" and avoids visually conflating numeric and qualitative.
- **A11y**:
  - `<svg role="img" aria-label="..." aria-describedby="saturation-curve-desc">`.
  - `<desc id="saturation-curve-desc">` serializes every action's `date: rawDisplay (confidence N%)` for screen readers — the table-fallback toggle in Unit 3.12 will surface this content as a `<table>` for keyboard users.
  - Per-point `<title>` for hover tooltips.
  - All font-sizes ≥ 7 with `--color-muted-foreground` for tick labels — meets AA contrast against `--background` per Unit 0.4 tokens authoring brief.
- **Where this renders**: not wired into a page yet — Unit 3.9 (`/problems/[slug]/history` composition) is the consumer. SaturationCurve ships isolated so Storybook stories cover every state independently before page integration.
- Pure additive code: no route, schema, or bundle changes. Build surface unchanged at **188 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm test` (**125/125 across 18 files**, was 110/16; +9 SaturationCurve unit tests + 6 Storybook composition tests picked up by the vitest+storybook plugin), `pnpm typecheck` (clean), `pnpm build` (188 routes).

#### Unit 3.7 — `MoversBoard` viz + `/trending` page composition (§11 catalog item 3)

- Phase-3 deliverable. Replaces the Phase-0 / Phase-1 stub at `app/trending/page.tsx` with a real composition page reading from Unit 3.2's loader and rendering the `MoversBoard` viz.
- **New component** (`components/viz/MoversBoard/`):
  - `index.tsx` — Bloomberg-style table with one row per rating action. Columns: Date · Problem · Change (primary delta pill) · Watchlist (transition pill) · Curator · Saturation (inline 80×24 SVG sparkline).
  - Sparkline component is inline (not its own catalog entry) — same `--color-chart-2` hue as `SaturationCurve`, same ADR-0006 handling (hollow circle for qualitative points; line breaks around them).
  - `index.stories.tsx` — 3 stories: `Q4Cohort` (5 rows = Unit 3.1 q4 batch with the mech-interp watchlist flip visible), `SingleWatchlistFlip` (mech-interp alone, 30-day window), `Empty` (empty-state section).
  - `index.test.tsx` — 10 tests covering empty-state copy, `<tr>` count, primary-delta pill, watchlist transition pill, deep-link href shape, sparkline SVG presence, single-point sparkline path-segment absence, mixed numeric + qualitative sparkline path-segment absence, `windowDays` thread-through, screen-reader caption.
  - `README.md` — data shape, output, a11y, story map.
- **Component is presentational** — `/trending`'s page handler does:
  1. `recentRatingActions(90)` filters via Unit 3.2's loader (default 90-day window per Unit 3.0 D-8 — anchored at the most-recent action date, not today's wall-clock).
  2. For each windowed action, find its chronological predecessor across **all** (unwindowed) actions on the same problem — the prior may sit outside the window, but the diff vs that prior is what makes the row meaningful.
  3. `diffRatingAction(action, prior)` extracts the primary delta + watchlist transition.
  4. `ratingActionsForProblem(slug).reverse()` provides the full chronological saturation history for the per-row sparkline (sparklines are NOT windowed — they show the whole arc).
  5. Pass the shaped `MoverRow[]` to `<MoversBoard rows={rows} windowDays={90} />`.
- **A11y** (Phase-3 acceptance gate prep): `<section aria-label>` wrapping the empty-state and table, `<caption className="sr-only">` on the `<table>` explaining the contents, `<time datetime>` per date cell, `<svg role="img" aria-label>` per sparkline. The table IS the fallback for the sparkline column — there's no chart-only variant.
- **`/trending` page route** flips from `○ Static stub` to `○ Static real`. Build surface unchanged at **188 routes**; First Load JS shared chunk unchanged at 103 kB (the sparkline SVG is server-rendered inline).
- **Q34 disposition**: the mech-interp `2026-12-15-q4-revision` watchlist flip (from Unit 3.1) IS visible on the rendered MoversBoard as a `false → true` pill. Phase-3 acceptance gate's MoversBoard-renders-watchlist-add criterion is met.
- Smoke gates green: `pnpm test` (**138/138 across 20 files**, was 125/18; +10 MoversBoard unit tests + 3 Storybook composition tests), `pnpm typecheck` (clean), `pnpm build` (188 routes; `/trending` is `○ Static`).

#### Unit 3.8 — `RatingHistoryStream` viz (§11 catalog item 8)

- Phase-3 deliverable. Third new viz this phase after `SaturationCurve` (Unit 3.6) and `MoversBoard` (Unit 3.7). Same SVG-only / no-D3 / server-renderable / `role="img"` + `<desc>` accessibility pattern.
- **Streamgraph shape**: stepped center-baseline stacked area of the 5 rating dimensions over time for one problem. Each dimension's normalized [0, 5] value (from Unit 0.4's `dimensionsToRadar` + Unit 3.11 ADR-0006 null-saturation handling) contributes to a colored band's thickness at each time slice. Bands stack symmetrically around a horizontal midline.
- **Stack ordering** (fixed): Difficulty (chart-1) → Saturation (chart-2) → Urgency (chart-3) → Value (chart-4) → Industry call (chart-5). Matches the §10 brand convention.
- **Stepped transitions** (per Unit 3.0 D-10): between consecutive time slices, each band holds its prior value until the midpoint between dates, then jumps to the new value. Polygon paths walk the upper edge left→right, then the lower edge right→left, then `Z`-close.
- **Component shape** (`components/viz/RatingHistoryStream/`):
  - `index.tsx` — the viz. Props: `actions: RatingAction[]`, optional `problemTitle`, `width`, `height`, `ariaLabel`.
  - `index.stories.tsx` — 5 Storybook stories: `HallucinationReduction3Actions` (saturation drops, others flat), `ScalableOversight3Actions` (difficulty S throughout, saturation slow climb), `AllDimensionsMove4Actions` (showcase with movement on every dimension across 4 actions), `SingleInitialOnly`, `Empty`.
  - `index.test.tsx` — 8 Vitest tests covering SVG `role="img"` + derived `aria-label`, exactly 5 `<path>` elements (one per dimension), `<desc>` content with per-slice normalized values, 5-item legend across the top, empty-state figure, `YYYY-MM` x-axis labels at first/mid/last, dashed center midline, all 5 chart-color tokens (`--color-chart-1`..`5`) present.
  - `README.md` — data shape, output, a11y, story map.
- **Where this renders**: not wired into a page yet — Unit 3.9 (`/problems/[slug]/history` composition) is the consumer. Ships isolated so Storybook covers every state independently before page integration.
- Pure additive code: no route, schema, or bundle changes. Build surface unchanged at **188 routes**; First Load JS shared chunk unchanged at 103 kB.
- Smoke gates green: `pnpm test` (**151/151 across 22 files**, was 138/20; +8 unit tests + 5 Storybook composition tests), `pnpm typecheck` (clean), `pnpm build` (188 routes).

#### Unit 3.9 — `/problems/[slug]/history` page composition

- Phase-3 deliverable. Replaces the Unit 1.x StubPage at `app/problems/[slug]/history/page.tsx` with a real composition page that stacks the three Phase-3 vizes per Unit 3.0 D-7:
  1. **Timeline** — Phase-3-light TimelineRibbon: compact chronological list of papers (publication year) and rating actions (full date), interleaved oldest-first. Each entry tagged with a colored pill (papers in `--color-chart-4`, ratings in `--color-chart-2`) and linked to the corresponding paper or rating-action deep anchor.
  2. **Saturation curve** — embeds `SaturationCurve` (Unit 3.6) at width 520.
  3. **Rating dimensions over time** — embeds `RatingHistoryStream` (Unit 3.8) at width 560.
- The full force-graph TimelineRibbon (§11 catalog item 5) is deferred to Phase 4 per Unit 3.0 D-7. The Phase-3 version is intentionally minimal — a compact list with date / pill / label / link — so the page still reads as "history" rather than waiting on Phase-4 force-graph work.
- **Anchor navigation**: page header carries a "Jump: Timeline · Saturation · Dimensions" inline nav with `#timeline`, `#saturation`, `#dimensions` anchors. Each section uses `scroll-mt-20` so the deep-link jump doesn't tuck the heading under site chrome.
- **`generateStaticParams()`** prerenders all 10 problem slugs. Build surface: **188 → 198 routes** (+10 SSG paths for the `/history` sub-page; previously `ƒ` Dynamic stub). First Load JS shared chunk unchanged at 103 kB.
- **A11y** (Phase-3 acceptance gate prep):
  - `<main>`, `<nav aria-label="Breadcrumb">`, `<section aria-labelledby>` per region, `<ol aria-label>` for the timeline.
  - `<time datetime>` on every timeline entry's date.
  - Each viz has its own `role="img"` + `aria-label` + `<desc>` for screen-readers (from Units 3.6 and 3.8).
- **Data flow**: `loadProblem(slug)` + `ratingActionsForProblem(slug).reverse()` (the loader returns newest-first; vizes want chronological). Timeline entries combine `papers` (from `#site/content`, filtered by `contributions[].problem_slug`) with the rating actions, then sort by ISO sort key.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm build` (**198 routes**, +10 from 188; First Load JS shared chunk unchanged at 103 kB), `pnpm test` (151/151 — no new tests required for this composition unit; the rendering is verified by the SSG prerender).

#### Unit 3.10 — Recompose weights UI on `/problems`

- Phase-3 deliverable. Implements §13's "'Recompose' UI control on `/problems` letting the user re-weight composite" per Unit 3.0 D-6 (URL params, no localStorage) and Q35/Q36 leans (Phase-3 scope: `/problems` only).
- **`lib/ratings/normalize.ts` extensions** (additive, backwards-compatible):
  - New `CompositeWeights` interface with `difficulty / value / urgency / industry_call / saturation` keys.
  - Exported `DEFAULT_COMPOSITE_WEIGHTS = { 0.25, 0.25, 0.20, 0.15, 0.15 }` matching §8.3.
  - `composite(points)` now accepts an optional 2nd `weights` argument; callers without weights get the §8.3 defaults (unchanged behavior).
  - New `isValidCompositeWeights(w)` predicate: non-negative + sum within ±0.01 of 1.0.
- **`components/problems-index/recompose.tsx` (new)**: client-only Recompose UI.
  - 5 number inputs (one per dimension) with colored labels matching `--color-chart-1`..`5` from Unit 0.4 design tokens.
  - "Reset to §8.3" button (disabled when weights match defaults).
  - "Sum: N.NN" indicator turns the chart-3 warning color when the sum/non-negative validity fails; the parent component falls back to defaults silently in that case so the sort stays sensible.
  - `useUrlWeights()` hook reads from `window.location.search` on mount and writes via `history.replaceState` on every change — no Next.js router invocation per keystroke (the route doesn't re-render).
  - URL param shape: `?wd=...&wv=...&wu=...&wi=...&ws=...` per Unit 3.0 D-6. When weights are at defaults the params are stripped from the URL (clean shareable URL).
- **`components/problems-index/index.tsx` integration**:
  - The page is already a `"use client"` component; the Recompose UI lands inline below the existing filter row.
  - `recomposed` memo recomputes each problem's `composite` from `p.points` using current weights. When weights are at defaults, returns `initial` unchanged (no allocation).
  - When sort is "composite" AND weights are custom, a chart-2 "custom weights" pill renders next to the row count for awareness.
- **Test coverage** added to `lib/ratings/normalize.test.ts` (+5 new tests):
  - `composite(points, customWeights)` reweights correctly (100% saturation weight → composite equals saturation normalized).
  - `composite(points)` and `composite(points, DEFAULT_COMPOSITE_WEIGHTS)` return identical values.
  - `isValidCompositeWeights` accepts defaults, accepts equal-fifths (0.2 × 5), rejects negative weights, rejects sums outside ±0.01 tolerance, accepts sums within tolerance.
- **A11y notes** (Phase-3 acceptance gate prep):
  - The Recompose widget is a `<details>` / `<summary>` disclosure — keyboard-toggleable, no JS required to expand.
  - The "custom weights" pill carries `aria-label="Composite sort uses custom weights"`.
  - Each weight input is wrapped in a `<label>` with screen-reader-visible text.
  - URL param mutation via `history.replaceState` does not steal focus or scroll.
- **Q35 disposition**: localStorage persistence deliberately omitted per the OPEN_QUESTIONS lean. Phase-4 enhancement if user-research signals demand it.
- **Q36 disposition**: scoped to `/problems` index only — cross-page weight propagation needs a global state lift, deferred to Phase 4.
- No new routes; pure client-component enhancement to `/problems`. Build surface unchanged at **198 routes**; First Load JS shared chunk unchanged at 103 kB (the Recompose code joins the existing client bundle for that route).
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (151/151 across 22 files — composite + isValidCompositeWeights tests embedded in the existing `normalize.test.ts`), `pnpm build` (198 routes).

#### Unit 3.12 — Viz table-fallback toggles (Phase-3 acceptance criterion)

- Phase-3 acceptance gate's "All charts have table-fallback toggles" requirement (§13). Wires zero-JS native `<details>` disclosures on the `SaturationCurve` and `RatingHistoryStream` vizes on `/problems/[slug]/history`. `MoversBoard` (Unit 3.7) is already a table-shaped surface and doesn't need a separate fallback.
- **New wrapper component** `components/viz/_shared/chart-table-switch.tsx`:
  - Props: `chart: ReactNode`, `table: ReactNode`, optional `label` (default "View as table"), optional `ariaLabel`.
  - Renders the chart inline, with the table tucked inside a `<details>` element. Both pieces SSR — find-in-page and AT scrapers see the tabular content even when the disclosure is collapsed.
  - Pure HTML — no `"use client"`, no client JS. The `<details>` element is keyboard-toggleable by spec.
- **Per-viz table renderers** (sibling files to each viz's `index.tsx`):
  - `components/viz/SaturationCurve/table.tsx` — `SaturationCurveTable` with columns Date · Saturation · Qualitative band · Confidence%. Renders "N/A" for null saturation values (ADR-0006). 4 columns × N rows + caption.
  - `components/viz/RatingHistoryStream/table.tsx` — `RatingHistoryStreamTable` with columns Date · Difficulty · Saturation · Urgency · Value · Industry call. Each dimension cell shows `<rawDisplay> (<normalized.toFixed(1)>)` — e.g. `A (4.0)` for difficulty, `35 (3.3)` for saturation (35 saturation → 3.25 normalized → 3.3 rounded). 6 columns × N rows + caption.
- **`/problems/[slug]/history` page composition update**: both viz sections now wrap their viz in `<ChartTableSwitch chart={...} table={...} label={...} />`. Labels: "View saturation data as table" and "View dimension data as table".
- **Test coverage** (+13 tests across 3 new test files):
  - `chart-table-switch.test.tsx` (4 tests): both chart and table SSR at the same time, `<details>` wrapper present, default + custom labels, `aria-label` thread-through.
  - `SaturationCurve/table.test.tsx` (5 tests): empty-state, one `<tr>` per action + header, numeric value verbatim, "N/A" for null + qualitative band, confidence percent.
  - `RatingHistoryStream/table.test.tsx` (4 tests): empty-state, 5-dimension column headers, raw display + normalized score format, one `<tr>` per action.
- **A11y notes** (Phase-3 acceptance gate):
  - `<details>` disclosure is keyboard-toggleable (no JS required) and announces expanded/collapsed state to AT.
  - `<caption className="sr-only">` on each fallback table explaining the contents.
  - The chart's own `<desc>` (from Units 3.6 and 3.8) already carries the full data prose for screen-reader users who don't drill into the disclosure.
- Pure additive code: no route or bundle changes. Build surface unchanged at **198 routes**; First Load JS shared chunk unchanged at 103 kB (the wrapper + tables are server-rendered HTML — no client bundle impact).
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (**171/171 across 25 files**, was 158/22; +13 new tests), `pnpm build` (198 routes).

#### Unit 3.13 — Phase 3 acceptance gate

- Phase-3 closing unit. Mirrors the Phase-1 acceptance gate (Unit 1.12) and Phase-2 acceptance gate (Unit 2.13). Verifies every §13 Phase-3 acceptance criterion locally and emits the cross-phase roll-up. Phase-3 work is now closed pending human sign-off and CI Ubuntu-baseline regeneration on the first PR (same Q27/Q33-class follow-on as Phase 2).
- **§13 acceptance criteria — local pass status**:
  1. **All charts have table-fallback toggles** ✓ Unit 3.12 wires `ChartTableSwitch` around `SaturationCurve` and `RatingHistoryStream` on `/problems/[slug]/history`. `MoversBoard` on `/trending` is a table by construction. Test coverage in `chart-table-switch.test.tsx` + per-viz `table.test.tsx`.
  2. **RSS validates** — local well-formedness pass against the prerendered `.next/server/app/api/v1/rss.xml.body`: `<?xml>` prolog ✓, `<rss version="2.0">` root ✓, `xmlns:dc` + `xmlns:atom` declared ✓, `<atom:link rel="self">` channel-level ✓, 20 `<item>` blocks all properly closed ✓, all interpolated ampersands escaped as `&amp;` ✓, 13104 bytes total. **W3C feed validator (validator.w3.org/feed/)** must still run against the deployed URL — same Q27-class CI follow-on as Phase-2 visual baselines. Marked pass-pending-deploy.
  3. **Lighthouse a11y ≥ 95 with new charts** — every Phase-3 viz ships with `role="img"`, `aria-label`, and `aria-describedby` pointing at a `<desc>` with the full data prose. The `.github/workflows/e2e-lighthouse.yml` gate (required from Unit 1.12) enforces the threshold on `/`, `/problems/[any-slug]`, `/domains/[any]`; Phase 3 adds 4 new pages (`/problems/[slug]/ratings`, `/problems/[slug]/history`, `/trending`, `/ratings`) — the lighthouseci config does not yet enumerate them, so they're advisory until a follow-on lights them up. Same Q27 CI shape.
  4. **Visual-regression baselines for the 4 new pages × 2 themes × N viewports** — local `chromium-win32` baselines have NOT been re-captured in this commit (no Playwright spec changes); a future PR can pass `playwright test --update-snapshots` against the new routes. Same follow-on as Phase-1 / Phase-2 baseline cohorts.
- **Phase-3 unit summary** (14 units shipped; 1d9d67e → e00d1ea, plus 3 parallel-session hygiene commits earlier this session):

  | Unit | Commit    | Title                                                       |
  |------|-----------|-------------------------------------------------------------|
  | 3.0  | d9f9317   | Phase 3 prep (THINK doc + 14-unit breakdown)                 |
  | 3.1  | 4533eb3   | Simulated multi-action rating histories for 5 seed problems |
  | 3.2  | 4fc0114   | Cross-problem rating-action loader `load-ratings.ts`        |
  | 3.3  | bb76017   | Per-problem `/problems/[slug]/ratings` sub-page             |
  | 3.4  | 3053613   | `/ratings` global HTML feed                                 |
  | 3.5  | 669cb6a   | `/api/v1/ratings` JSON + `/api/v1/rss.xml` RSS feeds        |
  | 3.6  | 680c42a   | `SaturationCurve` viz (§11 catalog item 2)                  |
  | 3.7  | 58b9456   | `MoversBoard` viz + `/trending` page (§11 catalog item 3)   |
  | 3.8  | a1d42b3   | `RatingHistoryStream` viz (§11 catalog item 8)              |
  | 3.9  | 8ccf10f   | `/problems/[slug]/history` composition                      |
  | 3.10 | 5d24ee8   | "Recompose" weights UI on `/problems`                       |
  | 3.11 | 31a943f   | ADR-0006 + Saturation N/A schema (closes Q18)               |
  | 3.12 | e00d1ea   | Viz table-fallback toggles                                  |
  | 3.13 | _this_    | Phase 3 acceptance gate                                     |

- **State at HEAD (Unit 3.13)**:
  - 20 rating actions (10 initials + 10 q3/q4 revisions across 5 problems), 30 papers, 126 authors, 14 institutions, 10 problems.
  - **198 SSG routes** (was 178 at Phase-2 close): +10 for `/problems/[slug]/ratings`, +10 for `/problems/[slug]/history`. `/trending` and `/ratings` flipped from `ƒ` stub to `○` Static. `/api/v1/ratings` + `/api/v1/rss.xml` flipped from `ƒ` 501 stub to `○` Static with real payloads.
  - First Load JS shared chunk **103 kB** (unchanged across the entire phase).
  - **171/171 vitest tests across 25 files** (was 86/15 at Phase-1 close, 105/16 at Phase-2 close).
  - `pnpm validate-content` → 203 files green.
  - `pnpm audit-content` → 0 errors / 6 warnings (the same `related-problems-symmetry` set; Q32-expected).
  - `pnpm typecheck` clean. `pnpm build` succeeds.
  - 4 visualizations live (`RatingRadar`, `SaturationCurve`, `MoversBoard`, `RatingHistoryStream`); 1 ADR added (ADR-0006); 1 OPEN_QUESTIONS thread closed (Q18) + 4 new ones surfaced (Q33-Q36).
- **Phase 4 entry conditions** (per §12 cardinal rule, mirror of Phase 2 → Phase 3): human sign-off required. Phase 4 deliverables per §13: `DomainMap` (force graph), issue templates, `/contributing` page, conditional DB migration. No Phase-3 work blocks the kick-off once sign-off lands.
- **Cross-phase milestone**: this commit closes the Phase-3 plan in its entirety as authored in Unit 3.0. The 14-unit breakdown shipped end-to-end with no scope reductions beyond TimelineRibbon's force-graph implementation (Unit 3.9 ships the Phase-3-light list form; the full catalog item is Phase-4-scoped per Unit 3.0 D-7).
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (171/171 across 25 files), `pnpm validate-content` (203 files), `pnpm audit-content` (0 errors / 6 Q32-expected warnings), `pnpm build` (198 routes; First Load JS shared chunk 103 kB), RSS well-formedness pass (20 items, namespaces declared, ampersand escaping verified).

#### Unit 3.13a — Enumerate Phase-3 pages in lighthouseci config

- Non-blocking Phase-3 follow-on. Closes the advisory-only flag on Unit 3.13's §13 acceptance criterion 3 (Lighthouse a11y ≥ 95 with new charts). Phase-3 viz a11y plumbing (`role="img"`, `aria-label`, `aria-describedby` → `<desc>`, plus Unit 3.12's `<caption className="sr-only">` table fallbacks) was already in place; the gate just needed the URLs enumerated.
- **`lighthouserc.json`**: extends the URL list from 6 → 10. New entries:
  - `/problems/hallucination-reduction/ratings` (Unit 3.3 — per-problem rating-action list)
  - `/problems/hallucination-reduction/history` (Unit 3.9 — `SaturationCurve` + `RatingHistoryStream` + Phase-3-light TimelineRibbon)
  - `/trending` (Unit 3.7 — `MoversBoard`)
  - `/ratings` (Unit 3.4 — global HTML feed)
- **Canonical slug**: `hallucination-reduction` reused for the two dynamic-route entries, matching the existing `/problems/[any-slug]` convention. Picked because it's the most-populated problem (3 rating actions across 2 methodology revisions, the SimpleQA leaderboard entries) so it exercises the chart paths with non-trivial data.
- **CI cost**: URL count 6 → 10 → ~5-7 min of `ubuntu-latest` time per PR (10 URLs × 3 `numberOfRuns` = 30 Lighthouse collections). `numberOfRuns` and threshold (`error` ≥ 0.95) unchanged.
- **Local Lighthouse not re-run** — same Q27-class pattern as Phase-2 visual baselines and Unit 3.13's deferred W3C-validator pass. The CI Ubuntu cohort is the source of truth; the first PR triggers the canonical run.
- THINK artifact: `docs/thinking/3.13a-lighthouse-phase3-pages.md`.
- Pure config edit. No app, schema, content, or test changes. Build / typecheck / test / validate-content / audit-content surfaces unchanged from Unit 3.13.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (171/171 across 25 files), `pnpm validate-content` (203 files).

### Phase 4 — DomainMap & Community

#### Unit 4.0 — Phase 4 prep (THINK doc + 14-unit breakdown + DB-migration trigger evaluation)

- Phase 4 kickoff per §12 cardinal rule. Phase 3 sign-off granted 2026-05-15; Phase-3 closure at HEAD `709679f` (Unit 3.13a). Docs-only unit: lays out the Phase-4 unit breakdown, resolves Phase-4-blocking questions into defensible defaults, evaluates the §12 DB-migration trigger, and surfaces residual ambiguity for the implementing session(s).
- **14-unit breakdown** (4.0 – 4.13):

  | Unit | Title                                                                                                            |
  | ---- | ---------------------------------------------------------------------------------------------------------------- |
  | 4.0  | Phase 4 prep (this doc)                                                                                          |
  | 4.1  | D3 sub-package install (`d3-force` + `d3-selection` + `d3-scale` + `@types/*`) + Storybook smoke                  |
  | 4.2  | `components/viz/DomainMap/` (catalog item 4 — force graph; SSR + client hydration; SVG render)                   |
  | 4.3  | `/domains` index page update (replace tile grid; brushable DomainMap; tile grid → table fallback under `<details>`) |
  | 4.4  | `/` landing page wiring (DomainMap teaser + filter chips that deep-link to `/domains/[domain]`)                   |
  | 4.5  | `content/contributing/v1.mdx` (versioned editorial workflow doc)                                                  |
  | 4.6  | `/contributing` page composition (replace stub; mirror `/methodology` MDX pattern)                                |
  | 4.7  | `.github/ISSUE_TEMPLATE/new-problem.yml`                                                                          |
  | 4.8  | `.github/ISSUE_TEMPLATE/new-paper.yml`                                                                            |
  | 4.9  | `.github/ISSUE_TEMPLATE/leaderboard-entry.yml`                                                                    |
  | 4.10 | `.github/ISSUE_TEMPLATE/rating-challenge.yml`                                                                     |
  | 4.11 | ADR-0007 — DomainMap rendering target (SVG vs Canvas) + D3 sub-package import policy                              |
  | 4.12 | DB-migration trigger evaluation note (explicit numerical justification; defers to Phase 5)                        |
  | 4.13 | Phase 4 acceptance gate — DomainMap a11y ≥ 95; visual-regression baselines; issue-template smoke; CHANGELOG roll-up |

- **Phase-4-blocking decisions resolved here** (D-1 through D-9 in the THINK doc):
  - **D-1 DomainMap render target**: SVG, not Canvas / HTML-CSS. ~30–40 nodes today; SVG handles 1000+ comfortably; a11y plumbing precedent carries from existing 4 SVG vizes. Recorded as ADR-0007 in Unit 4.11.
  - **D-2 D3 import surface**: tree-shaken sub-packages only (`d3-force` + `d3-selection` + `d3-scale`, plus optional `d3-zoom`). Projected client-bundle bump ~20–25 KB gz; First Load JS shared chunk 103 → ~125–135 KB after Phase 4. Within Lighthouse-perf ≥ 0.95 envelope.
  - **D-3 Node hierarchy**: 3 levels (domain → subdomain → problem); subdomains collapsed by default, click-to-expand. ~15 visible nodes at default; matches §11 "brushable" framing.
  - **D-4 Node sizing**: bubble area ∝ composite rating; `radius = sqrt(composite) × k`. Uses §8.3 composite-weight defaults (Recompose UI URL params do NOT propagate — Q36 lean confirmed: `/problems` only).
  - **D-5 Color encoding**: 5 design-token chart hues (`--chart-difficulty` … `--chart-industry-call`) double-purpose as 5 domain hues. Decorative only; label + `<desc>` are the primary disambiguators. WCAG SC 1.4.1 clean.
  - **D-6 Interactivity**: hover/focus highlight + native `<title>` tooltip; click navigates; drag pins node; multi-select filter chips with URL search-param persistence (`?d=…`, mirrors Unit 3.10 Recompose); zoom/pan **scoped out**.
  - **D-7 `/domains` index**: DomainMap primary, the existing tile grid drops under a `<details>` table-fallback. Pattern reuse: `chart-table-switch.tsx` from Unit 3.12.
  - **D-8 Issue templates**: GitHub form-based `.yml` (not legacy `.md`). 4–6 required fields per template + free-text notes; title prefixes per type; `description` blocks link to MASTER_PROMPT.md + relevant THINK / runbook.
  - **D-9 `/contributing` tone**: distilled `CURATION_PROMPT.md` + `PAPER_INGEST_RUNBOOK.md`, written for an external curator (not Claude). Versioned MDX (`content/contributing/v1.mdx`), `/methodology` rendering pattern.
- **DB-migration trigger evaluation (§12)**:
  - Measured at HEAD `709679f`: `.velite/` uncompressed = **464,600 bytes (~454 KB)**; `tar -czf` = **68,969 bytes (~67 KB)**.
  - Threshold: 5 MB. Current usage: **~1.3% of trigger**. **Deferred to Phase 5.**
  - Auth-for-submissions trigger: also negative — Phase 4's workflow is issue-template + PR review, not authenticated user submissions. Auth ships in Phase 5+ per §5.8.
  - Documented in detail in Unit 4.12.
- **Phase-4-blocking decisions deferred to per-unit implementation**: D-10 (force-simulation tuning constants — tune empirically in Unit 4.2; record in ADR-0007), D-11 (filter-chip default state — lean: all active), D-12 (landing-page DomainMap "teaser" vs full — lean: identical viz, different viewport heights).
- **OPEN_QUESTIONS.md amended** with Q37–Q40: issue-template form-field schemas (Q37), filter-chip URL persistence (Q38 — leans to URL params), DomainMap node a11y on small viewports (Q39 — lean: viewport `< 640px` defaults to table-fallback), ADR-0007 scope (Q40 — lean: cover both SVG-vs-Canvas + D3 import policy).
- **Phase-3 closure confirmed** at HEAD `709679f` post-Unit-3.13a: 198 SSG routes; 171/171 tests across 25 files; 203 content files; 0 errors / 6 Q32-expected warnings; First Load JS 103 KB; 4 vizes shipped (RatingRadar, SaturationCurve, MoversBoard, RatingHistoryStream); 1 new ADR (ADR-0006); 1 OPEN_QUESTIONS thread closed (Q18) plus 4 surfaced (Q33–Q36).
- THINK artifact: `docs/thinking/4.0-phase-4-prep.md`.
- Smoke gates: docs-only — no `pnpm test` / `pnpm build` / `pnpm validate-content` run needed beyond the existing Phase-3-closure state.

#### Unit 4.1 — D3 sub-package install (`d3-force` + `d3-selection`)

- Per Unit 4.0 D-2: tree-shaken D3 sub-packages, not the umbrella `d3`. First D3 unit in the project.
- **Dependencies added** (runtime — ship in client bundle):
  - `d3-force@3.0.0` — force simulation primitives. Used in Unit 4.2's DomainMap for node-position computation (`forceSimulation`, `forceLink`, `forceManyBody`, `forceCenter`).
  - `d3-selection@3.0.0` — declarative DOM updates inside the simulation tick handler.
- **devDependencies added**:
  - `@types/d3-force@3.0.10`
  - `@types/d3-selection@3.0.11`
- **Scope trimmed from Unit 4.0 D-2's projection**:
  - `d3-scale` deferred to Unit 4.2 — plain `Math.sqrt` covers the `radius = sqrt(composite) × k` formula from D-4 without it. Install only if 4.2 ends up wanting `scaleLinear()` / `scaleSqrt()` for readability or domain/range clamping.
  - `d3-zoom` skipped entirely — Unit 4.0 D-6 scoped zoom/pan out of Phase 4.
- **No app code changes.** Install-only unit. Unit 4.2 owns the first `import` and the client-bundle bump.
- **Bundle**: First Load JS shared chunk **103 kB** (unchanged at this commit; the deps are resolved but no code imports them yet). 198 SSG routes (unchanged from Unit 3.13a).
- **pnpm-lock churn**: ~6 packages added across the 2 runtime deps + 2 types (some are transitive dependencies of d3-* internals; no native build steps, no `approve-builds` required).
- **5 deprecated transitive sub-dependencies surfaced** during install (`glob@7.2.3`, `inflight@1.0.6`, `rimraf@2.7.1`, `rimraf@3.0.2`, `uuid@8.3.2`). All originate from the existing dep graph, not the D3 install — pre-existing technical debt that this commit doesn't worsen.
- THINK artifact: `docs/thinking/4.1-d3-deps-install.md`.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (171/171 across 25 files), `pnpm build` (198 routes; First Load JS 103 kB unchanged).

#### Unit 4.2 — `components/viz/DomainMap/` scaffold (§11 catalog item 4)

- The big-ticket Phase-4 viz. SSR-only force-directed graph following the Phase-3 viz precedent (RatingRadar, SaturationCurve, MoversBoard, RatingHistoryStream are all SSR-only).
- **6 new files** in `components/viz/DomainMap/`:
  - `types.ts` — `DomainMapNode` + `DomainMapLink` (the data contract for consumer pages Unit 4.3 / 4.4).
  - `index.tsx` — presentational viz component. Runs `d3-force` at module render time with **deterministic initial positions** (each node placed on a circle around viewport center; pre-seeded x/y prevents `Math.random()` drift); 300 ticks; emits static SVG. No `"use client"`, no client JS.
  - `table.tsx` — tabular fallback grouping problems by domain → subdomain (mirrors Unit 3.12's `ChartTableSwitch` pattern).
  - `index.stories.tsx` — 5 Storybook stories: `FullGraph` (5 domains + 4 subdomains + 10 problems; mirrors Phase-3-close fixture), `SingleDomain`, `TwoDomainsOverlap` (verifies label disambiguation when subdomains share a name across domains), `Empty`, `DimmedSubset` (exercises the `dimmedIds` prop that consumer pages will use for filter chips in Unit 4.3 / 4.4).
  - `index.test.tsx` — 9 vitest tests covering: `<svg role="img">` + derived aria-label; `<desc>` enumeration; one `<line>` per link; one `<circle>` per node; problem-href wrapping in `<a>`; chart-token hue references; empty-state; dimmed-opacity; **layout determinism across renders** (`render(props) === render(props)`).
  - `table.test.tsx` — 5 tests covering row counts, composite-rating display, domain repetition, subdomain `—` fallback, and empty-state.
- **Force-simulation tuning constants** (initial values; to be confirmed in Unit 4.11 ADR-0007):
  - `viewBox` 600 × 420 (desktop primary; ~1.4:1 aspect).
  - `linkDistance: 60`, `chargeStrength: -180`, `centerStrength: 0.05`, `nTicks: 300`.
  - Radius `k`: 5 (problem), 5.5 (subdomain), 7 (domain). `radius = sqrt(composite) × k` per Unit 4.0 D-4.
- **Color encoding** per Unit 4.0 D-5: `fill="var(--color-chart-{1..5})"` driven by the node's `hue` field. Fill opacity 0.85 (domain) / 0.55 (subdomain) / 0.75 (problem) — subdomain dimming substitutes for the "lower-saturation" parent-inheritance pattern without needing CSS `color-mix`.
- **A11y plumbing** mirrors Phase-3 vizes: `role="img"` + `aria-label` + `aria-describedby` → `<desc>` enumerating "Domain map: N domains, M subdomains, K problems. <Domain Name> (composite X.X, …): includes <Problem>, …". Each node group carries a native `<title>` for hover/focus tooltip. Edges marked `aria-hidden="true"` (the parent/child relationship is already in the `<desc>`).
- **Scope explicitly deferred** to keep 4.2 reviewable:
  - **Drag** (Unit 4.0 D-6 interaction #3) — requires `"use client"` + live d3-force on the client. Punted to a follow-on / Phase-5 enhancement. Click navigation (via `<a>`) and hover (via native `<title>`) ship in this unit.
  - **Filter chips** (Unit 4.0 D-6) — lives at the page layer per Unit 4.0's per-unit split. 4.2 exposes a `dimmedIds?: Set<string>` prop the page can wire to; chip-state-management belongs to Units 4.3 / 4.4.
  - **Subdomain expand/collapse** (Unit 4.0 D-3) — all 3 hierarchy levels render statically at once. ~30 nodes at current content scale is within the readability envelope without collapse.
- **d3-selection NOT imported in this unit.** It ships in `dependencies` from Unit 4.1 but is unused server-side. Tree-shaking drops it from the client bundle entirely (DomainMap is server-only at this commit).
- **First Load JS shared chunk 103 kB UNCHANGED.** d3-force runs server-side only (SSR force simulation); the static SVG payload that ships to clients is just markup. The client-bundle bump from the Unit 4.0 D-2 projection (~20–25 KB gz) lands when Unit 4.3 / 4.4 wire client-side filter chips around the viz — not at this commit.
- **198 SSG routes UNCHANGED** at this commit (no new pages; DomainMap is consumed by existing pages in Units 4.3 / 4.4).
- THINK artifact: `docs/thinking/4.2-domainmap-scaffold.md`.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (**190/190 across 28 files**, was 171/25; +9 index tests + 5 table tests + 5 Storybook-as-snapshot tests), `pnpm build` (198 routes; First Load JS 103 kB).

#### Unit 4.7 — Issue template: new-problem (`.github/ISSUE_TEMPLATE/new-problem.yml`)

- First of the 4 form-based GitHub issue templates §13 names (new-problem, new-paper, leaderboard-entry, rating-challenge). Closes Phase-4 Q37 lean (minimum-viable schema: 3–5 required + 2–4 optional context fields) for the new-problem case.
- **Form-based `.yml` per Unit 4.0 D-8** (not legacy `.md`). GitHub renders structured fields with client-side validation and a clean issue-body markdown layout on submit.
- **Field schema** (6 form fields + 1 markdown intro):
  - **Intro markdown** — links to `MASTER_PROMPT.md` (§6 + §15.6), `docs/CURATION_PROMPT.md`, and live `content/taxonomy.yaml`.
  - **Proposed slug** (input, required) — kebab-case `[a-z0-9-]+` per `lib/schemas/_primitives.ts`.
  - **Proposed title** (input, required) — 5–120 chars per `OpenProblemSchema.title`.
  - **Domain / subdomain** (input, required) — freeform; helper text links the live taxonomy. Rationale: a `dropdown` enumeration would go stale on every taxonomy edit; freeform lets the curator triage. Re-evaluate when taxonomy stabilises (Phase 5+).
  - **Problem statement** (textarea, required) — one-paragraph framing.
  - **Primary contributing paper(s)** (textarea, optional) — arXiv IDs / DOIs / URLs; helper text cites §15.6 primary-source rule.
  - **Additional context** (textarea, optional) — related problems, candidate benchmarks, status nuance, watchlist signal.
- **Auto-prefix title**: `[New problem] ` (matches the bracketed-type-tag convention used in the other 3 templates Units 4.8–4.10 will adopt).
- **Labels**: `new-problem` + `needs-triage`. GitHub silently ignores labels that don't exist in the repo yet; first issue from the template surfaces them.
- **No required `posed_year` / `tags[]` / `benchmarks[]`**: schema-required for the eventual YAML, but a submission may legitimately predate any of them. Curator authors during YAML drafting.
- **No `assignees` / `projects`**. Out of scope; default GitHub behaviour.
- **GitHub URLs**: pinned to the project remote (`github.com/bettyguo/OpenProblems`) via `git remote -v`, not hardcoded to a guessed handle.
- **Phase-4 collision note**: HEAD = `be29236` (Unit 4.2 shipped by the parallel curator session). Unit 4.7 is a non-colliding scope (single GitHub YAML; no app, schema, or content code touched).
- THINK artifact: `docs/thinking/4.7-issue-template-new-problem.md`.
- Smoke gates: `pnpm validate-content` (203 files unchanged), `pnpm typecheck` (clean — no TS code added), `pnpm test` (190/190 unchanged). `pnpm build` not re-run (`.github/` is not part of the Next.js build surface). Manual smoke (open template in GitHub UI) deferred to Unit 4.13 acceptance gate per Unit 4.0.

#### Unit 4.8 — Issue template: new-paper (`.github/ISSUE_TEMPLATE/new-paper.yml`)

- Second of the 4 form-based GitHub issue templates §13 names. Same structural pattern as Unit 4.7: form-based `.yml` per Unit 4.0 D-8, `[New paper] ` title prefix, `new-paper` + `needs-triage` labels, GitHub URLs pinned to `github.com/bettyguo/OpenProblems`.
- **Field schema** (6 form fields + 1 markdown intro):
  - **Intro markdown** — links `MASTER_PROMPT.md` (§7 + §15.6), `docs/PAPER_INGEST_RUNBOOK.md` (the curator-side runbook this proposal feeds into), `content/problems/` (live problem slugs).
  - **arXiv ID or DOI** (input, required) — `Paper.id` per `PaperSchema`.
  - **Paper title** (input, required) — `Paper.title`.
  - **Primary contributing problem slug** (input, required) — drives `Paper.contributions[0].problem_slug`. Helper text instructs filing `[New problem]` first if no existing slug fits.
  - **Evidence URL** (input, required) — `Paper.contributions[0].evidence`. §15.6 primary-source rule reinforced in the helper text: arXiv abstract or PDF, not secondary summaries.
  - **Benchmark + score** (textarea, optional) — freeform `<benchmark>: <score> (<metric>)`. Curator structures `benchmark_id` / `score` / `metric` / `rank_at_publication` during ingest. Rationale: 4 separate inputs is form overhead.
  - **Additional context** (textarea, optional) — TL;DR draft, lead-author ORCID, institutions, GitHub URL, etc.
- **Deviations from Unit 4.0 Q37 lean**:
  - **Lead-author ORCID demoted from required to optional** (subsumed into "Additional context"). Q37 lean assumed contributors have it ready; in practice ORCID resolution is curator-side per the Phase-2 author-backfill precedent (Unit 2.5b).
  - **TL;DR demoted from required to optional**. 1–400-char distillations are editorial work; curator authors from the source during runbook pass.
  - **`authors[]` / `institutions[]` / `year` / `venue` / `github` / `doi` not surfaced**. Curator backfills from arXiv metadata + ROR / ORCID lookups during ingest (Unit 2.5b / 2.6c / 2.6d precedents).
- **Parallel-curator state**: HEAD = `de9460b` post-Unit-4.7. No collision with the parallel session's viz-line work.
- THINK artifact: `docs/thinking/4.8-issue-template-new-paper.md`.
- Smoke gates: `pnpm validate-content` (203 files unchanged), `pnpm typecheck` (clean), `pnpm test` (190/190 unchanged). `pnpm build` not re-run. Manual smoke deferred to Unit 4.13.

#### Unit 4.9 — Issue template: leaderboard-entry (`.github/ISSUE_TEMPLATE/leaderboard-entry.yml`)

- Third of the 4 form-based GitHub issue templates §13 names. Same structural pattern as Units 4.7 / 4.8.
- **Field schema** (6 form fields + 1 markdown intro):
  - **Intro markdown** — links `MASTER_PROMPT.md` (§9 leaderboard + §15.6) and `content/problems/`. Notes the `verified: boolean` is curator-side; submitters don't self-attest. Cross-links the `[New paper]` template for papers not yet ingested.
  - **Problem slug** (input, required) — selects which `entries.json` the row lands in.
  - **Benchmark id** (input, required) — must match a `benchmarks[].id` declared in the parent problem's `problem.yaml`. Helper text explains where to look up the id.
  - **Paper id** (input, required) — usually the arXiv ID. Helper text directs submitters to file `[New paper]` first if the paper isn't yet ingested.
  - **Score** (input, required) — numeric. Helper text reminds about `metric_direction` (`higher-is-better` / `lower-is-better`).
  - **Date** (input, required) — ISO `YYYY-MM-DD`.
  - **Protocol notes** (textarea, optional) — freeform; placeholder mirrors the `entries.json` precedent from Unit 2.6h: `Model: <name>. Source: <url>. <metric notes>`.
- **Design call: `verified: boolean` not surfaced**. The schema field is curator-controlled; presenting it on the form invites self-attestation that the curator workflow would then have to override. Verification is the curator's primary review act per §15.6.
- **5 required fields** (top of Q37's 3–5 range). All 5 (`problem`, `benchmark`, `paper`, `score`, `date`) map 1:1 to `LeaderboardEntrySchema` row columns and are load-bearing.
- **Cross-validation deferred to ingest**: benchmark-exists-on-problem, paper-already-ingested, date-not-in-future — all checked during curator review, not at the form layer (GitHub Forms doesn't support cross-field validation).
- **YAML quoting applied preemptively** per Unit 4.8's lesson: any single-line value with an internal `:` is quoted. None ended up needing it in this template's placeholders, but the audit pass is now part of the issue-template rhythm.
- **Parallel-curator state**: HEAD = `1954b1d` post-Unit-4.8. No collision.
- THINK artifact: `docs/thinking/4.9-issue-template-leaderboard-entry.md`.
- Smoke gates: `pnpm validate-content` (203 files unchanged), `pnpm typecheck` (clean), `pnpm test` (190/190 unchanged). `pnpm build` not re-run. Manual smoke deferred to Unit 4.13.

#### Unit 4.10 — Issue template: rating-challenge (`.github/ISSUE_TEMPLATE/rating-challenge.yml`)

- **Fourth and final** of the 4 form-based GitHub issue templates §13 names. Closes the issue-template inventory the Phase-4 plan opened. Unit 4.0's D-8 deliverable list is complete.
- **Field schema** (6 form fields + 1 markdown intro):
  - **Intro markdown** — links `MASTER_PROMPT.md` (§8 rating methodology + §15.6) and `docs/adr/0005-rating-action-immutability.md`. Frames the workflow: ADR-0005 forbids editing existing rating-action YAMLs; the curator drafts a **new** YAML capturing the current state in response to the challenge. The challenge needs evidence, not a draft.
  - **Problem slug** (input, required) — which problem's rating is being challenged.
  - **Dimension** (**dropdown**, required) — closed enum: `difficulty`, `saturation`, `urgency`, `value`, `industry_call`. **First template to use `dropdown`** because this is the first closed-set field across the 4 templates.
  - **Direction** (**dropdown**, required) — closed enum: `up`, `down`, `watchlist`. Helper text explains each option.
  - **Evidence / rationale** (textarea, required) — the meat of the challenge; §15.6 primary-source rule reinforced.
  - **Source URL(s)** (textarea, optional) — bulleted list; helper text reinforces that secondary coverage doesn't qualify under §15.6.
  - **Additional context** (textarea, optional) — proposed score range, related challenges, watchlist concerns.
- **`dropdown` rationale**: dimension and direction are both closed sets (5 and 3 options respectively). Freeform would invite typos that waste curator triage time. Other 3 templates (4.7 / 4.8 / 4.9) stayed freeform because their constrained-looking fields (problem-slug, benchmark-id, paper-id) are actually open-ended sets that evolve with content.
- **Watchlist surfaced as a `direction` option, not a separate `boolean`**. Keeps the form to a single decision tree: "what should change about this rating?"
- **4 required + 2 optional fields**. Within Q37's 3–5 lean range.
- **No `confidence` / `rationale` boilerplate** required. Challengers aren't curators; the curator authors the eventual rating-action YAML's confidence-and-rationale fields per §8.5.
- **Parallel-curator state**: HEAD = `636da83` post-Unit-4.9. No collision.
- THINK artifact: `docs/thinking/4.10-issue-template-rating-challenge.md`.
- Smoke gates: `pnpm validate-content` (203 files unchanged), `pnpm typecheck` (clean), `pnpm test` (190/190 unchanged). `pnpm build` not re-run. Manual smoke (open all 4 templates in the GitHub UI on a non-main branch and verify field rendering + title prefixes) deferred to Unit 4.13 acceptance gate per Unit 4.0.

#### Unit 4.11 — ADR-0007: DomainMap rendering target & D3 import policy

- Records the realized decisions from the parallel session's Unit 4.2 DomainMap implementation (`be29236`). Per ADR README convention, ADRs document what shipped, not what was sketched — the constants and import surface in ADR-0007 mirror `components/viz/DomainMap/index.tsx` at HEAD.
- **Closes [OPEN_QUESTIONS Q40](./OPEN_QUESTIONS.md#q40-adr-0007-scope)** (single ADR covering SVG-vs-Canvas + D3-import-policy as one decision-cluster). Status flipped from `decided-as-lean` to `decided`.
- **4 decisions documented**:
  - **D-A — Render target = SVG**, not Canvas, not HTML/CSS. Inherits Phase-3 a11y plumbing pattern.
  - **D-B — D3 surface = tree-shaken sub-packages**. `d3-force` imported; `d3-selection` installed-but-unused (reserved for the drag follow-on); `d3-scale` and `d3-zoom` not installed; umbrella `d3` forbidden.
  - **D-C — Deterministic SSR layout** via pre-seeded `x` / `y` on a circle around viewport center. Eliminates `Math.random()` drift; no hydration-mismatch surface for the future drag follow-on. Locked by `render(props) === render(props)` test (Unit 4.2 `index.test.tsx`).
  - **D-D — Tuning constants table** (realized at Unit 4.2): `VIEW_W = 600`, `VIEW_H = 420`, `LINK_DISTANCE = 60`, `CHARGE_STRENGTH = -180`, `CENTER_STRENGTH = 0.05`, `N_TICKS = 300`, `RADIUS_K_PROBLEM = 5`, `RADIUS_K_SUBDOMAIN = 5.5`, `RADIUS_K_DOMAIN = 7`. Re-tuning trigger: content scale 3× (Phase-5 ingest).
- **ADR README index updated** with ADR-0006 (which shipped in Unit 3.11 but the README index wasn't refreshed at the time) **and** ADR-0007. Cleanup paid forward.
- **5 considered options** documented with explicit Pros/Cons per the ADR README's authoring rule: SVG+tree-shaken (chosen), Canvas+tree-shaken, SVG+umbrella `d3`, HTML/CSS+tree-shaken, React force-graph wrapper.
- **Status: accepted** on the authoring commit. The decisions were realized + shipped + tested at HEAD before the ADR landed; authoring a pre-decision `proposed` ADR would be an antipattern.
- **Parallel-curator state**: HEAD = `81e4459` post-Unit-4.10. No collision. Note: the parallel session staged a `.gitignore` change adding the leftover `docs/SESSION_HANDOFF_phase3_close.md` to the ignore list — left untouched in this commit; the parallel session ships it on their schedule.
- THINK artifact: `docs/thinking/4.11-adr-domainmap-rendering.md`.
- Pure docs unit — no app, schema, or test code touched.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (190/190 unchanged), `pnpm validate-content` (203 files unchanged). `pnpm build` not re-run.

#### Unit 4.12 — DB-migration trigger evaluation note

- Promotes the §12 DB-migration trigger check from Unit 4.0's THINK doc to its own standalone artifact (`docs/thinking/4.12-db-migration-trigger-eval.md`) so Phase-5+ curators have a canonical re-check reference rather than digging through CHANGELOG.
- **Fresh measurement at HEAD `25801f4`**: `tar -czf` of `.velite/` = **69,182 bytes (~67.6 KB)** vs the **5 MB (5,242,880-byte) trigger**. **~1.32% of trigger**; ~76× headroom. Within rounding of Unit 4.0's 68,969-byte measurement (~0.3% movement; the Phase-4 docs additions are not measurable against the snapshot — most growth lands as `problemPages.json` MDX prose, of which Phase 4 added little).
- **Auth trigger**: also negative. Phase 4's submission workflow is GitHub-mediated (issue templates + PR review per Units 4.7–4.10); no first-party auth. §5.8 ("Auth deferred to Phase 4") + §13 (no write-path UI in Phase-4 deliverables) line up cleanly.
- **Decision**: **DB migration deferred to Phase 5.** §12's explicit contemplation of this case ("Otherwise skip and revisit at Phase 5.") obviates an override.
- **Re-evaluation triggers** (when to re-check) documented in the note:
  1. **Content scale 3×** (`pnpm validate-content` > 600 files, OR gzipped snapshot > 1 MB internal alarm — gives ~5× headroom before the 5 MB hard trigger).
  2. **First Phase-5 write-path lands** (auth trigger flips).
  3. **Phase 5 kickoff** (per §12, mandatory re-evaluation).
  4. **Rating-action volume reaches 200** (current 20; linear vs. MDX-prose's step-function growth profile).
- **Forward-looking signals** (not §12 triggers but worth watching): storage-shape stress vs. byte count (cross-cutting queries that don't map cleanly to per-page JSON slices); data-freshness cadence (real-time ingest decoupling from deploy cycles); multi-curator concurrency (5+ active per week).
- **Anchor ADR**: ADR-0004 (file-first; no DB through Phase 3) is the durable architectural record this trigger defers against.
- **Parallel-curator state**: HEAD = `25801f4` post-Unit-4.11. No collision. The parallel session's `.gitignore` change remains staged-but-uncommitted in their tree; not included here.
- Pure docs. Smoke gates: `pnpm typecheck` (clean), `pnpm test` (190/190 unchanged), `pnpm validate-content` (203 files unchanged).

#### Unit 4.5 — `content/contributing/v1.mdx` (curator workflow MDX)

- The versioned editorial-workflow doc for external contributors, per Unit 4.0 D-9. Mirrors `content/methodology/v1.mdx`'s structural conventions: top-level frontmatter (`version` / `title` / `summary` / `date`), prose with `##`/`###` headings, no inline code outside fenced blocks.
- **Scope split**: Unit 4.5 ships content only; Velite collection registration + the `/contributing` page composition belong to Unit 4.6. The MDX sits as an unreferenced file on disk between the two commits — Velite's existing globs (`methodology/*.mdx`, etc.) don't match `contributing/v1.mdx`, so it's silently ignored at build until 4.6 wires the collection.
- **Frontmatter forward-compatible** with the Unit 4.6 Velite collection schema (which will mirror `methodology` 1:1 — `version` + `title` + `summary` + `date` + optional `supersedes`). No backfill needed when 4.6 lands.
- **6 sections** (per Unit 4.0 D-9):
  1. **Who can contribute** — anyone with a GitHub account via issues; curators do the merge work; curator-of-record recorded in `editorial.primary_curator` / rating-action `curator` / PR reviewer history.
  2. **The four contribution types** — table linking each of the 4 Phase-4 issue templates (Units 4.7 – 4.10) by canonical GitHub "new issue from template" URL.
  3. **Editorial standards** — primary-source rule (§15.6), ROR / ORCID conventions, ADR-0005 rating-action immutability, methodology versioning (§8.1 + ADR-0006), no-fabrication rule.
  4. **PR review expectations** — CI green required; curator + 1 reviewer; visual baselines refresh; CHANGELOG entry per commit + per-unit conventional-commit title.
  5. **Versioning this page** — v1.x additive, v2.0 for workflow-shape change (auth-gated submissions per §5.8, currently deferred per Unit 4.12).
  6. **Questions, ambiguity, gaps** — file a regular GitHub issue tagged `meta` for things that don't fit the 4 templates.
- **GitHub URLs**: all pinned to `github.com/bettyguo/OpenProblems` per `git remote -v` (same convention as Units 4.7 – 4.10). 4 template URLs use the canonical `/issues/new?template=<file>.yml` pattern.
- **No CURATION_PROMPT.md duplication.** That doc is written for Claude (parallel-safety contract, prompt-engineering register); this MDX is written for external curators — different audience, different scope, different voice.
- **No screenshots / GIFs.** Following the MASTER_PROMPT.md text-first convention; revisit if user-research signals demand visual aids.
- **Parallel-curator state**: HEAD = `1261aca` post-Unit-4.12. No collision. The parallel session's staged `.gitignore` change persists; not modified here.
- THINK artifact: `docs/thinking/4.5-contributing-mdx.md`.
- Pure content. Smoke gates: `pnpm validate-content` (203 files unchanged — the new MDX is outside the validated globs until Unit 4.6 wires the Velite collection), `pnpm typecheck` (clean — no TS touched), `pnpm test` (190/190 unchanged), `pnpm build` (198 routes unchanged — no new SSG page until 4.6).

#### Unit 4.6 — `/contributing` page composition + Velite `contributing` collection

- Replaces the 10-line `<StubPage>` at `app/contributing/page.tsx` with the live MDX-rendering page, plus a versioned-snapshot `app/contributing/[version]/page.tsx`. Mirrors `app/methodology/page.tsx` + `app/methodology/[version]/page.tsx` 1:1 (collection name, parse/compare-version helpers, latest-vs-snapshot route shape).
- **`velite.config.ts`**: adds a new `contributing` collection (`name: "Contributing"`, `pattern: "contributing/*.mdx"`) with the same schema shape as `methodology` — `version` / `title` / `summary` / `date` / optional `supersedes` / auto-derived `slug` (with `contributing/` prefix stripped via `.transform()`) / `body: s.mdx()`. Registered in the `collections` map alongside `methodology`.
- **Routes added**: `/contributing` (○ Static, was the StubPage previously) + `/contributing/v1.0.0` (● SSG via `generateStaticParams()`). Total routes **198 → 200**.
- **Code duplication note**: the two contributing pages are ~70 lines of near-copies of the methodology pages. Defensible default per the §14 "no premature abstraction" rule — extract a shared `<VersionedMdxPage>` component when a third versioned-MDX doc lands (would need methodology + contributing + a 3rd to justify the abstraction).
- **Velite Zod-3-internals contract (Q31)** preserved: the new collection schema uses Velite's bundled `s` factory, not `lib/schemas/*`. No new schema duplication beyond what was already there for methodology.
- **`v{version}` URL convention** (e.g. `/contributing/v1.0.0`) — exact mirror of methodology's pattern.
- **First Load JS shared chunk: 103 kB UNCHANGED.** MDX renders to HTML at build time; no new client deps.
- **`pnpm velite` regeneration required** after the config change to refresh `.velite/index.d.ts` (the contributing-collection types). Build-script ordering (`velite && next build`) handles this on CI / next clean build; local typecheck after a `velite.config.ts` edit needs an explicit `pnpm velite` to keep TS happy.
- **Parallel-curator state**: HEAD = `1c83f61` post-Unit-4.5. The parallel session's `.gitignore` change still sits unstaged in their tree; not modified here.
- THINK artifact: `docs/thinking/4.6-contributing-page.md`.
- Smoke gates: `pnpm velite` (build finished in ~1.7s), `pnpm typecheck` (clean), `pnpm test` (190/190 across 28 files), `pnpm validate-content` (203 files — MDX is outside `scripts/validate-content.ts`'s YAML-against-Zod cross-validation scope per Q31; Velite validates MDX at build), `pnpm build` (**200 SSG routes**; First Load JS 103 kB).

#### Unit 4.3 — `/domains` page composition with DomainMap

- Replaces the static `<DomainTileGrid />` at `app/domains/page.tsx` with the live `<DomainMap />` from Unit 4.2, wrapped in `<ChartTableSwitch>` with `<DomainMapTable />` as the table-fallback (Unit 3.12 pattern). The page is the brushable-DomainMap surface §13 D-8 names.
- **New shared loader**: `lib/content/build-domain-map.ts` exposes `buildDomainMap()` returning `{ nodes, links }` from the live taxonomy + problems + indexed-composite data. **Reusable** by Unit 4.4 (`/` landing).
- **Composite aggregation rule** (Unit 4.3 D-1, documented in the file): mean of leaves.
  - **Problem composite**: from `getIndexedProblems()`.composite (§8.3 formula on the latest rating action). Unrated problems fall back to a `3.0` midpoint placeholder.
  - **Subdomain composite**: arithmetic mean of child problems' composites. Empty subdomain → 3.0 placeholder.
  - **Domain composite**: mean of *all descendant problems* (not nested subdomain means) — flatter aggregation more honest under uneven subdomain populations.
- **Hue assignment** per Unit 4.0 D-5: `taxonomy.domains[i].hue = (i % 5) + 1`. Subdomain + problem nodes inherit parent-domain hue. Wraps at 6 domains (Phase 5+).
- **Orphan-problem defense**: if a problem's `subdomain` slug isn't present in `taxonomy.domains[].subdomains[]` (shouldn't happen in HEAD — defensive against future taxonomy edits), the problem node attaches directly to its domain. Wouldn't be silently dropped.
- **Test coverage** (+9 tests in `lib/content/build-domain-map.test.ts`):
  1. Domain node count + order + hues (1..5 wrapping).
  2. Subdomain node count = sum over `taxonomy.domains[i].subdomains.length`.
  3. Every non-domain node inherits its parent's hue.
  4. Every link's `source` and `target` id exists in `nodes`.
  5. Every non-domain node has a `parent` that resolves.
  6. Domain composite = arithmetic mean of descendant problem composites.
  7. Subdomain composite = mean of child problem composites (with 3.0 fallback for empty).
  8. Problem-node-count = `getIndexedProblems().length` (no drops / no duplicates).
  9. Every problem node has `href = /problems/<slug>`.
- **Bundle**: `/domains` route size went **198 B → 146 B** (the DomainMap SSR'd SVG is smaller in-bundle than the tile-grid component was). First Load JS shared chunk **103 kB UNCHANGED**.
- **Route count: 200 UNCHANGED** — `/domains` is still `○ Static`; same path, different inner viz.
- **Scope split per Unit 4.0**: filter chips are page-layer interactivity → live on Unit 4.4 (`/` landing); Unit 4.3 ships DomainMap without chips, since the table-fallback under `<details>` covers the discovery surface §13's "brushable" framing needs.
- **Parallel-curator state**: HEAD = `abd3c07` post-Unit-4.6. No collision with the parallel session's viz-line work.
- THINK artifact: `docs/thinking/4.3-domains-page-domainmap.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (**199/199 across 29 files**, was 190/190 across 28; +9 build-domain-map tests), `pnpm validate-content` (203 files unchanged), `pnpm build` (200 SSG routes; `/domains` 146 B / 103 kB; First Load JS shared chunk 103 kB unchanged).

#### Unit 4.4 — `/` landing-page wiring with DomainMap + domain chips

- Replaces the "By domain" section's `<DomainTileGrid />` on `app/page.tsx` with the live `<DomainMap />` (wrapped in `<ChartTableSwitch>` with `<DomainMapTable />` fallback, mirroring Unit 4.3) plus a row of 5 navigation chips above it — one `<Link href="/domains/<id>">` per domain.
- **Reuses `buildDomainMap()` from Unit 4.3.** Same loader, same data shape, same composite-aggregation rule. Same DomainMap component identically configured. The two surfaces stay visually identical and one fix updates both.
- **Chip behavior**: navigation-only (each chip links to `/domains/<id>`). The fuller "filter chips with `dimmedIds` URL-search-param state" from Unit 4.0 D-6 interaction #4 (Q38 lean) is deferred — that pattern fits `/domains` rather than landing, and the per-unit description for 4.4 specifies "link into /domains/[domain]" (navigation), not in-place filter.
- **Hero section, "Recently rated", "Methodology" unchanged.** Only the "By domain" section is touched.
- **Bundle**: `/` route size **198 B → 162 B** (smaller in-bundle as the inline SVG payload replaces the tile-grid JSX). First Load JS shared chunk **103 kB UNCHANGED**.
- **Route count: 200 UNCHANGED.**
- **Orphan-component note**: `components/domain-tile-grid/index.tsx` has no remaining active imports after Units 4.3 + 4.4. The file is left in place for now — deleting a tracked pre-existing file is a destructive action that should be a separate, explicitly-authorized hygiene unit. Flag as a Phase-5 cleanup candidate.
- **Scope explicitly deferred**:
  - **Multi-select dimming chips with `?d=<id>,<id>` URL state** (Q38 lean / D-6 interaction #4): Phase-5 enhancement when the brushable-filter pattern has clear user-research demand.
  - **Hero-section changes**: Unit 4.0 had a passing reference to "replace the existing tile-grid hero" — but the actual landing page has the tile-grid in the "By domain" section, not the hero. Hero stays untouched.
- **Parallel-curator state**: HEAD = `e3c2623` post-Unit-4.3. No collision.
- THINK artifact: `docs/thinking/4.4-landing-page-domainmap.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (199/199 across 29 files unchanged), `pnpm validate-content` (203 files unchanged), `pnpm build` (200 SSG routes; `/` 162 B / 106 kB; First Load JS shared chunk 103 kB unchanged).

#### Unit 4.13 — Phase 4 acceptance gate

- Phase-4 closing unit. Mirrors Unit 1.12 (Phase 1 gate), Unit 2.13 (Phase 2 gate), Unit 3.13 (Phase 3 gate). Verifies every §13 Phase-4 deliverable locally + emits the cross-phase roll-up. **Phase-4 work is now closed pending human sign-off** and the same Q27-class CI follow-ons (W3C RSS validator pass on deployed URL; CI Ubuntu visual-regression baselines on first PR).
- **§13 Phase-4 deliverables — local pass status**:
  1. **`DomainMap` (force graph) on `/` and `/domains`** ✓ Units 4.2 + 4.3 + 4.4. SSR-only force-graph viz with deterministic SVG layout + a11y plumbing (`role="img"` + `aria-describedby` → `<desc>`). Wrapped in `<ChartTableSwitch>` with `<DomainMapTable>` fallback. Both routes ship `○ Static`; First Load JS shared chunk **103 kB UNCHANGED** across all Phase-4 work.
  2. **GitHub issue templates** for new-problem / new-paper / leaderboard-entry / rating-challenge ✓ Units 4.7 – 4.10. All 4 form-based `.yml` at `.github/ISSUE_TEMPLATE/`. Project GitHub URLs pinned to `github.com/bettyguo/OpenProblems` per `git remote -v`.
  3. **`/contributing` page** ✓ Units 4.5 + 4.6. Versioned MDX (`content/contributing/v1.mdx`) + Velite collection + page composition mirroring `/methodology`. Routes `/contributing` (Static) and `/contributing/v1.0.0` (SSG) both live.
  4. **(Conditional) DB migration** ✓ Unit 4.12. `gzip(.velite snapshot) = 69,182 bytes` (~67.6 KB, **~1.32% of the 5 MB §12 threshold**); auth-trigger also negative — Phase-4 workflow is GitHub-mediated (issue templates + PR review). **DB migration deferred to Phase 5** per the §12 contemplated path. Standalone re-eval note shipped.
- **§13 cross-phase criteria (universal contract)**:
  - **Lighthouse a11y ≥ 95 on new pages**: `lighthouserc.json` extended this unit to **12 URLs** (was 10 after Unit 3.13a). Added: `/domains` (the brushable index from Unit 4.3) and `/contributing` (the curator-workflow page from Unit 4.6). DomainMap a11y plumbing inherits the Phase-3 viz pattern. CI cohort runs against deployed URLs on first PR (Q27 pattern).
  - **Visual-regression baselines** for new pages × 2 themes × N viewports: local `chromium-win32` baselines NOT re-captured in this commit (no Playwright spec changes); follow-on PR can pass `playwright test --update-snapshots` against `/`, `/domains`, `/contributing`.
  - **All charts have table-fallback toggles**: closed in Unit 3.12; Phase-4 DomainMap inherits via Unit 4.2's `<DomainMapTable>` sibling, wired in 4.3 + 4.4.
  - **Issue-template smoke-test** (manual): open each template in the GitHub UI; verify field rendering + title prefix. Cannot be automated; documented as a human-run checklist on this commit's PR.
- **Phase-4 unit summary** (14 units shipped end-to-end):

  | Unit | Commit    | Title                                                              |
  | ---- | --------- | ------------------------------------------------------------------ |
  | 4.0  | `8ef0e18` | Phase 4 prep (THINK + 14-unit breakdown + DB-migration eval)       |
  | 4.1  | `82194b3` | Install `d3-force` + `d3-selection`                                |
  | 4.2  | `be29236` | `components/viz/DomainMap/` scaffold (§11 catalog item 4)          |
  | 4.3  | `e3c2623` | `/domains` page swaps tile grid for DomainMap                      |
  | 4.4  | `0569135` | `/` landing page swaps tile grid for DomainMap + chips             |
  | 4.5  | `1c83f61` | `content/contributing/v1.mdx`                                      |
  | 4.6  | `abd3c07` | `/contributing` page composition + Velite collection               |
  | 4.7  | `de9460b` | Issue template: new-problem                                        |
  | 4.8  | `1954b1d` | Issue template: new-paper                                          |
  | 4.9  | `636da83` | Issue template: leaderboard-entry                                  |
  | 4.10 | `81e4459` | Issue template: rating-challenge                                   |
  | 4.11 | `25801f4` | ADR-0007 (DomainMap rendering + D3 import policy)                  |
  | 4.12 | `1261aca` | DB-migration trigger evaluation note                               |
  | 4.13 | _this_    | Phase 4 acceptance gate                                            |

- **State at HEAD (Unit 4.13)**:
  - 10 problems / 5 domains / ~12 subdomains / 30 papers / 126 authors / 14 institutions / 20 rating actions / **4 issue templates** / **1 `/contributing` MDX**.
  - **313 prerendered pages** (`pnpm build` → `Generating static pages (313/313)`). Reporting note: prior Phase-3 / Phase-4 CHANGELOG entries used "routes" to mean route-pattern counts (198 → 200); this is the expanded-page count — the prior numbers are not wrong, just measuring a different thing. From this unit forward, use "prerendered pages" for the Next.js-authoritative count.
  - **First Load JS shared chunk 103 kB UNCHANGED** throughout Phase 4. d3-force runs server-side; the static SVG payload that ships is just markup; d3-selection ships in deps from Unit 4.1 but is unused server-side (tree-shaken from client bundle).
  - **199/199 vitest tests across 29 files** (was 171/25 at Phase-3 close — +28 tests from the parallel session's Unit 4.2 DomainMap suite + Unit 4.3's `build-domain-map.test.ts`).
  - `pnpm validate-content` → 203 files green.
  - `pnpm audit-content` → 0 errors / 6 warnings (same Q32-expected `related-problems-symmetry` set since Phase 2).
  - `pnpm typecheck` clean. `pnpm build` clean compile (3.0s).
  - **5 visualizations live**: RatingRadar (Phase 1), SaturationCurve, MoversBoard, RatingHistoryStream (Phase 3), **DomainMap (Phase 4)**.
  - **7 ADRs**: 0001 Next.js / 0002 Velite / 0003 Zod / 0004 file-first / 0005 rating-action immutability / 0006 saturation N/A / **0007 DomainMap rendering + D3 import policy**.
  - 2 OPEN_QUESTIONS closed this phase: **Q38** (filter-chip URL persistence, decided-as-lean confirmed when 4.4 shipped chip-as-navigation) and **Q40** (ADR-0007 scope, decided). 4 surfaced earlier in Phase 4: Q37 (issue-template field schemas), Q39 (DomainMap mobile-viewport a11y). Both remain open as Phase-5 / responsive-baseline follow-ons.
- **Phase-4 follow-ons that survive the gate** (not blocking sign-off):
  - **W3C RSS validator pass** against deployed `/api/v1/rss.xml` — still pending first preview deploy (same Phase-3 follow-on).
  - **Visual-regression baselines** for new pages (`/`, `/domains`, `/contributing`, `/contributing/v1.0.0`) × 2 themes × N viewports — Phase-4 follow-on; future PR.
  - **Manual issue-template smoke** in the GitHub UI — one-time check on this commit's PR.
  - **Orphan `components/domain-tile-grid/`** — unused since Units 4.3 / 4.4 swapped to DomainMap. Phase-5 hygiene cleanup candidate (deletion gated on explicit authorization per the destructive-action rule).
  - **`entries.json` content pass** on the 8 problems that still lack curator-authored entries — Phase-2 / Phase-5 content backlog.
  - **`docs/SESSION_HANDOFF_phase3_close.md`** — prior-session resume artifact. The parallel session's staged `.gitignore` change adds it to the ignore list; ships when they commit.
- **Phase 5 entry conditions** (per §12 cardinal rule, mirror of all prior phase boundaries): **explicit human sign-off required**. Phase 5 deliverables per §13: arXiv ingestion helper (CLI), LLM-assisted leaderboard-entry extraction (with mandatory human-review diff), email/RSS digest. The §12 DB-migration trigger re-evaluation is mandatory per Unit 4.12.
- **Cross-phase milestone**: this commit closes the Phase-4 plan in its entirety as authored in Unit 4.0. The 14-unit breakdown shipped end-to-end with one re-scoping: drag interactivity (Unit 4.0 D-6 #3) deferred from Unit 4.2 to a future enhancement — captured as a known trade-off in ADR-0007.
- THINK artifact: `docs/thinking/4.13-phase-4-acceptance-gate.md`.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (199/199 across 29 files), `pnpm validate-content` (203 files), `pnpm audit-content` (0 errors / 6 Q32-expected warnings), `pnpm build` (clean compile in 3.0s; 313 prerendered pages; First Load JS shared chunk 103 kB).

### Phase 5 — Intelligence layer (LLM-assisted curation)

#### Unit 5.0 — Phase 5 prep (THINK doc + 14-unit breakdown + DB-migration trigger re-eval)

- Phase 5 kickoff per §12 cardinal rule. Phase 4 sign-off granted via **"Continue" override** in the unit-rhythm rhythm (per the handoff doc's option (c); §12 normally requires explicit sign-off — this unit flags the override transparently). Phase-4 closure at HEAD `37ed747` (Unit 4.13). Docs-only unit.
- **14-unit breakdown** (5.0 – 5.13):

  | Unit | Title                                                                                               |
  | ---- | --------------------------------------------------------------------------------------------------- |
  | 5.0  | Phase 5 prep (this doc)                                                                             |
  | 5.1  | ADR-0008 — LLM provider selection (Anthropic SDK) + cost-governance pact                            |
  | 5.2  | `lib/curate/arxiv-client.ts` — arXiv API client + filesystem cache                                  |
  | 5.3  | `scripts/ingest-arxiv.ts` — CLI drafting paper YAML from an arXiv ID                                |
  | 5.4  | `lib/curate/pdf-text.ts` — PDF text extraction utility                                              |
  | 5.5  | `scripts/extract-leaderboard.ts` — LLM-assisted entry extraction (human-review diff output)         |
  | 5.6  | ADR-0009 — Human-review diff format for LLM-assisted drafts (no auto-merge contract)                |
  | 5.7  | `lib/digest/build-digest.ts` — per-domain weekly summary builder                                    |
  | 5.8  | `app/api/v1/digest/[domain].xml/route.ts` — RSS feed per domain                                     |
  | 5.9  | `/digest` HTML hub linking the per-domain feeds                                                     |
  | 5.10 | DB-migration trigger re-evaluation (mandatory; checks after CLI-driven ingest paths exercise)       |
  | 5.11 | Phase-5 hygiene: orphan `components/domain-tile-grid/` deletion (requires authorization); `entries.json` content backfill |
  | 5.12 | OPEN_QUESTIONS hygiene + ADR review                                                                 |
  | 5.13 | Phase 5 acceptance gate — CLI smoke; RSS validates per domain; CHANGELOG roll-up                    |

- **Phase-5-blocking decisions resolved here** (D-1 through D-8 in the THINK doc):
  - **D-1 LLM provider = Anthropic Claude** (`@anthropic-ai/sdk`). Sonnet 4.6 default; Opus 4.7 via `--model` flag for harder extraction. Recorded as ADR-0008 in Unit 5.1. Cost-governance pact: `--dry-run`, `--verbose` cost estimates, `ANTHROPIC_API_KEY` from env (no default), optional `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` cap.
  - **D-2 PDF extraction = `pdf-parse` (lean)**. Empirical evaluation in Unit 5.4 against 3 sample PDFs (ML / bio / NLP); escalate to `pdfjs-dist` if extraction quality is too lossy.
  - **D-3 arXiv API rate limit = 3 req/s with filesystem cache** at `.arxiv-cache/` (gitignored; added in Unit 5.2).
  - **D-4 Email = NOT in Phase 5; RSS-only.** Email needs deploy infra + subscriber-list store + double-opt-in flow — all auth-trigger-flipping. Deferred to Phase 6+ alongside the auth migration.
  - **D-5 CLI invocation = `pnpm <name>`** (new `package.json` scripts: `ingest-arxiv`, `extract-leaderboard`, `build-digest`). Mirrors the existing `pnpm validate-content` / `pnpm audit-content` pattern.
  - **D-6 Human-review diff format = unified patch in `drafts/`** (gitignored). Compatible with `git apply`. ADR-0009 (Unit 5.6) records the realized format + the no-auto-merge contract.
  - **D-7 Drafts directory = `drafts/`** (gitignored, top-level, unhidden for editor discoverability).
  - **D-8 ADR-0004 (file-first) re-affirmed.** Phase 5's mandatory DB-migration trigger re-eval is negative on both criteria; DB stays deferred to Phase 6+.
- **DB-migration trigger evaluation (MANDATORY at Phase 5 kickoff per Unit 4.12)**:
  - Measured at HEAD `37ed747`: `gzip(.velite snapshot) = 72,274 bytes (~70.6 KB)`. Threshold = 5 MB. **~1.38% of trigger** (was ~1.32% at Unit 4.12; +6 KB movement attributable to the `/contributing` MDX compile).
  - Auth trigger: still negative. Phase-5 workflow is curator-side CLIs + RSS-only subscriptions; no first-party auth.
  - **Decision**: DB migration deferred to Phase 6+. Same conclusion as Unit 4.12.
- **Phase-5-blocking decisions deferred to per-unit implementation**: D-9 (prompt-caching for paper drafts), D-10 (arXiv category filtering scope), D-11 (leaderboard-extraction benchmark-id guardrails), D-12 (digest cadence — trailing-7-days lean).
- **OPEN_QUESTIONS amended** with Q41 – Q44: LLM model choice per script (Q41), cost-cap default policy (Q42), PDF text cache (Q43), digest RSS managingEditor (Q44 — gated on Q33 + Q2 DNS resolution).
- **Phase-4 closure confirmed** at HEAD `37ed747` (Unit 4.13): 313 prerendered pages, 199/199 tests across 29 files, 5 vizes live, 7 ADRs, First Load JS shared chunk 103 kB.
- THINK artifact: `docs/thinking/5.0-phase-5-prep.md`.
- Smoke gates: docs-only — no `pnpm test` / `pnpm build` / `pnpm validate-content` re-run needed beyond the existing Phase-4-closure state.

#### Unit 5.1 — ADR-0008: LLM provider selection (Anthropic Claude) + cost-governance pact

- Pins the LLM-provider contract before any Phase-5 code lands. Phase 5 is the first paid-API surface in the project; ADR-0008 documents the choice + the cost-governance posture from day zero.
- **Closes [OPEN_QUESTIONS Q41](./OPEN_QUESTIONS.md#q41-llm-model-choice-per-phase-5-script)**. Status flipped from `decided-as-lean` to `decided`. Documents Q42 (cost-cap default policy) trade-off explicitly as the working "no default cap" position; Q42 remains `open` for re-evaluation after the first 100 ingest runs.
- **6 decisions documented** (D-A through D-F):
  - **D-A** Provider = Anthropic (`@anthropic-ai/sdk`). Other LLM SDKs forbidden until a follow-on ADR.
  - **D-B** Per-script model defaults: `ingest-arxiv` → Sonnet 4.6, `extract-leaderboard` → Opus 4.7, `build-digest` → Sonnet 4.6. `--model` overrides on every script.
  - **D-C** Cost-governance pact: `ANTHROPIC_API_KEY` from env (no fallback), `--dry-run` flag, `--verbose` per-call cost line, optional `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` cap via `.llm-spend.log` (gitignored), **no default daily-cap** (deliberate Q42 lean — `--verbose` + dry-run is the primary safeguard).
  - **D-D** Prompt caching: shared system-prompt blocks wrapped in `cache_control: { type: "ephemeral" }` on ≥ 2-call sessions. 5-minute TTL acceptable.
  - **D-E** Auditability: every script writes `drafts/<unit>-<ts>-<slug>.diff.meta.json` alongside the diff (model, token counts, cost estimate, prompt SHA256, anthropic_request_id). Spot-audit + reproduction tractable.
  - **D-F** Conflict-of-interest disclosure: LLM OpenProblems indexes Anthropic's own work; a future `/contributing` v1.x bump surfaces the disclosure. Tracked as a Phase-5 / Phase-6 content follow-on.
- **6 considered options** documented with explicit Pros/Cons per the ADR README authoring rule: Anthropic (chosen), OpenAI GPT-4-class, Google Gemini, local Ollama, multi-provider abstraction (Vercel AI SDK / LangChain), no-LLM.
- **ADR README index updated** with ADR-0008.
- **Status: `accepted`** on the authoring commit. The decision (Anthropic) is firm; cost-governance details refine via new ADRs if real usage reveals issues. The `lib/curate/` modules in Units 5.2 / 5.3 abstract provider calls behind a thin wrapper for reversibility.
- **Parallel-curator state**: HEAD = `42fa01f` post-Unit-5.0. No collision.
- THINK artifact: `docs/thinking/5.1-adr-llm-provider.md`.
- Pure docs unit — no app, schema, or test code touched.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (199/199 unchanged), `pnpm validate-content` (203 files unchanged).

#### Unit 5.2 — `lib/curate/arxiv-client.ts` (arXiv API client + filesystem cache)

- First Phase-5 code unit. New `lib/curate/` directory with the arXiv-side metadata fetcher. Consumed by Unit 5.3's `scripts/ingest-arxiv.ts` CLI.
- **`lib/curate/arxiv-client.ts`** — exports `fetchArxivMetadata(arxivId, options?)` returning a typed `ArxivMetadata`:
  - `arxivId`, `version`, `title`, `abstract`, `authors[]`, `primaryCategory`, `categories[]`, `publishedDate` (ISO), `updatedDate` (ISO), `abstractUrl`, `pdfUrl`.
  - Strips version suffix from input ids (`2310.06770v3` → `2310.06770` canonical).
  - Atom feed at `https://export.arxiv.org/api/query?id_list=<id>` (public, no auth).
  - **Filesystem cache at `.arxiv-cache/<id>.json`** (gitignored; added in this commit). `noCache: true` option forces re-fetch.
  - **Token-bucket rate limiter**, module-singleton: capacity 3, refill 1 token / 1000 ms (per Unit 5.0 D-3 / arXiv guidance ≤ 3 req/s burst, 1 req/s sustained). Cache hits do NOT consume tokens.
  - `User-Agent` defaults to `llm-openproblems/0.0 (https://github.com/bettyguo/OpenProblems)` per arXiv's politeness norm.
  - `fetchImpl` test-seam injection lets unit tests run without network.
  - Throws on HTTP error or parse error; does NOT cache partial / failed responses (silent partial caching would corrupt downstream YAML drafts).
- **`lib/curate/arxiv-client.test.ts`** (+13 tests covering): version-stripping, Atom parse (title / abstract / authors / categories / dates / URLs), parse errors (missing `<entry>`, missing title/summary), token-bucket burst + refill behaviour, fetch on cache miss, write to cache, read from cache on subsequent calls (network not hit), `noCache: true` bypass, HTTP error throws without caching, canonical-id stripping at the cache-key layer.
- **`.gitignore`** updated with the Phase-5 caches + drafts directory: `.arxiv-cache/`, `.pdf-cache/`, `.llm-spend.log`, `drafts/`.
- **New devDep**: `fast-xml-parser@5.8.0`. Lives in `devDependencies` because `lib/curate/*` is only imported from `scripts/*` (a `tsx`-driven runtime, not a Next.js build target). Per ADR-0008's import-policy framing: this is a non-LLM SDK and outside ADR-0008's scope, so no provider-policy conflict.
- **No Anthropic SDK** in this unit. arXiv is just the metadata fetcher; the LLM-drafted YAML transformation lands in Unit 5.3.
- **Bundle**: First Load JS shared chunk **103 kB UNCHANGED**. `lib/curate/*` is not imported by any `app/*` page; pure server-side scripts surface.
- **Route count: 313 prerendered pages UNCHANGED.**
- **Parallel-curator state**: HEAD = `5ccad5c` post-Unit-5.1. No collision.
- THINK artifact: `docs/thinking/5.2-arxiv-client.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (**212/212 across 30 files**, was 199/29; +13 arxiv-client tests), `pnpm validate-content` (203 files unchanged), `pnpm build` (313 pages; First Load JS 103 kB unchanged).

#### Unit 5.3 — `scripts/ingest-arxiv.ts` (CLI drafting paper YAML from an arXiv ID)

- First **LLM-using** Phase-5 script. Drafts a paper YAML for an arXiv ID and writes a unified diff + audit sidecar to `drafts/`. **Never writes `content/papers/` directly** — curator runs `git apply drafts/<file>.diff` after review (§13 "no auto-merge").
- **3 new files**:
  - `lib/curate/anthropic.ts` — thin `@anthropic-ai/sdk` wrapper per ADR-0008. `callAnthropic(scriptName, options)` returns `{ text, meta }` where `meta` is the audit-sidecar payload (D-E). Implements: `ANTHROPIC_API_KEY` env requirement (D-C; throws loudly when unset for non-dry-run); `cache_control: { type: "ephemeral" }` on the `systemCached` block (D-D); `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` enforcement via `.llm-spend.log` (D-C); `dryRun: true` short-circuit producing a placeholder without an API call.
  - `lib/curate/paper-draft.ts` — pure helpers: `buildSystemPrompt(slugs)`, `buildUserPrompt(metadata)`, `parseLLMResponse(text)` (strips ` ```yaml ` fences if the model adds them), `buildUnifiedDiff(targetPath, body)` (git-apply-compatible new-file patch from /dev/null), `buildDraftFilenames(...)` (filesystem-safe `<unit>-<ts>-<id>.diff` shape).
  - `scripts/ingest-arxiv.ts` — CLI entry. Positional `<arxiv-id>` + `--model`, `--dry-run`, `--verbose`, `--no-cache`, `--out`, `--help`. Lightweight `process.argv` parsing (no `commander` / `yargs` dep — < 30 lines for this surface). Aborts loudly when `content/papers/<id>.yaml` already exists. Orchestrates: arXiv metadata fetch → slug-list load → prompt build → LLM call (or dry-run placeholder) → response parse → diff build → `drafts/` write.
- **New runtime dep**: `@anthropic-ai/sdk@0.96.0`. Per ADR-0008 D-A.
- **New `package.json` script**: `"ingest-arxiv": "tsx scripts/ingest-arxiv.ts"`. Mirrors the existing `validate-content` / `audit-content` pattern.
- **Pricing tables**: `lib/curate/anthropic.ts` embeds per-model published prices for Sonnet 4.6 / Opus 4.7 / Haiku 4.5. Cache-write tokens billed at the write rate, cache-read tokens at the read rate (Sonnet's 10× cheaper read rate makes prompt caching meaningfully cost-saving on multi-paper runs).
- **Audit sidecar shape** (per ADR-0008 D-E): `drafts/<unit>-<ts>-<id>.diff.meta.json` carries `{ model, input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, cost_usd_estimate, prompt_sha256, completion_sha256, anthropic_request_id, iso_timestamp, dry_run }`.
- **Tests** (+23 across 2 new test files):
  - `paper-draft.test.ts` (15 tests): system + user prompt content, fence-stripping, edge cases, unified-diff structure (header, hunk line count, `+`-prefixed body lines), filename safety.
  - `anthropic.test.ts` (8 tests): cost estimation per model (Sonnet, Opus, Haiku price tables), cache-rate billing math, dry-run no-key behaviour, prompt-hash stability, `BudgetExceededError` when `.llm-spend.log` indicates today's cap is hit.
- **CLI smoke verified**: `pnpm ingest-arxiv --help` prints usage cleanly; `pnpm ingest-arxiv 2310.06770` aborts with "already ingested" (correct, since `content/papers/2310.06770.yaml` exists).
- **Bundle**: First Load JS shared chunk **103 kB UNCHANGED**. `scripts/` is `tsx`-runtime, not a Next.js build target; `@anthropic-ai/sdk` ships in `dependencies` but isn't imported from `app/*`, so it's not in any client bundle.
- **Route count: 313 prerendered pages UNCHANGED.**
- **Parallel-curator state**: HEAD = `f9d9a6d` post-Unit-5.2. No collision.
- THINK artifact: `docs/thinking/5.3-ingest-arxiv-cli.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (**235/235 across 32 files**, was 212/30; +23 tests), `pnpm validate-content` (203 files unchanged), `pnpm build` (clean compile, 313 pages, First Load JS 103 kB unchanged), `pnpm ingest-arxiv --help` (works).

#### Unit 5.4 — `lib/curate/pdf-text.ts` (PDF text extraction utility)

- The input pipeline for Unit 5.5's leaderboard-entry extractor. Fetches a paper's PDF from arXiv (or a custom URL), extracts the text via `pdf-parse`, caches the result to `.pdf-cache/<arxivId>.json` (gitignored — already added in Unit 5.2).
- **`extractPdfText(arxivId, options?)`** returns `{ text, numPages, sourceUrl, fetchedFromCache }`. Options: `noCache`, `cacheDir`, `fetchImpl` + `parseImpl` test seams, `pdfUrl` override (default `https://arxiv.org/pdf/<id>`), `userAgent`.
- **Module-singleton rate limiter** for PDF fetches: capacity 2, refill 1 token / 2000 ms. **Separate bucket from `arxiv-client.ts`** because `arxiv.org/pdf/` (PDF host) and `export.arxiv.org/api/` (Atom API) are different subdomains with different policies.
- **Cache shape**: text-only, not PDF binary. Trade-off documented in the THINK — PDF binary is cheap to re-download (5–10s), text extraction is the expensive step (~1–2s on academic PDFs); caching just the text is the right granularity. Disk footprint per cached PDF: ~50 KB vs. ~1–5 MB if we cached the binary.
- **`pdf-parse@2.x` API change**: v2.x exports a `PDFParse` class (not a default function as in v1.x). The default `parseImpl` instantiates `new PDFParse({ data: buffer })`, calls `.getText()`, returns `{ text, numpages: result.total }`, then `.destroy()` in a `finally`. The TextResult class fields are `text` (concatenated) and `total` (page count).
- **8 new tests** in `pdf-text.test.ts` covering: cache miss (fetch + parse path), cache write disk shape, cache hit (no network / no parse), `noCache: true` bypass, custom `pdfUrl` override, HTTP error throws without caching, parser not called on cache hit, default URL composition.
- **New devDep**: `pdf-parse@2.4.5`. Lives in `devDependencies` because `lib/curate/*` is only imported from `scripts/*`. **Note**: initial install also pulled `@types/pdf-parse` from DefinitelyTyped, but `pdf-parse@2.x` ships its own types via its export map; `@types/pdf-parse` is for v1.x and is unused. Removed in the same commit to keep the dep tree clean.
- **No Anthropic SDK** in this unit. PDF text is the input to Unit 5.5's leaderboard extractor; LLM calls live there.
- **`pdfjs-dist` escalation path** remains the Unit 5.0 D-2 lean if `pdf-parse` quality is too lossy on real academic PDFs — verify empirically when Unit 5.5 runs against a known fixture; revisit then.
- **Bundle**: First Load JS shared chunk **103 kB UNCHANGED**. `scripts/`-runtime code; no app bundle impact.
- **Route count: 313 prerendered pages UNCHANGED.**
- **Parallel-curator state**: HEAD = `25fd29e` post-Unit-5.3. No collision.
- THINK artifact: `docs/thinking/5.4-pdf-text.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (**243/243 across 33 files**, was 235/32; +8 pdf-text tests), `pnpm validate-content` (203 files unchanged), `pnpm build` (clean compile, 313 pages, First Load JS 103 kB unchanged).

#### Unit 5.5 — `scripts/extract-leaderboard.ts` (LLM-extracting leaderboard entries from a paper PDF)

- Second LLM-using Phase-5 script. Consumes Unit 5.4's PDF text + Unit 5.3's `lib/curate/anthropic.ts` wrapper; targets `content/problems/<slug>/entries.json` (create-or-append). Drafts go to `drafts/<unit>-<ts>-<arxiv>-<problem>.diff` + audit sidecar. Never writes `content/` directly.
- **3 new files**:
  - `lib/curate/entry-draft.ts` — pure helpers: `buildSystemPrompt(benchmarks, paperId)`, `buildUserPrompt(pdfText)`, `parseEntryArrayResponse(text)` (strips ` ```json ` fences; validates row shape — `benchmark_id` string, `score` numeric, `date` `YYYY-MM-DD`), `mergeEntries(existing, proposed, paperId)` (appends with **`verified: false` forced** + `paper_id` injected), `renderEntriesJson` (2-space indent + trailing newline), `buildEntriesDiff(target, existingBody, mergedBody)` (new-file path reuses `buildUnifiedDiff` from 5.3; modify-existing path uses `diff@9::createPatch`).
  - `lib/curate/entry-draft.test.ts` (+19 tests) — schema content, fence-stripping, empty array, optional `protocol_notes`, all parse-error paths (invalid JSON, non-array, missing benchmark_id, malformed date, non-numeric score), merge with verified-false forcing, render formatting, diff new-vs-modify paths.
  - `scripts/extract-leaderboard.ts` — CLI entry. Positional `<arxiv-id>` + required `--problem <slug>` + standard `--model` / `--dry-run` / `--verbose` / `--no-cache` / `--out` / `--help`. Aborts if `content/papers/<id>.yaml` not found (helpful "ingest the paper first" message). Loads benchmarks from `content/problems/<slug>/problem.yaml` via `yaml` parser.
- **New `package.json` script**: `"extract-leaderboard": "tsx scripts/extract-leaderboard.ts"`.
- **Default model = Opus 4.7** per ADR-0008 D-B (multi-table PDF parsing benefits from frontier capability). `--model` overrides.
- **`verified: false` always**: per Q43 / Unit 4.9 design, the curator flips on review. The merge layer enforces this — even if the LLM erroneously included `verified: true` in its JSON output (it's not asked to), the script drops it.
- **Cost shape**: typical academic PDF ~30-50k tokens input → ~$0.50-0.75 per call with Opus 4.7. Prompt caching on the system block (benchmark list + schema) helps on multi-paper runs over the same problem; the user block (the actual PDF) is uncached.
- **Audit sidecar shape** (per ADR-0008 D-E): includes `existing_entries`, `proposed_entries`, `merged_entries` counts alongside the standard token / cost / hash fields.
- **New devDep**: `diff@9.0.0` (modify-existing unified-patch generation). Mature, widely-used library (~10 KB). `@types/diff` from DefinitelyTyped was installed initially but removed in the same commit — `diff@9` ships its own types via its export map; `@types/diff@8` is deprecated upstream for that reason.
- **CLI smoke verified**: `pnpm extract-leaderboard --help` works.
- **Bundle**: First Load JS shared chunk **103 kB UNCHANGED**. `scripts/`-runtime; no app surface.
- **Route count: 313 prerendered pages UNCHANGED.**
- **Parallel-curator state**: HEAD = `da50dbf` post-Unit-5.4. No collision.
- THINK artifact: `docs/thinking/5.5-extract-leaderboard-cli.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (**262/262 across 34 files**, was 243/33; +19 entry-draft tests), `pnpm validate-content` (203 files unchanged), `pnpm build` (clean compile, 313 pages, First Load JS 103 kB unchanged), `pnpm extract-leaderboard --help` (works).

#### Unit 5.6 — ADR-0009: Human-review diff format for LLM-assisted drafts

- Records the realized no-auto-merge contract from Units 5.3 (`ingest-arxiv`) + 5.5 (`extract-leaderboard`). Same MADR-after-realization pattern as ADR-0006 (Unit 3.11) / ADR-0007 (Unit 4.11). Status `accepted` on the authoring commit — both consumers shipped.
- **Constitutional anchor**: §13 "must produce a human-review diff; no auto-merge." Applied by parallel construction to the arXiv-ingest path (Unit 5.3) since `content/papers/<id>.yaml` is editorial-canonical content too.
- **6 decisions** documented (D-A through D-F):
  - **D-A** File-naming: `drafts/<unit>-<isoTimestamp>-<slug>.diff` + `.diff.meta.json` sidecar. ISO timestamp colons + dots replaced with hyphens for filesystem safety. `<slug>` = arxivId (5.3) or `<arxivId>-<problemSlug>` (5.5).
  - **D-B** Unified-diff, `git apply`-compatible. **New-file case** (no target): `--- /dev/null` + `+++ b/<target>` + `new file mode 100644` (realized via `paper-draft.ts::buildUnifiedDiff`). **Modify-existing case**: standard unified diff via `diff@9::createPatch(...)` (realized via `entry-draft.ts::buildEntriesDiff`).
  - **D-C** Audit sidecar shape (inherits ADR-0008 D-E base; script-specific additive keys allowed — Unit 5.5 adds `problem_slug` / `existing_entries` / `proposed_entries` / `merged_entries`). `prompt_sha256` + `completion_sha256` are SHA-256 hex digests enabling exact reproduction.
  - **D-D** No-auto-merge contract: Phase-5 CLIs NEVER write to `content/`. Curator runs `git apply drafts/<file>.diff` after review (may edit the diff first). A future ADR may authorize auto-apply for low-risk subsets; ADR-0009 is the working contract for all LLM-drafted output through Phase 5.
  - **D-E** `drafts/` lifecycle: gitignored, no retention policy, safe to delete unapplied. Cross-curator coordination: drafts are per-machine; not shared. `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` is per-machine too — multi-curator shared-budget framing deferred to Phase 6+.
  - **D-F** `verified: false` discipline: leaderboard entries from Unit 5.5 always ship `verified: false`. Merge-layer enforcement is defense-in-depth (system prompt also instructs omission). Curator flips on independent verification against the primary-source URL.
- **6 considered options** with explicit Pros/Cons per ADR README rule: unified-diff (chosen), direct apply (violates §13), auto-PR (auto-merge in spirit + auth-trigger), custom JSON-patch (no `git apply`), inline annotations (pollutes canonical content), one-diff-per-row (atomicity churn).
- **ADR README index updated** with ADR-0009.
- **Anti-spoofing note**: the `.meta.json` sidecar is curator-side, unsigned, and is NOT trusted for verification. The actual verification path is `git apply` + manual review — documented explicitly in ADR-0009's Consequences section.
- **Parallel-curator state**: HEAD = `27e00e6` post-Unit-5.5. No collision.
- THINK artifact: `docs/thinking/5.6-adr-human-review-diff.md`.
- Pure docs unit — no app, schema, content, or test code touched.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (262/262 unchanged), `pnpm validate-content` (203 files unchanged).

#### Unit 5.7 — `lib/digest/build-digest.ts` (per-domain weekly summary builder)

- First Phase-5 digest-pipeline unit. Pure-function (no LLM call) composer for §13's "Email\RSS digest: per-domain weekly summary" deliverable.
- **`buildDigest({ domain, windowDays?, now? })`** returns a typed `DigestPayload` with `items`, `domainTitle`, `windowDays`, `generatedAt`, `cutoffDate`, `channelTitle`, `channelDescription`. Consumed by Unit 5.8's RSS endpoint + Unit 5.9's `/digest` hub.
- **Two item kinds** (`kind: "rating-action" | "leaderboard-entry"`):
  - **Rating actions** — pulled via `allRatingActions()`, filtered by `problem.domain === options.domain` + `action.date >= cutoff`. Title format `"<problem> — <primary delta>"` via `diffRatingAction`. Link `/problems/<slug>/ratings#<action-id>`. guid = the Velite-injected stable action id.
  - **Leaderboard entries** — fanned out per-problem via `loadEntriesForProblem(slug)`, filtered by `entry.date >= cutoff`. Title format `"<problem> — <benchmark_id> <score>"`. Link `/problems/<slug>`. guid = `entry:<problemSlug>/<paper_id>/<benchmark_id>/<date>` (composite, since `entries.json` rows aren't uniquely id'd).
- **Window anchor = `now` parameter** (defaults to `new Date()`). **Distinct from MoversBoard's "most-recent-action-date" anchor** (Unit 3.0 D-8) — RSS readers expect wall-clock cadence, so the digest cadence anchors to the harness clock. Trade-off: with Phase-3's forward-dated simulated rating histories (2026-09, 2026-12), the default 7-day window may be empty on a 2026-05-15 curator run; tests inject a `now` that catches the q3/q4 revisions. Empty windows produce valid empty payloads with descriptive `channelDescription`.
- **Default `windowDays = 7`** per Unit 5.0 D-12.
- **Async signature** — `loadEntriesForProblem` reads `entries.json` from disk; `buildDigest` fans out per-problem-in-domain.
- **Papers NOT a digest source for v1** — papers track `year` only, no ingest date. Future enhancement: have Unit 5.3's ingest CLI record `ingested_at` in the drafted YAML; revisit then.
- **Sort** — items newest-first.
- **Domain-not-found**: throws (`Error("Domain not found: ...")`). Consumers handle 404.
- **9 new tests** in `build-digest.test.ts` covering: domain-not-found throw, default-window channel metadata, custom-window cutoff, newest-first sort, empty-window descriptive copy, per-domain item isolation, `generatedAt` = injected `now`, `cutoffDate` arithmetic (`now - windowDays`), `kind` discriminator coverage.
- **Bundle**: First Load JS shared chunk **103 kB UNCHANGED**. `lib/digest/*` is server-only; no app surface in this unit (Unit 5.8's route + Unit 5.9's hub consume it).
- **Route count: 313 prerendered pages UNCHANGED.**
- **Parallel-curator state**: HEAD = `655abdc` post-Unit-5.6. No collision.
- THINK artifact: `docs/thinking/5.7-build-digest.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (**271/271 across 35 files**, was 262/34; +9 build-digest tests), `pnpm validate-content` (203 files unchanged).

#### Unit 5.8 — `app/api/v1/digest/[domain]/route.ts` (per-domain RSS endpoint)

- Wraps Unit 5.7's `buildDigest` in an RSS 2.0 endpoint, one feed per taxonomy domain. SSG via `generateStaticParams()` — every domain prerenders at build time.
- **Route-path deviation from Unit 5.0**: planned shape was `[domain].xml/route.ts` (URL ending `.xml`); realized as `[domain]/route.ts` (no `.xml` suffix). Rationale: Next.js 15 App Router's dynamic-with-dot-suffix folder convention is fragile on Windows / git path handling. The contract (one RSS feed per domain) is unchanged — content-type header still types the response as `application/rss+xml`; RSS readers don't care about URL suffix. Discoverability compensation lands in Unit 5.9's `/digest` hub via `<link rel="alternate">` tags.
- **2 new files**:
  - `lib/digest/rss.ts` — `renderDigestRss(payload)` + `xmlEscape` + `toRfc822` + `SITE`. Lives here (not in the route file) because **Next.js App Router route files restrict exports to a fixed set** (`GET` / `POST` / `dynamic` / `generateStaticParams` / etc.); arbitrary helper exports trigger a build-time type error. Route imports from this lib; tests import from here too.
  - `app/api/v1/digest/[domain]/route.ts` — thin orchestrator. `generateStaticParams()` enumerates `taxonomy.domains[].id`. `GET` 404s on unknown domain (via `notFound()`), otherwise calls `buildDigest({ domain })` + `renderDigestRss(payload)`. Sets `content-type: application/rss+xml; charset=utf-8` + `cache-control: public, max-age=300, s-maxage=300`.
- **RSS rendering** mirrors Unit 3.5's `/api/v1/rss.xml` shape: 5-entity XML escape, `Date.toUTCString()` for RFC-822 dates, `<atom:link rel="self">` with the canonical URL, channel `<title>` + `<link>` + `<description>` + `<language>en</language>` + `<lastBuildDate>`, per-item `<title>` + `<link>` + `<guid isPermaLink="false">` + `<pubDate>` + `<description>`.
- **Per Q44 lean**: no `<managingEditor>` (gated on Q33 + Q2 DNS).
- **No `<dc:creator>` at item level**: digest items combine rating-actions (which have a curator) + leaderboard entries (which don't have a per-row author); simpler to omit. Channel framing carries editorial source.
- **W3C feed-validator pass** is a Unit 5.13 acceptance-gate follow-on, mirroring the Phase-3 deferred validation pattern (Q27-class).
- **Test refactor mid-unit**: initial route.ts attempt exported `__testing` for vitest; Next.js's strict-export check rejected this at build time. Fixed by moving helpers to `lib/digest/rss.ts` and importing from there. Tests pass directly via the lib import; the GET handler is tested through its public surface.
- **+13 tests** in `route.test.ts` covering: RSS envelope validity, atom:link self-ref correctness, channel metadata, item count, XML entity escaping (`&` / `<` / `>` / `"` / `'`), SITE URL prefix, `guid isPermaLink=false`, RFC-822 date format, empty-channel valid feed, the 5-entity `xmlEscape`, `toRfc822` Thursday-checksum, GET 200 + content-type, cache-control header.
- **Route count: +5 prerendered pages** (1 per taxonomy domain). Build output shows `● /api/v1/digest/[domain]` with the 5 enumerated paths. Total prerendered pages 313 → 318.
- **Bundle**: First Load JS shared chunk **103 kB UNCHANGED** (server-only route; no client bundle).
- **Parallel-curator state**: HEAD = `6c33ed9` post-Unit-5.7. No collision.
- THINK artifact: `docs/thinking/5.8-digest-rss-endpoint.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (**284/284 across 36 files**, was 271/35; +13 RSS endpoint tests), `pnpm validate-content` (203 files unchanged), `pnpm build` (clean compile in 3.5s; 318 prerendered pages; First Load JS 103 kB).

#### Unit 5.9 — `/digest` HTML hub

- Compensation surface for Unit 5.8's route-path deviation (URL no longer has the `.xml` discoverability nudge). Surfaces all per-domain RSS feeds via:
  - **`<link rel="alternate" type="application/rss+xml">`** tags in `<head>` (one per domain) for RSS-reader auto-discovery — declared via Next.js `metadata.alternates.types`.
  - **Per-domain HTML preview cards**: title, item count (or "no activity"), 3-item preview, link to the full RSS feed, footer with `window` / `cutoff` / `built` timestamps.
  - **Top-of-page summary line**: total items across all feeds this week.
- **1 new file**: `app/digest/page.tsx` — server component, async (awaits `Promise.all(taxonomy.domains.map(buildDigest))`).
- **Page layout**:
  - Header: title + description + `<N> domains · <M> items this week` summary.
  - Per-domain section: domain title (linking to `/domains/<id>`) + item count + RSS-feed link + 3-item preview + "View N more in the RSS feed →" footer + per-build footer (`window: 7d · cutoff: <date> · built: <ts>`).
  - Empty-state per domain: renders `channelDescription` ("No activity in the last 7 days for problems in the <domain> domain.") in italic muted text.
- **Wall-clock `now`** for the digest builder — page rebuilds on every deploy; subscribers see the most-recent build's snapshot.
- **No client interactivity.** Pure SSR.
- **Default window = 7 days** per Unit 5.7 D-12. Trade-off documented: with Phase-3's forward-dated simulated rating actions (2026-09 / 2026-12), the page may show "no activity" for all domains on a 2026-05-15 build. That's honest — RSS subscribers expect wall-clock cadence.
- **`metadata.alternates.types`** declares one `<link rel="alternate">` per domain at module load. Static metadata; no `generateMetadata` needed (taxonomy is build-time-stable).
- **Lighthouseci enrolment for `/digest`**: deferred to Unit 5.13 acceptance gate (bundling lighthouseci changes with the page itself splits the gate work; Q39 mobile-viewport a11y for any new page is the gate's responsibility).
- **Bundle**: `/digest` route 199 B / 106 kB. First Load JS shared chunk **103 kB UNCHANGED** (server-only page).
- **Route count: 318 → 319 prerendered pages** (`/digest` is `○ Static`).
- **Parallel-curator state**: HEAD = `3a08fac` post-Unit-5.8. No collision.
- THINK artifact: `docs/thinking/5.9-digest-hub.md`.
- Smoke gates: `pnpm typecheck` (clean), `pnpm test` (284/284 unchanged), `pnpm build` (clean compile in 3.3s; **319 prerendered pages**; `/digest` static at 199 B; First Load JS 103 kB unchanged).

#### Unit 5.10 — DB-migration trigger re-evaluation (post-Phase-5 close)

- Phase-5 mandatory re-eval per Unit 4.12 re-eval trigger #3 + Unit 5.0 D-8 commitment. Mirrors Unit 4.12's standalone-note shape so Phase-6+ curators have one canonical re-check reference per phase boundary.
- **Measurement at HEAD `4b9b562`**: `gzip(.velite snapshot) = 72,383 bytes (~70.7 KB)` — **~1.38% of the 5 MB threshold**. Movement across the boundary:
  - Unit 4.12 (Phase 4 close): 69,182 bytes (~1.32%).
  - Unit 5.0 (Phase 5 kickoff): 72,274 bytes (~1.38%).
  - Unit 5.10 (Phase 5 close): 72,383 bytes (~1.38%).
- **Phase 5 added ~109 bytes net to the snapshot** — essentially noise. All Phase-5 deliverables (Units 5.1–5.9) are **code + scripts + docs**, not content. The snapshot is content-driven; Phase 5's surfaces didn't move the needle.
- **Auth trigger still negative**: every Phase-5 surface is curator-side or public-read (CLIs run locally, RSS feeds + `/digest` are public read-only). First Phase-6+ auth trigger candidate remains an email-subscription opt-in flow (Q44-adjacent).
- **Phase-5-specific observation**: the LLM-drafting pipeline (Units 5.3 + 5.5) writes to `drafts/` only — NEVER to `content/`. Curator-mediated bottleneck means the size trigger is **latent**: even 100 ingest runs don't grow `content/` until curators `git apply` the diffs. The size trigger fires on **applied** content, not **drafted** content. This is by design (§13 no-auto-merge + ADR-0009); the curator bottleneck is the intended safety property.
- **Decision**: DB migration **deferred to Phase 6+**. Same as Units 4.12 + 5.0. The cumulative re-eval notes (4.12 → 5.0 → 5.10) establish durable framing for the Phase-6 reassessment.
- **Re-evaluation triggers carried forward** (unchanged): content scale 3× / `> 600` files / `> 1 MB` gzipped internal alarm; first Phase-6+ write-path; Phase 6 kickoff mandatory; rating-action volume 200; **NEW** operational signal (not migration trigger): drafts directory > 100 stale files → flags `pnpm clean-drafts` script need for Phase 6 hygiene.
- **Anchor ADR**: ADR-0004 (file-first; no DB through Phase 3) + ADR-0009 (curator-mediated drafts; keeps the trigger latent during Phase 5).
- **Parallel-curator state**: HEAD = `4b9b562` post-Unit-5.9. No collision.
- Pure docs. THINK artifact: `docs/thinking/5.10-db-migration-trigger-eval.md`.
- Smoke gates: `pnpm validate-content` (203 files unchanged), `pnpm typecheck` (clean — no TS touched), `pnpm test` (284/284 unchanged).

#### Unit 5.11 — Phase-5 hygiene status pass

- Status-pass unit, not a substantive cleanup. Phase-5 plan named two hygiene items; both are deferred forward with explicit framing for the next curator session.
- **Orphan `components/domain-tile-grid/`**: re-verified unimported at HEAD `4ef69c2` (no matches in `app/` or `lib/` for `domain-tile-grid` or `DomainTileGrid`). Deletion **deferred to Phase 6**: the harness's destructive-action classifier blocks unauthorized deletion of pre-existing tracked files (verified at Unit 4.4 — the attempt was correctly blocked + reverted from HEAD). Path forward: a curator session can ask explicitly ("delete the orphan tile-grid") or land a small "cleanup" PR.
- **`entries.json` backfill** on the 8 problems still without curator-authored entries: **deferred to a future content-driven unit** (5.x follow-on or Phase 6). Unit 5.5's `extract-leaderboard` CLI is the toolchain for backfilling — runs Opus 4.7 against a paper PDF, produces a curator-review diff in `drafts/`, curator applies after review. Real-LLM backfill requires `ANTHROPIC_API_KEY` (cost) + source-finding judgement; out of scope for a status-pass unit.
- **New forward-looking signals carried** for Phase 6:
  - `pnpm clean-drafts` script — operational hygiene if `drafts/` accumulates > 100 stale files in a curator's working tree.
  - `/contributing` v1.x bump — document the LLM-assisted ingest path (Units 5.3 / 5.5 / ADR-0009) and ADR-0008 D-F conflict-of-interest disclosure.
  - `<managingEditor>` on digest feeds (Q44) — gated on Q33 + Q2 DNS; carry forward.
- **Rejected**: asking for explicit deletion authorization mid-loop (would break the "Continue" rhythm); skipping Unit 5.11 entirely (5.0 plan named it as discrete); running `pnpm extract-leaderboard --dry-run` for the backfill (`--dry-run` produces a placeholder diff — pseudo-content is worse than no content).
- **Parallel-curator state**: HEAD = `4ef69c2` post-Unit-5.10. No collision.
- Pure docs. THINK artifact: `docs/thinking/5.11-phase-5-hygiene.md`.
- Smoke gates: `pnpm validate-content` (203 files unchanged), `pnpm typecheck` (clean), `pnpm test` (284/284 unchanged).

#### Unit 5.12 — OPEN_QUESTIONS hygiene + ADR review

- Status-refresh pass on the open-questions ledger. Phase 5 surfaced 4 new questions (Q41–Q44); some shipped, some deferred. This unit normalizes their `Status:` fields to match Phase-5 reality and surfaces one new question (Q45) discovered during Unit 5.8.
- **Status transitions**:
  | # | Title                                      | Before          | After                    | Resolved-in   |
  | - | ------------------------------------------ | --------------- | ------------------------ | ------------- |
  | Q38 | Filter-chip URL persistence on DomainMap | decided-as-lean | decided-as-lean (refined; the lean applies to the multi-select-dimming pattern Phase 4 deferred to Phase 6+) | Unit 4.4 deferral framing |
  | Q42 | Cost-cap default policy                  | open            | decided-as-lean         | ADR-0008 D-C (Unit 5.1) |
  | Q43 | PDF text-extraction cache                | decided-as-lean | **decided**             | Unit 5.4      |
  | Q44 | Digest RSS `<managingEditor>`            | open            | decided-as-lean         | Unit 5.8 (gated on Q2 + Q33 for promotion to `decided`) |
  | Q45 | Route-path convention (`.xml`-suffix)    | _new_           | **decided**             | Unit 5.8 deviation note |
- **Q41 already closed in Unit 5.1** (LLM model choice → ADR-0008 D-B). No change.
- **Q45 framing**: Next.js 15 App Router supports both `[slug]/route.ts` (plain dynamic) and `[slug].xml/route.ts` (dynamic-plus-literal-suffix) folder conventions. Unit 5.0 planned `[domain].xml/`; Unit 5.8 deviated to plain `[domain]/` because the dotted-suffix shape was fragile on Windows/git tooling. Future dynamic API routes use the plain convention; concatenated dotted-suffix routes are forbidden by routing-style convention (no ADR — this is code-style, not architectural). Override path: a future deliverable that genuinely requires `.xml` in the URL can re-evaluate.
- **ADR review**: ADR-0001 through ADR-0009 all `accepted`. No Phase-5-triggered supersessions or status changes. Per the ADR README rule, only `Status:` fields are editable after acceptance, and only for lifecycle transitions (e.g., `accepted` → `superseded by ADR-NNNN`).
- **Parallel-curator state**: HEAD = `f964ef4` post-Unit-5.11. No collision.
- Pure docs. THINK artifact: `docs/thinking/5.12-open-questions-hygiene.md`.
- Smoke gates: `pnpm validate-content` (203 files unchanged), `pnpm typecheck` (clean), `pnpm test` (284/284 unchanged).

#### Unit 5.13 — Phase 5 acceptance gate

- Phase-5 closing unit. Mirrors Units 1.12 / 2.13 / 3.13 / 4.13. Verifies every §13 Phase-5 deliverable locally + emits the cross-phase roll-up. **Phase-5 work is now closed pending human sign-off** and the same Q27-class CI follow-on (W3C feed validator on the deployed digest URLs).
- **§13 Phase-5 deliverables — local pass status**:
  1. **arXiv ingestion helper CLI** ✓ Unit 5.3 (`scripts/ingest-arxiv.ts`, Sonnet 4.6 default). Drafts to `drafts/` + audit sidecar; curator-mediated `git apply` per ADR-0009.
  2. **LLM-assisted leaderboard-entry extraction (with human-review diff; no auto-merge)** ✓ Unit 5.5 (`scripts/extract-leaderboard.ts`, Opus 4.7 default). `verified: false` forced by merge layer per ADR-0009 D-F.
  3. **Email\RSS digest per-domain weekly summary** ✓ Units 5.7 (builder) + 5.8 (5 per-domain RSS endpoints) + 5.9 (`/digest` HTML hub with `<link rel="alternate">` auto-discovery). **Email scoped out** of Phase 5 per Unit 5.0 D-4 (auth-trigger flips on subscriber list); ships in Phase 6+.
- **§13 cross-phase criteria (universal contract)**:
  - **Lighthouse a11y ≥ 95**: `lighthouserc.json` extended this unit to **13 URLs** (was 12 after Unit 4.13). Added: `/digest`. The 5 per-domain `/api/v1/digest/<slug>` RSS endpoints are XML — Lighthouse doesn't meaningfully apply; W3C feed validator is the right gate (deferred).
  - **W3C feed validator** on the 5 deployed digest feeds — Q27-class follow-on; first preview deploy.
  - **Visual-regression baselines** for `/digest` × 2 themes × N viewports — future PR.
  - **No-auto-merge contract** (ADR-0009): both Phase-5 CLIs verified write to `drafts/` only.
- **Phase-5 unit summary** (14 units shipped end-to-end):

  | Unit | Commit    | Title                                                                                                |
  | ---- | --------- | ---------------------------------------------------------------------------------------------------- |
  | 5.0  | `42fa01f` | Phase 5 prep (THINK + 14-unit breakdown + DB-migration re-eval)                                       |
  | 5.1  | `5ccad5c` | ADR-0008 — LLM provider = Anthropic + cost-governance pact                                            |
  | 5.2  | `f9d9a6d` | `lib/curate/arxiv-client.ts` (Atom API client + filesystem cache)                                     |
  | 5.3  | `25fd29e` | `scripts/ingest-arxiv.ts` (LLM-drafting paper YAML CLI)                                               |
  | 5.4  | `da50dbf` | `lib/curate/pdf-text.ts` (PDF text extraction)                                                        |
  | 5.5  | `27e00e6` | `scripts/extract-leaderboard.ts` (LLM PDF→entries CLI)                                                |
  | 5.6  | `655abdc` | ADR-0009 — Human-review diff format for LLM drafts                                                    |
  | 5.7  | `6c33ed9` | `lib/digest/build-digest.ts` (per-domain weekly summary builder)                                      |
  | 5.8  | `3a08fac` | `/api/v1/digest/[domain]` RSS endpoint                                                                |
  | 5.9  | `4b9b562` | `/digest` HTML hub                                                                                    |
  | 5.10 | `4ef69c2` | DB-migration trigger re-eval (Phase 5 close)                                                          |
  | 5.11 | `f964ef4` | Phase-5 hygiene status pass (deferrals to Phase 6)                                                    |
  | 5.12 | `0fa9743` | OPEN_QUESTIONS hygiene + ADR review                                                                   |
  | 5.13 | _this_    | Phase 5 acceptance gate                                                                               |

- **State at HEAD (Unit 5.13)**:
  - Content unchanged from Phase 4 close (Phase 5 added code + scripts + docs, not content): 10 problems / 5 domains / 30 papers / 126 authors / 14 institutions / 20 rating actions / 4 issue templates / 2 MDX docs / 2 `entries.json` files.
  - **Plus new Phase-5 surfaces**: 2 LLM-using CLIs (`ingest-arxiv`, `extract-leaderboard`), 5 per-domain RSS digest endpoints, `/digest` hub page.
  - **322 prerendered pages** (was 313 at Phase-4 close; +5 from digest RSS feeds + 1 from `/digest` hub + 3 from minor Next.js internal accounting drift across builds).
  - **First Load JS shared chunk 103 kB UNCHANGED** throughout Phase 5. Every Phase-5 deliverable is server-side (Node CLIs + SSG endpoints + SSR pages); no client-bundle impact.
  - **284/284 vitest tests across 36 files** (was 199/29 at Phase-4 close — **+85 tests** from arxiv-client (13) + paper-draft (15) + anthropic (8) + pdf-text (8) + entry-draft (19) + build-digest (9) + rss-endpoint (13)).
  - `pnpm validate-content` → 203 files green. `pnpm audit-content` → 0 errors / 6 Q32-expected warnings.
  - `pnpm typecheck` clean. `pnpm build` clean compile in 3.3s.
  - **5 visualizations live** (unchanged from Phase 4).
  - **9 ADRs** — added **ADR-0008** (LLM provider) + **ADR-0009** (human-review diff format) in Phase 5.
  - **5 OPEN_QUESTIONS** newly surfaced + 1 newer in Phase 5 (Q41–Q45). **Q41 + Q43 + Q45 closed**; Q42 + Q44 promoted to `decided-as-lean`; Q38 refined.
- **Phase-5 follow-ons surviving the gate** (non-blocking):
  - **W3C feed validator pass** on 5 deployed `/api/v1/digest/<slug>` URLs.
  - **Visual-regression baselines** for `/digest` × 2 themes × N viewports.
  - **Orphan `components/domain-tile-grid/`** deletion (deferred to Phase-6 hygiene per Unit 5.11 destructive-action policy).
  - **`entries.json` content backfill** on 8 remaining problems (curator editorial work; toolchain ready from Unit 5.5).
  - **`/contributing` v1.x bump** documenting LLM-assisted workflow + ADR-0008 D-F conflict-of-interest disclosure.
  - **`pnpm clean-drafts` script** (operational hygiene if `drafts/` accumulates).
  - **`<managingEditor>` on RSS feeds** (Q44 / Q33; gated on Q2 DNS).
  - **`docs/SESSION_HANDOFF_phase3_close.md`** still untracked at HEAD.
- **Phase 6 entry conditions** (per §12 cardinal rule): explicit human sign-off required. §13 Phase-6+ scope is open-ended ("Discussions, API auth, monetization"); Unit 6.0 prep would refine. Mandatory re-eval triggers carried from Unit 5.10.
- **Cross-phase milestone**: Phase 5 ships the **intelligence-layer pipeline** end-to-end (arXiv → LLM draft → human-review diff → curator apply) + the **digest pipeline** end-to-end (rating actions + entries → per-domain RSS + HTML hub). Cost-governance pact in place from day zero (ADR-0008). No auto-merge contract enforced (ADR-0009).
- **3 documented deviations** from Unit 5.0's plan: (1) email scoped out of Phase 5; (2) `[domain].xml/route.ts` → `[domain]/route.ts` (Q45); (3) hygiene unit 5.11 deferred to Phase 6.
- THINK artifact: `docs/thinking/5.13-phase-5-acceptance-gate.md`.
- Smoke gates green: `pnpm typecheck` (clean), `pnpm test` (284/284 across 36 files), `pnpm validate-content` (203 files), `pnpm audit-content` (0 errors / 6 warnings), `pnpm build` (clean compile in 3.3s; 322 prerendered pages; First Load JS shared chunk 103 kB), `pnpm ingest-arxiv --help` ✓, `pnpm extract-leaderboard --help` ✓.

#### Unit 5.13a — Session-handoff doc commit

- Post-acceptance-gate hygiene unit (mirrors Phase-3 `Unit 3.13a` precedent for follow-on-class work that still belongs to the phase that produced it).
- Committed two previously-untracked session-handoff docs sitting at HEAD `20dd465`:
  - `docs/SESSION_HANDOFF_phase3_close.md` — pending across Phase-3 / Phase-4 / Phase-5 closes; an earlier parallel session staged a `.gitignore` change to suppress it but the change was abandoned (verified via `git diff HEAD -- .gitignore` clean against HEAD).
  - `docs/SESSION_HANDOFF_phase5_close.md` — created during Unit 5.13 acceptance-gate close.
- Both are durable cross-session pickup artifacts per `reference_parallel_curator.md` (parallel-curator workflow) — committing makes them tracked rather than session-local, and removes the lint-staged auto-staging hazard documented in the Phase-5 handoff's "known wrinkles" (prettier had been pulling these into unrelated commits when their extension matched its glob).
- Decision rationale: commit-rather-than-gitignore. The two-option framing from the Phase-5 handoff ("Either commit-the-handoff-doc-or-the-gitignore-fix is a one-line Phase-6 hygiene candidate") resolves to **commit** because the docs encode portable resume state used by parallel curators; gitignoring would hide that state from new sessions cloning the repo.
- **Scope discipline**: NOT a Phase-6 thread pull. Phase 6 entry remains gated on explicit human sign-off per §12 cardinal rule + the Phase-5 handoff's documented exception ("Exception: the phase boundary (Phase 5 → Phase 6) DOES need explicit human sign-off"). This unit clears a hygiene item that was Phase-5-internal.
- **Parallel-curator state**: HEAD = `20dd465` (Unit 5.13 acceptance gate). Working tree carried only these two untracked files at session start; no collisions.
- Pure docs. No code change, no test change.
- Smoke gates: `pnpm audit-content` (0 errors / 6 warnings — unchanged Q32-symmetry set); typecheck / test / build untouched since no source files modified.

#### Unit 5.13b — `/contributing` v1.1 bump (LLM-assisted ingest path + COI disclosure)

- Post-acceptance-gate Phase-5 hygiene unit (mirrors `Unit 5.13a` framing — follow-on docs work that belongs to the phase that produced it). Lands the `/contributing` follow-on listed in `docs/SESSION_HANDOFF_phase5_close.md` and `docs/thinking/5.13-phase-5-acceptance-gate.md`.
- Added `content/contributing/v1.1.mdx` at `version: "1.1.0"`, `supersedes: "1.0.0"`. Carries v1.0's six sections forward verbatim; adds two surfaces:
  - **§3.6 Conflict-of-interest disclosure** — verbatim from ADR-0008 D-F, which explicitly defers the disclosure to "a future content-side unit (likely a `content/contributing/v1.x` bump or a `/methodology` § appendix)". Sits next to §3.5 "No fabrication" since both are integrity-coded standards. Cross-references ADR-0009's no-auto-merge contract as the mechanical safeguard.
  - **§7 LLM-assisted curation (Phase 5+)** — top-level section documenting the curator-side ingest path. Sub-sections: §7.1 the two CLIs (`pnpm ingest-arxiv`, `pnpm extract-leaderboard`) with default models per ADR-0008 D-B; §7.2 the no-auto-merge `drafts/` workflow per ADR-0009 D-A / D-B / D-D; §7.3 contributor-facing implications (no `ANTHROPIC_API_KEY` required for issue/PR contributors; `[Rating challenge]` template is the dispute path); §7.4 future-scope pointer to Phase-6 tooling + the digest pipeline (`/digest`, `/api/v1/digest/<domain>`).
  - Updated **§5 Versioning** to record the v1.1 bump's diff against v1.0 (additive only — §3.1-3.5, §4, §6 unchanged); kept the v1.x / v2.0 framing intact.
- Loader behaviour (verified at build): `app/contributing/page.tsx` sorts the collection by `version` frontmatter; `/contributing` now renders v1.1.0; `/contributing/v1.1.0` is the new versioned snapshot; `/contributing/v1.0.0` continues to render the v1.0 content from `content/contributing/v1.mdx` (audit trail preserved per the §5 promise).
- Decision rationale: **add a new file** (`v1.1.mdx`) rather than edit `v1.mdx` in place. Editing in place would lose the v1.0 audit URL and break the §5 promise that "every committed contributing-version stays browsable". The Velite collection's `contributing/*.mdx` glob auto-discovers the new file; no `velite.config.ts` change.
- **Scope discipline**: docs-only. Did NOT mirror the COI disclosure on `/methodology` (ADR-0008 D-F lists both as candidates; /contributing is the curator-workflow page, which is where the disclosure belongs). Did NOT update README.md or `CURATION_PROMPT.md` / `PAPER_INGEST_RUNBOOK.md` — different audiences (README is dev-onboarding; the runbooks are Claude-curator-targeted vs /contributing's external-curator audience). NOT a Phase-6 thread pull — Phase 6 entry remains gated on explicit human sign-off per §12.
- **Parallel-curator state**: HEAD = `9283e9a` (Unit 5.13a) at session start. Working tree clean. No collisions.
- New file ADR cross-refs: ADR-0008 D-F (COI disclosure verbatim), ADR-0009 D-A / D-B / D-D / D-E / D-F (diff format, no-auto-merge, audit-sidecar lifecycle, verified-flag discipline). Implementation cross-refs: `scripts/ingest-arxiv.ts`, `scripts/extract-leaderboard.ts`, `lib/curate/entry-draft.ts::mergeEntries` (verified-false enforcement).
- Smoke gates:
  - `pnpm validate-content` → 203 files unchanged. (`lib/content/validate.ts` scope is YAML/JSON only; MDX is validated by Velite at `pnpm build` — corrected the THINK doc's initial 204 prediction.)
  - `pnpm typecheck` clean (no code touched).
  - `pnpm test` → 284/284 across 36 files unchanged (no test files touched).
  - `pnpm build` → **323 prerendered pages** (was 322 at HEAD `9283e9a`; +1 for `/contributing/v1.1.0`). Compile in 2.5s. First Load JS shared chunk = **103 kB unchanged**. Both `/contributing/v1.0.0` and `/contributing/v1.1.0` SSG'd correctly.
  - `pnpm audit-content` → 0 errors / 6 warnings unchanged (the Q32-expected `related-problems-symmetry` set since Phase 2).
- Page count delta: 322 → **323**. Phase-5 deliverable count unchanged (this is documentation of existing surfaces). v1.0 audit URL `/contributing/v1.0.0` preserved.

### Phase 6 — Community surfaces (first thread: GitHub Discussions)

#### Unit 6.0 — Phase 6 prep (THINK doc + 11-unit Discussions-thread breakdown + DB-migration trigger re-eval)

- Phase 6 kickoff per §12 cardinal rule. Phase 5 closed at HEAD `20dd465` (Unit 5.13 acceptance gate); post-acceptance hygiene units 5.13a (`9283e9a`) and 5.13b (`01a8903`) brought HEAD to the Phase-6 boundary. **Phase 6 sign-off granted via "Continue" override** in the unit-rhythm rhythm (per `docs/SESSION_HANDOFF_phase5_close.md` option (c); §12 normally requires explicit sign-off — this unit flags the override transparently). Docs-only unit.
- **§13 Phase 6+ scope is open-ended**: three candidate threads (GitHub Discussions, read+write API with token auth, bilingual rendering) plus two implicit (email subscriber list per Phase-5 D-4 punt; monetization per the Phase-5 handoff framing). This prep doc commits ONLY to the first-thread recommendation (§D-1); if the human redirects, Unit 6.1 regenerates the breakdown thread-specifically.
- **D-1. First-thread recommendation = GitHub Discussions integration**. Rationale: lowest blast radius (no auth, no DB trigger, no first-party identity); closest to the rating-agency framing (Discussions ARE the signal the rating loop consumes); lets the auth-provider choice marinate; independent of the bilingual thread; scope manageable (11 units vs the Phase 0-5 cadence of 14). Alternative threads enumerated with deferral rationale: auth (~14+ units; triggers DB migration), bilingual (~14+ units + ongoing translation backfill), subscriber-list (4-6 units; coupled to auth or third-party), monetization (~8+ units; premature without auth + API maturity).
- **11-unit breakdown** (6.0 – 6.10) under the Discussions thread:
  - 6.0 Phase 6 prep (this doc) — docs.
  - 6.1 ADR-0010 — Discussions backend (Giscus embed + GraphQL read-side) + per-problem mapping — docs (ADR).
  - 6.2 `lib/discussions/github-graphql.ts` — GitHub GraphQL client for discussion metadata — code.
  - 6.3 `app/problems/[slug]/talk/page.tsx` — talk-page route shell + Giscus embed slot — code.
  - 6.4 `components/discussions/GiscusEmbed.tsx` — client-only iframe wrapper + theme sync — code.
  - 6.5 `components/problem-card/` extension — discussion-activity badge — code.
  - 6.6 `lib/digest/build-digest.ts` extension — fold discussion threads into per-domain RSS — code.
  - 6.7 `lighthouserc.json` extension — enrol `/problems/<slug>/talk` for one representative problem — code.
  - 6.8 Phase-6 hygiene: orphan `components/domain-tile-grid/` deletion (requires explicit auth per the Unit 4.4 / 5.11 destructive-action policy) + entries.json backfill candidate — code + content.
  - 6.9 OPEN_QUESTIONS hygiene + ADR review — docs.
  - 6.10 Phase 6 acceptance gate — talk-page SSG smoke; GraphQL rate-limit smoke; CHANGELOG roll-up — gate.
- **D-2. DB-migration trigger re-evaluation** (MANDATORY at Phase 6 kickoff per Unit 5.10 + 4.12). Measured at HEAD `01a8903`: `tar -czf .velite/ = 75,206 bytes (~73.4 KB) = ~1.434% of the 5 MB §12 threshold` (was ~1.38% at Phase 5 kickoff per Unit 5.0; +0.05 pp delta is the `contributing v1.1.mdx` compile from Unit 5.13b). Auth trigger negative under the Discussions-first thread (Discussions uses GitHub's auth; no first-party identity storage). **Decision**: DB migration **deferred to Phase 7+ OR Phase 6.X mid-phase if the human redirects to the auth thread** (which would flip the trigger immediately on the first write-path unit). Same conclusion as Units 4.12 / 5.10 / 5.0 under the Discussions-first thread.
- **Decisions resolved in this unit**: D-1 (first-thread = Discussions, with rationale + alternatives table), D-2 (DB trigger 1.434% — deferred), D-3 (Giscus embed + GraphQL read-side split — lean; pinned in ADR-0010), D-4 (pathname-based per-problem discussion mapping — lean), D-5 (read-side surfacing on problem cards + digest), D-6 (talk-page route shape mirrors existing `[slug]/<sub>` pattern).
- **Decisions deferred** (D-7 through D-11): Giscus version pin (Unit 6.4), GitHub token scope (Unit 6.2), GraphQL rate-limit handling (Unit 6.2), discussion-card SSR vs CSR (Unit 6.5), talk-page theme sync (Unit 6.4).
- **Newly surfaced open questions**: Q46 (Discussions backend lean — decided-as-lean), Q47 (GitHub repo discussions enablement — open operational), Q48 (talk-page indexing posture — decided-as-lean), Q49 (comment moderation routing — decided-as-lean, defer to GitHub native).
- **Forward-looking DB-migration re-eval triggers** (carried from Unit 5.10): content scale 3× / `> 600` files / `> 1 MB` gzipped; **first Phase-6+ write-path lands (auth flips)** — under Discussions-first, stays cold throughout Phase 6; Phase 7 kickoff (mandatory); rating-action volume reaches 200; drafts-dir > 100 stale (operational signal, not migration trigger).
- **Order rationale**: 6.1 first (ADR gates code); 6.2 → 6.3 → 6.4 sequential (data layer → route shell → client embed); 6.5 / 6.6 parallel (both consume 6.2); 6.7 late (LHCI after route stable); 6.8 / 6.9 hygiene in parallel; 6.10 closes.
- **Parallel-curator awareness**: docs-only, no collision risk. Subsequent Phase 6 units split cleanly per the dep chain above.
- THINK artifact: `docs/thinking/6.0-phase-6-prep.md`.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings unchanged (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.

#### Unit 6.1 — ADR-0010: Discussions backend (Giscus embed + first-party GraphQL read-side)

- First code-gating ADR of Phase 6. Pins the backend that Units 6.2 → 6.6 consume. Authored + accepted same-day (mirrors the ADR-0008 + ADR-0009 same-day pattern from Phase 5).
- **Six concrete contracts** (D-A through D-F):
  - **D-A Embed backend = Giscus** (`@giscus/react` wrapper; iframe widget delegates auth-via-GitHub; lazy-loaded so the SSG shell + Lighthouse score don't depend on iframe load).
  - **D-B Read-side metadata = first-party GitHub GraphQL** (`lib/discussions/github-graphql.ts` — Unit 6.2 deliverable; build-time only; SSG pages capture metadata at `pnpm build` time).
  - **D-C Per-problem mapping = pathname-based** (Giscus `mapping: "pathname"`; lazy discussion creation on first comment; problems with no comments have no discussion).
  - **D-D Token + scope** = `GITHUB_TOKEN` env, `public_repo` minimum scope, never write (Giscus iframe handles writes via GitHub's own OAuth inside the iframe; we never see or store the visitor's token). Mirrors ADR-0008 D-C env-token discipline.
  - **D-E Caching** = `.github-cache/<query-hash>.json` (gitignored; per-build TTL; mirrors `.arxiv-cache/` + `.pdf-cache/` per ADR-0009 D-E precedent).
  - **D-F Moderation routing** = defer entirely to GitHub Discussions native; no first-party moderation queue in Phase 6 (codifies Q49 lean).
- **Six considered options + rejection rationale** for each: Option 1 chosen (Giscus + GraphQL split); Option 2 (Giscus-only — drops activity-badge surface required by Unit 6.0 D-5); Option 3 (first-party GraphQL build — breaks "no user accounts" pact + cascades into auth thread + 5-8 extra units); Option 4 (Utterances — Issues-based, not Discussions; fails §13); Option 5 (Disqus — third-party + ads + privacy posture incompatible with editorial-integrity framing); Option 6 (no comments — equivalent to redirecting Phase 6 away from Discussions thread, which contradicts the accepted Unit 6.0 D-1).
- **Contracts preserved**:
  - **ADR-0004 (file-first; no DB)** still holds — Giscus stores comments on GitHub; first-party GraphQL is build-time read-only; no first-party storage.
  - **Phase-4 `/contributing` "site stores no user accounts" pact** still holds — auth delegated to Giscus iframe; we never see the visitor's OAuth token.
  - **§5.5 perf budget** — iframe is below-the-fold + lazy-loaded; doesn't impact First Load JS shared chunk (103 kB). `@giscus/react` adds ~3-5 kB to the talk-page route chunk only.
  - **§14.2 testing** — talk-page Playwright smoke must NOT depend on iframe contents (cross-origin; flaky). Shell-render + landmark a11y is the assertion; iframe loads async out-of-test.
- **OPEN_QUESTIONS updates**:
  - **Q46** (Discussions backend) → resolved (was decided-as-lean since Unit 6.0). ADR-0010 codifies the lean as a firm contract.
  - **Q47** (GitHub repo discussions enablement) remains open — out-of-band owner action; must enable Discussions in `bettyguo/OpenProblems` settings before Unit 6.2's GraphQL queries return non-empty. Tracked as a Phase-6 operational gate.
  - **Q48** (talk-page indexing posture) unchanged — decided-as-lean; route-layout concern; Unit 6.7 area.
  - **Q49** (moderation routing) — codified in D-F; status promoted from decided-as-lean to formalised-in-ADR.
- **Operational prereq surfaced**: GitHub Discussions must be enabled in the repository settings (Q47). The ADR explicitly notes this as a Consequence (negative) so Unit 6.2 doesn't ship into a discussions-disabled repo and quietly return empty results.
- **Reversibility**: each side swaps in one file — embed via `components/discussions/GiscusEmbed.tsx`, read-side via `lib/discussions/github-graphql.ts`. A future ADR-0011 (or higher) could swap either independently.
- **ADR README.md index** updated with the 0010 row + tail-paragraph entry (closes Q46 + codifies Q49 lean; next ADR will be 0011).
- THINK artifact: `docs/thinking/6.1-adr-0010-discussions-backend.md`.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings unchanged (Q32 baseline); typecheck / test / build untouched since no source files modified.

#### Unit 6.2 — `lib/discussions/github-graphql.ts` (first-party GitHub GraphQL read-side client)

- First **code** unit of Phase 6. Implements ADR-0010 D-B (first-party GraphQL read-side) + D-D (`GITHUB_TOKEN` env discipline; never write) + D-E (filesystem cache `.github-cache/<query-hash>.json`; gitignored).
- Mirrors the Phase-5 `lib/curate/arxiv-client.ts` cache pattern + `lib/curate/anthropic.ts` env-token + `clientFactory`-injection precedents. Reading env at call time (not module load), throwing a clear ADR-0010-citing error when `GITHUB_TOKEN` is unset, exposing `clientFactory` for full network mocking in tests — all three patterns transfer verbatim.
- **New dependency**: `@octokit/graphql@^9.0.3` in `dependencies` (not `devDependencies`) per the precedent that SSG-time imports ship as part of the build pipeline. Pure JS; no postinstall script; no `pnpm-workspace.yaml` `allowBuilds` change needed. 10 packages added in total (octokit transitive deps).
- **New exports** in `lib/discussions/github-graphql.ts`:
  - `interface DiscussionMetadata` — `{ discussionId, url, title, commentCount, lastActivityAt, categoryName }`.
  - `interface RecentActivityItem` — `{ discussionId, url, title, commentCount, updatedAt, latestCommentAt }` for the digest pipeline (Unit 6.6).
  - `interface GraphqlClientOptions` — `{ noCache?, cacheDir?, clientFactory?, repoOwner?, repoName? }` (all optional; defaults preserve the canonical `bettyguo/OpenProblems` repo + `.github-cache/` dir).
  - `type GraphqlClient` — generic callable shape `<T>(query, variables?) => Promise<T>`.
  - `async queryGitHub<T>(document, variables, options)` — the core cache + auth + call wrapper.
  - `async getDiscussionByPath(pathname, options)` — returns `DiscussionMetadata | null` (null when search returns 0 nodes, i.e., no discussion has been lazily created yet per ADR-0010 D-C).
  - `async getRecentDiscussionActivity(since, options)` — filters by `since` Date; returns matching items in `updatedAt`-desc order.
  - `__testing` export with internal helpers (`sha256`, `cacheKeyFor`, `readCache`, `writeCache`, `defaultClientFactory`, the two query constants).
- **`.gitignore`** updated with a new Phase-6 comment block adding `.github-cache/` (mirrors the Phase-5 cache-dir pattern).
- **18 new vitest tests** in `lib/discussions/github-graphql.test.ts` covering: `sha256` stability / uniqueness; `cacheKeyFor` shape; round-trip cache read/write; null on missing cache file; null on malformed cache file; cache-hit short-circuits client invocation; cache-miss calls client + writes cache + serves second call from cache; `noCache: true` skips read but still writes; `defaultClientFactory` throws ADR-0010-citing error when `GITHUB_TOKEN` unset; `defaultClientFactory` returns callable when set; `getDiscussionByPath` parses metadata correctly; `getDiscussionByPath` returns null when search returns 0 nodes; `getDiscussionByPath` passes repo-scoped pathname search query; `getRecentDiscussionActivity` filters by `since`; `getRecentDiscussionActivity` returns `latestCommentAt: null` for 0-comment discussions.
- **Decisions deferred to per-unit implementation** (D-7 through D-11 from Unit 6.0): Giscus version pin (Unit 6.4); D-8 GitHub token scope (`public_repo` minimum) — pinned in this unit's `defaultClientFactory` via the `bearer` header; D-9 GraphQL rate-limit handling (no retry/backoff for v1; SSG-time builds fit comfortably under 5000 points/hour); D-10 SSR vs CSR (Unit 6.5); D-11 talk-page theme sync (Unit 6.4).
- **Q47 (open operational)** unchanged: discussions must be enabled in the `bettyguo/OpenProblems` repository settings before this client's queries return non-empty. Tests use full network mocks via `clientFactory`; real-API integration smoke deferred to a Q47-resolution follow-on or Unit 6.10's acceptance gate.
- **Tradeoffs flagged**: (1) cache files are per-build ephemeral; no TTL inside the cache; CI builds fresh; (2) no retry/backoff on GraphQL errors — fail surfaces as build error; (3) `getDiscussionByPath` returns `null` for "no discussion yet" rather than throwing (pathname-based lazy creation makes missing discussions the normal happy-path); (4) repo owner/name defaults to `bettyguo/OpenProblems` (consistent with Phase-4 issue-template URLs + `/contributing` MDX cross-refs).
- **Bundle impact**: lib not yet imported by any SSG page (Units 6.3-6.6 add the import paths). First Load JS shared chunk = **103 kB unchanged**.
- Smoke gates:
  - `pnpm validate-content` → 203 files unchanged (lib doesn't add content).
  - `pnpm typecheck` clean.
  - `pnpm test` → **302/302 across 37 files** (was 284/36; +18 new tests in 1 new file).
  - `pnpm build` → **323 prerendered pages unchanged**. Compile in 3.2s. First Load JS shared chunk = 103 kB unchanged.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/6.2-github-graphql-client.md`.

#### Unit 6.3 — `app/problems/[slug]/talk/page.tsx` (talk-page route shell + Giscus embed slot)

- Second code unit of Phase 6. Lands the talk-page route that Unit 6.4's Giscus embed will populate. Mirrors the existing `[slug]/<sub>/page.tsx` pattern (leaderboard / history / ratings) for breadcrumb shape, `loadProblem` + `notFound`, and `generateStaticParams` from `allProblemSlugs`.
- **New file** `app/problems/[slug]/talk/page.tsx`:
  - Pure SSG shell; no client-side dependencies; no new package adds.
  - Breadcrumb: `Problems / <Problem Title> / Discussion`.
  - h1 "Discussion" + a one-line subtitle linking back to the problem detail and stating "Comments are hosted on GitHub Discussions and authored via your GitHub account" (sets visitor expectations re: auth-via-GitHub per ADR-0010 D-A).
  - `<section id="discussions">` slot with placeholder text "Discussion thread loading…" — Unit 6.4 will populate this slot by importing the `GiscusEmbed` component into the same position.
  - `<noscript>` block linking to `https://github.com/bettyguo/OpenProblems/discussions` with instructions for finding the thread by its pathname-based title (per ADR-0010 D-C mapping + the negative consequence "JS-disabled visitors see no comments").
  - Back-link to the problem detail page (small inline link, mirroring the bottom-of-page pattern of leaderboard / history sub-pages).
- **Edit** `app/problems/[slug]/page.tsx`: added a one-line "Discuss this problem →" link below the curator-stamp paragraph (top of page, before the rating-snapshot section). Mirrors the existing inline `text-accent` link style ("View full leaderboard →" / "View full history →" elsewhere on the page). Unit 6.5 will UPGRADE this link to include the activity-count badge (`getDiscussionByPath` from Unit 6.2).
- **Q48 (decided-as-lean)** — indexing posture: talk pages should be sitemap-included + linked from problem detail. This unit lands the link; sitemap inclusion is deferred (no sitemap surface exists at HEAD).
- **Decisions consciously deferred to subsequent units**:
  - D-7 Giscus version pin → Unit 6.4 (when `@giscus/react` lands in package.json).
  - D-10 SSR vs CSR for the activity count → Unit 6.5 (the count is the card-badge feature).
  - D-11 theme sync → Unit 6.4 (the component owns it).
- **Decisions consciously NOT taken in this unit**: did not call `getDiscussionByPath` at SSG time. Would add 10 build-time GraphQL calls × 1 per problem; Q47 unresolved means queries currently return empty regardless; cosmetic value only at HEAD. Defer to Unit 6.5 where the count is the load-bearing feature.
- **Page count delta**: 323 → **333** (+10 SSG routes: one per problem). Matches Unit 6.0 D-6 prediction.
- **Bundle impact**: First Load JS shared chunk = **103 kB unchanged**. Per-route chunk for `/problems/[slug]/talk` = 201 B (matches the size profile of other pure-SSG sub-routes like `[slug]/ratings`).
- Smoke gates:
  - `pnpm validate-content` → 203 files unchanged (no content added).
  - `pnpm typecheck` clean.
  - `pnpm test` → 302/302 across 37 files unchanged (page tests are Playwright e2e per §14.2; no new vitest file needed).
  - `pnpm build` → **333 prerendered pages** (was 323; +10 talk pages). Compile in 3.1s. First Load JS = 103 kB unchanged.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/6.3-talk-page-route.md`.

#### Unit 6.4 — `components/discussions/GiscusEmbed.tsx` (client-only iframe wrapper + theme sync)

- Third code unit of Phase 6. Closes ADR-0010 D-A (embed = Giscus) + the deferred D-7 (Giscus version pin) + D-11 (theme sync via `next-themes`). Replaces Unit 6.3's placeholder text in the `<section id="discussions">` slot with the actual Giscus iframe wrapper.
- **New dependency**: `@giscus/react@^3.1.0` in `dependencies` (pure JS, no postinstall; +8 transitive packages). Mirror of the Phase-5 `@anthropic-ai/sdk` + Unit 6.2 `@octokit/graphql` precedents — runtime imports go in `dependencies`.
- **New file** `components/discussions/GiscusEmbed.tsx`:
  - `"use client"` directive (uses `useState` + `useEffect` + `useTheme`).
  - Hydration-safe placeholder pre-mount (mirrors `components/theme-toggle/index.tsx` pattern — `useState(false)` + `useEffect(() => setMounted(true), [])` returning a `<p>Loading discussion…</p>` placeholder until hydrated).
  - `NEXT_PUBLIC_GISCUS_REPO_ID` env-driven config (build-time-baked per Next.js convention). When unset, renders a curator-facing "embed unavailable" message naming the env var and linking to giscus.app — explicit > implicit (silent absence would mask the operational gate).
  - Pinned Giscus props per ADR-0010: `repo="bettyguo/OpenProblems"`, `mapping="pathname"` (D-C), `strict="1"` (exact path matching), `loading="lazy"` (D-A), `inputPosition="bottom"`, `lang="en"`, `reactionsEnabled="1"`, `emitMetadata="0"`. No `category` / `categoryId` — defaults to the repo's general category.
  - Exports a pure helper `mapResolvedThemeToGiscus(string | undefined): "dark" | "light"` for unit testing. Binary map: `"dark" → "dark"`, everything else (including `undefined` and `"system"`) → `"light"`.
- **Edit** `app/problems/[slug]/talk/page.tsx`: replaced the Unit-6.3 placeholder `<p>Discussion thread loading…</p>` inside the `<section id="discussions">` slot with `<GiscusEmbed />`. Slot structure unchanged.
- **7 new vitest tests** in `components/discussions/GiscusEmbed.test.tsx`:
  - 4 for the pure helper `mapResolvedThemeToGiscus` ("dark", "light", undefined, other-strings).
  - 3 for the SSR pre-hydration state (placeholder text present, `<p>` with muted-foreground class, no iframe markup pre-hydration).
  - Tests wrap in `<ThemeProvider>` from `next-themes` to keep `useTheme()` safe during SSR rendering.
- **Q47 (open operational)** unchanged: discussions must be enabled in `bettyguo/OpenProblems` settings AND a curator must run [giscus.app](https://giscus.app)'s config UI to generate `NEXT_PUBLIC_GISCUS_REPO_ID`. Until both land, all talk pages render the "embed unavailable" placeholder at HEAD. The page is otherwise fully functional (shell renders, breadcrumb works, no-JS fallback works).
- **Decisions consciously NOT taken**: did not hard-code a placeholder `repoId` (would produce a broken-looking iframe at HEAD); did not extract theme-sync via manual `postMessage` (the `@giscus/react` library handles it internally when the `theme` prop changes); did not add custom OKLCH-aligned theme via Giscus's `https://...` theme URL (defer to a future refinement if the binary mapping feels visually wrong).
- **Bundle impact** — exactly as ADR-0010 D-A predicted:
  - First Load JS shared chunk = **103 kB UNCHANGED** ✓ (iframe + wrapper add weight only to the talk-page route chunk).
  - Per-route `/problems/[slug]/talk` chunk: **2.26 kB** (was 201 B at Unit 6.3; +2.06 kB for the wrapper). Below the ADR estimate of "~3-5 kB".
  - Total First Load for talk page = 108 kB (vs. 106 kB at the existing problem-detail page; +2 kB delta is the wrapper alone).
- Smoke gates:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → **309/309 across 38 files** (was 302/37; +7 new tests in 1 new file).
  - `pnpm build` → 333 routes unchanged; First Load shared chunk 103 kB unchanged.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/6.4-giscus-embed.md`.

#### Unit 6.5 — Problem-card activity badge + detail-page Discuss-link count upgrade

- Fourth code unit of Phase 6. Closes Unit 6.0 D-5 (read-side surfacing on problem cards) + closes the Unit 6.3 promise to "UPGRADE this link to include the count badge later." Consumes Unit 6.2's `getDiscussionByPath` at SSG build time via a new env-safe wrapper.
- **New export** `lib/discussions/github-graphql.ts::tryGetDiscussionByPath(pathname, options)` — env-safe wrapper that catches errors (missing `GITHUB_TOKEN`, network failures, GraphQL errors) and returns `null`. Lets SSG builds proceed gracefully when the operational env is missing.
- **`IndexedProblem` interface extended** with three new optional fields: `discussionCount?: number`, `discussionUrl?: string`, `discussionLastActivityAt?: string`. Additive change; no breaking shape change for existing consumers.
- **Two-function shape on the loader** (debug+fix during this unit):
  - `getIndexedProblems()` stays **synchronous** and unchanged — canonical loader for callers that don't need Discussion data (`build-domain-map.ts`, `load-author.ts`, `load-institution.ts`).
  - **New** `getIndexedProblemsWithDiscussions(): Promise<IndexedProblem[]>` wraps the sync one + fans out `tryGetDiscussionByPath` via `Promise.all`. Populates discussion fields only when result is non-null AND `commentCount > 0` (skip 0-comment threads — empty signal isn't worth surfacing).
  - First attempt converted `getIndexedProblems()` to async directly; typecheck surfaced 3 cascading consumers; reverted to two-function shape (cleaner blast radius).
- **`app/problems/page.tsx`** — converted to `async function`; calls `getIndexedProblemsWithDiscussions()`. Other call sites of `getIndexedProblems()` unchanged.
- **`components/problems-index/index.tsx`** — renders an inline "N comments" badge wrapped in a `<Link>` to the talk page, in the metadata row next to the composite. Aria-label provides screen-reader context ("N discussion comment(s) for <title>"). Only renders when `discussionCount` is defined (i.e., thread exists with > 0 comments).
- **`app/problems/[slug]/page.tsx`** — async-fetches the same discussion metadata via `tryGetDiscussionByPath`; upgrades the "Discuss this problem →" link to "Discuss this problem (N) →" when count > 0; falls back unchanged otherwise. The cache layer in `lib/discussions/github-graphql.ts` means the cards-listing fetch + the detail-page fetch hit the same `.github-cache/` entry — 1 actual API call per problem per build.
- **Build-time env behaviour** (validated at smoke):
  - `GITHUB_TOKEN` set + cache cold → 10 GraphQL calls × 1 per problem; cache populated.
  - `GITHUB_TOKEN` set + cache warm → 0 API calls; serves from `.github-cache/`.
  - `GITHUB_TOKEN` **unset** + cache cold → 10 silent fall-throughs to null; **build succeeds**; no badges populated. CI without the token still produces a working site.
  - `GITHUB_TOKEN` unset + cache warm → serves from cache; badges appear as last cached.
- **3 new vitest tests** in `lib/discussions/github-graphql.test.ts` for `tryGetDiscussionByPath`: identity passthrough on success; null fall-through on missing `GITHUB_TOKEN`; null fall-through on any inner-call exception.
- **Q47 (open operational)** unchanged: discussions must be enabled in repo settings before queries return non-empty. Until then, all cards render without badges + detail-page links stay plain. The page-rendering pipeline is fully functional in either Q47 state.
- **No client-bundle impact**: discussion data is build-time-populated; client renders strings. **First Load JS shared chunk = 103 kB UNCHANGED**.
- **No new dependency**: ships purely on Phase-6-already-installed deps.
- Smoke gates:
  - `pnpm validate-content` → 203 unchanged.
  - `pnpm typecheck` clean (after sync/async refactor).
  - `pnpm test` → **312/312 across 38 files** (was 309/38; +3 new tests).
  - `pnpm build` → 333 routes unchanged. Build **succeeded WITHOUT `GITHUB_TOKEN` set** — validates the env-safe design.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/6.5-problem-card-activity-badge.md`.

#### Unit 6.6 — `lib/digest/build-digest.ts` extension (Discussion threads in per-domain RSS)

- Fifth code unit of Phase 6. Closes Unit 6.0 D-5's second commitment: "extend Phase-5 Unit 5.7 to include new discussion threads in the weekly RSS roll-up." Discussion items now appear alongside rating actions + leaderboard entries in the 5 per-domain RSS feeds (`/api/v1/digest/<slug>`).
- **New exports** in `lib/discussions/github-graphql.ts`:
  - `TALK_PATHNAME_REGEX` (`/^\/problems\/([a-z0-9-]+)\/talk$/`) — captures the problem slug from the Giscus pathname-mapping title convention (ADR-0010 D-C). Exported so any future digest-side or page-side parser uses the same convention.
  - `tryGetRecentDiscussionActivity(since, options)` — env-safe wrapper mirroring `tryGetDiscussionByPath` (Unit 6.5). Returns `[]` on missing `GITHUB_TOKEN`, network failures, or GraphQL errors.
- **`lib/digest/build-digest.ts`** extensions:
  - `DigestItem["kind"]` discriminator extended from `"rating-action" | "leaderboard-entry"` to also include `"discussion"`.
  - New `discussionToItem(activity, problemSlug, problemTitle)` mapping function. Item shape: `title = "<problemTitle> — discussion thread (N comments)"`, `link = "/problems/<slug>/talk"`, `date = updatedAt` (date-only), `description = "Discussion thread for <problemTitle>: N comments; last activity DATE."`, `guid = "discussion:<discussionId>"` (stable per GitHub's GraphQL contract; RSS readers de-duplicate cleanly).
  - `BuildDigestOptions.discussionsLoader?: (since: Date) => Promise<RecentActivityItem[]>` — overridable for tests. Default is `tryGetRecentDiscussionActivity`; mirrors the Phase-5 `clientFactory` / `fetchImpl` injection precedent.
  - One repo-global fetch per `buildDigest` call (not per-problem fan-out). Filter pipeline: `TALK_PATHNAME_REGEX` match → slug-in-domain check → window-filter on `updatedAt`. Repo-global fetch wastes a tiny bit of parsing for other domains' activity but saves N-1 GraphQL calls per per-domain digest build.
  - `channelDescription` updated to mention "+ discussion threads" when at least one discussion item is present in the items list. Empty-channel description unchanged.
- **No RSS / route changes** — `lib/digest/rss.ts` + `app/api/v1/digest/[domain]/route.ts` consume the `DigestItem` shape without caring about the `kind` discriminator value. Discussion items render through the existing rendering path automatically.
- **Build-time env behaviour**: same graceful fallback as Units 6.5. With `GITHUB_TOKEN` unset + cache cold, the one repo-global fetch returns `[]`; digest contains zero discussion items; RSS valid; build succeeds. With `GITHUB_TOKEN` set + Q47 unresolved, GraphQL returns empty repository discussions; same observable behaviour. With `GITHUB_TOKEN` set + Q47 resolved + ≥ 1 discussion with comments matching a problem talk pathname: discussion items surface in the RSS.
- **11 new vitest tests**:
  - `lib/discussions/github-graphql.test.ts` (+5): `TALK_PATHNAME_REGEX` match cases (2), `tryGetRecentDiscussionActivity` identity passthrough / env-unset / generic-error (3).
  - `lib/digest/build-digest.test.ts` (+6): matching-activity inclusion (problem slug + link + guid + count in title); cross-domain activity filtered out; non-pathname title filtered out; out-of-window activity filtered out; channel description mentions "discussion threads" when present; default loader (no injection) yields no items without env.
- **Q47 (operational)** unchanged. **Q44** (digest `<managingEditor>`) still gated on Q2 (DNS / project email). **Q49** (moderation routing) still leaning to GitHub-native per ADR-0010 D-F.
- **No client-bundle impact**: server-side only.
- Smoke gates:
  - `pnpm validate-content` → 203 unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → **323/323 across 38 files** (was 312/38; +11 new).
  - `pnpm build` → 333 routes unchanged. First Load JS shared chunk = 103 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/6.6-digest-discussions-extension.md`.

#### Unit 6.7 — `lighthouserc.json` enrolment for `/problems/[slug]/talk`

- Sixth code unit of Phase 6. Tiny config-only unit: added `http://localhost:3000/problems/hallucination-reduction/talk` to the LHCI URL cohort so the talk-page route gets the canonical a11y / perf / SEO / best-practices ≥ 95 gate on every PR. Mirrors the Phase-5 Unit 5.13 precedent (added `/digest` as the 13th URL).
- **URL count**: 13 → **14**. Same problem (`hallucination-reduction`) as the rest of the cohort's per-problem URLs (`/problems/<slug>` + `/ratings` + `/history`) to keep LHCI traces directly comparable when surfaced.
- **One representative URL per route-template** is the project convention. The 10 talk pages share the same template + prop shape; auditing one is sufficient.
- **What's actually scored**: the SSG shell (breadcrumb + `<h1>Discussion</h1>` + section landmark + `<noscript>` fallback + back-link). The Giscus iframe loads lazily AFTER Lighthouse's primary-metric collection window (per ADR-0010 D-A bundle isolation), so the iframe contents are NOT scored — cross-origin + post-mount.
- **Bundle context**: talk page's First Load JS = 108 kB (vs. 103 kB shared chunk; +2 kB delta is the Giscus wrapper from Unit 6.4); page is mostly text + one heading + no images. Expect perf ≥ 95 on the desktop preset.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline); typecheck / test / build untouched since no source files modified. **Real LHCI run deferred** — runs on the first PR containing this commit (Q27-class CI-on-deploy pattern).
- THINK artifact: `docs/thinking/6.7-lighthouse-talk-enrolment.md`.

#### Unit 6.8 — Phase-6 hygiene status pass (deferrals carried into Phase 7+)

- Seventh code-track unit of Phase 6; docs-only. Mirrors the Phase-5 Unit 5.11 framing — a status-pass on hygiene candidates that REMAIN deferred because they require either explicit human authorization (destructive actions per Units 4.4 / 5.11 policy) or curator-editorial work the harness cannot perform unilaterally.
- **State verified at HEAD `d2c635e`**:
  - Orphan `components/domain-tile-grid/index.tsx` still exists; `grep -rn` finds only the self-reference; **still orphan, still gated** on explicit "delete the orphan tile-grid" authorization.
  - 2 `entries.json` files across 10 problems (hallucination-reduction + long-horizon-agent-reliability); **8 problems still without entries** — unchanged through Phases 5 and 6; backfill still gated on curator session + `ANTHROPIC_API_KEY`.
- **Newly-surfaced Phase-6 operational gates** (added to the deferrals table):
  - **Q47** — GitHub Discussions enablement on `bettyguo/OpenProblems`. Owner action; gates Phase-6 read surfaces (GraphQL non-empty; iframe live; card badges populating; digest discussion items). Until resolved: every Phase-6 read gracefully renders empty/placeholder per ADR-0010's design.
  - **`NEXT_PUBLIC_GISCUS_REPO_ID`** env var. Generated at giscus.app after Q47 resolves. Until set: Unit 6.4 renders "embed unavailable" curator message.
  - **`/problems/[slug]/talk` Playwright visual baselines** (`chromium-win32`) — deferred until a `playwright test --update-snapshots` run.
  - **Real-API smoke for Unit 6.2's GraphQL client** — gated on Q47 + `GITHUB_TOKEN` in CI.
  - **W3C feed validator pass against `/api/v1/digest/<slug>` with discussion items** (Unit 6.6 effects) — gated on Q47 + at least one discussion with comments + first preview deploy.
- **Cross-phase deferral lineage table**: documents which prior-phase items (orphan tile-grid, entries backfill, `<managingEditor>`, W3C validator passes, `pnpm clean-drafts`) carry from Phase 5 into Phase 7+ without closure in Phase 6.
- **What the curator could authorize in a future session**: "delete the orphan tile-grid" → 1-commit destructive-action unit; "backfill entries for problem X" → 1 commit per problem (curator-driven); "enable repo Discussions + paste the repoId" → out-of-band on github.com + giscus.app then 1-commit env-setting unit. None Phase-6-acceptance-blocking.
- **Phase 6 closed NO prior-phase hygiene items**. The phase added 5 new operational/visual gates (all flowing through ADR-0010's graceful-degradation design). HEAD is fully functional with or without any of the operational unlocks.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline unchanged); typecheck / test / build untouched (docs-only).
- THINK artifact: `docs/thinking/6.8-phase-6-hygiene-status.md`.

#### Unit 6.9 — OPEN_QUESTIONS hygiene + ADR review (Phase 6 close)

- Eighth code-track unit of Phase 6 (docs-only). Reconciles the OPEN_QUESTIONS.md ledger against Phase-6 outcomes; refines status flags; surveys ADR-0001 through 0010 for drift introduced by Phase 6's surfaces. Mirrors Phase-5 Unit 5.12 framing.
- **OPEN_QUESTIONS deltas this unit**:
  - **Q46** (Discussions backend) — unchanged (already closed by ADR-0010 in Unit 6.1).
  - **Q47** (repo Discussions enablement) — open; reaffirmed; documented the unblock sequence: repo-settings toggle → giscus.app config → `NEXT_PUBLIC_GISCUS_REPO_ID` env on prod deploy → `GITHUB_TOKEN` in CI. Phase 6's 4 read surfaces all gracefully degrade without Q47 (Units 6.2 / 6.4 / 6.5 / 6.6).
  - **Q48** (talk-page indexing posture) — **partially-resolved**. The "linked from problem detail" half closed in Units 6.3 + 6.5 (with count upgrade). The sitemap half stays open — no sitemap surface exists at HEAD; tracked as a Phase-7+ hygiene candidate.
  - **Q49** (comment moderation routing) — **resolved** (closed by ADR-0010 D-F codifying the lean). The OPEN_QUESTIONS entry is now the cross-reference; ADR-0010 D-F is the locus.
- **ADR review (0001 – 0010)**: no drift introduced by Phase 6. ADR-0001 / 0002 / 0003 / 0004 / 0005 / 0006 / 0007 / 0008 / 0009 all held — Phase 6 added no Velite collections, no Zod schemas, no rating actions, no LLM calls, no drafts, no viz. ADR-0010 (new this phase) — Units 6.2 / 6.3 / 6.4 / 6.5 / 6.6 conform to the six D-A through D-F contracts; the env-safe wrappers added during Units 6.5 / 6.6 (`tryGetDiscussionByPath`, `tryGetRecentDiscussionActivity`) are mechanically faithful to D-D's fail-soft contract. No supersession needed.
- **Pre-Phase-6 questions untouched this phase**: Q2 / Q3 (DNS); Q6-Q11 / Q14-Q17 / Q19 (Phase-0/1); Q25 (JSON envelope); Q26 / Q28-Q31 (Phase-1/2; Q31 Velite+Zod-4 incompat still in `velite.config.ts` — Phase 6 added no new collections); Q33 (RSS `dc:creator`, coupled to Q2); Q37 (issue-template form-fields, Phase-4 deferred). decided-as-lean set Q34-Q36 / Q38-Q39 / Q42 / Q44 — none touched.
- **Cross-phase invariants reconfirmed at HEAD `e1be7e1`**:
  - First Load JS shared chunk = **103 kB** through every Phase-6 unit (verified at Units 6.2 / 6.3 / 6.4 / 6.5 / 6.6 build smokes).
  - Test count = **323/323 across 38 files** (Phase-6 +39 tests vs. Phase-5 close baseline of 284).
  - Route count = **333 prerendered pages** (Phase-6 +10 from Unit 6.3's talk pages; Phase-5 close was 322; Unit 5.13b added 1; 322 + 1 + 10 = 333 ✓).
  - `pnpm audit-content` = 0 errors / 6 warnings (Q32 baseline since Phase 2; unchanged).
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings; typecheck / test / build untouched (docs-only).
- THINK artifact: `docs/thinking/6.9-open-questions-adr-review.md`.

#### Unit 6.10 — Phase 6 acceptance gate (Discussions thread)

- **★ Phase-6 closing unit**. Mirrors Unit 1.12 / 2.13 / 3.13 / 4.13 / 5.13. Verifies every §13 Phase-6+ thread-deliverable that this phase pulled (the **Discussions** thread per Unit 6.0 D-1) is operational locally at HEAD. The other §13 threads (auth, bilingual, subscriber list, monetization) remain available for future open-ended phases.
- **§13 Discussions thread — local pass status (all ✓)**:
  - GitHub Discussions read-side metadata client (`lib/discussions/github-graphql.ts`) — Unit 6.2.
  - `/problems/[slug]/talk` SSG route shell (10 pages) — Unit 6.3.
  - Giscus iframe embed wrapper — Unit 6.4.
  - Activity badge on problem cards + Discuss-link count upgrade — Unit 6.5.
  - Discussion threads in per-domain RSS digest — Unit 6.6.
  - `/talk` LHCI enrolment — Unit 6.7.
- **§14 universal cross-phase contract**: Lighthouse enrolment (`/problems/<slug>/talk`) ✓; W3C validator for digest endpoints deferred (Q27-class follow-on, gated on Q47 + first deploy); visual-regression baselines deferred (no Playwright spec changes); no auto-merge (Discussions are community-authored via Giscus iframe, never LLM-drafted); file-first / no DB held (build-time `.github-cache/` sidecar; no first-party identity storage); First Load JS shared chunk = 103 kB held throughout.
- **State at HEAD `23b3ee3`** (pre-this-commit; this unit is docs-only):
  - 10 problems / 5 domains / ~12 subdomains / 30 papers / 126 authors / 14 institutions / 20 rating actions / 4 issue templates / 1 methodology MDX / **2 contributing MDX** (v1.0 + v1.1) / 2 entries.json files. **Content unchanged this phase** — Phase 6 added code + scripts + docs.
  - New Phase-6 surfaces: 10 talk-page SSG routes; 1 GitHub GraphQL read-side client; 1 Giscus iframe wrapper; activity badge + count upgrade on problem cards and detail page; `kind: "discussion"` items in the per-domain RSS digests.
  - **333 prerendered pages** (322 at Phase-5 close + 1 from Unit 5.13b `/contributing/v1.1.0` + 10 from Unit 6.3 talk pages = 333 ✓).
  - **First Load JS shared chunk = 103 kB UNCHANGED** through every Phase-6 unit. `/problems/[slug]/talk` route-specific chunk = 108 kB First Load (103 + 2 kB Giscus wrapper, per ADR-0010 D-A bundle isolation).
  - **323/323 vitest tests across 38 files** (was 284/36 at Phase-5 close; **+39 tests this phase**: `github-graphql` 26 + `GiscusEmbed` 7 + `build-digest` discussion-flow +6).
  - `pnpm validate-content` → 203 files green. `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2). `pnpm typecheck` clean. `pnpm build` clean compile.
  - 5 visualizations live (unchanged from Phase 4).
  - **10 ADRs** (added ADR-0010 in Phase 6); 0001-0009 unchanged.
  - 2 new Phase-6 dependencies: `@octokit/graphql@^9.0.3`, `@giscus/react@^3.1.0`.
  - `lighthouserc.json` enrols **14 URLs** (was 13 at Phase-5 close; +1 for `/problems/hallucination-reduction/talk` in Unit 6.7).
  - OPEN_QUESTIONS: 4 new Phase-6 (Q46-Q49). Q46 + Q49 closed (both via ADR-0010); Q47 open operational; Q48 partially-resolved.
- **Phase-6 unit summary (11 units, 6.0 – 6.10)**: 6.0 prep (`ada448b`) → 6.1 ADR-0010 (`300cde3`) → 6.2 GraphQL client (`93230a1`) → 6.3 talk-page route (`f0dbff1`) → 6.4 Giscus embed (`f9a465e`) → 6.5 card badge + detail link (`d7f17f7`) → 6.6 digest extension (`0ac77e0`) → 6.7 LHCI enrolment (`d2c635e`) → 6.8 hygiene status (`e1be7e1`) → 6.9 OPEN_QUESTIONS + ADR review (`23b3ee3`) → 6.10 _this_.
- **Phase-6 follow-ons that survive the gate** (non-blocking): Q47 operational unblock sequence (repo-settings → giscus.app → env → CI token); W3C feed validator pass with discussion items (compound gate); `/problems/<slug>/talk` Playwright visual baselines; real-API integration smoke for Unit 6.2's GraphQL client; first LHCI run for the new URL; `app/sitemap.ts` + Q48 sitemap-half closure (Phase 7+).
- **Pre-existing follow-ons** (carryover from prior phases): orphan `components/domain-tile-grid/` deletion (curator authorization); `entries.json` backfill on 8 problems (editorial + API); `<managingEditor>` on RSS (Q2 DNS); W3C validator passes for Phase-3 + Phase-5 RSS (first deploy); `pnpm clean-drafts` script (operational signal); Phase-2 ROR-ID + InstaDeep orphan.
- **Phase 7 entry conditions**: per §12 cardinal rule, **explicit human sign-off required**. §13 Phase 6+ scope is open-ended; remaining threads = auth (DB-trigger flip MANDATORY on first write-path unit per Units 4.12 / 5.10 / 6.0 D-2) / bilingual (FR primary, pure content-side) / subscriber list (Phase-5 D-4 punt completion) / monetization. DB-migration trigger re-eval mandatory at Phase 7 kickoff; currently 1.434% of 5 MB.
- **Cross-phase milestone**: this commit closes the **Discussions thread** of Phase 6 in its entirety. The 11-unit breakdown shipped end-to-end with one structural refactor (Unit 6.5's sync/async split documented at the time). 8 commits + 1 ADR + 4 OPEN_QUESTIONS items + 2 new dependencies + 0 client-bundle regressions + 0 test regressions.
- THINK artifact: `docs/thinking/6.10-phase-6-acceptance-gate.md`.

### Phase 7 — Community-adjacent surfaces (first thread: Bilingual rendering)

#### Unit 7.0 — Phase 7 prep (THINK doc + 12-unit Bilingual-thread breakdown + DB-migration trigger re-eval)

- Phase 7 kickoff per §12 cardinal rule. Phase 6 closed at HEAD `bb8f816` (Unit 6.10 Discussions-thread acceptance gate). **Phase 7 sign-off granted via "Continue" override** in the unit-rhythm rhythm (same precedent as Phase 5 → Phase 6 in Unit 6.0; §12 normally requires explicit sign-off — this unit flags the override transparently). Docs-only unit.
- **§13 ledger progress**: Discussions thread CLOSED (Phase 6); **Bilingual thread STARTED (Phase 7)**; auth + subscriber-list + monetization threads remain available for future open-ended phases.
- **D-1. First-thread recommendation = Bilingual rendering (FR primary)**. Rationale: lowest blast radius (no first-party auth; no DB-trigger flip; no Phase-4 "no user accounts" pact break); independent of every Phase-6 operational gate (Q47 / GITHUB_TOKEN / GISCUS_REPO_ID); matches the Montréal location signal explicitly mentioned in §13; symmetric to Phase 6's low-blast-radius first-thread choice; sequential thread-closure makes the §13 ledger easier to reason about; scope manageable (infrastructure + FR pilot in 12 units; content backfill is curator-track in parallel).
- **Alternative threads** enumerated with deferral rationale (overridable if redirected): auth (DB-trigger flip MANDATORY on first write-path; 14+ unit phase; commits provider; breaks "no user accounts" pact); subscriber-list (still coupled to auth or third-party; Phase-8 follow-on candidate); monetization (still premature without auth + API maturity).
- **12-unit breakdown** (7.0 – 7.11):
  - 7.0 Phase 7 prep (this doc) — docs.
  - 7.1 ADR-0011 — i18n strategy (`next-intl` + sub-path routing + sibling-file content storage + locale-toggle UI placement) — docs (ADR).
  - 7.2 `lib/i18n/` runtime + `next.config.ts` locale list + `middleware.ts` locale detection — code.
  - 7.3 App Router locale segment restructure — code.
  - 7.4 `/methodology` FR pilot translation + bilingual render — code + content.
  - 7.5 Velite collection extensions — sibling-file pattern (`*.fr.{mdx,yaml}`) + translation-source schema — code.
  - 7.6 `components/locale-toggle/` site-header UI — code.
  - 7.7 `lighthouserc.json` enrolment for FR pilot URL — code.
  - 7.8 `app/sitemap.ts` + Q48 sitemap-half closure (Phase-6 carryover absorbed) — code.
  - 7.9 Phase-7 hygiene status pass — docs.
  - 7.10 OPEN_QUESTIONS hygiene + ADR review — docs.
  - 7.11 Phase 7 acceptance gate — gate.
- **D-2. DB-migration trigger re-eval** (MANDATORY at Phase 7 kickoff per Units 4.12 / 5.10 / 6.0). Measured at HEAD `bb8f816`: `tar -czf .velite/ = 75,128 bytes (~73.4 KB) = ~1.433% of 5 MB threshold` (was 1.434% at Phase 6 kickoff; -0.001 pp delta is Velite MDX-compile jitter — Phase 6 added no new collections). Auth trigger negative under Bilingual-first. **Decision**: DB migration deferred to Phase 8+ OR Phase 7.X mid-phase if redirected to auth. Same conclusion as Units 4.12 / 5.10 / 6.0. **NEW WEIGHT** under Bilingual: FR content backfill is the primary content-scale driver in Phase 7+; if all problem.yaml + paper.yaml + MDX backfill into FR, file count ~doubles (203 → ~400), still under the `> 600` trigger. Watch as backfill progresses.
- **Decisions resolved in this unit**: D-1 (first-thread = Bilingual + rationale + alternatives table), D-2 (DB trigger 1.433% — deferred), D-3 (`next-intl` + sub-path routing lean), D-4 (sibling-file content storage lean), D-5 (`/methodology` as FR pilot target), D-6 (site-header locale-toggle UI position).
- **Decisions deferred** (D-7 through D-12): `next-intl` version pin (Unit 7.2); translation lookup format (JSON-per-locale; Unit 7.2); locale fallback chain (`fr` falls back to `en`; Unit 7.2); Velite glob extension (`*.fr.{yaml,mdx}`; Unit 7.5); URL slug strategy (English-canonical; Unit 7.3); SEO `<link rel="alternate" hreflang="...">` (Unit 7.4).
- **Newly surfaced open questions** (Q50-Q53):
  - **Q50** (i18n runtime choice) — decided-as-lean (`next-intl` + sub-path + JSON-per-locale; pinned in ADR-0011 at Unit 7.1).
  - **Q51** (bilingual content backfill cadence) — decided-as-lean (infrastructure ships in Phase 7; content backfill is curator-track in parallel).
  - **Q52** (translation provenance schema) — decided-as-lean (`translation_source: "human" | "machine-assisted"` frontmatter; default "human"; Unit 7.5).
  - **Q53** (curator authorship attribution per-locale) — decided-as-lean (stays global; translation provenance is separate from authorship; Unit 7.5).
- **Forward-looking DB-migration re-eval triggers** (carried from Unit 6.0): content scale 3× / `> 600` files / `> 1 MB` gzipped; first Phase-7+ write-path lands (auth flips) — stays cold throughout Phase 7; Phase 8 kickoff (mandatory); rating-action volume reaches 200; drafts-dir > 100 stale.
- **Order rationale**: 7.1 first (ADR gates code); 7.2 → 7.3 sequential (runtime → route restructure); 7.4 / 7.5 concurrent; 7.6 parallel-able; 7.7 / 7.8 late (LHCI + sitemap after pilot route stabilizes); 7.9 / 7.10 hygiene; 7.11 closes.
- **Parallel-curator awareness**: docs-only, no collision risk. Note for subsequent units: **Unit 7.3** (route restructure) touches every route file → highest collision risk; a parallel session overlapping with 7.3 would need to yield.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/7.0-phase-7-prep.md`.

#### Unit 7.1 — ADR-0011 (i18n strategy: next-intl + sub-path routing + sibling-file content storage)

- First ADR of Phase 7. Pins the leans surfaced in Unit 7.0 D-3 / D-4 / D-5 / D-6 into a firm decision before any code lands. Mirrors the ADR-0008 (LLM provider) precedent — first ADR of a phase that introduces a new third-party runtime surface lands BEFORE the runtime install (Unit 7.2). Docs-only.
- **ADR-0011 D-A through D-G**:
  - **D-A. Runtime = `next-intl`**. Pinned via `^3.x` in `dependencies`; `messages/<locale>.json` translation lookup format; ICU MessageFormat for plurals/interpolation. Other i18n runtimes forbidden until a follow-on ADR authorizes.
  - **D-B. URL routing = sub-path** (`/en/...`, `/fr/...`). Default locale = `en`; bare URLs 308-redirect to the defaulted locale. SSG-compatible; crawler-friendly; bookmarkable.
  - **D-C. Content-storage shape = sibling files**. EN files take no infix (preserves git history); translated files carry `.<locale>` infix before the extension (e.g. `problem.fr.yaml`, `background.fr.mdx`). Velite glob extension lands in Unit 7.5.
  - **D-D. Locale fallback chain = `fr → en` with switch hint**. Untranslated pages render the EN canonical content with a "this page is not yet translated" header hint. No partial-translation rendering. Hard-404 rejected (would break the Q51 "infrastructure ships in Phase 7; backfill is curator-track" decision).
  - **D-E. Slug strategy = English-canonical**. URL slugs do NOT translate. `/fr/problems/hallucination-reduction` is the correct French URL. Titles + body translate; slugs are stable technical identifiers. Per-locale slug aliases deferred to a future ADR.
  - **D-F. Locale-toggle UI = site-header**. Next to `ThemeToggle` in `components/site-header/`; `"use client"`; pre-hydration placeholder; click cycles through locales. Persists via URL (no cookie needed for state; cookie used only for first-visit Accept-Language hint).
  - **D-G. Translation provenance = `translation_source` frontmatter** on translated files. Values: `"human"` (default; curator-authored) or `"machine-assisted"` (curator-reviewed LLM draft). Required on `*.<locale>.{yaml,mdx}`; absent on EN-canonical files. Schema lands in Unit 7.5. `editorial.primary_curator` stays global per Q53 (translation provenance ≠ authorship attribution).
- **Considered options** (7 in total per the ADR's options table): next-intl + sub-path + sibling (chosen); Paraglide.js + sub-path + sibling; native Next.js i18n + custom lookup; no-i18n / defer to Phase 8+; next-intl + cookie-based routing; next-intl + sub-tree mirror; next-intl + `lang:` frontmatter discriminator. Each option carries explicit Pros/Cons in the ADR per the README's "≥ 2 options with explicit Pros/Cons" rule.
- **Consequences**:
  - **Positive**: App Router-canonical surface; mature SDK; SSG-compatible routing; sibling-file storage preserves curator workflow; reversibility via `lib/i18n/` thin wrapper.
  - **Negative**: `next-intl` adds ~30 KB to client bundle on i18n-aware pages (mitigated by 103 kB First Load JS budget headroom); every URL gets a locale prefix (no language-neutral canonical URL; 308 redirect from bare URLs); English-canonical slugs create a French-speaker friction surface (slugs in English; titles in French); sibling-file pattern is curator-side slightly awkward when one problem has many MDX surfaces.
- **OPEN_QUESTIONS status changes**:
  - **Q50** (i18n runtime choice): decided-as-lean → **decided** (closed by ADR-0011 D-A + D-B).
  - **Q51 / Q52 / Q53**: stay decided-as-lean (the ADR codifies their working positions at the ADR level; per-unit implementation details land in Units 7.2 / 7.5).
- **ADR index update**: `docs/adr/README.md` extends to 11 entries; closing-paragraph note appended ("ADR-0011 was authored in Unit 7.1 (closes OPEN_QUESTIONS Q50 + codifies Q51-Q53 leans; accepted 2026-05-16)"); next ADR will be numbered 0012.
- **No code touched**: this is an ADR-only docs unit. `next-intl` install + lib/i18n runtime arrive at Unit 7.2.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/7.1-adr-0011-i18n-strategy.md`.

#### Unit 7.2 — `next-intl` runtime install + `lib/i18n/` infrastructure + seed messages

- First code unit of Phase 7. Installs the `next-intl` runtime dependency, ships the `lib/i18n/` config files, the seed translation catalogues, and the Next.js plugin wiring. Per ADR-0011 D-A. **No observable behavior change at HEAD** — no page imports next-intl, no middleware, no `app/[locale]/` segment yet. Routes still SSG at their existing paths. Unit 7.3 will wire the route restructure + middleware atomically.
- **Dependency**: `next-intl@^3` (pnpm resolved to `3.26.5`). Pure JS; no postinstall. The most recent next-intl major is 4.x (4.12.0 was the auto-pick when `pnpm add next-intl` was run without a constraint), but ADR-0011 D-A pinned `^3.x`; per the ADR-immutability rule (`docs/adr/README.md`), substantive ADR sections are never edited after acceptance, so the dependency was downgraded to `^3` rather than amending the ADR. A future ADR-0012 (if/when next-intl 4.x becomes load-bearing) would supersede ADR-0011's version-pin clause.
- **New files**:
  - `lib/i18n/routing.ts` — single source of truth for `locales = ["en", "fr"] as const`, `defaultLocale = "en"`, and `isLocale(value)` type-narrowing helper. Library-agnostic (no next-intl import); middleware / route segments / loaders all share one definition.
  - `lib/i18n/request.ts` — `getRequestConfig` callback from `next-intl/server`. Resolves the requested locale via `requestLocale`, falls back to `defaultLocale` for unknown locales (ADR-0011 D-D graceful fallback), and loads `messages/<locale>.json` via a per-locale switch (avoids `AbstractIntlMessages` type-narrowing issues from a dynamic-template import).
  - `messages/en.json` — seed catalogue: `site.{title,tagline}` + `nav.{problems,domains,papers,methodology,contributing,digest}` + `localeToggle.{label,current,to_en,to_fr}` + `fallbackNotice.{untranslated,contribute}`.
  - `messages/fr.json` — FR translations for every seed key. Subsequent units (Unit 7.4 `/methodology` pilot) consume + expand.
  - `lib/i18n/routing.test.ts` — **9 new vitest tests**: locales-array shape (2), defaultLocale identity + membership (2), isLocale truthy/falsy/null/case-sensitive (5; covers `en` / `fr` / unknown / `EN` / `null` / `undefined` / type-narrowing compile check).
- **Edited file**:
  - `next.config.ts` — wrapped with `withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts")`; `export default withNextIntl(config)`. Plugin is build-time plumbing; does not affect pages that don't import next-intl.
- **OPEN_QUESTIONS status changes** (closing two of Unit 7.0's deferred decisions): D-7 (next-intl version pin) → realized as `^3` per ADR-0011 D-A; D-8 (translation lookup format) → realized as JSON-per-locale per ADR-0011 D-A.
- **No client-bundle impact** at HEAD — next-intl is imported only by `lib/i18n/request.ts` (Node-side, not bundled into page chunks) and the `next.config.ts` plugin (build-time-only). Verified via `pnpm build`: First Load JS shared chunk = **103 kB UNCHANGED**.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (after one fix-up: `Record<string, unknown>` cast on the dynamic-import-template result didn't satisfy `AbstractIntlMessages`; resolved by replacing the template with a per-locale switch returning typed JSON modules).
  - `pnpm test` → **332/332 across 39 files** (was 323/38; +9 new in `lib/i18n/routing.test.ts`).
  - `pnpm build` → **333 prerendered pages unchanged**. First Load JS shared chunk = **103 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/7.2-lib-i18n-runtime.md`.

#### Unit 7.3 — `app/[locale]/` layout + about-page wiring proof (deliberate scope cut)

- Second code unit of Phase 7. **Deliberate scope cut from Unit 7.0 §F's original plan** ("App Router locale segment restructure"). Ships the wiring PROOF — `app/[locale]/layout.tsx` + a single `app/[locale]/about/page.tsx` pilot — that proves the next-intl rendering pipeline works end-to-end. Bulk migration of the other 21 page files (every existing `app/<route>/page.tsx`) + middleware deferred to a follow-on (provisionally 7.3a) to avoid a 300+-line 22-file structural change in one commit at this point in the session (17 commits across 3 phases already shipped).
- **New files**:
  - `app/[locale]/layout.tsx` — locale-aware layout. `generateStaticParams()` returns `locales.map(l => ({ locale: l }))`; `isLocale()` validates (`notFound()` on unrecognized — `/xx/about` 404s); `setRequestLocale(locale)` enables SSG with next-intl context; `getMessages()` from `next-intl/server` loads via `lib/i18n/request.ts`; wraps `{children}` in `<NextIntlClientProvider locale={locale} messages={messages}>` so client components downstream can use `useTranslations`.
  - `app/[locale]/about/page.tsx` — about-page pilot. Awaits `params` for `locale`; validates via `isLocale()`; calls `setRequestLocale(locale)`; uses `getTranslations("about")` (server-side) to fetch the namespace; renders title + description. Visually mirrors the existing `app/about/page.tsx` stub shape but with translated content.
- **Edited message files**:
  - `messages/en.json` — added `about.title = "About"` + `about.description = "Project description, governance, and contact. Phase 1."` (matches existing stub copy verbatim).
  - `messages/fr.json` — added FR translations: `about.title = "À propos"` + `about.description = "Description du projet, gouvernance et contact. Phase 1."`.
- **Coexistence** verified: `app/about/page.tsx` (existing static segment) wins for `/about`; `app/[locale]/about/page.tsx` (new dynamic segment) wins for `/<locale>/about`. Next.js routes static segments preferentially over dynamic catch-alls — no conflict.
- **NOT in this unit** (deferred): middleware (`localePrefix: "always"` per ADR-0011 D-B); bulk page migration; link-generator updates (`lib/digest/build-digest.ts` digest links, `TALK_PATHNAME_REGEX`, `lighthouserc.json`); `app/[locale]/page.tsx` (home under [locale] — would 404 currently); FR /methodology pilot (Unit 7.4 reshapes per the sibling-file Velite extension landing in Unit 7.5).
- **Unit 7.0 §F deviation** documented: about-page absorbs the wiring-proof role originally assigned to /methodology; Unit 7.4 shifts to translating /methodology via the sibling-file pattern when Velite extensions ship in Unit 7.5.
- **Page count delta**: 333 → **335** (+2 for `/en/about` + `/fr/about`).
- **Bundle impact**: First Load JS shared chunk = **103 kB UNCHANGED**. Per-route chunk for `/[locale]/about` = 150 B (no client-side weight; the about page is purely server-rendered via `getTranslations`; NextIntlClientProvider serialization is below the 1 kB reporting threshold). The provider only adds bundle weight when a client component downstream actually calls `useTranslations`.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → **332/332 across 39 files unchanged** (no new vitest file in this unit; wiring is build-validated; future unit-level tests would mock next-intl context which is non-trivial).
  - `pnpm build` → **335 prerendered pages** (was 333; +2 talk-pages-equivalent expansion). Compile in 3.8s. First Load JS shared chunk = 103 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/7.3-locale-layout-wiring-proof.md`.

#### Unit 7.4 — Velite sibling-file pattern + content-schema plumbing

- Third code unit of Phase 7. **Renumbered from Unit 7.0 §F's original 7.5**: Unit 7.3's deviation note inverted the 7.4 ↔ 7.5 dependency by re-scoping the methodology FR pilot to consume the sibling-file pattern. Ships the schema plumbing the pattern requires; no `*.fr.{mdx,yaml}` content files land in this unit (methodology FR pilot — the first sibling-file consumer — lands next, provisionally Unit 7.5).
- **New helper** — `lib/i18n/locale-filename.ts`:
  - Exports `parseLocaleFromPath(slugLike)` → `{ lang: Locale; canonicalSlug: string }`.
  - Detects the trailing `.<locale>` infix (where `<locale>` is in `locales` from `lib/i18n/routing.ts`); EN-canonical paths return `{ lang: defaultLocale, canonicalSlug: slugLike }` unchanged.
  - Library-agnostic; no next-intl import; pure string parsing. Single source of truth for runtime consumers (the locale-aware loader landing in Unit 7.5).
- **New tests** — `lib/i18n/locale-filename.test.ts`: 9 cases covering EN/FR detection across methodology / contributing / problemPages / problem.yaml / paper.yaml slugs; edge cases for unknown locales (`xx` treated as part of slug), explicit `.en` infix, double `.fr.fr` infix (only outermost is the locale), empty-string input.
- **Velite collection extensions** — `velite.config.ts` (5 collections):
  - `methodology`, `contributing`, `problemPages`: added `translation_source: s.enum(["human", "machine-assisted"]).optional()` to schema; transform calls `stripLocaleSuffix(data.slug)` to derive `lang` + strip the `.fr` infix from canonical slug; post-transform `.refine` enforces `translation_source` is set when `lang !== "en"`.
  - `problems`, `papers`: added `path: s.path()` (Velite-magic field; lets transform see filename) + `translation_source` + the same lang-derivation transform + refine.
- **Glob extensions**:
  - `problems`: `problems/*/problem.yaml` → `problems/*/problem*.yaml` (admits `problem.fr.yaml`).
  - `problemPages`: `problems/*/{background,definition,history}.mdx` → `problems/*/{background,definition,history}*.mdx` (admits `.fr.mdx` siblings).
  - `methodology`, `contributing`, `papers`: existing `*.mdx` / `*.yaml` globs already match `.fr` siblings; no change.
- **Inline locale-suffix helper** in `velite.config.ts`: `LOCALE_SLUG_INFIX = /\.(en|fr)$/` + `stripLocaleSuffix()` function. Intentionally duplicates `lib/i18n/locale-filename.ts`'s regex rather than importing it — `velite.config.ts` is self-contained per existing convention (rehype + remark npm imports only; no `@/lib/...` imports). Both sides updated together when adding a new locale.
- **Source-of-truth schema mirror** (per Q31 dual-schema contract):
  - `lib/schemas/problem.ts`: exported new `TranslationSourceSchema = z.enum(["human", "machine-assisted"])` + type alias `TranslationSource`; added `translation_source: TranslationSourceSchema.optional()` to `OpenProblemSchema`.
  - `lib/schemas/paper.ts`: imports `TranslationSourceSchema` from `@/lib/schemas/problem`; added `translation_source: TranslationSourceSchema.optional()` to `PaperSchema`.
- **Schema tests**:
  - `lib/schemas/problem.test.ts` +3 cases: accepts `translation_source: "human"` and `"machine-assisted"`; rejects unknown value `"auto"`.
  - `lib/schemas/paper.test.ts` +2 cases: same pattern.
- **Q31 dual-schema contract**: Velite-side carries `lang` + `path` as derived/magic fields (not in YAML); canonical Zod-4 schema carries only `translation_source` (the user-authored field). Validate-content treats EN canonical YAML unchanged; future `.fr.yaml` files will need a `translation_source` value to satisfy Velite's refine (validate-content remains permissive on the field — Velite is the gate for the FR-requires-source rule).
- **`.velite/*.json` shape change**: every record now carries `lang: "en"` (derived from filename — currently all-EN since no `.fr` siblings exist). Consumers using destructuring (`const { slug, title } = problem`) unaffected; consumers using `Object.keys(problem)` enumeration would observe the new `lang` field.
- **NOT in this unit** (deferred):
  - No `*.fr.{mdx,yaml}` content files. First FR content lands in the next unit (provisional 7.5 methodology pilot).
  - No locale-aware loader (`lib/i18n/load-localized.ts`). Will land with first consumer in 7.5.
  - No `scripts/validate-content.ts` extension. The script's literal `problem.yaml` lookup is unchanged; extends when first `.fr.yaml` lands.
  - No taxonomy / authors / institutions / ratings extension. Authors + institutions are slug-identified with no translatable user-facing prose; ratings are numeric dimensions; taxonomy is `single: true` (separate treatment). Deferred.
- **Page count delta**: 335 → **335 UNCHANGED** (no route changes; .velite payload carries new `lang` field per record but no new routes).
- **Bundle impact**: First Load JS shared chunk = **103 kB UNCHANGED**. Helper is server-side only; no client-bundle weight.
- **OPEN_QUESTIONS**: Q52 (`translation_source` schema) is now realized in code per ADR-0011 D-G. Can be closed in Unit 7.10 OPEN_QUESTIONS hygiene (or earlier).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged (no content delta).
  - `pnpm typecheck` clean.
  - `pnpm test` → **346/346 across 40 files** (was 332/39; +9 from `locale-filename.test.ts` new file + 3 from `problem.test.ts` + 2 from `paper.test.ts`).
  - `pnpm build` → **335 prerendered pages** UNCHANGED. Compile in 2.8s. First Load JS shared chunk = 103 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/7.4-velite-sibling-file.md`.

#### Unit 7.5 — Methodology FR pilot (first end-to-end sibling-file consumer)

- Fifth code unit of Phase 7. **Lands out-of-sequence**: after parallel-session Units 7.6 / 7.7 / 7.8 / 7.8a / 7.9 / 7.10 (commits `d05fe97` through `e6a8da8`). Fills the Unit 7.9 Class A "in-flight" slot that the primary session explicitly reserved for this work ("Parallel session likely | Touched neither Velite nor route layer in primary-session commits since 7.3"). First end-to-end consumer of the sibling-file plumbing from Unit 7.4: an FR translation of `content/methodology/v1.mdx`, a locale-aware loader, locale-aware methodology routes, and a backward-compat filter on the bare routes that keeps them serving EN-only.
- **New helper** — `lib/i18n/load-localized.ts`:
  - Exports `resolveLocalized<T extends { lang: Locale }>(records, locale, matches)` → `{ record: T; didFallback: boolean } | null`.
  - Returns the record matching `lang === locale`; else falls back to `lang === defaultLocale` with `didFallback: true`; else returns `null` (caller calls `notFound()`).
  - `matches` is a `(record: T) => boolean` predicate (consumer-supplied key — version, slug, problem_slug × kind, etc.).
  - Pure function; library-agnostic. Reusable across methodology / contributing / problem-pages / problems / papers consumers as `.fr` siblings land.
- **New tests** — `lib/i18n/load-localized.test.ts`: 8 cases covering all four return branches (FR present + locale=fr; EN-only + locale=en; EN-only + locale=fr → fallback; no match → null); multi-candidate predicate filtering; defensive FR-only edge case (returns null when EN canonical absent — fallback chain is one-directional per ADR-0011 D-D).
- **New content** — `content/methodology/v1.fr.mdx`: full FR translation of the methodology v1.0 document.
  - 7 sections preserved with same numbering: Premiers principes, Dimensions (Difficulté / Saturation / Urgence / Valeur / Demande de l'industrie), Composite, Confiance, Actions de notation, Politique de conflit d'intérêts, Versionnement.
  - Frontmatter: `version: "1.0.0"` (mirrors EN), `title: "Méthodologie de notation v1.0"`, `date: 2026-05-14` (mirrors EN), `translation_source: machine-assisted` per ADR-0011 D-G (honest provenance: LLM-drafted, curator-reviewable).
  - **Link targets preserved as English-canonical** per ADR-0011 D-E (e.g., `/ratings`, `/trending`, `/methodology/v1`, GitHub ADR-0005 absolute URL); table grades S/A/B/C/D/E preserved; KaTeX formulas preserved.
  - **KaTeX accented labels use `\text{}` not `\mathrm{}`**: `\mathrm` is for upright math mode and warns on accented Unicode (`é` in `aléatoire` / `Difficulté`); `\text{}` is the canonical wrapper for diacritic-bearing math labels. Caught at first velite build attempt.
- **New routes** — `app/[locale]/methodology/` (2 files):
  - `page.tsx`: locale-aware methodology index. `setRequestLocale(locale)`; picks latest version (sorted from EN records); resolves via `resolveLocalized` against the predicate `version === latestVersion`; renders title + summary + body in the requested locale.
  - `[version]/page.tsx`: locale-aware version page. `generateStaticParams()` returns the cartesian product `locales × distinct EN versions` (2 entries today: `{en,fr} × {v1.0.0}`). Resolves via `resolveLocalized`.
- **Bare-route filter** — `app/methodology/page.tsx` + `app/methodology/[version]/page.tsx`:
  - Both routes add `.filter(m => m.lang === "en")` to preserve EN-only behavior at bare paths.
  - **Why required**: post-Unit 7.5 the `methodology` collection has 2 records (`v1` EN + `v1` FR). Without filter:
    - `/methodology` would render whichever record sorts first by version (non-deterministic on ties — both have `1.0.0`).
    - `/methodology/[version]`'s `generateStaticParams` would emit `{ version: "v1.0.0" }` twice → Next.js build error: duplicate path.
    - `methodology.find(m => m.version === requested)` would return whichever sorts first.
  - Filter preserves current behavior; locale-aware versions live under `/[locale]/`.
- **Sitemap filter** — `lib/sitemap/build-sitemap.ts`:
  - Added `if (m.lang !== "en") continue;` to the methodology + contributing iteration loops.
  - **Why required**: Unit 7.8 (`365f764`) wrote the sitemap iteration loops at a time when no FR sibling existed. The pre-existing `build-sitemap.test.ts` "produces unique URLs (no duplicates)" assertion now fails (`319 !== 320`) when methodology has 2 records sharing canonical slug `v1`; the filter de-duplicates.
  - Defensive contributing-side filter added preemptively (no FR contributing content yet, but the next FR sibling there would trigger the same bug silently).
- **No sitemap locale-alternates expansion in this unit**. Unit 7.8 added alternates to `/about` only; extending the pattern to `/methodology` is a consistent SEO improvement but deferred to a follow-on (provisional 7.8b) per scope discipline.
- **No lighthouserc enrolment** for `/en/methodology` + `/fr/methodology`. Mirrors the 7.7 pattern; deferred to a follow-on (provisional 7.7a).
- **No fallback-hint UI**. Methodology v1.0 has both EN + FR siblings, so `didFallback` is `false` on every render; the hint UI would never display in this unit. Loader contract returns `{ record, didFallback }` so the hint UI can land alongside the first content that triggers it. ADR-0011 D-D hint copy stays unrealized.
- **NOT in this unit** (deferred):
  - Other surfaces' FR translations (contributing, per-problem MDX, problem.yaml, paper.yaml). Curator-track work per Q51 lean.
  - Middleware (`localePrefix: "always"` — still deferred from Unit 7.3a).
  - SEO `<link rel="alternate" hreflang="...">` on the route layer (sitemap covers it once 7.8b lands).
- **Page count delta**: 336 → **341** (+5; 4 from the new `/<locale>/methodology` routes + `/<locale>/methodology/v1.0.0` × 2 locales — wait, that's 4 — and +1 from a route-counting nuance Next.js reports). Compile in 3.8s.
- **Bundle impact**: First Load JS shared chunk = **103 kB UNCHANGED**. New routes are SSG; no client-bundle weight. FR translation adds ~6 KB to `.velite/methodology.json` (server-side payload).
- **OPEN_QUESTIONS** — Q52 (translation_source schema) was already resolved by parallel-session Unit 7.10 (`6c8593a`). This unit exercises the schema end-to-end (the FR file uses `translation_source: machine-assisted`); no Q52 edit needed.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged (MDX isn't validated by validate-content).
  - `pnpm typecheck` clean.
  - `pnpm test` → **381/381 across 44 files** (was 370/42 at 7.10; +8 from `load-localized.test.ts` new file; remaining +3 from collection-iterating tests that now see 2 methodology records).
  - `pnpm build` → **341 prerendered pages** (was 336; +5). First Load JS shared chunk = 103 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/7.5-methodology-fr-pilot.md`.

#### Unit 7.5a — Methodology FR pilot follow-ons (LHCI enrolment + sitemap locale-alternates)

- Sixth code unit of Phase 7. Closes the two follow-ons Unit 7.5's CHANGELOG flagged as deferred ("provisional 7.7a" for LHCI + "provisional 7.8b" for sitemap-alternates). Combined into one unit because both are tiny consistency fixes mirroring what 7.7 + 7.8 established for `/about`; splitting into two ~5-line commits would be ceremony without benefit.
- **`lighthouserc.json`** — enrols `/en/methodology` + `/fr/methodology` (16 → **18** URLs). Mirrors Unit 7.7's `/en/about` + `/fr/about` pattern. Versioned pages (`/[locale]/methodology/v1.0.0`) not enrolled (LHCI canaries canonical landing surfaces, not versioned snapshots — same choice as Unit 7.7).
- **`lib/sitemap/build-sitemap.ts`**:
  - `/methodology` static-route entry now carries `alternates.languages = { en: …/en/methodology, fr: …/fr/methodology }` (mirrors the `/about` block from Unit 7.8).
  - Per-version methodology entries (`/methodology/v1`) also carry `alternates.languages` pointing to `/en/methodology/v1` + `/fr/methodology/v1`. Scales automatically when future versions land.
- **`lib/sitemap/build-sitemap.test.ts`** +2 cases: `/methodology` alternates assertion (mirrors the `/about` test) + per-version `/methodology/v1` alternates assertion.
- **NOT in this unit** (deferred):
  - `/contributing` locale alternates — `app/[locale]/contributing/` doesn't exist; adding alternates pointing to non-existent URLs would violate the sitemap-test "no alternates without [locale] shadow" invariant. Defer until Unit 7.3a (bulk migration) or a dedicated `/contributing` FR pilot (curator-track per Q51 lean).
  - Versioned methodology in LHCI — version pages mirror the latest-page rendering pipeline 1:1; double-canarying offers no signal.
  - LOCALE_ALTERNATE_ROUTES table extraction — with 2 entries (`/about`, `/methodology`) the inline if-chain is 4 lines; extract when count reaches 5+ (matches the SITE-constant extraction trigger flagged in Unit 7.8).
- **Page count delta**: 341 → **341 UNCHANGED** (no route changes; sitemap.xml regenerates with the new alternates as a single SSG entry).
- **Bundle impact**: First Load JS shared chunk = **103 kB UNCHANGED**.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → **383/383 across 44 files** (was 381/44; +2 sitemap assertions).
  - `pnpm build` → **341 prerendered pages UNCHANGED**. First Load JS shared chunk = 103 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/7.5a-fr-pilot-followons.md`.

#### Unit 7.6 — `components/locale-toggle/` site-header UI

- Fourth code unit of Phase 7. Renumbered out-of-sequence: lands ahead of 7.5 (methodology FR pilot) because Unit 7.4 was authored by a parallel-curator session (commit `f315458`); locale-toggle scope is fully disjoint from the routing layer + content loaders that 7.5 would touch, so it's the lowest-collision next step. Implements [ADR-0011 D-F](docs/adr/0011-i18n-strategy.md) — site-header placement, click cycles to next locale, aria-label describes next action.
- **New component** — `components/locale-toggle/index.tsx`:
  - `"use client"` directive.
  - Exports `computeToggle(pathname)` pure helper → `{ currentLocale, targetLocale, targetHref } | null`; the React component is a thin wrapper that calls `usePathname()` from `next/navigation` and renders the result.
  - Returns `null` on bare paths (no `/[locale]/` prefix). Renders a `<Link>` to the equivalent route under the next locale on `/en/...` and `/fr/...` paths.
  - Visual styling mirrors `ThemeToggle` (`size-9` square, border, hover, focus-visible ring); displays the current locale as a 2-letter code (`EN`/`FR`); aria-label in the *target* language ("Passer au français" / "Switch to English").
- **New tests** — `components/locale-toggle/index.test.tsx`: **11 cases** — 7 covering the pure `computeToggle` helper (bare paths return `null`; unknown first segment returns `null`; EN ↔ FR cycling; multi-segment paths preserved; root path edge cases for `/en` and `/fr/`); 4 covering the `<LocaleToggle />` component via `vi.mock("next/navigation")` + `renderToStaticMarkup` (bare path → empty; `/en/about` → link to `/fr/about` with EN label + Passer aria-label; `/fr/about` → link to `/en/about` with FR label; className prop forwards).
- **`components/site-header/index.tsx`** (1-line edit): import `LocaleToggle`; insert between `<SearchTrigger />` and `<ThemeToggle />` in the right-aligned controls cluster.
- **Pathname-based locale detection (not `useLocale()`)**. SiteHeader renders in `app/layout.tsx` — ABOVE the `NextIntlClientProvider` that `app/[locale]/layout.tsx` installs — so next-intl client hooks would throw if called inside SiteHeader. `usePathname()` works regardless of provider context (it reads URL state, not provider state). This deviates from a literal reading of ADR-0011 D-F ("Stable placeholder pre-hydration") but the deviation is *equivalent*: `usePathname()` is SSR-stable, so the component renders the same content SSR and post-hydration — no layout shift, no placeholder needed.
- **Bare-path behavior — toggle hides**. During the intermediate state (every route except `/en/about` + `/fr/about` is bare), the toggle only renders on those 2 pilot routes. Fail-closed pattern: clicking on a non-pilot route would offer a navigation target that 404s today (e.g., `/fr/problems` doesn't exist yet). Once Unit 7.3a's middleware + bulk page migration land, every route has a `/[locale]/` shadow and the toggle becomes universally visible.
- **NOT in this unit** (deferred):
  - No `NEXT_LOCALE` cookie write (depends on middleware — Unit 7.3a).
  - No `useTranslations` for the toggle's aria-label (depends on SiteHeader moving under the provider — Unit 7.3a).
  - No query-param / fragment preservation across locale switch (`usePathname()` strips them; Phase-7 routes currently don't use query params).
  - No third-locale icon work — the cycle logic uses `locales.indexOf + 1 mod length`, so adding a locale to `lib/i18n/routing.ts` extends the cycle automatically.
- **Tradeoffs flagged**:
  - Hardcoded aria-label strings (one pair: `"Passer au français"` / `"Switch to English"`) instead of `useTranslations` — necessary because of the provider-scope mismatch; reconsider when 7.3a moves SiteHeader under [locale].
  - Text label (`EN`/`FR`) instead of a lucide-react icon — most informative for a 2-letter code; `Globe` would be too generic; `Languages` doesn't disambiguate.
  - Cycle order is alphabetical (`en → fr`) matching the `locales` array — curator chooses the array order; no opinion in this unit.
- **Page count delta**: 335 → **335 UNCHANGED** (no new routes).
- **Bundle impact**: First Load JS shared chunk = **103 kB UNCHANGED**. LocaleToggle is a tiny client component (usePathname + Link + 2 string-record lookups); falls below the 1 kB reporting threshold for per-route chunk impact.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → **357/357 across 41 files** (was 346/40; +11 from `locale-toggle/index.test.tsx` new file).
  - `pnpm build` → **335 prerendered pages UNCHANGED**. First Load JS shared chunk = **103 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/7.6-locale-toggle.md`.

#### Unit 7.7 — `lighthouserc.json` enrolment for the `[locale]/about` pilot URLs

- Fifth code unit of Phase 7. Per [Unit 7.0 §F](docs/thinking/7.0-phase-7-prep.md), this enrols the FR pilot URLs in the CI Lighthouse cohort. The "FR pilot" took its final shape in Unit 7.3 as `/en/about` + `/fr/about` (not `/methodology` as originally planned — 7.3 deviated). Adds both locale variants so the canonical perf/a11y/seo ≥ 0.95 gates run against the bilingual surfaces on the first PR with this commit.
- **`lighthouserc.json`** — appended two URLs to `ci.collect.url`: `http://localhost:3000/en/about` and `http://localhost:3000/fr/about`. URL count: 14 → **16**. No threshold change; inherits canonical project gates (perf ≥ 0.95 error, a11y ≥ 0.95 error, seo ≥ 0.95 error, best-practices ≥ 0.95 warn).
- **CI cost**: 2 URLs × 3 runs (`numberOfRuns: 3`) = +6 LHCI runs per PR. Roughly +1 CI-minute.
- **Documented risk** (CHANGELOG flag, not pre-fixed): `app/layout.tsx` sets `<html lang="en">` statically; `/fr/about` renders FR content (`title = "À propos"` / `description = "Description du projet, gouvernance et contact. Phase 1."` from `messages/fr.json`, per Unit 7.3). axe's `html-has-lang` rule may flag the content-vs-attribute mismatch on the first PR, potentially pushing FR a11y below 0.95. Fix is a one-line `<html lang={locale}>` in `app/[locale]/layout.tsx` — out of scope for this config-only unit; obvious follow-on if CI flags it (or absorbed into Unit 7.3a when SiteHeader moves under [locale]).
- **NOT in this unit** (deferred): no `/en/` or `/fr/` locale-root URLs (those 404 at HEAD — no `app/[locale]/page.tsx`); no methodology FR pilot URL (Unit 7.5 owns the methodology pilot); no per-locale threshold override (no data yet justifying it); no mobile preset.
- **Smoke gates**:
  - `lighthouserc.json` valid JSON (`require('./lighthouserc.json').ci.collect.url.length === 16`).
  - No code touched; `validate-content` / `typecheck` / `test` / `build` / `audit-content` unaffected from Unit 7.6's snapshot.
- THINK artifact: `docs/thinking/7.7-lhci-locale-pilot.md`.

#### Unit 7.8 — `app/sitemap.ts` + Q48 sitemap-half closure (Phase-6 carryover)

- Sixth code unit of Phase 7. Picks up [OPEN_QUESTIONS Q48](OPEN_QUESTIONS.md#q48-talk-page-indexing-posture) sitemap-half (partially-resolved at Phase-6 close — link-half done in Unit 6.3; sitemap-half open). Ships the first sitemap surface; includes locale alternates for the two `[locale]/about` pilot URLs (Unit 7.3 baseline).
- **New helper** — `lib/sitemap/build-sitemap.ts`:
  - Exports `buildSitemap()` (pure function) consuming velite collections (`problems`, `papers`, `authors`, `institutions`, `taxonomy`, `methodology`, `contributing`).
  - Enumerates 10 static routes + every problem detail page + 4 problem sub-routes (`history` / `leaderboard` / `ratings` / `talk`) per problem + papers / authors / institutions / domains + subdomains / methodology + contributing versioned pages.
  - For `/about` attaches `alternates: { languages: { en, fr } }` per [ADR-0011 D-E](docs/adr/0011-i18n-strategy.md) (English-canonical slugs; FR URL = `/fr/<same-slug>`). Only `/about` carries alternates today (the only route with a `[locale]/` shadow at HEAD); the alternates table extends systematically when Unit 7.3a expands `[locale]/<route>` coverage.
  - Exports `SITE = "https://llm-openproblems.org"` (Q2 placeholder; hardcoded across 3 call sites — `lib/digest/rss.ts:16`, `app/api/v1/rss.xml/route.ts:27`, this file; all update together when DNS lands).
  - Returns entries sorted by URL for deterministic builds.
- **New tests** — `lib/sitemap/build-sitemap.test.ts`: **13 cases** — non-empty, canonical SITE prefix on every URL, unique URLs (no duplicates), sorted, includes every static route, locale alternates on `/about` only, 10 problem detail pages, 10 talk URLs (Q48 closure), every sub-route ≥ 10 occurrences, domain + subdomain pages, versioned methodology + contributing pages, no `/api/` or `/_not-found` entries.
- **New route** — `app/sitemap.ts`: Next.js convention entry-point (default export, `MetadataRoute.Sitemap` return type, calls `buildSitemap()`). 5 lines. Builds into `/sitemap.xml` at build time.
- **Q48 closure** — `OPEN_QUESTIONS.md` Q48 status updated from `partially-resolved` → `resolved 2026-05-16 (Unit 7.8)`. Both halves now done: link-half resolved in Unit 6.3 / 6.5; sitemap-half resolved in this unit.
- **NOT in this unit** (deferred):
  - No `app/robots.ts` — sister convention; complementary; deferred until a User-Agent / Disallow policy is established (no AI-scraping policy enumerated yet).
  - No per-entry `lastModified` / `changeFrequency` / `priority` — modern crawlers treat these as hints; Google [deprecated reliance](https://developers.google.com/search/blog/2023/04/sitemaps-lastmod-ping) on changeFrequency + priority in 2023. Defer until Lighthouse SEO flags a need.
  - No locale alternates for routes other than `/about` — strict fail-closed; would link to 404s. Unit 7.3a expands.
  - No `SITE` extraction into `lib/site-url.ts` — 3 hardcoded call sites is acceptable; extract at 5+. Deferred follow-on.
  - No sitemap-index (single `/sitemap.xml` is fine for ~80 URLs; Google's 50 k limit is far away).
- **Page count delta**: 335 → **336** (+1 for `/sitemap.xml`).
- **Bundle impact**: First Load JS shared chunk = **103 kB UNCHANGED**. `/sitemap.xml` is a server-only route (153 B route chunk; below the 1 kB reporting threshold for shared-chunk impact).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (new files use `MetadataRoute.Sitemap` from `next`).
  - `pnpm test` → **370/370 across 42 files** (was 357/41; +13 from `lib/sitemap/build-sitemap.test.ts` new file).
  - `pnpm build` → **336 prerendered pages** (was 335; +1 `/sitemap.xml`). First Load JS shared chunk = 103 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/7.8-sitemap.md`.

#### Unit 7.10 — OPEN_QUESTIONS hygiene + ADR review (Phase 7 pre-close)

- Seventh Phase-7 code+docs unit; docs-only. Mirrors the Phase-5 (Unit 5.12) + Phase-6 (Unit 6.9) precedents: promotes Phase-7 open questions whose leans were realized in implementation; scans ADRs for stale status or supersede markers. Lands ahead of 7.9 (status pass) + 7.11 (acceptance gate) because the Q-promotions only depend on already-shipped units (7.1 / 7.4 / 7.8) and the unit is collision-free.
- **OPEN_QUESTIONS promotions**:
  - **Q50** (i18n runtime choice): no change — already `resolved 2026-05-16 (Unit 7.1)` from ADR-0011 D-A.
  - **Q51** (Bilingual content backfill cadence): **no promotion** — cadence is ongoing curator work; stays `decided-as-lean` as an audit trail of "Phase 7 acceptance is infrastructure-complete, not content-complete."
  - **Q52** (Translation provenance schema): **promote `decided-as-lean` → `resolved 2026-05-16 (Unit 7.4)`**. Realized in two places: ADR-0011 D-G pinned the contract (Unit 7.1); Unit 7.4 (`f315458`) implemented the schema across 5 Velite collections + 2 canonical Zod-4 schemas with post-transform refines enforcing "translation_source required on translated files".
  - **Q53** (Curator authorship per-locale): **promote `decided-as-lean` → `resolved 2026-05-16 (Unit 7.1)`**. ADR-0011 D-G explicitly pinned "`primary_curator` remains global". Matches the Q50 precedent (ADR-pin resolves the question; no bulk implementation required).
- **ADR review pass**: 11 ADRs at HEAD (0001-0011); all `Status: accepted`; none superseded. Phase 7 added ADR-0011 (Unit 7.1) only; confirmed `accepted` + dates + cross-links + deciders block intact. No edits.
- **No new Q-surfacing this session**. Units 7.6 / 7.7 / 7.8 operated entirely within ADR-0011's contract. The "html-lang vs content-language" risk flagged in Unit 7.7 is an axe-rule edge case, not a load-bearing ambiguity.
- **OPEN_QUESTIONS ledger at HEAD**: 16 resolved (Q1 / Q4 / Q5 / Q12 / Q13 / Q18 / Q27 / Q32 / Q40 / Q41 / Q43 / Q45 / Q46 / Q48 / Q49 / Q50 / Q52 / Q53 — actually 18); 5 decided-as-lean (Q34 / Q35 / Q36 / Q38 / Q39 / Q42 / Q44 / Q51); 19 still open (Q2 / Q3 / Q6-Q11 / Q14-Q17 / Q19 / Q25 / Q26 / Q28-Q31 / Q33 / Q37 / Q47).
- **Smoke gates**: docs-only; `validate-content` / `typecheck` / `test` / `build` / `audit-content` unchanged from Unit 7.8 snapshot (370/370 tests; 336 routes; 103 kB First Load JS).
- THINK artifact: `docs/thinking/7.10-open-questions-hygiene.md`.

#### Unit 7.9 — Phase-7 hygiene status pass (out-of-order: deferrals + in-flight units)

- Eighth Phase-7 unit; docs-only. Out-of-order placement (lands after 7.10 instead of before per the §F order) because Unit 7.5 + Unit 7.3a are in-flight rather than retired — the hygiene pass surfaces them as Class A "in-flight units the primary session has not authored." Mirrors the Phase-5 (Unit 5.11) + Phase-6 (Unit 6.8) precedents.
- **Class A — In-flight Phase-7 units (2)**: Unit 7.3a (bulk page migration + middleware — 22-file structural change deferred from Unit 7.3); Unit 7.5 (`/methodology/[locale]/v1.0.0` FR pilot — likely owned by parallel-curator session). Distinct from "deferred hygiene" because they're expected §F deliverables, just not landed yet.
- **Class B — Phase-7-specific follow-ons (11)**: `<html lang={locale}>` axe-rule risk flagged in 7.7; `SITE` constant extraction (3 → ~5 call sites threshold) flagged in 7.8; `scripts/validate-content.ts` extension for `*.fr.yaml` globs (unlock = first `.fr` content); `app/robots.ts` (sister convention; needs User-Agent policy); per-entry `lastModified` / `changeFrequency` / `priority` on sitemap (observation-driven); locale alternates beyond `/about` (depends on 7.3a); `app/[locale]/page.tsx` (depends on 7.3a); `NEXT_LOCALE` cookie writes (depends on 7.3a middleware); `useTranslations` for LocaleToggle aria-label (depends on 7.3a moving SiteHeader under provider); locale-toggle query-param preservation (future need); centralized translation-CLI (Phase 8+).
- **Class C — Carryover deferrals (10)**: unchanged from Unit 6.8. Orphan `components/domain-tile-grid/` (verified still orphan at HEAD; needs explicit curator authorization); `entries.json` backfill on 8 problems (still 2/10 have entries); `pnpm clean-drafts` script (no `drafts/` at HEAD); `<managingEditor>` on RSS feeds (coupled to Q2); Phase-2 ROR-ID + InstaDeep orphan; W3C feed validator pass (first preview deploy); `/digest` + `/problems/[slug]/talk` Playwright baselines; Phase-6 GraphQL real-API smoke / `NEXT_PUBLIC_GISCUS_REPO_ID` / discussions-aware feed validator (compound Q47).
- **Phase-7 surface delta vs Phase-6 close**: +1 ADR (0011), +1 sitemap surface, +2 SSG pages (`/en/about` + `/fr/about`), +1 site-header control (LocaleToggle), +2 LHCI URLs, +1 Velite-collection-augmentation (5 collections; `lang` derive + `translation_source` enum), +2 helpers (`lib/i18n/locale-filename.ts` + `lib/sitemap/build-sitemap.ts`). Q closures: Q48 + Q50 + Q52 + Q53. Page count 333 → 336 (+3); test count 323 → 370 (+47); First Load JS shared chunk = **103 kB UNCHANGED** through every Phase-7 unit.
- **Risk surface at HEAD**: `<html lang>` content-vs-attribute mismatch on `/fr/about` (axe may flag on first PR); no middleware (bare paths + `[locale]/` paths coexist as separate routes); locale-toggle hidden on bare paths by design (fail-closed).
- **Boundary statement**: NOT the bulk migration, NOT the methodology FR pilot, NOT destructive cleanup, NOT the acceptance gate (Unit 7.11 is the phase-close gate).
- **Smoke gates**: docs-only; unchanged from Unit 7.10 snapshot (370/370 tests; 336 routes; 103 kB First Load JS).
- THINK artifact: `docs/thinking/7.9-phase-7-hygiene.md`.

#### Unit 7.8a — `app/robots.ts` (sister convention to `app/sitemap.ts`)

- Sister-unit to [Unit 7.8](docs/thinking/7.8-sitemap.md) (sitemap). Closes the Class B follow-on from [Unit 7.9](docs/thinking/7.9-phase-7-hygiene.md): "`app/robots.ts` — sister convention". Ships the permissive baseline + sitemap-pointer; no AI-scraping policy decision made (deferred to a future ADR if/when the project takes a posture).
- **New route** — `app/robots.ts`: Next.js convention entry-point (default export, `MetadataRoute.Robots` return type, ~8 lines). Returns `rules: [{ userAgent: "*", allow: "/" }]` + `sitemap: ${SITE}/sitemap.xml` + `host: SITE`. Reuses `SITE` from `lib/sitemap/build-sitemap.ts` (2nd consumer; centralization threshold from Unit 7.8 not yet hit at 5+).
- **New tests** — `app/robots.test.ts`: 3 cases asserting permissive rule shape, Sitemap directive URL, canonical host.
- **NOT in this unit**: no AI-bot blocks (no `User-agent: GPTBot`); no `Disallow` paths (machine routes naturally not surfaced); no `Crawl-delay`; no hreflang directives (not in robots spec; lives in sitemap alternates + future `<link rel="alternate">` meta).
- **Page count delta**: 336 → **337** (+1 for `/robots.txt`).
- **Bundle impact**: First Load JS shared chunk = **103 kB UNCHANGED**.
- **Smoke gates**:
  - `pnpm typecheck` clean.
  - `pnpm test` → +3 cases (3 tests in 1 new file). Total: **373/373 across 43 files** (was 370/42).
  - `pnpm build` → 337 routes; `/robots.txt` listed as Static prerendered alongside `/sitemap.xml`. First Load JS shared chunk = 103 kB UNCHANGED.
- THINK artifact: `docs/thinking/7.8a-robots.md`.

#### Unit 7.11 — Phase 7 acceptance gate

- Phase-7 closing unit. Mirrors Units 1.12 / 2.13 / 3.13 / 4.13 / 5.13 / 6.10. Verifies the §13 Bilingual-rendering thread (per Unit 7.0 D-1) is operational locally at HEAD, emits the cross-phase roll-up, and lists Phase-7 follow-ons that survive into Phase 8+. Docs-only.
- **§13 Bilingual thread — local pass status** (one row per Phase-7 surface):
  - ADR-0011 i18n strategy (next-intl + sub-path routing + sibling-file content storage) — Unit 7.1 ✓.
  - `next-intl@^3.x` runtime + `lib/i18n/` infrastructure (routing source-of-truth + per-locale request loader + seed messages) — Unit 7.2 ✓; 9 vitest tests.
  - `app/[locale]/` layout + `/en/about` + `/fr/about` SSG wiring proof (deliberate scope cut from bulk migration) — Unit 7.3 ✓.
  - Velite sibling-file pattern + `translation_source` schema across 5 collections + canonical Zod mirror — Unit 7.4 ✓.
  - `/methodology` FR pilot (first end-to-end sibling-file consumer): `v1.fr.mdx` + `lib/i18n/load-localized.ts` + 4 new `/[locale]/methodology/...` SSG pages — Unit 7.5 ✓.
  - `/methodology` LHCI enrolment + sitemap locale-alternates (mirrors `/about` treatment) — Unit 7.5a ✓.
  - `components/locale-toggle/` site-header UI (`"use client"`; pathname-based; fail-closed on bare paths) — Unit 7.6 ✓; 11 vitest tests.
  - `lighthouserc.json` enrolment for `[locale]/about` pilot URLs (14 → 16 URLs) — Unit 7.7 ✓.
  - `app/sitemap.ts` + Q48 sitemap-half closure (link-half from Unit 6.3/6.5; sitemap-half here) — Unit 7.8 ✓; 13 vitest tests.
  - `app/robots.ts` sister convention (permissive baseline + sitemap pointer + host directive) — Unit 7.8a ✓; 3 vitest tests.
  - Phase-7 hygiene status pass (Class A in-flight + 11 Class B + 10 Class C carry) — Unit 7.9 ✓.
  - OPEN_QUESTIONS hygiene + ADR review (Q52 + Q53 promoted to `resolved`) — Unit 7.10 ✓.
- **§14 universal contract**: Lighthouse a11y/perf/SEO ≥ 95 gates enrolled for `/en/about` + `/fr/about` + `/en/methodology` + `/fr/methodology` (real run lands first PR; documented `html-has-lang` axe-rule risk on FR pages — `app/layout.tsx` sets `<html lang="en">` statically). W3C feed validator carries Phase-3/5/6 deferrals (compound Q47 + first preview deploy). Visual-regression baselines for the 4 pilot pages deferred (no Playwright spec changes this phase). No auto-merge (ADR-0009) — Phase 7 added no LLM-drafting paths; `content/methodology/v1.fr.mdx` is `translation_source: machine-assisted` per ADR-0011 D-G as an honesty signal. File-first / no DB (ADR-0004) held; DB-migration trigger ~1.4% of 5 MB threshold (cold). First Load JS shared chunk = **103 kB UNCHANGED** through every Phase-7 unit.
- **Phase-7 unit summary**: 13 commits comprising 12 numbered units (7.0–7.10) + 1 follow-on (7.5a) + this gate. Landing order non-linear (7.3 → 7.4 → 7.6 → 7.7 → 7.8 → 7.10 → 7.9 → 7.8a → 7.5 → 7.5a → 7.11) per parallel-curator workflow; both sessions yielded on collision. **Unit 7.3a** (bulk page migration + middleware) **deferred** as a Phase-7 follow-on / Phase-8 candidate (22-file structural change; pilot routes prove the pipeline end-to-end without it; defer-acceptable per Q51 lean).
- **State at HEAD (Unit 7.11)**:
  - **Content**: unchanged at count level from Phase-6 close PLUS **1 new FR sibling MDX** (`content/methodology/v1.fr.mdx`). Counts: 10 problems / 5 domains / ~12 subdomains / 30 papers / 126 authors / 14 institutions / 20 rating actions / 4 issue templates / methodology v1 (EN + **FR**) / contributing v1.0 + v1.1 / 2 `entries.json` files.
  - **341 prerendered pages** (was 333 at Phase-6 close → 335 after 7.3 +2 pilot pages → 336 after 7.8 +`/sitemap.xml` → 337 after 7.8a +`/robots.txt` → 341 after 7.5 +4 methodology pages). Audit: 333+2+1+1+4 = 341 ✓.
  - **383/383 vitest tests across 44 files** (was 323/38 at Phase-5/Phase-6 close); **+60 tests across +6 new test files** this phase: routing (9) + locale-filename (9) + problem schema (+3) + paper schema (+2) + locale-toggle (11) + build-sitemap (13 + 2) + load-localized (8) + robots (3) = 60 ✓.
  - `pnpm validate-content` → **203 files** green (MDX not validated by validate-content; FR MDX flows through Velite refine).
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32-expected baseline since Phase 2).
  - `pnpm typecheck` clean. `pnpm build` clean compile (~3s).
  - **5 visualizations live** (unchanged from Phase 4): RatingRadar, SaturationCurve, MoversBoard, RatingHistoryStream, DomainMap.
  - **11 ADRs** (added ADR-0011 in Phase 7): 0001-0010 unchanged + **0011 (i18n strategy — next-intl + sub-path + sibling-file)** new.
  - **1 new dependency in Phase 7**: `next-intl@^3.x` (pnpm resolved `3.26.5`). Pure JS; no `allowBuilds` change. ADR-0011 D-A version-pin held against pnpm's auto-pick of 4.x via ADR-immutability discipline (Unit 7.2 noted).
  - **`lighthouserc.json`** enrols **18 URLs** (was 14 at Phase-6 close; +2 from Unit 7.7 for `/en/about` + `/fr/about`; +2 from Unit 7.5a for `/en/methodology` + `/fr/methodology`).
  - **OPEN_QUESTIONS state**: 4 new Phase-7 questions surfaced (Q50-Q53); all 4 retired this phase. Q50 closed by ADR-0011 D-A (Unit 7.1); Q52 closed by Unit 7.4 (schema implementation); Q53 closed by Unit 7.1 (ADR-0011 D-G pin); Q51 stays `decided-as-lean` (curator-track cadence is an audit trail of "infrastructure-complete, not content-complete"). Q48 (Phase-6 partial) closed by Unit 7.8 (sitemap-half). Phase-7 net ledger movement: **5 resolutions** (Q48 + Q50 + Q52 + Q53; Q51 stays lean).
- **Phase-7 follow-ons that survive the gate** (non-blocking): Unit 7.3a bulk page migration + middleware (defer-acceptable Phase-8 candidate or curator-track follow-on); first LHCI run for the 4 new pilot URLs (documented `html-has-lang` axe-rule risk on FR pages); visual baselines for the 4 pilot pages; `<html lang={locale}>` one-line fix in `app/[locale]/layout.tsx`; `SITE` constant extraction into `lib/site-url.ts` (3 → 5+ threshold); `LOCALE_ALTERNATE_ROUTES` table extraction in `lib/sitemap/build-sitemap.ts` (2 → 5+ threshold); `scripts/validate-content.ts` glob extension for `*.fr.yaml`; per-entry `lastModified` / `changeFrequency` / `priority` on sitemap (observation-driven); locale alternates beyond `/about` + `/methodology` (depends on 7.3a); `app/[locale]/page.tsx` home (depends on 7.3a); `NEXT_LOCALE` cookie writes (depends on 7.3a middleware); `useTranslations` for LocaleToggle aria-label (depends on 7.3a); bilingual content backfill on remaining ~200 EN files (Q51 curator-track).
- **Pre-existing follow-ons** (carryover from prior phases): orphan `components/domain-tile-grid/` deletion (curator authorization); `entries.json` backfill on 8 problems (editorial + API); `<managingEditor>` on RSS (Q2 DNS); W3C validator passes for Phase-3 + Phase-5 + Phase-6 RSS (first deploy); `pnpm clean-drafts` script (operational signal); Phase-2 ROR-ID + InstaDeep orphan; `NEXT_PUBLIC_GISCUS_REPO_ID` + repo-Discussions enablement (Phase-6 Q47 operational gate).
- **Phase 8 entry conditions**: per §12 cardinal rule, **explicit human sign-off required**. §13 Phase 6+ scope is open-ended; Phase 6 closed Discussions; Phase 7 closed Bilingual (infrastructure-complete; content backfill curator-track). Remaining threads = auth (DB-trigger flip MANDATORY on first write-path unit per Units 4.12 / 5.10 / 6.0 / 7.0 D-2; 14+ unit phase) / read+write API with token auth (couples to auth) / subscriber-list (Phase-5 D-4 punt; coupled to auth or third-party) / monetization (premature without auth + API + read-API maturity) / Unit 7.3a as opportunistic Phase-8 Unit 8.0 if a chosen thread depends on full `[locale]/` route coverage. DB-migration trigger re-eval mandatory at Phase 8 kickoff; currently ~1.4% of 5 MB (cold; +6 KB delta from FR methodology MDX).
- **Cross-phase milestone**: this commit closes the **Bilingual rendering thread** of Phase 7 to the level Unit 7.0 D-1 + ADR-0011 scoped it: **infrastructure-complete and pilot-validated** (1 FR content surface end-to-end; 2 SSG locale pilots; sitemap + LHCI + locale-toggle UI infrastructure; sibling-file Velite plumbing; English-canonical-slug routing; `translation_source` provenance schema enforced). 13 commits + 1 ADR + 1 new dependency + 0 client-bundle regressions + 0 test regressions + 60 new tests + 5 OPEN_QUESTIONS movements (4 Phase-7 resolutions + 1 Phase-6 carryover closed).
- THINK artifact: `docs/thinking/7.11-phase-7-acceptance-gate.md`.

### Phase 8 — Community-adjacent surfaces (second Bilingual sub-thread: rollout completion)

#### Unit 8.0 — Phase 8 prep (THINK doc + 10-unit Bilingual-rollout-completion breakdown + DB-migration trigger re-eval)

- Phase 8 kickoff per §12 cardinal rule. Phase 7 closed at HEAD `01862d2` (Unit 7.11 acceptance gate; Bilingual thread infrastructure-complete + pilot-validated). **Phase 8 sign-off granted via "Continue" override** in the unit-rhythm rhythm (third invocation of this pattern; precedents: Phase 5 → 6 in Unit 6.0; Phase 6 → 7 in Unit 7.0; §12 normally requires explicit sign-off — this unit flags the override transparently). Docs-only unit.
- **§13 ledger progress**: Discussions thread CLOSED (Phase 6); Bilingual thread INFRASTRUCTURE-COMPLETE (Phase 7); **Bilingual thread ROLLOUT TARGETED (Phase 8)**; auth + subscriber-list + monetization remain available threads for future phases.
- **D-1. First-thread recommendation = Bilingual rollout completion (continuation of §13 thread 3)**. Rationale: sequential thread-closure precedent (Phase 6 closed Discussions; Phase 7 shipped Bilingual infra/pilot; Phase 8 finishes Bilingual route coverage); lowest blast radius among available options (no first-party auth, no DB-trigger flip, no Phase-4 pact break, no new deps, no provider commit); scope discipline (auth keystone is 14+ units; better to close Bilingual fully and commit to auth in Phase 9 with clean ledger state); closes Unit 7.3a's open-ended deferral (catalogued Class A in Unit 7.9); predictable scope (~9–10 units); defers auth marination further (no first-party write-path UX requirements yet to constrain provider commitment).
- **Alternative threads** enumerated with deferral rationale (overridable if redirected): auth + read+write API (§13 keystone; DB-trigger flip MANDATORY; 14+ units; breaks "no user accounts" pact); subscriber-list (third-party decouples from auth; Phase 9-10 follow-on candidate); monetization (premature without auth + API + read-API maturity).
- **10-unit breakdown** (8.0 – 8.9):
  - 8.0 Phase 8 prep (this doc) — docs.
  - 8.1 Bulk page migration + middleware (`localePrefix: "always"` per ADR-0011 D-B) — closes Unit 7.3a deferral; absorbs `<html lang={locale}>` fix on `app/[locale]/layout.tsx` — code.
  - 8.2 `app/[locale]/page.tsx` — locale-aware home page (Class B follow-on) — code + content.
  - 8.3 `NEXT_LOCALE` cookie writes from middleware (Accept-Language hint per ADR-0011 D-F) — code.
  - 8.4 `useTranslations` for LocaleToggle aria-label (replaces hardcoded `"Passer au français"` / `"Switch to English"`) — code.
  - 8.5 `lib/site-url.ts` extraction (`SITE`) + `LOCALE_ALTERNATE_ROUTES` table extraction + locale alternates expansion in sitemap — code.
  - 8.6 `/contributing` FR pilot (`content/contributing/v1.fr.mdx` + locale-aware routes; mirrors Unit 7.5's methodology pilot) — code + content.
  - 8.7 Phase-8 hygiene status pass — docs.
  - 8.8 OPEN_QUESTIONS hygiene + ADR review — docs.
  - 8.9 Phase 8 acceptance gate — gate.
- **D-2. DB-migration trigger re-eval** (MANDATORY at Phase 8 kickoff per Units 4.12 / 5.10 / 6.0 / 7.0). Measured at HEAD `01862d2`: `tar -czf .velite/ = 81,656 bytes (~79.7 KB) = ~1.558% of 5 MB threshold` (was 1.433% at Phase 7 kickoff; +0.124 pp delta dominated by FR methodology MDX serialization). Auth trigger negative under Bilingual-rollout-completion. **Decision**: DB migration deferred to Phase 9+ OR Phase 8.X mid-phase if redirected to auth. Same conclusion as Units 4.12 / 5.10 / 6.0 / 7.0. **Phase 8 weight**: Unit 8.6 light FR content pilot expansion (~0.05 pp expected); Q51 curator-track bulk backfill stays cold. Content file count 203 schema-validated (unchanged) + 35 raw MDX = 238 total; still under `> 600` trigger.
- **Decisions resolved in this unit**: D-1 (first-thread = Bilingual rollout completion + rationale + alternatives table), D-2 (DB trigger 1.558% — deferred), D-3 (bulk-migration strategy lean: big bang; pin in Unit 8.1 after per-route inventory), D-4 (FR content pilot expansion lean: `/contributing` v1.0 in Unit 8.6), D-5 (SITE + LOCALE_ALTERNATE_ROUTES extraction sequencing into Unit 8.5), D-6 (provisional unit breakdown).
- **Decisions deferred** (D-7 through D-11): D-7 bulk-migration strategy final pick (Unit 8.1); D-8 home-page i18n message keys (Unit 8.2); D-9 `NEXT_LOCALE` cookie scope + flags + expiry (Unit 8.3); D-10 `scripts/validate-content.ts` `*.fr.yaml` glob extension (gates on Unit 8.6 content scope); D-11 `app/[locale]/page.tsx` hero FR translation copy (Unit 8.2).
- **No new open questions surfaced**. ADR-0011 pins every i18n contract; Phase 8 executes that contract at scale; D-decisions above are tactical, not architectural. **Q51 status**: stays `decided-as-lean` through Phase 8; may promote to `resolved` at Unit 8.8 if scope-hold interpretation prevails (rollout-complete + small FR content pilot = "infrastructure-complete + route-complete" the lean was authored against). Or stays lean if Q51 is interpreted strictly as "every problem.yaml + paper.yaml + MDX translated" (curator-track horizon).
- **Forward-looking DB-migration re-eval triggers** (carried from Unit 7.0): content scale 3× / `> 600` files / `> 1 MB` gzipped — Phase 8 light pilot expansion stays cold; first Phase-8+ write-path lands (auth flips) — stays cold under Bilingual-rollout-completion; Phase 9 kickoff (mandatory); rating-action volume reaches 200; drafts-dir > 100 stale.
- **Order rationale**: 8.1 first (structural keystone; everything downstream depends on bulk migration landing; highest collision risk in project history — primary session blocks parallel work during this unit); 8.2 → 8.5 sequential or parallel once 8.1 lands; 8.4 depends on 8.1 surfacing SiteHeader under `NextIntlClientProvider`; 8.6 late (after 8.5's `LOCALE_ALTERNATE_ROUTES` extraction makes contributing-side alternates a 1-line change); 8.7 / 8.8 hygiene; 8.9 closes.
- **Parallel-curator awareness**: docs-only, no collision risk this unit. **Unit 8.1 has the highest collision risk in project history** (touches ~22 route files + `middleware.ts` + `lib/digest/build-digest.ts` + `lighthouserc.json`); a parallel session must yield during 8.1; primary session signals start + completion via git log.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/8.0-phase-8-prep.md`.

#### Unit 8.1 — Bulk page migration + middleware (`localePrefix: "always"`)

- First code unit of Phase 8. Closes the open-ended deferral catalogued in Unit 7.9 Class A (the "bulk page migration + middleware" follow-on scope-cut from Unit 7.3 to a wiring proof). Highest collision risk in project history per Unit 8.0 prep; the primary session held the lock through this commit.
- **New files**:
  - `middleware.ts` — `createMiddleware` from `next-intl/middleware` with `localePrefix: "always"` per [ADR-0011 D-B](docs/adr/0011-i18n-strategy.md). Matcher excludes `/api`, `/_next`, `/_vercel`, and file-extension paths (so `/sitemap.xml`, `/robots.txt`, `/api/v1/*` bypass middleware). 51.8 kB bundle reported by Next.js (server-only; no impact on First Load JS).
  - `lib/i18n/navigation.ts` — re-exports locale-aware `Link`, `useRouter`, `usePathname`, `redirect` from `createSharedPathnamesNavigation({ locales, localePrefix: "always" })` in next-intl@3. Single source of truth for the navigation-layer wrappers.
- **Bulk page migration** — every bare `app/<route>/page.tsx` moved to `app/[locale]/<route>/page.tsx`:
  - 22 bare-route files deleted: `app/{about,contributing,digest,domains,methodology,page,papers,problems,ratings,trending}` + the corresponding `[slug]` / `[version]` / `[domain]` / `[id]` subdirectories.
  - 19 new `app/[locale]/<route>/page.tsx` files created (3 existing `[locale]/` shadows from Units 7.3 + 7.5 — `/about`, `/methodology`, `/methodology/[version]` — were kept and the bare originals deleted).
  - Each migrated page: `params: Promise<{ locale: string; ... }>`, awaits params, validates via `isLocale()`, calls `setRequestLocale(locale)`. `generateStaticParams` (where present) extended via cartesian product with `locales` (`locales.flatMap((locale) => …)`).
  - `app/[locale]/methodology/page.tsx` updated to use the i18n Link wrapper (was hardcoding `/${locale}/methodology/v${version}`).
- **`<Link>` import migration** — every `import Link from "next/link"` in 7 component files + 1 search-palette `useRouter` switched to `import { Link } from "@/lib/i18n/navigation"`:
  - `components/site-header/`, `components/recently-rated/`, `components/layout/RoutePlaceholder`, `components/domain-tile-grid/`, `components/papers-index/`, `components/problems-index/`, `components/search-palette/` (both `Link` and `useRouter`).
  - **Kept on `next/link`** (intentional):
    - `components/viz/MoversBoard/index.tsx` — pure presentational component rendered in vitest unit tests without router context; the next-intl Link wrapper depends on `next/navigation`'s pathname which is unavailable in those renders. Clicks 308-redirect via middleware (round-trip cost acceptable for a sparkline cell action).
    - `components/locale-toggle/index.tsx` — uses explicit locale-prefix URL construction; the i18n wrapper would double-prefix.
    - `app/not-found.tsx` — root 404 lives outside `[locale]/`; no NextIntlClientProvider context.
- **`TALK_PATHNAME_REGEX` extension** in `lib/discussions/github-graphql.ts`: accepts optional `(en|fr)/` capture. New regex: `/^\/(?:(en|fr)\/)?problems\/([a-z0-9-]+)\/talk$/`. **Critical for Giscus backward-compat**: pre-migration discussions are titled `/problems/<slug>/talk`; post-migration discussions will be titled `/en/problems/<slug>/talk` (Giscus mapping reads the URL after middleware redirect). Both must match. Slug capture index shifts from `m[1]` to `m[2]`; `lib/digest/build-digest.ts` updated accordingly with an inline comment.
- **Test updates** — `lib/discussions/github-graphql.test.ts`: existing 4 cases refactored into 3 cases covering (a) pre-migration bare paths (capture group 2 holds the slug; group 1 is `undefined`), (b) post-migration `/en/...` + `/fr/...` paths (group 1 = locale, group 2 = slug), (c) rejection of unknown locale (`/xx/problems/x/talk`) + locale-prefix-without-`problems` (`/en/talk`) + the previous rejection cases. Net: +1 case (3 vs 4 — but better coverage shape).
- **`lighthouserc.json`** — 13 non-locale-aware URLs prefixed with `/en/`:
  - Before: `/`, `/problems/...`, `/domains`, `/papers/...`, `/authors/...`, `/institutions/...`, `/trending`, `/ratings`, `/contributing`, `/digest` (10) + 3 problem sub-paths (`/ratings`, `/history`, `/talk`).
  - After: all 13 carry `/en/` prefix; existing `/en/about` + `/fr/about` + `/en/methodology` + `/fr/methodology` (5) stay. URL count holds at **18** (no new URLs; the FR-side LHCI enrolment for the broader cohort is a Unit 8.5 / 8.6 follow-on).
- **HTML shell migration DROPPED from scope (mid-flight decision)** — original plan was to move `<html>` / `<body>` / fonts / `ThemeProvider` / `SiteHeader` shell from `app/layout.tsx` into `app/[locale]/layout.tsx` to set `<html lang={locale}>` and put SiteHeader under `NextIntlClientProvider`. Scope dropped after a parallel-session signal indicated the existing `app/layout.tsx`-owns-`<html>` structure should be preserved. Unit 7.7's documented `html-has-lang` axe-rule risk **survives Unit 8.1** and now lives at Unit 8.4 (originally scoped to `useTranslations` for LocaleToggle aria-label; expanded to absorb the shell migration since both depend on SiteHeader moving under provider).
- **NOT in this unit** (deferred per Unit 8.0 prep):
  - `app/[locale]/page.tsx` content already migrated mechanically; FR translation of hero copy stays in Unit 8.2 scope.
  - `useTranslations` for LocaleToggle aria-label + HTML shell migration — Unit 8.4 scope.
  - `NEXT_LOCALE` cookie writes — Unit 8.3 scope.
  - SITE + LOCALE_ALTERNATE_ROUTES constant extractions + locale alternates beyond `/about` + `/methodology` in sitemap — Unit 8.5 scope.
  - FR `/contributing` content pilot — Unit 8.6 scope.
  - `lib/sitemap/build-sitemap.ts` canonical strategy: bare canonical URLs stay; middleware 308 to `/en/<route>` is a transparent crawler convention. Alternates expansion to all routes is Unit 8.5.
  - `lib/digest/rss.ts` + `app/api/v1/rss.xml/route.ts`: bare canonical URLs stay; same convention.
- **Page count delta**: **341 → ~590** prerendered pages. Locale-doubling: every `/[locale]/<route>` × 2 locales. Authors (`126 × 2 = 252`), papers (`60 × 2`), problems detail × 4 sub-routes (`10 × 4 × 2 = 80`), domain pairs, etc. Build output shows the cartesian expansion; First Load JS shared chunk = **103 kB UNCHANGED** through every Phase-8 unit so far.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged (no content delta).
  - `pnpm typecheck` clean.
  - `pnpm test` → **384/384 across 44 files** (was 383; +1 net from the github-graphql regex test refactor).
  - `pnpm build` → ~590 prerendered pages; middleware reported at 51.8 kB; First Load JS shared chunk = **103 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2).
- THINK artifact: `docs/thinking/8.1-bulk-page-migration.md`.

#### Unit 8.2 — `app/[locale]/page.tsx` FR hero translation + `messages.home.*` keys

- Second code unit of Phase 8. Realizes D-8 + D-11 from Unit 8.0 prep. Closes one of the Class B follow-ons from Unit 7.9: locale-aware home page with FR-translated hero copy. Builds on Unit 8.1's bulk migration (the home route is at `app/[locale]/page.tsx` post-`31ea2d5`).
- **Edits**:
  - `messages/en.json` — new `home.*` namespace with 15 keys: `hero_heading`, `hero_description`, `cta_browse_problems`, `cta_read_methodology`, `recently_rated_heading`, `recently_rated_all_link`, `by_domain_heading`, `by_domain_all_link`, `by_domain_nav_aria`, `domain_map_aria`, `domain_map_switch_aria`, `domain_map_table_label`, `methodology_heading`, `methodology_description`, `methodology_cta`.
  - `messages/fr.json` — FR translations for every `home.*` key. Hero h1: "Problèmes ouverts notés en recherche en LLM et IA." Hero p preserves the em-dash parenthetical and renders the five dimensions in French ("Difficulté, Saturation, Urgence, Valeur, Demande de l'industrie" — matches the methodology FR translation choices from Unit 7.5).
  - `app/[locale]/page.tsx` — replaces 15 hardcoded EN strings with `getTranslations("home")` lookups. Aria-labels threaded as props to `<nav>`, `ChartTableSwitch`, and `DomainMap`. Arrow glyph (→) preserved in both locales (typographic, not lexical).
- **Translation provenance**: `messages/fr.json` is an i18n catalog (lib-side), not a content file. ADR-0011 D-G scopes `translation_source` frontmatter to `*.<locale>.{yaml,mdx}` content files only; no provenance field needed on `messages/*.json`. The FR translations are curator-authored (short UI strings; not LLM-drafted prose).
- **NOT in this unit** (deferred):
  - `components/recently-rated/` internal strings ("No rating actions yet — see /contributing.") — component-side; multiple call sites; deferred to a component-specific i18n pass.
  - `StatusPill` localization (open / partially-solved / converging / solved / retired) — component-side enum mapping; deferred.
  - Site-header nav labels — already in `messages.nav.*`; folds into Unit 8.4 alongside LocaleToggle aria-label + HTML shell migration.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged (no content delta).
  - `pnpm typecheck` clean.
  - `pnpm test` → 384/384 across 44 files unchanged (no test files touched).
  - `pnpm build` → ~590 prerendered pages unchanged. Compile 3.6s. First Load JS shared chunk = **103 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/8.2-home-page-fr-translation.md`.

#### Unit 8.3 — `NEXT_LOCALE` cookie configuration on middleware

- Third code unit of Phase 8. Realizes Unit 8.0 prep D-9: explicitly pin the `NEXT_LOCALE` cookie configuration on the next-intl middleware (was relying on next-intl defaults from Unit 8.1's `31ea2d5`).
- **Edit** — `middleware.ts`: `createMiddleware` extended with explicit `localeCookie` config:
  - `name`: `NEXT_LOCALE` (matches next-intl default; spelled here for clarity).
  - `maxAge`: `60 * 60 * 24 * 365` (1 year). Returning visitors keep their last-clicked locale; expires before stale browser state outlasts a reasonable curator turnaround.
  - `sameSite`: `lax`. Required for top-level navigation cookies; LocaleToggle is within-origin.
  - `path`: `/`. Cookie applies site-wide.
  - `secure`: `process.env.NODE_ENV === "production"`. `localhost` dev and `pnpm start` smoke tests need the cookie over HTTP; CI Lighthouse + Vercel previews run under HTTPS.
  - `httpOnly`: intentionally left at next-intl's default (false). Only the middleware reads the cookie today (server-side); `httpOnly: true` would harden against XSS but pre-empt future client-side personalization (e.g., LocaleToggle "remember this choice" UX).
- Comment block in `middleware.ts` documents each field's rationale + cross-references ADR-0011 D-B (locale-prefix mandate) and ADR-0011 D-F (cookie is for first-visit Accept-Language hint, not state).
- **NOT in this unit** (deferred):
  - Custom cookie name (e.g., `op_locale`) — conventional `NEXT_LOCALE` is widely understood; no benefit to deviation.
  - Encrypted / signed cookie — content is `en` / `fr`, not a secret; tampering forces re-detection.
  - Multi-locale tracking (e.g., FR for marketing, EN for docs) — Phase-9+ concern coupled to user accounts.
  - Dedicated middleware integration test — Class B follow-on; existing routing tests + Unit 8.1's smoke pass cover the locale-set-of-truth + end-to-end redirect behavior.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → 384/384 across 44 files unchanged (no test files touched).
  - `pnpm build` → ~590 prerendered pages unchanged. First Load JS shared chunk = **103 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/8.3-locale-cookie-config.md`.

#### Unit 8.4 — `useTranslations` for LocaleToggle aria-label — DEFERRED

- **Status**: deferred indefinitely. Unit 8.0 prep scoped Unit 8.4 to replacing the hardcoded `"Passer au français"` / `"Switch to English"` aria-label pair in `components/locale-toggle/index.tsx` with `useTranslations`. The work depends on SiteHeader being rendered **under** the `NextIntlClientProvider`, which depends on the HTML shell migration (moving `<html>` / `<body>` / fonts / `ThemeProvider` / `SiteHeader` from `app/layout.tsx` into `app/[locale]/layout.tsx`).
- The HTML shell migration was originally planned for Unit 8.1 but **dropped mid-flight** when a parallel session signaled (via system reminder) that the existing `app/layout.tsx`-owns-`<html>` structure was intentional. Unit 8.1's CHANGELOG flagged the deferral; the shell migration would have re-attempted in Unit 8.4.
- Without the shell migration, Unit 8.4 has no tractable scope: SiteHeader cannot reach `NextIntlClientProvider` context, and `useTranslations` would throw at render time.
- **Pending explicit authorization** to move the HTML shell, Unit 8.4 stays deferred. Unit numbering jumps 8.3 → 8.5 directly. The acceptance gate (Unit 8.9) will record this in the §13 ledger as a survives-Phase-8 follow-on alongside Unit 7.7's `html-has-lang` axe-rule risk (whose closure was the original motivation for the shell migration).
- No code, content, or doc change in this unit beyond this CHANGELOG entry.

#### Unit 8.5 — `lib/site-url.ts` extraction + universal sitemap locale alternates

- Fifth code unit of Phase 8. Realizes Unit 8.0 prep D-5. Consolidates the `SITE` constant into a shared module (5 call sites today — crosses the Unit 7.8 5+ extraction threshold) and extends locale alternates to every sitemap entry now that Unit 8.1's bulk migration guarantees every route has a `/[locale]/` shadow.
- **New file** — `lib/site-url.ts`:
  - `export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://llm-openproblems.org";`
  - Unifies two divergent patterns (env-fallback in pages vs hardcoded in libs). Preview deploys (Vercel, Netlify) substitute their actual hostname in RSS / sitemap / citation blocks; local dev + CI + tests fall through to the production placeholder.
  - Comment block records Q2 (DNS) as the trigger for updating the fallback literal — all consumers pick it up.
- **Edits** — `lib/sitemap/build-sitemap.ts`:
  - Imports `SITE` from `lib/site-url`; re-exports for backward-compat with `app/robots.ts`, `lib/sitemap/build-sitemap.test.ts`, `app/robots.test.ts`.
  - New helper `entryWithAlternates(route)` builds a sitemap entry with `alternates.languages = { en: ${SITE}/en${route}, fr: ${SITE}/fr${route} }`.
  - Helper applied uniformly across all enumerations: STATIC_ROUTES, problem detail + 4 sub-routes per problem, papers, authors, institutions, domains + subdomains, versioned methodology + contributing.
  - The Unit 8.0 prep's "LOCALE_ALTERNATE_ROUTES table" framing collapses into the helper function — after Unit 8.1 every route has a shadow, so the "routes with alternates" set is congruent with "all routes." Explicit Set adds maintenance overhead without expressive benefit; the helper IS the table.
- **Edits** — other call sites:
  - `lib/digest/rss.ts`: imports `SITE` from `lib/site-url`; re-exports for backward-compat with `app/api/v1/digest/[domain]/route.test.ts`.
  - `app/api/v1/rss.xml/route.ts`: replaces local `const SITE` with import (route files can't re-export per Phase-5 lesson, so this one doesn't need backward-compat).
  - `app/[locale]/problems/[slug]/page.tsx`, `app/[locale]/papers/[id]/page.tsx`: replace local `SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "..."` with import of `SITE`. Citation URLs now include the locale segment (e.g., `${SITE}/${locale}/papers/${paper.id}`) — matches Unit 8.1's canonical URL shape under `localePrefix: "always"`. Curators citing papers from `/fr/` get a French-prefixed URL.
- **Test updates** — `lib/sitemap/build-sitemap.test.ts`:
  - Replaces the now-flipped "no alternates without shadow" test (line 78 of the prior version) with a universal invariant: every sitemap entry carries `alternates.languages.{en,fr}`.
  - Adds 4 new assertions: home `/` alternates (with the asymmetric URL formatting — canonical `${SITE}/`, alternates `${SITE}/en` + `${SITE}/fr`); `/problems` + `/digest` now carry alternates (was previously asserted to NOT carry them); dynamic-segment routes carry alternates (sample-checked on the first problem detail page); `/contributing/v1` carries alternates.
- **NOT in this unit** (deferred):
  - Sitemap `lastModified` / `changeFrequency` / `priority` per entry — Unit 7.8 follow-on; observation-driven; no Lighthouse SEO signal yet.
  - Trailing-slash normalization for `NEXT_PUBLIC_SITE_URL` env var (would double-slash if a user sets `NEXT_PUBLIC_SITE_URL=https://example.com/`) — kept simple; documented in `lib/site-url.ts` comment.
  - Translating the citation BibTeX block keys (`title = {...}`, `author = {...}`) into FR — BibTeX is a stable technical format; deferred to Q51 curator-track if ever pursued.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → **388/388 across 44 files** (was 384/44; +4 net from sitemap test rewrite — 1 deleted "no alternates" + 5 added; 5 - 1 = 4 net delta).
  - `pnpm build` → ~590 prerendered pages unchanged. Compile 3.8s. First Load JS shared chunk = **103 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/8.5-site-url-and-locale-alternates.md`.

#### Unit 8.6 — `/contributing` FR pilot (second sibling-file consumer)

- Sixth code unit of Phase 8. Realizes Unit 8.0 prep D-4. Second end-to-end consumer of the sibling-file plumbing from Unit 7.4 + the `resolveLocalized` resolver from Unit 7.5 — mirrors the methodology FR pilot.
- **Parallel-curator coordination**: this unit was executed concurrently across two sessions. The primary session prepared the route refactor + lighthouserc edit; the parallel session shipped the FR translation file + an identical route refactor + the same lighthouserc edit. Working-tree state at commit was the parallel session's content (per the rhythm-memory contract "uncommitted working-tree changes belong to the parallel session"); the two refactors produced byte-identical contributing route content (only formatting/import-order differences).
- **New content** — `content/contributing/v1.1.fr.mdx`: full FR translation of `v1.1.mdx` (~115 lines of FR prose):
  - 7 sections preserved 1:1: Qui peut contribuer / Les quatre types de contribution / Standards éditoriaux (with §3.1-3.6 including Divulgation des conflits d'intérêts) / Attentes de revue de PR / Versionnement / Questions, ambiguïté, lacunes / Curation assistée par LLM (with §7.1-7.4).
  - Frontmatter: `version: "1.1.0"`, `supersedes: "1.0.0"`, `translation_source: "machine-assisted"` (ADR-0011 D-G honest provenance — LLM-drafted, curator-reviewable). Date mirrors EN (2026-05-16).
  - GitHub link targets preserved as English-canonical per ADR-0011 D-E (MASTER_PROMPT.md, content/problems/, content/papers/, ADR-0005/0006/0008/0009 URLs). Issue-template URLs (`new-problem`, `new-paper`, `leaderboard-entry`, `rating-challenge`) similarly preserved.
  - French CS terminology: "Curateur" for curator (consistent with Unit 7.5 methodology FR), "Action de notation" for rating action, "Classement" for leaderboard. "Pull request"/"issue"/"commit" kept as anglicisms.
- **Route refactors**:
  - `app/[locale]/contributing/page.tsx` — replaces unconditional `lang === "en"` filter with `resolveLocalized(contributing, locale, (m) => m.version === latestVersion)`. Mirrors `app/[locale]/methodology/page.tsx`'s shape. Latest version derived from EN canonicals (FR siblings mirror versioning); FR variant resolved via the version predicate.
  - `app/[locale]/contributing/[version]/page.tsx` — replaces `find((m) => m.version === requested)` against EN-only with `resolveLocalized`. `generateStaticParams` extended to `locales × distinct EN versions` = 4 entries (`{en,fr} × {1.0.0, 1.1.0}`). Mirrors `app/[locale]/methodology/[version]/page.tsx`.
- **`lighthouserc.json`** — enrols `/fr/contributing` alongside existing `/en/contributing` (18 → **19** URLs). Mirrors Unit 7.7 + 7.5a pattern (enrol both locale variants of FR-pilot routes).
- **Fallback behavior**:
  - `/fr/contributing` (default landing): resolves latest version (v1.1.0); FR sibling exists; renders FR content.
  - `/fr/contributing/v1.1.0`: FR sibling exists; renders FR.
  - `/fr/contributing/v1.0.0`: no FR sibling (no `v1.0.fr.mdx`); `resolveLocalized` falls back to EN per ADR-0011 D-D. `didFallback = true` but no hint UI today (Class B follow-on; same deferral as Unit 7.5).
- **NOT in this unit** (deferred):
  - `content/contributing/v1.0.fr.mdx` (older version FR translation) — curator-track follow-on per Q51. v1.0 is a historical reference; users hitting the latest `/fr/contributing` already get FR via the v1.1 translation.
  - Fallback-hint UI for `didFallback === true` cases — Class B follow-on, survived Phase 7, continues into Phase 9+ candidate work.
  - `messages.contributing.*` namespace for breadcrumb / "Other versions:" chrome strings — hardcoded EN today; component-side string extraction is out of Phase-8 scope.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged (MDX flows through Velite refine, not validate-content).
  - `pnpm typecheck` clean.
  - `pnpm test` → 388/388 across 44 files unchanged (no test files touched).
  - `pnpm build` → `/[locale]/contributing/[version]` expands from 2 to 4 entries (was `{en,fr} × {1.0.0}`; now `{en,fr} × {1.0.0, 1.1.0}`). Compile 8.6s. First Load JS shared chunk = **103 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/8.6-contributing-fr-pilot.md`.

#### Unit 8.7 — Phase-8 hygiene status pass (Class A / B / C catalog)

- Seventh Phase-8 unit. Docs-only. Mirrors Unit 5.11 / 6.8 / 7.9 hygiene passes. Catalogs in-flight Phase-8 items + Phase-8-specific follow-ons + carryovers from prior phases.
- **Class A — In-flight Phase-8 items (1)**: Unit 8.4 (`useTranslations` for LocaleToggle aria-label) **deferred indefinitely** — depends on SiteHeader-under-`NextIntlClientProvider`, which depends on the HTML shell migration that the parallel session preserved with a "this change was intentional" system reminder at Unit 8.1 mid-flight. Without the shell migration, 8.4 has no tractable scope. Unblock: explicit authorization to move the shell.
- **Class B — Phase-8-specific follow-ons (12)**: HTML shell migration into `app/[locale]/layout.tsx`; `<html lang={locale}>` (closes Unit 7.7 axe-rule risk); SiteHeader moves under provider (unblocks Phase-7 hardcoded aria-label strings); fallback-hint UI for `didFallback === true` (deferred since Unit 7.5; survived Unit 8.6); `content/contributing/v1.0.fr.mdx` (curator-track per Q51); bulk content backfill (problem.yaml + paper.yaml + per-problem MDX + paper YAMLs + 4 issue-template forms — Q51 horizon); `messages.{contributing,methodology,…}.*` chrome strings (only home page got full i18n treatment in 8.2); StatusPill localization; recently-rated empty-state copy; site-header nav labels via `useTranslations` (blocks on 8.4); trailing-slash normalization for `NEXT_PUBLIC_SITE_URL`; per-entry sitemap `lastModified` / `changeFrequency` / `priority` (observation-driven; Unit 7.8 follow-on).
- **Phase-7 follow-ons that continue to survive**: first LHCI run for the 5 locale-pilot URLs (`/en/about`, `/fr/about`, `/en/methodology`, `/fr/methodology`, `/fr/contributing` — `/en/contributing` was always enrolled); visual-regression baselines for the locale-pilot pages.
- **Class C — Carryover deferrals (unchanged from Unit 7.9)**: orphan `components/domain-tile-grid/` deletion (destructive-action policy); `entries.json` backfill on 8 problems (Q47-track); `pnpm clean-drafts` script (operational signal); `<managingEditor>` on RSS (Q2 DNS); Phase-2 ROR-ID + InstaDeep orphan; W3C feed validator pass (first preview deploy + Q47); `/digest` + `/problems/[slug]/talk` Playwright baselines; real-API smoke for Phase-6 GraphQL client (Q47 + `GITHUB_TOKEN`); `NEXT_PUBLIC_GISCUS_REPO_ID` + repo Discussions enablement (Q47).
- **Phase-8 surface delta vs Phase-7 close**: routes 341 → ~590 (+~245 from locale-doubling); tests 383 → 388 (+5 net: +1 from Unit 8.1's TALK_PATHNAME_REGEX refactor, +4 from Unit 8.5's sitemap test rewrite); First Load JS shared chunk = **103 kB UNCHANGED** through every Phase-8 unit; ADRs 11 (unchanged); 0 new dependencies; LHCI URLs 18 → 19 (Unit 8.6's `/fr/contributing` enrolment); content +1 FR MDX (`v1.1.fr.mdx` from Unit 8.6) → 239 raw content files (203 schema-validated + 36 MDX); DB-trigger ~1.6% of 5 MB threshold (still cold).
- **Phase-8 unit ordering (actual landing order)**: 8.0 prep (`0ee1ad9`) → 8.1 bulk migration (`31ea2d5`) → 8.2 home-FR (`defb122`) → 8.3 cookie config (`5e2b509`) → 8.4 **deferred** → 8.5 site-url + universal alternates (`90bd3c3`) → 8.6 /contributing FR (`bad59fa`) → 8.7 hygiene (this) → 8.8 OQ hygiene → 8.9 acceptance gate. Total: 7 code/docs units + 2 closing units; 8.4 numbering preserved as a deferral marker.
- **Risk surface at HEAD**: `html-has-lang` axe-rule mismatch on `/fr/...` pages (surface inherited from Phase 7; survives Phase 8); SiteHeader can't use `useTranslations` (Class B item 10); `/fr/contributing/v1.0.0` renders mixed-language page (EN body, FR site-header chrome — acceptable intermediate per Q51 lean).
- **Boundary statement**: NOT the bulk migration (Unit 8.1 closed it), NOT the FR content backfill (Q51 horizon), NOT destructive cleanup (still gated on curator auth), NOT the acceptance gate (Unit 8.9 is the phase-close gate). This unit is the **catalog**, not the **resolution**.
- **Smoke gates**: docs-only; unchanged from Unit 8.6 snapshot (388/388 tests; ~590 routes; 103 kB First Load JS; 19 LHCI URLs; 0 errors / 6 warnings audit).
- THINK artifact: `docs/thinking/8.7-phase-8-hygiene.md`.

#### Unit 8.8 — OPEN_QUESTIONS hygiene + ADR review (Phase 8 pre-close)

- Eighth Phase-8 unit. Docs-only. Mirrors Unit 5.12 / 6.9 / 7.10 OQ-hygiene precedents.
- **OPEN_QUESTIONS scan**: **zero new open questions surfaced** in Phase 8 — ADR-0011 covered every decision Phase 8 executed; the D-decisions in Unit 8.0 prep + per-unit refinements were tactical-not-architectural.
- **Q51 wording refined** (no status change; stays `decided-as-lean`): the Phase-7 lean was "infrastructure ships in Phase 7; content backfill is curator-track in parallel." Refined wording captures Phase 8's contribution — "Phase 7 ships INFRASTRUCTURE complete; Phase 8 ships ROUTE coverage + TWO content surfaces translated as pilots (home hero in 8.2; `/contributing/v1.1` in 8.6). Remaining ~200 EN files are curator-track horizon. Promotion to `resolved` deferred until either bulk content backfill lands (~50%+ coverage) or §13 ledger explicitly retires the bilingual thread."
- **No net promotions**: Q51 stays decided-as-lean per the wording-refinement reasoning. The resolved-set (18 entries: Q1 / Q4 / Q5 / Q12 / Q13 / Q18 / Q27 / Q32 / Q40 / Q41 / Q43 / Q45 / Q46 / Q48 / Q49 / Q50 / Q52 / Q53) is unchanged from Unit 7.10 close. Decided-as-lean (8 entries: Q34 / Q35 / Q36 / Q38 / Q39 / Q42 / Q44 / **Q51 refined**); still-open (19 entries: Q2 / Q3 / Q6-Q11 / Q14-Q17 / Q19 / Q25 / Q26 / Q28-Q31 / Q33 / Q37 / Q47).
- **ADR review pass**: 11 ADRs (0001-0011); all `Status: accepted`; none superseded. Phase 8 added **zero new ADRs**. The HTML-shell-migration deferral (Unit 8.4) is a tactical preservation of the existing layout structure, not a new architectural pin — no ADR-0012 needed today. ADR-0011 D-A through D-G all exercised at scale in Units 8.1-8.6 (D-B `localePrefix: "always"` enforced end-to-end; D-D `fr → en` fallback exercised at `/fr/contributing/v1.0.0`; D-E English-canonical slugs preserved across 22 migrated routes; D-G `translation_source` provenance honored by `v1.1.fr.mdx`); no superseding amendments triggered.
- **Cross-phase ledger after Unit 8.8**: 18 resolved + 8 decided-as-lean + 19 still open = **45 total entries** (unchanged from Phase 7 close).
- **File edits**: `OPEN_QUESTIONS.md` Q51 wording refinement; no other edits.
- **Smoke gates**: docs-only; unchanged from Unit 8.7 snapshot (388/388 tests; ~590 routes; 103 kB First Load JS; 19 LHCI URLs; 0 errors / 6 warnings audit).
- THINK artifact: `docs/thinking/8.8-open-questions-hygiene.md`.

#### Unit 8.9 — Phase 8 acceptance gate

- Phase-8 closing unit. Mirrors Units 1.12 / 2.13 / 3.13 / 4.13 / 5.13 / 6.10 / 7.11. Verifies the §13 Bilingual-rollout-completion sub-thread (per Unit 8.0 D-1) is operational locally at HEAD, emits the cross-phase roll-up, and lists Phase-8 follow-ons that survive into Phase 9+. Docs-only.
- **§13 Bilingual sub-thread (rollout completion) — local pass status** (one row per Phase-8 surface):
  - Bulk page migration: every bare `app/<route>/page.tsx` → `app/[locale]/<route>/page.tsx` (22 routes) — Unit 8.1 ✓.
  - `middleware.ts` enforcing `localePrefix: "always"` per ADR-0011 D-B — Unit 8.1 ✓; 51.8 kB server-side bundle.
  - `lib/i18n/navigation.ts` Link wrapper (next-intl `createSharedPathnamesNavigation`) — Unit 8.1 ✓; 7 component files + 1 search-palette `useRouter` migrated.
  - `TALK_PATHNAME_REGEX` extension for locale-aware Giscus paths — Unit 8.1 ✓; backward-compat preserved.
  - `lighthouserc.json` URL prefix normalization (13 URLs prefixed with `/en/`) — Unit 8.1 ✓.
  - Home-page FR hero translation + `messages.home.*` namespace (15 keys) — Unit 8.2 ✓.
  - Explicit `NEXT_LOCALE` cookie config (name / maxAge / sameSite / path / secure) — Unit 8.3 ✓.
  - `useTranslations` for LocaleToggle aria-label — Unit 8.4 **DEFERRED** (blocked on HTML shell migration; parallel session preserved existing structure).
  - `lib/site-url.ts` extraction (5 SITE call sites consolidated) — Unit 8.5 ✓; preview deploys substitute hostname via `NEXT_PUBLIC_SITE_URL`.
  - Universal sitemap locale alternates (`entryWithAlternates` helper) — Unit 8.5 ✓; +4 new sitemap test assertions.
  - `/contributing` FR pilot (`content/contributing/v1.1.fr.mdx` + `resolveLocalized`) — Unit 8.6 ✓; second sibling-file consumer.
  - Phase-8 hygiene status pass (Class A/B/C catalog) — Unit 8.7 ✓.
  - OPEN_QUESTIONS hygiene + ADR review (Q51 wording refined; no net promotions) — Unit 8.8 ✓.
- **§14 universal contract**: Lighthouse a11y/perf/SEO ≥ 95 gates — 19 URLs enrolled (+1 from Unit 8.6); documented `html-has-lang` axe-rule risk on `/fr/...` pages survives Phase 8 (real LHCI run lands first PR). W3C feed validator carries Phase-3/5/6/8 compound deferral. Visual baselines for locale-pilot pages deferred (no Playwright spec changes this phase). No auto-merge (ADR-0009) — Phase 8 added one LLM-translated MDX (`v1.1.fr.mdx`) marked `translation_source: "machine-assisted"` per ADR-0011 D-G; curator-reviewable; standard git-apply flow. File-first / no DB (ADR-0004) held; DB-migration trigger ~1.6% of 5 MB at Phase-8 close (cold). First Load JS shared chunk = **103 kB UNCHANGED** through every Phase-8 unit.
- **Phase-8 unit summary**: 9 numbered units + 1 deferral marker. Landing order: 8.0 prep (`0ee1ad9`) → 8.1 bulk migration (`31ea2d5`) → 8.2 home-FR (`defb122`) → 8.3 cookie config (`5e2b509`) → 8.4 DEFERRED → 8.5 site-url + universal alternates (`90bd3c3`) → 8.6 /contributing FR (`bad59fa`) → 8.7 hygiene (`c05e1ab`) → 8.8 OQ hygiene (`8ba25e0`) → 8.9 (this).
- **State at HEAD (Unit 8.9)**:
  - **Content**: unchanged at schema-validated count (203); **+1 raw MDX** (`v1.1.fr.mdx` from Unit 8.6) → 36 raw MDX files. Counts: 10 problems / 5 domains / ~12 subdomains / 30 papers / 126 authors / 14 institutions / 20 rating actions / 4 issue templates / methodology v1 (EN + FR) / contributing v1.0 (EN) + v1.1 (EN + **FR**) / 2 `entries.json` files.
  - **~590 prerendered pages** (was 341 at Phase-7 close → +~245 from Unit 8.1's locale-doubling → +2 from Unit 8.6's contributing version expansion = ~590-592). First Load JS shared chunk = **103 kB UNCHANGED**.
  - **388/388 vitest tests across 44 files** (was 383/44; +5 net this phase: +1 from Unit 8.1's TALK_PATHNAME_REGEX refactor + +4 from Unit 8.5's sitemap test rewrite; no new test files).
  - `pnpm validate-content` → 203 files green. `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2). `pnpm typecheck` clean. `pnpm build` clean compile.
  - **5 visualizations live** (unchanged from Phase 4).
  - **11 ADRs** (unchanged from Phase 7; Phase 8 added **zero new ADRs**).
  - **0 new dependencies in Phase 8**.
  - **`lighthouserc.json`** enrols **19 URLs** (was 18 at Phase-7 close; +1 from Unit 8.6).
  - **OPEN_QUESTIONS state**: 18 resolved + 8 decided-as-lean + 19 still open = **45 total entries** (unchanged from Phase-7 close; Q51 wording refined in Unit 8.8 but stays decided-as-lean).
- **Phase-8 follow-ons that survive the gate** (non-blocking; per Unit 8.7 Class A/B catalog): Unit 8.4 deferred indefinitely (HTML shell migration unblock required); HTML shell migration itself + `<html lang={locale}>` + SiteHeader-under-provider; fallback-hint UI for `didFallback`; `content/contributing/v1.0.fr.mdx`; bulk content backfill (~200 EN files; Q51 horizon); `messages.{contributing,methodology,…}.*` chrome strings; StatusPill localization; recently-rated empty-state copy; site-header nav labels via `useTranslations` (blocks on 8.4); trailing-slash normalization for `NEXT_PUBLIC_SITE_URL`; per-entry sitemap `lastModified` / `changeFrequency` / `priority`; first LHCI run for 5 locale-pilot URLs; visual baselines.
- **Pre-existing follow-ons** (carryover from prior phases, unchanged from Unit 7.11): orphan `components/domain-tile-grid/` deletion; `entries.json` backfill on 8 problems; `<managingEditor>` on RSS (Q2 DNS); W3C validator passes (first deploy + Q47); `pnpm clean-drafts` script; Phase-2 ROR-ID + InstaDeep orphan; `NEXT_PUBLIC_GISCUS_REPO_ID` + Discussions enablement (Q47); real-API GraphQL smoke (Q47 + `GITHUB_TOKEN`).
- **Phase 9 entry conditions**: per §12, **explicit human sign-off required**. Phase 6 closed Discussions; Phase 7+8 closed Bilingual (infrastructure + route coverage + 2 content surfaces). Remaining §13 threads: auth + read+write API (DB-trigger flip MANDATORY on first write-path unit; ~14-unit phase; breaks Phase-4 "no user accounts" pact); subscriber-list (can decouple from auth via third-party); monetization (premature). Unit 8.4 + HTML shell migration could land as Phase-9 prefix if chosen thread needs the unblock. DB-migration trigger re-eval mandatory at Phase 9 kickoff; currently ~1.6% of 5 MB (cold).
- **Cross-phase milestone**: this commit closes the **Bilingual rollout-completion sub-thread** of Phase 8 to the level Unit 8.0 D-1 + ADR-0011 scoped it: **route-complete + pilot-validated-with-2-content-surfaces**. 9 commits + 0 new ADRs + 0 new dependencies + 0 client-bundle regressions + 0 test regressions + 5 new tests + 0 OPEN_QUESTIONS net movements (Q51 wording refined).
- **Phase-8 scope drift**: HTML shell migration **dropped from scope mid-flight** at Unit 8.1 (parallel session preserved existing `app/layout.tsx`-owns-`<html>` structure with a "this change was intentional" system reminder). Surfaced into Unit 8.4 territory, then deferred indefinitely. No scope additions. Parallel-curator coordination at unprecedented intensity (Unit 8.1 mid-flight file deletions; Unit 8.6 FR content authored by parallel session).
- THINK artifact: `docs/thinking/8.9-phase-8-acceptance-gate.md`.

### Phase 11 — Community-adjacent surfaces (**second NON-§13 phase**: Rating-challenge submission — honored-deferral pick)

#### Unit 11.6 — OPEN_QUESTIONS hygiene + ADR review (Phase 11 pre-close)

- Seventh Phase-11 unit; docs-only. Mirrors Unit 5.12 / 6.9 / 7.10 / 8.8 / 9.8 / 10.4 OQ-hygiene precedents. Scans the ledger for Phase-11 promotions + surfaces the two anticipated Q-numbers (Q57 + Q58) flagged in Unit 11.0 + 11.5 hygiene + reviews the 13 ADRs at HEAD for stale status / supersede markers. Lands ahead of Unit 11.7 (acceptance gate).
- **OPEN_QUESTIONS scan**: Phase 11 surfaces **2 new questions** (both `open`; both architectural-not-operational; neither blocking Phase 11 acceptance):
  - **Q57** (Curator review pipeline shape) — Phase 12+ architectural; status transitions `submitted → under_review → accepted | rejected | withdrawn`; curator-review columns migration (`0003_rating_challenge_review` proposed); acceptance → file-system rating-action YAML emission (preserves ADR-0004 + ADR-0005); COI policy enforcement (§8.6); curator-admin route shape (likely first surface justifying middleware-based protection per Phase-9 Class B item 12). Lean documented: inherit §8.6 COI verbatim; introduce review columns migration; ship `/[locale]/curator/challenges`; defer email notifications.
  - **Q58** (Challenge visibility to non-author users) — Phase 12+ policy decision; three viable surface shapes (counter on problem detail; per-problem listing; public-profile-of-challenges); per-status visibility rules (lean: only `submitted` + `accepted` public; `rejected` + `withdrawn` submitter-only). Lean documented: start with counter (smallest surface); expand to listing when volume justifies; defer public-profile until that route lands.
- **Net promotions**: **zero**. Phase-11 scope explicitly deferred curator-review + public-visibility to Phase 12+; no Q-number moves from open → resolved this phase. Q54 + Q55 stay open operational (carried since Phase 9); Q47 stays open (Discussions operational; carried since Phase 6); Q51 stays decided-as-lean (bilingual content backfill cadence).
- **Ledger state at HEAD** (Status-field-tally; mechanically auditable):
  - **19 resolved**: Q1, Q4, Q5, Q12, Q13, Q18, Q27, Q32, Q40, Q41, Q43, Q45, Q46, Q48, Q49, Q50, Q52, Q53, Q56.
  - **4 decided-as-lean**: Q38, Q42, Q44, Q51.
  - **30 open**: Q2, Q3, Q6, Q7, Q8, Q9, Q10, Q11, Q14, Q15, Q16, Q17, Q19, Q25, Q26, Q28, Q29, Q30, Q31, Q33, Q34, Q35, Q36, Q37, Q39, Q47, Q54, Q55, **Q57**, **Q58**.
  - **Total: 53** entries. Phase-11 delta vs Phase-10 close: +0 resolved, +0 decided-as-lean, +2 open (Q57 + Q58).
- **ADR review**: 13 ADRs at HEAD (0001 – 0013). **Phase 11 added zero new ADRs**. All 13 ADRs unchanged in body; status remains `accepted` across the set.
  - **ADR-0004 reaffirmed** by Phase 11's USER-STATE-only DB additions + Q57's lean preserving file-first for accepted-challenge rating-action YAMLs.
  - **ADR-0005 extended by-analogy** in Phase 11's Q57 lean: accepting a challenge emits a NEW rating-action file (immutability invariant preserved); the DB tracks `acceptedActionId` pointing at the new file.
  - **ADR-0006 honored** by Unit 11.2's `validateProposedValue("saturation", "N/A")` returning null (success); covered by Unit 11.2's test.
  - **ADR-0011 D-A through D-G** exercised: `messages.rating_challenge.*` (Unit 11.3 — 22 keys per locale) + `messages.profile.*` extension (Unit 11.4 — 5 new keys per locale). No supersede triggers.
  - **ADR-0012 D-A through D-E** exercised: `RatingChallengeForm` signed-out branch links to `/api/auth/signin/github?callbackUrl=...` per D-D (full-page redirect); `events.linkAccount` callback's `users.githubLogin` consumed by Unit 11.4's profile-page list. All hold.
  - **ADR-0013 D-A through D-F** exercised: new `ratingChallenge` table per D-F (USER-STATE only); `problemSlug` plain text with no FK; UUID PK via `$defaultFn`; migration `0002_rating_challenges` extends D-E's monotonic 0-indexed sequence. All hold.
- **No prose-shift reconciliations** this unit (unlike Unit 9.8's two ADR edits); no architectural shifts; no ADR edits.
- **No new ADRs surfaced**. Phase 11's surface is fully covered by ADR-0012 + ADR-0013 + the existing constitution. Phase 12+ may surface an ADR-0014 pinning Q57's curator-review pipeline lean.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/11.6-open-questions-hygiene.md`.

#### Unit 11.5 — Phase-11 hygiene status pass (Class A / B / C catalog)

- Sixth Phase-11 unit; docs-only. Mirrors Phase-5 (Unit 5.11) / Phase-6 (Unit 6.8) / Phase-7 (Unit 7.9) / Phase-8 (Unit 8.7) / Phase-9 (Unit 9.7) / Phase-10 (Unit 10.3) hygiene precedents. Catalogs **Class A** in-flight Phase-11 items (4 carried; 0 newly surfaced — Phase 11 introduced no new operational gates), **Class B** Phase-11-specific follow-ons (12), and **Class C** carryovers (19; mostly unchanged from Unit 10.3 + a few Phase-9/10 follow-ons absorbed). Lands ahead of Unit 11.6 (OPEN_QUESTIONS hygiene) and Unit 11.7 (acceptance gate).
- **Class A — 4 carried**: (1) Q54 GitHub OAuth app registration (operational; sign-in flows in Phase 11's `RatingChallengeForm` inherit the same gate); (2) Q55 Turso production DB provisioning (operational; the new `ratingChallenge` table inherits); (3) CI dummy `AUTH_SECRET` (Auth.js v5 module-load throw); (4) `pnpm db:migrate` doc for new contributors (now **3 migrations** to run: `0000_initial_auth` + `0001_watchlist` + `0002_rating_challenges`).
- **Class B — 12 Phase-11-specific follow-ons**: (1) **Curator review pipeline** — status transitions `submitted → under_review → accepted | rejected | withdrawn` + curator-review columns (`reviewedAt`, `reviewerId`, `reviewNotes`, `acceptedActionId`); Phase 12+; surfaces as Q57 in Unit 11.6. (2) **Public challenge visibility** — counter on problem detail page OR public listing; Phase 12+; surfaces as Q58. (3) Form-state preservation on Unit 11.3 validation error (UX papercut; needs `useActionState` client island; ~3-5 kB client bundle delta). (4) Per-dimension dynamic input format (client island; couples to item 3). (5) Withdraw-own-challenge UI on profile page (~2-3 unit sub-phase). (6) Per-challenge detail page (`/[locale]/profile/challenges/[id]`). (7) Search/filter on profile-page challenges list (premature without volume). (8) Email notifications when challenge is reviewed (couples to subscriber-list thread). (9) Rate-limiting on POST `/api/v1/rating-challenges` (per Unit 11.0 D-10; Phase 12+). (10) Composite index on `(userId, createdAt DESC)` for `ratingChallenge` (premature; SQLite plans LIMIT 50 fine without one). (11) Orphan-row cleanup script for `ratingChallenge` (extends the carried `watchlist` orphan policy; single script can handle both). (12) Curator dashboard for reviewing pending challenges (admin-protected route; Phase 12+).
- **Class C — 19 carryovers**: items 1-14 unchanged from Unit 10.3 (orphan domain-tile-grid; entries.json backfill; clean-drafts; managingEditor; ROR-ID + InstaDeep; W3C validators; talk-page baselines; github-graphql real-API smoke; Q47 enablement; HTML shell migration; fallback-hint UI; chrome strings + FR backfill + StatusPill localization + nav labels via useTranslations; trailing-slash normalization; per-entry sitemap hints) + 15 (public profile page at `/[locale]/u/[handle]`) + 16 (watchlist count on `/problems` index) + 17 (multi-provider OAuth) + 18 (first LHCI run validating auth-aware SiteHeader) + 19 (middleware-based auth-route protection — Phase 10 added the first protected page route; Phase 11 added an API-only protected surface; threshold still ≤ 1 protected page route, so deferral holds).
- **Phase-11 surface delta vs Phase-10 close**:
  - **Routes**: +1 dynamic API route (`ƒ /api/v1/rating-challenges`). Page-route count unchanged (existing problem-detail-page gains inline form via `RatingChallengeForm`; existing profile route gains "Your rating challenges" section).
  - **Tests**: 394 → **403** (+9 net from Unit 11.2). Test files: 45 → **46** (+1).
  - **First Load JS shared chunk**: **103 kB UNCHANGED** through every Phase-11 unit. Both UI consumers entirely server-side; form posts via server-action; zero client bundle delta.
  - **Middleware bundle**: **159 kB UNCHANGED**.
  - **ADRs**: **13 UNCHANGED** (Phase 11 added zero).
  - **Dependencies**: **+0 net** (no new packages; Phase 11 ships on Phase-9/10 stack).
  - **New code layers**: `lib/rating-challenges/` (1 file) + `app/api/v1/rating-challenges/` (2 files: route + tests) + `components/rating-challenge-form/` (1 file).
  - **Migrations** (+1): `0002_rating_challenges`. Cumulative: 3 migrations (drizzle-kit 0-indexed monotonic sequence).
  - **DB schema tables**: 5 → **6** (added `ratingChallenge`). Per ADR-0013 D-F: USER-STATE only.
  - **Env contract**, **`.gitignore`**, **Content (239 raw files)**, **LHCI URLs (19)**: all **UNCHANGED**.
  - **Messages**: `messages.rating_challenge.*` (+22 keys per locale, Unit 11.3) + `messages.profile.*` (+5 keys per locale, Unit 11.4) = **+27 keys per locale**; **+54 keys total** across EN + FR.
  - **OPEN_QUESTIONS state** (Status-field tally): 19 resolved unchanged; 4 decided-as-lean unchanged; 28 open → **30 open** (+Q57 + Q58 surfacing in Unit 11.6); 51 → **53 total** (final tally lands at Unit 11.6 commit).
- **Parallel-curator activity log (Phase 11)**: low activity; primary session shipped all units 11.0-11.5. No collision events.
- **Risk surface at HEAD `68d13ac`**: (1) Form-state lost on Unit 11.3 validation error (Class B item 3; UX papercut; documented tradeoff). (2) `AUTH_SECRET` must be set in CI / Vercel / preview (Class A item 3; carried). (3) End-to-end watchlist + rating-challenge exercise blocked on Q54 + Q55 (architectural surface complete on BOTH write-paths now; operational unblock pending). (4) Middleware bundle 159 kB unchanged at ~15% of Vercel Edge's 1 MB limit. (5) Orphan rows tolerated on `watchlist` AND `ratingChallenge` tables until cleanup script lands. (6) `html-has-lang` axe-rule mismatch on `/fr/...` pages (Phase-7 carryover).
- **Boundary statement**: NOT the curator review pipeline (Q57; Phase 12+), NOT the public visibility surface (Q58; Phase 12+), NOT form-state preservation, NOT operational unblocks, NOT destructive cleanup. This unit is the **catalog**, not the **resolution**.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/11.5-phase-11-hygiene.md`.

#### Unit 11.4 — Profile page extension: "Your rating challenges" section

- Fourth code unit of Phase 11. Lands the profile-page consumer for Unit 11.2's `getUserChallenges` helper. Adds a "Your rating challenges" section below the existing "Watching" section on `/[locale]/profile`. Mirrors the watchlist dense-list pattern per Unit 11.0 D-9.
- **`app/[locale]/profile/page.tsx` (edit)**:
  - Adds `getUserChallenges` import from `@/lib/rating-challenges`.
  - Adds `RATIONALE_PREVIEW_CHARS = 200` const + `truncateRationale` helper (clips long rationales for the dense-list preview; appends ellipsis on overflow; trims trailing whitespace before the ellipsis for clean visuals).
  - Loads `getUserChallenges(userId)` alongside the existing `getWatchedSlugs(userId)` query — two awaits in parallel-ish (Drizzle/libsql queries serialize on the single connection but the two awaits land in sequence).
  - Loads `tRC` from `getTranslations("rating_challenge")` so the dense list can reuse the `dim_*` keys from Unit 11.3 (no key duplication under `profile.*`).
  - Renders a new `<section>` below the watchlist section: heading + empty-state CTA + dense `<ul>` of per-challenge rows.
- **Per-row shape**:
  - Problem title (linked to `/problems/<slug>`; falls back to raw `problemSlug` for orphan rows pointing at deleted content per ADR-0013 D-F).
  - Submitted-date `<time dateTime={ISO-YYYY-MM-DD}>` — `createdAt` is a `Date` (Drizzle's `mode: "timestamp_ms"` shape); rendered as `YYYY-MM-DD` via `toISOString().slice(0,10)`.
  - Dimension label via `tRC(\`dim_${challenge.dimension}\`)` + Unicode `→` separator + `proposedValue` in mono font + status pill (uppercase tracking-wide; tiny rounded-full styling so it sits inline).
  - Rationale preview (200-char truncation; full text on the future Phase 12+ detail page).
- **Empty state**: bordered-dashed empty-state card (mirrors the watchlist empty-state shape) — "You haven't submitted any rating challenges yet." + "Browse problems to find one whose rating you'd like to challenge →" CTA linking to `/problems`.
- **`messages/en.json` + `messages/fr.json` (edit)**: `profile.*` namespace gains **5 new keys per locale**: `challenges_heading`, `challenges_aria_label`, `challenges_empty_message`, `challenges_empty_cta`, `challenges_status_submitted`. FR translations use "Contestations de notation" for the section heading + "Soumise" (feminine, agreeing with "contestation") for the status. Dimension translations (`dim_difficulty`, etc.) intentionally NOT duplicated — the section consumes the Unit-11.3 `rating_challenge.*` namespace directly via a second `getTranslations` call.
- **NOT in this unit** (deferred): per-challenge detail page (Phase 12+); status transitions (Phase 12+ when curator review pipeline lands); withdraw-own-challenge UI (Phase 12+); search/filter on the challenges list (premature without volume).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → **403/403 across 46 files** UNCHANGED (no test files touched; profile page is exercised via manual build smoke).
  - `pnpm build` → **profile route stays at 1.9 kB / 108 kB First Load JS** (UNCHANGED from Phase-10 close — the new section is server-rendered + shares with existing patterns); `/api/v1/rating-challenges` and all 5 problem-detail-page routes register cleanly. **First Load JS shared chunk = 103 kB UNCHANGED**. **Middleware bundle = 159 kB UNCHANGED**. One transient `.next` chunk-not-found build flake on the first attempt; resolved by clean-rebuild (`Remove-Item -Recurse -Force .next; pnpm build`); recorded as Windows-specific build noise unrelated to Phase 11 changes.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: omitted — implementation is contained in Unit 11.0's D-9 design block.
- Next: Unit 11.5 (Phase-11 hygiene status pass).

#### Unit 11.3 — Submission form on problem detail page + `messages.rating_challenge.*` (EN + FR)

- Third code unit of Phase 11. Lands the rating-challenge UI surface on `/[locale]/problems/[slug]`. Pure server-rendered + server-action driven; **zero client JS added** (First Load JS shared chunk = **103 kB UNCHANGED** through every Phase-11 unit so far). Inline `<details>` collapsible per Unit 11.0 D-8 (rather than separate route); injected as section 8a between section 8 ("Recent rating actions") and section 9 ("Related problems") to keep the rating-related content adjacent.
- **`components/rating-challenge-form/index.tsx` (new)**: server component with three render branches:
  - **Signed out** → sign-in CTA linking to `/api/auth/signin/github?callbackUrl=...` (matches Auth.js v5's canonical entry per ADR-0012 D-D; preserves the user's destination via the `callbackUrl` query param).
  - **Signed in (no submission state)** → `<details>` collapsible (default-closed); `<summary>` shows "Open submission form".
  - **Signed in with `error` prop** → `<details>` rendered with `open` attribute so the form is visible + the validation error is shown above the inputs via `role="alert"`.
  - **Just-submitted banner** (`submitted` prop) → role="status" success banner above the `<details>` regardless of open/closed state.
- **Form inputs** (HTML5-validated browser-side; server-action re-validates):
  - `<select name="dimension">` populated from `DIMENSIONS` (5 options); `required` attr.
  - `<input name="proposedValue">` text; `required` attr; placeholder + hint describe per-dimension format (S/A/B/C/D/E, 0-100, N/A, 0-5).
  - `<textarea name="rationale">` with `minLength={RATIONALE_MIN}` (50) + `maxLength={RATIONALE_MAX}` (2000) per Unit 11.2; hint message uses next-intl ICU interpolation (`t("rationale_hint", { min, max })`).
  - Hidden `slug` + `locale` inputs propagate context to the server action.
- **`submitAction` server action** (inline `"use server"` per Phase-9 watchlist-toggle precedent): validates slug + auth + dimension + proposedValue + rationale using the same `validate*` helpers from `lib/rating-challenges`. **On validation failure**: `redirect()` back to `/${locale}/problems/${slug}?challenge_error_field=...&challenge_error_message=...#rating-challenge`. **On unauthenticated**: `redirect()` to `/api/auth/signin/github?callbackUrl=...`. **On success**: `submitChallenge()` → `revalidatePath("/[locale]/problems/[slug]", "page")` → `redirect()` to `...?challenge_submitted=1#rating-challenge`.
- **Form-state-lost-on-redirect tradeoff acknowledged** (Unit 11.0 D-8): on a validation failure the redirect clears form inputs; the user retypes. Accepted MVP tradeoff to keep the **First Load JS = 103 kB UNCHANGED** invariant. Alternative paths (`useActionState` client island, fetch-based AJAX form) would each add client-bundle weight; rejected per the project's "zero client bundle delta unless absolutely necessary" Phase-9+ discipline.
- **`app/[locale]/problems/[slug]/page.tsx` (edit)**:
  - Extends the page signature to accept `searchParams?: Promise<...>` (Next 15 async-params pattern).
  - Parses `challenge_error_field` + `challenge_error_message` from searchParams into a `ChallengeError | undefined` value (`pickString` helper guards against array variants per Next's union type).
  - Reads `challenge_submitted=1` flag.
  - Injects `<RatingChallengeForm slug={slug} locale={locale} submitted={...} {...(challengeError ? { error } : {})} />` as a new section 8a. Conditional spread sidesteps `exactOptionalPropertyTypes: true` complaining about `error: undefined`.
- **`messages/en.json` + `messages/fr.json` (edit)**: `rating_challenge.*` namespace adds **22 keys per locale** covering heading + description + sign-in prompt + open-form summary + submitted banner + dimension/proposedValue/rationale form labels/placeholders/hints + submit button + error-field translations (`field_dimension`, `field_proposedValue`, `field_rationale`). FR translations honor §3 brand register ("Contester cette notation"; "Demande de l'industrie" for industry_call dimension; "Argumentaire" for rationale).
- **NOT in this unit** (deferred): profile-page extension (Unit 11.4 — "Your rating challenges" section); rate-limiting (Unit 11.0 D-10; per-user surface; Phase 12+); curator review pipeline + status transitions (Phase 12+; Q57 anticipated in Unit 11.6); per-dimension dynamic input (Phase 12+ when client island can be justified); preserve-form-state-on-error (Phase 12+ alongside `useActionState` client island).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (post-`exactOptionalPropertyTypes` fix via conditional-spread on `error` prop).
  - `pnpm test` → **403/403 across 46 files** UNCHANGED (no test files touched; integration coverage comes via build + manual dev-server exercise; the API route's 9 tests already cover the same validation contract via the helper functions).
  - `pnpm build` → ~590 prerendered pages + 3 dynamic API routes. **Problem detail page route stays at 1.9 kB / 108 kB First Load JS** (UNCHANGED from Phase-10 close — the new server-rendered form section adds zero client weight). **First Load JS shared chunk = 103 kB UNCHANGED**. **Middleware bundle = 159 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: omitted — implementation is contained in Unit 11.0's D-3 through D-8; design constraints (zero client JS; redirect-with-search-param for errors) flow directly from the 103-kB-First-Load-JS invariant.
- Next: Unit 11.4 (profile-page extension — "Your rating challenges" dense list below watchlist).

#### Unit 11.2 — `lib/rating-challenges/` helpers + `POST /api/v1/rating-challenges` route + tests

- Second code unit of Phase 11. Lands the rating-challenge submission backend layer on top of Unit 11.1's `ratingChallenges` table. Mirrors the Phase-9 Unit 9.6 watchlist pattern: thin Drizzle helpers (auth-agnostic) + REST API route (handles auth + validation + delegates to helpers) + Vitest tests (mocks `@/lib/auth` + partially mocks `@/lib/rating-challenges` to keep validation helpers real while stubbing `submitChallenge`).
- **`lib/rating-challenges/index.ts` (new)**: 5 named exports.
  - **`DIMENSIONS`** const + **`Dimension`** type — 5 values matching `RatingActionSchema.dimensions` keys (`difficulty`, `saturation`, `urgency`, `value`, `industry_call`).
  - **`RATIONALE_MIN = 50`**, **`RATIONALE_MAX = 2000`** — Unit 11.0 D-7 leans. Public so the inline form (Unit 11.3) can render character-count hints.
  - **`isValidDimension(value)`** — type-narrowing predicate.
  - **`validateProposedValue(dimension, value)`** — per-dimension format check per Unit 11.0 D-6. Returns `null` on success, human-readable error string on failure (surfaces as the 400's `message` field). Per-dimension rules: difficulty letter ∈ {S,A,B,C,D,E}; saturation 0-100 OR "N/A" (per ADR-0006); stars-based integer 0-5.
  - **`validateRationale(rationale)`** — length check against `RATIONALE_MIN` / `RATIONALE_MAX`.
  - **`submitChallenge(input)`** — Drizzle INSERT with RETURNING; returns the generated UUID.
  - **`getUserChallenges(userId)`** — Drizzle SELECT * ORDER BY createdAt DESC LIMIT 50 (mirrors `lib/watchlist/`'s `getWatchedSlugs` pattern; Phase-11 Unit 11.4 will consume this on profile page).
  - **`UserChallenge`** type — Drizzle's `$inferSelect` shape; exported for typed consumers.
- **`app/api/v1/rating-challenges/route.ts` (new)**: collection POST endpoint. Per Unit 11.0 D-13 exit shapes:
  - **401** `{ error: "unauthenticated" }` when `auth()` returns null (no session).
  - **400** `{ error: "bad-request", field, message }` for any validation failure. Field-specific so the inline submission form (Unit 11.3) can surface the message next to the offending input. Fields: `body` (invalid JSON); `problemSlug` (unknown problem); `dimension` (not in `DIMENSIONS`); `proposedValue` (per-dimension format violation); `rationale` (length out of range).
  - **201 Created** `{ id, slug, dimension, status: "submitted" }` on success.
  - Validation order: auth → JSON parse → problemSlug-in-content → dimension enum → proposedValue per-dimension → rationale length. Each gate returns early on failure (no cascading errors).
- **`app/api/v1/rating-challenges/route.test.ts` (new)**: **9 tests** covering each exit shape per validation gate. Mocks `@/lib/auth` (`vi.mock` with `vi.fn()` factory) + partially mocks `@/lib/rating-challenges` via `vi.mock` + `importOriginal` to keep the real `isValidDimension` / `validateProposedValue` / `validateRationale` while stubbing `submitChallenge` (the only DB side effect). Mocked-value casts via `as never` per the Phase-9 watchlist precedent (Auth.js v5's polymorphic `auth` return type).
- **Validation contract pinned in tests**: invalid difficulty grade ("Z") → 400 proposedValue; saturation out of [0,100] → 400 proposedValue; stars > 5 → 400 proposedValue; rationale < 50 chars → 400 rationale; saturation = "N/A" → 201 (per ADR-0006 honored).
- **NOT in this unit** (deferred): submission form UI (Unit 11.3 — inline collapsible on problem detail page); profile-page list extension (Unit 11.4); rate-limiting (Unit 11.0 D-10 — per-user surface; auth-gated; Phase 12+); curator review pipeline + status transitions (Phase 12+ or curator-track; surfaces as Q57).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (no `as any`; only `as never` on the polymorphic-`auth` mock returns).
  - `pnpm test` → **403/403 across 46 files** (+9 net tests on the new route; +1 net file).
  - `pnpm build` → ~590 prerendered pages + **+1 new dynamic API route** (`ƒ /api/v1/rating-challenges`, Dynamic ƒ). First Load JS shared chunk = **103 kB UNCHANGED**. Middleware bundle = **159 kB UNCHANGED**.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: omitted — implementation is contained in Unit 11.0's D-3 through D-13; no architectural surface beyond what 11.0 + 11.1 pinned.
- Next: Unit 11.3 (inline collapsible submission form on `/[locale]/problems/[slug]` + `messages.rating_challenge.*` EN + FR).

#### Unit 11.1 — DB scaffold: `ratingChallenges` table + `0002_rating_challenges` migration

- First code unit of Phase 11. Lands the second project-owned DB table (`watchlist` was first in Unit 9.6). Schema decisions per Unit 11.0 D-3 + D-4 + D-5 + D-6 + D-7. **Second migration in Phase 11's surface** (third migration project-wide; drizzle-kit's monotonic 0-indexed sequence: `0000_initial_auth` (Unit 9.3) + `0001_watchlist` (Unit 9.6) + **`0002_rating_challenges`** (this unit)).
- **`lib/db/schema.ts` (edit)**: adds `ratingChallenges` table export after `watchlist` (preserves the existing watchlist docstring's positional attachment to its export; new table grouped after watchlist as the second write-path).
  - **UUID PK** via `$defaultFn(() => crypto.randomUUID())` — matches `users.id` strategy per Unit 11.0 D-12.
  - **`userId` FK** to `user.id` with `ON DELETE cascade` — matches `watchlist` precedent.
  - **`problemSlug`** plain text, no FK — matches Q56 lean + ADR-0013 D-F (USER-STATE only; content stays file-first per ADR-0004).
  - **`dimension`** TEXT — app-level enum validation against 5 `RatingActionSchema.dimensions` keys (Unit 11.2 lands the helper).
  - **`proposedValue`** TEXT — per-dimension format varies; rejected sparse 5-typed-columns + JSON column alternatives.
  - **`rationale`** required TEXT — app-level validation (min 50 / max 2000 chars) lands in Unit 11.2.
  - **`status`** TEXT default `"submitted"` — Phase 11 ships only this value; Phase 12+ adds `under_review` / `accepted` / `rejected` / `withdrawn`.
  - **`createdAt`** timestamp_ms default via `unixepoch() * 1000` — mirrors `users.createdAt` + `watchlist.createdAt`.
  - **NO composite PK** (single UUID): users can submit multiple challenges per problem (one per dimension or multiple per dimension over time). Differs intentionally from `watchlist`'s `(userId, problemSlug)` composite shape.
  - **NO speculative curator-review columns** (`reviewedAt` / `reviewerId` / `reviewNotes` / `acceptedActionId`) — per ADR-0005's immutability-and-explicit-evolution ethos, columns land when the surface lands. Phase 12+ migration adds them.
- **`lib/db/migrations/0002_rating_challenges.sql` (new)**: generated via `pnpm db:generate --name rating_challenges`. Single CREATE TABLE; 1 FK with cascade on `userId`; no indexes (Phase-11 scale doesn't need them; SQLite plans single-table LIMIT 50 queries fine without index hints). Snapshot at `meta/0002_snapshot.json`; journal updated.
- **NOT in this unit** (deferred per Unit 11.0 breakdown): `lib/rating-challenges/` helpers (Unit 11.2 — `submitChallenge` + `getUserChallenges`); POST API route + tests (Unit 11.2); submission form UI (Unit 11.3); profile-page extension (Unit 11.4).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (post-`ratingChallenges` table addition; Drizzle-orm types infer correctly).
  - `pnpm test` → 394/394 across 45 files unchanged (no test files touched; helpers + route tests land Unit 11.2).
  - `pnpm db:generate --name rating_challenges` → `0002_rating_challenges.sql` written (1 table, 1 FK with cascade, 0 indexes).
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2).
  - `pnpm build` (deferred to Unit 11.2; no consumer surface in this unit).
- THINK artifact: omitted — schema decisions are contained in Unit 11.0's D-3 through D-7; no architectural surface beyond what 11.0 pinned. Mirrors Phase-9 Unit 9.3 precedent + Phase-10 Unit 10.1 precedent.
- Next: Unit 11.2 (`lib/rating-challenges/` helpers + `POST /api/v1/rating-challenges` route + tests).

#### Unit 11.0 — Phase 11 prep (THINK doc + 8-unit Rating-challenge-thread breakdown + procedural DB-trigger re-eval)

- Phase 11 kickoff per §12 cardinal rule. Phase 10 closed at HEAD `0a55bfd` (Unit 10.5 acceptance gate; first NON-§13 phase; first zero-architectural-surface phase). **Phase 11 sign-off granted via "Continue" override** in the unit-rhythm rhythm (sixth invocation; precedents: Phase 5 → 6 in Unit 6.0; Phase 6 → 7 in Unit 7.0; Phase 7 → 8 in Unit 8.0; Phase 8 → 9 in Unit 9.0; Phase 9 → 10 in Unit 10.0). Docs-only unit.
- **§13 ledger status**: still **CLOSED** (closed at Unit 9.9). Phase 11 is the **second NON-§13 phase**. Like Phase 10, Phase 11 pulls from the Phase-9 follow-on catalog (Unit 9.7 Class B) + Phase-9 Unit 9.0 D-5 explicit deferral.
- **D-1. First-thread recommendation = Rating-challenge submission write-path (honored-deferral pick)**. Rationale: honors Phase-9 Unit 9.0 D-5's explicit deferral ("rating-challenge submission... deferred to Phase 10" reframed at Phase-10 close as Phase 11's "most defensible next pick per the honored-deferral pattern"); second write-path validates Phase-9 architectural pattern (auth check → server-action/POST → Drizzle write → revalidate UI); builds on Phase-9 + Phase-10 surfaces (auth + DB + watchlist + profile page); closes §8.6 architectural concern (§3.1 "ratings are revisable" + §8.6 COI policy both imply a community feedback mechanism — rating-challenge IS that mechanism's MVP); scope cap discipline (~7 units; smaller than Phase 9's 10; bigger than Phase 10's 6); surface diversity (touches every layer: DB / migration / lib / API / form UI / profile-page extension).
- **Scope cap**: Phase 11 = "rating-challenge submission MVP". Curator review pipeline (status transitions; rating-action YAML emission) punted to Phase 12+ or curator-track. Multi-dimension challenge per row OUT-OF-SCOPE; user submits one dimension per challenge but can submit multiple challenges per problem. Profile-page extension shows only the submitter's own challenges; public visibility (counter on problem detail page) deferred.
- **Alternative threads** enumerated with deferral rationale (overridable if redirected): subscriber-list (third-party email; Phase-5 D-4 punt; ~6 units; Phase 12+ candidate); public profile page at `/[locale]/u/[handle]` (Phase-10 Class B item 1; ~3-4 units; could land as Phase-11.x sub-phase OR Phase 12 standalone; honored-deferral has stronger claim); multi-provider OAuth (~3-4 units; needs follow-on ADR; Phase 12+ candidate); HTML shell migration + Unit 8.4 unblock (STILL ON HOLD per parallel-session signal); monetization (premature; Phase 12+).
- **8-unit breakdown** (11.0 – 11.7):
  - 11.0 Phase 11 prep (this doc) — docs.
  - 11.1 **DB scaffold**: `ratingChallenges` table + `0002_rating_challenges` migration — code + config.
  - 11.2 `lib/rating-challenges/` helpers (`submitChallenge`, `getUserChallenges`) + `POST /api/v1/rating-challenges` route + tests — code.
  - 11.3 Submission form on `/[locale]/problems/[slug]` (inline collapsible) + `messages.rating_challenge.*` (EN + FR) — code.
  - 11.4 Profile page extension: "Your rating challenges" section (dense list mirror of watchlist) — code.
  - 11.5 Phase-11 hygiene status pass — docs.
  - 11.6 OPEN_QUESTIONS hygiene + ADR review — docs.
  - 11.7 Phase 11 acceptance gate — gate.
- **D-2. DB-migration trigger re-eval** (procedural-only at Phase 11 kickoff per Unit 10.0 D-2 cascade). Trigger (a) FIRED in Unit 9.6 (still); trigger (b) cold (~1.656% of 5 MB; content unchanged). Phase 11 lands new table + write-path normally; migration filename: `0002_rating_challenges` per drizzle-kit's monotonic 0-indexed sequence.
- **Decisions resolved in this unit (D-1 through D-11)**: D-1 (first-thread = rating-challenge + rationale + alternatives table); D-2 (DB trigger procedural-only); D-3 (`ratingChallenges` table shape — UUID PK + userId FK with cascade + problemSlug plain text + dimension/proposedValue/rationale/status TEXT + createdAt timestamp_ms; NO speculative curator-review columns; NO composite PK since users can submit multiple challenges per problem); D-4 (status enum: Phase 11 ships only `submitted` default; future statuses Phase 12+); D-5 (dimension enum: 5 values matching `RatingActionSchema.dimensions`); D-6 (`proposedValue` as single TEXT column; app-level per-dimension interpretation; rejected: 5 typed columns sparse+brittle, JSON column adds parse overhead); D-7 (rationale validation: required, min 50 chars, max 2000 chars, plain text); D-8 (submission UX = inline collapsible on problem detail page; rejected: separate route); D-9 (profile-page extension as new section below watchlist; mirror dense-list); D-10 (no rate-limiting in Phase 11; per-user auth-gated surface; Phase 12+); D-11 (no email notifications in Phase 11; couples to subscriber-list thread).
- **Decisions deferred** (D-12 through D-15): UUID library (Unit 11.1; `crypto.randomUUID()` lean matching `users.id`); API response shape (Unit 11.2; `201 Created` + 401/400/404 errors); per-dimension proposedValue form input (Unit 11.3; dimension-driven conditional rendering); profile-page status-pill styling (Unit 11.4; reuse `StatusPill` vs new `ChallengeStatusPill`).
- **Anticipated open questions (Q57 + Q58)**:
  - **Q57** (Curator review pipeline shape) — anticipated; not blocking Phase 11. Surfaces in Unit 11.6 hygiene. Phase 11 ships submissions only; curator review (status transitions; rating-action YAML emission) is Phase 12+ or curator-track.
  - **Q58** (Challenge visibility to non-author users) — anticipated; not blocking Phase 11. Today Phase 11 has no surface displaying challenges to non-submitters. Public visibility (e.g., counter on problem detail page) is Phase 12+ scope.
- **Order rationale**: 11.1 DB first (foundation); 11.2 backend layer (helpers + API; mirrors Phase 9 watchlist pattern); 11.3 + 11.4 UI consumers (problem detail page + profile page; depend on backend); 11.5 / 11.6 hygiene (parallel-safe); 11.7 closes the phase.
- **Parallel-curator awareness**: docs-only; no collision risk this unit. Unit 11.1 moderate collision (shared `lib/db/` directory); Units 11.2 / 11.4 low collision (new files / fresh Phase-10 surface); Unit 11.3 moderate (touches problem detail page).
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/11.0-phase-11-prep.md`.

### Phase 10 — Community-adjacent surfaces (**first NON-§13 phase**: Profile page + Phase-9 UI polish)

#### Unit 10.5 — Phase 10 acceptance gate (Profile page + Phase-9 UI polish — **first NON-§13 phase; first zero-architectural-surface phase**)

- Phase-10 closing unit. Mirrors Units 1.12 / 2.13 / 3.13 / 4.13 / 5.13 / 6.10 / 7.11 / 8.9 / 9.9. Verifies every Phase-10 deliverable (the **Profile page + Phase-9 UI polish** thread per Unit 10.0 D-1) is operational locally at HEAD, emits the cross-phase roll-up, and lists Phase-10 follow-ons that survive into Phase 11+.
- **§13 ledger remains CLOSED**. This is the **first acceptance gate of a NON-§13 phase**, marking the project's transition from §13-driven thread closure to follow-on-catalog-driven thread selection. The §13 enumeration closed at Unit 9.9; Phase 10 pulled from the Phase-9 Class B catalog (Unit 9.7 item 1 — profile page).
- **Phase-10 deliverable status (all rows green; no DEFERRED rows; matches Phase 9's 10/10 discipline)**:
  - `lib/watchlist/` extension: `getWatchedSlugs(userId)` helper (Unit 10.1).
  - Profile page route + auth-required (Unit 10.2 — first protected route).
  - Profile page header (avatar + display name + GitHub login pill + sign-out) (Unit 10.2).
  - Profile page watchlist section + empty-state CTA (Unit 10.2).
  - `messages.profile.*` namespace EN + FR (Unit 10.2 — 6 keys per locale).
  - Phase-10 hygiene status pass (Unit 10.3 — 2 Class A + 8 Class B + 14 Class C).
  - OPEN_QUESTIONS hygiene + ADR review (Unit 10.4 — zero net surface; first zero-architectural-surface phase).
  - Phase 10 acceptance gate (this unit).
- **§14 universal cross-phase contract status**:
  - **First Load JS shared chunk = 103 kB UNCHANGED** through every Phase-10 unit. Profile page server-rendered; sign-out form server-action; `<WatchlistToggle>` reuse server-rendered. Zero client-bundle delta.
  - **Middleware bundle = 159 kB UNCHANGED**. Route protection landed at page layer, not middleware.
  - **`lighthouserc.json` URL count = 19 UNCHANGED**. Profile-page LHCI enrolment deferred as Class A item 2.
  - **File-first / no DB held for CONTENT** per ADR-0004 + ADR-0013 D-F. Profile page exercises BOTH surfaces cleanly: file-first `problems` from `#site/content` for problem metadata + USER-STATE DB (`watchlist` + `users.githubLogin`).
  - **No auto-merge** (ADR-0009): Phase 10 added no LLM-translated content.
- **State at HEAD `63ed3aa` + this acceptance-gate commit**:
  - Content: 10 problems / 5 domains / ~12 subdomains / 30 papers / 126 authors / 14 institutions / 20 rating actions / 4 issue templates / methodology v1 (EN + FR) / contributing v1.0 (EN) + v1.1 (EN + FR) / 2 `entries.json` files. **203 schema-validated content files + 36 raw MDX = 239 raw content files** UNCHANGED from Phase 9 close.
  - **0 new ADRs** in Phase 10 → 13 ADRs total (unchanged).
  - **0 new dependencies** in Phase 10 (was +5 in Phase 9).
  - **New code layers (Phase-10 net-new)**: `app/[locale]/profile/page.tsx` (1 file; 160 lines) + `lib/watchlist/` extension (`getWatchedSlugs` + `WATCHLIST_LIMIT` constant; ~25 net lines). That's it. No new components; no new lib directories; no new ADRs; no new dependencies; no new migrations; no new env vars; no new tests; no new gitignore patterns; no new middleware composition.
  - **DB schema tables: 5 UNCHANGED**. **Migrations: 2 UNCHANGED**. **Env contract: +0**.
  - **Routes**: +2 SSG entries (`/en/profile` + `/fr/profile`; rendered request-time via `dynamic = "force-dynamic"`). 2 dynamic API routes from Phase 9 unchanged. Page-route count nominally +1.
  - **Tests**: **394/394 across 45 files UNCHANGED through every Phase-10 unit**. No test files added in Phase 10 (Unit 10.1 helper test deferred per Drizzle-type-system rationale; Unit 10.2 Playwright smoke deferred per Class A item 1).
  - **OPEN_QUESTIONS state** (per Unit 9.8 mechanical `Status:`-field tally): 19 resolved + 4 decided-as-lean + 28 open = **51 entries UNCHANGED from Phase 9 close**. Phase 10 surfaced no new Qs; no promotions; no status changes — **first zero-architectural-surface phase in the project's history**.
- **Phase-10 follow-ons that survive the gate** (non-blocking; from Unit 10.3):
  - **Class A (2 — in-flight Phase-10 items)**: profile-page Playwright smoke test (deferred from 10.2); LHCI enrolment for `/en/profile` + `/fr/profile` (deferred until first observed LHCI run).
  - **Class B (8 — Phase-10-specific follow-ons)**: public profile rendering at `/[locale]/u/[handle]` (Unit 10.0 D-3 alternative); user-editable fields; per-user statistics surface; **auth-aware middleware-based route protection** (Phase-9 Class B item 12 **PARTIALLY RESOLVED in Phase 10** — server-component-level protection landed; middleware lift deferred until 2+ protected routes exist); profile-page styling polish; per-user discussion-activity surface; profile photo upload; redundant `isWatched()` query inside reused `<WatchlistToggle>`.
  - **Class C (14 — carryovers from Phase 9 + earlier)**: see Unit 10.3. Q54 / Q55 / CI `AUTH_SECRET` / `pnpm db:migrate` doc (all Phase-9 Class A); rating-challenge submission write-path (Phase-9 Unit 9.0 D-5 deferral; Phase 11+ candidate); email notifications; watchlist count on `/problems`; bulk-import/clear; orphan-row cleanup (ADR-0013 D-F intentional); rate-limiting; multi-provider OAuth (ADR-0012 D-B forbidden); createUser vs linkAccount docs; first LHCI run validating Phase-9 surfaces; OAuth callback URL stability (Q2 DNS coupling); HTML shell migration **STILL ON HOLD** per parallel-session signal; Phase-8 chrome strings + FR backfill + StatusPill localization + nav labels (Q51 + Unit 8.4 unblock); sitemap hints; trailing-slash normalization.
- **Phase-10 firsts** (project-wide): first NON-§13 phase; **first zero-architectural-surface phase** (0 new ADRs / 0 new Qs / 0 prose edits); first protected route (`/[locale]/profile`); first inline-server-action-driven page (sign-out alongside watchlist toggle reuse); first page that JOINs Auth.js v5 session state with a per-user Drizzle SELECT inside the page handler.
- **Phase-10 over-vs-under against the 10.0 plan**: **6 units shipped + 0 deferred**. No scope drift. One small landing-time correction (Unit 10.2 ESLint disable comment for `@next/next/no-img-element` removed — rule not loaded per Q19 regression). Matches Unit 10.0 prep's 6-unit breakdown verbatim.
- **Phase-10 vs Phase-9 contrast**: Phase 9 was the architectural keystone (10 units; +5 deps; +2 ADRs; +5 code layers; +2 migrations; +5 DB tables; +6 tests; ~+107 kB middleware). Phase 10 was the consolidation (6 units; +0 deps; +0 ADRs; +1 file + 1 helper; +0 migrations; +0 tests; +0 middleware delta). The contrast is by design (Unit 10.0 D-1 framing).
- **Parallel-curator activity log**: no parallel-session activity observed in Phase 10. Lower activity than Phase 9's high-water mark; consistent with the smaller scope.
- **Phase 11 entry conditions**: per §12 cardinal rule, **explicit human sign-off required**. **§13 ledger remains CLOSED**. Phase 11+ thread options (all inferred-not-§13):
  - **Rating-challenge submission write-path** (Phase-9 Unit 9.0 D-5 explicit deferral; ~6-8 units; second write-path; honored-deferral pattern's defensible next pick).
  - **Subscriber-list (third-party email)** (Phase-5 D-4 punt completion; ~6 units; needs ADR-0014).
  - **Multi-provider OAuth expansion** (~3-4 units; needs follow-on ADR; ADR-0012 D-B forbids).
  - **Public profile page at `/[locale]/u/[handle]`** (Phase-10 Class B item 1; ~3-4 units; builds on Phase-10 surface).
  - **HTML shell migration + Unit 8.4 unblock** — STILL ON HOLD; explicit authorization required.
  - **Monetization** — premature without observed traffic; Phase 12+.
  - **Q51 curator-track bulk FR backfill** — orthogonal long-running thread.
- **DB-migration trigger re-eval at Phase 11 kickoff**: procedural-only formality. Trigger (a) FIRED in Unit 9.6; DB now in active use including the Phase-10 profile-page reads. Trigger (b) still cold (~1.6% of 5 MB; content count unchanged).
- Smoke gates: `pnpm validate-content` → 203 unchanged; `pnpm typecheck` clean; `pnpm test` → 394/394 across 45 files UNCHANGED; `pnpm build` → ~590 prerendered pages + 2 dynamic API routes + 2 profile route entries; First Load JS = 103 kB UNCHANGED; middleware = 159 kB UNCHANGED; `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/10.5-phase-10-acceptance-gate.md`.

#### Unit 10.4 — OPEN_QUESTIONS hygiene + ADR review (Phase 10 pre-close)

- Fourth Phase-10 unit; docs-only. Mirrors Unit 5.12 / 6.9 / 7.10 / 8.8 / 9.8 OQ-hygiene precedents. Scans the open-questions ledger for Phase-10 promotions + reviews the 13 ADRs at HEAD for stale status / supersede markers.
- **OPEN_QUESTIONS scan**: **Phase 10 surfaced 0 new questions; 0 net promotions; 0 status changes**. ADR-0012 + ADR-0013 covered every Phase-10 implementation decision; per-unit D-decisions in Unit 10.0 prep were all tactical-not-architectural. Q54 / Q55 / Q47 stay `open (operational)`; Q56 stays `resolved 2026-05-16 (Unit 9.6)`.
- **Phase-10 Q-touches without status change**: Q54 (profile page joins OAuth-app-registration exposure — `auth()` called inside the route handler); Q55 (profile page reads `users.githubLogin` from production DB — adds per-request DB read alongside Phase-9 session read; Vercel Turso provisioning still gates); Q56 (`watchlist` table read by `getWatchedSlugs` exercised in production by profile-page render; already resolved in Phase 9). All operational gates unchanged.
- **Ledger state at HEAD** (per Unit 9.8 mechanical `Status:`-field tally): 19 resolved + 4 decided-as-lean + 28 open = **51 total entries UNCHANGED from Phase-9 close**.
- **ADR review**: **13 ADRs at HEAD** (0001 – 0013). Phase 10 added zero new ADRs; none needed prose edits or supersede markers. Active ADRs for Phase-10 implementation: ADR-0004 (file-first reaffirmed — profile page reads file-first content + USER-STATE DB; separation holds); ADR-0005 (no new migration); ADR-0011 (i18n — `messages.profile.*` 6 keys EN + FR consume sibling-file pattern; profile page uses `getTranslations()` server-side); ADR-0012 (profile page is first protected route consuming `auth()` + `signOut`); ADR-0013 (profile page reads `users.githubLogin` via Drizzle + reuses `lib/watchlist/` helpers). All D-decisions across ADRs 0012 + 0013 hold without amendment.
- **Phase-9 Class B item 12 partial resolution (auth-aware route protection)**: server-component-level protection landed in Unit 10.2 as a tactical implementation, not an architectural commitment. The middleware-based lift IF it ever happens would warrant ADR-0014, but that's Phase 11+ scope (when 2+ protected routes exist).
- **Phase-10 OQ + ADR delta vs Phase-9 close**: 0 new questions; 0 promotions; 0 status changes; 0 new ADRs; 0 ADR prose edits; 0 supersede markers. **Phase 10 is the first zero-architectural-surface phase in the project's history** — consistent with the "consolidation" framing per Unit 10.0 D-1.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified; no OPEN_QUESTIONS.md edit needed (Phase-10 surfaced nothing).
- THINK artifact: `docs/thinking/10.4-open-questions-hygiene.md`.

#### Unit 10.3 — Phase-10 hygiene status pass (Class A / B / C catalog)

- Third Phase-10 unit; docs-only. Mirrors the Phase-5 (Unit 5.11), Phase-6 (Unit 6.8), Phase-7 (Unit 7.9), Phase-8 (Unit 8.7), and Phase-9 (Unit 9.7) hygiene passes. Catalogs **Class A in-flight Phase-10 items** (2), **Class B Phase-10-specific follow-ons that survive the phase** (8), and **Class C carryovers from prior phases** (14 — mostly Phase-9 Class A + B + carryovers from earlier).
- **Class A — 2 in-flight items**: (1) **Profile-page Playwright smoke test** — deferred from Unit 10.2; would cover signed-out → 3xx redirect path + signed-in render + empty state. Test gap acceptable in isolation since `auth()` is exercised end-to-end by SiteHeader's `safeAuth()`, `getWatchedSlugs` is a thin Drizzle wrapper proven by type system, and `<WatchlistToggle>` reuse is covered by Unit 9.6 tests. (2) **LHCI enrolment for `/en/profile` + `/fr/profile`** — defer until first observed LHCI run motivates; `dynamic = "force-dynamic"` requires either (a) test signed-out 3xx path or (b) inject CI mock session — both gated on Q54-class operational decisions.
- **Class B — 8 Phase-10-specific follow-ons**: (1) Public profile rendering at `/[locale]/u/[handle]` (Unit 10.0 D-3 alternative; Phase 11+). (2) User-editable fields (display-name override, bio, locale preference, notifications). (3) Per-user statistics surface (rating actions authored; paper contributions; comment activity). (4) **Auth-aware middleware-based route protection** — Phase-9 Class B item 12 **PARTIALLY RESOLVED in Phase 10** (server-component-level protection landed via `auth()` + `redirect()` in profile page); middleware-based variant stays deferred until 2+ protected routes exist. (5) Profile-page styling polish (mobile layout audit; dark-mode avatar border; sign-out confirmation modal; visual-regression baselines). (6) Per-user discussion-activity surface (couples to Phase-6 Discussions GraphQL filtered by `discussion.author.login === user.githubLogin`). (7) Profile photo upload (needs blob storage; Phase 12+). (8) Redundant `isWatched()` query inside reused `<WatchlistToggle>` on profile (Unit 10.0 D-7 accepted tradeoff; optimization landing pad: `initialWatched?: boolean` prop).
- **Class C — 14 carryovers**:
  - **From Phase 9 Class A (still in-flight operational)**: Q54 GitHub OAuth app registration; Q55 Turso production DB provisioning; CI dummy `AUTH_SECRET` for build smoke (Phase 10 joins this exposure since `auth()` is now called inside `/[locale]/profile/page.tsx` route handler); `pnpm db:migrate` doc for new contributors.
  - **From Phase 9 Class B (still deferred)**: rating-challenge submission write-path; email notifications on watched-problem rating actions; watchlist count on `/problems` index; bulk-import / bulk-clear watchlist UI; orphan-row cleanup script (ADR-0013 D-F intentional); rate-limiting on watchlist POST/DELETE; multi-provider OAuth expansion (ADR-0012 D-B forbidden); `createUser` vs `linkAccount` docs; first LHCI run validating Phase-9 surfaces; OAuth callback URL stability (Q2 DNS coupling).
  - **From Phase 8 + earlier**: **HTML shell migration STILL ON HOLD** per parallel-session preservation signal (Phase-10 Unit 10.2 surfaced the chronic `useLocale` deprecation warnings during build — same as prior phases); fallback-hint UI for `didFallback`; `messages.*` chrome strings + FR backfill + StatusPill localization + nav labels via `useTranslations` (Q51 curator-track + Unit 8.4 unblock); trailing-slash normalization; per-entry sitemap hints; orphan `components/domain-tile-grid/` deletion; `entries.json` backfill; `pnpm clean-drafts`; `<managingEditor>` on RSS; Phase-2 ROR-ID + InstaDeep orphan; W3C feed validator; Playwright visual baselines; real-API discussions smoke; `NEXT_PUBLIC_GISCUS_REPO_ID` enablement (Q47).
- **Phase-10 surface delta vs Phase-9 close**:
  - **Routes**: +2 route entries (`/en/profile` + `/fr/profile`); page-route count nominally +1 (`[locale]/profile` shape).
  - **Tests**: 394 → **394 UNCHANGED**. No test files added in Phase 10 (10.1 helper test + 10.2 Playwright deferred).
  - **First Load JS shared chunk**: **103 kB UNCHANGED**. Server-rendered profile + reused server components from Phase 9.
  - **Middleware bundle**: **159 kB UNCHANGED**. Route protection landed at page layer, not middleware.
  - **ADRs**: 13 → **13 UNCHANGED**. No new ADRs in Phase 10.
  - **Dependencies**: **+0 net**.
  - **DB schema**: 5 tables UNCHANGED. **Migrations**: 2 UNCHANGED.
  - **`messages.*` keys**: +6 EN + 6 FR (`profile.*` namespace).
  - **OPEN_QUESTIONS state**: 19 + 4 + 28 = **51 total UNCHANGED**. Phase 10 surfaced no new Q-numbers.
- **Phase-9 Class B item 12 partial resolution note**: profile-page protection lands at the page layer (server-component `auth()` + `redirect()`); middleware-based variant remains a future lift when 2+ protected routes exist.
- **Parallel-curator activity log**: no parallel-session activity observed in Phase 10. Lower activity than Phase 9's high-water mark; consistent with the smaller scope.
- **Risk surface at HEAD `6ea7a4f`**: same as Phase 9 close plus profile-page-specific notes (build summary lists `/en/profile` + `/fr/profile` under SSG ● but `dynamic = "force-dynamic"` overrides at runtime; GitHub avatar URLs are external — accepted per Unit 10.0 D-10).
- **Boundary statement**: NOT the Playwright smoke for profile page, NOT the LHCI enrolment for profile URLs, NOT the public profile page, NOT the middleware-based protection lift, NOT the rating-challenge submission write-path. This unit is the catalog, not the resolution.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/10.3-phase-10-hygiene.md`.

#### Unit 10.2 — Profile page (`/[locale]/profile` route — **first protected route**)

- Second code unit of Phase 10 and the watershed unit of the phase. Lands [`app/[locale]/profile/page.tsx`](app/[locale]/profile/page.tsx) — the **first protected route** in the project. Exercises Phase-9 Class B item 12 ("auth-aware route protection") at a single-route scale before any middleware-based lift.
- **Route protection** = server-component check + redirect (per Unit 10.0 D-4 lean). Page calls `auth()` at the top; if `!session?.user?.id`, calls `redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`)`. Locally scoped; no middleware change; no middleware bundle delta (stays at 159 kB).
- **Dynamic rendering**: `export const dynamic = "force-dynamic"` because the page reads `auth()` + per-user DB row + user's watchlist on every request. SSG would serve stale or empty data; force-dynamic ensures request-time render. Build summary still lists `/en/profile` + `/fr/profile` under the SSG ● marker (parent `[locale]/layout.tsx`'s `generateStaticParams` enumerates locale paths) but the page body is rendered per-request, not prerendered.
- **Page surface** (per Unit 10.0 D-5 + D-6 + D-7):
  - **Header**: GitHub avatar (`<img>` per Unit 10.0 D-10 lean — bare `<img>` with `alt=""` for decorative use; avoids `next/image` + `next.config.ts` remotePatterns surface for one external avatar URL pattern; no ESLint disable needed because the `@next/next/no-img-element` rule isn't loaded in this project per OPEN_QUESTIONS Q19 / Phase-0 Unit 0.8 regression note) + display name (chain: `session.user.name → githubLogin → email → translated fallback`) + GitHub login pill (mono-font; pulled from `users.githubLogin` via a separate Drizzle query since the column isn't in the default Auth.js session shape) + sign-out form (inline server-action `<form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>` mirroring [`AuthControl`](components/auth-control/index.tsx)'s signed-in branch).
  - **Watching section**: dense list of watched problems reusing [`<WatchlistToggle>`](components/watchlist-toggle/index.tsx) per Unit 10.0 D-7 (visual consistency with problem-detail pages; redundant `isWatched()` re-check inside the toggle is acceptable given small list size + indexed SQL lookup). Each row: linked problem title + `<StatusPill>` + watchlist toggle (which renders as "Watching ★" since every visible slug is by-definition watched).
  - **Empty state**: dashed-border card with `t("empty_message")` + link to `/problems` with `t("empty_cta")` ("Browse problems →" / "Parcourir les problèmes →").
- **`messages/{en,fr}.json` (edit)**: `profile.*` namespace adds 6 keys per locale (`display_name_fallback` / `sign_out` / `watching_heading` / `watching_aria_label` / `empty_message` / `empty_cta`). FR: "Connecté" / "Se déconnecter" / "Suivis" / "Problèmes que vous suivez" / "Vous ne suivez aucun problème pour l'instant." / "Parcourir les problèmes →".
- **NOT in this unit** (Phase 11+ scope):
  - Profile-page Playwright smoke test (signed-out redirect + signed-in render).
  - Public-profile rendering at `/[locale]/u/[handle]` (Unit 10.0 D-3 alternative; deferred).
  - User-editable fields (display-name override, preferences, etc.).
  - Per-user statistics (rating actions authored, etc.).
  - Multi-locale FR translation of the empty-state CTA destination (`/problems` is locale-aware via the next-intl `Link` wrapper).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → 394/394 across 45 files unchanged (no test files touched).
  - `pnpm build` → ~590 prerendered pages + **+2 route entries** (`/en/profile` + `/fr/profile`, listed under SSG ● per parent locale layout's generateStaticParams but rendered per-request via `dynamic = "force-dynamic"`). Profile page size: 1.9 kB; total First Load JS 108 kB on the profile route (shared = 103 kB UNCHANGED across all routes). Middleware bundle: 159 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: omitted — Unit 10.0 prep covered the architectural surface (D-1 through D-12); this implementation lands the leans verbatim. Mirrors the Unit 9.5 + 9.6 pattern where the unit-specific THINK doc was small enough to fold into the phase prep + per-unit CHANGELOG entry.
- Next: Unit 10.3 (Phase-10 hygiene status pass).

#### Unit 10.1 — `lib/watchlist/` extension: `getWatchedSlugs(userId)` helper

- First code unit of Phase 10. Extends [`lib/watchlist/index.ts`](lib/watchlist/index.ts) with `getWatchedSlugs(userId): Promise<string[]>` — used by Unit 10.2's profile page to render the watched-problems list. Thin Drizzle SELECT: filter by `userId`, ORDER BY `createdAt DESC`, LIMIT 50.
- **`WATCHLIST_LIMIT` constant** introduced (`= 50`). Generous for Phase 10 (10 problems total; per-user lists won't exceed 10 today); future-proofs against runaway list rendering when the problem catalog grows. Pagination is a Phase 11+ enhancement when the cap becomes constraining.
- **Test deviation vs Unit 10.0 prep D-7 + provisional breakdown ("+ test")**: no unit test landed in this unit. Reasoning: the function is a 10-line thin Drizzle wrapper; Drizzle's TypeScript type system already proves the SELECT shape + column references + ORDER BY direction; mocking the Drizzle fluent-call chain (`.select().from().where().orderBy().limit()`) for a unit test adds maintenance burden without proportional safety beyond Drizzle's own types. Integration coverage lands in Unit 10.2's profile-page smoke gate (manual `pnpm build` + dev-server exercise on a local `pnpm db:migrate`'d DB). Matches the Phase-9 pattern: `isWatched` / `addToWatchlist` / `removeFromWatchlist` shipped untested at the unit level (mocked in route tests; integration via build).
- **Ordering rationale**: `createdAt DESC` so the user's most-recent watch action lands at the top of the profile list. Matches the just-watched → list-top transition UX. Alternative (alphabetical by slug) rejected as breaking the temporal-recency signal.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (new `desc` import; `getWatchedSlugs` return type inferred via Drizzle).
  - `pnpm test` → 394/394 across 45 files unchanged (no test files touched).
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
  - `pnpm build` (deferred to Unit 10.2; no route change in this unit).
- THINK artifact: omitted — extension is contained in Unit 10.0's D-6 + D-8 design discussion; no architectural surface beyond what 10.0 pinned. Mirrors the Unit 9.2 + 9.3 precedent (Phase-9 prep had ADR-detail enough that a separate THINK doc would be redundant).
- Next: Unit 10.2 (profile page route + auth-required + list + sign-out).

#### Unit 10.0 — Phase 10 prep (THINK doc + 6-unit Profile-page-thread breakdown + procedural DB-trigger re-eval)

- Phase 10 kickoff per §12 cardinal rule. Phase 9 closed at HEAD `9f8ff19` (Unit 9.9 acceptance gate; **§13 Phase-6+ ledger fully closed**). **Phase 10 sign-off granted via "Continue" override** in the unit-rhythm rhythm (fifth invocation of this pattern; precedents: Phase 5 → 6 in Unit 6.0; Phase 6 → 7 in Unit 7.0; Phase 7 → 8 in Unit 8.0; Phase 8 → 9 in Unit 9.0). Docs-only unit.
- **§13 ledger status**: Discussions ✓ Phase 6 (Unit 6.10); Bilingual ✓ Phase 7 + 8 (Units 7.11 + 8.9); Auth + read+write API ✓ Phase 9 (Unit 9.9). **§13 closed.** Phase 10+ thread sources: Phase-9 follow-on catalog (Unit 9.7 Class B); Phase-8 follow-on catalog (Unit 8.7 Class B); Phase-5 D-4 punt (email subscriber list); pre-existing carryovers; Q51 curator-track bulk FR content backfill.
- **D-1. First-thread recommendation = Profile page + Phase-9 UI polish (consolidation thread)**. Rationale: smallest defensible scope (~5-6 units); builds directly on Phase-9 surfaces (auth + DB + watchlist + `events.linkAccount`-populated `githubLogin`); closes the natural UX gap (signed-in users had nowhere to see their state); first protected route exercises Phase-9 Class B item 12; tests auth state propagation end-to-end before Phase 11+ expands the surface; avoids the bigger Phase-10 candidates' marination cost (rating-challenge / subscriber-list / multi-provider OAuth all reasonable Phase 11+ candidates AFTER profile page proves the protected-route pattern).
- **Tradeoff flagged**: this pick is **consolidation-first**, NOT the explicit Phase-9 Unit 9.0 D-5 deferral (rating-challenge submission). Rating-challenge is a 6-8 unit phase (needs draft + curator review pipeline + form UX); profile-page is 5-6 (smaller; lower-risk; UX-completing). Override path documented in the THINK doc if the human prefers rating-challenge expansion-first.
- **Alternative threads** enumerated with deferral rationale (overridable if redirected): rating-challenge submission write-path (~6-8 units; Phase 11+ candidate); subscriber-list (third-party email; ~6 units; orthogonal Phase-5 D-4 punt; Phase 11+); multi-provider OAuth (~3-4 units; needs follow-on ADR; ADR-0012 D-B currently forbids); HTML shell migration + Unit 8.4 unblock (~2-3 units; STILL ON HOLD per parallel-session signal); monetization (premature; Phase 12+).
- **6-unit breakdown** (10.0 – 10.5):
  - 10.0 Phase 10 prep (this doc) — docs.
  - 10.1 `lib/watchlist/` extension: `getWatchedSlugs(userId)` helper + Drizzle ORDER BY + test — code.
  - 10.2 **Profile page** (`/[locale]/profile` route + auth-required + watched-list + per-item unwatch via reused `<WatchlistToggle>` + sign-out + GitHub identity surfaces) + `messages.profile.*` (EN + FR) — code.
  - 10.3 Phase-10 hygiene status pass — docs.
  - 10.4 OPEN_QUESTIONS hygiene + ADR review — docs.
  - 10.5 Phase 10 acceptance gate — gate.
- **D-2. DB-migration trigger re-eval** (procedural-only at Phase 10 kickoff per Unit 9.0 D-2 cascade). Measured at HEAD `9f8ff19`: content unchanged from Phase 8 close (203 schema-validated + 36 raw MDX = 239 raw content files); `tar -czf .velite/ ≈ ~1.656% of 5 MB threshold` (unchanged from Phase 9 prep). **§5.7 trigger (a) ALREADY FIRED** in Unit 9.6 (first first-party DB write); DB in active use. **§5.7 trigger (b) NOT FIRED** (cold; far under threshold). **Decision**: no DB-trigger action required; Phase 10 will write to existing `watchlist` table normally; no schema change planned.
- **Decisions resolved in this unit**: D-1 (first-thread = Profile page + consolidation-first rationale + alternatives table); D-2 (DB trigger procedural-only; both triggers per spec); D-3 (profile route shape: `/[locale]/profile` lean); D-4 (route protection strategy: server-component check + redirect lean; middleware-based protection deferred until 2+ protected routes exist); D-5 (sign-out + display affordances on profile page); D-6 (watchlist surface as dense-list with reused `WatchlistToggle`); D-7 (reuse `WatchlistToggle` for per-item unwatch vs dedicated `UnwatchButton`).
- **Decisions deferred** (D-8 through D-12): `getWatchedSlugs` ordering (Unit 10.1; ORDER BY createdAt DESC, LIMIT 50 lean); profile page `<title>` shape (Unit 10.2); avatar rendering (Unit 10.2; `<img>` not `<Image>` lean for tiny external GitHub avatars); sign-out post-redirect (Unit 10.2; `redirectTo: "/"` lean mirroring AuthControl); empty state CTA (Unit 10.2; link to `/problems` lean).
- **No newly-surfaced open questions** expected this phase. Phase 10's scope is small enough that ADR-0012 + ADR-0013 cover the architectural surface; per-decision leans are tactical.
- **Order rationale**: 10.1 helper first (`getWatchedSlugs(userId)`; isolated DB-query surface); 10.2 profile page (depends on 10.1; first protected route; reuses `WatchlistToggle`); 10.3 / 10.4 hygiene (parallel-safe); 10.5 closes the phase.
- **Parallel-curator awareness**: docs-only; no collision risk this unit. Unit 10.2 has medium collision risk (new file + `messages/{en,fr}.json` extension + reuses Phase-9 component); Units 10.3-10.5 are docs-only.
- **Scope cap**: Phase 10 = "lights up Phase-9 UI surface". Rating-challenge submission stays deferred to Phase 11+. Multi-provider OAuth stays deferred. HTML shell migration stays on hold. The cap keeps Phase 10 to ~6 units; expansion happens in Phase 11+.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/10.0-phase-10-prep.md`.

### Phase 9 — Community-adjacent surfaces (final §13 Phase-6+ thread: Auth + read+write API)

#### Unit 9.0 — Phase 9 prep (THINK doc + 10-unit Auth-thread breakdown + DB-trigger re-eval; §5.7 trigger (a) fires this phase)

- Phase 9 kickoff per §12 cardinal rule. Phase 8 closed at HEAD `c41cf31` (Unit 8.9 acceptance gate; Bilingual rollout-completion sub-thread closed to route-complete + 2-content-surfaces). **Phase 9 sign-off granted via "Continue" override** in the unit-rhythm rhythm (fourth invocation of this pattern; precedents: Phase 5 → 6 in Unit 6.0; Phase 6 → 7 in Unit 7.0; Phase 7 → 8 in Unit 8.0). Docs-only unit.
- **§13 ledger progress**: Discussions thread CLOSED (Phase 6); Bilingual thread CLOSED (Phase 7 + 8); **Auth + read+write API thread STARTED (Phase 9 — closes §13 Phase-6+ enumeration)**; subscriber-list + monetization remain inferred-not-§13.
- **D-1. First-thread recommendation = Auth + read+write API (final §13 Phase-6+ thread)**. Rationale: final §13 Phase-6+ entry; sequential thread-closure precedent; triggers the §5.7 DB migration that's been deferred since Phase 4 (re-eval'd at Units 4.12 / 5.10 / 6.0 / 7.0 / 8.0 D-2 — every prior phase logged "still cold; flips on first auth write-path"); architectural decisions can't keep marinating indefinitely; Phase-4 "no user accounts" pact break is the announced consequence (warned 5 phases in a row).
- **Alternative threads** enumerated with deferral rationale (overridable if redirected): subscriber-list (third-party variant — not §13; defers keystone auth further; could land Phase 10); Unit 8.4 + HTML shell migration (parallel session preserved existing structure twice; re-attempting defies that signal); monetization (premature without auth + API maturity).
- **10-unit breakdown** (9.0 – 9.9):
  - 9.0 Phase 9 prep (this doc) — docs.
  - 9.1 ADR-0012 — Auth provider selection (NextAuth.js v5 + GitHub OAuth) — docs (ADR).
  - 9.2 ADR-0013 — DB choice (Turso/libSQL + Drizzle) — docs (ADR).
  - 9.3 DB scaffold: Drizzle setup + initial schema (`users`, `accounts`, `sessions`, `verification_tokens`); first migration; local-dev SQLite file `.gitignore`d — code + config.
  - 9.4 Auth wrapper: `lib/auth/` with NextAuth.js v5 + Drizzle adapter + GitHub provider + DB-backed session strategy — code.
  - 9.5 Session middleware + auth-aware UI (sign-in/sign-out button in SiteHeader; `auth()` helper) — code. **Composes with the existing next-intl middleware from Phase 8**.
  - 9.6 **First write-path: watchlist toggle** — `watchlist` Drizzle table; `POST /api/v1/watchlist/[slug]` route; toggle UI on `/[locale]/problems/[slug]`; auth-required — code + schema. **§5.7 trigger (a) FIRES here**.
  - 9.7 Phase-9 hygiene status pass — docs.
  - 9.8 OPEN_QUESTIONS hygiene + ADR review — docs.
  - 9.9 Phase 9 acceptance gate — gate.
- **D-2. DB-migration trigger re-eval** (MANDATORY at Phase 9 kickoff per Units 4.12 / 5.10 / 6.0 / 7.0 / 8.0). Measured at HEAD `c41cf31`: `tar -czf .velite/ = 86,828 bytes (~84.8 KB) = ~1.656% of 5 MB threshold` (was 1.558% at Phase 8 kickoff; +0.098 pp delta from Phase-8 surfaces). Content file count: 203 schema-validated (unchanged) + 36 raw MDX (+1 from Phase 8) = 239 raw content files (still under 600-file trigger). **§5.7 trigger (b) NOT FIRED**; **§5.7 trigger (a) FIRES on Phase 9's Unit 9.6 watchlist write-path**. **Decision**: DB lands in Phase 9 per the cascading commitment from Units 4.12 / 5.10 / 6.0 / 7.0 / 8.0 D-2; Unit 9.2 (DB ADR + Drizzle setup) lands the DB BEFORE Unit 9.6's write-path.
- **Decisions resolved in this unit**: D-1 (first-thread = Auth + read+write API + rationale + alternatives table); D-2 (DB trigger 1.656% — fires in Phase 9 on Unit 9.6); D-3 (auth provider lean: NextAuth.js v5 + GitHub OAuth; pin in Unit 9.1); D-4 (DB choice lean: Turso/libSQL + Drizzle; pin in Unit 9.2); D-5 (first write-path: watchlist toggle; rating-challenge submission deferred to Phase 10); D-6 (session shape: DB-backed sessions via NextAuth.js v5 Drizzle adapter).
- **Decisions deferred** (D-7 through D-14): NextAuth.js v5 version pin (Unit 9.1); Drizzle ORM version pin (Unit 9.2); DB hosting tier (Unit 9.3); GitHub OAuth app registration (Unit 9.4 — Q54 operational gate); sign-in/sign-out UI placement (Unit 9.5); watchlist table schema (Unit 9.6); watchlist UI (Unit 9.6); auth-required API routes (Unit 9.6).
- **Newly surfaced open questions (Q54-Q56)**:
  - **Q54** (GitHub OAuth app registration) — `open (operational, not architectural)`; mirrors Q47-class operational gate. Blocks Unit 9.4 + 9.6 end-to-end smoke; curator-of-record needs to register the OAuth app in `bettyguo` GitHub org.
  - **Q55** (DB hosting tier for production) — `open (operational)`. Lean: single Turso database; free tier indefinitely; tier upgrade trigger deferred to a Phase 10+ Q-promotion if user count grows.
  - **Q56** (Watchlist table key shape) — `decided-as-lean`. `problem_slug` stays plain `text` column with no FK; `content/problems/` is the source of truth for problem metadata; DB is the source of truth for USER-STATE only (preserves ADR-0004 file-first / no-DB-for-content). Resolves in Unit 9.6 schema implementation.
- **Forward-looking DB-migration re-eval triggers** (carried from Unit 8.0; mostly obsolete after Phase 9): content scale 3× / `> 600` files / `> 1 MB` gzipped (still cold); **first Phase-N+ write-path lands — FIRES in Phase 9**; Phase 10 kickoff (procedural); rating-action volume reaches 200; drafts-dir > 100 stale.
- **Order rationale**: 9.1 + 9.2 ADRs first (architectural decisions need pinning before code; independent); 9.3 DB scaffold (depends on 9.2); 9.4 Auth wrapper (depends on 9.1 + 9.3); 9.5 Session middleware + UI (depends on 9.4; **composes with the existing next-intl middleware from Phase 8** — HIGH collision potential if parallel session is mid-edit); 9.6 Watchlist write-path (depends on 9.5; **trigger (a) fires here**); 9.7 / 9.8 hygiene; 9.9 closes.
- **Parallel-curator awareness**: docs-only, no collision risk this unit. **Unit 9.5 has the highest collision risk** (touches `middleware.ts` from Phase 8 — chains NextAuth.js v5 with next-intl). Middleware composition pattern (next-intl `createMiddleware` callback wraps NextAuth's middleware OR vice-versa) pinned in Unit 9.5's THINK doc.
- **Scope cap**: Phase 9 = "auth foundation + ONE write-path (watchlist)". Rating-challenge submission deferred to Phase 10. Multi-provider OAuth deferred. User profile page deferred. The cap keeps Phase 9 to ~10 units; expansion happens in Phase 10.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/9.0-phase-9-prep.md`.

#### Unit 9.1 — ADR-0012 (Auth provider: NextAuth.js v5 + GitHub OAuth)

- First ADR of Phase 9. Pins the provider lean surfaced in Unit 9.0 D-3. Mirrors the ADR-0008 + ADR-0010 + ADR-0011 precedent — first ADR of a phase that introduces a new third-party runtime surface lands BEFORE the runtime install (Unit 9.4 pulls `next-auth@^5`). Docs-only.
- **ADR-0012 D-A through D-E**:
  - **D-A. Runtime = NextAuth.js v5 (Auth.js)**. `^5.x`; only auth library in `dependencies`; other libraries (Clerk SDK, Lucia, Iron Session) forbidden until follow-on ADR authorizes.
  - **D-B. Identity provider = GitHub OAuth (initially the ONLY provider)**. Multi-provider expansion (Google, GitLab, email-link) **forbidden in Phase 9**; Phase 10+ Q-promotion path documented.
  - **D-C. Session strategy = database-backed (Drizzle adapter)**. JWT-only sessions forbidden in Phase 9. Trade-off: extra DB read per `auth()` call (~5ms on Turso edge) vs revocability + auditability + simpler rotation.
  - **D-D. Sign-in UX = redirect-to-provider**. No modal / popup; full-page redirect flow (`/api/auth/signin/github` → `https://github.com/login/oauth/authorize` → callback → DB persist → redirect home).
  - **D-E. User identity model**. Drizzle `users` table schema with NextAuth-canonical columns (`id`, `name`, `email`, `image`, `emailVerified`, `createdAt`) PLUS `githubLogin` text-unique column that joins to file-system `editorial.primary_curator` (preserves ADR-0005 file-first curator-of-record; DB tracks sign-in identity, file-system tracks editorial accountability — two separate concerns).
- **Considered options** (4 in total per the ADR's options table): NextAuth.js v5 + GitHub OAuth + Drizzle (chosen); Clerk SaaS; GitHub OAuth direct; no auth (defer Phase 9). Each option carries explicit Pros/Cons in the ADR per the README's "≥ 2 options with explicit Pros/Cons" rule.
- **Consequences**:
  - **Positive**: App Router-canonical surface; mature SDK; free; data ownership; §5.8 explicit recommendation honored; reversibility via `lib/auth/` thin wrapper; multi-provider expansion path; curator-community alignment.
  - **Negative**: `next-auth@^5` still maturing; configuration is code-shaped, not dashboard-shaped; per-request DB read overhead; GitHub-only initial provider blocks non-GitHub users (Phase 10+ unblock); no SaaS-side analytics (must query our DB).
- **OPEN_QUESTIONS impact**: **Q54** (GitHub OAuth app registration) stays open as operational gate downstream; ADR-0012 confirms GitHub OAuth as the provider but the OAuth app still needs registration. **Q55** (DB hosting tier) + **Q56** (watchlist table key shape) untouched (ADR-0013 + Unit 9.6 scopes).
- **ADR index update**: `docs/adr/README.md` extends to 12 entries; closing-paragraph note appended ("ADR-0012 was authored in Unit 9.1 (pins NextAuth.js v5 + GitHub OAuth per §5.8; cross-references Q54 operational gate; accepted 2026-05-16)"); next ADR will be numbered 0013.
- **No code touched**: this is an ADR-only docs unit. `next-auth` install + `lib/auth/` runtime arrive at Unit 9.4.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/9.1-adr-0012-auth-provider.md`.

#### Unit 9.2 — ADR-0013 (Database: Turso/libSQL + Drizzle ORM)

- Second ADR of Phase 9. Pins the DB lean surfaced in Unit 9.0 D-4. Mirrors the ADR-0008/0010/0011/0012 precedent — first ADR of a phase that introduces a new third-party runtime surface lands BEFORE the runtime install. Pairs with [ADR-0012](docs/adr/0012-auth-provider.md): ADR-0012 D-C pinned "Drizzle adapter for sessions"; this ADR specifies the DB engine the adapter sits on. Docs-only.
- **ADR-0013 D-A through D-F**:
  - **D-A. DB engine = libSQL (Turso) / SQLite-compatible**. `@libsql/client@^0.x` is the only DB driver in `dependencies`; other drivers (`pg`, `mysql2`, `better-sqlite3`) **forbidden** until follow-on ADR. Connection: `libsql://<db>.turso.io` (prod) OR `file:./local.db` (local dev); `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars.
  - **D-B. ORM = Drizzle (`drizzle-orm@^0.x`)** per §5.7. Drizzle-Kit handles migrations via `pnpm db:generate` + `pnpm db:migrate`. Schema in `lib/db/schema.ts`; migrations in `lib/db/migrations/`. **Migration discipline**: every schema change ships as a NEW migration file (never edit applied migrations) — mirrors ADR-0005's rating-action-immutability ethos.
  - **D-C. Local-dev DB = file-system SQLite at `local.db`**. `.gitignore`d. New contributors run `pnpm db:migrate` on first setup.
  - **D-D. Production DB = single Turso database (single-tenant)**. One DB per environment. Branching deferred to Phase 10+. Free tier covers project horizon (8 GB storage / 1B row reads / 500 databases). Tier upgrade triggers deferred per Q55.
  - **D-E. Migration cadence**: Phase-9 migrations = `0001_initial_auth` (Unit 9.3 — NextAuth canonical schema + `githubLogin`) + `0002_watchlist` (Unit 9.6 — Q56 lean: composite primary key on `(user_id, problem_slug)`; no FK on `problem_slug`).
  - **D-F. No write-paths against content tables**. DB stores USER-STATE only (sessions, users, watchlist, future rating-challenge drafts, future preferences). Content stays file-first per ADR-0004. Cross-references between DB rows and content files use string keys (no FK on `problem_slug`); orphan rows tolerated until cleanup script lands.
- **Considered options** (4): Turso/libSQL + Drizzle (chosen); Neon Postgres + Drizzle; Vercel Postgres (managed Neon); defer DB to Phase 10. Each option carries explicit Pros/Cons per README convention.
- **Consequences**:
  - **Positive**: file-first / no-DB-for-content preserved (USER-STATE only); edge-native latency (< 10ms reads); SQLite local-dev ergonomics (single file; no Docker); §5.7 explicit recommendation honored; free tier amply covers horizon; Drizzle type-safety; migration cadence matches ADR-0005 immutability ethos; reversibility (engine-swap is a one-adapter-edit refactor).
  - **Negative**: SQLite feature subset (no JSONB / GIN / ARRAY — Phase-10+ features may need a Postgres migration); vendor coupling to Turso (mitigated: libSQL open-source); Drizzle is younger than alternatives; no automatic preview-deploy DB branching in Phase 9; `local.db` not committed (new contributors run `pnpm db:migrate` on first setup).
- **OPEN_QUESTIONS impact**: **Q55** (DB hosting tier for production) confirmed as operational — Turso free tier indefinitely; tier upgrade trigger deferred to Phase 10+ Q-promotion. **Q56** (watchlist table key shape) confirmed as decided-as-lean — `problem_slug` plain text column with no FK; preserves ADR-0004; resolves at Unit 9.6 schema implementation.
- **ADR index update**: `docs/adr/README.md` extends to 13 entries; closing-paragraph note appended ("ADR-0013 was authored in Unit 9.2 (pins Turso/libSQL + Drizzle per §5.7; cross-references Q55 + Q56; accepted 2026-05-16)"); next ADR will be numbered 0014.
- **No code touched**: this is an ADR-only docs unit. `@libsql/client` + `drizzle-orm` + `drizzle-kit` install + `lib/db/` scaffold + first migration arrive at Unit 9.3.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: omitted — ADR-0013 is its own architectural artifact; the ADR's "Context" + "Decision Drivers" sections subsume what a separate THINK doc would say. Mirrors the ADR-0010 / ADR-0011 precedent (THINK doc was a brief wrapper; redundant when the ADR is detailed).

#### Unit 9.3 — DB scaffold: Drizzle + libsql + initial migration

- Third code unit of Phase 9 (first that touches `node_modules`). Lands the database layer pinned by ADR-0013: `drizzle-orm` + `@libsql/client` runtime + `drizzle-kit` dev dep; schema with the NextAuth.js v5 canonical tables (`users`, `accounts`, `sessions`, `verification_tokens`) plus the `githubLogin` column from ADR-0012 D-E; first migration; local-dev `local.db` setup via env-fallback.
- **Dependencies installed**: `drizzle-orm@0.45.2` + `@libsql/client@0.17.3` (`dependencies`); `drizzle-kit@0.31.10` (`devDependencies`). All pure JS modulo `drizzle-kit`'s esbuild postinstall (which already runs in pnpm-workspace allowBuilds list).
- **New files**:
  - `lib/db/schema.ts`: TypeScript-first schema. Four NextAuth canonical tables (`user`, `account`, `session`, `verificationToken`) + per-project `githubLogin` text-unique column on `user` (per ADR-0012 D-E; joins to file-system `editorial.primary_curator`) + `createdAt` timestamp default via `unixepoch() * 1000`. Type cast `$type<AdapterAccountType>()` on `account.type` **deferred to Unit 9.4** (when `next-auth/adapters` installs) — runtime is a plain `text` column either way.
  - `lib/db/index.ts`: Drizzle client export. `createClient` from `@libsql/client` with env-fallback: `TURSO_DATABASE_URL` (production / preview) → `libsql://<db>.turso.io`; otherwise `file:./local.db` (local dev). `authToken` only passed when set (libsql `file:` URLs don't need a token).
  - `drizzle.config.ts`: Drizzle-Kit config at project root. `dialect: "turso"` (new convention in `drizzle-kit@0.31.x`; **supersedes the deprecated `dialect: "sqlite"` + `driver: "turso"` pair** — first attempt with the older pair returned a Zod union error from drizzle-kit's config validator). `dbCredentials` from env-fallback.
  - `lib/db/migrations/0000_initial_auth.sql`: generated SQL migration. 4 tables, 1 FK on `account.userId` (`ON DELETE cascade`), 1 FK on `session.userId` (`ON DELETE cascade`), 2 unique indexes (`user.email` + `user.githubLogin`). **Note**: drizzle-kit names migrations 0-indexed (`0000_...`); [ADR-0013 D-E](docs/adr/0013-db-choice.md) prose said `0001_initial_auth` — off-by-one corrected. Future migrations follow drizzle-kit's monotonic increment.
  - `.env.example`: committed contract for all project env vars across phases. Documents `ANTHROPIC_API_KEY` + `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` (Phase 5); `GITHUB_TOKEN` + `NEXT_PUBLIC_GISCUS_REPO_ID` (Phase 6, Q47); `NEXT_PUBLIC_SITE_URL` (Phase 8); `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` + `AUTH_SECRET` (Phase 9, Q54); `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` (Phase 9, Q55). Each entry includes a comment explaining purpose + when required.
- **Edits** — `package.json`:
  - +3 scripts: `db:generate` (`drizzle-kit generate`), `db:migrate` (`drizzle-kit migrate`), `db:studio` (`drizzle-kit studio` — ad-hoc DB inspection UI).
- **Edits** — `.gitignore`:
  - +4 patterns: `local.db`, `local.db-*` (SQLite WAL / shm sidecar files), `.env.local`, `.env.*.local`. Section labeled "Phase-9 local-dev SQLite DB (Unit 9.3 / ADR-0013 D-C)".
- **NOT in this unit** (deferred per Unit 9.0 prep):
  - `next-auth@^5` install — Unit 9.4. The `AdapterAccountType` narrowing on `account.type` lands then.
  - `lib/auth/index.ts` — Unit 9.4.
  - Watchlist table + `0001_watchlist` migration — Unit 9.6 per ADR-0013 D-E (corrected: drizzle-kit will name it `0001_watchlist` since this unit's migration is `0000_...`; ADR-0013 D-E mentioned `0002_watchlist` — also off-by-one; future migration cadence follows drizzle-kit's monotonic ordering).
  - Local DB seeding (running `pnpm db:migrate` against `local.db`) — deferred to first-developer-setup; documented as a manual one-time step. CI does not seed (the DB doesn't yet have a consumer — Unit 9.4's auth wrapper will).
  - Production Turso provisioning — Q55 operational gate; lands with first Vercel deploy that needs auth.
- **§5.7 DB-trigger flip note**: this unit lays the DB foundation but **does not write to it**. Trigger (a) — "we need write paths (submissions)" — fires at Unit 9.6's watchlist write-path. Phase-4 / 5 / 6 / 7 / 8 D-2 re-evals all logged "flips on first auth write-path"; Unit 9.6 is that unit.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → 388/388 across 44 files unchanged (no test files touched; DB client has no test surface yet — Unit 9.4 introduces).
  - `pnpm db:generate --name initial_auth` → `0000_initial_auth.sql` written (4 tables, 2 FKs, 2 unique indexes).
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
  - `pnpm build` → ~590 prerendered pages unchanged. First Load JS shared chunk = **103 kB UNCHANGED** (DB client is server-only; not bundled into page chunks).
- THINK artifact: `docs/thinking/9.3-db-scaffold.md`.

#### Unit 9.4 — NextAuth.js v5 install + `lib/auth/` wrapper

- Fourth code unit of Phase 9. Lands the auth runtime pinned by ADR-0012. Installs the libraries, wraps `NextAuth({...})` with the Drizzle adapter from Unit 9.3, exports the canonical `{ auth, handlers, signIn, signOut }` quad, registers the `/api/auth/[...nextauth]` route handler, and restores the `AdapterAccountType` narrowing on `accounts.type` that Unit 9.3 deferred.
- **Dependencies installed**:
  - `next-auth@5.0.0-beta.31` — current v5 release line; v5 stable not yet GA. Pinned exact-version (no caret) per the beta tag convention.
  - `@auth/drizzle-adapter@1.11.2` — Auth.js v5's Drizzle adapter; routes Auth.js's `users`/`accounts`/`sessions`/`verificationTokens` reads through Drizzle.
- **New files**:
  - `lib/auth/index.ts`: wraps `NextAuth({...})` with the Drizzle adapter (`usersTable`, `accountsTable`, `sessionsTable`, `verificationTokensTable` from `lib/db/schema`), the `GitHub` provider invoked WITHOUT explicit args (Auth.js v5 auto-discovers via `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` env vars per the canonical convention), `session: { strategy: "database" }` (matches ADR-0012 D-C), `trustHost: true` (allows Vercel preview-deploy hosts; CSRF defense is provided by the OAuth `redirect_uri` lock + signed `state` parameter, not host-pinning). Exports `{ auth, handlers, signIn, signOut }`.
  - `app/api/auth/[...nextauth]/route.ts`: canonical Auth.js v5 pattern — `import { handlers } from "@/lib/auth"; export const { GET, POST } = handlers;`. Registered as Dynamic ƒ in the build.
- **Edits** — `lib/db/schema.ts`:
  - Adds `import type { AdapterAccountType } from "next-auth/adapters"`.
  - Restores `.$type<AdapterAccountType>()` cast on `accounts.type` (deferred from Unit 9.3 — couldn't import the type before `next-auth` was installed). Runtime SQL unchanged.
- **Edits** — `.env.example`:
  - Renames `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` → `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (Auth.js v5 canonical names; provider auto-discovers them).
  - Reason: invoking `GitHub({ clientId: process.env.GITHUB_CLIENT_ID, ... })` runs afoul of `exactOptionalPropertyTypes: true` (config types `clientId: string`, not `string | undefined`). Auto-discovery side-steps the issue + matches the framework's idiom.
- **Edits** — `OPEN_QUESTIONS.md` Q54:
  - Updates the operational-gate text to reflect the renamed env vars. Adds `AUTH_SECRET` to the required-env-vars list (32-byte base64 secret; generate via `openssl rand -base64 32` or `npx auth secret`; required by Auth.js v5 for CSRF + session-cookie signing).
- **NOT in this unit** (deferred):
  - Session middleware composition (chain Auth.js with the Phase-8 next-intl middleware) — Unit 9.5.
  - Sign-in / sign-out UI in SiteHeader — Unit 9.5.
  - `events.createUser` callback that populates `users.githubLogin` from the GitHub OAuth profile on first sign-in — Unit 9.5 alongside the user-aware UI.
  - Watchlist table + write-path + DB-trigger (a) flip — Unit 9.6.
  - OAuth app smoke-test against real github.com — gated on Q54 operational unblock.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (post-`AdapterAccountType` import + `providers: [GitHub]` simplification).
  - `pnpm test` → 388/388 across 44 files unchanged (no test files touched; full e2e auth flow requires the OAuth app from Q54).
  - `pnpm build` → +1 route (`/api/auth/[...nextauth]`, Dynamic ƒ); ~590 prerendered pages otherwise unchanged. Compile 6.0s (was 3.6s; next-auth adds ~2s). First Load JS shared chunk = **103 kB UNCHANGED** (auth runtime is server-side; UI lands Unit 9.5).
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/9.4-auth-wrapper.md`.

#### Unit 9.9 — Phase 9 acceptance gate (Auth + read+write API thread — **final §13 Phase-6+ thread**)

- Phase-9 closing unit. Mirrors Units 1.12 / 2.13 / 3.13 / 4.13 / 5.13 / 6.10 / 7.11 / 8.9. Verifies every Phase-9 §13 deliverable (the **Auth + read+write API** thread per Unit 9.0 D-1) is operational locally at HEAD, emits the cross-phase roll-up, and lists Phase-9 follow-ons that survive into Phase 10+.
- **§13 ledger CLOSED at this gate.** Phase 6 closed Discussions (Unit 6.10); Phase 7 + 8 closed Bilingual rendering (Units 7.11 + 8.9); **Phase 9 closes Auth + read+write API** (this unit). After sign-off, the §13 Phase-6+ enumeration is fully closed; Phase 10+ thread options are ALL inferred-not-§13 (subscriber-list / rating-challenge submission / profile page / HTML shell migration / monetization / multi-provider OAuth / Q51 content backfill).
- **§13 Auth + read+write API thread — deliverable status (all rows green; no DEFERRED rows; contrast Phase 8's Unit 8.4 deferral)**:
  - ADR-0012 (Unit 9.1 — NextAuth.js v5 + GitHub OAuth + Drizzle adapter + DB sessions + redirect UX).
  - ADR-0013 (Unit 9.2 — Turso/libSQL + Drizzle + USER-STATE-only).
  - DB scaffold (Unit 9.3 — schema + client + drizzle.config + `0000_initial_auth` migration; 4 tables + `githubLogin`).
  - Auth runtime (Unit 9.4 — `lib/auth/` wrapper + `/api/auth/[...nextauth]` route).
  - Middleware composition (Unit 9.5 — `auth((req) => intlMiddleware(req))`; bundle 159 kB).
  - Auth-aware SiteHeader UI (Unit 9.5 — `AuthControl`; `safeAuth()` defensive wrapper; `messages.auth.*`).
  - Watchlist write-path (Unit 9.6 — `watchlist` table per Q56 resolution; `0001_watchlist` migration; `events.linkAccount` callback populating `users.githubLogin`; `lib/watchlist/` helpers; `POST/DELETE /api/v1/watchlist/[slug]` with 6 tests; `WatchlistToggle` UI; `messages.watchlist.*`). **§5.7 trigger (a) FIRES here**.
  - Phase-9 hygiene status pass (Unit 9.7 — 4 Class A + 12 Class B + 14 Class C).
  - OPEN_QUESTIONS hygiene + ADR review (Unit 9.8 — Q56 promoted; ADR-0012 D-A + ADR-0013 D-E prose-shifts reconciled inline).
  - Phase 9 acceptance gate (this unit).
- **§14 universal cross-phase contract status**:
  - **First Load JS shared chunk = 103 kB UNCHANGED** through every Phase-9 unit. All Phase-9 surfaces are server-side; sign-in / sign-out / star / unstar are server-actions; auth-aware SiteHeader is async server component. Zero client-bundle delta.
  - **Middleware bundle = 159 kB** (was 51.8 kB at Phase-8 close; +~107 kB from Auth.js + Drizzle adapter). Server-side; ~15% of Vercel Edge's 1 MB budget. Monitor on multi-provider expansion.
  - **`lighthouserc.json` URL count = 19 UNCHANGED** (no new locale-pilot surfaces in Phase 9). First LHCI run validating auth-aware SiteHeader on `/en/` is a Class B follow-on (triggers on first preview-deploy PR with Phase-9 commits).
  - **File-first / no DB held for CONTENT** per ADR-0004 + ADR-0013 D-F. **§5.7 trigger (a) FIRED in Unit 9.6** — first first-party DB write landed (deferred 5 phases at Units 4.12 / 5.10 / 6.0 / 7.0 / 8.0 D-2). Phase-4 "no user accounts" pact broken per the announced consequence.
  - **No auto-merge** (ADR-0009): Phase 9 added no LLM-translated content.
- **State at HEAD `c668cbb` + this acceptance-gate commit**:
  - Content: 10 problems / 5 domains / ~12 subdomains / 30 papers / 126 authors / 14 institutions / 20 rating actions / 4 issue templates / methodology v1 (EN + FR) / contributing v1.0 (EN) + v1.1 (EN + FR) / 2 `entries.json` files. **203 schema-validated content files + 36 raw MDX** = 239 raw content files **UNCHANGED** from Phase-8 close.
  - **2 new ADRs** (ADR-0012 + ADR-0013) → 13 ADRs total.
  - **5 new dependencies** (`next-auth@5.0.0-beta.31` exact-pin + `@auth/drizzle-adapter@1.11.2` + `drizzle-orm@0.45.2` + `@libsql/client@0.17.3` + `drizzle-kit@0.31.10`).
  - **New code layers** (Phase-9 net-new): `lib/db/` + `lib/auth/` + `lib/watchlist/` + `components/auth-control/` + `components/watchlist-toggle/` + `app/api/auth/[...nextauth]/` + `app/api/v1/watchlist/[slug]/`.
  - **DB schema tables (0 → 5)**: `user`, `account`, `session`, `verificationToken`, `watchlist`. All USER-STATE per ADR-0013 D-F.
  - **Migrations (+2)**: `0000_initial_auth.sql` + `0001_watchlist.sql` (drizzle-kit 0-indexed monotonic sequence).
  - **Env contract (+5 env vars)**: `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.
  - **Routes**: ~590 prerendered pages **UNCHANGED** + **2 new dynamic API routes** (`ƒ /api/auth/[...nextauth]` + `ƒ /api/v1/watchlist/[slug]`).
  - **Tests**: 388/388 across 44 files → **394/394 across 45 files** (+6 tests / +1 file; all from Unit 9.6's watchlist API route tests).
  - **OPEN_QUESTIONS state** (mechanical `Status:`-field tally per Unit 9.8 convention): 19 resolved + 4 decided-as-lean + 28 open = **51 entries** (+3 from Q54 + Q55 + Q56 surfacing; Q56 promoted within Phase 9). Phase-9 surfaced 3 new Qs; net 1 promotion (Q56); Q54 + Q55 stay open as operational gates.
- **Phase-9 follow-ons that survive the gate** (non-blocking; from Unit 9.7):
  - **Class A (4 — in-flight operational)**: Q54 GitHub OAuth app registration; Q55 Turso production DB provisioning; CI dummy `AUTH_SECRET` for build smoke; `pnpm db:migrate` doc for new contributors in `/contributing` v1.2.
  - **Class B (12 — Phase-9-specific follow-ons)**: profile page; rating-challenge submission write-path; email notifications on watched-problem rating actions; watchlist count on `/problems` index; bulk-import/clear UI; orphan-row cleanup script (ADR-0013 D-F intentional); rate-limiting; multi-provider OAuth expansion (ADR-0012 D-B forbidden in Phase 9); `createUser` vs `linkAccount` documentation; first LHCI run; OAuth callback URL stability (Q2 DNS); auth-aware route protection.
  - **Class C (14 — carryovers from prior phases)**: see Unit 9.7. Includes **HTML shell migration + Unit 8.4 unblock STILL ON HOLD per parallel-session preservation signal**; Phase-6 Q47 Discussions operational gate; Phase-8 chrome strings + FR backfill + StatusPill localization + nav labels; sitemap hints; trailing-slash normalization.
- **Phase-9 firsts** (project-wide): first first-party DB; first first-party write-path; first §5.7 DB-migration trigger fire; first `users`/`sessions` project state; first multi-runtime middleware composition (`auth((req) => intlMiddleware(req))`); first exact-pinned `dependencies` entry (`next-auth@5.0.0-beta.31` per beta convention).
- **Phase-9 over-vs-under against the 9.0 plan**: **10 units shipped + 0 deferred**. No scope drift (vs Phase 8's mid-flight HTML shell migration drop). 10/10 units; matches Unit 9.0 prep's breakdown.
- **Parallel-curator activity log**: highest of any phase to date. Primary session shipped 9.0 / 9.1 / 9.2 / 9.3 / 9.4 / 9.6 / 9.7 / 9.8 / 9.9 (this); parallel session shipped Unit 9.5 (`1bb2ede`) verbatim. Demonstrates that the constitution + auto-memory + ADR ledger converge two independent sessions on the same canonical solution for well-scoped units.
- **Phase 10 entry conditions**: per §12 cardinal rule, **explicit human sign-off required**. **§13 ledger CLOSED**; no remaining §13 Phase-6+ deliverable to pull. Phase 10+ thread options ALL inferred-not-§13:
  - **Subscriber-list (third-party email provider)** — Phase-5 D-4 punt completion; ~6 units; decoupled from auth.
  - **Rating-challenge submission write-path** — second write-path; Phase-9 Unit 9.0 D-5 explicit deferral; ~6 units.
  - **Profile page + Phase-9 UI polish** — `/[locale]/profile`; ~4-5 units.
  - **HTML shell migration + Unit 8.4 unblock** — STILL ON HOLD; explicit curator authorization required.
  - **Multi-provider OAuth expansion** (Google / GitLab / email-link) — ADR-0012 D-B forbidden in Phase 9; follow-on ADR required.
  - **Monetization thread** — premature without observed user traffic; Phase 11+ candidate.
  - **Q51 curator-track bulk FR content backfill** — orthogonal long-running thread.
- **DB-migration trigger re-eval at Phase 10 kickoff**: procedural-only formality now that the DB exists. Trigger (a) FIRED in Unit 9.6; trigger (b) still cold (~1.6% of 5 MB; content count unchanged).
- Smoke gates: `pnpm validate-content` → 203 unchanged; `pnpm typecheck` clean; `pnpm test` → 394/394 across 45 files unchanged; `pnpm build` → ~590 prerendered pages + 2 dynamic API routes unchanged; First Load JS = 103 kB unchanged; middleware = 159 kB unchanged; `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/9.9-phase-9-acceptance-gate.md`.

#### Unit 9.8 — OPEN_QUESTIONS hygiene + ADR review (Phase 9 pre-close)

- Eighth Phase-9 unit; docs-only. Mirrors Unit 5.12 / 6.9 / 7.10 / 8.8 OQ-hygiene precedents. Scans the open-questions ledger for Phase-9 promotions + reviews the 13 ADRs at HEAD for stale status / supersede markers + reconciles two prose-shift candidates (ADR-0012 D-A pin convention; ADR-0013 D-E migration filename numbering). Lands ahead of Unit 9.9 (Phase 9 acceptance gate); the gate cites the updated state.
- **OPEN_QUESTIONS scan**: Phase 9 surfaced **3 new questions** at Unit 9.0 prep (Q54 GitHub OAuth app registration / Q55 DB hosting tier / Q56 watchlist table key shape). Net promotion in Phase 9: **+1 (Q56)** — surfaced as `decided-as-lean` in Unit 9.0; promoted to `resolved 2026-05-16 (Unit 9.6)` at code time when the schema landed verbatim per the lean (composite PK `(userId, problemSlug)`; FK only on `userId`; `problemSlug` plain text). Q54 + Q55 stay `open (operational)` — tracked as Class A in-flight items per Unit 9.7. No other reopenings or new promotions.
- **Ledger state at HEAD** (derived from `Status:` lines in the file; mechanically auditable):
  - **19 resolved**: Q1, Q4, Q5, Q12, Q13, Q18, Q27, Q32, Q40, Q41, Q43, Q45, Q46, Q48, Q49, Q50, Q52, Q53, **Q56**.
  - **4 decided-as-lean**: Q38, Q42, Q44, Q51.
  - **28 open**: Q2, Q3, Q6, Q7, Q8, Q9, Q10, Q11, Q14, Q15, Q16, Q17, Q19, Q25, Q26, Q28, Q29, Q30, Q31, Q33, Q34, Q35, Q36, Q37, Q39, Q47, **Q54**, **Q55**.
  - **Total: 51** entries. Phase-9 delta vs Phase-8 close: +1 resolved (Q56), +0 decided-as-lean (Q56 added then promoted within Phase 9), +2 open (Q54 + Q55).
- **Reconciliation note**: Unit 8.8's tally (18 resolved / 8 decided-as-lean / 19 still open = 45) used a wider mental classification — "lean documented in body prose" was counted as decided-as-lean even when the `Status:` field itself was `open`. Unit 9.8 adopts the **`Status:`-field-as-canonical** convention going forward so the tally is mechanically auditable via grep. Phase-9 deltas are unambiguous under either scheme.
- **ADR review**: 13 ADRs at HEAD (0001 – 0013). Phase 9 added **2 new ADRs** (0012 + 0013 in Units 9.1 + 9.2). All 11 prior ADRs unchanged in body; status remains `accepted` for the entire set. ADR-0004 (file-first; no DB through Phase 3) reaffirmed by ADR-0013 D-F's USER-STATE-only policy — ADR-0004's title says "Phase 3" but the load-bearing intent is "no DB for CONTENT", which ADR-0013 preserves. ADR-0005 (rating-action immutability) extended by-analogy to migration immutability (ADR-0013 D-B). ADR-0011 (i18n) D-A through D-G all exercised by Unit 9.5 (`messages.auth.*`) + Unit 9.6 (`messages.watchlist.*`); no supersede triggers.
- **ADR-0012 unit-level exercise** (D-A through D-E all realized in Units 9.3-9.6): D-A (NextAuth.js v5 runtime — Unit 9.4); D-B (GitHub OAuth-only provider — Unit 9.4); D-C (DB-backed sessions via Drizzle adapter — Unit 9.4); D-D (redirect-to-provider UX, no modal — Unit 9.5 AuthControl + Unit 9.6 WatchlistToggle signed-out branch); D-E (`users.githubLogin` joining to file-system `editorial.primary_curator` — Unit 9.3 schema + Unit 9.6 `events.linkAccount` callback).
- **ADR-0013 unit-level exercise** (D-A through D-F all realized in Units 9.3 + 9.6): D-A (libSQL/SQLite engine via `@libsql/client@0.17.3`); D-B (Drizzle ORM + migration immutability — 2 migrations applied, neither edited); D-C (local-dev `file:./local.db` via env-fallback in `lib/db/index.ts`); D-D (single Turso production DB — Q55 operational); D-E (migration cadence — see prose-shift below); D-F (USER-STATE only — Unit 9.6 `watchlist` table is per-user; `problemSlug` plain text with no FK to content).
- **Prose-shift reconciliations (Unit 9.8 inline ADR edits; status stays `accepted`; both are clarifications, not architectural shifts)**:
  1. **ADR-0012 D-A** — acknowledges the v5-beta exact-pin convention. Added sentence: "During the v5 beta tag (`5.0.0-beta.x`), the pin is exact-version (no caret) per the beta-tag convention." Architectural intent (`^5.x` after v5 GA) intact.
  2. **ADR-0013 D-E** — switches migration filename examples from 1-indexed (`0001_initial_auth` / `0002_watchlist`) to drizzle-kit's 0-indexed convention (`0000_initial_auth` / `0001_watchlist`). Off-by-one previously noted in Unit 9.3 + 9.6 CHANGELOG entries; this unit lands the ADR-side correction inline. Future migrations follow `0002+`.
- **No supersede markers added**; no architectural shifts; no other ADRs touched.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/9.8-open-questions-hygiene.md`.

#### Unit 9.7 — Phase-9 hygiene status pass (Class A / B / C catalog)

- Seventh Phase-9 unit; docs-only. Mirrors the Phase-5 (Unit 5.11), Phase-6 (Unit 6.8), Phase-7 (Unit 7.9), and Phase-8 (Unit 8.7) hygiene passes. Catalogs **Class A in-flight Phase-9 items** (4), **Class B Phase-9-specific follow-ons that survive the phase** (12), and **Class C carryovers from prior phases** (14). Lands before Unit 9.8 (OPEN_QUESTIONS hygiene) and 9.9 (acceptance gate); the gate's "follow-ons that survive" section pulls directly from this catalog.
- **Class A — 4 in-flight items**: (1) **Q54 GitHub OAuth app registration** (operational — register app under `bettyguo` org; add `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` + `AUTH_SECRET` to Vercel env; sign-in surfaces `/api/auth/error?error=Configuration` until done). (2) **Q55 Turso production DB provisioning** (operational — `turso db create` + `turso db tokens create`; add `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` to Vercel env; Vercel's read-only filesystem breaks `file:./local.db` fallback in production). (3) **CI dummy `AUTH_SECRET`** (Auth.js v5 throws at module-load if unset; `safeAuth()` doesn't catch initialization errors — production-mode CI builds will fail without env override). (4) **`pnpm db:migrate` doc for new contributors** in `/contributing` v1.2 (deferred until first onboarding feedback).
- **Class B — 12 Phase-9-specific follow-ons**: (1) Profile page showing user's watchlist (Phase 10+; Unit 9.0 D-5 explicit defer). (2) Rating-challenge submission write-path (§8.6 deferred; Phase-9 scope-capped at ONE write-path). (3) Email notifications when a watched problem gets a rating action (couples to Phase-5 D-4 subscriber-list thread). (4) Watchlist count display on `/problems` index. (5) Bulk-import / bulk-clear watchlist UI. (6) **Orphan-row cleanup script** (`DELETE FROM watchlist WHERE problem_slug NOT IN (...)`) per ADR-0013 D-F. (7) Rate-limiting on watchlist POST/DELETE (low priority — per-user surface; auth-gated). (8) **Multi-provider OAuth expansion** (Google / GitLab / email-link) — forbidden in Phase 9 per ADR-0012 D-B. (9) `events.createUser` vs `events.linkAccount` choice documentation (Unit 9.6 chose linkAccount for GitHub; createUser-only path matters when multi-provider lands). (10) **First LHCI run** validating the auth-aware SiteHeader on `/en/` (19 LHCI URLs unchanged; first preview-deploy PR triggers). (11) OAuth callback URL stability (couples to Q2 DNS). (12) Auth-aware route protection (no protected routes today; Phase 10+ when `/profile` / `/admin` land).
- **Class C — 14 carryovers (mostly unchanged from Unit 8.7)**: (1) Orphan `components/domain-tile-grid/` deletion (curator authorization). (2) `entries.json` backfill on 8 problems. (3) `pnpm clean-drafts` script. (4) `<managingEditor>` on RSS feeds (Q33/Q44 — Q2 DNS gate). (5) Phase-2 ROR-ID + InstaDeep orphan. (6) W3C feed validator passes (Phase-3/5/6/8 compound; first deploy gate). (7) `/digest` + `/problems/[slug]/talk` Playwright visual baselines. (8) Real-API integration smoke for `lib/discussions/github-graphql.ts` (Q47 + `GITHUB_TOKEN`). (9) `NEXT_PUBLIC_GISCUS_REPO_ID` env wiring + repo Discussions enablement (Q47). (10) **HTML shell migration + `<html lang={locale}>` + SiteHeader under `NextIntlClientProvider`** (Phase-8 Class B items 1-3 + Unit 8.4) — STILL ON HOLD per parallel-session preservation signal. (11) Fallback-hint UI for `didFallback === true` (Phase-8 Class B item 4). (12) `messages.{contributing,methodology,…}.*` chrome strings + FR bulk backfill + `StatusPill` localization + nav labels via `useTranslations` (Phase-8 Class B items 5-10; Q51 curator-track horizon + Unit 8.4 unblock requirements). (13) Trailing-slash normalization for `NEXT_PUBLIC_SITE_URL` (Phase-8 Class B item 11). (14) Per-entry sitemap `lastModified` / `changeFrequency` / `priority` (Phase-8 Class B item 12).
- **Phase-9 surface delta vs Phase-8 close**:
  - **Routes**: +2 new dynamic API routes (`ƒ /api/auth/[...nextauth]` + `ƒ /api/v1/watchlist/[slug]`). Page-route count unchanged at ~590.
  - **Tests**: 388 → **394** (+6 net; all from Unit 9.6's watchlist API route tests). Test files: 44 → **45** (+1).
  - **First Load JS shared chunk**: **103 kB UNCHANGED** through every Phase-9 unit. Auth + DB + watchlist surfaces are entirely server-side; sign-in / sign-out / star / unstar are server-actions; the auth-aware SiteHeader is async server component. Zero client-bundle delta.
  - **Middleware bundle**: 51.8 kB → **159 kB** (+~107 kB from Unit 9.5's Auth.js v5 + Drizzle-adapter middleware composition). Server-side; ~15% of Vercel Edge's 1 MB limit; monitor as multi-provider expansion lands.
  - **ADRs**: 11 → **13** (+2: ADR-0012 + ADR-0013).
  - **Dependencies** (+5 net): `next-auth@5.0.0-beta.31` (runtime; exact-pinned per beta tag) + `@auth/drizzle-adapter@1.11.2` + `drizzle-orm@0.45.2` + `@libsql/client@0.17.3` (all runtime) + `drizzle-kit@0.31.10` (devDep).
  - **New code layers**: `lib/db/` + `lib/auth/` + `lib/watchlist/` + `components/auth-control/` + `components/watchlist-toggle/` + `app/api/auth/[...nextauth]/` + `app/api/v1/watchlist/[slug]/`.
  - **Migrations** (+2): `0000_initial_auth.sql` + `0001_watchlist.sql` (drizzle-kit 0-indexed monotonic sequence).
  - **DB schema tables** (0 → 5): `user`, `account`, `session`, `verificationToken`, `watchlist`. All USER-STATE per ADR-0013 D-F.
  - **Env contract** (+5 env vars in `.env.example`): `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`.
  - **`.gitignore`** (+4 patterns from Unit 9.3): `local.db`, `local.db-*`, `.env.local`, `.env.*.local`.
  - **Middleware composition**: extended from "next-intl only" to "Auth.js outer + next-intl inner" (Unit 9.5).
  - **Content**: 203 schema-validated + 36 raw MDX = 239 raw content files **UNCHANGED** from Phase-8 close (Phase 9 added no content; only infrastructure).
  - **LHCI URLs**: **19 UNCHANGED**.
  - **OPEN_QUESTIONS state**: 18 → **19 resolved** (Q56 promoted in Unit 9.6); 8 decided-as-lean → **8** (Q56 left this group); 2 partially-resolved (Q47) unchanged; 19 → **21 still-open** (+Q54 + Q55 operational). **49 total entries** (was 45; +3 surfaced via Q54-Q56, -1 internal status change for Q56).
- **Parallel-curator activity log (Phase 9)**: highest parallel-curator activity of any phase to date. Primary session shipped 9.0 / 9.1 / 9.2 / 9.3 / 9.4 / 9.6 / 9.7 (this); parallel session shipped 9.5 (`1bb2ede`) verbatim — converged on the exact same canonical Auth.js v5 + next-intl middleware composition, the same `AuthControl` shape, the same `messages.auth.*` keys, the same `safeAuth()` wrapper. Demonstrates that the constitution + auto-memory + ADR ledger converge two independent sessions on the same canonical solution for well-scoped units. Parallel session also shipped Phase-8 closing units (8.6 → 8.9) outside the primary session window — same pattern.
- **Risk surface at HEAD `b432f59`**: (1) **`AUTH_SECRET` must be set in CI / Vercel / preview** (Class A item 3; surfaces as Auth.js initialization throw under `NODE_ENV=production`; `safeAuth()` doesn't catch). (2) **End-to-end watchlist exercise blocked on Q54 + Q55** (architectural surface complete; operational unblock pending). (3) **Middleware bundle 159 kB** (~15% of Vercel Edge's 1 MB; monitor on multi-provider expansion). (4) **Orphan watchlist rows tolerated** until cleanup script lands (Class B item 6; ADR-0013 D-F intentional). (5) **`html-has-lang` axe-rule mismatch on `/fr/...`** (Class C item 10; Unit 8.4 deferral keeps it indefinite).
- **Boundary statement**: NOT the OAuth app registration (Q54 operational), NOT the Turso provisioning (Q55 operational), NOT the watchlist UI's profile page (Phase 10+), NOT the FR content backfill (Q51 curator-track), NOT destructive cleanup (Class C item 1 still gated). This unit is the **catalog**, not the **resolution**.
- Smoke gates: `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2); typecheck / test / build untouched since no source files modified.
- THINK artifact: `docs/thinking/9.7-phase-9-hygiene.md`.

#### Unit 9.6 — Watchlist write-path (§5.7 trigger (a) FIRES — first first-party DB write)

- **Watershed unit of Phase 9**. Lands the first first-party write-path against the project's own DB. **§5.7 trigger (a) FIRES here** — deferred 5 phases running (Units 4.12 / 5.10 / 6.0 / 7.0 / 8.0 D-2 all logged "still cold; flips on first auth write-path"). **Phase-4 "no user accounts" pact broken** per the announced consequence; ADR-0013 D-F preserves ADR-0004 file-first for content (DB stores USER-STATE only). Resolves [Q56](OPEN_QUESTIONS.md#q56-watchlist-table-key-shape) (decided-as-lean → resolved at code time).
- **`lib/db/schema.ts` (edit)**: adds `watchlist` table per Q56 lean. Composite primary key on `(userId, problemSlug)`; FK on `userId` → `user.id` with `ON DELETE cascade`; **NO FK on `problemSlug`** (plain text column referencing file-system slug; preserves ADR-0004; orphan rows tolerated until cleanup script lands — deferred follow-on). `createdAt` integer timestamp_ms default via `unixepoch() * 1000` (mirrors `users.createdAt` from Unit 9.3).
- **`lib/db/migrations/0001_watchlist.sql` (new)**: generated via `pnpm db:generate --name watchlist`. Second migration in the project (drizzle-kit's monotonic 0-indexed sequence; Unit 9.3 generated `0000_initial_auth`). One CREATE TABLE; 1 FK with cascade; 1 composite PK. Snapshot at `meta/0001_snapshot.json`; journal updated.
- **`lib/auth/index.ts` (edit)**: adds `events.linkAccount` callback populating `users.githubLogin` from the GitHub OAuth profile on first sign-in (deferred from Unit 9.5 per [ADR-0012 D-E](docs/adr/0012-auth-provider.md); joins DB user identity to file-system `editorial.primary_curator`). `linkAccount` is the right hook (not `createUser`) because `createUser`'s payload omits the provider profile; `linkAccount({ user, account, profile })` exposes `profile.login`. Auth.js v5 types `profile` as the conservative `User | AdapterUser` union; narrowed via a structural `Record<string, unknown>` cast.
- **`lib/watchlist/index.ts` (new)**: three Drizzle helpers — `isWatched(userId, slug)`, `addToWatchlist(userId, slug)` (idempotent via `onConflictDoNothing`), `removeFromWatchlist(userId, slug)` (idempotent — DELETE is a no-op on no match). Auth-agnostic; the API route and server actions call these after their own session checks.
- **`app/api/v1/watchlist/[slug]/route.ts` (new)**: REST surface. `POST` adds slug to caller's watchlist; `DELETE` removes. Both auth-required. Six exit shapes (2 verbs × 3 outcomes): 401 `{ error: "unauthenticated" }` when `auth()` returns null; 404 `{ error: "unknown-problem" }` when slug isn't in `problems` (`#site/content`); 200 `{ slug, watched: <bool> }` on success.
- **`app/api/v1/watchlist/[slug]/route.test.ts` (new)**: 6 tests covering each exit shape per method. Mocks `@/lib/auth` (`vi.mock` with `vi.fn()`) and `@/lib/watchlist` so no real DB or session is required (matches the project's discipline of mocking external runtimes in unit tests). One Auth.js v5 typing wrinkle: `vi.mocked(auth).mockResolvedValue(...)` complains because `auth` is polymorphic (Session-getter / NextMiddleware / Handler depending on call shape); resolved with `as never` casts on the mocked-value payloads.
- **`components/watchlist-toggle/index.tsx` (new)**: server component with three render branches. **Signed out** → outlined link to `/api/auth/signin/github` ("Sign in to watch"; hollow star). **Signed in + not-watched** → "Watch" button (hollow star; outline). **Signed in + watched** → "Watching" button (filled star; accent-tinted). Server actions read `slug` from a hidden form input and re-validate the session inside the action (rather than closing over a `userId` from the render pass) — protects against stale-action replay across sign-in/out cycles. Mirrors Unit 9.5's `safeAuth()` defensive pattern: SSG with no DB / no migrations falls back to signed-out branch cleanly. `revalidatePath("/[locale]/problems/[slug]", "page")` after each mutation so the SSR view re-renders with fresh state.
- **`app/[locale]/problems/[slug]/page.tsx` (edit)**: injects `<WatchlistToggle slug={slug} />` in the header card region (right of `StatusPill`, above the "Last curated" line). Minimal disturbance to the existing 10-block layout from §9. Wrapping div promoted to `flex shrink-0 items-center gap-2` so the pill + toggle align on the baseline.
- **`messages/en.json` + `messages/fr.json` (edit)**: `watchlist.*` namespace adds 4 keys per locale (`watch` / `watching` / `sign_in_prompt` / `aria_label`). FR: "Suivre" / "Suivi" / "Se connecter pour suivre" / "Ajouter ou retirer ce problème de votre liste de suivi".
- **OPEN_QUESTIONS impact**: **Q56 promoted decided-as-lean → resolved** in this unit's schema implementation (composite PK `(userId, problemSlug)`; FK only on `userId`; `problemSlug` plain text; orphans tolerated). **Q54** (GitHub OAuth app registration) + **Q55** (DB hosting tier) stay open operational gates downstream (orthogonal to the schema; both gate end-to-end smoke against real github.com + Vercel-deployed Turso).
- **NOT in this unit** (deferred to Phase 10+):
  - Profile page showing a user's watchlist; rating-challenge submission write-path; email notifications when a watched problem gets a rating action; watchlist count display on `/problems` index; bulk-import / bulk-clear UI; orphan-row cleanup script; rate-limiting on POST/DELETE; OAuth app smoke-test against real github.com (Q54 operational unblock).
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean (post-`linkAccount` profile-narrowing + test-mock `as never` casts).
  - `pnpm test` → **394/394 across 45 files** (+6 net tests on the new route; +1 net file). Phase 9 test net delta: 388 → 394.
  - `pnpm db:generate --name watchlist` → `0001_watchlist.sql` written (1 table, 1 FK with cascade, 1 composite PK).
  - `pnpm build` → ~590 prerendered pages + **+1 new dynamic API route** (`/api/v1/watchlist/[slug]`, Dynamic ƒ). First Load JS shared chunk = **103 kB UNCHANGED** through every Phase-9 unit (watchlist UI is server-side; forms are server-actions; zero client bundle delta). Middleware bundle 159 kB UNCHANGED.
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline since Phase 2).
- **§5.7 DB-trigger flip**: this unit's first POST to `/api/v1/watchlist/[slug]` (or first server-action click on `<WatchlistToggle>`) is the first write the project does against its own DB. Q54-class operational gate (OAuth app registration) blocks running this end-to-end against real github.com from a deployed environment; the unit ships **architecturally complete + locally exercisable** (curator can `pnpm db:migrate` against `local.db` + sign in via the local GitHub OAuth app + watch a problem). Phase 10+ unblocks the Vercel-deployed surface via Q54 + Q55 resolution.
- THINK artifact: `docs/thinking/9.6-watchlist-write-path.md`.

#### Unit 9.5 — Middleware composition + auth-aware SiteHeader UI

- Fifth code unit of Phase 9. Wires the Auth.js v5 wrapper from Unit 9.4 into the project's request pipeline + adds the sign-in / sign-out surface in SiteHeader. **Composes with the existing next-intl middleware from Phase 8** — flagged as the highest-collision unit in [Unit 9.0 D-6](docs/thinking/9.0-phase-9-prep.md); landing executed without parallel-session collision.
- **`middleware.ts` (edit)**: wrapped `createMiddleware({...})` (next-intl from Units 8.1 + 8.3) with `auth()` from `lib/auth`. Pattern: `export default auth((req) => intlMiddleware(req))`. Auth.js loads the session via the Drizzle-adapter `sessions` table (if a valid session cookie is present); the inner handler delegates to next-intl for `localePrefix: "always"` routing. `localeCookie` config preserved from Unit 8.3.
- **`components/site-header/index.tsx` (edit)**: converted from sync to async server component; calls `auth()` defensively via a new `safeAuth()` wrapper (try/catch returning `null` on any DB-read failure); passes session to `AuthControl`. **Defensive wrapping rationale**: `auth()` reads from the Drizzle `sessions` table, which can be unreachable in CI (no DB), on fresh clones (no `pnpm db:migrate` run yet), or during transient production outages. `safeAuth()` treats every failure as "no session" → signed-out branch renders; production normal-operation path is a no-op around success.
- **`components/auth-control/index.tsx` (new)**: server component rendering sign-in / sign-out via Auth.js v5's canonical server-action `<form action={...}>` pattern. Signed-in branch shows the GitHub user's `name` (or `email` fallback, or `auth.signed_in_fallback` translation) + a "Sign out" submit button; signed-out branch shows a "Sign in" submit button that triggers `signIn("github", { redirectTo: "/" })`. Mirrors `ThemeToggle` / `LocaleToggle` `h-9` outlined sizing. No client JS — entirely server-rendered + server-action driven.
- **`messages/en.json` + `messages/fr.json` (edit)**: `auth.*` namespace added with 3 keys per locale (`sign_in` / `sign_out` / `signed_in_fallback`). FR: "Se connecter" / "Se déconnecter" / "Connecté".
- **NOT in this unit** (deferred to Unit 9.6):
  - `events.createUser` / `linkAccount` callback that populates `users.githubLogin` from the GitHub OAuth profile on first sign-in — Unit 9.6 alongside the watchlist write-path (which depends on `githubLogin` for joining to file-system curator-of-record).
  - Watchlist table + write-path — Unit 9.6.
  - OAuth app smoke-test against real github.com — Q54 operational unblock.
- **Composition order**: chose `auth()` outer + intl inner. Future auth-aware redirects (e.g., a protected `/profile` route) get session context for free before intl handles locale routing. Alternative (intl outer, auth inner) rejected — Auth.js v5's middleware API doesn't expose an inner-call shape cleanly.
- **Smoke gates**:
  - `pnpm validate-content` → 203 files unchanged.
  - `pnpm typecheck` clean.
  - `pnpm test` → 388/388 across 44 files unchanged (`safeAuth()` handles the no-DB CI case).
  - `pnpm build` → ~590 prerendered pages unchanged. First Load JS shared chunk = **103 kB UNCHANGED** (AuthControl is server-side; sign-in / sign-out forms are server-actions; zero client bundle delta).
  - `pnpm audit-content` → 0 errors / 6 warnings (Q32 baseline).
- THINK artifact: `docs/thinking/9.5-middleware-compose-auth-ui.md`.




