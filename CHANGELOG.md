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
