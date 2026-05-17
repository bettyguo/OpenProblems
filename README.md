# LLM OpenProblems

A rated, taxonomy-organized encyclopedia of open problems in LLM and AI research — leaderboards, historical tracks, and dynamic agency-style ratings (Difficulty, Saturation, Urgency, Value, Industry Call) for every problem in every subdomain.

This repository is governed by [`MASTER_PROMPT.md`](./MASTER_PROMPT.md), which serves as the project's constitution. Every implementation decision must trace back to a section there or to an Architecture Decision Record (ADR) in [`docs/adr/`](./docs/adr/) that explicitly amends it.

## Status

**Progress: 23 / 23 phases shipped** (Phase 0 → Phase 22, all ✅ closed). HEAD = [`b353641`](./CHANGELOG.md) (2026-05-17). **19 accepted ADRs.** The project sits at the **Phase 22 → Phase 23 boundary**, ⏸ pending §12 human sign-off before Phase 23 may open.

```
Phase   0 ▓ 1 ▓ 2 ▓ 3 ▓ 4 ▓ 5 ▓ 6 ▓ 7 ▓ 8 ▓ 9 ▓ 10 ▓ 11 ▓ 12 ▓ 13 ▓ 14 ▓ 15 ▓ 16 ▓ 17 ▓ 18 ▓ 19 ▓ 20 ▓ 21 ▓ 22 ▓ │ 23 ⏸
Status  ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅  ✅  ✅  ✅  ✅  ✅  ✅  ✅  ✅  ✅  ✅  ✅  ✅  │ pending sign-off
```

Smoke gates at HEAD (re-measure to verify):

| Gate                    | Value                                                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`        | clean                                                                                                                                                                            |
| `pnpm lint`             | clean                                                                                                                                                                            |
| `pnpm test`             | **575 / 575** across **55** vitest files                                                                                                                                         |
| `pnpm validate-content` | **203** content files green                                                                                                                                                      |
| `pnpm audit-content`    | 0 errors / 6 warnings (Q32 `related-problems-symmetry` baseline)                                                                                                                 |
| `pnpm build`            | ~659 prerendered pages + 7 dynamic page/API routes; First Load JS shared chunk = **103 kB** (unchanged since Phase 9); middleware bundle = **160 kB** (unchanged since Phase 12) |

### Phase ledger

All 23 phases are closed (✅). Phase 23 has not opened (⏸ awaiting §12 sign-off).

| Phase  | Status                 | Theme                                                     | Units      | Last commit | Notes                                                                                                      |
| ------ | ---------------------- | --------------------------------------------------------- | ---------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
| 0      | ✅ closed              | Foundation                                                | 13         | `62eb8eb`   | Stack, schemas, ADRs 0001–0005, App Router stub IA.                                                        |
| 1      | ✅ closed              | Core MVP                                                  | 13         | `fc17e23`   | Brand finalisation, Velite pipeline, first problems.                                                       |
| 2      | ✅ closed              | Papers / Authors / Institutions / Leaderboards            | 13 + 7 hyg | `1d9d67e`   | §13 30-paper floor; cross-link audit CI gate.                                                              |
| 3      | ✅ closed              | Rating Dynamics & Trending                                | 14 + 1     | `709679f`   | ADR-0006 (saturation N/A). Recompose UI; movers board.                                                     |
| 4      | ✅ closed              | DomainMap & Community                                     | 14         | `37ed747`   | ADR-0007 (D3 import policy). DomainMap viz.                                                                |
| 5      | ✅ closed              | Intelligence layer (LLM CLIs)                             | 14 + 2     | `01a8903`   | ADR-0008 + ADR-0009. `ingest-arxiv`, `extract-leaderboard`.                                                |
| 6      | ✅ closed              | Discussions                                               | 11         | `bb8f816`   | ADR-0010. Giscus embed + GraphQL read-side.                                                                |
| 7      | ✅ closed              | Bilingual rendering — infra + pilot                       | 13         | `01862d2`   | ADR-0011. next-intl + sub-path + sibling-file storage.                                                     |
| 8      | ✅ closed ⚠️           | Bilingual rollout completion                              | 10         | `c41cf31`   | **Unit 8.4 (HTML shell migration) deferred indefinitely.**                                                 |
| 9      | ✅ closed (§13 close)  | Auth + read+write API                                     | 10         | `9f8ff19`   | ADR-0012 + ADR-0013. **§13 ledger CLOSED.**                                                                |
| 10     | ✅ closed              | Profile page + Phase-9 UI polish                          | 6          | `0a55bfd`   | First NON-§13 phase.                                                                                       |
| 11     | ✅ closed              | Rating-challenge submission                               | 8          | `2df4290`   | Submission form + `ratingChallenge` table.                                                                 |
| 12     | ✅ closed              | Curator review pipeline                                   | 9          | `201825f`   | ADR-0014. State machine + env-var authz (`LOP_CURATOR_LOGINS`).                                            |
| 13     | ✅ closed              | Public visibility (Q58)                                   | 7          | `c3e3cbf`   | Per-status visibility policy.                                                                              |
| 14     | ✅ closed              | Public profile route `/[locale]/u/[handle]`               | 9          | `34290d7`   | ADR-0015 (per-user privacy model).                                                                         |
| 15     | ✅ closed              | User-editable profile fields                              | 9          | `7644a70`   | ADR-0016 (`displayName` + `bio` plain-text).                                                               |
| 16     | ✅ closed              | Image override / avatar upload                            | 9          | `2ea957b`   | ADR-0017 (Vercel Blob). Parallel-session phase.                                                            |
| 17     | ✅ closed              | Markdown rendering in bio                                 | 8          | `ad951e4`   | ADR-0018 (`unified` + `rehype-sanitize`).                                                                  |
| 18     | ✅ closed              | Multi-surface markdown (review notes)                     | 7          | `4915406`   | ADR-0018 D-G inheritance; no new ADR.                                                                      |
| 19     | ✅ closed              | EXIF stripping on uploaded images                         | 6          | `87d11e6`   | ADR-0019 (`sharp` server-side; strip-all default).                                                         |
| 20     | ✅ closed              | EXIF backfill operational script                          | 5          | `f4f498e`   | `scripts/backfill-exif-strip.ts`; no new ADR.                                                              |
| 21     | ✅ closed              | Orphan-blob cleanup operational script                    | 5          | `a5ee9e1`   | `scripts/cleanup-orphan-blobs.ts`; no new ADR.                                                             |
| 22     | ✅ closed (HEAD)       | `emit-challenge-action` CLI (ADR-0014 D-D realization)    | 5          | `b353641`   | `scripts/emit-challenge-action.ts`; +11 tests; no new ADR.                                                 |
| **23** | ⏸ **pending sign-off** | TBD — 11+ thread options ranked in latest SESSION_HANDOFF | —          | —           | Strongest patience signals: multi-provider OAuth (12-phase carryover); subscriber-list email (16+ phases). |

**Rhythm at HEAD:** three consecutive operational-script-keystone phases (20 + 21 + 22); six consecutive single-session phases (17–22); six consecutive 0-migration phases (17–22); three-phase Q-tally freeze (29 open / 26 resolved / 4 lean = 59 total since Phase 20).

## Architecture at a glance

- **Framework** — Next.js 15 App Router + React 19 + TypeScript strict (`exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`). ADR-0001.
- **Styling** — Tailwind v4 + shadcn/ui primitives + variable fonts (Inter / Source Serif 4 / JetBrains Mono).
- **Schemas** — Zod 4 as the source of truth in [`lib/schemas/`](./lib/schemas/). ADR-0003.
- **Content pipeline** — Velite 0.3 over MDX + YAML + JSON in [`content/`](./content/); Zod schemas duplicated in `velite.config.ts` to work around the Velite/Zod 4 internal-API incompatibility (Q31). ADR-0002.
- **Storage** — File-first ([`content/`](./content/)) for editorial state; Turso libSQL + Drizzle ORM for user state (`user` / `account` / `session` / `verificationToken` / `watchlist` / `ratingChallenge`; 6 migrations); Vercel Blob for user-uploaded avatars. ADR-0004 / ADR-0013 / ADR-0017.
- **Auth** — NextAuth.js v5 + GitHub OAuth + Drizzle adapter + DB sessions. ADR-0012.
- **i18n** — next-intl + sub-path routing (`/[locale]/...`) + sibling-file content (`*.fr.mdx`). 127 keys per locale. ADR-0011.
- **Markdown** — `unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-sanitize` + `rehype-stringify` (server-only). 4 `dangerouslySetInnerHTML` surfaces; 2 XSS-audited helpers (`renderBioMarkdown`, `renderReviewNotesMarkdown`). ADR-0018.
- **Image processing** — `sharp@0.34.5` (server-side) in [`lib/storage/putAvatar`](./lib/storage/index.ts) for EXIF stripping + auto-rotation. ADR-0019.
- **Discussions** — Giscus iframe (client) + GitHub GraphQL API (server). ADR-0010.
- **LLM curation** — `@anthropic-ai/sdk` powering [`scripts/ingest-arxiv.ts`](./scripts/ingest-arxiv.ts) and [`scripts/extract-leaderboard.ts`](./scripts/extract-leaderboard.ts). ADR-0008.
- **Testing** — Vitest 4 (unit + Storybook-stories-as-browser-tests) + Playwright 1.60 (e2e) + Lighthouse CI (perf / a11y / SEO ≥ 0.95).
- **Tooling** — pnpm 11 + ESLint 9 (flat) + Prettier 3 + Husky 9 + lint-staged + commitlint + drizzle-kit.
- **CI** — fast `verify` workflow (typecheck · lint · format · test · validate-content · audit-content · build · ADR-0005 immutability gate) and slow `e2e + lighthouse` workflow (required since Unit 1.12).

## Common commands

| Command                                         | What it does                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| `pnpm dev`                                      | `velite` → `next dev`                                                      |
| `pnpm build`                                    | `velite` → `next build`                                                    |
| `pnpm typecheck`                                | `tsc --noEmit`                                                             |
| `pnpm test`                                     | Vitest                                                                     |
| `pnpm validate-content`                         | Validate every YAML / JSON file in `content/` against the Zod schemas      |
| `pnpm audit-content`                            | Cross-link audit (paper / problem / author / institution / entries refs)   |
| `pnpm ingest-arxiv`                             | arXiv → MDX draft pipeline (ADR-0008 / 0009; needs `ANTHROPIC_API_KEY`)    |
| `pnpm extract-leaderboard`                      | PDF → leaderboard-entry draft pipeline                                     |
| `pnpm backfill-exif-strip`                      | Retroactively strip EXIF from existing Vercel Blob avatars (Phase 20)      |
| `pnpm cleanup-orphan-blobs`                     | Reconcile Vercel Blob against `users.imageOverride` (Phase 21)             |
| `pnpm emit-challenge-action <id>`               | Scaffold a rating-action YAML from a curator-accepted challenge (Phase 22) |
| `pnpm db:generate` / `db:migrate` / `db:studio` | drizzle-kit (6 migrations to date)                                         |
| `pnpm lint` / `lint:fix`                        | ESLint 9                                                                   |
| `pnpm format` / `format:check`                  | Prettier 3                                                                 |
| `pnpm test:e2e`                                 | Playwright (chromium)                                                      |
| `pnpm lhci`                                     | Lighthouse CI                                                              |
| `pnpm storybook`                                | Storybook 10                                                               |

## Operational gates (pending curator action)

Architecture is complete; deployment unblock pending curator action on the operational side:

- **Q2 / Q3** — DNS + hosting decision (the stack assumes Vercel; `llm-openproblems.org` is the §5.10 placeholder).
- **Q54** — register the GitHub OAuth app and populate `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` + `AUTH_SECRET` (one app for prod, one for local dev).
- **Q55** — provision the production Turso DB and populate `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- **Q69** — create the Vercel Blob store; `BLOB_READ_WRITE_TOKEN` is auto-injected by `vercel env pull`.

The env contract is at [`.env.example`](./.env.example); see also [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) Q54 / Q55 / Q69 for detailed operational unblock paths. Note: [`.env.example`](./.env.example) currently documents Phase-5/6/8/9 vars only — `LOP_CURATOR_LOGINS` (Phase 12) and `BLOB_READ_WRITE_TOKEN` (Phase 16) are not yet listed there.

## Reading order for new contributors

1. [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) — the constitution. Read end-to-end before touching anything.
2. [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) — load-bearing decisions awaiting the human (29 still open at Phase-22 close, including 7 Phase-23+ candidates that haven't been promoted to Q-numbers).
3. [`docs/adr/`](./docs/adr/) — accepted architecture decisions (0001–0019). Each ADR is immutable post-acceptance; corrections ship as a superseding ADR per the ADR-0005 pattern.
4. [`docs/CURATION_PROMPT.md`](./docs/CURATION_PROMPT.md) — the parallel-curator workflow contract. Multiple Claude Code sessions can author concurrently; this doc explains the parallel-safety rules (especially around `OPEN_QUESTIONS.md` writes, which route through `docs/open-questions-inbox/<RUN-ID>.md`).
5. [`docs/PAPER_INGEST_RUNBOOK.md`](./docs/PAPER_INGEST_RUNBOOK.md) — the single-session step-by-step for the `ingest-arxiv` → review → commit pipeline.
6. The most recent `docs/SESSION_HANDOFF_*.md` (currently [`docs/SESSION_HANDOFF_2026-05-17_phase-19-close.md`](./docs/SESSION_HANDOFF_2026-05-17_phase-19-close.md)) — paste-into-fresh-session resume payload with the full live ledger.
7. [`docs/thinking/`](./docs/thinking/) — per-unit THINK artifacts (§15.1 of the master prompt). 191 files; the `<phase>.0-phase-N-prep.md` and `<phase>.<n>-phase-N-acceptance-gate.md` files frame each phase end-to-end.
8. [`CHANGELOG.md`](./CHANGELOG.md) — every unit with file paths and rationale (~5,500 lines).

## Development workflow rhythm

- One unit at a time: **THINK** (`docs/thinking/<unit>.md`) → **DESIGN** (ADR if architectural) → **CODE** → **ITERATE** (smoke gates) → **CHANGELOG** → **commit**. Don't batch.
- Commit message header ≤ 100 chars (commitlint enforces). Prefix per [Conventional Commits](https://www.conventionalcommits.org/): `chore(phase-N): unit N.X — <title>` for scaffolding / infra; `docs(phase-N): ...` for docs-only units.
- Phase boundaries require explicit human sign-off per `MASTER_PROMPT.md` §12 (a "Continue" override is the documented escape valve and has been used 17 times across Phases 6–22).
- Pre-commit hooks: ADR-0005 rating-action immutability check (blocks `M` / `D` / `R` / `C` on `content/problems/*/ratings/*.yaml` — only net-new files pass) → lint-staged → `pnpm test`. Never `--no-verify`.
- Windows note: Bash tool for git; PowerShell for `pnpm`. CRLF-only diffs are benign; `prettier-plugin-tailwindcss` reorders Tailwind classes on commit (do not revert).

## License

- **Code** (`app/`, `components/`, `lib/`, `scripts/`, configs) is licensed under **Apache-2.0** — see [`LICENSE`](./LICENSE).
- **Content** (`content/` — `taxonomy.yaml`, problems, papers, authors, institutions, methodology) is licensed under **CC-BY-4.0** — see [`content/LICENSE.md`](./content/LICENSE.md).

Q4 resolved in Unit 1.0 (2026-05-14); Apache-2.0 picked over MIT for the explicit patent grant, given the project intends a citable methodology paper.
