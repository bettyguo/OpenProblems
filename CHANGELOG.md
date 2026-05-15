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
