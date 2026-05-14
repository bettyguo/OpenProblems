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
