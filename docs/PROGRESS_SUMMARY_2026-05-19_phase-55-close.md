# Progress summary — Phase 55 close (2026-05-19)

> Narrative progress summary at HEAD `55bde0d`. Supersedes
> `docs/PROGRESS_SUMMARY_2026-05-19_phase-51-close.md` (which
> remains as historical record). Companion to
> `docs/SESSION_HANDOFF_2026-05-19_phase-55-close.md` (paste-
> into-fresh-session payload) and the live ledger in
> `CHANGELOG.md` (~11,335 lines).

## Where the project stands

**56 / 56 phases shipped** (Phase 0 → Phase 55, all ✅
closed). Phase 56 awaiting explicit human sign-off per §12.
**24 accepted ADRs** (20 consecutive no-new-ADR phases since
Phase 36 — longest streak in project history; ADR-0025
candidate slot open since Phase 35). **1303 / 74 vitest
tests** at HEAD. **103 kB First Load JS** unchanged for 135
consecutive units (Phase 9 Unit 9.5 → Phase 55 Unit 55.4;
100-unit threshold crossed at Phase 48 Unit 48.3). **160 kB
middleware** unchanged since Phase 12.

## Session arc (Phase 52 → 55; 20 numbered units)

| Phase | Theme                                                 | HEAD at close | Tests   | Headline architectural first                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ----------------------------------------------------- | ------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 52    | PubMed PMID cross-surface expansion → all 4 surfaces  | `8a8faac`     | 1195/73 | Fifth realization of constructor-arg-only zero-rework expansion (**first 5-realization property**); completes per-consumer all-4-surfaces arc for all 5 framework consumers; first all-4-surfaces quadruple-alias + 3-consumer same-slot + 5-consumer composition; fastest cross-surface-expansion APPEND-deferral closure ever observed at 2-phase carryover; second D-clause with both items closed (D-AH)                                                                                                                                                                                    |
| 53    | Older-style category-prefixed arxiv IDs               | `216c42f`     | 1225/73 | Fifth realization of Phase-46 plugin-regex-extension phase-shape (**first 5-realization phase-shape pattern**); first state with TWO 5-realization framework patterns coexisting; first non-alias-syntax plugin-regex-extension; first inner-class disjunction in a dual-form regex; second regex evolution on `remarkLinkArxivIds` (first plugin with 2 regex evolutions); **longest absolute APPEND-deferral closure ever observed** at 12-phase carryover                                                                                                                                    |
| 54    | ORCID auto-link consumer (6th concrete consumer)      | `ce24fa3`     | 1276/74 | Sixth concrete Phase-37-framework consumer; first 4th-`remarkPlugins` consumer; first 4-consumer same-slot composition; first 6-consumer composition under default dispatch (new maximum-consumer-cardinality state); 7th env-var single-value arm (first expansion since Phase 50); regex-disjointness-as-sole-defense scales 3 → 4 same-slot consumers; **first D-clause with FOUR items closed** within the cadence (D-AC); **first "more than 20 APPENDs on a single D-clause" milestone**                                                                                                  |
| 55    | ORCID alias dual-form (ties 1-phase carryover record) | `55bde0d`     | 1303/74 | Sixth realization of Phase-46 plugin-regex-extension phase-shape (**first 6-realization phase-shape pattern**); fourth dual-form regex; **all 4 `remarkPlugins` consumers exhibit dual-form regex**; **first quintuple-alias surface** (wikilinks + arxiv + doi + pubmed + orcid aliases simultaneously); **second "immediate-successor same-thread-direction phase boundary"** (first state where the pattern is observed twice); ties Phase-51 1-phase APPEND-deferral closure record (cadence acceleration reaches theoretical floor); **50th "Continue" override** (half-century milestone) |

**+129 tests** since Phase-51-close start of session (1174 →
1303). **+1 vitest file** (73 → 74; `orcid.test.ts`). **+4
ADR-0018 D-G APPENDs** (18 → 22; record extends each phase;
crosses 20-APPENDs milestone at Phase 54). **+2
`lib/markdown/extensions/` files** (17 → 19; `orcid.ts` +
`orcid.test.ts`). **+1 `MARKDOWN_EXTENSIONS` single-value
arm** (6 → 7; `orcid` joins; first expansion since Phase 50).

## What the framework looks like at HEAD

```
lib/markdown/extensions/  (19 files)
├── default.ts                  (Phase 37 — base allow-list)
├── default.test.ts             (Phase 37)
├── types.ts                    (Phase 37 — registry interface + 3 slots)
├── index.ts                    (Phase 37 — factory dispatch + 7 single-value arms)
├── index.test.ts               (Phase 37+ — dispatch tests across 7 arms + 6-way composite)
├── wikilinks.ts                (Phase 38 → 42 all-4 → 46 alias-capable)
├── wikilinks.test.ts
├── tables.ts                   (Phase 39 → 43 all-4)
├── tables.test.ts
├── composite.ts                (Phase 40 — `CompositeExtensionRegistry`)
├── composite.test.ts
├── arxiv.ts                    (Phase 41 → 44 all-4 → 47 dual-form alias → 53 legacy ID-class)
├── arxiv.test.ts
├── doi.ts                      (Phase 45 → 48 dual-form alias → 49 all-4)
├── doi.test.ts
├── pubmed.ts                   (Phase 50 → 51 dual-form alias → 52 all-4)
├── pubmed.test.ts
├── orcid.ts                    (Phase 54 → 55 dual-form alias)
└── orcid.test.ts               (Phase 54 + 55)
```

**Composition matrix at Phase-55 close** under default
dispatch `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid`:

| Surface           | rehypePlugins     | schemaOverrides | remarkPlugins                               | Aliases active                                                                      |
| ----------------- | ----------------- | --------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bio`             | wikilinks (alias) | tables          | [arxiv, doi, pubmed] (all alias)            | wikilinks + arxiv + doi + pubmed = **quadruple**                                    |
| `reviewNotes`     | wikilinks (alias) | tables          | [arxiv, doi, pubmed] (all alias)            | wikilinks + arxiv + doi + pubmed = **quadruple**                                    |
| `rationale`       | wikilinks (alias) | tables          | **[arxiv, doi, pubmed, orcid]** (all alias) | wikilinks + arxiv + doi + pubmed + orcid = **QUINTUPLE** ← first in project history |
| `actionRationale` | wikilinks (alias) | tables          | [arxiv, doi, pubmed] (all alias)            | wikilinks + arxiv + doi + pubmed = **quadruple**                                    |

Maximum-consumer-cardinality state: rationale carries **6
consumers across 3 slots** (wikilinks-rehype + tables-schema +
[arxiv, doi, pubmed, orcid]-remark). Other 3 surfaces carry 5
consumers (orcid inactive there per Phase-54 rationale-only
default).

## Cadence patterns

**APPEND-deferral closure cadence sustained 14 phases** —
longest in project history. Closures (oldest-applicable-
first):

| Phase  | Closes                                        | Carryover                                             |
| ------ | --------------------------------------------- | ----------------------------------------------------- |
| 42     | Phase-38 D-L item 1 (cross-surface wikilinks) | 4-phase                                               |
| 43     | Phase-39 D-Q item 2 (cross-surface tables)    | 4-phase                                               |
| 44     | Phase-41 D-Y item 1 (cross-surface arxiv)     | 3-phase                                               |
| 45     | Phase-41 D-Y item 4 (DOI sibling consumer)    | 4-phase                                               |
| 46     | Phase-38 D-L item 2 (wikilink alias)          | 8-phase                                               |
| 47     | Phase-41 D-Y item 5 (arxiv alias)             | 6-phase                                               |
| 48     | Phase-45 D-AC item 2 (doi alias)              | 3-phase (tied Phase-44 record at the time)            |
| 49     | Phase-45 D-AC cross-surface                   | 4-phase                                               |
| 50     | Phase-45 D-AC PubMed PMID item                | 5-phase                                               |
| 51     | new Phase-50 PubMed alias deferral            | **1-phase ← fastest ever observed** (record set)      |
| 52     | Phase-50 D-AH PubMed cross-surface            | **2-phase ← fastest cross-surface closure** (record)  |
| 53     | Phase-41 D-Y item 2 (arxiv legacy)            | **12-phase ← longest absolute closure ever** (record) |
| 54     | Phase-45 D-AC ORCID auto-link consumer item   | 9-phase (second-longest absolute)                     |
| **55** | **new Phase-54 ORCID alias deferral**         | **1-phase ← ties Phase-51 fastest-closure record**    |

Alias-syntax cadence acceleration: **8 → 6 → 3 → 1 → 1**
phases across the five alias-syntax extensions. **Cadence
acceleration has reached its theoretical floor** — 1-phase is
the immediate-successor closure; same-phase closure would
invalidate the demand-signal-first first-ship discipline.

Cross-surface-expansion cadence trajectory: **4 → 4 → 3 → 4
→ 2** phases (Phase-38 wikilinks → 42; Phase-39 tables → 43;
Phase-41 arxiv → 44; Phase-45 doi → 49; Phase-50 pubmed → 52).
Phase 52 set the new fastest cross-surface closure record at
2-phase carryover; Phase 56 (rank-1) anticipated to tie at
2-phase carryover (Phase 54 → 56).

## Architectural firsts cumulative inventory

This session (Phase 52 → 55) shipped **48 distinct architectural
firsts** documented across 4 acceptance-gate THINK docs (~12
per phase). Cumulative inventory at Phase-55 close:

- **6 Phase-37-framework concrete consumers** (wikilinks · tables · arxiv · doi · pubmed · orcid) exercising all 3 slots.
- **6 plugin-regex-extension realizations** (Phase 46 wikilinks · 47 arxiv alias · 48 doi alias · 51 pubmed alias · 53 arxiv legacy ID-class · 55 orcid alias). **First 6-realization phase-shape pattern in project history**.
- **4 dual-form regex realizations** (arxiv · doi · pubmed · orcid). **All 4 `remarkPlugins` consumers exhibit dual-form regex** — alias-syntax phase-shape has exhausted all `remarkPlugins` consumer candidates.
- **5 alias-syntax extensions** (wikilinks · arxiv · doi · pubmed · orcid).
- **5 realizations of the constructor-arg-only zero-rework expansion property** (Phase 42 wikilinks · 43 tables · 44 arxiv · 49 doi · 52 pubmed) — **first 5-realization property in project history** (Phase 52 ship); **completes the per-consumer all-4-surfaces arc for ALL 5 of those consumers** (ORCID still rationale-only at Phase-55 close).
- **TWO 5+-realization framework patterns coexist** post-Phase 55: plugin-regex-extension (6 realizations) + constructor-arg-only zero-rework expansion (5 realizations). **First multi-5+-realization state in project history**.
- **1 plugin with 2 regex evolutions** (arxiv: Phase 47 alias + Phase 53 legacy). **First plugin with 2 regex evolutions** in project history.
- **1 inner-class disjunction in a dual-form regex** (arxiv modern + legacy; Phase 53). **First inner-class disjunction** in project history.
- **1 quintuple-alias surface** (rationale under 6-way default; Phase 55 ship).
- **1 sextuple-consumer surface** (rationale under 6-way default with 6 consumers across 3 slots; Phase 54 ship — **new maximum-consumer-cardinality state**).
- **1 first-D-clause-with-FOUR-items-closed-within-cadence** (D-AC; Phase 48 item 2 + Phase 49 cross-surface + Phase 50 PubMed item + Phase 54 ORCID item). **First D-clause to have ≥4 items resolved through the cadence**.
- **2 immediate-successor same-thread-direction phase boundaries** (Phase 50 → 51 pubmed; Phase 54 → 55 orcid). **First state where the pattern has been observed twice**.
- **2 1-phase APPEND-deferral closures** (Phase 51 pubmed alias; Phase 55 orcid alias). **First state where two alias-syntax closures tie at 1-phase carryover** — cadence acceleration has reached its theoretical floor.
- **1 4-consumer same-slot composition** (arxiv-doi-pubmed-orcid in `remarkPlugins` on rationale; Phase 54 ship). **Regex-disjointness-as-sole-defense discipline scales from 3 to 4 same-slot consumers** without architectural change.
- **5 distinct phase-shape patterns** in the framework: new-consumer · composition-infrastructure · cross-surface-expansion · plugin-regex-extension · acceptance-gate.

## Stable invariants

These have held through 4+ consecutive phases at Phase-55 close:

| Invariant                    | Value                                  | Streak                                            |
| ---------------------------- | -------------------------------------- | ------------------------------------------------- |
| ADR count                    | 24                                     | 20 phases (no new ADR since Phase 35)             |
| First Load JS shared chunk   | 103 kB                                 | 135 units (Phase 9 Unit 9.5 → Phase 55 Unit 55.4) |
| Middleware bundle            | 160 kB                                 | since Phase 12                                    |
| DB tables                    | 7                                      | since Phase 33                                    |
| Migrations                   | 9                                      | since Phase 36                                    |
| Env vars                     | 14                                     | since Phase 33                                    |
| i18n keys per locale         | 168                                    | since Phase 31                                    |
| OPEN_QUESTIONS Q-count       | 66 (28 resolved + 4 lean + 34 open)    | since Phase 36                                    |
| `Q32` content-audit warnings | 6 (related_problems-symmetry baseline) | 51 consecutive phases                             |
| Phase-37+ candidate count    | 8                                      | since Phase 39                                    |
| No-new-B-category streak     | Phase 31-55 = 25 phases                | first 25-phase run                                |
| Runtime deps added           | 0 since Phase 41 (`@types/mdast`)      | 14 phases                                         |

## Remaining-phases estimate (Phase 56 → ~62+)

The framework-evolution tier is nearing completion; the alias-
syntax cluster is **fully exhausted** for `remarkPlugins`
consumers (all 4 of arxiv/doi/pubmed/orcid have alias syntax
post-Phase 55). Remaining phase candidates fall into 3 tiers:

### Tier 1 — autonomous-tractable framework-evolution phases (~5 phases)

Each ~5 units mirroring Phase 41-55 shapes. Cumulative ~25
units ≈ 5 full-day single-session sprints.

| Phase | Theme                                                   | Lean                                                                                                                                                                            |
| ----- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 56    | **ORCID cross-surface expansion** to all 4 surfaces     | 6th realization of constructor-arg-only zero-rework expansion; **first 6-realization** for that pattern; generalizes quintuple-alias to all 4 surfaces; rank 1 at Phase-55 gate |
| 57    | Table-specific attributes (`colspan`/`rowspan`/`scope`) | First plugin-schema-extension on `schemaOverrides` slot; XSS-audit-required; closes APPEND-D-Q item 3                                                                           |
| 58    | bioRxiv preprint consumer (7th concrete consumer)       | First 5th-`remarkPlugins` consumer; tests scaling regex-disjointness to 5 same-slot consumers; DOI overlap concern requires regex disambiguation                                |
| 59    | `<a class="wikilink">` styling                          | First single-consumer-multi-slot case (wikilinks gains `schemaOverrides` arm); closes APPEND-D-L item 4                                                                         |
| 60    | 404 handling for unresolved wikilinks                   | Build-time validation step; closes APPEND-D-L item 5                                                                                                                            |

### Tier 2 — ADR-shaped phases (~2 phases)

Each ~5 units; introduce ADR-0025 + ADR-0026; close the
20+ phase no-new-ADR streak.

| Phase | Theme                                                                                                           | Lean                                                                                                                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 61    | **ADR-0025 concrete content-moderation provider**                                                               | Closes 21+ phase no-new-ADR streak (Phase 36-60); 4-phase implementation (provider config + dispatch + integration tests + smoke); promotes `NoopModerator` default to real provider via `MODERATION_PROVIDER` env-var dispatch |
| 62    | Cross-entity wikilinks (`[[paper-id\|display]]` / `[[author-slug\|display]]` / `[[institution-slug\|display]]`) | Requires plugin parameterization (APPEND-D-L item 6 first); closes APPEND-D-L item 3                                                                                                                                            |

### Tier 3 — curator-track operational phases (~6 phases)

Each ~3-5 units; depend on curator action for the 6
operational gates (Q54/Q55/Q69/Q73/Q75/Q77).

| Phase | Theme                                    | Curator action       |
| ----- | ---------------------------------------- | -------------------- |
| 63    | GitHub OAuth production setup            | Q54                  |
| 64    | Turso production DB provisioning         | Q55                  |
| 65    | Vercel Blob store creation               | Q69                  |
| 66    | Google OAuth production setup            | Q73                  |
| 67    | Resend domain verification + cron secret | Q75 + Q77            |
| 68    | Production deploy + smoke gate run       | All Tier 3 unblocked |

### Aggregate remaining-workload estimate

| Tier                                         | Phases  | Units   | Calendar                                      | Curator unblock required |
| -------------------------------------------- | ------- | ------- | --------------------------------------------- | ------------------------ |
| Tier 1 (autonomous-tractable framework)      | 5       | ~25     | ~5 days single-session                        | No                       |
| Tier 2 (ADR-shaped + cross-entity wikilinks) | 2       | ~10     | ~2-3 days                                     | No                       |
| Tier 3 (operational gates)                   | 6       | ~25     | ~5-6 days but depends on curator availability | YES                      |
| **Total framework-evolution + operational**  | **~13** | **~60** | **~13 single-session days**                   | mixed                    |

After Tier 1-3 the project reaches **deployable state**:

- All current APPEND-D-L / D-Y / D-Q / D-AC deferrals closed.
- 7th concrete consumer (bioRxiv) + plugin parameterization landed.
- ADR-0025 concrete moderation provider chosen + integrated.
- Production environment provisioned + smoke-gated.

Post-deploy, the project shifts from **framework-evolution-
intensive to content-authoring-intensive** (more seed
problems, papers, rating actions, bilingual content). The
framework's current capability ceiling (6 consumers × 4
surfaces × 3 slots with all 4 `remarkPlugins` consumers
exhibiting dual-form regex) is sufficient to support the
content workload through ~year 1 of public operation; Tier-4
scaling (full bilingual content backfill; ~750-subscriber
Resend-free-tier ceiling unblock; concrete moderation
provider invocation budget) becomes the next workload tier.

## Recent acceleration patterns

The session shipped **20 numbered units across 4 phases** in
a single autonomous run (Phase 52 → 53 → 54 → 55), enabled
by the §12 sign-off discipline working as intended (each
phase boundary gated by an explicit "Continue" message;
within-phase units flowed unit-by-unit per the rhythm
feedback memory). **Cadence acceleration** has now reached
the theoretical floor for two distinct phase-shape patterns:

- **Alias-syntax extension**: 8 → 6 → 3 → 1 → 1 phases (Phase
  46 → 47 → 48 → 51 → 55). Two consecutive 1-phase carryovers
  (Phase 51 + Phase 55) confirm the immediate-successor
  closure is now the consistent pattern for sibling-consumer
  first-ship + alias-syntax extension.
- **Cross-surface expansion**: 4 → 4 → 3 → 4 → 2 phases
  (Phase 42 → 43 → 44 → 49 → 52). Phase 52 set the new
  fastest cross-surface closure record at 2-phase carryover;
  Phase 56 (rank-1) anticipated to tie at 2-phase carryover.

**Phase 56 entry conditions**: per §12, awaits explicit
human sign-off. The 10-ranked candidate table at
`docs/thinking/55.4-phase-55-acceptance-gate.md` enumerates
the next-thread choices; rank 1 is ORCID cross-surface
expansion. Mirrors Phase-52 pubmed cross-surface expansion
verbatim with `orcid`/`PHASE_54_*` substituted.

## Half-century milestone (50th "Continue" override at Phase 55.0)

The **50th "Continue" override invocation** at Unit 55.0 marks
the half-century milestone of §12-cardinal-rule sign-off
discipline over Phases 6-55. The discipline has held across
~50 phase-boundary gates without bypass; the auto-mode
classifier denies any commit that claims sign-off without a
literal user "Continue" message in the transcript (the Phase-
45 boundary discovery, preserved Phase 52 entry when an
`AskUserQuestion` answer was insufficient and required a
direct text message). The 50-Continue mark is one of the
project's most-load-bearing organizational invariants — every
phase boundary in the multi-month rhythm has held an
explicit human handshake, and the entire ~11,335-line
CHANGELOG can be audited back to those 50 sign-off moments.
