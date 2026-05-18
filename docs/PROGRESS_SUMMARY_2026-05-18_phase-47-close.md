# LLM OpenProblems — progress summary + remaining-workload estimate (Phase 47 close; 2026-05-18 evening)

> **Supersedes** `docs/PROGRESS_SUMMARY_2026-05-18_phase-44-close.md`
> (Phase 44 close; earlier same-day snapshot). The earlier file
> remains as historical record per project audit-trail discipline.

## Snapshot at HEAD `7a0eada`

| Dimension                                         | Value                                         | Trajectory                                                                                                  |
| ------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Phases shipped                                    | **0 → 47** (48 closed)                        | +3 phases this session (45/46/47); 5 numbered units each + 3 parallel sub-units = 18 commits                |
| Tests                                             | **1038 / 72 files**                           | +117 / +1 since Phase 44 close                                                                              |
| ADRs                                              | **24**                                        | UNCHANGED Phase 35-47 (**12 consecutive no-new-ADR phases**; longest since project inception)               |
| ADR D-clause APPEND clusters                      | 11 D-clauses with APPENDs                     | ADR-0018 D-G holds **14 APPENDs** — project record (+3 this session: D-AC, D-AD, D-AE)                      |
| DB tables                                         | 7                                             | UNCHANGED since Phase 30                                                                                    |
| Migrations                                        | 9                                             | UNCHANGED since Phase 36                                                                                    |
| Env vars                                          | 14                                            | UNCHANGED since Phase 38 (`MARKDOWN_EXTENSIONS` gains `doi` recognized value Phase 45; variable count same) |
| `MARKDOWN_EXTENSIONS` single-value arms           | 5                                             | +1 this session (Phase 45 `doi`)                                                                            |
| i18n keys per locale                              | 168 (en + fr)                                 | UNCHANGED since Phase 36                                                                                    |
| First Load JS shared chunk                        | **103 kB**                                    | UNCHANGED **96 consecutive units** (Phase 9 Unit 9.5 → Phase 47 Unit 47.4)                                  |
| Middleware bundle                                 | 160 kB                                        | UNCHANGED since Phase 12                                                                                    |
| OPEN_QUESTIONS top-level Q-count                  | 66 (28 resolved + 4 lean + 34 open)           | UNCHANGED Phase 36-47                                                                                       |
| Phase-37+ candidate count                         | 8                                             | UNCHANGED Phase 39-47 (within-bucket framework realizations don't decrement top-level count)                |
| Operational gates pending                         | 6 (Q54 + Q55 + Q69 + Q73 + Q75 + Q77)         | UNCHANGED; all curator-track                                                                                |
| **Framework concrete consumers**                  | **4** (wikilinks + tables + arxiv + **doi**)  | +1 this session (doi Phase 45)                                                                              |
| **Framework slots with ≥2 consumers**             | **1** (`remarkPlugins`: arxiv + doi)          | +1 this session (Phase 45 first same-slot)                                                                  |
| **Plugin-regex-extension realizations**           | **2** (wikilinks alias P46 + arxiv alias P47) | +2 this session (Phase 46 first; Phase 47 second realization → pattern's slot-independence validated)       |
| **Dual-form regex realizations**                  | **1** (arxiv; Phase 47)                       | +1 this session                                                                                             |
| **Surfaces with multiple alias-syntax consumers** | **1** (rationale under 4-way default)         | +1 this session (Phase 47 first dual-alias surface)                                                         |
| **"Continue" override invocations**               | **42** (across Phases 6-47)                   | +3 this session                                                                                             |
| **No-new-B-category streak**                      | **17 phases** (Phase 31-47)                   | +3 this session (extends record from 14 → 17)                                                               |
| **Runtime deps added**                            | **0 since Phase 41**                          | 0 this session                                                                                              |
| `lib/markdown/extensions/` files                  | 15                                            | +2 this session (`doi.ts` + `doi.test.ts`)                                                                  |

## Narrative arc — what's shipped (Phase 0 → Phase 47)

The project has shipped **48 phases** spanning the original
MASTER_PROMPT.md §12 phase plan PLUS extensive user-state /
community-features / markdown-framework expansion. Each phase runs
~5 units (standardized to 4-5 units Phase 24+; 5 numbered units
Phase 35+).

### Phases 0-9: original foundation (per MASTER_PROMPT.md §12)

Same as prior summary — Foundation through §13-closing Auth + read+write API.

### Phases 10-36: user-state + editorial-pipeline + operational-script-keystone + email + moderation arc

Same as prior summary — Profile, rating-challenge submission,
curator review pipeline, public profile, image upload, EXIF
strip, markdown rendering, EXIF backfill, orphan-blob cleanup,
operational CLIs, OAuth expansion, subscriber-list email
foundation, weekly digest, per-user subscriptions, framework-only
content moderation, per-user privacy opt-out.

### Phases 37-44: the markdown-extension framework arc (8-phase cluster)

Same as prior summary — framework definition, 3 concrete
consumers, composition infrastructure, 3 cross-surface
expansions. **Full framework activation under default dispatch**
achieved Phase 44.

### Phases 45-47: the alias-syntax + same-slot cluster (NEW this session; 3 phases)

- **Phase 45 (DOI sibling consumer)**: **Fourth concrete Phase-37-
  framework consumer**. `DoiExtensionRegistry` + new file
  `lib/markdown/extensions/doi.ts` + `MARKDOWN_EXTENSIONS=doi`
  factory arm + APPEND-D-AC. **First second-consumer in any
  single framework slot** — DOI joins arxiv in `remarkPlugins`.
  **First compositional same-slot case** in project history —
  APPEND-D-R "concatenated across components in registration
  order" rule for `remarkPlugins` becomes live with two real
  consumers (previously trivially satisfied). **First "two
  plugins active in the same slot on the same surface under
  default dispatch" state**. **First "4-consumer composition
  under default dispatch" state** via
  `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi`. Closes
  APPEND-D-Y item 4 deferral at 4-phase carryover. 5 numbered
  units + 2 parallel-session docs sub-units (45.0a + 45.1a +
  45.4a for figures/README polish). +64 tests / +1 file.

- **Phase 46 (Wikilink alias syntax)**: **First plugin-regex-
  extension within an existing Phase-37-framework consumer in
  project history**. Introduces a **fifth phase-shape pattern**
  to the framework alongside new-consumer (38/39/41/45),
  composition-infrastructure (40), cross-surface-expansion
  (42/43/44), and acceptance-gate phases. `WIKILINK_PATTERN`
  regex evolves in-place from `/\[\[([a-z0-9-]+)\]\]/g` to
  `/\[\[([a-z0-9-]+)(?:\|([^\]\n]+))?\]\]/g`. **First "display-
  text divergence from slug" rendering** in any framework
  consumer. **First alias-syntax surface**. Closes APPEND-D-L
  item 2 at **8-phase carryover** (longest APPEND-D-L item
  closure to date). +27 tests.

- **Phase 47 (Arxiv alias syntax)**: **Second realization of the
  Phase-46 plugin-regex-extension phase-shape pattern**;
  pattern's slot-independence validated. **First plugin-regex-
  extension on a `remarkPlugins` consumer** in project history.
  `ARXIV_PATTERN` evolves to **first dual-form regex** in the
  framework — alternation between bracketed
  `[[arxiv:NNNN.NNNNN|display]]` (priority) and bare
  `arxiv:NNNN.NNNNN` (fallback). **First "alias-syntax on a non-
  bracketed-base consumer"**. **First "first-match-wins regex
  priority" discipline** within a single plugin's regex. **First
  "dual-alias surface"** — rationale under 4-way default carries
  both wikilinks alias + arxiv alias simultaneously. **Collision-
  freedom-via-stage-AND-regex-disjointness discipline
  established**. Closes APPEND-D-Y item 5 at 6-phase carryover.
  +26 tests.

## Architectural firsts summary (this session)

This session shipped **36 enumerated firsts** across Phase 45-47:

### Phase 45 firsts (12)

1. Fourth concrete Phase-37-framework consumer
2. First second-consumer in any single framework slot
3. First compositional same-slot case in project history
4. First "two plugins in same slot on same surface" state
5. First "4-consumer composition under default dispatch" state
6. APPEND-D-Y item 4 closure at 4-phase carryover
7. First non-cross-surface-expansion APPEND-deferral closure
8. APPEND-deferral closure cadence sustained 4 phases
9. 12th APPEND on ADR-0018 D-G (record 11 → 12)
10. Third two-letter APPEND letter D-AC
11. First "framework + 4 consumers + composition + 3 expansions
    - same-slot composition" 9-phase cluster (Phase 37-45)
12. 15th consecutive phase without new B category (first 15-phase
    run)

### Phase 46 firsts (12)

1. **First plugin-regex-extension within an existing Phase-37-
   framework consumer in project history**
2. First "display-text divergence from slug" rendering
3. First alias-syntax surface in any framework consumer
4. APPEND-D-L item 2 closure at 8-phase carryover (longest
   APPEND-D-L item closure to date)
5. Fifth prep-/APPEND-doc-level deferral closed by a later phase
6. Second non-cross-surface-expansion APPEND-deferral closure
7. 13th APPEND on ADR-0018 D-G (record 12 → 13)
8. Fourth two-letter APPEND letter D-AD
9. First 10-phase cluster (Phase 37-46)
10. 16th consecutive phase without new B category
11. 92nd consecutive 103 kB First Load JS unit
12. Thirty-seventh NON-§13 phase

### Phase 47 firsts (12)

1. Second realization of the Phase-46 plugin-regex-extension
   phase-shape pattern (slot-independence validated)
2. First plugin-regex-extension on a `remarkPlugins` consumer
3. **First dual-form regex in the framework**
4. First "alias-syntax on a non-bracketed-base consumer"
5. First "first-match-wins regex priority" discipline within a
   single plugin's regex
6. **First "dual-alias surface" in project history**
7. APPEND-D-Y item 5 closure at 6-phase carryover
8. Sixth prep-/APPEND-doc-level deferral closed by a later phase
9. Third non-cross-surface-expansion APPEND-deferral closure
10. 14th APPEND on ADR-0018 D-G (record 13 → 14)
11. Fifth two-letter APPEND letter D-AE
12. First 11-phase cluster (Phase 37-47) + 17th consecutive
    phase without new B category + thirty-eighth NON-§13 phase

## Remaining-phases estimate

The MASTER_PROMPT.md §12 phase plan covered 7 numbered phases
(0-6+). The project has expanded substantially within Phase 4-5
scope (user-state, community, markdown framework). Phase 48+
candidates span:

### Tier 1 — autonomous-tractable framework evolutions (~6-10 phases)

These follow established phase-shape patterns and require no new
ADRs. Each is 1-2 units (smaller scope than the 5-unit framework-
cluster phases).

| Estimate              | Thread cluster                                    | Phase-shape pattern                                             | Closes                                    |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| Phase 48 (1-2 units)  | DOI alias syntax                                  | Plugin-regex-extension (3rd realization)                        | New Phase-46 doi-alias deferral           |
| Phase 49 (1-2 units)  | Older-style category-prefixed arxiv IDs           | Plugin-regex-extension on arxiv (2nd extension on same plugin)  | APPEND-D-Y item 2                         |
| Phase 50 (1-2 units)  | Table-specific attributes (colspan/rowspan/scope) | Plugin-schema-extension on tables (1st on schemaOverrides slot) | APPEND-D-Q item 3                         |
| Phase 51 (1-2 units)  | DOI cross-surface expansion                       | Cross-surface-expansion (4th realization)                       | New Phase-45 APPEND-D-AC deferral         |
| Phase 52 (1-2 units)  | `<a class="wikilink">` styling                    | First single-consumer-multi-slot case                           | APPEND-D-L item 4                         |
| Phase 53 (1-2 units)  | Bare arxiv / DOI IDs without prefix               | Plugin-regex-extension (ambiguity-sensitive)                    | APPEND-D-Y item 3 + new Phase-45 deferral |
| Phase 54 (2-3 units)  | Cross-entity wikilinks + plugin parameterization  | Plugin-parameterization (introduces new shape)                  | APPEND-D-L items 3 + 6                    |
| Phase 55 (2-3 units)  | 404 handling for unresolved wikilinks             | Build-time validation step (introduces new shape)               | APPEND-D-L item 5                         |
| Phase 56+ (2-3 units) | PubMed PMID sibling consumer                      | New-consumer (5th concrete consumer)                            | New Phase-45 deferral                     |

**Tier 1 estimate**: **~9 phases × ~5 units (per the framework-
cluster phase shape) ≈ 45 units ≈ 9 days at 1 phase/day pace** (or
9 more multi-phase sessions like this one).

### Tier 2 — patience-signal closures requiring new ADRs (~2-4 phases)

| Estimate              | Thread                                                 | ADR                                           |
| --------------------- | ------------------------------------------------------ | --------------------------------------------- |
| Phase N (3-5 units)   | ADR-0025 concrete content-moderation provider          | ADR-0025 (closes 12+ phase no-new-ADR streak) |
| Phase N+k (2-3 units) | Q78 / Q79 outstanding architectural items              | Possibly ADR-0026/0027                        |
| Phase N+m (variable)  | Q-resolutions that became architecturally load-bearing | Variable                                      |

**Tier 2 estimate**: **~3 phases × ~5 units ≈ 15 units**.

### Tier 3 — operational unblock (curator-tracked; not autonomous)

These are NOT phase work — they're production-deploy unblock
items pending curator action:

- Q54 (GitHub OAuth registration)
- Q55 (Turso prod DB provision)
- Q69 (Vercel Blob store)
- Q73 (Google OAuth registration)
- Q75 (Resend sender domain)
- Q77 (CRON_SECRET)

**Tier 3 estimate**: **~1-2 days curator wall-clock; 0 autonomous
phases**.

### Tier 4 — content authoring (curator-tracked; ongoing)

- More seed problems (currently 10; target 50-100 per MASTER_PROMPT
  §16 with `TODO(curate)` placeholders to fill)
- More papers (currently 30; target 100-300)
- More rating actions (1-3 per problem; currently mostly initial)
- Bilingual content (currently 2 surfaces; expand per Phase 7-8)

**Tier 4 estimate**: ongoing curator workload; not phase work.

## Aggregate remaining estimate

**~12 framework-cluster phases (Tier 1 + 2) ≈ 60 units ≈ 12 full-
day single-session sprints** to reach a state where:

- The Phase-37 framework has 5+ concrete consumers covering all
  3 slots with multiple consumers per slot.
- All remaining APPEND-D-L / D-Y / D-Q deferrals are closed
  (cross-entity wikilinks; class styling; 404 handling; table
  attributes; bare ID matching; etc.).
- ADR-0025 concrete moderation provider lands, closing the 12+
  phase no-new-ADR streak.
- The "architecture is ≥90% complete" claim from Phase 44
  remains accurate; gates to production deploy are now the
  Tier-3 operational unblock items (Q54/55/69/73/75/77).

After Tier 1 + 2 close, the project enters a different mode:
**content-authoring intensive** rather than **framework-evolution
intensive**. Phase-shape patterns established Phase 37-47 (new-
consumer, cross-surface-expansion, plugin-regex-extension,
plugin-schema-extension, plugin-parameterization, single-
consumer-multi-slot, build-time-validation) become routine
mechanisms; curator effort shifts to content (problem authoring,
paper authoring, rating-action emission, methodology refinement)
and operations (deployment, cron setup, OAuth provisioning).

## Deployment readiness

**Architecture: ≥90% complete** (carried from prior summary;
Phase 45-47 added consumer + alias-syntax + dual-form-regex
capability but no architectural debt).

**Production-deploy gates**: 6 operational gates pending
(unchanged Tier-3 list).

**Content-side gates**: ~50-200 problems / ~100-300 papers /
~150-500 rating actions to author for the platform to feel "full"
(loose curator-judgment numbers; no hard target in
MASTER_PROMPT.md).

## Bundle / test / lint metrics

All preserved through every Phase 45-47 unit:

- **First Load JS shared chunk**: 103 kB UNCHANGED (96
  consecutive units).
- **Middleware bundle**: 160 kB UNCHANGED since Phase 12.
- **`pnpm test`**: 1038 / 72 files (+117 / +1 vs Phase 44 close).
- **`pnpm audit-content`**: 0 errors / 6 warnings (Q32 baseline;
  43 consecutive phases).
- **`pnpm typecheck`**: clean.

## Project-record-extending statistics this session

- **ADR-0018 D-G APPEND record**: 11 → 14 (extends single-D-clause
  APPEND-count record by +3 in 3 phases).
- **Plugin-regex-extension realizations**: 0 → 2 (new phase-shape
  pattern established at Phase 46; slot-independence validated
  Phase 47).
- **Dual-form regex realizations**: 0 → 1 (Phase 47 first; sets
  pattern for future Phase-48+ alias-syntax extensions).
- **Surfaces with multiple alias-syntax consumers**: 0 → 1 (Phase
  47 first dual-alias surface).
- **"Continue" override count**: 39 → 42 (Phase 45 + 46 + 47
  entry confirmations).
- **No-new-B-category streak**: 14 → 17 phases (first 17-phase
  run in project history).
- **No-new-ADR streak**: 9 → 12 consecutive no-new-ADR phases
  (longest streak in project history; ADR-0025 candidate slot
  remains open since Phase 35).
- **Single-letter ADR D-clause APPEND-letter sequence**:
  CONSUMED through Z at Phase 42; two-letter sequence consumed
  through D-AE this session.
- **`lib/markdown/extensions/`**: 13 → 15 files (+2 this
  session: `doi.ts` + `doi.test.ts`).
- **Framework concrete consumers**: 3 → 4 (DOI joins wikilinks +
  tables + arxiv at Phase 45).
- **`MARKDOWN_EXTENSIONS` recognized single-value arms**: 4 → 5
  (Phase 45 adds `doi`).

## What did NOT happen this session

- **Zero new ADRs**: 24 → 24 (no new ADR ships; 12 consecutive
  no-new-ADR phases). ADR-0025 candidate slot remains open since
  Phase 35.
- **Zero new migrations**: 9 → 9 unchanged.
- **Zero new DB tables**: 7 → 7 unchanged.
- **Zero new env vars**: 14 → 14 unchanged (existing
  `MARKDOWN_EXTENSIONS` gains 1 recognized value via Phase-45
  `doi`).
- **Zero new i18n keys**: 168 → 168 unchanged.
- **Zero new client-side bundle bytes**: 103 kB → 103 kB
  unchanged.
- **Zero new runtime deps**: 0 this session.
- **Zero new top-level OPEN_QUESTIONS**: 66 → 66 unchanged.
- **Zero Phase-37+ candidate count change**: 8 → 8 unchanged.
- **Zero new operational gates**: 6 → 6 unchanged.
- **No B-category surfacing**: Phase 31-47 = 17 consecutive phases
  without a new B item.

## Recommendation for Phase 48

Phase 48 rank-1 is **DOI alias syntax** — the natural continuation
of the alias-syntax cluster (3rd realization of the Phase-46
plugin-regex-extension phase-shape pattern). It would:

- Close the new Phase-46 doi-alias deferral at 2-phase carryover.
- Extend the alias-syntax cluster to 3 of 4 framework consumers
  (wikilinks Phase 46 + arxiv Phase 47 + doi Phase 48).
- Validate the dual-form regex pattern's reusability — DOI has
  already-complex backwards-compat (period-in-suffix
  disambiguation) so adding bracketed alternation is the most
  sophisticated regex evolution to date.
- Take APPEND-D-AF (sixth two-letter slot) on ADR-0018 D-G,
  extending the project record from 14 → 15.
- 1-2 units total (mirrors Phase 46 + 47 verbatim).

Alternative ranks 2-10 documented in
`docs/thinking/47.4-phase-47-acceptance-gate.md`.
