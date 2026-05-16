# ADR-0014 — Curator review pipeline (state machine + env-var authz + manual YAML emission)

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §3.1 frames the project as a "credit rating agency for AI research problems" where **"ratings are revisable"** and §8.6 mandates a curator-side **conflict-of-interest policy**. Phase 11 shipped the submission half of that loop ([Unit 11.0–11.7](../thinking/11.0-phase-11-prep.md)): any signed-in user can challenge any rating dimension by submitting a `dimension` / `proposedValue` / `rationale` triple, persisted in the `ratingChallenge` Drizzle table. The submission lands as `status = "submitted"`; no machinery exists today to **review** challenges, **transition** them through statuses, or **emit** the eventual rating-action YAML on acceptance.

Phase 12 closes this loop per [Unit 12.0 D-1](../thinking/12.0-phase-12-prep.md): the **curator review pipeline** is Phase 12's keystone thread, named in [Unit 11.6](../thinking/11.6-open-questions-hygiene.md) ([Q57](../../OPEN_QUESTIONS.md#q57-rating-challenge-curator-review-pipeline-shape)) + [Unit 11.7 acceptance gate](../thinking/11.7-phase-11-acceptance-gate.md) as the "strongest claim by sequential thread-closure precedent". Three architectural surfaces converge:

1. A multi-state **lifecycle** for `ratingChallenge` rows — `submitted → under_review → accepted | rejected | withdrawn` plus fast-lane shortcuts.
2. A **second authorization tier** beyond signed-in: the curator allowlist that gates the review surface. Phase 9–11 had a single tier (signed-in via GitHub OAuth); Phase 12 introduces "curator" as a strict subset of signed-in users.
3. A **§8.6 conflict-of-interest** enforcement surface on the review side. Phase 11's submission side did not enforce COI (submission is community-side; anyone can submit); Phase 12's review side MUST refuse curator review where COI applies.

Plus the operational tail: when a challenge is `accepted`, a new **rating-action YAML** has to land in `content/problems/<slug>/ratings/<date>-<slug>.yaml` (per [ADR-0004](./0004-file-first-no-db.md) file-first + [ADR-0005](./0005-rating-action-immutability.md) immutability). Vercel's runtime filesystem is read-only; the YAML write must happen out-of-band (via the curator's local git workflow) or via an API-side commit through GitHub Contents API. The phase has to pick.

Decisions to pin in this ADR:

1. **What is the state machine?** Which transitions are allowed, by whom, and when?
2. **How is curator identity established?** DB column on `users`? Env var allowlist? `curatorRoles` table?
3. **How is the §8.6 COI rule enforced?** Verbatim from §8.6 (24-mo collaborator check), simplified, or punted?
4. **How does an accepted challenge become a rating-action YAML?** Manual? CLI? API-side commit?
5. **What is the route shape?** Single-page inline? List + detail? Where does middleware-based protection (Phase-9 Class B item 12) come in?
6. **How does schema evolution work?** Phase 12 is the project's first **ALTER** migration — every prior migration has been a fresh `CREATE TABLE`. What discipline applies?

[Q57](../../OPEN_QUESTIONS.md#q57-rating-challenge-curator-review-pipeline-shape) (open architectural) is the catch-all parent of these sub-questions. This ADR closes Q57 by pinning each sub-question concretely.

## Decision Drivers

- **§3.1** "ratings are revisable" — the lifecycle has to support reversibility-of-rating without itself being reversible-of-acceptance (mirrors ADR-0005's immutability spirit applied to challenge decisions).
- **§8.6** COI policy — verbatim is the gold standard; simplifications must be justified by usage-shaped pragmatism, not by avoidance.
- **§13** editorial workflow — accepted challenges fold into the rating-action history that §13 lists as a public RSS-fed surface. The emission step is editorially load-bearing.
- **[ADR-0004](./0004-file-first-no-db.md) + [ADR-0005](./0005-rating-action-immutability.md)** preserved: content stays file-first; rating-action YAMLs remain immutable; the DB tracks USER-STATE + REVIEW-STATE only.
- **[ADR-0012](./0012-auth-provider.md) D-D** redirect-to-provider UX + **D-E** `users.githubLogin` joining to file-system curator-of-record — both prerequisites; Phase 12 builds on the established auth surface without amendment.
- **[ADR-0013](./0013-db-choice.md) D-B** migration immutability — applied migrations are never edited; column adds land as new migration files. Phase 12 is the first **ALTER** migration in project history; this ADR codifies the discipline.
- **§5.7 trigger (a)** ALREADY FIRED in Unit 9.6; Phase 12 adds NO new tables (the ALTER is additive); no further trigger evaluation needed.
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB end-to-end through Phase 9–11; curator dashboard must not regress.
- **§15.5 reviewer-mode mindset** — "could a future curator misuse this surface?" — applied to BOTH the curator dashboard (curator can mis-accept) and the submitter side (submitter can mis-withdraw).
- **Phase-9 Class B item 12** (middleware-based auth-route protection) — threshold = 3+ protected page routes. Phase 12 brings the count to 2 (profile from Phase 10; curator dashboard from Phase 12); lift is still deferred.
- **Phase 12 scope cap** (Unit 12.0 D-1 + scope discipline) — 9 units; curator-side ONLY; Q58 public visibility deferred to Phase 13+; full §8.6 24-mo COI deferred to Phase 13+; CLI/API emission automation deferred to Phase 13+/14+.
- **§14.4** CHANGELOG + ADR contract: pin the choice with Pros/Cons before code lands.

## Considered Options

### Option 1: Multi-state lifecycle + env-var authz + manual emission + page-local auth + ALTER discipline (chosen)

The recommendation in [Unit 12.0 D-1 through D-12](../thinking/12.0-phase-12-prep.md). 7-transition state machine; `LOP_CURATOR_LOGINS` env var CSV allowlist for the second authz tier; simplified COI (hard block on curator = submitter; soft warn on curator = `primary_curator`; full 24-mo collaborator check deferred); manual YAML emission (curator commits out-of-band; UI surfaces "Attach action YAML" form to set `acceptedActionId`); page-local auth checks (middleware lift deferred until 3+ protected page routes); ALTER migration discipline mirroring ADR-0013 D-B.

- **Pros:**
  - Closes [Q57](../../OPEN_QUESTIONS.md#q57-rating-challenge-curator-review-pipeline-shape) with a concrete architectural pin.
  - Honors Phase-11 forward references (Unit 11.0 D-3 + D-4 + Unit 11.6 Q57 + Unit 11.7 acceptance-gate cite — three references converging on this thread).
  - Env-var authz is bootstrap-friendly (no DB-side seeding; mirrors Q47 Discussions operational-gate pattern); auditable (env changes flow through deploy logs); reversible (revoke = remove from CSV + restart).
  - Manual YAML emission preserves ADR-0004 file-first ethos + ADR-0005 immutability spirit; sidesteps Vercel's read-only runtime filesystem; respects §13's curator-as-author chain.
  - Simplified COI catches the most common risk (self-review) without requiring the multi-hop DB-↔-file-system join that the full §8.6 check needs.
  - Page-local auth checks reuse the Phase-10 `/profile` pattern; middleware-lift threshold (3+ page routes) is deferred without regressing existing routes.
  - ALTER migration discipline crystallizes the schema-evolution playbook that Phases 13+ will reuse.
  - Phase 12 scope stays tight (9 units; matches the 8–10-unit envelope established by Phases 9 + 11).
- **Cons:**
  - Manual YAML emission means a two-step curator workflow (Accept in UI → commit YAML out-of-band → return to UI to attach filename). Higher friction than automated emission.
  - Env-var authz means adding a new curator requires a Vercel env-var update + deploy restart (not a UI action). Acceptable for project's Phase-12 curator pool size (≤ 5 expected); friction grows at Phase 14+ editorial-board scale.
  - Simplified COI may surface edge cases (e.g., curator-X has a collaborator-paper from 18 months ago on the problem's benchmark; full §8.6 would block, simplified does not). Mitigation: the `reviewNotes` field requires curators to explain decisions, surfacing reviewer accountability.
  - First ALTER migration in project history; drizzle-kit's `ALTER TABLE` generation has edge cases for SQLite (FK with `ON DELETE SET NULL` isn't always emitted cleanly). Mitigation: manual SQL inspection of the generated migration; correct in-place before commit.
  - Phase-12 scope keeps Q58 public visibility out — submitters see status updates via profile-page (pull-based), but non-submitters see nothing until Phase 13+. Acceptable per [Unit 12.0 D-10](../thinking/12.0-phase-12-prep.md).

### Option 2: DB-column authz + automated emission via GitHub Contents API + middleware-based protection

Adds a `users.role` text column (enum: `"user" | "curator" | "admin"`); curator dashboard reads from DB. Acceptance triggers a server-side commit to the repo via GitHub Contents API + an installation token; the YAML lands in the repo without curator intervention. Middleware-based auth protection on `/curator/**` + `/admin/**`.

- **Pros:**
  - Curator promotion / demotion is a DB UPDATE — UI-facing admin surface possible.
  - Acceptance is one-click (no out-of-band YAML commit).
  - Middleware-based protection is cleaner than page-local checks (separation of concerns; auth-rejection happens before render).
- **Cons:**
  - Adds a `users.role` column → another migration this phase OR coupled into 0003. Phase 12 scope grows.
  - Automated GitHub Contents API commit requires a **GitHub App** installation (not a personal-access-token OAuth flow); needs its own ADR; introduces bot-identity for commits (the rating-action YAML's `curator` field would be the bot's handle, not the reviewing curator's — semantically wrong per §13 + ADR-0005).
  - Bot-commit identity violates the §13 + curator-of-record semantics that ADR-0012 D-E established. Even if the YAML's `curator` field is set to the reviewing curator's `githubLogin`, the git commit author is the bot, which breaks the audit chain that "curator = git commit author + curator-of-record field" provides.
  - Middleware-based protection requires lifting Phase-9 Class B item 12's threshold (currently 3+ page routes; Phase 12 ships only the 2nd). Premature.
  - Higher complexity raises Phase 12 unit count to ~12+; pushes scope beyond Phase 9's 10-unit envelope.

### Option 3: Soft launch — DB columns only; no UI; manual SQL for reviews

ALTER the table to add review columns; manually UPDATE rows via SQL when a curator reviews; no dashboard UI.

- **Pros:**
  - Smallest surface (~3 units).
  - Zero new ADR-level decisions (just a schema change).
- **Cons:**
  - Doesn't close Q57 architecturally — defers UI + authz + COI decisions indefinitely.
  - Curator workflow is "open SQL client; run UPDATE; commit YAML out-of-band" — high friction; high error rate.
  - No COI enforcement surface (a SQL UPDATE bypasses any application-level guard).
  - Punts the architectural surface to Phase 13+ without making progress; doesn't honor the Phase-11 forward references.

### Option 4: Multi-stage approval (editor-1 → editor-2 → accepted)

Two-curator approval pipeline: curator-A reviews + flags for second-look; curator-B reviews + accepts/rejects. Editorial-board pattern.

- **Pros:**
  - Higher editorial rigor.
  - Matches academic peer-review intuition (n=2 reviewers).
  - Per-decision audit trail richer.
- **Cons:**
  - Phase-12 curator pool is solo per [Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance) (open; default until editorial board lands).
  - Doubles the state machine complexity (each transition forks by approval count).
  - Premature without observed reviewer workload signal.
  - Defers single-curator MVP indefinitely; opposite of "ship the MVP then iterate" discipline.
  - Editorial-board promotion is itself an open question ([Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance)) that needs separate ADR work.

## Decision Outcome

**Chosen: Option 1 — Multi-state lifecycle + env-var authz + manual emission + page-local auth + ALTER discipline.**

The decision pins six concrete contracts:

### D-A. State machine

`ratingChallenge.status` becomes a state machine with five values + seven legal transitions. Phase 11 shipped only `"submitted"` as default + write; Phase 12 ships the rest.

```
                  submitted
                 /    |    \
                ▼     ▼     ▼
        under_review  ────→ withdrawn (submitter only)
         /    |    \         ▲
        ▼     ▼     ▼        │
   accepted rejected ────────┤ (any non-terminal → withdrawn)
                             │
   (note: under_review → withdrawn allowed mid-review)
```

| From          | To             | Actor      | Trigger                                                        | Helper                                |
|---------------|----------------|------------|----------------------------------------------------------------|---------------------------------------|
| `submitted`   | `under_review` | curator    | "Start review" button on dashboard                             | `reviewChallenge(..., "start")`       |
| `submitted`   | `accepted`     | curator    | "Accept" button (fast lane; skip `under_review`)               | `reviewChallenge(..., "accept", notes)`|
| `submitted`   | `rejected`     | curator    | "Reject" button (fast lane)                                    | `reviewChallenge(..., "reject", notes)`|
| `submitted`   | `withdrawn`    | submitter  | "Withdraw" button on profile-page row                          | `withdrawChallenge(...)`              |
| `under_review`| `accepted`     | curator    | "Accept" button on detail view                                 | `reviewChallenge(..., "accept", notes)`|
| `under_review`| `rejected`     | curator    | "Reject" button on detail view                                 | `reviewChallenge(..., "reject", notes)`|
| `under_review`| `withdrawn`    | submitter  | "Withdraw" allowed mid-review                                  | `withdrawChallenge(...)`              |
| `accepted`    | —              | (terminal) | irreversible per ADR-0005 immutability spirit                   | —                                     |
| `rejected`    | —              | (terminal) | irreversible (re-challenge = new row, not re-open)             | —                                     |
| `withdrawn`   | —              | (terminal) | irreversible (re-submit = new row)                             | —                                     |

**Implementation discipline**:
- Helpers in `lib/rating-challenges/` enforce the transition table server-side. Each helper refuses INSERT-time if the current `status` doesn't allow the transition (`"transition X → Y not allowed"`).
- `accepted` / `rejected` / `withdrawn` are **terminal**. No `accepted → re-opened` reversal — mirrors ADR-0005's rating-action immutability spirit; reopening would orphan the emitted rating-action YAML. A subsequent challenge to the same dimension = a new `ratingChallenge` row, not a reopen.
- Multi-stage approval is **out of scope** (Option 4 rejected). Phase-12 curator pool is solo per [Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance); promotion to editorial-board model is a Phase 14+ scope.

### D-B. Authorization model — env-var allowlist

A second authorization tier beyond signed-in: **curator**. Defined by an env var:

```bash
LOP_CURATOR_LOGINS=bettyguo,jikun,otherperson
```

CSV of GitHub logins (case-sensitive; matches `users.githubLogin` populated by the Auth.js v5 `events.linkAccount` callback per ADR-0012 D-E). `lib/auth/curator.ts` exports `isCurator(login: string | null | undefined): boolean` that parses the env var on each call.

- **Curator dashboard route** (`/[locale]/curator/challenges` + sub-routes) calls `isCurator(session?.user?.githubLogin)` server-side before rendering. Falsy → `redirect("/")`.
- **Review API** (`POST /api/v1/rating-challenges/[id]/review`) calls `isCurator(...)` before persisting. Falsy → 403 `{ error: "forbidden" }`.
- **Submitter withdraw API + UI** does NOT require curator role (submitter authz only); orthogonal axis.

**Why env-var, not DB column**:

- **Bootstrap-friendly**: no DB-side seeding; mirrors [Q47](../../OPEN_QUESTIONS.md#q47-github-repository-discussions-enablement) Discussions + [Q54](../../OPEN_QUESTIONS.md#q54-github-oauth-app-registration) OAuth + [Q55](../../OPEN_QUESTIONS.md#q55-db-hosting-tier-for-production) Turso operational-gate pattern.
- **Auditable**: changes flow through Vercel deploy logs (env-var diff is logged).
- **Reversible**: revoke = remove from CSV + restart deploy. No data migration.
- **Avoids premature DB schema**: a `curatorRoles` table would require migrations + an admin UI to manage. Both premature in Phase 12. ADR-0005's explicit-evolution ethos: defer until usage justifies.

**Phase 12+ deferred** (will surface as future ADRs):

- Per-problem ACLs (curator-X can review only `health-medicine`; curator-Y can review everything). Phase 13+ if workload signals demand.
- `curatorRoles` table with admin UI. Phase 14+ alongside editorial board ([Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance) resolution).
- Auto-promotion based on contribution history. Phase 14+; out of MVP scope.

### D-C. COI policy (§8.6 simplification for Phase 12)

§8.6 verbatim: *"A curator must not rate a problem where they (or their direct collaborators within the last 24 months) hold a current leaderboard top-5 entry."*

Applied to challenge review (per [Unit 11.6 Q57](../../OPEN_QUESTIONS.md#q57-rating-challenge-curator-review-pipeline-shape) lean "inherit verbatim"), refined for MVP:

- **Hard block: curator = submitter.** A curator cannot review their own challenges. Server-side refuse; UI disables review buttons + shows "You cannot review your own challenge" disclaimer.
- **Soft warn: curator = problem's `primary_curator`.** A curator who authored the problem's current rating reviewing a challenge to their own rating creates a self-review surface that §8.6 spirit forbids. UI displays "You authored this problem's current rating — review carefully" disclaimer; does NOT block. Phase 13+ may promote to hard block based on usage observations.
- **DEFERRED: 24-month collaborator check.** Requires joining DB `users.githubLogin` to file-system `paper.authors[].slug` to `paper.year` — a multi-hop traversal across the DB ↔ file-system boundary. Phase 12 leaves this UN-ENFORCED at the application layer; the `reviewNotes` field (mandatory on accept/reject) serves as the human-audit surface ("Curator-X, please confirm no recent collaboration with the submitter's paper authors").

**Implementation**:

- `lib/rating-challenges/coi.ts` exports `getCoIStatus(reviewerLogin: string, problemSlug: string, submitterLogin: string): { blocked: boolean; warning?: string; reason: "self-review" | "primary-curator" | null }`.
- `blocked: true` cases refuse the review API + disable UI buttons.
- `warning: "..."` cases surface the disclaimer + KEEP buttons active.
- `reason` enables UI discrimination for messaging.

The `reviewNotes` field serves a secondary purpose as the human-trail for §8.6 compliance: reviewers MAY note "no 24-mo collaboration with the paper authors" as part of the accept rationale. Phase 13+ may add a structured COI-attestation checkbox.

### D-D. Acceptance → rating-action YAML emission (manual)

When a curator accepts a challenge, a new rating-action YAML lands in `content/problems/<slug>/ratings/<date>-<slug>.yaml`. This is **editorial content**, governed by [ADR-0004](./0004-file-first-no-db.md) (file-first) + [ADR-0005](./0005-rating-action-immutability.md) (immutable; signed by curator-of-record). Vercel's runtime filesystem is **read-only**; the YAML write CANNOT happen from the API route.

**Phase 12 lean: manual emission, attached out-of-band.**

1. Curator clicks "Accept" on detail view.
2. API route sets `status = "accepted"`, `reviewedAt = now`, `reviewerId = curator.id`, `reviewNotes = <provided>`, `acceptedActionId = null`.
3. UI shows a banner: *"Challenge accepted. Now create the rating-action YAML at `content/problems/<slug>/ratings/<date>-<slug>.yaml` per [methodology](/methodology), commit it via PR, and return here to attach the filename in the `acceptedActionId` field."*
4. Curator commits the YAML via the standard editorial git workflow (PR review; ADR-0005 pre-commit hook verifies immutability of prior actions).
5. Curator returns to the detail view; an "Attach action YAML" form lets them set `acceptedActionId = "<filename>"`. Server-side validates the file exists at `content/problems/<slug>/ratings/<filename>` (via Velite's `#site/content`) before persisting.

**Why manual** (Option 2's automation rejected):

- **Preserves §13 + ADR-0012 D-E curator-of-record semantics**. The rating-action YAML's `curator` field MUST be the reviewing curator's `githubLogin`; the git commit author MUST also be that curator. Bot-commit identity breaks this audit chain.
- **Vercel runtime is read-only**. Even Option 2's automation would require GitHub Contents API calls — which require a GitHub App installation, a bot identity, and a follow-on ADR for the bot's commit-author identity. None of those decisions are in Phase 12 scope.
- **ADR-0005 pre-commit hook protection**. The standard editorial git workflow runs the immutability check + the schema validator + the cross-link audit before merge. Automation would have to replicate these checks server-side; complexity ↑↑.
- **Volume**: Phase 12 horizon is ≤ 5 challenges per month. Manual emission is acceptable friction for that cadence.

**Phase 13+ deferred** (will surface as new ADRs):

- **CLI helper** `pnpm emit-challenge-action <id>` reading the challenge from the DB + scaffolding the YAML at `content/problems/<slug>/ratings/<date>-<slug>.yaml`. Mirrors Phase-5's `extract-leaderboard` shape. Eliminates the "write the YAML by hand" friction while preserving the manual commit step. **Possible Q59 candidate.**
- **Web-side automation** via GitHub Contents API + GitHub App installation. Phase 14+; requires a follow-on ADR for the bot-identity vs curator-identity semantics.

### D-E. Schema evolution — ALTER migration discipline

[ADR-0013](./0013-db-choice.md) D-B established migration immutability ("every schema change ships as a NEW migration file; never edit existing migrations after they've been applied to any deployed database") for the project's CREATE migrations (`0000_initial_auth` + `0001_watchlist` + `0002_rating_challenges`). Phase 12 introduces the project's **first ALTER migration** (`0003_rating_challenge_review`); this ADR codifies how ALTER migrations work.

**Discipline**:

- **NEVER edit `0002_rating_challenges`** to add the review columns. Doing so would re-apply the migration on databases that already have the original schema, producing an inconsistent applied-migrations log.
- **Column adds land as ADDITIVE deltas in a new migration file**. Drizzle-kit generates the SQL from the schema edit (`pnpm db:generate --name rating_challenge_review`).
- **The new migration**: 4 `ALTER TABLE ratingChallenge ADD COLUMN ...` statements. SQLite supports `ALTER TABLE ADD COLUMN` natively for nullable columns; FK with `ON DELETE SET NULL` is emitted by drizzle-kit's libSQL adapter.
- **Snapshot at `meta/0003_snapshot.json`** + journal updated atomically by drizzle-kit. Snapshot is committed.
- **Forward-compat**: existing `ratingChallenge` rows from Phase 11 (which all have `status = "submitted"`) get NULL values in the four new columns; the application reads NULL as "not reviewed yet" without special handling. No data migration needed.
- **Backward-incompat warnings**: SQLite ALTER TABLE supports ADD COLUMN but does NOT support `DROP COLUMN` (until recent versions) or `RENAME COLUMN` cleanly. Future column removals would require a copy-table-and-drop dance; Phase 12 makes no column removals.

**Future ALTERs follow the same pattern**: each schema change = a new migration file; never edit applied migrations; snapshots/journals atomic.

### D-F. Route shape + auth tier

Curator dashboard at `/[locale]/curator/challenges`. **Third protected page route** (after Phase-10 `/[locale]/profile` + Phase-11 `/api/v1/rating-challenges` API-only protection). Two sub-routes:

- **`/[locale]/curator/challenges`** — list view. Server-rendered table of challenges (any status), sortable client-free via URL search params in Phase 13+. Default filter: `status ∈ {submitted, under_review}` ("pending review queue"). Default sort: `createdAt ASC` (fairness queue; oldest pending first).
- **`/[locale]/curator/challenges/[id]`** — detail view. Single challenge with: submitter handle + submitted-date + problem context + dimension + proposedValue + rationale (full text, NOT truncated) + COI surface (warning or block per D-C) + review form (textarea + buttons for accept/reject/start-review).

**Why two pages**, not single-page inline:
- Rationale text may be ~2000 chars; list view truncates for scannability; detail gives curator full context.
- Matches §15.5 reviewer-mode mindset: "could a future curator misuse the surface by accepting on truncated rationale?"
- Mirrors Phase-11 problem-detail-page + Phase-10 profile-page pattern (each entity has its own canonical detail URL).

**Auth check**:

- Page-local check in the server component, mirroring [Phase-10 `/profile` pattern](../../app/[locale]/profile/page.tsx).
- `if (!session?.user?.githubLogin || !isCurator(session.user.githubLogin)) redirect('/')`.
- Mirror for API route `POST /api/v1/rating-challenges/[id]/review`: 401 if no session; 403 if signed-in but `!isCurator(login)`.

**Middleware-based protection** (Phase-9 Class B item 12) **remains deferred**. Threshold = 3+ protected page routes. Phase 12 brings count to 2 (profile + curator). Lift fires Phase 13+ if a third protected page route lands. Page-local checks are not architecturally inferior — they're tied to the server component's data dependencies. The lift is an optimization, not a correctness fix.

**i18n**: new `messages.curator.*` namespace per [ADR-0011](./0011-i18n-strategy.md). EN + FR. ~12 keys expected.

## Consequences

### Positive

- **Closes [Q57](../../OPEN_QUESTIONS.md#q57-rating-challenge-curator-review-pipeline-shape)** with a concrete architectural pin (anticipated promotion: `open` → `resolved` in [Unit 12.7](../thinking/12.0-phase-12-prep.md)).
- **Closes §8.6 + §3.1 architectural concern**. The community-feedback loop has both halves: submission (Phase 11) + review (Phase 12). Editorial governance is now operational at the code layer.
- **Validates ALTER migration discipline**. Phase 12 establishes the schema-evolution playbook (`0003_*`) that Phases 13+ inherit verbatim.
- **First authorization tier introduced** beyond signed-in. Subsequent admin / editorial / curator-specific surfaces inherit the env-var-allowlist + page-local-check pattern.
- **Manual YAML emission preserves curator-of-record semantics** + ADR-0004 file-first + ADR-0005 immutability. Editorial accountability chain (file-system `curator` field = git commit author = `users.githubLogin` from `events.linkAccount`) stays intact.
- **§5.7 trigger** unchanged (no new tables; ALTER is additive).
- **First Load JS** unchanged (entirely server-rendered dashboard; no client islands).
- **Reversibility**: simplified COI promotes to full §8.6 check in Phase 13+ without schema migration (pure server-side logic); env-var authz promotes to DB-column authz with a single migration; manual emission promotes to CLI / API automation incrementally.
- **Scope cap honored**: Q58 + full COI + automation all deferred; Phase 12 ships ~9 units.

### Negative

- **Manual YAML emission means a two-step curator workflow** (Accept → commit YAML → return → attach filename). Friction grows with volume; Phase 13+ CLI helper mitigates.
- **Env-var authz adds Vercel-env-update + deploy-restart latency** for curator-pool changes. Acceptable at Phase-12 scale (≤ 5 curators); friction grows at editorial-board scale.
- **Simplified COI can pass cases the full §8.6 check would block**. Mitigation: `reviewNotes` requires human accountability; soft-warn surfaces the most-common false-negative (curator = primary_curator).
- **First ALTER migration in project history**. drizzle-kit's `ALTER TABLE` emission for SQLite has edge cases for FK with `ON DELETE SET NULL`; manual SQL inspection before commit is required. Mitigation: Unit 12.2's smoke-gate explicitly inspects the generated SQL.
- **Page-local auth-checks duplicate logic across `/profile` + `/curator/challenges` + future protected routes**. Middleware lift is a follow-on; threshold = 3+ protected page routes. Acceptable temporary duplication.
- **Curator dashboard adds a new ~1.5 kB page-route bundle**. Within `103 kB First Load JS` budget — confirmed in Unit 12.4 smoke.
- **Q58 deferred to Phase 13+** means non-submitters see nothing about challenges (no count on problem detail; no public listing). Phase 12 + later Q58 should be planned together if usage demands earlier visibility.

## Cross-references

- **§3.1** "ratings are revisable" framing (closed; curator review is the mechanism).
- **§8.6** COI policy (this ADR simplifies for MVP; full check deferred to Phase 13+).
- **§13** editorial workflow (this ADR's D-D preserves curator-of-record semantics).
- **§14.4** CHANGELOG + ADR contract.
- **§15.5** reviewer-mode mindset (applied throughout this ADR's deliberation).
- **[ADR-0004](./0004-file-first-no-db.md)** file-first / no-DB-for-content (preserved — this ADR's D-D emits rating-action YAMLs to the file-system).
- **[ADR-0005](./0005-rating-action-immutability.md)** rating-action immutability (preserved — emitted YAMLs are append-only; D-A's terminal-states-non-reversible policy mirrors).
- **[ADR-0012](./0012-auth-provider.md)** auth provider (D-D redirect-to-provider UX + D-E `users.githubLogin` joining; both prerequisites).
- **[ADR-0013](./0013-db-choice.md)** DB choice (D-B migration immutability; this ADR's D-E extends to ALTER discipline; D-F USER-STATE-only respected — review columns are REVIEW-STATE which is USER-STATE-adjacent on the same row).
- **[OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance)** (open; editorial-governance future — Phase 14+ alongside `curatorRoles` table promotion).
- **[OPEN_QUESTIONS Q57](../../OPEN_QUESTIONS.md#q57-rating-challenge-curator-review-pipeline-shape)** (open; promoted to `resolved` in [Unit 12.7](../thinking/12.0-phase-12-prep.md) on ADR-0014 acceptance).
- **[OPEN_QUESTIONS Q58](../../OPEN_QUESTIONS.md#q58-rating-challenge-visibility-to-non-author-users)** (open; deferred to Phase 13+ explicitly per this ADR's scope cap).
- **[Unit 12.0 prep](../thinking/12.0-phase-12-prep.md)** D-1 through D-12 (the Phase-12 thread recommendation + decision ledger this ADR pins).
- **Phase-9 Class B item 12** (middleware-based auth-route protection; threshold still ≤ 2 protected page routes after Phase 12; lift Phase 13+).
