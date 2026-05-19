# Progress summary — Phase 61 close (2026-05-19)

> Narrative progress summary at HEAD `34a7d92`. Supersedes
> `docs/PROGRESS_SUMMARY_2026-05-19_phase-58-close.md` (which
> remains as historical record). Companion to
> `docs/SESSION_HANDOFF_2026-05-19_phase-61-close.md` (paste-
> into-fresh-session payload) and the live ledger in
> `CHANGELOG.md` (~14,000+ lines).

## Where the project stands

**62 / 62 phases shipped** (Phase 0 → Phase 61, all ✅
closed). Phase 62 awaiting explicit human sign-off per §12.
**24 accepted ADRs** (26 consecutive no-new-ADR phases since
Phase 36 — longest streak in project history; ADR-0025
candidate slot open since Phase 35). **1452 / 75 vitest
tests** at HEAD. **103 kB First Load JS** unchanged for 164
consecutive units (Phase 9 Unit 9.5 → Phase 61 Unit 61.4;
100-unit threshold crossed at Phase 48 Unit 48.3). **160 kB
middleware** unchanged since Phase 12.

**Framework state**: Phase 60 closed at the framework's
current capability ceiling — all 7 Phase-37-framework
consumers have had ALL their applicable extensions resolved
along both principal axes (registry-state axis = 4-surface
expansion; plugin-body axis = alias / regex evolution).
Phase 61 advanced the framework BEYOND that ceiling via the
2nd realization of the schema-extension phase-shape pattern
(extending Phase-57 from 1 → 2 realizations within tables).
**Phase 61 is the first phase to advance the framework
beyond its Phase-60 capability ceiling** via new realization
of an existing phase-shape pattern.

## Session arc (Phase 59 → 61; 15 numbered units)

| Phase | Theme                                            | HEAD at close | Tests   | Headline architectural first                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----- | ------------------------------------------------ | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 59    | bioRxiv cross-surface expansion → all 4 surfaces | `7924ca8`     | 1412/75 | **Seventh realization of constructor-arg-only zero-rework expansion** (first 7-realization for that pattern); **first state where constructor-arg-only-expansion (7) exceeds plugin-regex-extension (6) in realization count** — first asymmetric state at depth-6+ tier; **NEW FASTEST cross-surface-expansion APPEND-deferral closure record** at 1-phase carryover (extends 2-phase prior record by 1); first cross-surface-first post-first-ship arc (first reversed-order arc); **HALF-CENTURY-OF-NON-§13-PHASES MILESTONE** (Phase 59 = 50th NON-§13 phase)                                                                                                                                                                                                   |
| 60    | bioRxiv display-text alias syntax                | `05d6094`     | 1440/75 | **Seventh realization of Phase-46 plugin-regex-extension phase-shape pattern** (first 7-realization for that pattern); **first state where both principal axes of zero-rework framework extension are at 7 realizations** — first TWO 7-realization framework patterns coexisting; re-equalizes Phase-59 asymmetric state at depth-7 tier; **first 5-of-5 `remarkPlugins` consumers with dual-form regex**; **first state where ALL 7 Phase-37-framework consumers have had ALL applicable extensions resolved** — framework's current capability ceiling; first all-4-surfaces sextuple-alias state; D-AP becomes 4th D-clause with BOTH items closed; first D-clause with both items closed in REVERSED order; first consecutive-phases two-item D-clause closure |
| 61    | `<caption>` element schema-extension on tables   | `34a7d92`     | 1452/75 | **Second realization of the Phase-57-derived schema-extension phase-shape pattern** — first 2-realization for that pattern; first state where schema-extension is observed twice within the same consumer (tables); **tables consumer gains 3rd evolution**; **first state where TWO consumers have 3+ evolutions each** (arxiv + tables); **first phase to advance the framework beyond its Phase-60 capability ceiling**; **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED** at 22-phase carryover (extends Phase-57 18-phase by 4 phases); D-Q becomes first D-clause with 3-of-4 enumerated items closed; schema-ready-before-plugin extended from attributes to tags                                                                               |

**+61 tests** since Phase-58-close start of session (1391 →
1452). **75 vitest files UNCHANGED** (no new test files
Phases 59-61). **+3 ADR-0018 D-G APPENDs** (25 → 28; record
extends each phase; **first 28-APPENDs milestone** crossed at
Phase 61). **0 new `lib/markdown/extensions/` files** (21
UNCHANGED; all evolutions value-internal). **0 new
`MARKDOWN_EXTENSIONS` single-value arms** (8 UNCHANGED;
Phases 59-61 all evolved existing consumers). **0 new Phase-
37-framework concrete consumers** (7 UNCHANGED). **+1 plugin-
regex-extension realization** (6 → 7; Phase 60 bioRxiv
alias). **+1 constructor-arg-only zero-rework expansion
realization** (6 → 7; Phase 59 bioRxiv cross-surface). **+1
schema-extension realization** (1 → 2; Phase 61 tables
caption — **first 2-realization for the schema-extension
phase-shape pattern in project history**). **+1 dual-form
regex realization** (4 → 5; Phase 60 bioRxiv alias — first
5-of-5 `remarkPlugins` consumers with dual-form). **+1 D-
clause with BOTH items closed** (3 → 4; D-AP at Phase 60
alias-syntax ship). **+1 D-clause with 3+ items closed** (0
→ 1; D-Q at Phase 61 caption ship).

## What the framework looks like at HEAD

```
lib/markdown/extensions/  (21 files; UNCHANGED Phases 59-61)
├── default.ts                  (Phase 37 — base allow-list)
├── default.test.ts             (Phase 37)
├── types.ts                    (Phase 37 — registry interface + 3 slots)
├── index.ts                    (Phase 37+ — factory dispatch + 8 single-value arms)
├── index.test.ts               (Phase 37+ — dispatch tests across 8 arms + 7-way composite)
├── wikilinks.ts                (Phase 38 → 42 all-4 → 46 alias-capable)
├── wikilinks.test.ts
├── tables.ts                   (Phase 39 → 43 all-4 → 57 schema-ext (attributes) → 61 schema-ext (caption))
├── tables.test.ts
├── composite.ts                (Phase 40 — `CompositeExtensionRegistry`; single-source schemaOverrides per APPEND-D-C)
├── composite.test.ts
├── arxiv.ts                    (Phase 41 → 44 all-4 → 47 dual-form alias → 53 legacy ID-class)
├── arxiv.test.ts
├── doi.ts                      (Phase 45 → 48 dual-form alias → 49 all-4)
├── doi.test.ts
├── pubmed.ts                   (Phase 50 → 51 dual-form alias → 52 all-4)
├── pubmed.test.ts
├── orcid.ts                    (Phase 54 → 55 dual-form alias → 56 all-4)
├── orcid.test.ts
├── biorxiv.ts                  (Phase 58 → 59 all-4 → 60 dual-form alias)
└── biorxiv.test.ts             (Phase 58 + Phase 60 = 41 tests)
```

**Composition matrix at Phase-61 close** under default
dispatch `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv`:

| Surface           | rehypePlugins     | schemaOverrides                           | remarkPlugins                                    | Aliases active                                                    |
| ----------------- | ----------------- | ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `bio`             | wikilinks (alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | wikilinks + arxiv + doi + pubmed + orcid + biorxiv = **sextuple** |
| `reviewNotes`     | wikilinks (alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | wikilinks + arxiv + doi + pubmed + orcid + biorxiv = **sextuple** |
| `rationale`       | wikilinks (alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | wikilinks + arxiv + doi + pubmed + orcid + biorxiv = **sextuple** |
| `actionRationale` | wikilinks (alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | wikilinks + arxiv + doi + pubmed + orcid + biorxiv = **sextuple** |

**Maximum-consumer-cardinality state**: all 4 surfaces carry
**7 consumers across 3 slots** (wikilinks-rehype + tables-
schema-evolved-twice + [arxiv, doi, pubmed, orcid, biorxiv]-
remark; **second "all-surfaces saturated at maximum-consumer-
cardinality" state** post-Phase-59; first was Phase 56 at 6-
consumer cardinality). **All 4 surfaces are sextuple-alias**
(Phase 60 ship; first surface-with-6-alias-consumers
cardinality of 4 in project history). **All 7 Phase-37-
framework consumers have had ALL their applicable extensions
resolved** along both principal axes (Phase 60 ship; **framework
current capability ceiling** for the 7-consumer roster).
**Tables schemaOverrides evolved twice** (Phase 57 attributes

- Phase 61 caption; **first state where schema-extension is
  observed twice within the same consumer**).

## Cadence patterns

**APPEND-deferral closure cadence sustained 20 phases** —
longest in project history. Closures (oldest-applicable-
first):

| Phase  | Closes                                        | Carryover                                                                     |
| ------ | --------------------------------------------- | ----------------------------------------------------------------------------- |
| 42     | Phase-38 D-L item 1 (cross-surface wikilinks) | 4-phase                                                                       |
| 43     | Phase-39 D-Q item 2 (cross-surface tables)    | 4-phase                                                                       |
| 44     | Phase-41 D-Y item 1 (cross-surface arxiv)     | 3-phase                                                                       |
| 45     | Phase-41 D-Y item 4 (DOI sibling consumer)    | 4-phase                                                                       |
| 46     | Phase-38 D-L item 2 (wikilink alias)          | 8-phase                                                                       |
| 47     | Phase-41 D-Y item 5 (arxiv alias)             | 6-phase                                                                       |
| 48     | Phase-45 D-AC item 2 (doi alias)              | 3-phase                                                                       |
| 49     | Phase-45 D-AC cross-surface                   | 4-phase                                                                       |
| 50     | Phase-45 D-AC PubMed PMID item                | 5-phase                                                                       |
| 51     | new Phase-50 PubMed alias deferral            | 1-phase (fastest ever at the time)                                            |
| 52     | Phase-50 D-AH PubMed cross-surface            | 2-phase (fastest cross-surface at the time)                                   |
| 53     | Phase-41 D-Y item 2 (arxiv legacy)            | 12-phase (longest absolute at the time)                                       |
| 54     | Phase-45 D-AC ORCID auto-link consumer        | 9-phase                                                                       |
| 55     | new Phase-54 ORCID alias deferral             | 1-phase (ties Phase-51)                                                       |
| 56     | Phase-54 D-AL ORCID cross-surface item        | 2-phase (ties Phase-52)                                                       |
| 57     | Phase-39 D-Q item 3 Table-specific attributes | 18-phase (NEW LONGEST ABSOLUTE at the time)                                   |
| 58     | Phase-54 D-AL bioRxiv preprint consumer item  | 4-phase (standard consumer-first-ship gap)                                    |
| **59** | **Phase-58 D-AP bioRxiv cross-surface**       | **1-phase ← NEW FASTEST cross-surface closure record** (extends 2-phase by 1) |
| **60** | **Phase-58 D-AP bioRxiv alias**               | **2-phase ← first consecutive-phases two-item D-clause closure**              |
| **61** | **Phase-39 D-Q item 4 `<caption>` element**   | **22-phase ← NEW LONGEST ABSOLUTE closure record** (extends Phase-57 18 by 4) |

**Alias-syntax cadence** (6 realizations; cadence trajectory
NOT continuously accelerating): **8 → 6 → 3 → 1 → 1 → 2**
phases across the six alias-syntax extensions (Phase 46 → 47
→ 48 → 51 → 55 → 60). The 2-phase carryover at Phase 60
reflects the Phase-59 cross-surface-first ordering that
consumed the immediate-next-thread slot at 1-phase carryover
(cross-surface) instead of the alias slot — **first state
where alias-syntax extension follows cross-surface expansion
within the same consumer's post-first-ship arc**.

**Cross-surface-expansion cadence** (7 realizations; **NEW
FASTEST record at 1-phase**): **4 → 4 → 3 → 4 → 2 → 2 → 1**
phases (Phase 42 → 43 → 44 → 49 → 52 → 56 → 59). Phase 59
sets **NEW RECORD** at 1-phase carryover, achievable because
bioRxiv shipped without alias-syntax (unique among 5-of-7
framework consumers); first sub-2-phase cross-surface
closure in project history.

**Schema-extension cadence** (2 realizations): Phase-57
tables attributes 18-phase (record at the time); Phase-61
tables caption **22-phase (NEW RECORD)**. **First 2-
realization for the schema-extension phase-shape pattern**
in project history.

**Consumer-first-ship cadence** (4 sibling-consumer closures
stabilized at 4-to-5-phase gaps): Phase 41 → 45 doi 4-phase;
Phase 45 → 50 pubmed 5-phase; Phase 50 → 54 orcid 4-phase;
Phase 54 → 58 biorxiv 4-phase. **Stabilized at 4-to-5-phase
gaps** across 4 successive sibling-consumer closures.

## Architectural firsts cumulative inventory

This session (Phase 59 → 61) shipped **36+ distinct
architectural firsts** documented across 3 acceptance-gate
THINK docs (~12 per phase). Cumulative inventory at Phase-61
close:

- **7 Phase-37-framework concrete consumers** (wikilinks ·
  tables · arxiv · doi · pubmed · orcid · biorxiv) exercising
  all 3 slots; UNCHANGED Phases 59-61.
- **7 plugin-regex-extension realizations** (Phase 46
  wikilinks · 47 arxiv alias · 48 doi alias · 51 pubmed alias
  · 53 arxiv legacy ID-class · 55 orcid alias · **60 biorxiv
  alias**). **7-realization phase-shape pattern** (Phase 60
  ship; first 7-realization for that pattern).
- **7 constructor-arg-only zero-rework expansion
  realizations** (Phase 42 wikilinks · 43 tables · 44 arxiv ·
  49 doi · 52 pubmed · 56 orcid · **59 biorxiv**). **7-
  realization property** (Phase 59 ship). **Completes the per-
  consumer all-4-surfaces arc for ALL 7 framework consumers**.
- **TWO coexisting 7-realization framework patterns** post-
  Phase 60 (plugin-regex-extension + constructor-arg-only-
  expansion). **First state where the framework exhibits two
  patterns each with 7 realizations** (Phase 60 ship; re-
  equalizes Phase-59 asymmetric state at depth-7 tier).
- **2 schema-extension realizations** (Phase 57 tables
  attributes + **Phase 61 tables caption**). **First 2-
  realization for the schema-extension phase-shape pattern**
  (Phase 61 ship; extends Phase-57 record 1 → 2). **First
  state where the schema-extension pattern is observed twice
  within the same consumer** (tables).
- **All 3 framework slot kinds evolved post-Phase-39**:
  `remarkPlugins` (6 evolutions: arxiv 47 + 53; doi 48; pubmed
  51; orcid 55; biorxiv 60) + `rehypePlugins` (1: wikilinks 46) + `schemaOverrides` (2: tables 57 + 61). **First all-
  3-slots-evolved state** (Phase 57 ship; preserved through
  Phase 61).
- **5 dual-form regex realizations** (arxiv · doi · pubmed ·
  orcid · **biorxiv**). **First 5-of-5 `remarkPlugins`
  consumers with dual-form regex** (Phase 60 ship).
- **6 alias-syntax extensions** (wikilinks · arxiv · doi ·
  pubmed · orcid · **biorxiv**). Phase 60 was the third 1-
  phase carryover would have been NEW RECORD but came at 2-
  phase because cross-surface consumed the immediate-next-
  thread slot at Phase 59.
- **1 plugin with 2 regex evolutions** (arxiv: Phase 47 alias
  - Phase 53 legacy).
- **1 consumer with 3 evolutions on `schemaOverrides`** —
  wait, NO: tables has 1 cross-surface + 2 schema-extensions
  = 3 evolutions, but only 2 of those are schema-extensions
  (Phase 57 + Phase 61).
- **2 consumers with 3+ evolutions each** (arxiv + tables).
  **First state where TWO consumers have 3+ evolutions each**
  in project history (Phase 61 ship).
- **All 4 surfaces sextuple-alias** under 7-way default (Phase
  60 ship — first all-4-surfaces sextuple-alias state).
- **All 4 surfaces 5-consumer same-slot composition** under
  `arxiv,doi,pubmed,orcid,biorxiv` composite (Phase 59 ship).
- **All 4 surfaces 7-consumer composition under default
  dispatch** (Phase 59 ship — **second "all-surfaces saturated
  at maximum-consumer-cardinality" state**; first was Phase
  56 at 6-consumer).
- **First state where ALL 7 Phase-37-framework consumers have
  had ALL their applicable extensions resolved** (Phase 60
  ship — **framework's current capability ceiling** for the
  7-consumer roster).
- **First phase to advance the framework beyond Phase-60
  capability ceiling** (Phase 61 ship — via 2nd realization
  of an existing phase-shape pattern).
- **4 D-clauses with BOTH items closed within the closure
  cadence** (D-AC + D-AH + D-AL + **D-AP**). **D-AP is the
  first D-clause with both items closed in REVERSED order**
  (cross-surface-first then alias; Phase 60 ship). **D-AP
  is also the first D-clause whose both items closed within
  consecutive phases** (Phase 59 cross-surface + Phase 60
  alias).
- **1 D-clause with 3-of-4 enumerated items closed** (**D-Q**
  at Phase 61 ship — items 1 + 3 + 4 closed; only item 6
  surface-specific table schemas remaining). **First D-clause
  with 3+ items closed** in project history.
- **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD** at
  22-phase carryover (Phase-61 closes D-Q item 4 from Phase
  39; extends Phase-57 18-phase record by 4 phases).
- **NEW FASTEST cross-surface-expansion CLOSURE RECORD** at
  1-phase carryover (Phase-59 closes D-AP cross-surface from
  Phase 58; extends prior 2-phase record from Phase 52 + 56
  by 1 phase).
- **First cross-surface expansion shipped as immediate-next-
  thread after first-ship without intervening alias-syntax**
  in project history (Phase 59; **first reversed-order post-
  first-ship arc**).
- **Schema-ready-before-plugin state extended from attributes
  (Phase 57) to tags (Phase 61)** — **first TAG-addition
  schema-ready-before-plugin** in project history.
- **HALF-CENTURY-OF-NON-§13-PHASES MILESTONE** (Phase 59 =
  50th NON-§13 phase; first 50-NON-§13-phase milestone; first
  50-phase ledger-closure streak).
- **5 distinct phase-shape patterns** in the framework: new-
  consumer · composition-infrastructure · cross-surface-
  expansion · plugin-regex-extension · schema-extension ·
  acceptance-gate.
- **8 env-var single-value arms** (default · wikilinks ·
  tables · arxiv · doi · pubmed · orcid · biorxiv) + comma-
  separated compositions up to 7-way. UNCHANGED Phases 59-61.

## Stable invariants

These have held through 5+ consecutive phases at Phase-61
close:

| Invariant                           | Value                                  | Streak                                            |
| ----------------------------------- | -------------------------------------- | ------------------------------------------------- |
| ADR count                           | 24                                     | 26 phases (no new ADR since Phase 35)             |
| First Load JS shared chunk          | 103 kB                                 | 164 units (Phase 9 Unit 9.5 → Phase 61 Unit 61.4) |
| Middleware bundle                   | 160 kB                                 | since Phase 12                                    |
| DB tables                           | 7                                      | since Phase 33                                    |
| Migrations                          | 9                                      | since Phase 36                                    |
| Env vars (total count)              | 14                                     | since Phase 33                                    |
| i18n keys per locale                | 168                                    | since Phase 31                                    |
| OPEN_QUESTIONS Q-count              | 66 (28 resolved + 4 lean + 34 open)    | since Phase 36                                    |
| `Q32` content-audit warnings        | 6 (related_problems-symmetry baseline) | 57 consecutive phases                             |
| Phase-37+ candidate count           | 8                                      | since Phase 39                                    |
| No-new-B-category streak            | Phase 31-61 = 31 phases                | first 31-phase run                                |
| Runtime deps added                  | 0 since Phase 41 (`@types/mdast`)      | 20 phases                                         |
| Single-session-phase streak         | Phase 54-61 = 8 phases                 | first 8-phase run                                 |
| MARKDOWN_EXTENSIONS arms            | 8 (since Phase 58 added biorxiv)       | 3 phases (Phases 59-61 added zero new arms)       |
| Framework consumers                 | 7                                      | since Phase 58                                    |
| Schema-extension realizations       | 2 (since Phase 61)                     | 0 phases (just landed)                            |
| Plugin-regex-extension realizations | 7 (since Phase 60)                     | 1 phase                                           |

## Remaining-phases estimate (Phase 62 → ~68+)

The framework-evolution tier has advanced beyond Phase-60
capability ceiling via Phase 61's 2nd schema-extension
realization. The alias-syntax cluster is **fully exhausted**
for all 5 `remarkPlugins` consumers (arxiv/doi/pubmed/orcid
all alias-capable since Phase 55; biorxiv alias-capable since
Phase 60). The constructor-arg-only-expansion cluster is
**fully exhausted** for all 7 framework consumers (Phase 59
shipped biorxiv cross-surface as 7th realization). Phase 62+
candidates introduce new realizations of existing patterns OR
genuinely new phase-shape patterns:

### Tier 1 — autonomous-tractable framework-evolution phases (~5 phases)

Each ~3-5 units mirroring Phase 41-61 shapes. Cumulative ~20
units ≈ 4-5 full-day single-session sprints.

| Phase | Theme                                                                                                                                 | Lean                                                                                                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 62    | **Plugin parameterization for wikilink-href-builder** (APPEND-D-L item 6)                                                             | **First framework-refactor-only phase** (if shipped without closing a deferred APPEND item directly); refactor `rehypeResolveWikilinks` plugin to accept entity-type parameter; prerequisite for Phase 63 cross-entity wikilinks; rank 1 at Phase-61 gate.                           |
| 63    | **Cross-entity wikilinks** (APPEND-D-L item 3) `[[paper-id\|display]]` / `[[author-slug\|display]]` / `[[institution-slug\|display]]` | Closes APPEND-D-L item 3; depends on Phase 62 plugin parameterization landing first; rank 2 at Phase-61 gate.                                                                                                                                                                        |
| 64    | **Surface-specific table schemas** (APPEND-D-Q item 6)                                                                                | **Closure would complete D-Q's last item and make D-Q the first D-clause with ALL enumerated items closed** in project history; rank 3 at Phase-61 gate.                                                                                                                             |
| 65    | **`<a class="wikilink">` styling** (APPEND-D-L item 4)                                                                                | EITHER (a) ship plugin-only emit (no schemaOverrides; rely on post-sanitize plugin-order discipline) OR (b) framework refactor for multi-source schemaOverrides (would need new ADR APPEND establishing semantics — current APPEND-D-C forbids deep-merge); rank 4 at Phase-61 gate. |
| 66    | **404 handling for unresolved wikilinks** (APPEND-D-L item 5)                                                                         | Closes APPEND-D-L item 5; build-time validation step.                                                                                                                                                                                                                                |

### Tier 2 — ADR-shaped phases (~2 phases)

Each ~5 units; introduce ADR-0025 + ADR-0026; close the 26+
phase no-new-ADR streak.

| Phase | Theme                                                                                                           | Lean                                                                                                                                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 67    | **ADR-0025 concrete content-moderation provider**                                                               | Closes 28+ phase no-new-ADR streak (Phase 36-66); 4-phase implementation (provider config + dispatch + integration tests + smoke); promotes `NoopModerator` default to real provider via `MODERATION_PROVIDER` env-var dispatch. |
| 68    | **OSF preprint consumer + 8th concrete consumer** OR **bare arxiv/DOI/PubMed/ORCID/bioRxiv IDs without prefix** | Either path introduces additional framework realization beyond current 7-consumer ceiling.                                                                                                                                       |

### Tier 3 — curator-track operational phases (~6 phases)

Each ~3-5 units; depend on curator action for the 6
operational gates (Q54/Q55/Q69/Q73/Q75/Q77).

| Phase | Theme                                    | Curator action       |
| ----- | ---------------------------------------- | -------------------- |
| 69    | GitHub OAuth production setup            | Q54                  |
| 70    | Turso production DB provisioning         | Q55                  |
| 71    | Vercel Blob store creation               | Q69                  |
| 72    | Google OAuth production setup            | Q73                  |
| 73    | Resend domain verification + cron secret | Q75 + Q77            |
| 74    | Production deploy + smoke gate run       | All Tier 3 unblocked |

### Aggregate remaining-workload estimate

| Tier                                        | Phases  | Units   | Calendar                                      | Curator unblock required |
| ------------------------------------------- | ------- | ------- | --------------------------------------------- | ------------------------ |
| Tier 1 (autonomous-tractable framework)     | 5       | ~20     | ~4-5 days single-session                      | No                       |
| Tier 2 (ADR-shaped + 8th consumer)          | 2       | ~10     | ~2-3 days                                     | No                       |
| Tier 3 (operational gates)                  | 6       | ~25     | ~5-6 days but depends on curator availability | YES                      |
| **Total framework-evolution + operational** | **~13** | **~55** | **~12 single-session days**                   | mixed                    |

After Tier 1-3 the project reaches **deployable state**:

- All current APPEND-D-L / D-Y / D-Q / D-AC deferrals closed
  (D-L items 3 + 4 + 5 + 6; D-Q item 6).
- 7 concrete framework consumers + plugin parameterization +
  cross-entity wikilinks + `<a class="wikilink">` styling +
  404 handling + surface-specific table schemas landed.
- ADR-0025 concrete moderation provider chosen + integrated.
- Either OSF preprint consumer (8th concrete consumer) OR
  bare-ID forms across all 5 `remarkPlugins` consumers
  landed.
- Production environment provisioned + smoke-gated.

Post-deploy, the project shifts from **framework-evolution-
intensive to content-authoring-intensive** (more seed
problems, papers, rating actions, bilingual content). The
framework's current capability ceiling (7 consumers × 4
surfaces × 3 slots; all 5 `remarkPlugins` consumers
exhibiting dual-form regex; 2 schema-extension realizations
on tables; plugin parameterization + cross-entity wikilinks +
optional class styling) is sufficient to support the content
workload through ~year 1 of public operation; Tier-4 scaling
(full bilingual content backfill; ~750-subscriber Resend-
free-tier ceiling unblock; concrete moderation provider
invocation budget) becomes the next workload tier.

**Note on workload estimate reduction vs Phase-58-close
summary**: The Phase-58-close summary estimated **~14 phases
× ~65 units** to reach deployable state. The current Phase-
61-close estimate is **~13 phases × ~55 units** — a reduction
of 1 phase + 10 units. The reduction reflects: (a) Phases 59

- 60 + 61 advanced the framework faster than projected (each
  phase shipped at the 5-unit baseline; Phase 59's NEW FASTEST
  cross-surface closure record at 1-phase carryover collapsed
  the Phase 58 → 59 → 60 arc by 1 phase relative to the prior
  pubmed/orcid arcs); (b) Phase 61's schema-extension realization
  demonstrated that existing patterns can be extended on
  different value-kinds without new consumers — reducing the
  need for new-consumer phases; (c) the Phase-60 capability
  ceiling note reframed Phase 62+ work toward existing-pattern
  extension (cheaper) rather than new-consumer introduction
  (more expensive).

## Recent acceleration patterns

The session shipped **15 numbered units across 3 phases** in
a single autonomous run (Phase 59 → 60 → 61), enabled by the
§12 sign-off discipline working as intended (each phase
boundary gated by an explicit "Continue" message; within-
phase units flowed unit-by-unit per the rhythm feedback
memory). **Three distinct phase-shape patterns** were
exercised this session:

- **Cross-surface expansion** (Phase 59 bioRxiv) — seventh
  realization of constructor-arg-only zero-rework expansion;
  NEW FASTEST cross-surface closure record at 1-phase
  carryover; first cross-surface-first post-first-ship arc.
- **Plugin-regex-extension** (Phase 60 bioRxiv alias) —
  seventh realization of Phase-46 plugin-regex-extension
  phase-shape; first 7-realization for that pattern; first
  state where both principal axes at 7 realizations; first
  5-of-5 `remarkPlugins` consumers with dual-form regex;
  first state where ALL 7 framework consumers have had ALL
  applicable extensions resolved — framework capability
  ceiling.
- **Schema-extension** (Phase 61 tables caption) — second
  realization of Phase-57-derived schema-extension phase-
  shape pattern; first 2-realization for that pattern; first
  state where the schema-extension pattern is observed twice
  within the same consumer; first phase to advance the
  framework beyond Phase-60 capability ceiling; NEW LONGEST
  ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD at 22-phase
  carryover.

**Phase 62 entry conditions**: per §12, awaits explicit
human sign-off. The 10-ranked candidate table at
`docs/thinking/61.4-phase-61-acceptance-gate.md` Phase 62
entry conditions section enumerates the autonomous-tractable
and curator-dependent paths. Rank 1 (plugin parameterization)
is a refactor-only prerequisite for Phase 63 cross-entity
wikilinks; rank 3 (surface-specific table schemas) would
close D-Q's last remaining item and make D-Q the **first D-
clause with ALL enumerated items closed** in project history.

## Session-wide framework state evolution

Pre-Phase-59 (Phase-58-close baseline):

- 7 concrete consumers (Phase 58 bioRxiv ship)
- 6 plugin-regex-extension realizations (Phase 55)
- 6 constructor-arg-only realizations (Phase 56)
- 1 schema-extension realization (Phase 57)
- 4 dual-form regex realizations (arxiv/doi/pubmed/orcid)
- 3 D-clauses with both items closed (D-AC + D-AH + D-AL)
- 0 D-clauses with 3+ items closed
- 5-consumer same-slot composition on rationale only (Phase 58)
- 7-consumer composition on rationale only (Phase 58)

Post-Phase-61:

- 7 concrete consumers UNCHANGED
- **7 plugin-regex-extension realizations** (+1 from Phase 60 bioRxiv alias)
- **7 constructor-arg-only realizations** (+1 from Phase 59 bioRxiv cross-surface)
- **2 schema-extension realizations** (+1 from Phase 61 caption)
- **5 dual-form regex realizations** (+1 from Phase 60 bioRxiv)
- **4 D-clauses with both items closed** (+1 from D-AP at Phase 60)
- **1 D-clause with 3+ items closed** (D-Q at Phase 61 — items 1 + 3 + 4)
- **5-consumer same-slot composition on ALL 4 surfaces** (Phase 59)
- **7-consumer composition on ALL 4 surfaces** (Phase 59 —
  second "all-surfaces saturated at maximum-consumer-
  cardinality" state)
- **All 4 surfaces sextuple-alias** (Phase 60)
- **ALL 7 framework consumers fully extended** (Phase 60 —
  framework capability ceiling)
- **First phase to advance beyond Phase-60 capability ceiling**
  (Phase 61)
