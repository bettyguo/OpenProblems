# ADR-0004 — File-first storage; no database through Phase 3

- **Status:** accepted
- **Date authored:** 2026-05-14
- **Date accepted:** 2026-05-14
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

MASTER_PROMPT.md §5.7 mandates file-first storage through Phase 3: every problem, paper, author, institution, taxonomy entry, and rating action lives as YAML/JSON/MDX in `content/`, validated by Zod (ADR-0003) at build time. A static JSON snapshot is emitted for the client. A database is introduced only when (a) write paths are needed (submissions) or (b) the gzipped snapshot exceeds ~5 MB.

The decision codifies *not introducing a DB* — i.e., explicitly recording the trigger conditions, so a future contributor cannot quietly "just add Postgres" without invoking an ADR.

## Decision Drivers

- **Editorial workflow = PR workflow.** Every change (new problem, new rating action, new paper) is a git commit with a diff that a curator reviews. This is the project's audit-log story (§3.1 "every rating action logged"); a DB makes this materially worse, not better, in Phase 1–3.
- **No infra cost or ops burden.** A static site on Vercel costs $0 in Phase 1–3; a DB adds a recurring cost and an operational dependency.
- **Build-time validation completeness.** With files, the `validate-content` script (Unit 0.7) sees every record and can fail the build on any schema drift. With a DB, validation is at write time only; historical records can rot.
- **Rating-action immutability (ADR-0005).** Trivial to enforce with files (git history + a hook); requires audit tables and triggers with a DB.
- **Reversibility.** A file-first project that wants a DB later can migrate. A DB-first project that wants to dump back to files can also migrate, but the latter is rarely worth the work — and there's no scenario in Phase 1–3 that makes "DB-first" necessary.
- **Snapshot size.** Phase 1 content is ~10 problems × ~5 files; well under 100 KB. The 5 MB gz trigger is at ~50–100× the Phase 1 size — comfortably distant.

## Considered Options

1. **File-first, all content in `content/`** (chosen).
2. **SQLite (Turso/libSQL) from day one** — small, file-shaped on disk, embeddable.
3. **Postgres (Neon / Supabase) from day one** — full RDB.
4. **Hybrid: prose in files, structured (problem.yaml, ratings, entries) in DB** from day one.

## Decision Outcome

**Chosen: Option 1 — file-first; no DB through Phase 3.**

Files give us the audit log, the PR-review workflow, the build-time validation, and the zero-ops deployment story all without paying for a runtime layer we don't yet need. The 5 MB-gz trigger and the "write path needed" trigger are both honest signals of when this stops being optimal.

Triggers for re-evaluation (which would be a superseding ADR, e.g., ADR-00NN, not an edit to this one):

- The gzipped `.velite/` snapshot exceeds **5 MB**. (Set up in CI as a hard threshold in Unit 0.11.)
- We need a **write path** (submissions UI, on-site rating-challenge form). Per §13 Phase 4 this is when auth (NextAuth.js v5 or Clerk per §5.8) is also introduced.
- **Editorial volume** crosses ~20 commits/day, at which point branch coordination outweighs DB merge ergonomics.

### Consequences

- **Positive:** Every content change is a reviewable git commit with a diff. Rating-action history is git history.
- **Positive:** Zero infra cost and zero ops burden in Phase 1–3.
- **Positive:** Build-time validation sees every record on every build. Schema drift fails CI immediately.
- **Positive:** Local dev = clone + `pnpm dev`. No DB migration to run, no seed to load.
- **Negative:** No write path on the site itself; submissions in Phase 1–3 are GitHub issues (templates land in Phase 4 per §13).
- **Negative:** Authorless aggregate computations (cumulative author scores, institution leaderboards in Phase 2) must be done at build time by `scripts/compute-aggregates.ts`. This is fine but means a small content edit triggers a full rebuild.
- **Negative:** At 10× content scale (~100 problems × ~30 papers each), build times will grow. Mitigation: Velite incremental builds; reassess at the 5 MB trigger.

## Pros and Cons of the Options

### Option 1 — File-first

- Good — editorial workflow = PR workflow.
- Good — rating-action immutability (ADR-0005) is enforced by treating commits as the audit log.
- Good — zero ops cost; static deployment.
- Good — build-time validation completeness.
- Bad — no on-site write path; submissions live on GitHub until Phase 4.
- Bad — full rebuild for any content change (mitigated by Velite incremental builds).

### Option 2 — SQLite (Turso / libSQL) from day one

- Good — minimal ops; file-shaped on disk; embeddable; cheap.
- Bad — adds a layer (DB, ORM, migrations) we don't need yet for read workloads.
- Bad — loses the "every change is a git diff a curator reviews" workflow.
- Bad — schema drift is detected on write, not on every build.

### Option 3 — Postgres from day one

- Good — eventual destination if write paths and aggregate queries arrive.
- Bad — every advantage of Option 2 with more cost and more ops.
- Bad — premature; locks in a deployment shape (or a hosted provider) before we have the workload to justify it.

### Option 4 — Hybrid (prose in files, structured in DB)

- Good — keeps MDX in git for editor-review.
- Bad — worst of both worlds: two systems of truth to keep consistent; the cross-link audit script (§13 Phase 2) becomes materially harder; migrations and content reviews are split.
- Bad — premature optimization in the same way as Options 2 and 3.

## Links

- MASTER_PROMPT.md §5.7, §5.8, §13 Phase 4, §14.3.
- Related: ADR-0002 (Velite produces the snapshot), ADR-0003 (Zod validates the files), ADR-0005 (rating actions immutable as files).
