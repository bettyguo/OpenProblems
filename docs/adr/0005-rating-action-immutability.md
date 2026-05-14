# ADR-0005 — Rating-action immutability

- **Status:** accepted
- **Date authored:** 2026-05-14
- **Date accepted:** 2026-05-14
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

The conceptual core of LLM OpenProblems is that it occupies the same slot for AI-research open problems that S&P / Moody's / Fitch occupy for sovereign debt (MASTER_PROMPT.md §3.1). The defining property of those institutions' output is *not* the rating itself — it is the **rating action log**: a public, time-stamped, never-rewritten record of every change, with prior → new state on every affected dimension and a rationale.

If an entry in our ratings log can be silently rewritten, the brand is dead. §6 already states "**Rating actions are immutable. New action = new file. Never edit a past rating action.**" This ADR codifies the *enforcement* of that rule so the system, not vigilance, prevents drift.

A rating action's filename encodes its date and the change it captures, e.g., `content/problems/<slug>/ratings/2026-05-14-initial.yaml`, `2026-08-01-upgrade-saturation.yaml` (example from §6). Each action references the previous action it supersedes via `prior_action` (Zod-validated, per §7.2).

## Decision Drivers

- **Methodological credibility.** §3.1: "must not be diluted." §8 ("Rating Methodology v1.0") is intended to be publishable; a publishable methodology cannot have a mutable audit trail.
- **Auditability.** A curator three years from now must be able to reproduce why a given problem held a given rating on a given date. This requires that historical files survive untouched.
- **Versioning of methodology.** §8.1: "A rating produced under v1.0 is never silently re-graded by v1.1." Immutability of *the rating action that was produced under v1.0* is the mechanism that enforces this.
- **Conflict-of-interest enforceability.** §8.6: a curator with a top-5 leaderboard entry is barred from rating that problem. If past actions are mutable, COI violations can be retroactively hidden.
- **§15.6 sticky rule** for Claude Code: "Never silently change schemas; bump a version field and write a migration." Rating actions are the runtime instance of the schema; same discipline applies.

## Considered Options

1. **Immutable file-per-action**, enforced by a pre-commit hook + validate-content rule (chosen).
2. **Mutable single rating file with embedded history array** — one YAML per problem with an internal `history: []`.
3. **Database row with audit table** — primary table is mutable, audit table is append-only.
4. **Git history alone as the audit trail** — accept that files *could* be edited, trust `git log` to preserve the truth.

## Decision Outcome

**Chosen: Option 1 — immutable file-per-action, enforced.**

Enforcement has three layers:

1. **Filesystem convention.** `content/problems/<slug>/ratings/<ISO-date>-<short-slug>.yaml`. One action per file. The validate-content script (Unit 0.7) refuses to validate a rating-action file whose filename doesn't parse.
2. **Pre-commit hook** (Husky, lands at Unit 0.8). Forbids modifying or deleting any file in `content/problems/*/ratings/` that exists in `HEAD`. Only file additions are permitted in that path. A bypass is possible (`--no-verify`), but conspicuous in a PR diff.
3. **CI gate** (Unit 0.11). Same check runs as a hard CI gate; `--no-verify` doesn't bypass CI.

Edits to past rating actions are not just discouraged — they are mechanically impossible in the normal workflow. A correction is published as a *new* rating action that explicitly cites the prior one (via `prior_action` per §7.2) and explains the correction in the `rationale` field of each amended dimension.

### Consequences

- **Positive:** The rating-action log is provably untamperable in the normal workflow. The system, not vigilance, prevents drift.
- **Positive:** §8.1 methodology-versioning rule ("v1.0 ratings are never silently re-graded by v1.1") is enforced for free: a v1.0 action file simply remains on disk after v1.1 is published, and v1.1 introduces *new* action files.
- **Positive:** Cross-reference structure (`prior_action`) gives the UI a natural diff-shaped view ("here's what changed and why") for the `/ratings` global feed and the problem's `/ratings` sub-page (§13 Phase 3).
- **Negative:** Typos in past rating actions cannot be silently fixed. They must be amended by a new action whose rationale acknowledges the typo. This is a *feature*, not a bug, for the audit log.
- **Negative:** Bulk renames or refactors of rating-action filenames are blocked. Mitigation: such operations require a documented migration ADR and a temporary CI exception.
- **Negative:** A first-time contributor who edits a past rating action by mistake gets a confusing local error. Mitigation: the pre-commit hook prints a one-paragraph explanation pointing to this ADR.

## Pros and Cons of the Options

### Option 1 — Immutable file-per-action (enforced)

- Good — audit log is mechanically untamperable.
- Good — git history *and* filesystem layout both encode the immutability invariant; redundant guards.
- Good — natural fit with ADR-0004 (file-first) and ADR-0002 (Velite consumes the files).
- Bad — typos in past actions require an amending action, not an edit.
- Bad — operational rename / refactor of rating filenames requires a migration ADR.

### Option 2 — Mutable single rating file with embedded history array

- Good — fewer files; one place to look for a problem's full history.
- Bad — *every* rating event rewrites the same file in git history, defeating the "git diff per action" workflow.
- Bad — nothing structural prevents a future contributor from editing past entries in the array.
- Bad — Velite-emitted JSON is denormalized; the global `/ratings` feed must reconstruct individual events from differences, fragile.

### Option 3 — DB row with audit table

- Good — append-only audit tables are standard.
- Bad — violates ADR-0004 (file-first through Phase 3) without justifying the trigger.
- Bad — adds infra burden purely to enforce immutability that a file convention enforces for free.

### Option 4 — Git history alone

- Good — simplest.
- Bad — git history is a *recovery* mechanism, not a *prevention* mechanism. A force-push to `main` (or a squash-merge that drops the history of a past rating action) loses the audit trail.
- Bad — readers of the site cannot see git history; they see the rendered files. If a file is silently edited and the site rebuilt, no signal reaches the reader.
- Bad — fails the "system, not vigilance" test.

## Links

- MASTER_PROMPT.md §3.1, §6 (rules), §7.2 (rating-action schema), §8.1, §8.5, §8.6, §15.6.
- Related: ADR-0004 (file-first storage makes this enforceable), ADR-0002 (Velite reads the action files), ADR-0003 (Zod validates `RatingActionSchema`).
