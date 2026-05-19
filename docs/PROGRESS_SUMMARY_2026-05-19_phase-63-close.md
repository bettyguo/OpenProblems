# Progress summary — Phase 63 close (2026-05-19)

> Narrative progress summary at HEAD `fad1328`. Supersedes
> `docs/PROGRESS_SUMMARY_2026-05-19_phase-61-close.md` (which
> remains as historical record). Companion to
> `docs/SESSION_HANDOFF_2026-05-19_phase-63-close.md` (paste-
> into-fresh-session payload) and the live ledger in
> `CHANGELOG.md` (~14,500+ lines).

## Where the project stands

**64 / 64 phases shipped** (Phase 0 → Phase 63, all ✅
closed). Phase 64 awaiting explicit human sign-off per §12.
**24 accepted ADRs** (28 consecutive no-new-ADR phases since
Phase 36 — longest streak in project history; ADR-0025
candidate slot open since Phase 35). **1486 / 75 vitest
tests** at HEAD. **103 kB First Load JS** unchanged for 173
consecutive units (Phase 9 Unit 9.5 → Phase 63 Unit 63.4;
100-unit threshold crossed at Phase 48 Unit 48.3). **160 kB
middleware** unchanged since Phase 12.

**Framework state**: Phase 60 closed at the framework's
Phase-60 capability ceiling — all 7 Phase-37-framework
consumers had had ALL their applicable extensions resolved
along both principal axes. Phase 61 advanced the framework
beyond that ceiling via the 2nd schema-extension realization.
**Phase 62 advanced further by introducing the THIRD principal
axis of zero-rework framework extension** — plugin-option axis
joins registry-state + plugin-body axes; **first state where
the framework has three principal axes of zero-rework
extension**. **Phase 63 shipped the first consumer of that
new axis** through the registry layer — **first 2-phase
forward-compat-affordance prerequisite-fulfillment arc
completed** in project history (Phase 62 prerequisite ship →
Phase 63 consumption ship).

## Session arc (Phase 62 → 63; 10 numbered units)

| Phase | Theme                                                                                     | HEAD at close | Tests   | Headline architectural first                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ----------------------------------------------------------------------------------------- | ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 62    | Plugin parameterization for wikilink-href-builder (`buildHref?` plugin option affordance) | `3efb06e`     | 1464/75 | **First framework-refactor-only phase in project history** — first phase shape that ships zero new realization of any existing phase-shape pattern AND zero new consumer behavior, purely a framework-affordance addition; **third principal axis of zero-rework framework extension introduced** (plugin-option axis); **first state where the framework has three principal axes of zero-rework extension**; **wikilinks consumer 3rd evolution**; **first state where THREE consumers have 3+ evolutions each** (arxiv + tables + wikilinks); **first phase to ship a framework affordance ahead of curator demand signal** — plugin-option-ready-before-consumer-demand discipline established; D-L becomes 2nd D-clause with 3-of-6 items closed; **first state where TWO D-clauses have 3+ items closed each** (D-Q + D-L)                  |
| 63    | Cross-entity wikilinks consuming the Phase-62 `buildHref` affordance                      | `fad1328`     | 1486/75 | **First consumer of a forward-compat plugin-option affordance shipped in a prior phase** in project history; **first 2-phase forward-compat-affordance prerequisite-fulfillment arc completed** (Phase 62 affordance → Phase 63 consumption); **first registry-level realization of the plugin-option axis**; **first 2-realization for the plugin-option-axis** (Phase 62 signature + Phase 63 registry); **wikilinks consumer gains 4th evolution post-first-ship**; **first state where a consumer has 4+ evolutions** in project history; **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED** at 25-phase carryover (third consecutive phase to set absolute-record; first 3-consecutive-phase absolute-record-extension streak); **D-L becomes first D-clause with 4-of-6 items closed**; **first D-clause with 4+ items closed** |

**+34 tests** since Phase-61-close start of session (1452 →
1486). **75 vitest files UNCHANGED** (no new test files
Phases 62-63). **+2 ADR-0018 D-G APPENDs** (28 → 30; record
extends each phase; **first 30-APPENDs milestone** crossed at
Phase 63). **0 new `lib/markdown/extensions/` files** (21
UNCHANGED). **+1 new `MARKDOWN_EXTENSIONS` single-value arm**
(`wikilinks-cross-entity`; Phase 63 ship — first new arm
since Phase 58 bioRxiv; first 5-phase gap between single-
value-arm additions). **0 new Phase-37-framework concrete
consumers** (7 UNCHANGED). **+1 plugin-option-extension
realization** (1 → 2; Phase 63 registry consumer — first 2-
realization for that axis at the registry layer). **+1
principal axis of zero-rework framework extension** (2 → 3;
Phase 62 plugin-option axis introduced — first state where
the framework has three principal axes of zero-rework
extension). **+1 consumer with 4+ evolutions** (0 → 1;
wikilinks Phase 63 — first state where a consumer has 4+
evolutions). **+1 D-clause with 3+ items closed** (1 → 2;
D-L at Phase 62 3-of-6; both D-Q + D-L at 3-of-6 → first
state where TWO D-clauses have 3+ items closed each). **+1
D-clause with 4+ items closed** (0 → 1; D-L at Phase 63 4-of-
6; first D-clause with 4+ items closed). **+1 refactor-only
phase** (0 → 1; Phase 62 — first framework-refactor-only
phase in project history). **+1 forward-compat-affordance
prerequisite-fulfillment arc completed** (0 → 1; Phase 62 →
63 — first such arc completed). **+2 NON-§13 phase count**
(52 → 54). **+2 consecutive no-new-ADR phases** (26 → 28;
Phase 36-63).

## What the framework looks like at HEAD

```
lib/markdown/extensions/  (21 files; UNCHANGED Phases 62-63)
├── default.ts                  (Phase 37 — base allow-list)
├── default.test.ts             (Phase 37)
├── types.ts                    (Phase 37 — registry interface + 3 slots)
├── index.ts                    (Phase 37+ — factory dispatch + 9 single-value arms post-Phase 63)
├── index.test.ts               (Phase 37+ — dispatch tests across 9 arms + 7-way composite + Phase-63 wikilinks-cross-entity factory tests)
├── wikilinks.ts                (Phase 38 → 42 all-4 → 46 alias-capable → 62 buildHref affordance → 63 cross-entity routing + CROSS_ENTITY_BUILD_HREF + registry ctor buildHref arg)
├── wikilinks.test.ts           (Phase 38 + 46 + 62 + 63 = 58 tests)
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
└── biorxiv.test.ts
```

**Default composition matrix at Phase-63 close** under
`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv`
(byte-identical to Phase 61 close; the new `wikilinks-cross-
entity` arm is opt-in, not the default):

| Surface           | rehypePlugins           | schemaOverrides                           | remarkPlugins                                    | Aliases active                                                    |
| ----------------- | ----------------------- | ----------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| `bio`             | wikilinks (bare; alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | wikilinks + arxiv + doi + pubmed + orcid + biorxiv = **sextuple** |
| `reviewNotes`     | wikilinks (bare; alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | sextuple                                                          |
| `rationale`       | wikilinks (bare; alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | sextuple                                                          |
| `actionRationale` | wikilinks (bare; alias) | tables (Phase-57 attr + Phase-61 caption) | [arxiv, doi, pubmed, orcid, biorxiv] (all alias) | sextuple                                                          |

**Alternative `wikilinks-cross-entity` composition** (Phase 63
ship; opt-in via env-var; tuple-form emit):

| Surface | rehypePlugins                                                        | Effect                                                                                                                                                         |
| ------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All 4   | `[[rehypeResolveWikilinks, { buildHref: CROSS_ENTITY_BUILD_HREF }]]` | `[[paper:x]]` → `/papers/x`; `[[author:y]]` → `/authors/y`; `[[institution:z]]` → `/institutions/z`; bare `[[plain-slug]]` → `/problems/plain-slug` (fallback) |

**Wikilinks evolution depth**: 4 evolutions post-first-ship
(Phase 42 cross-surface + Phase 46 alias + Phase 62 plugin
parameterization + Phase 63 cross-entity). **Deepest-evolved
consumer in the framework** (arxiv + tables remain at 3
evolutions). **First state where a consumer has 4+
evolutions** in project history.

## Cadence patterns

**APPEND-deferral closure cadence sustained 22 phases** —
longest in project history. Closures (oldest-applicable-
first):

| Phase  | Closes                                                 | Carryover                                                                                                                                               |
| ------ | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 42     | Phase-38 D-L item 1 (cross-surface wikilinks)          | 4-phase                                                                                                                                                 |
| 43     | Phase-39 D-Q item 2 (cross-surface tables)             | 4-phase                                                                                                                                                 |
| 44-60  | (see Phase-61-close summary for intermediate closures) | various                                                                                                                                                 |
| 61     | Phase-39 D-Q item 4 `<caption>` element                | 22-phase ← NEW LONGEST ABSOLUTE at the time (extends Phase-57 18 by 4)                                                                                  |
| **62** | **Phase-38 D-L item 6 Plugin parameterization**        | **24-phase ← NEW LONGEST ABSOLUTE record at the time** (extends Phase-61 22 by 2; second consecutive phase to set absolute-record)                      |
| **63** | **Phase-38 D-L item 3 Cross-entity wikilinks**         | **25-phase ← NEW LONGEST ABSOLUTE record** (extends Phase-62 24 by 1; third consecutive phase to set absolute-record; first 3-consecutive-phase streak) |

**Three consecutive phases setting the absolute-record**:
Phase 61 (22-phase) → Phase 62 (24-phase) → Phase 63 (25-
phase). **First 3-consecutive-phase absolute-record-extension
streak** in project history.

**Plugin-option-axis cadence** (2 realizations; first
forward-compat-affordance arc completed in a single inter-
phase carryover): Phase 62 signature affordance ship → Phase
63 registry consumer ship. **First 2-realization for the
plugin-option-axis at the registry layer**.

**D-L closure cadence** (4 items closed; 2 remaining): item 1
cross-surface 4-phase (Phase 42); item 2 alias 8-phase (Phase
46); item 6 plugin parameterization 24-phase (Phase 62); item
3 cross-entity 25-phase (Phase 63); items 4 + 5 still
deferred. **D-L becomes first D-clause with 4-of-6 items
closed** (Phase 63 ship); **first D-clause with 4+ items
closed** in project history.

## Architectural firsts cumulative inventory

This session (Phase 62 → 63) shipped **24+ distinct
architectural firsts** documented across 2 acceptance-gate
THINK docs (~12 per phase). Cumulative inventory at Phase-63
close (additions to Phase-61-close inventory bolded):

- **7 Phase-37-framework concrete consumers** UNCHANGED.
- **7 plugin-regex-extension realizations** UNCHANGED (Phase
  60 ship; the Phase-63 regex extension is counted under the
  cross-entity phase-shape per Phase-63 prep doc D-decision).
- **7 constructor-arg-only zero-rework expansion
  realizations** UNCHANGED (Phase 59 ship).
- **2 schema-extension realizations** UNCHANGED (Phase 57 +
  Phase 61).
- **2 plugin-option-extension realizations** (**+1** Phase
  62 signature affordance + **+1** Phase 63 registry
  consumer). **First 2-realization for the plugin-option-
  axis** in project history.
- **3 principal axes of zero-rework framework extension**
  (**+1** Phase 62; registry-state + plugin-body + plugin-
  option). **First state where the framework has three
  principal axes of zero-rework extension**.
- **5 dual-form regex realizations** UNCHANGED.
- **9 `MARKDOWN_EXTENSIONS` single-value arms** (**+1** Phase
  63 `wikilinks-cross-entity`; first new arm since Phase 58
  bioRxiv).
- **All 3 framework slot kinds evolved post-Phase-39**:
  `remarkPlugins` (6 evolutions) + `rehypePlugins` (1
  wikilinks alias + Phase-63 cross-entity regex evolution
  counted under plugin-body OR cross-entity phase-shape per
  D-decision) + `schemaOverrides` (2: tables 57 + 61).
- **3 consumers with 3+ evolutions** (**+1** wikilinks at
  Phase 62 — first state where THREE consumers have 3+
  evolutions each). All 3 (arxiv + tables + wikilinks).
- **1 consumer with 4+ evolutions** (**+1** wikilinks at
  Phase 63 — first state where a consumer has 4+
  evolutions). **First state where a consumer has 4+
  evolutions** in project history.
- **All 4 surfaces sextuple-alias** UNCHANGED (Phase 60).
- **All 4 surfaces 7-consumer composition under default
  dispatch** UNCHANGED (Phase 59).
- **4 D-clauses with BOTH items closed** UNCHANGED.
- **2 D-clauses with 3+ items closed** (**+1** D-L at Phase
  62 3-of-6; first state where TWO D-clauses have 3+ items
  closed each). D-Q (Phase 61; items 1+3+4) + D-L (Phase 63;
  items 1+2+3+6).
- **1 D-clause with 4+ items closed** (**+1** D-L at Phase
  63 4-of-6; first D-clause with 4+ items closed).
- **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD** at
  25-phase carryover (**+3 phases** vs Phase-61 22-phase
  record; Phase 62 set 24-phase; Phase 63 set 25-phase).
  **Third consecutive phase to set the absolute-record**;
  first 3-consecutive-phase absolute-record-extension streak.
- **1 framework-refactor-only phase** (**+1** Phase 62;
  first framework-refactor-only phase in project history).
- **1 forward-compat-affordance prerequisite-fulfillment arc
  completed** (**+1** Phase 62 → 63; first such arc
  completed).
- **1 plugin-option-ready-before-consumer-demand discipline
  established** (**+1** Phase 62; generalizes Phase-57 /
  Phase-61 schema-ready-before-plugin one layer up to plugin
  signature).
- **7 distinct phase-shape patterns** in the framework
  (**+1** plugin-option-axis-evolution Phase 62): new-
  consumer · composition-infrastructure · cross-surface-
  expansion · plugin-regex-extension · schema-extension ·
  plugin-option-axis-evolution · acceptance-gate.

## Stable invariants

These have held through 5+ consecutive phases at Phase-63
close:

| Invariant                            | Value                                  | Streak                                                      |
| ------------------------------------ | -------------------------------------- | ----------------------------------------------------------- |
| ADR count                            | 24                                     | 28 phases (no new ADR since Phase 35)                       |
| First Load JS shared chunk           | 103 kB                                 | 173 units (Phase 9 Unit 9.5 → Phase 63 Unit 63.4)           |
| Middleware bundle                    | 160 kB                                 | since Phase 12                                              |
| DB tables                            | 7                                      | since Phase 33                                              |
| Migrations                           | 9                                      | since Phase 36                                              |
| Env vars (total count)               | 14                                     | since Phase 33                                              |
| i18n keys per locale                 | 168                                    | since Phase 31                                              |
| OPEN_QUESTIONS Q-count               | 66 (28 resolved + 4 lean + 34 open)    | since Phase 36                                              |
| `Q32` content-audit warnings         | 6 (related_problems-symmetry baseline) | 59 consecutive phases                                       |
| Phase-37+ candidate count            | 8                                      | since Phase 39                                              |
| No-new-B-category streak             | Phase 31-63 = 33 phases                | first 33-phase run                                          |
| Runtime deps added                   | 0 since Phase 41 (`@types/mdast`)      | 22 phases                                                   |
| Single-session-phase streak          | Phase 54-63 = 10 phases                | first 10-phase run                                          |
| MARKDOWN_EXTENSIONS single arms      | **9** (+`wikilinks-cross-entity`)      | 0 phases (just landed Phase 63)                             |
| Framework consumers                  | 7                                      | since Phase 58                                              |
| Schema-extension realizations        | 2                                      | 2 phases (since Phase 61)                                   |
| Plugin-regex-extension realizations  | 7                                      | 3 phases (since Phase 60)                                   |
| Plugin-option-extension realizations | **2** (Phase 62 + Phase 63)            | 0 phases (just landed)                                      |
| Principal axes of zero-rework ext.   | **3**                                  | 1 phase (Phase 62 introduced; Phase 63 first 2-realization) |

## Remaining-phases estimate (Phase 64 → ~70+)

Phase 63 completed the first 2-phase forward-compat-
affordance prerequisite-fulfillment arc. The plugin-option
axis is now exercised at both signature (Phase 62) and
registry (Phase 63) layers. The alias-syntax cluster is
**fully exhausted** for all 5 `remarkPlugins` consumers (Phase
60). The constructor-arg-only-expansion cluster is **fully
exhausted** for all 7 framework consumers (Phase 59). Phase
64+ candidates introduce new realizations of any existing
axis, complete D-L closure (items 4 + 5 still deferred), close
the last D-Q item (item 6 surface-specific table schemas),
introduce new consumers, or address pending operational gates.

### Tier 1 — autonomous-tractable framework-evolution phases (~4 phases)

Each ~3-5 units mirroring Phase 41-63 shapes. Cumulative ~16
units ≈ 3-4 full-day single-session sprints.

| Phase | Theme                                                                                                                                             | Lean                                                                                                                                                                                                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 64    | **Surface-specific table schemas** (APPEND-D-Q item 6)                                                                                            | **Closure would complete D-Q's last item and make D-Q the first D-clause with ALL enumerated items closed** in project history. Per-surface schemaOverrides map constructor-arg evolution on `TablesExtensionRegistry`; rank 1 at Phase-63 gate.                                    |
| 65    | **`<a class="wikilink">` styling** (APPEND-D-L item 4)                                                                                            | EITHER (a) ship plugin-only emit (no schemaOverrides; rely on post-sanitize plugin-order discipline) OR (b) framework refactor for multi-source schemaOverrides (would need new ADR APPEND establishing semantics; current APPEND-D-C forbids deep-merge); rank 2 at Phase-63 gate. |
| 66    | **404 handling for unresolved wikilinks** (APPEND-D-L item 5)                                                                                     | Build-time validation against `content/problems/` + `content/papers/` + `content/authors/` + `content/institutions/` (cross-entity-aware per Phase 63 ship) + render-time fallback. **Closure would complete D-L** if pursued after rank 2; rank 3 at Phase-63 gate.                |
| 67    | **Empty-alias fallback unification** OR **bare arxiv / DOI / PubMed / ORCID / bioRxiv IDs without prefix** OR **legacy numeric-only bioRxiv IDs** | Smaller-scope autonomous-tractable cleanup. Each is a ~1-2 unit phase.                                                                                                                                                                                                              |

### Tier 2 — ADR-shaped phases (~2 phases)

Each ~5 units; introduce ADR-0025 + ADR-0026; close the 28+
phase no-new-ADR streak.

| Phase | Theme                                                                                         | Lean                                                                                                                                                                                                                             |
| ----- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 68    | **ADR-0025 concrete content-moderation provider**                                             | Closes 30+ phase no-new-ADR streak (Phase 36-67); 4-phase implementation (provider config + dispatch + integration tests + smoke); promotes `NoopModerator` default to real provider via `MODERATION_PROVIDER` env-var dispatch. |
| 69    | **OSF preprint consumer + 8th concrete consumer** OR **locale-prefixed cross-entity routing** | Either path introduces additional framework realization beyond current 7-consumer ceiling OR second cross-entity builder variant.                                                                                                |

### Tier 3 — curator-track operational phases (~6 phases)

Each ~3-5 units; depend on curator action for the 6
operational gates (Q54/Q55/Q69/Q73/Q75/Q77).

| Phase | Theme                                    | Curator action       |
| ----- | ---------------------------------------- | -------------------- |
| 70    | GitHub OAuth production setup            | Q54                  |
| 71    | Turso production DB provisioning         | Q55                  |
| 72    | Vercel Blob store creation               | Q69                  |
| 73    | Google OAuth production setup            | Q73                  |
| 74    | Resend domain verification + cron secret | Q75 + Q77            |
| 75    | Production deploy + smoke gate run       | All Tier 3 unblocked |

### Aggregate remaining-workload estimate

| Tier                                        | Phases  | Units   | Calendar                                      | Curator unblock required |
| ------------------------------------------- | ------- | ------- | --------------------------------------------- | ------------------------ |
| Tier 1 (autonomous-tractable framework)     | 4       | ~16     | ~3-4 days single-session                      | No                       |
| Tier 2 (ADR-shaped + 8th consumer)          | 2       | ~10     | ~2-3 days                                     | No                       |
| Tier 3 (operational gates)                  | 6       | ~25     | ~5-6 days but depends on curator availability | YES                      |
| **Total framework-evolution + operational** | **~12** | **~51** | **~10-13 single-session days**                | mixed                    |

After Tier 1-3 the project reaches **deployable state**:

- All current APPEND-D-L / D-Y / D-Q / D-AC deferrals closed
  (D-L items 4 + 5; D-Q item 6).
- 7 concrete framework consumers + plugin parameterization +
  cross-entity wikilinks + `<a class="wikilink">` styling +
  404 handling + surface-specific table schemas landed.
- ADR-0025 concrete moderation provider chosen + integrated.
- Either OSF preprint consumer (8th concrete consumer) OR
  locale-prefixed cross-entity routing landed.
- Production environment provisioned + smoke-gated.

Post-deploy, the project shifts from **framework-evolution-
intensive to content-authoring-intensive** (more seed
problems, papers, rating actions, bilingual content). The
framework's current capability ceiling (7 consumers × 4
surfaces × 3 slots; 5 `remarkPlugins` consumers dual-form
regex; 2 schema-extension realizations on tables; plugin
parameterization + cross-entity wikilinks via new `wikilinks-
cross-entity` arm; 9 single-value env-var arms) is sufficient
to support the content workload through ~year 1 of public
operation; Tier-4 scaling (bilingual content backfill; Resend-
free-tier subscriber ceiling unblock; moderation provider
invocation budget) becomes the next workload tier.

**Note on workload estimate reduction vs Phase-61-close
summary**: The Phase-61-close summary estimated **~13 phases
× ~55 units** to reach deployable state. The current Phase-
63-close estimate is **~12 phases × ~51 units** — a reduction
of 1 phase + 4 units. The reduction reflects: (a) Phases 62

- 63 advanced the framework as projected (each phase shipped
  at the 5-unit baseline; Phase 62 + 63 closed D-L items 6 + 3
  in 2 phases each at 24-phase and 25-phase carryovers
  respectively); (b) the original Phase-62 prep-doc framing
  that combined Phase 62 (plugin parameterization) + Phase 63
  (cross-entity wikilinks) as a 2-phase forward-compat-
  affordance arc has been validated by execution; (c) Phase 62-
  63 advanced D-L from 2-of-6 → 4-of-6 closed items, leaving
  only items 4 + 5 (vs the Phase-61-close projection that left
  items 3 + 4 + 5 + 6 to close).

## Recent acceleration patterns

The session shipped **10 numbered units across 2 phases** in
a single autonomous run (Phase 62 → 63), enabled by the §12
sign-off discipline working as intended (each phase boundary
gated by an explicit "Continue" message; within-phase units
flowed unit-by-unit per the rhythm feedback memory). **Two
distinct phase-shape patterns** were exercised this session:

- **Framework-refactor-only** (Phase 62 plugin
  parameterization) — first framework-refactor-only phase in
  project history; third principal axis of zero-rework
  framework extension introduced; first state where the
  framework has three principal axes of zero-rework
  extension; plugin-option-ready-before-consumer-demand
  discipline established; first phase to ship a framework
  affordance ahead of curator demand signal.
- **Forward-compat-affordance consumer** (Phase 63 cross-
  entity wikilinks) — first consumer of a forward-compat
  plugin-option affordance shipped in a prior phase; first
  2-phase forward-compat-affordance prerequisite-fulfillment
  arc completed; first registry-level realization of the
  plugin-option axis; first 2-realization for the plugin-
  option-axis at the registry layer; new
  `MARKDOWN_EXTENSIONS=wikilinks-cross-entity` arm (first
  new arm since Phase 58 bioRxiv).

**Phase 64 entry conditions**: per §12, awaits explicit
human sign-off. The 10-ranked candidate table at
`docs/thinking/63.4-phase-63-acceptance-gate.md` Phase 64
entry conditions section enumerates the autonomous-tractable
and curator-dependent paths. Rank 1 (surface-specific table
schemas; D-Q item 6) would make D-Q the **first D-clause
with ALL enumerated items closed** in project history — the
cleanest "architectural finishing move" complementing the
Phase-63 D-L 4-of-6 advance. Rank 2 (`<a class="wikilink">`
styling) would advance D-L from 4-of-6 → 5-of-6 if pursued.

## Session-wide framework state evolution

Pre-Phase-62 (Phase-61-close baseline):

- 7 concrete consumers (Phase 58 bioRxiv ship)
- 7 plugin-regex-extension realizations (Phase 60)
- 7 constructor-arg-only realizations (Phase 59)
- 2 schema-extension realizations (Phase 57 + 61)
- 0 plugin-option-extension realizations
- 2 principal axes of zero-rework framework extension
- 4 dual-form regex realizations (arxiv/doi/pubmed/orcid)
- 5 dual-form regex realizations post-Phase 60 (+biorxiv)
- 4 D-clauses with both items closed (D-AC + D-AH + D-AL + D-AP)
- 1 D-clause with 3+ items closed (D-Q at 3-of-4)
- 0 D-clauses with 4+ items closed
- 8 `MARKDOWN_EXTENSIONS` single-value arms
- 2 consumers with 3+ evolutions (arxiv + tables)
- 0 refactor-only phases
- 0 forward-compat-affordance arcs completed

Post-Phase-63:

- 7 concrete consumers UNCHANGED
- 7 plugin-regex-extension realizations UNCHANGED
- 7 constructor-arg-only realizations UNCHANGED
- 2 schema-extension realizations UNCHANGED
- **2 plugin-option-extension realizations** (+2 from Phase 62 affordance + Phase 63 registry consumer)
- **3 principal axes of zero-rework framework extension** (+1 from Phase 62 plugin-option axis)
- 5 dual-form regex realizations UNCHANGED
- 4 D-clauses with both items closed UNCHANGED
- **2 D-clauses with 3+ items closed** (+1 from D-L at Phase 62; both D-Q + D-L)
- **1 D-clause with 4+ items closed** (+1 from D-L at Phase 63)
- **9 `MARKDOWN_EXTENSIONS` single-value arms** (+1 from Phase 63 wikilinks-cross-entity)
- **3 consumers with 3+ evolutions** (+1 wikilinks at Phase 62; all three: arxiv + tables + wikilinks)
- **1 consumer with 4+ evolutions** (+1 wikilinks at Phase 63; first state where a consumer has 4+ evolutions)
- **1 refactor-only phase** (+1 from Phase 62)
- **1 forward-compat-affordance prerequisite-fulfillment arc completed** (+1 from Phase 62 → 63)
- **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE RECORD** at 25-phase (Phase 63; +3 phases vs Phase-61 record)
- **22-phase APPEND-deferral closure cadence** (+2 phases vs Phase-61 record)
- **28 consecutive no-new-ADR phases** (+2 vs Phase-61 record)
- **33 consecutive no-new-B-category phases** (+2 vs Phase-61 record)
- **173 consecutive 103 kB First Load JS units** (+9 vs Phase-61 record; 9 Phase-62 + 63 units)
- **3rd consecutive phase to set absolute-record carryover** (Phase 61 22-phase → Phase 62 24-phase → Phase 63 25-phase; first 3-consecutive-phase streak)
