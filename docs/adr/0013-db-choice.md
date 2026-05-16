# ADR-0013 — Database: Turso (libSQL/SQLite) + Drizzle ORM

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §5.7 ("Data layer (deferred)") says:

> Phase 4: introduce **SQLite via [Turso/libSQL]** or **Postgres via [Neon]** + **Drizzle ORM**. Triggered when (a) we need write paths (submissions) or (b) JSON snapshot exceeds ~5MB gzipped.

[ADR-0004](./0004-file-first-no-db.md) (Phase 0) pinned the no-DB-through-Phase-3 posture. Units 4.12 / 5.10 / 6.0 / 7.0 / 8.0 D-2 re-eval'd the migration trigger every phase boundary; each logged "still cold; flips on first auth write-path." [Unit 9.0 D-2](../thinking/9.0-phase-9-prep.md) re-eval'd at Phase 9 kickoff: 1.656% of the 5 MB threshold (cold for trigger (b)); **trigger (a) FIRES on Unit 9.6's watchlist write-path** — the auth thread requires user + session persistence.

§5.7 names two candidates plus the ORM:
- **SQLite via Turso/libSQL** (edge-replicated; sqld server)
- **Postgres via Neon** (serverless Postgres; branching)
- **Drizzle ORM** (the ORM choice; not negotiable per §5.7)

This ADR closes the DB-engine axis. The ORM (Drizzle) is treated as a fixed input — §5.7 already pinned it; deferring Drizzle would require a new ADR.

[ADR-0012](./0012-auth-provider.md) (Unit 9.1) pinned NextAuth.js v5 + Drizzle-adapter-backed sessions. The Drizzle adapter is engine-agnostic (works with libsql or pg); this ADR pins which engine the adapter sits on.

## Decision Drivers

- **§5.7** explicit recommendation: SQLite/Turso OR Postgres/Neon; Drizzle ORM.
- **ADR-0004** file-first / no-DB-for-content posture preserved: this ADR lands a USER-STATE DB layer; `content/` stays file-first.
- **ADR-0012** D-C: DB-backed sessions via Drizzle adapter. Per-request DB read on every `auth()` call → latency matters.
- **Performance budget** (§10.4 / Phase-9 carryover): First Load JS held at 103 kB; LCP < 1.8s on slow 4G. DB latency adds to SSR time-to-first-byte.
- **§5.10** deployment = Vercel. Both Turso and Neon work on Vercel; preview-deploy ergonomics differ.
- **Scale** (Phase-9 horizon): 10 problems / 30 papers / 126 authors → user count probably < 100 in Phase 9; might reach 1k by Phase 12; not architecturally constrained by either engine.
- **Pricing** at scale: Turso free tier (8 GB / 1 billion row reads / 500 databases) generous; Neon free tier (0.5 GB / 191 compute-hours/month) tighter but still adequate for the project's horizon.
- **Operational complexity**: SQLite has a "single-file" mental model (local dev = a file under `.gitignore`); Postgres requires a running server even for local dev (Docker or local install).
- **Local-first / file-first ethos**: SQLite pairs naturally with `content/`-as-files (both flat-file).
- **Reversibility**: Drizzle ORM is engine-agnostic in principle (the schema definitions look similar between libsql and pg). Migration path between engines is non-trivial but not catastrophic.

## Considered Options

### Option 1: Turso (libSQL/SQLite) + Drizzle (chosen)

[Turso](https://turso.tech) is SQLite-as-a-service: edge-replicated `libsql` (SQLite fork with extensions) accessed via the `@libsql/client` HTTP / WebSocket protocol; Vercel-edge-friendly. Local dev uses a plain SQLite file (`file:./local.db`).

- **Pros:**
  - §5.7 explicitly lists Turso/libSQL.
  - Edge-native: replica per Vercel region; reads from the nearest replica (< 10ms latency).
  - SQLite ergonomics: single-file local dev; pairs naturally with `content/`-as-files (ADR-0004 ethos).
  - Free tier amply covers project scale (8 GB storage / 1B row reads / 500 databases; project horizon < 100 MB total).
  - Drizzle `libsql` adapter (`drizzle-orm/libsql`) mature.
  - No cold-start latency (Turso's replicas are always warm).
  - Branching via the Turso CLI (`turso db branch create <name>`) for preview deploys (Phase 10+ usage).
- **Cons:**
  - SQLite feature subset (no `JSONB`, no GIN indexes, no `ARRAY` columns; JSON1 extension only).
  - No advanced full-text search (would need to add an external index later; project Phase-1 already ships Fuse.js for search).
  - Row-level locking is coarser than Postgres MVCC (Phase-9 scale: not a concern).
  - Vendor coupling to Turso (mitigated: libSQL is open-source; data is portable to any SQLite host).

### Option 2: Neon (Postgres) + Drizzle

[Neon](https://neon.tech) is serverless Postgres on Vercel; branching per Git branch via the Neon-Vercel integration.

- **Pros:**
  - §5.7 explicitly lists Neon.
  - Postgres feature-complete: `JSONB`, GIN, full-text search (`tsvector`), `ARRAY`, materialized views, etc.
  - Branching for preview deploys is first-class.
  - Drizzle `node-postgres` adapter (`drizzle-orm/node-postgres`) mature.
  - Industry-standard Postgres knowledge transfers (every dev shop knows pg).
- **Cons:**
  - Cold-start latency on serverless (~200-500ms first request after idle); Turso doesn't have this.
  - Free tier tighter (0.5 GB storage / 191 compute-hours/month) — adequate for Phase 9 but tighter ceiling.
  - Local dev requires running Postgres (Docker or local install); SQLite is just a file.
  - Postgres feature-richness is overkill for Phase 9's user-state needs (sessions, users, watchlist — no JSON columns, no full-text-search, no array columns).
  - Less aligned with the file-first ethos (a real DB server vs a flat file).

### Option 3: Vercel Postgres (managed Neon)

Vercel-hosted Neon instance, configured from Vercel UI.

- **Pros:**
  - Zero-config from Vercel UI (auto-provisions `POSTGRES_URL` env var).
  - Same Postgres feature set as Neon-direct.
- **Cons:**
  - Vendor coupling (Vercel + Neon stacked).
  - Pricing higher than Neon-direct.
  - Less control (Vercel's defaults vs Neon's full config UI).
  - Doesn't add value over Option 2 except convenience.

### Option 4: Defer the DB (split Phase 9)

Ship Unit 9.1's auth ADR-0012 in Phase 9 BUT defer the DB to Phase 10; use in-memory or file-system stubs for sessions during Phase 9 development.

- **Pros:**
  - Smaller Phase 9 scope.
  - Buys more time to evaluate Turso vs Neon.
- **Cons:**
  - NextAuth.js v5's Drizzle adapter requires a real DB.
  - In-memory sessions don't persist across server restarts (catastrophic for SSG-deployed Vercel functions).
  - File-system stubs would require custom NextAuth adapter implementation (significant unit count).
  - §5.7's "first write-path triggers DB migration" rule is unambiguous; deferring is hand-waving.
  - Q54 (OAuth app registration) is the only Phase-9 operational gate; DB doesn't have an analogous unblock.

## Decision Outcome

**Chosen: Option 1 — Turso (libSQL/SQLite) + Drizzle ORM (`drizzle-orm/libsql`).**

The decision pins six concrete contracts:

### D-A. DB engine = libSQL (Turso) / SQLite-compatible

`@libsql/client@^0.x` is the only DB driver in `package.json` (`dependencies`). The `drizzle-orm/libsql` adapter is the SQL-builder layer. Other DB drivers (`pg`, `mysql2`, `better-sqlite3`) are **forbidden** in `dependencies` or `devDependencies` until a follow-on ADR authorises multi-engine work.

Connection string format: `libsql://<database>.turso.io` (production) OR `file:./local.db` (local dev). The connection string lives in `process.env.TURSO_DATABASE_URL`; the auth token in `process.env.TURSO_AUTH_TOKEN` (production only; local dev needs no token).

### D-B. ORM = Drizzle (`drizzle-orm@^0.x`)

Per §5.7. Drizzle-Kit (`drizzle-kit@^0.x`) handles migrations via `pnpm db:generate` (generates SQL from the TypeScript schema) + `pnpm db:migrate` (applies pending migrations).

Schema definitions live in `lib/db/schema.ts` (TypeScript-first; types flow into queries). Generated SQL migrations live in `lib/db/migrations/` (committed to git; each migration named `<NNNN>_<kebab-case-title>.sql` matching Drizzle's default convention).

Migration discipline: every schema change ships as a NEW migration file (never edit existing migrations after they've been applied to any deployed database). Mirrors ADR-0005's rating-action-immutability ethos.

### D-C. Local-dev DB = file-system SQLite at `local.db`

Local dev creates `local.db` in the repo root via `pnpm db:migrate` on first setup. The file is `.gitignore`d; new contributors run `pnpm db:migrate` to seed locally.

`local.db` is a real SQLite file (not Turso); the `@libsql/client` SDK handles both. The schema is identical to production; the data is local-only.

### D-D. Production DB = single Turso database (single-tenant)

One Turso database per environment (production + preview). Branching (Turso's per-Git-branch feature) deferred to Phase 10+ if preview deploys diverge significantly.

Free tier covers project horizon: 8 GB storage (project will use < 100 MB in Phase 9-12); 1 billion row reads/month (project will use < 1M); 500 databases (one suffices).

Tier upgrade triggers (deferred per [Q55](../../OPEN_QUESTIONS.md#q55-db-hosting-tier-for-production)): user count > 10k MAU; row count > 1M per table; storage > 6 GB.

### D-E. Migration cadence

Phase-9 migrations (drizzle-kit 0-indexed monotonic sequence — **Unit 9.8 reconciliation**: original ADR-0013 prose used 1-indexed names; actual landed filenames are 0-indexed per drizzle-kit's convention; corrected inline):

1. **`0000_initial_auth`** (Unit 9.3): creates `user`, `account`, `session`, `verificationToken` (NextAuth.js v5 canonical schema) + `githubLogin` text-unique column on `user`.
2. **`0001_watchlist`** (Unit 9.6): creates `watchlist` table per [Q56](../../OPEN_QUESTIONS.md#q56-watchlist-table-key-shape) (`userId` + `problemSlug` composite primary key; FK only on `userId` with `ON DELETE cascade`; no FK on `problemSlug`).

Future migrations (Phase 10+) follow the same 0-indexed monotonic ordering (`0002_...`, `0003_...`, etc.). Migration filenames are immutable per D-B; corrections land as NEW migrations that explicitly undo (or refine) earlier ones (mirrors ADR-0005's rating-action-immutability ethos applied to schema evolution).

### D-F. No write-paths against content tables

The DB stores **user-state only** (sessions, users, watchlist, future rating-challenge drafts, future user preferences). It does NOT store content (problems, papers, authors, institutions, taxonomy, rating-action history, methodology, contributing) — those stay file-first per [ADR-0004](./0004-file-first-no-db.md).

Cross-references between DB rows and content files use string keys (e.g., `problem_slug` in `watchlist` is a TEXT column with no FK; references the file-system slug). Orphan rows (problem_slug pointing at a deleted problem.yaml) are tolerated until a cleanup script lands (deferred follow-on).

## Consequences

### Positive

- **File-first / no-DB-for-content** (ADR-0004) preserved: the DB layer is USER-STATE only.
- **Edge-native latency**: Turso replicas per Vercel region; reads < 10ms.
- **Local-dev ergonomics**: SQLite file under `.gitignore`; no Docker / Postgres server required.
- **§5.7 explicit recommendation honored**: Turso/libSQL listed as a candidate.
- **Free tier amply covers project horizon**: 8 GB storage / 1B row reads / 500 databases.
- **Drizzle ORM** type-safe; schema-first; migration discipline matches ADR-0005's immutability ethos.
- **Reversibility**: Drizzle ORM is engine-agnostic in principle (libsql ↔ pg swap is a one-adapter-edit refactor; not catastrophic).
- **Migration cadence** documented (every change is a new migration file; no edits to applied migrations).
- **Operational unblock surface is small**: env vars (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) + first-time setup ([Q55](../../OPEN_QUESTIONS.md#q55-db-hosting-tier-for-production)) — same shape as Q47 + Q54.

### Negative

- **SQLite feature subset**: no `JSONB`, no GIN, no `ARRAY` columns. If a Phase-10+ feature requires those (full-text-search beyond Fuse.js, complex JSON queries), we'd need a `text` column + app-side JSON parsing OR a Postgres migration.
- **Vendor coupling**: Turso-specific protocols / branching CLI. Mitigated by libSQL being open-source (data is portable to any SQLite host).
- **Drizzle is younger than alternatives** (Prisma, TypeORM, Sequelize). Surface: type-narrowing edge cases on complex queries; migration tooling occasionally has rough edges. Mitigated: Drizzle's stable v0.x has been production-deployed at scale by Vercel + many startups.
- **No automatic preview-deploy DB branching** in Phase 9: all preview deploys share the production DB initially. Branching deferred until preview-deploy data divergence becomes a real pain point.
- **Local-dev `local.db` not committed**: new contributors run `pnpm db:migrate` on first setup. Documented in `/contributing` v1.x update (future curator-track task).

## Cross-references

- **§5.7** data-layer recommendation (SQLite/Turso OR Postgres/Neon; Drizzle ORM).
- **§5.10** deployment = Vercel (Turso edge-replicated; Vercel-friendly).
- **ADR-0004** file-first / no-DB-for-content (this ADR lands USER-STATE DB; content stays file-first).
- **ADR-0005** rating-action immutability (mirrors the "applied migrations are immutable" discipline in D-B).
- **ADR-0012** auth provider (NextAuth.js v5 + Drizzle adapter; this ADR specifies the engine the adapter sits on).
- **Phase-1 Fuse.js search** (search stays Fuse.js for problems / papers / authors; the DB doesn't replace search).
- [OPEN_QUESTIONS Q55](../../OPEN_QUESTIONS.md#q55-db-hosting-tier-for-production) (operational; tier upgrade trigger).
- [OPEN_QUESTIONS Q56](../../OPEN_QUESTIONS.md#q56-watchlist-table-key-shape) (decided-as-lean; schema FK posture for content references).
