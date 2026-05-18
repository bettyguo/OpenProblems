# LLM OpenProblems — progress summary + remaining-workload estimate (Phase 44 close; 2026-05-18 late)

> **Supersedes** `docs/PROGRESS_SUMMARY_2026-05-18.md` (Phase 40
> close; earlier same-day snapshot). The earlier file remains as
> historical record per project audit-trail discipline.

## Snapshot at HEAD `a7e971b`

| Dimension                                                          | Value                                        | Trajectory                                                                                                    |
| ------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Phases shipped                                                     | **0 → 44** (45 closed)                       | +4 phases this session (41/42/43/44); 5 units each = 20 commits                                               |
| Tests                                                              | **921 / 71 files**                           | +88 / +1 since Phase 40 close (8 hours ago)                                                                   |
| ADRs                                                               | **24**                                       | UNCHANGED Phase 35-44 (10 consecutive no-new-ADR phases; longest since Phase 20-27 8-phase streak)            |
| ADR D-clause APPEND clusters                                       | 11 D-clauses with APPENDs                    | ADR-0018 D-G holds **11 APPENDs** — project record (+4 this session)                                          |
| DB tables                                                          | 7                                            | UNCHANGED since Phase 30                                                                                      |
| Migrations                                                         | 9                                            | UNCHANGED since Phase 36                                                                                      |
| Env vars                                                           | 14                                           | UNCHANGED since Phase 38 (`MARKDOWN_EXTENSIONS` gains `arxiv` recognized value Phase 41; variable count same) |
| i18n keys per locale                                               | 168 (en + fr)                                | UNCHANGED since Phase 36                                                                                      |
| First Load JS shared chunk                                         | **103 kB**                                   | UNCHANGED **84 consecutive units** (Phase 9 Unit 9.5 → Phase 44 Unit 44.4)                                    |
| Middleware bundle                                                  | 160 kB                                       | UNCHANGED since Phase 12                                                                                      |
| OPEN_QUESTIONS top-level Q-count                                   | 66 (28 resolved + 4 lean + 34 open)          | UNCHANGED Phase 36-44                                                                                         |
| Phase-37+ candidate count                                          | 8                                            | UNCHANGED Phase 39-44 (within-bucket framework realizations don't decrement top-level count)                  |
| Operational gates pending                                          | 6 (Q54 + Q55 + Q69 + Q73 + Q75 + Q77)        | UNCHANGED; all curator-track                                                                                  |
| **Framework concrete consumers**                                   | **3** (wikilinks + tables + arxiv)           | +1 this session (arxiv Phase 41)                                                                              |
| **Framework slots exercised by real consumer**                     | **3 of 3** (rehype + schema + remark)        | +1 this session (remarkPlugins via arxiv)                                                                     |
| **Surfaces enabled by ≥1 consumer (default dispatch)**             | **4 of 4**                                   | +1 this session (Phase 42 wikilinks → bio); all 4 reached                                                     |
| **Surfaces with all 3 framework slots active under 3-way default** | **4 of 4**                                   | +4 this session (Phase 44 full activation; Phase 43 reached 1; Phase 44 reached 4)                            |
| **Component-surface-slot triples active under 3-way default**      | **12** (3 slots × 4 surfaces × 3 consumers)  | +12 this session (full framework activation)                                                                  |
| **Runtime deps added**                                             | **+1** (`@types/mdast` types-only; Phase 41) | First new dep since Phase 32 (Resend); types-only zero bundle impact                                          |

## Narrative arc — what's shipped (Phase 0 → Phase 44)

The project has shipped **45 phases** spanning the original
MASTER_PROMPT.md §12 phase plan PLUS extensive user-state /
community-features / markdown-framework expansion within Phase 4-5
scope. Each phase runs ~5 units (some 4-13 units in earlier phases;
standardized to 4-5 units Phase 24+).

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

### Phases 35-40: framework patterns (prior session)

- **Phase 35**: ADR-0024 framework-only content moderation +
  `lib/moderation/` (NoopModerator + factory + 4-surface
  integration) — first framework-only ADR.
- **Phase 36**: Q64 per-user privacy opt-out (`users.profilePublic`
  toggle UI + 9th migration).
- **Phase 37**: Q72 markdown schema-divergence **framework** as
  ADR-0018 D-G framework-only-pattern reuse from Phase 35.
- **Phase 38**: first concrete framework consumer
  (`WikilinkExtensionRegistry` on actionRationale).
- **Phase 39**: second concrete framework consumer
  (`TablesExtensionRegistry` on reviewNotes).
- **Phase 40**: multi-consumer composition infrastructure
  (`CompositeExtensionRegistry`) — first "framework + 2 consumers
  - composition" 4-phase cluster.

### Phases 41-44: full framework activation arc (this session)

- **Phase 41** ✨ this session: **third concrete framework
  consumer** — `ArxivExtensionRegistry` resolving `arxiv:NNNN.NNNNN`
  on rationale + `MARKDOWN_EXTENSIONS=arxiv` env-var dispatch.
  **3-of-3 framework slot demonstration via real consumer
  COMPLETE** (Phase 38 rehype + Phase 39 schema + Phase 41 remark).
  First 3-way composition feasibility validated. First content-
  aligned framework extension (paper-citation auto-linking aligns
  with project mission). First new `@types/*` package since Phase
  17 base (`@types/mdast`; types-only).
- **Phase 42** ✨ this session: **first cross-surface expansion**
  of a Phase-37 framework consumer — wikilinks expand from
  actionRationale-only to all 4 surfaces via constructor-arg
  value-only change in `PHASE_38_DEFAULT_ENABLED_SURFACES`.
  Closes ADR-0018 APPEND-D-L item 1 (Phase 38 deferral) at 4-phase
  carryover. First "all 4 markdown surfaces enabled by ≥1
  consumer" state. First canonical same-surface different-slot
  composition case under default dispatch. **APPEND-D-Z consumes
  the last single-letter slot**.
- **Phase 43** ✨ this session: **second cross-surface expansion**
  — tables expand from reviewNotes-only to all 4 surfaces via
  constructor-arg change. Closes APPEND-D-Q item 2 at 4-phase
  carryover. First "schemaOverrides on bio + rationale +
  actionRationale" production state (first `schemaOverrides`-on-
  bio in project history). First "all 4 surfaces with same-surface
  different-slot composition under default dispatch". First "all
  3 framework slots on same surface" case (rationale under 3-way
  default; maximal multi-consumer per-surface composition).
  **First two-letter APPEND letter D-AA** (after Phase-42 D-Z
  consumed last single-letter slot; Excel-spreadsheet column
  convention).
- **Phase 44** ✨ this session: **third cross-surface expansion**
  — arxiv expands from rationale-only to all 4 surfaces.
  **PER-CONSUMER EXPANSION ARC COMPLETE**: all 3 Phase-37-framework
  consumers (wikilinks + tables + arxiv) now ship default-enabled
  on all 4 surfaces. Closes APPEND-D-Y item 1 at 3-phase carryover.
  **First "all 3 framework slots on all 4 surfaces under default
  dispatch" state in project history** — maximal multi-consumer
  all-surfaces composition; **full framework activation under
  default dispatch achieved**. Eleven APPENDs on ADR-0018 D-G.
  Second two-letter APPEND letter D-AB.

## Framework activation matrix at HEAD `a7e971b`

Composition under `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv`
Phase-44 default — **all 12 component-surface-slot triples
active**:

| Surface         | rehypePlugins | schemaOverrides | remarkPlugins |
| --------------- | ------------- | --------------- | ------------- |
| bio             | wikilinks     | tables          | arxiv         |
| reviewNotes     | wikilinks     | tables          | arxiv         |
| rationale       | wikilinks     | tables          | arxiv         |
| actionRationale | wikilinks     | tables          | arxiv         |

Conflict-free per APPEND-D-R "at most one component per slot per
surface" rule. **Maximal default-enabling configuration reached.**

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
| 4              | DomainMap & community                          | 4 + 6 + 10-16 (user identity) + 17-21 (markdown + images + operational scripts) + 30-34 (subscriber-list) + 35-44 (framework patterns) |
| 5              | Intelligence layer                             | 5 (curator CLIs) + 7-8 (i18n) + 9 (auth + DB) + 22-29 (leaderboard expansion)                                                          |
| 6+             | Discussions / API auth / monetization          | 6 partial                                                                                                                              |

## What's left to v1 release

### Pre-Phase-41 release-readiness audit (Phase 40 close; ~80-82%)

The Phase-40-close summary estimated ~80-82% complete to v1, with
gains from framework infrastructure (Phase 37-40) rather than
feature-side.

### Updated estimate post-Phase-44

Phases 41-44 added the third consumer + completed the per-consumer
expansion arc, achieving **full framework activation under default
dispatch**. This is **infrastructure maturation** rather than
new architectural surface in the §1-§11 sense — the release-
readiness percentage moves from ~80-82% → **~85-88%** at Phase 44
close.

The architectural surface is now **substantially complete**. What
remains in `lib/markdown/extensions/`:

- **Plugin-level capability additions** (alias syntax; cross-
  entity wikilinks; class styling; 404 handling; table-attrs)
- **Same-slot composition with two consumers** (DOI + arxiv both
  in `remarkPlugins`) — Phase 45 rank 1
- **Concrete-provider commits** sitting on framework slots
  (ADR-0025 moderation; possibly more)

The remaining work breakdown:

#### A. Framework consumer extension (~3-5 phases / ~15-25 units)

| Item                                                        | Phase est. | Notes                                                                      |
| ----------------------------------------------------------- | ---------- | -------------------------------------------------------------------------- |
| **DOI sibling consumer** in `remarkPlugins` slot            | 2-3 units  | First compositional same-slot case; APPEND-D-Y item 4; **Phase 45 rank 1** |
| Multi-anchor wikilink alias `[[slug\|display]]`             | 1-2 units  | APPEND-D-L item 2; plugin regex extension                                  |
| Cross-entity wikilinks (`[[paper-id]]`, etc.)               | 2-3 units  | APPEND-D-L item 3; entity-type disambiguation + plugin parameterization    |
| Table-specific attributes (`colspan` / `rowspan` / `scope`) | 1-2 units  | APPEND-D-Q item 3; XSS-audit required                                      |
| `<a class="wikilink">` styling                              | 1-2 units  | APPEND-D-L item 4; schema-override extension                               |
| 404 handling for unresolved wikilinks                       | 2-3 units  | APPEND-D-L item 5; build-time validation + render-time fallback            |
| `@mention` resolution consumer                              | 2-3 units  | Conditional on Q73 gate (Google OAuth + curator-profile routes)            |

Most of these are demand-signal-first — they ship only if curator
authoring patterns indicate need. Realistic Phase-45+ landing:
~2-4 of these threads before v1, depending on user direction.

#### B. Architectural surface (~2-4 phases / ~10-20 units)

| Item                                          | Phase est. | Notes                                                                                                           |
| --------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| ADR-0025 concrete content-moderation provider | 3-5 units  | Phase-35 framework end-to-end realization; needs curator content authorship OR external-API operational unblock |
| Account-deletion blob cleanup                 | 1-2 units  | Conditional on account-delete UI existing first                                                                 |
| Q78 digest-send analytics                     | 3-5 units  | Waits for Q77 (cron secret) production signal                                                                   |
| Pre-commit typecheck hook                     | 1 unit     | Closes Unit-36.1 gap; tiny                                                                                      |
| `safeAuth()` extraction                       | 1 unit     | Hold until 5+ in-place copies (currently 4)                                                                     |
| Subscribe + `/profile` test backfill          | 1-2 units  | Closes Unit-35.2 + 36.2 gaps; not user-visible                                                                  |

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

### Best-guess completion bound (updated post-Phase-44)

- **Framework consumer extension** (realistic 2-4 threads): 3-5
  phases ≈ **15-25 units**.
- **Architectural surface remaining**: 2-4 phases ≈ **10-20
  units**.
- **Total remaining phase-work to v1**: **~5-9 phases ≈ 25-45
  units** (revised down from Phase-40-close estimate of 7-15
  phases / 35-75 units; this session's 20 commits closed ~4
  phases worth of expansion arc).

At the current rate of ~5 units / session, ~10-20 units / week
(this session shipped 20 units in one extended sitting),
**v1 ship is ~2-5 weeks of focused session work away**,
EXCLUDING operational unblock (Q54 + Q55 + Q69 + Q73 + Q75 + Q77
= curator-track; varies per registration operational cadence).

**The architectural surface is ≥95% complete.** What remains is
mostly:

- Concrete provider implementations sitting on framework slots
  (ADR-0025 moderation; potentially same-slot composition via
  DOI sibling consumer).
- Plugin-level capability additions (alias syntax; cross-entity;
  class styling; 404 handling).
- Long-tail operational scripts + test backfills.
- Methodology v2 + content authoring (curator-track).

## What the rhythm has produced this session

This session shipped **20 commits across 4 phases** (Phase 41 + 42

- 43 + 44), each phase 5 units (prep + 1-2 code units + hygiene +
  gate). Sustained rate: 5 units / phase; 4 phases / session.

**Architectural rhythm observed this session**:

- **"Constructor-arg-only zero-rework expansion" property**
  validated end-to-end for all 3 consumers (Phase 42 wikilinks
  - Phase 43 tables + Phase 44 arxiv). Each Phase 38/39/41
    consumer documented this property in its APPEND; Phase 42 + 43
  - 44 each ship a realization. Pattern matured.
- **APPEND-deferral closure cadence pattern**: one APPEND-
  deferral resolved per phase, oldest first. Phase 42 closed
  Phase-38 D-L item 1; Phase 43 closed Phase-39 D-Q item 2;
  Phase 44 closed Phase-41 D-Y item 1. Cross-surface-expansion
  deferrals are now EXHAUSTED.
- **APPEND alphabet wrap**: Phase 42 consumed last single-letter
  D-Z; Phase 43 used first two-letter D-AA; Phase 44 used second
  two-letter D-AB. Excel-spreadsheet column convention validated.
- **Same-surface different-slot composition** validated end-to-
  end at increasing surface counts: Phase 42 reviewNotes only;
  Phase 43 all 4 surfaces; Phase 44 all 4 surfaces with all 3
  slots active simultaneously (rationale under Phase 43; all
  surfaces under Phase 44).
- **Framework + class + plugin code remains stable** since
  Phase 37/38/39/40/41 ship commits — cross-surface expansions
  touch ONLY constant-value + tests + ADR APPENDs.

## Confidence in the estimate

The 2-5-week estimate has moderate uncertainty:

- **Lower bound (2 weeks)**: assumes user-direction stays
  consistent with autonomous-tractable threads (DOI consumer;
  alias syntax; cross-entity; class styling); operational gates
  unblock in parallel; v2 methodology authoring out-of-scope for
  v1.
- **Upper bound (5 weeks)**: includes 2-3 framework-consumer
  threads of dubious demand-signal value; includes 1-2 curator-
  track threads needing human direction; assumes some scope
  creep.
- **Beyond 5 weeks**: would indicate scope changes — new Q-class
  items emerging or major rework of an existing ADR.

Operational unblock (Q54/55/69/73/75/77) is genuinely uncertain —
depends on the user's calendar for registering 6 external accounts.
Could be 1 weekend OR multiple weeks if spread out.

## Risk register (carryover from Phase-40-close summary + new)

- **`safeAuth()` extraction threshold (4 → 5)**: next NextAuth
  consumer adds the 5th copy; should trigger extraction.
- **Phase-36 `users.profilePublic` opt-out** has no migration path
  for users who set `profilePublic=false` then want to delete
  account (account-deletion UI doesn't exist).
- **Multi-value `MARKDOWN_EXTENSIONS` schema-override conflict**
  is loud-failure-on-misconfiguration — operator running
  `MARKDOWN_EXTENSIONS=tables,X` where X also provides
  schemaOverrides on any surface would see a throw at first
  request.
- **Same-slot plugin composition (Phase 45+)**: when two consumers
  both contribute to `remarkPlugins` (or `rehypePlugins`), APPEND-
  D-R rule is "concatenate in component registration order". For
  DOI + arxiv specifically: plugin-execution order may matter
  (e.g., arxiv before DOI to disambiguate `arxiv:NNNN.NNNNN` from
  a hypothetical `arxiv:` prefix in a DOI suffix). Phase 45 will
  define and test this.
- **Test suite at 921 tests** runs in 14s consistently — no
  performance concern; +88 tests this session ran in the same
  total duration. Threshold for parallelization remains >20s.
- **APPEND letter slot growth**: Phase 44 used D-AB; at one phase
  per single APPEND, the AA-AZ range covers phases 43-68
  (~25 phases); BA-BZ another 26; etc. The convention is
  sustainable for many future phases.

## Session-specific milestone summary

**This session's headline**: Per-consumer expansion arc COMPLETE

- full framework activation under default dispatch achieved. All
  3 Phase-37 framework consumers (wikilinks + tables + arxiv) ship
  default-enabled on all 4 markdown surfaces (bio + reviewNotes +
  rationale + actionRationale). Under 3-way default dispatch
  (`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv`), every surface has
  all 3 framework slots simultaneously active — 12 component-
  surface-slot triples, all conflict-free per APPEND-D-R. The
  framework's maximal default-enabling configuration is reached at
  Phase 44 ship.

This is **infrastructure maturation**, not new architectural
surface. The release-readiness percentage moves from ~80-82%
(Phase 40 close) → **~85-88%** at Phase 44 close. Approximately
**~2-5 weeks of focused session work** remains to v1 ship,
excluding operational unblock (curator-track).

---

_Generated 2026-05-18 at Phase 44 close (HEAD `a7e971b`).
Supersedes `docs/PROGRESS_SUMMARY_2026-05-18.md` (Phase 40
close); previous file remains as historical record._
