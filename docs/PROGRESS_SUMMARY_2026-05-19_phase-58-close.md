# Progress summary — Phase 58 close (2026-05-19)

> Narrative progress summary at HEAD `af153b1`. Supersedes
> `docs/PROGRESS_SUMMARY_2026-05-19_phase-55-close.md` (which
> remains as historical record). Companion to
> `docs/SESSION_HANDOFF_2026-05-19_phase-58-close.md` (paste-
> into-fresh-session payload) and the live ledger in
> `CHANGELOG.md` (~13,000+ lines).

## Where the project stands

**59 / 59 phases shipped** (Phase 0 → Phase 58, all ✅
closed). Phase 59 awaiting explicit human sign-off per §12.
**24 accepted ADRs** (23 consecutive no-new-ADR phases since
Phase 36 — longest streak in project history; ADR-0025
candidate slot open since Phase 35). **1391 / 75 vitest
tests** at HEAD. **103 kB First Load JS** unchanged for 149
consecutive units (Phase 9 Unit 9.5 → Phase 58 Unit 58.4;
100-unit threshold crossed at Phase 48 Unit 48.3). **160 kB
middleware** unchanged since Phase 12.

## Session arc (Phase 56 → 58; 15 numbered units)

| Phase | Theme                                                                    | HEAD at close | Tests   | Headline architectural first                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------ | ------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 56    | ORCID cross-surface expansion → all 4 surfaces                           | `df64261`     | 1324/74 | **Sixth realization of constructor-arg-only zero-rework expansion** (first 6-realization for that pattern); **first state with TWO coexisting 6-realization framework patterns** (plugin-regex-extension at 6 from Phase 55 + constructor-arg-only-expansion at 6 from Phase 56); first all-4-surfaces quintuple-alias + 4-consumer same-slot + 6-consumer composition; **first "all-surfaces saturated at maximum-consumer-cardinality" state**; ties Phase-52 fastest cross-surface closure record at 2-phase                                                                                 |
| 57    | Table-specific attributes (`colspan`/`rowspan`/`scope`) schema-extension | `2c3b9ff`     | 1339/74 | **First schema-override extension on the `schemaOverrides` slot kind** in project history; **first "schema-extension" phase-shape pattern** (sibling to plugin-regex-extension); **first all-3-slots-evolved state** (`remarkPlugins` 5× + `rehypePlugins` 1× + `schemaOverrides` 1×); **first evolution of `GFM_TABLE_SCHEMA_OVERRIDES` since Phase 39 ship** (18-phase constant-stability streak ends); **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED** at 18-phase carryover; first "schema-ready-before-plugin" pattern; first new phase-shape since Phase 46 (11-phase gap) |
| 58    | bioRxiv preprint consumer (7th concrete consumer)                        | `af153b1`     | 1391/75 | **Seventh concrete Phase-37-framework consumer** — first 7-consumer framework state; **first 5th-`remarkPlugins` consumer** beyond arxiv + doi + pubmed + orcid; **regex-disjointness-as-sole-defense discipline scales from 4 to 5 same-slot consumers** (4 consecutive scaling realizations Phase 48 → 50 → 54 → 58); **first 5-consumer same-slot composition** + **first 7-consumer composition under default dispatch** — new maximum-consumer-cardinality state; **8th env-var single-value arm**                                                                                         |

**+88 tests** since Phase-55-close start of session (1303 →
1391). **+1 vitest file** (74 → 75; `biorxiv.test.ts`). **+3
ADR-0018 D-G APPENDs** (22 → 25; record extends each phase;
**first 25-APPENDs milestone** crossed at Phase 58). **+2
`lib/markdown/extensions/` files** (19 → 21; `biorxiv.ts` +
`biorxiv.test.ts`). **+1 `MARKDOWN_EXTENSIONS` single-value
arm** (7 → 8; `biorxiv` joins; first expansion since Phase
54). **+1 Phase-37-framework concrete consumer** (6 → 7;
`BiorxivExtensionRegistry`). **+1 schema-extension realization**
(0 → 1; tables Phase 57 — **first schema-extension phase-
shape pattern**).

## What the framework looks like at HEAD

```
lib/markdown/extensions/  (21 files)
├── default.ts                  (Phase 37 — base allow-list)
├── default.test.ts             (Phase 37)
├── types.ts                    (Phase 37 — registry interface + 3 slots)
├── index.ts                    (Phase 37+ — factory dispatch + 8 single-value arms)
├── index.test.ts               (Phase 37+ — dispatch tests across 8 arms + 7-way composite)
├── wikilinks.ts                (Phase 38 → 42 all-4 → 46 alias-capable)
├── wikilinks.test.ts
├── tables.ts                   (Phase 39 → 43 all-4 → 57 schema-extension colSpan/rowSpan/scope)
├── tables.test.ts
├── composite.ts                (Phase 40 — `CompositeExtensionRegistry`)
├── composite.test.ts
├── arxiv.ts                    (Phase 41 → 44 all-4 → 47 dual-form alias → 53 legacy ID-class)
├── arxiv.test.ts
├── doi.ts                      (Phase 45 → 48 dual-form alias → 49 all-4)
├── doi.test.ts
├── pubmed.ts                   (Phase 50 → 51 dual-form alias → 52 all-4)
├── pubmed.test.ts
├── orcid.ts                    (Phase 54 → 55 dual-form alias → 56 all-4)
├── orcid.test.ts               (Phase 54 + 55)
├── biorxiv.ts                  (Phase 58 — 7th consumer; rationale-only first-ship)
└── biorxiv.test.ts             (Phase 58 — 27 tests)
```

**Composition matrix at Phase-58 close** under default
dispatch `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv`:

| Surface           | rehypePlugins     | schemaOverrides              | remarkPlugins                                           | Aliases active                                                                           |
| ----------------- | ----------------- | ---------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `bio`             | wikilinks (alias) | tables (Phase-57 schema-ext) | [arxiv, doi, pubmed, orcid] (all alias)                 | wikilinks + arxiv + doi + pubmed + orcid = **quintuple**                                 |
| `reviewNotes`     | wikilinks (alias) | tables (Phase-57 schema-ext) | [arxiv, doi, pubmed, orcid] (all alias)                 | wikilinks + arxiv + doi + pubmed + orcid = **quintuple**                                 |
| `rationale`       | wikilinks (alias) | tables (Phase-57 schema-ext) | **[arxiv, doi, pubmed, orcid, biorxiv]** (4 of 5 alias) | wikilinks + arxiv + doi + pubmed + orcid = **quintuple** (biorxiv not yet alias-capable) |
| `actionRationale` | wikilinks (alias) | tables (Phase-57 schema-ext) | [arxiv, doi, pubmed, orcid] (all alias)                 | wikilinks + arxiv + doi + pubmed + orcid = **quintuple**                                 |

**Maximum-consumer-cardinality state**: rationale carries **7
consumers across 3 slots** (wikilinks-rehype + tables-schema-
evolved + [arxiv, doi, pubmed, orcid, biorxiv]-remark; **new
maximum** post-Phase-58). Other 3 surfaces carry 6 consumers
(biorxiv inactive there per Phase-58 rationale-only default).
**All 4 surfaces are quintuple-alias** (Phase 56 ship; biorxiv
at Phase 58 first-ship is not yet alias-capable — alias-
syntax extension deferred Phase 59+).

## Cadence patterns

**APPEND-deferral closure cadence sustained 17 phases** —
longest in project history. Closures (oldest-applicable-
first):

| Phase  | Closes                                           | Carryover                                                                 |
| ------ | ------------------------------------------------ | ------------------------------------------------------------------------- |
| 42     | Phase-38 D-L item 1 (cross-surface wikilinks)    | 4-phase                                                                   |
| 43     | Phase-39 D-Q item 2 (cross-surface tables)       | 4-phase                                                                   |
| 44     | Phase-41 D-Y item 1 (cross-surface arxiv)        | 3-phase                                                                   |
| 45     | Phase-41 D-Y item 4 (DOI sibling consumer)       | 4-phase                                                                   |
| 46     | Phase-38 D-L item 2 (wikilink alias)             | 8-phase                                                                   |
| 47     | Phase-41 D-Y item 5 (arxiv alias)                | 6-phase                                                                   |
| 48     | Phase-45 D-AC item 2 (doi alias)                 | 3-phase (tied Phase-44 record at the time)                                |
| 49     | Phase-45 D-AC cross-surface                      | 4-phase                                                                   |
| 50     | Phase-45 D-AC PubMed PMID item                   | 5-phase                                                                   |
| 51     | new Phase-50 PubMed alias deferral               | **1-phase ← fastest ever observed** (record set)                          |
| 52     | Phase-50 D-AH PubMed cross-surface               | **2-phase ← fastest cross-surface closure** (record set)                  |
| 53     | Phase-41 D-Y item 2 (arxiv legacy)               | **12-phase ← longest absolute closure ever** (record set)                 |
| 54     | Phase-45 D-AC ORCID auto-link consumer item      | 9-phase (second-longest absolute at the time)                             |
| 55     | new Phase-54 ORCID alias deferral                | **1-phase ← ties Phase-51 fastest-closure record**                        |
| 56     | Phase-54 D-AL ORCID cross-surface item           | **2-phase ← ties Phase-52 fastest cross-surface record**                  |
| 57     | Phase-39 D-Q item 3 Table-specific attributes    | **18-phase ← NEW LONGEST ABSOLUTE closure ever** (record extends 12 → 18) |
| **58** | **Phase-54 D-AL bioRxiv preprint consumer item** | **4-phase** (standard consumer-first-ship gap)                            |

**Alias-syntax cadence** (5 realizations; theoretical floor
reached): **8 → 6 → 3 → 1 → 1** phases across the five alias-
syntax extensions (Phase 46 → 47 → 48 → 51 → 55). Phase 51 +
Phase 55 both shipped at **1-phase carryover** (cadence
acceleration has reached its theoretical floor; same-phase
closure would invalidate demand-signal-first first-ship
discipline). Phase 59 rank-2 (bioRxiv alias) would extend
the cadence to 6 realizations at the 1-phase floor (third
1-phase closure; first state where THREE alias-syntax
closures tie at 1-phase carryover).

**Cross-surface-expansion cadence** (6 realizations;
sustained-floor reached): **4 → 4 → 3 → 4 → 2 → 2** phases
(Phase 42 → 43 → 44 → 49 → 52 → 56). **Two consecutive
2-phase carryovers** (Phase 52 + Phase 56) confirm the
2-phase carryover is now the sustained-floor for cross-
surface-expansion APPEND-deferral closure. Phase 59 rank-1
(bioRxiv cross-surface) would extend the cadence to 7
realizations at the 2-phase floor (third 2-phase closure).

**Consumer-first-ship cadence** (4 sibling-consumer closures
stabilized at 4-to-5-phase gaps): Phase 41 → 45 doi 4-phase;
Phase 45 → 50 pubmed 5-phase; Phase 50 → 54 orcid 4-phase;
Phase 54 → 58 biorxiv **4-phase**. **Stabilized at 4-to-5-
phase gaps** across 4 successive sibling-consumer closures.

## Architectural firsts cumulative inventory

This session (Phase 56 → 58) shipped **36+ distinct
architectural firsts** documented across 3 acceptance-gate
THINK docs (~12 per phase). Cumulative inventory at Phase-58
close:

- **7 Phase-37-framework concrete consumers** (wikilinks ·
  tables · arxiv · doi · pubmed · orcid · biorxiv) exercising
  all 3 slots.
- **6 plugin-regex-extension realizations** (Phase 46
  wikilinks · 47 arxiv alias · 48 doi alias · 51 pubmed alias
  · 53 arxiv legacy ID-class · 55 orcid alias). **6-
  realization phase-shape pattern** (Phase 55 ship).
- **6 constructor-arg-only zero-rework expansion realizations**
  (Phase 42 wikilinks · 43 tables · 44 arxiv · 49 doi · 52
  pubmed · 56 orcid). **6-realization property** (Phase 56
  ship). **Completes the per-consumer all-4-surfaces arc for
  ALL 6 Phase-37-framework consumers** introduced through
  Phase 54 (biorxiv at Phase 58 first-ship still rationale-
  only; cross-surface deferred Phase 59+).
- **TWO coexisting 6-realization framework patterns** post-
  Phase 56 (plugin-regex-extension + constructor-arg-only-
  expansion). **First state where the framework exhibits two
  patterns each with 6 realizations**.
- **1 schema-extension realization** (Phase 57 tables table-
  specific attributes). **First schema-extension phase-shape
  pattern in project history** — sibling to plugin-regex-
  extension. Demonstrates consumer-extension is slot-kind-
  agnostic.
- **All 3 framework slot kinds evolved post-Phase-39**:
  `remarkPlugins` (5 evolutions) + `rehypePlugins` (1) +
  `schemaOverrides` (1). **First all-3-slots-evolved state**
  (Phase 57 ship).
- **4 dual-form regex realizations** (arxiv · doi · pubmed ·
  orcid). **All 4 `remarkPlugins` consumers exhibit dual-form
  regex post-Phase 55** — alias-syntax phase-shape exhausted
  all `remarkPlugins` consumer candidates as of Phase 55.
  bioRxiv at Phase 58 first-ship is NOT yet alias-capable
  (Phase 59+ candidate).
- **5 alias-syntax extensions** (wikilinks · arxiv · doi ·
  pubmed · orcid). Cadence acceleration to theoretical floor
  (1-phase floor reached at Phase 51 + 55).
- **1 plugin with 2 regex evolutions** (arxiv: Phase 47
  alias + Phase 53 legacy). **First plugin with 2 regex
  evolutions** in project history.
- **1 inner-class disjunction in a dual-form regex** (arxiv
  modern + legacy; Phase 53).
- **All 4 surfaces quintuple-alias** under 6-way default
  (Phase 56 ship — first all-4-surfaces quintuple-alias).
- **All 4 surfaces 4-consumer same-slot composition** under
  `arxiv,doi,pubmed,orcid` composite (Phase 56 ship).
- **All 4 surfaces 6-consumer composition under default
  dispatch** (Phase 56 ship — **first "all-surfaces saturated
  at maximum-consumer-cardinality" state**).
- **1 5-consumer same-slot composition** (rationale only;
  Phase 58 ship; cross-surface deferred Phase 59+).
- **1 7-consumer composition under default dispatch**
  (rationale only; Phase 58 ship — **new maximum-consumer-
  cardinality state**).
- **First 7-consumer cardinality in the Phase-37-framework**
  (Phase 58 ship): 7 consumers × 4 surfaces × 3 slots = 84
  component-surface-slot positions.
- **3 D-clauses with BOTH items closed within the closure
  cadence** (D-AC + D-AH + D-AL). **First state where THREE
  D-clauses have BOTH their enumerated deferrals resolved**
  (Phase 56 ship via D-AL closure).
- **2 immediate-successor same-thread-direction phase
  boundaries** (Phase 50 → 51 pubmed; Phase 54 → 55 orcid).
  Phase 59 rank-2 (bioRxiv alias) would create the third.
- **2 1-phase APPEND-deferral closures** (Phase 51 pubmed
  alias; Phase 55 orcid alias). Phase 59 rank-2 would create
  the third.
- **2 2-phase cross-surface-expansion APPEND-deferral
  closures** (Phase 52 pubmed; Phase 56 orcid). Phase 59
  rank-1 (bioRxiv cross-surface) anticipated to create the
  third (sustained-floor confirmed).
- **18-phase absolute APPEND-deferral closure record**
  (Phase 57 closes APPEND-D-Q item 3 from Phase 39 ship).
  **New longest absolute closure ever observed**; beats
  prior 12-phase Phase-53 record by 6 phases.
- **5 distinct phase-shape patterns** in the framework: new-
  consumer · composition-infrastructure · cross-surface-
  expansion · plugin-regex-extension · **schema-extension
  (Phase 57 NEW)** · acceptance-gate.
- **8 env-var single-value arms** (default · wikilinks ·
  tables · arxiv · doi · pubmed · orcid · biorxiv) + comma-
  separated compositions up to 7-way.

## Stable invariants

These have held through 5+ consecutive phases at Phase-58
close:

| Invariant                    | Value                                  | Streak                                            |
| ---------------------------- | -------------------------------------- | ------------------------------------------------- |
| ADR count                    | 24                                     | 23 phases (no new ADR since Phase 35)             |
| First Load JS shared chunk   | 103 kB                                 | 149 units (Phase 9 Unit 9.5 → Phase 58 Unit 58.4) |
| Middleware bundle            | 160 kB                                 | since Phase 12                                    |
| DB tables                    | 7                                      | since Phase 33                                    |
| Migrations                   | 9                                      | since Phase 36                                    |
| Env vars (total count)       | 14                                     | since Phase 33                                    |
| i18n keys per locale         | 168                                    | since Phase 31                                    |
| OPEN_QUESTIONS Q-count       | 66 (28 resolved + 4 lean + 34 open)    | since Phase 36                                    |
| `Q32` content-audit warnings | 6 (related_problems-symmetry baseline) | 54 consecutive phases                             |
| Phase-37+ candidate count    | 8                                      | since Phase 39                                    |
| No-new-B-category streak     | Phase 31-58 = 28 phases                | first 28-phase run                                |
| Runtime deps added           | 0 since Phase 41 (`@types/mdast`)      | 17 phases                                         |
| Single-session-phase streak  | Phase 54-58 = 5 phases                 | first 5-phase run                                 |

## Remaining-phases estimate (Phase 59 → ~65+)

The framework-evolution tier is nearing completion; the
alias-syntax cluster is **fully exhausted** for the original
4 `remarkPlugins` consumers (arxiv/doi/pubmed/orcid all have
alias syntax post-Phase 55), but bioRxiv at Phase 58 first-
ship is not yet alias-capable (Phase 59+ rank-2). Remaining
phase candidates fall into 3 tiers:

### Tier 1 — autonomous-tractable framework-evolution phases (~6 phases)

Each ~5 units mirroring Phase 41-58 shapes. Cumulative ~30
units ≈ 6 full-day single-session sprints.

| Phase | Theme                                                             | Lean                                                                                                                                                                                                                                          |
| ----- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 59    | **bioRxiv cross-surface expansion** to all 4 surfaces             | **7th realization of constructor-arg-only zero-rework expansion** (first 7-realization for that pattern; would extend Phase-56 6-realization record to 7); ties Phase-52/56 2-phase fastest cross-surface closure; rank 1 at Phase-58 gate.   |
| 60    | **bioRxiv alias syntax** `[[biorxiv:YYYY.MM.DD.NNNNNN\|display]]` | **7th realization of plugin-regex-extension phase-shape** (would extend Phase-55 6-realization record to 7); **third "immediate-successor same-thread-direction phase boundary"** at 1-phase carryover if shipped immediately after Phase 59. |
| 61    | `<a class="wikilink">` styling                                    | **Second schema-extension realization** sibling to Phase 57; closes APPEND-D-L item 4; couples with `schemaOverride` for `class` attribute.                                                                                                   |
| 62    | 404 handling for unresolved wikilinks                             | Closes APPEND-D-L item 5; build-time validation step.                                                                                                                                                                                         |
| 63    | Bare arxiv / DOI / PubMed / ORCID / bioRxiv IDs without prefix    | Regex evolution; ambiguity-sensitive.                                                                                                                                                                                                         |
| 64    | Empty-alias fallback unification + plugin parameterization        | Closes APPEND-D-L item 6 + new Phase-48 deferral.                                                                                                                                                                                             |

### Tier 2 — ADR-shaped phases (~2 phases)

Each ~5 units; introduce ADR-0025 + ADR-0026; close the
23+ phase no-new-ADR streak.

| Phase | Theme                                                                                                           | Lean                                                                                                                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 65    | **ADR-0025 concrete content-moderation provider**                                                               | Closes 25+ phase no-new-ADR streak (Phase 36-64); 4-phase implementation (provider config + dispatch + integration tests + smoke); promotes `NoopModerator` default to real provider via `MODERATION_PROVIDER` env-var dispatch |
| 66    | Cross-entity wikilinks (`[[paper-id\|display]]` / `[[author-slug\|display]]` / `[[institution-slug\|display]]`) | Closes APPEND-D-L item 3; requires plugin parameterization (closed Phase 64) first.                                                                                                                                             |

### Tier 3 — curator-track operational phases (~6 phases)

Each ~3-5 units; depend on curator action for the 6
operational gates (Q54/Q55/Q69/Q73/Q75/Q77).

| Phase | Theme                                    | Curator action       |
| ----- | ---------------------------------------- | -------------------- |
| 67    | GitHub OAuth production setup            | Q54                  |
| 68    | Turso production DB provisioning         | Q55                  |
| 69    | Vercel Blob store creation               | Q69                  |
| 70    | Google OAuth production setup            | Q73                  |
| 71    | Resend domain verification + cron secret | Q75 + Q77            |
| 72    | Production deploy + smoke gate run       | All Tier 3 unblocked |

### Aggregate remaining-workload estimate

| Tier                                         | Phases  | Units   | Calendar                                      | Curator unblock required |
| -------------------------------------------- | ------- | ------- | --------------------------------------------- | ------------------------ |
| Tier 1 (autonomous-tractable framework)      | 6       | ~30     | ~6 days single-session                        | No                       |
| Tier 2 (ADR-shaped + cross-entity wikilinks) | 2       | ~10     | ~2-3 days                                     | No                       |
| Tier 3 (operational gates)                   | 6       | ~25     | ~5-6 days but depends on curator availability | YES                      |
| **Total framework-evolution + operational**  | **~14** | **~65** | **~14 single-session days**                   | mixed                    |

After Tier 1-3 the project reaches **deployable state**:

- All current APPEND-D-L / D-Y / D-Q / D-AC deferrals closed.
- 7 concrete framework consumers (bioRxiv at Phase 58) +
  bioRxiv cross-surface + alias-syntax (Phase 59-60) + cross-
  entity wikilinks + plugin parameterization landed.
- ADR-0025 concrete moderation provider chosen + integrated.
- Production environment provisioned + smoke-gated.

Post-deploy, the project shifts from **framework-evolution-
intensive to content-authoring-intensive** (more seed
problems, papers, rating actions, bilingual content). The
framework's current capability ceiling (7 consumers × 4
surfaces × 3 slots; all 4 original `remarkPlugins` consumers
exhibiting dual-form regex; new schema-extension phase-shape
pattern available for second realization on wikilinks/
captions) is sufficient to support the content workload
through ~year 1 of public operation; Tier-4 scaling (full
bilingual content backfill; ~750-subscriber Resend-free-tier
ceiling unblock; concrete moderation provider invocation
budget) becomes the next workload tier.

## Recent acceleration patterns

The session shipped **15 numbered units across 3 phases** in
a single autonomous run (Phase 56 → 57 → 58), enabled by the
§12 sign-off discipline working as intended (each phase
boundary gated by an explicit "Continue" message; within-
phase units flowed unit-by-unit per the rhythm feedback
memory). **Three distinct phase-shape patterns** were
exercised this session:

- **Cross-surface expansion** (Phase 56 ORCID) — sixth
  realization of constructor-arg-only zero-rework expansion;
  ties 2-phase fastest closure record.
- **Schema-extension** (Phase 57 table-specific attributes)
  — **first realization of an entirely new phase-shape
  pattern** in project history; first new pattern since
  plugin-regex-extension Phase 46 (11-phase gap).
- **Consumer first-ship** (Phase 58 bioRxiv) — seventh
  consumer; first 5th-`remarkPlugins` consumer; regex-
  disjointness scales 4 → 5.

**Phase 59 entry conditions**: per §12, awaits explicit
human sign-off. The 10-ranked candidate table at
`docs/thinking/58.4-phase-58-acceptance-gate.md` Phase 59
entry conditions section enumerates the autonomous-tractable
and curator-dependent paths. Rank 1 (bioRxiv cross-surface)
mirrors Phase-56 ORCID cross-surface expansion verbatim;
rank 2 (bioRxiv alias) mirrors Phase-55 ORCID alias verbatim.
The natural Phase 58 → 59 → 60 arc would close BOTH bioRxiv
expansion + alias-syntax within ~2 phases of bioRxiv first-
ship (mirroring the Phase 50 → 51 → 52 PubMed and Phase 54 →
55 → 56 ORCID arcs).
