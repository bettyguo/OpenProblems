# LLM OpenProblems

A rated, taxonomy-organized encyclopedia of open problems in LLM and AI research — leaderboards, historical tracks, and dynamic agency-style ratings (Difficulty, Saturation, Urgency, Value, Industry Call) for every problem in every subdomain.

This repository is governed by [`MASTER_PROMPT.md`](./MASTER_PROMPT.md), which serves as the project's constitution. Every implementation decision must trace back to a section there or to an Architecture Decision Record (ADR) in [`docs/adr/`](./docs/adr/) that explicitly amends it.

## Status

**Progress: 41 / 41 phases shipped** (Phase 0 → Phase 40, all ✅ closed). HEAD = [`9b39a8c`](./CHANGELOG.md) (2026-05-18). **24 accepted ADRs.** The project sits at the **Phase 40 → Phase 41 boundary**, ⏸ pending §12 human sign-off before Phase 41 may open.

```
Phase   0 ▓ 1 ▓ 2 ▓ … ▓ 22 ▓ 23 ▓ … ▓ 35 ▓ 36 ▓ 37 ▓ 38 ▓ 39 ▓ 40 ▓ │ 41 ⏸
Status  ✅ ✅ ✅ … ✅ ✅ … ✅ ✅ ✅ ✅ ✅ ✅ │ pending sign-off
```

Smoke gates at HEAD (re-measure to verify):

| Gate                    | Value                                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`        | clean                                                                                                                                                              |
| `pnpm lint`             | clean                                                                                                                                                              |
| `pnpm test`             | **833 / 833** across **70** vitest files                                                                                                                           |
| `pnpm validate-content` | content files green                                                                                                                                                |
| `pnpm audit-content`    | 0 errors / 6 warnings (Q32 `related-problems-symmetry` baseline)                                                                                                   |
| `pnpm build`            | First Load JS shared chunk = **103 kB** (UNCHANGED through every Phase 9-40 unit; 68 consecutive units); middleware bundle = **160 kB** (unchanged since Phase 12) |

### Phase ledger

All 41 phases (Phase 0 → Phase 40) closed (✅). Phase 41 has not opened (⏸ awaiting §12 sign-off). See [`CHANGELOG.md`](./CHANGELOG.md) (~7500 lines) for the full unit-by-unit detail; [`docs/PROGRESS_SUMMARY_2026-05-18.md`](./docs/PROGRESS_SUMMARY_2026-05-18.md) for narrative summary + remaining-workload estimate; [`docs/SESSION_HANDOFF_2026-05-18_phase-40-close.md`](./docs/SESSION_HANDOFF_2026-05-18_phase-40-close.md) for paste-into-fresh-session resume payload.

**Recent phases (35-40)** — Phase-35 framework-only-ADR pattern + Phase-37 markdown-extension framework + 2 concrete consumers + multi-consumer composition infrastructure:

| Phase  | Status                 | Theme                                                                                 | Units | Last commit | ADR / closure                                                                            |
| ------ | ---------------------- | ------------------------------------------------------------------------------------- | ----- | ----------- | ---------------------------------------------------------------------------------------- |
| 35     | ✅ closed              | Framework-only content moderation                                                     | 5     | `90dee0f`   | ADR-0024; Q68 expansion at 12+ phase carryover                                           |
| 36     | ✅ closed              | Per-user privacy opt-out                                                              | 5     | `fdb577e`   | ADR-0015 D-A APPEND; Q64 at 15+ phase carryover                                          |
| 37     | ✅ closed              | Q72 markdown schema-divergence framework (`MarkdownExtensionRegistry` + 4 surfaces)   | 5     | `1b2f81f`   | ADR-0018 D-G APPEND #4; framework-only-pattern reuse from Phase-35                       |
| 38     | ✅ closed              | First concrete framework consumer (wikilinks per-actionRationale via `rehypePlugins`) | 5     | `106fdc7`   | ADR-0018 D-G APPEND #5; Class B.14 at 9+ phase carryover                                 |
| 39     | ✅ closed              | Second concrete framework consumer (GFM tables per-reviewNotes via `schemaOverrides`) | 5     | `89c36a7`   | ADR-0018 D-G APPEND #6; first real-consumer exercise of override-replace semantics       |
| 40     | ✅ closed (HEAD)       | Multi-consumer composition infrastructure (`CompositeExtensionRegistry`)              | 5     | `9b39a8c`   | ADR-0018 D-G APPEND #7 (project record); Phase-38-prep D-11 closure; first 10-phase no-B |
| **41** | ⏸ **pending sign-off** | TBD — 10 candidate threads ranked in latest SESSION_HANDOFF                           | —     | —           | Rank 1 lean: third concrete framework consumer exercising `remarkPlugins` slot           |

**Rhythm at HEAD:** six consecutive 5-unit framework-pattern phases (35-40); twenty-four consecutive single-session phases (17-40); first "framework + 2 consumers + composition" 4-phase cluster (37-40) in project history; ADR-0018 D-G is the **first ADR D-clause with 7 APPENDs** in project history; **10 consecutive phases without new B category** (Phase 31-40 = first 10-phase run).

## Architecture at a glance

- **Framework** — Next.js 15 App Router + React 19 + TypeScript strict (`exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`). ADR-0001.
- **Styling** — Tailwind v4 + shadcn/ui primitives + variable fonts (Inter / Source Serif 4 / JetBrains Mono).
- **Schemas** — Zod 4 as the source of truth in [`lib/schemas/`](./lib/schemas/). ADR-0003.
- **Content pipeline** — Velite 0.3 over MDX + YAML + JSON in [`content/`](./content/); Zod schemas duplicated in `velite.config.ts` to work around the Velite/Zod 4 internal-API incompatibility (Q31). ADR-0002.
- **Storage** — File-first ([`content/`](./content/)) for editorial state; Turso libSQL + Drizzle ORM for user state (`user` / `account` / `session` / `verificationToken` / `watchlist` / `ratingChallenge` / `subscriber`; **9 migrations**); Vercel Blob for user-uploaded avatars. ADR-0004 / ADR-0013 / ADR-0017.
- **Auth** — NextAuth.js v5 + multi-provider OAuth (GitHub + Google) + Drizzle adapter + DB sessions. ADR-0012 / ADR-0020.
- **i18n** — next-intl + sub-path routing (`/[locale]/...`) + sibling-file content (`*.fr.mdx`). **168 keys per locale**. ADR-0011.
- **Markdown** — `unified` + `remark-parse` + `remark-gfm` + `remark-rehype` + `rehype-sanitize` + `rehype-stringify` (server-only). **4 `dangerouslySetInnerHTML` surfaces; 4 XSS-audited helpers** (`renderBioMarkdown` + `renderReviewNotesMarkdown` + `renderRationaleMarkdown` + `renderActionRationaleMarkdown`). ADR-0018 + 7 D-G APPENDs documenting the markdown-extension framework (Phase 37) + 2 consumers (Phase 38 wikilinks + Phase 39 tables) + composition (Phase 40).
- **Markdown extension framework** — [`lib/markdown/extensions/`](./lib/markdown/extensions/) (11 files): `MarkdownExtensionRegistry` interface + `DefaultExtensionRegistry` (Phase 37) + `WikilinkExtensionRegistry` (Phase 38) + `TablesExtensionRegistry` (Phase 39) + `CompositeExtensionRegistry` (Phase 40). `MARKDOWN_EXTENSIONS` env-var dispatch: `default` (or unset) / `wikilinks` / `tables` / `wikilinks,tables` (comma-separated composition).
- **Image processing** — `sharp@0.34.5` (server-side) in [`lib/storage/putAvatar`](./lib/storage/index.ts) for EXIF stripping + auto-rotation. ADR-0019.
- **Content moderation framework** — [`lib/moderation/`](./lib/moderation/) (5 files; Phase-35 framework-only ADR-0024): `ContentModerator` interface + `NoopModerator` default + 4-surface integration (bio + avatar + rating-challenge + subscribe). `MODERATION_PROVIDER` env-var dispatch awaits ADR-0025 concrete provider commit.
- **Subscriber-list email** — [`lib/email/`](./lib/email/) (Phase 30 ADR-0021 foundation; Phase 31 ADR-0022 weekly digest scheduler via Vercel Cron; Phase 33 ADR-0023 per-user-account subscriptions). 3 email templates (verification + welcome + digest); 2 cron entries in [`vercel.json`](./vercel.json).
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
| `pnpm db:generate` / `db:migrate` / `db:studio` | drizzle-kit (9 migrations to date)                                         |
| `pnpm lint` / `lint:fix`                        | ESLint 9                                                                   |
| `pnpm format` / `format:check`                  | Prettier 3                                                                 |
| `pnpm test:e2e`                                 | Playwright (chromium)                                                      |
| `pnpm lhci`                                     | Lighthouse CI                                                              |
| `pnpm storybook`                                | Storybook 10                                                               |

## Operational gates (pending curator action)

Architecture is ≥90% complete; deployment unblock pending curator action on the operational side:

- **Q2 / Q3** — DNS + hosting decision (the stack assumes Vercel; `llm-openproblems.org` is the §5.10 placeholder).
- **Q54** — register the GitHub OAuth app and populate `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` + `AUTH_SECRET` (one app for prod, one for local dev).
- **Q55** — provision the production Turso DB and populate `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- **Q69** — create the Vercel Blob store; `BLOB_READ_WRITE_TOKEN` is auto-injected by `vercel env pull`.
- **Q73** — register the Google OAuth app (Phase 23 ADR-0020) and populate `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`.
- **Q75** — verify the Resend sender domain (Phase 30 ADR-0021) and populate `RESEND_API_KEY` + `RESEND_FROM`.
- **Q77** — populate `CRON_SECRET` for Vercel Cron (Phase 31 ADR-0022) and configure the scheduled invocations.

The env contract is at [`.env.example`](./.env.example); see also [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) Q54 / Q55 / Q69 / Q73 / Q75 / Q77 for detailed operational unblock paths.

## Reading order for new contributors

1. [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) — the constitution. Read end-to-end before touching anything.
2. [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) — load-bearing decisions awaiting the human (66 top-level Qs: 28 resolved + 4 lean + 34 open; UNCHANGED since Phase 36).
3. [`docs/PROGRESS_SUMMARY_2026-05-18.md`](./docs/PROGRESS_SUMMARY_2026-05-18.md) — narrative progress summary + remaining-workload estimate at Phase 40 close.
4. [`docs/adr/`](./docs/adr/) — accepted architecture decisions (0001–0024). Each ADR is immutable post-acceptance; corrections ship as a superseding ADR per the ADR-0005 pattern. ADR-0018 D-G accumulates 7 APPENDs documenting the markdown-extension framework family.
5. [`docs/CURATION_PROMPT.md`](./docs/CURATION_PROMPT.md) — the parallel-curator workflow contract.
6. [`docs/PAPER_INGEST_RUNBOOK.md`](./docs/PAPER_INGEST_RUNBOOK.md) — single-session step-by-step for the `ingest-arxiv` → review → commit pipeline.
7. The most recent `docs/SESSION_HANDOFF_*.md` (currently [`docs/SESSION_HANDOFF_2026-05-18_phase-40-close.md`](./docs/SESSION_HANDOFF_2026-05-18_phase-40-close.md)) — paste-into-fresh-session resume payload with the full live ledger.
8. [`docs/thinking/`](./docs/thinking/) — per-unit THINK artifacts (§15.1 of the master prompt). The `<phase>.0-phase-N-prep.md` and `<phase>.<n>-phase-N-acceptance-gate.md` files frame each phase end-to-end.
9. [`CHANGELOG.md`](./CHANGELOG.md) — every unit with file paths and rationale (~7500 lines).

## Development workflow rhythm

- One unit at a time: **THINK** (`docs/thinking/<unit>.md`) → **DESIGN** (ADR if architectural) → **CODE** → **ITERATE** (smoke gates) → **CHANGELOG** → **commit**. Don't batch.
- Commit message header ≤ 100 chars (commitlint enforces). Prefix per [Conventional Commits](https://www.conventionalcommits.org/): `chore(phase-N): unit N.X — <title>` for scaffolding / infra; `docs(phase-N): ...` for docs-only units.
- Phase boundaries require explicit human sign-off per `MASTER_PROMPT.md` §12 (a "Continue" override is the documented escape valve; **35 invocations** across Phases 6-40).
- Pre-commit hooks: ADR-0005 rating-action immutability check (blocks `M` / `D` / `R` / `C` on `content/problems/*/ratings/*.yaml` — only net-new files pass) → lint-staged → `pnpm test`. Never `--no-verify`.
- Windows note: Bash tool for git; PowerShell for `pnpm`. CRLF-only diffs are benign; `prettier-plugin-tailwindcss` reorders Tailwind classes on commit (do not revert).

## License

- **Code** (`app/`, `components/`, `lib/`, `scripts/`, configs) is licensed under **Apache-2.0** — see [`LICENSE`](./LICENSE).
- **Content** (`content/` — `taxonomy.yaml`, problems, papers, authors, institutions, methodology) is licensed under **CC-BY-4.0** — see [`content/LICENSE.md`](./content/LICENSE.md).

Q4 resolved in Unit 1.0 (2026-05-14); Apache-2.0 picked over MIT for the explicit patent grant, given the project intends a citable methodology paper.
