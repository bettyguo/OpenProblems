# Progress summary — Phase 51 close (2026-05-19)

> Narrative progress summary at HEAD `7ae4e8e`. Supersedes
> `docs/PROGRESS_SUMMARY_2026-05-18_phase-47-close.md` (which
> remains as historical record). Companion to
> `docs/SESSION_HANDOFF_2026-05-19_phase-51-close.md` (paste-
> into-fresh-session payload) and the live ledger in
> `CHANGELOG.md`.

## Where the project stands

**52 / 52 phases shipped** (Phase 0 → Phase 51, all ✅
closed). Phase 52 awaiting explicit human sign-off per §12.
**24 accepted ADRs** (12 consecutive no-new-ADR phases since
Phase 36 — longest streak in project history; ADR-0025
candidate slot open since Phase 35). **1174 / 73 vitest
tests** at HEAD. **103 kB First Load JS** unchanged for 116
consecutive units (Phase 9 Unit 9.5 → Phase 51 Unit 51.4;
100-unit threshold crossed at Phase 48 Unit 48.3). **160 kB
middleware** unchanged since Phase 12.

## Session arc (Phase 48 → 51; 20 numbered units)

| Phase | Theme                                                | HEAD at close | Tests   | Headline architectural first                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ---------------------------------------------------- | ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 48    | DOI alias `[[doi:...\|display]]` dual-form           | `6567e5f`     | 1069/72 | Second dual-form regex; first selectively-applied lookahead in dual-form regex                                                                                                                                                                                                                                                                                                                                                   |
| 49    | DOI cross-surface expansion to all 4 surfaces        | `45fc919`     | 1088/72 | Fourth realization of constructor-arg-only zero-rework expansion (completes per-consumer all-4-surfaces arc); first 4-realization property; first all-4-surfaces same-slot composition; first all-4-surfaces triple-alias state; first D-clause with BOTH items closed within the closure cadence                                                                                                                                |
| 50    | PubMed PMID sibling consumer (5th concrete consumer) | `9f83be8`     | 1144/73 | First 3rd-`remarkPlugins` consumer; first 3-consumer same-slot composition; first 5-consumer composition under default dispatch (**maximum-consumer-cardinality state**); first env-var single-value arm beyond 5; regex-disjointness-as-sole-defense scales from 2 to 3 same-slot consumers                                                                                                                                     |
| 51    | PubMed PMID alias dual-form (1-phase carryover)      | `7ae4e8e`     | 1174/73 | Fourth realization of Phase-46 plugin-regex-extension phase-shape (all 3 `remarkPlugins` consumers exhibit dual-form regex); third dual-form regex; first dual-form regex with inner alternation inside the bracketed branch; first quadruple-alias surface; **first "first-phase APPEND-deferral closure"** (fastest ever observed; beats prior 3-phase record); first immediate-successor same-thread-direction phase boundary |

**+136 tests** since Phase-47-close start of session (1038 →
1174). **+1 vitest file** (73; first new file since Phase 45).
**+4 ADR-0018 D-G APPENDs** (14 → 18; record extends each
phase). **+2 `lib/markdown/extensions/` files** (15 → 17;
`pubmed.ts` + `pubmed.test.ts`). **+1 `MARKDOWN_EXTENSIONS`
single-value arm** (5 → 6; `pubmed` joins; first expansion
since Phase 45).

## What the framework looks like at HEAD

```
lib/markdown/extensions/
├── default.ts                  (Phase 37 — base allow-list)
├── default.test.ts             (Phase 37)
├── types.ts                    (Phase 37 — registry interface + 3 slots)
├── index.ts                    (Phase 37 — factory dispatch + 6 single-value arms)
├── index.test.ts               (Phase 37+ — dispatch tests across 6 arms + 5-way composite)
├── wikilinks.ts                (Phase 38 → 42 all-4 → 46 alias-capable)
├── wikilinks.test.ts
├── tables.ts                   (Phase 39 → 43 all-4)
├── tables.test.ts
├── composite.ts                (Phase 40 — `CompositeExtensionRegistry`)
├── composite.test.ts
├── arxiv.ts                    (Phase 41 → 44 all-4 → 47 dual-form alias)
├── arxiv.test.ts
├── doi.ts                      (Phase 45 → 48 dual-form alias → 49 all-4)
├── doi.test.ts
├── pubmed.ts                   (Phase 50 → 51 dual-form alias)
└── pubmed.test.ts              (Phase 50 + 51)
```

**Composition matrix at Phase-51 close** under default
dispatch `MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed`:

| Surface           | rehypePlugins     | schemaOverrides | remarkPlugins                        | Aliases active                                                              |
| ----------------- | ----------------- | --------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| `bio`             | wikilinks (alias) | tables          | [arxiv, doi] (both alias)            | wikilinks + arxiv + doi = **triple**                                        |
| `reviewNotes`     | wikilinks (alias) | tables          | [arxiv, doi] (both alias)            | wikilinks + arxiv + doi = **triple**                                        |
| `rationale`       | wikilinks (alias) | tables          | **[arxiv, doi, pubmed]** (all alias) | wikilinks + arxiv + doi + pubmed = **QUADRUPLE** ← first in project history |
| `actionRationale` | wikilinks (alias) | tables          | [arxiv, doi] (both alias)            | wikilinks + arxiv + doi = **triple**                                        |

Maximum-consumer-cardinality state: rationale carries **5
consumers across 3 slots** (wikilinks-rehype + tables-schema +
[arxiv, doi, pubmed]-remark). Other 3 surfaces carry 4
consumers (pubmed inactive there per Phase-50 rationale-only
default).

## Cadence patterns

**APPEND-deferral closure cadence sustained 10 phases** —
longest in project history. Closures (oldest-applicable-
first):

| Phase  | Closes                                        | Carryover                           |
| ------ | --------------------------------------------- | ----------------------------------- |
| 42     | Phase-38 D-L item 1 (cross-surface wikilinks) | 4-phase                             |
| 43     | Phase-39 D-Q item 2 (cross-surface tables)    | 4-phase                             |
| 44     | Phase-41 D-Y item 1 (cross-surface arxiv)     | 3-phase                             |
| 45     | Phase-41 D-Y item 4 (DOI sibling consumer)    | 4-phase                             |
| 46     | Phase-38 D-L item 2 (wikilink alias)          | 8-phase                             |
| 47     | Phase-41 D-Y item 5 (arxiv alias)             | 6-phase                             |
| 48     | Phase-45 D-AC item 2 (doi alias)              | 3-phase (tied Phase-44 record)      |
| 49     | Phase-45 D-AC cross-surface                   | 4-phase                             |
| 50     | Phase-45 D-AC PubMed PMID item                | 5-phase                             |
| **51** | **new Phase-50 PubMed alias deferral**        | **1-phase ← fastest ever observed** |

Alias-syntax cadence acceleration: **8 → 6 → 3 → 1** phases
across the four alias-syntax extensions. Each realization
halves (or better) the architectural risk for the next.

## Architectural firsts cumulative inventory

This session (Phase 48 → 51) shipped **48 distinct architectural
firsts** documented across 4 acceptance-gate THINK docs (~12
per phase). Cumulative inventory at Phase-51 close:

- **5 Phase-37-framework concrete consumers** (wikilinks · tables · arxiv · doi · pubmed) exercising all 3 slots.
- **4 plugin-regex-extension realizations** (Phase 46 wikilinks · 47 arxiv · 48 doi · 51 pubmed).
- **3 dual-form regex realizations** (arxiv · doi · pubmed). All 3 `remarkPlugins` consumers exhibit dual-form regex.
- **4 alias-syntax extensions** (wikilinks · arxiv · doi · pubmed).
- **4 realizations of the constructor-arg-only zero-rework expansion property** (Phase 42 wikilinks · 43 tables · 44 arxiv · 49 doi) — **first 4-realization property in project history**; completes the per-consumer all-4-surfaces arc.
- **1 quadruple-alias surface** (rationale under 5-way default; Phase 51 ship).
- **1 first-phase APPEND-deferral closure** (Phase 51; new record).
- **1 immediate-successor same-thread-direction phase boundary** (Phase 50 → 51; first ever).
- **1 maximum-consumer-cardinality state** (rationale under 5-way default with 5 consumers across 3 slots; Phase 50 ship).
- **1 first-D-clause-with-both-items-closed-within-cadence** (D-AC; Phase 48 item 2 + Phase 49 cross-surface).
- **1 selectively-applied lookahead in dual-form regex** (doi; Phase 48).
- **1 dual-form regex with inner alternation inside the bracketed branch** (pubmed; Phase 51).
- **5 distinct phase-shape patterns** in the framework: new-consumer · composition-infrastructure · cross-surface-expansion · plugin-regex-extension · acceptance-gate.

## Stable invariants

These have held through 4+ consecutive phases at Phase-51 close:

| Invariant                    | Value                                  | Streak                                            |
| ---------------------------- | -------------------------------------- | ------------------------------------------------- |
| ADR count                    | 24                                     | 16 phases (no new ADR since Phase 35)             |
| First Load JS shared chunk   | 103 kB                                 | 116 units (Phase 9 Unit 9.5 → Phase 51 Unit 51.4) |
| Middleware bundle            | 160 kB                                 | since Phase 12                                    |
| DB tables                    | 7                                      | since Phase 33                                    |
| Migrations                   | 9                                      | since Phase 36                                    |
| Env vars                     | 14                                     | since Phase 33                                    |
| i18n keys per locale         | 168                                    | since Phase 31                                    |
| OPEN_QUESTIONS Q-count       | 66 (28 resolved + 4 lean + 34 open)    | since Phase 36                                    |
| `Q32` content-audit warnings | 6 (related_problems-symmetry baseline) | 47 consecutive phases                             |
| Phase-37+ candidate count    | 8                                      | since Phase 39                                    |
| No-new-B-category streak     | Phase 31-51 = 21 phases                | first 21-phase run; first 2-decade no-new-B run   |
| Runtime deps added           | 0 since Phase 41 (`@types/mdast`)      | 10 phases                                         |

## Remaining-phases estimate (Phase 52 → ~60+)

The framework-evolution tier is well-charted; the alias-
syntax cluster is nearly complete (4 of 5 consumers
alias-capable; the 5th — pubmed — gained alias-syntax at
Phase 51). Remaining phase candidates fall into 3 tiers:

### Tier 1 — autonomous-tractable framework-evolution phases (~7 phases)

Each ~5 units mirroring Phase 41-51 shapes. Cumulative ~35
units ≈ 7 full-day single-session sprints.

| Phase | Theme                                                          | Lean                                                                                                                                  |
| ----- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 52    | **PubMed PMID cross-surface expansion** to all 4 surfaces      | 5th realization of constructor-arg-only zero-rework expansion; generalizes quadruple-alias to all 4 surfaces; rank 1 at Phase-51 gate |
| 53    | Older-style category-prefixed arxiv IDs (`arxiv:math/0211159`) | Regex extension on arxiv; closes APPEND-D-Y item 2 at 12-phase carryover                                                              |
| 54    | Table-specific attributes (`colspan`/`rowspan`/`scope`)        | First plugin-schema-extension on `schemaOverrides` slot; XSS-audit-required                                                           |
| 55    | **ORCID auto-link consumer**                                   | 6th concrete consumer; first 4th-`remarkPlugins` consumer; tests scaling regex-disjointness to 4 same-slot consumers                  |
| 56    | `<a class="wikilink">` styling                                 | First single-consumer-multi-slot case (wikilinks gains `schemaOverrides` arm)                                                         |
| 57    | 404 handling for unresolved wikilinks                          | Build-time validation step; closes APPEND-D-L item 5                                                                                  |
| 58    | Empty-alias fallback unification across consumers              | Refines arxiv-vs-doi-vs-pubmed empty-alias divergence; smallest scope                                                                 |

### Tier 2 — ADR-shaped phases (~2 phases)

Each ~5 units; introduce ADR-0025 + ADR-0026; close the
16+ phase no-new-ADR streak.

| Phase | Theme                                                                                                           | Lean                                                                                                                                                                                                                            |
| ----- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 59    | **ADR-0025 concrete content-moderation provider**                                                               | Closes 17+ phase no-new-ADR streak (Phase 36-58); 4-phase implementation (provider config + dispatch + integration tests + smoke); promotes `NoopModerator` default to real provider via `MODERATION_PROVIDER` env-var dispatch |
| 60    | Cross-entity wikilinks (`[[paper-id\|display]]` / `[[author-slug\|display]]` / `[[institution-slug\|display]]`) | Requires plugin parameterization (APPEND-D-L item 6 first); closes APPEND-D-L item 3                                                                                                                                            |

### Tier 3 — curator-track operational phases (~6 phases)

Each ~3-5 units; depend on curator action for the 6
operational gates (Q54/Q55/Q69/Q73/Q75/Q77).

| Phase | Theme                                    | Curator action       |
| ----- | ---------------------------------------- | -------------------- |
| 61    | GitHub OAuth production setup            | Q54                  |
| 62    | Turso production DB provisioning         | Q55                  |
| 63    | Vercel Blob store creation               | Q69                  |
| 64    | Google OAuth production setup            | Q73                  |
| 65    | Resend domain verification + cron secret | Q75 + Q77            |
| 66    | Production deploy + smoke gate run       | All Tier 3 unblocked |

### Aggregate remaining-workload estimate

| Tier                                         | Phases  | Units   | Calendar                                      | Curator unblock required |
| -------------------------------------------- | ------- | ------- | --------------------------------------------- | ------------------------ |
| Tier 1 (autonomous-tractable framework)      | 7       | ~35     | ~7 days single-session                        | No                       |
| Tier 2 (ADR-shaped + cross-entity wikilinks) | 2       | ~10     | ~2-3 days                                     | No                       |
| Tier 3 (operational gates)                   | 6       | ~25     | ~5-6 days but depends on curator availability | YES                      |
| **Total framework-evolution + operational**  | **~15** | **~70** | **~15 single-session days**                   | mixed                    |

After Tier 1-3 the project reaches **deployable state**:

- All current APPEND-D-L / D-Y / D-Q / D-AC deferrals closed.
- 6th concrete consumer (ORCID) + plugin parameterization landed.
- ADR-0025 concrete moderation provider chosen + integrated.
- Production environment provisioned + smoke-gated.

Post-deploy, the project shifts from **framework-evolution-
intensive to content-authoring-intensive** (more seed
problems, papers, rating actions, bilingual content). The
framework's current capability ceiling (5 consumers × 4
surfaces × 3 slots with all 3 `remarkPlugins` consumers
exhibiting dual-form regex) is sufficient to support the
content workload through ~year 1 of public operation; Tier-4
scaling (full bilingual content backfill; ~750-subscriber
Resend-free-tier ceiling unblock; concrete moderation
provider invocation budget) becomes the next workload tier.

## Recent acceleration patterns

The session shipped **20 numbered units across 4 phases** in
a single autonomous run (Phase 48 → 49 → 50 → 51), enabled
by the §12 sign-off discipline working as intended (each
phase boundary gated by an explicit "Continue" message;
within-phase units flowed unit-by-unit per the rhythm
feedback memory). **Cadence acceleration**: the alias-
syntax closure cadence has reduced from 8-phase (Phase 46)
to 1-phase (Phase 51) over 5 alias-syntax phases — a 5-
phase reduction signal that the framework's evolution
toolkit is well-internalized and that future alias-syntax
extensions on new consumers will likely close at 1-phase
carryover (e.g., a Phase-55 ORCID consumer first-ship +
Phase-56 ORCID alias would mirror the Phase 50 → 51
pattern).

**Phase 52 entry conditions**: per §12, awaits explicit
human sign-off. The 10-ranked candidate table at
`docs/thinking/51.4-phase-51-acceptance-gate.md` enumerates
the next-thread choices; rank 1 is PubMed PMID cross-surface
expansion. Mirrors Phase-49 doi cross-surface expansion
verbatim with `pubmed`/`PHASE_50_*` substituted.
