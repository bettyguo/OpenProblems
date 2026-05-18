# LLM OpenProblems — progress summary + remaining-workload estimate (Phase 40 close; 2026-05-18)

## Snapshot at HEAD `9b39a8c`

| Dimension                        | Value                                 | Trajectory                                                                                                          |
| -------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Phases shipped                   | **0 → 40** (41 closed)                | +5 phases this session (37/38/39/40); +1 in this session was the carryover Phase 37 prep                            |
| Tests                            | **833 / 70 files**                    | +258 / +15 since Phase 22 close (3 months ago)                                                                      |
| ADRs                             | **24**                                | +5 since Phase 22 (ADR-0020 through ADR-0024)                                                                       |
| ADR D-clause APPEND clusters     | 11 D-clauses with APPENDs             | ADR-0018 D-G holds 7 APPENDs — project record                                                                       |
| DB tables                        | 7                                     | unchanged since Phase 30                                                                                            |
| Migrations                       | 9                                     | +3 since Phase 22 (subscriber-list infra Phase 30 + Phase 33 + Phase 36)                                            |
| Env vars                         | 14                                    | +1 since Phase 35 (`MARKDOWN_EXTENSIONS` Phase 38)                                                                  |
| i18n keys per locale             | 168 (en + fr)                         | +41 since Phase 22 (Phase 32 unsubscribe + Phase 34 manage-subscriptions + Phase 36 privacy-opt-out + minor others) |
| First Load JS shared chunk       | **103 kB**                            | UNCHANGED **68 consecutive units** (Phase 9 Unit 9.5 → Phase 40 Unit 40.4)                                          |
| Middleware bundle                | 160 kB                                | UNCHANGED since Phase 12                                                                                            |
| OPEN_QUESTIONS top-level Q-count | 66 (28 resolved + 4 lean + 34 open)   | UNCHANGED Phase 36-40                                                                                               |
| Phase-N+ candidate count         | 8                                     | net-decreased Phase 34 → 38 (5 closures); steady Phase 39 + 40                                                      |
| Operational gates pending        | 6 (Q54 + Q55 + Q69 + Q73 + Q75 + Q77) | all curator-track; all block production deploy but NOT phase work                                                   |

## Narrative arc — what's shipped

The project has shipped **41 phases** spanning the original
MASTER_PROMPT.md §12 phase plan PLUS extensive user-state /
community-features expansion within Phase 4-5 scope. Each phase
runs ~5 units (some 4-13 units in earlier phases; standardized to
4-5 units Phase 24+).

### Phases 0-9: original foundation (per MASTER_PROMPT.md §12)

- **Phase 0 (Foundation)**: stack + schemas + ADRs 0001-0005 + App
  Router stub IA + content validation + design tokens.
- **Phase 1 (Core MVP)**: brand finalization + Velite pipeline + 10
  seed problems with full content + rating radar v1 + dark mode +
  Fuse.js search + landing page v1.
- **Phase 2 (Papers / Authors / Institutions / Leaderboards)**: 30
  papers + 126 authors + 14 institutions + cross-link audit (Q32
  baseline established).
- **Phase 3 (Rating Dynamics & Trending)**: ADR-0006 saturation N/A
  encoding + 2nd/3rd rating actions + saturation curve + movers
  board + recompose UI + RSS feed.
- **Phase 4 (DomainMap & Community)**: ADR-0007 D3 import policy +
  DomainMap force graph + issue templates + contributing page.
- **Phase 5 (Intelligence layer)**: ADR-0008 + ADR-0009 LLM curation
  CLIs (`ingest-arxiv` + `extract-leaderboard`).
- **Phase 6 (Discussions)**: ADR-0010 Giscus + GraphQL read-side.
- **Phase 7 (Bilingual rendering infra)**: ADR-0011 next-intl +
  sub-path + sibling-file storage.
- **Phase 8 (Bilingual rollout completion)**: with Unit 8.4 (HTML
  shell migration) deferred indefinitely.
- **Phase 9 (Auth + read+write API)**: ADR-0012 NextAuth.js v5 +
  ADR-0013 Turso libSQL + Drizzle ORM; §13 ledger CLOSED.

### Phases 10-16: user-state foundation

- **Phase 10**: Profile page + Phase-9 UI polish.
- **Phase 11**: Rating-challenge submission form + `ratingChallenge`
  table.
- **Phase 12**: ADR-0014 curator review pipeline + state machine +
  env-var authz.
- **Phase 13**: Public visibility per-status policy.
- **Phase 14**: ADR-0015 per-user privacy + `/[locale]/u/[handle]`
  public profile route.
- **Phase 15**: ADR-0016 user-editable profile fields
  (`displayName` + `bio` plain-text).
- **Phase 16**: ADR-0017 Vercel Blob image override / avatar upload.

### Phases 17-22: markdown + image processing + operational scripts

- **Phase 17**: ADR-0018 markdown rendering (`unified` + `rehype-
sanitize`) — first XSS-audit surface + first
  `dangerouslySetInnerHTML` surface.
- **Phase 18**: Multi-surface markdown for review notes via D-G
  inheritance.
- **Phase 19**: ADR-0019 EXIF stripping via `sharp` server-side.
- **Phase 20**: EXIF backfill operational script.
- **Phase 21**: Orphan-blob cleanup operational script.
- **Phase 22**: `emit-challenge-action` CLI (ADR-0014 D-D
  realization).

### Phases 23-29: multi-provider OAuth + leaderboard entry expansion

- **Phase 23**: ADR-0020 multi-provider OAuth (12-phase Q-carryover
  closure).
- **Phases 24-26**: leaderboard entry submission + curator review
  pipeline expansion + per-challenge detail page.
- **Phase 27**: rating-challenge rationale markdown promotion (D-G
  inheritance).
- **Phase 28**: schema integrity / cross-link audit hardening.
- **Phase 29**: rating-action rationale markdown promotion (D-G
  inheritance; first content-side Velite-validated markdown render).

### Phases 30-34: subscriber-list email infrastructure

- **Phase 30**: ADR-0021 subscriber-list email foundation + first
  `lib/email/` infrastructure + 22+ phase Phase-5 D-4 punt closure.
- **Phase 31**: ADR-0022 weekly digest scheduler via Vercel Cron.
- **Phase 32**: stale-token cleanup cron (no-new-ADR).
- **Phase 33**: ADR-0023 per-user-account subscriptions + Q76
  Option A.
- **Phase 34**: Q79 Profile A "manage my subscriptions" read-only
  widget — 5-phase subscriber-list arc completes.

### Phases 35-40: framework patterns (this session's domain)

- **Phase 35**: ADR-0024 framework-only content moderation +
  `lib/moderation/` (NoopModerator + factory + 4-surface
  integration) — first framework-only ADR.
- **Phase 36**: Q64 per-user privacy opt-out (`users.profilePublic`
  - toggle UI + 9th migration).
- **Phase 37** ✨ this session: Q72 markdown schema-divergence
  **framework** as ADR-0018 D-G framework-only-pattern reuse from
  Phase 35 — `MarkdownExtensionRegistry` + per-surface schema/plugin
  overrides + no-extensions-default + integration into 4 markdown
  helpers.
- **Phase 38** ✨ this session: **first concrete Phase-37-framework
  consumer** — `WikilinkExtensionRegistry` resolving `[[problem-
slug]]` on actionRationale + `MARKDOWN_EXTENSIONS=wikilinks` env-
  var dispatch + B.14 closure at 9+ phase carryover.
- **Phase 39** ✨ this session: **second concrete Phase-37-framework
  consumer** — `TablesExtensionRegistry` + `GFM_TABLE_SCHEMA_OVERRIDES`
  - `MARKDOWN_EXTENSIONS=tables` arm; first real-consumer exercise
    of the `schemaOverrides` slot + APPEND-D-C override-replace
    semantics.
- **Phase 40** ✨ this session: **multi-consumer composition
  infrastructure** — `CompositeExtensionRegistry` + multi-value
  `MARKDOWN_EXTENSIONS=wikilinks,tables` dispatch + first "framework
  - 2 consumers + composition" 4-phase cluster in project history;
    Phase-38-prep D-11 deferral CLOSED.

## How this maps to the original MASTER_PROMPT.md §12 phase plan

The original phase plan named 6 phases (Phase 0 → Phase 6+).
Phases 0-9 mapped closely (with §13 ledger CLOSED Phase 9). Phases
10+ have been finer-grained expansions of the original Phase 4-5
scope ("DomainMap & Community" + "Intelligence layer"):

| Original Phase | Theme                                          | Actual phases                                                                                                                          |
| -------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 0              | Foundation                                     | 0                                                                                                                                      |
| 1              | Core MVP                                       | 1                                                                                                                                      |
| 2              | Papers / Authors / Institutions / Leaderboards | 2                                                                                                                                      |
| 3              | Rating dynamics & viz                          | 3                                                                                                                                      |
| 4              | DomainMap & community                          | 4 + 6 + 10-16 (user identity) + 17-21 (markdown + images + operational scripts) + 30-34 (subscriber-list) + 35-40 (framework patterns) |
| 5              | Intelligence layer                             | 5 (curator CLIs) + 7-8 (i18n) + 9 (auth + DB) + 22-29 (leaderboard expansion)                                                          |
| 6+             | Discussions / API auth / monetization          | 6 partial                                                                                                                              |

This expansion is per `MASTER_PROMPT.md` §15.6 ("Always read this
MASTER_PROMPT before starting any new phase to refresh context")

- §17 open questions (the user-state surfaces emerged through
  sustained curator usage of the platform, not the original 1-month-
  horizon plan).

## What's left to v1 release

### Pre-Phase-35 release-readiness audit (HEAD `b52cdda`; pre-this-session)

The release-readiness audit at `docs/release-readiness-audit.md`
concluded **~75% complete to v1** at HEAD `b52cdda` (Phase 34 close,
prior to this session). Per that audit's frame:

- **Architectural surface**: substantially complete (90%+) — the
  audit listed only ADR-0025 concrete moderation + Q78 analytics
  - multi-provider OAuth (resolved Phase 23) + subscriber arc
    (resolved Phase 30-34) as remaining major surface.
- **Operational surface**: 6 gates pending (Q54 + Q55 + Q69 + Q73
  - Q75 + Q77), all curator-track.
- **Content surface**: 10 seed problems shipped Phase 1; 30
  papers; 126 authors; 14 institutions. Methodology v1 shipped;
  v2 authoring is Phase-41+ candidate.
- **Visualization surface**: 6/8 viz catalog items shipped (Phase
  1 RatingRadar + Phase 3 SaturationCurve + MoversBoard +
  RatingHistoryStream + Phase 4 DomainMap + TimelineRibbon).
  2 remaining: AuthorImpactSparkline + CitationFlowSankey (per
  the original §11 catalog).

### Updated estimate post-Phase-40

Phases 37-40 added framework infrastructure (markdown extension
registry + 2 consumers + composition) which **extends the platform's
expressiveness without adding new architectural surface in the §1-
§11 sense**. The release-readiness percentage moves from ~75% →
**~80-82%** at Phase 40 close — the gains are infrastructure-side,
not feature-side.

Remaining work to v1 ship — categorized:

#### A. Architectural surface (~3-6 phases / ~15-30 units)

| Item                                          | Phase est. | Notes                                                                                                           |
| --------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| ADR-0025 concrete content-moderation provider | 3-5 units  | Phase-35 framework end-to-end realization; needs curator content authorship OR external-API operational unblock |
| Account-deletion blob cleanup                 | 1-2 units  | Conditional on account-delete UI existing first                                                                 |
| Q78 digest-send analytics                     | 3-5 units  | Waits for Q77 (cron secret) production signal                                                                   |
| Pre-commit typecheck hook                     | 1 unit     | Closes Unit-36.1 gap; tiny                                                                                      |
| `safeAuth()` extraction                       | 1 unit     | Hold until 5+ in-place copies (currently 4)                                                                     |
| Subscribe + `/profile` test backfill          | 1-2 units  | Closes Unit-35.2 + 36.2 gaps; not user-visible                                                                  |

#### B. Framework consumer expansion (~3-8 phases / ~15-40 units)

The Phase-37 framework supports arbitrary consumer addition with
~5 lines of dispatch wiring per new extension. Candidates:

| Item                                                                  | Phase est.     | Notes                                            |
| --------------------------------------------------------------------- | -------------- | ------------------------------------------------ |
| Third concrete consumer exercising `remarkPlugins` slot (`@mention`?) | 2-3 units      | Completes framework's 3-of-3 slot demo           |
| Cross-surface wikilink expansion (bio + reviewNotes + rationale)      | 1-2 units each | Constructor-arg change; demand-signal-first weak |
| Cross-surface tables expansion                                        | 1-2 units each | Same; demand-signal-first weak                   |
| Cross-entity wikilinks (`[[paper-id]]` / `[[author-slug]]` / etc.)    | 2-3 units each | Needs entity-type syntax disambiguation          |
| 404 validation for unresolved wikilinks                               | 1-2 units      | Build-time validation against content/           |
| Plugin parameterization for cross-entity                              | 1 unit         | Framework refactor                               |

Most of these are demand-signal-first — they ship only if curator
authoring patterns indicate need. Realistic estimate: ~2-3 of
these threads actually land before v1.

#### C. Content / curator surface (~indeterminate; user-direction-dependent)

| Item                                                         | Effort         | Notes                                 |
| ------------------------------------------------------------ | -------------- | ------------------------------------- |
| v2 methodology authoring                                     | curator-track  | Primary §1 (d) success metric blocker |
| Additional seed problems beyond the 10 Phase-1 set           | curator-track  | Scale-test the IA                     |
| Q79 Profile B / C UX iterations                              | 2-3 units each | Needs user-feedback signal            |
| Cross-link audit warning resolution (6 asymmetric edges Q32) | curator-track  | Q32-baseline since Phase 2            |

#### D. Operational unblock (curator-track; NOT phase-work)

| Gate    | Description                                                                 |
| ------- | --------------------------------------------------------------------------- |
| Q54     | GitHub OAuth app registration + `AUTH_GITHUB_ID/SECRET`                     |
| Q55     | Production Turso DB provisioning + `TURSO_DATABASE_URL/AUTH_TOKEN`          |
| Q69     | Vercel Blob store creation + `BLOB_READ_WRITE_TOKEN`                        |
| Q73     | Google OAuth app registration + `AUTH_GOOGLE_ID/SECRET`                     |
| Q75     | Resend domain verification + `RESEND_API_KEY`                               |
| Q77     | Cron secret + `CRON_SECRET`                                                 |
| Q2 + Q3 | DNS + hosting decision (Vercel assumed; `llm-openproblems.org` placeholder) |

All operational unblocks are non-phase-work. They block production
deploy but NOT continued phase development.

### Best-guess completion bound

- **Architectural surface remaining**: 3-6 phases ≈ **15-30 units**.
- **Framework consumer expansion** (realistic 2-3 threads): 4-9
  phases ≈ **20-45 units**.
- **Total remaining phase-work to v1**: **~7-15 phases ≈ 35-75
  units**.

At the current rate of ~5 units / session, ~12-15 units / week
(depending on session cadence), **v1 ship is ~4-8 weeks of focused
session work away**, EXCLUDING operational unblock (Q54 + Q55 + Q69

- Q73 + Q75 + Q77 = curator-track; varies per registration
  operational cadence).

**The architectural surface is ≥90% complete.** What remains is
mostly:

- Concrete provider implementations sitting on framework slots
  (ADR-0025 moderation; potentially framework-consumer
  expansions).
- Long-tail operational scripts + test backfills.
- Methodology v2 + content authoring (curator-track).

## What the rhythm has produced

This session shipped **18 commits across 4 phases** (Phase 37 + 38

- 39 + 40), each phase 5 units (4 commits + 1 prep prior turn for
  Phase 37 = 5 unit progression). Sustained rate: ~5 commits per
  phase; ~1 phase per session over the last 3-4 sessions.

**Architectural rhythm observed**:

- **Framework-only-ADR pattern** (Phase 35 + Phase 37): ship the
  framework + default NoopProvider/EmptyRegistry; concrete
  consumers land later. Validated twice in project history.
- **Framework + N consumers + composition** (Phase 37-40): the
  "framework + 2 consumers + composition" 4-phase cluster
  demonstrates the framework's design value end-to-end. Mirror
  shape may apply to the Phase-35 moderation framework when
  ADR-0025 concrete provider ships.
- **5-unit phase shape** (Phase 35-40 inclusive; 6 consecutive
  phases): prep + 1-2 code units + hygiene + gate. Predictable
  rhythm; enables session planning at ~5 units / session.
- **APPEND-not-EDIT discipline**: ADR-0018 D-G accumulated 7
  APPENDs across 23+ phases without rewriting; audit trail
  preserved.

## Confidence in the estimate

The 4-8-week estimate has significant uncertainty:

- **Lower bound (4 weeks)**: assumes user-direction stays
  consistent with autonomous-tractable threads; operational
  gates unblock in parallel; v2 methodology authoring is
  out-of-scope for v1.
- **Upper bound (8 weeks)**: includes 1-2 framework-consumer
  expansion phases of dubious demand-signal value; includes 1-2
  curator-track threads needing human direction; assumes some
  scope creep.
- **Beyond 8 weeks**: would indicate scope changes — new
  Q-class items emerging or major rework of an existing ADR.

Operational unblock (Q54/55/69/73/75/77) is genuinely
uncertain — it depends on the user's calendar for registering
6 external accounts. Could be 1 weekend OR multiple weeks if
spread out.

## Risk register (carryover)

- **`safeAuth()` extraction threshold (4 → 5)**: next NextAuth
  consumer adds the 5th copy; should trigger extraction.
- **Phase-36 `users.profilePublic` opt-out** has no migration path
  for users who set `profilePublic=false` then want to delete
  account (account-deletion UI doesn't exist).
- **Multi-value `MARKDOWN_EXTENSIONS` schema-override conflict**
  is loud-failure-on-misconfiguration — operator running
  `MARKDOWN_EXTENSIONS=tables,X` where X also provides
  schemaOverrides on reviewNotes would see a throw at first
  request.
- **Test suite at 833 tests** runs in 14s consistently — no
  performance concern, but watch for >20s as a threshold for
  test-suite parallelization decisions.

---

_Generated 2026-05-18 at Phase 40 close (HEAD `9b39a8c`). Update
post-Phase-41 close if material changes._
