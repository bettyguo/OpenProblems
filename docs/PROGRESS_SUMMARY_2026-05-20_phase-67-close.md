# Progress summary — Phase 67 close (2026-05-20)

> Narrative progress summary at HEAD `383a633` (Phase 67 close
> at Unit 67.4 gate; Phase 66 close at `ae8ecdb`). Supersedes
> `docs/PROGRESS_SUMMARY_2026-05-19_phase-65-close.md` (which
> remains as historical record). Companion to
> `docs/SESSION_HANDOFF_2026-05-20_phase-67-close.md` (paste-
> into-fresh-session payload) and the live ledger in
> `CHANGELOG.md` (~16,500+ lines).

## Where the project stands

**68 / 68 phases shipped** (Phase 0 → Phase 67, all ✅ closed).
Phase 68 awaiting explicit human sign-off per §12. **24
accepted ADRs** (**32 consecutive no-new-ADR phases** since
Phase 36 — longest streak in project history; first 32-phase
no-new-ADR streak; ADR-0025 candidate slot open since Phase 35).
**1573 / 76 vitest tests** at HEAD. **103 kB First Load JS**
unchanged for **192 consecutive units** (Phase 9 Unit 9.5 →
Phase 67 Unit 67.4; 100-unit threshold crossed at Phase 48
Unit 48.3). **160 kB middleware** unchanged since Phase 12.

**Framework state**: Phase 66 introduced the **first build-
time-validation realization** (audit-layer sub-pattern; no new
principal axis declared). Phase 67 introduced the **second
plugin-body output-shape sub-pattern realization** (first
multi-className emit; extends Phase-65 sub-pattern to 2
realizations) AND the **third plugin-option-axis realization**
(first 3-realization for plugin-option axis; first state where
plugin-option-axis has 3+ realizations). Phase 67 also gave the
wikilinks consumer its **6th evolution** post-first-ship (Phase
42 + 46 + 62 + 63 + 65 + 67); **first state where a consumer
has 6+ evolutions** in project history. The 4 principal axes
post-Phase-67: plugin-body **9** + registry-state 7 + plugin-
option **3** + schema-options 1. **D-L FULLY CLOSED at Phase
66** — SECOND D-clause with ALL enumerated items closed (D-Q
was first at Phase 64); first state where 2 D-clauses have
ALL enumerated items closed; first D-clause with 6+ items
closed (D-L at 6-of-6). Phase 66-67 also established the
**first "build-time + render-time" defense-in-depth pattern**
in project history — the Phase-66 validator helper has 2
consumers (audit script + render-time factory arm; drift-free).

## Session arc (Phase 66 → 67; 10 commits across 2 phases)

| Phase | Theme                                                                                                                                                               | HEAD at close | Tests   | Headline architectural first                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 66    | 404 handling for unresolved wikilinks via build-time validator hooked into `pnpm audit-content` (new sibling helper + 8th `AuditCheck` type `wikilink-target-fk`)   | `ae8ecdb`     | 1552/76 | **First build-time-validation realization** in project history — establishes build-time-validation as a sub-pattern within the existing audit-layer machinery (no new principal axis declared); **D-L FULLY CLOSED** — **SECOND D-clause with ALL enumerated items closed** (D-Q was first at Phase 64); **first state where 2 D-clauses have ALL enumerated items closed**; **first D-clause with 6+ items closed** (D-L at 6-of-6); **first D-clause to traverse from 0-of-N → ALL-N closed entirely under the Phase-37 framework era**; **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED** at 28-phase carryover; **second post-tie absolute-record extension**; **first 6-consecutive-phase set-or-extend streak**; 25-phase APPEND-deferral closure cadence — new record at the time                                                                                                                                                                                                           |
| 67    | Render-time fallback for unresolved wikilinks via multi-className emit + `isValidTarget?` plugin-option + new `MARKDOWN_EXTENSIONS=wikilinks-validated` factory arm | `383a633`     | 1573/76 | **First multi-className emit realization** in project history — Phase 65 single-class; Phase 67 first 2-class array conditionally; **second plugin-body output-shape sub-pattern realization** (first 2-realization for output-shape); **9th plugin-body axis realization** (first 9-realization for plugin-body axis); **third plugin-option-axis realization** (first 3-realization for plugin-option axis; first state where plugin-option-axis has 3+ realizations); **wikilinks consumer 6th evolution** (first 6+-evolution consumer); **first "build-time + render-time" defense-in-depth pattern**; **first state where Phase-66 validator helper has 2 consumers**; closes Phase-66 APPEND-D-AX render-time-fallback item at 1-phase carryover — ties Phase-51 + Phase-59 fastest-closure record; **first non-set-or-extend phase since Phase 60** — ends 6-consecutive-phase set-or-extend streak; 26-phase APPEND-deferral closure cadence — new record; first 3-phase gap between new-arm additions |

**+45 tests** since Phase-65-close start of session (1528 →
1573). **+1 vitest file** (75 → 76; `wikilinks-validator.test.ts`
Phase 66). **+2 ADR-0018 D-G APPENDs** (32 → 34; record extends
each phase). **+1 new `lib/markdown/extensions/` file** (21 →
22; `wikilinks-validator.ts` Phase 66 sibling helper).
**+1 new `MARKDOWN_EXTENSIONS` single-value arm**
(`wikilinks-validated` Phase 67 — 10 → 11; first new arm since
Phase 64 `tables-per-surface`; first 3-phase gap between new-
arm additions). **+0 new Phase-37-framework concrete consumers**
(7 UNCHANGED). **+1 plugin-body-axis realization** (8 → 9;
Phase 67 multi-className emit). **+1 plugin-body output-shape
sub-pattern realization** (1 → 2; Phase 67). **+1 plugin-option-
axis realization** (2 → 3; Phase 67 `isValidTarget?`). **+0
principal axes** (4 UNCHANGED; Phase 66 build-time-validation
is sub-pattern only). **+1 build-time-validation realization**
(0 → 1; Phase 66). **+1 multi-className emit realization** (0
→ 1; Phase 67). **+1 consumer with 6+ evolutions** (0 → 1;
wikilinks Phase 67). **+1 D-clause with ALL enumerated items
closed** (1 → 2; D-L Phase 66 — first state where 2 D-clauses
have ALL items closed). **+1 D-clause with 6+ items closed**
(0 → 1; D-L at 6-of-6 Phase 66). **+1 build-time + render-time
defense-in-depth pattern** (0 → 1; Phase 66 + 67 compose).
**+1 Phase-66-validator-helper consumer** (1 → 2; render-time
factory arm Phase 67). **+1 new `AuditCheck` type**
(`wikilink-target-fk` Phase 66; first new audit type since
Phase 2 baseline ship in Unit 2.11; was 7 → 8). **+2 NON-§13
phase count** (56 → 58). **+2 consecutive no-new-ADR phases**
(30 → 32; Phase 36-67). **+0 parallel-session commits** —
single-session arc Phase 66 + 67.

## What the framework looks like at HEAD

```
lib/markdown/extensions/  (22 files; +1 Phase 66)
├── default.ts                  (Phase 37 — base allow-list)
├── default.test.ts             (Phase 37)
├── types.ts                    (Phase 37 — registry interface + 3 slots)
├── index.ts                    (Phase 37+ → 67 — factory dispatch + 11 single-value arms post-Phase 67; Velite valid-targets loader Phase 67)
├── index.test.ts               (Phase 37+ — +4 Phase-67 factory-dispatch tests)
├── wikilinks.ts                (Phase 38 → 42 all-4 → 46 alias → 62 buildHref affordance → 63 cross-entity → 65 className → 67 isValidTarget? + multi-className emit)
├── wikilinks.test.ts           (Phase 38 + 46 + 62 + 63 + 65 + 67 = 76 tests; Phase 67 added 11 NEW)
├── wikilinks-validator.ts      (Phase 66 NEW — extractWikilinkReferences + isValidWikilinkTarget + types; reuses WIKILINK_PATTERN via re-export)
├── wikilinks-validator.test.ts (Phase 66 NEW — 17 NEW unit tests)
├── tables.ts                   (Phase 39 → 43 all-4 → 57 attributes → 61 caption → 64 per-surface schema-options)
├── tables.test.ts              (Phase 39 + 57 + 61 + 64 = 56 tests)
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

lib/content/cross-link-audit.ts  (Phase 2 → Phase 66 8th AuditCheck type wikilink-target-fk)
lib/content/cross-link-audit.test.ts (+7 Phase-66 audit-integration tests)
test/fixtures/audit-wikilink-dangling/ (Phase 66 NEW — taxonomy + problem + rating yaml with 4 dangling wikilinks)
```

**Default composition matrix at Phase-67 close** under
`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv`
(default `wikilinks` arm continues emitting single-class
`["wikilink"]` per Phase-65; Phase 66 + 67 do not change
default-arm emit shape):

| Surface           | rehypePlugins                                                               | schemaOverrides               | remarkPlugins                        |
| ----------------- | --------------------------------------------------------------------------- | ----------------------------- | ------------------------------------ |
| `bio`             | wikilinks default-call (bare; emits `className: ["wikilink"]` per Phase 65) | tables (full Phase-61 schema) | [arxiv, doi, pubmed, orcid, biorxiv] |
| `reviewNotes`     | wikilinks default-call (className)                                          | tables (full schema)          | [arxiv, doi, pubmed, orcid, biorxiv] |
| `rationale`       | wikilinks default-call (className)                                          | tables (full schema)          | [arxiv, doi, pubmed, orcid, biorxiv] |
| `actionRationale` | wikilinks default-call (className)                                          | tables (full schema)          | [arxiv, doi, pubmed, orcid, biorxiv] |

**Alternative compositions** (opt-in single-value arms):

| Arm                       | Phase  | Effect                                                                                                                                                                                                             |
| ------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `wikilinks-cross-entity`  | 63     | Tuple-form emit with `CROSS_ENTITY_BUILD_HREF`; `[[paper:x]]` → `/papers/x`; className inherited                                                                                                                   |
| `tables-per-surface`      | 64     | Per-surface schema map: bio → bio-restricted; reviewNotes + rationale + actionRationale → full Phase-61 schema                                                                                                     |
| **`wikilinks-validated`** | **67** | **Tuple-form emit with `isValidTarget` closure wrapping Phase-66 `isValidWikilinkTarget` helper against Velite-loaded `ValidWikilinkTargets`; emits `class="wikilink wikilink-unresolved"` on unresolved targets** |

## Architectural-firsts ledger Phase 66 + 67 (24 enumerated)

### Phase 66 firsts (12)

1. **First build-time-validation realization** in project
   history. Audit-layer extension framing per D-1 lean — no new
   principal axis declared at Phase 66.
2. **`wikilink-target-fk` becomes the 8th `AuditCheck` type** —
   **first state where the audit machinery has 8 `AuditCheck`
   types**; **first new audit type since Phase 2 baseline ship
   in Unit 2.11**.
3. **D-L becomes SECOND D-clause with ALL enumerated items
   closed** (D-Q was first at Phase 64). **First state where 2
   D-clauses have ALL enumerated items closed**.
4. **First D-clause with 6+ items closed** (D-L at 6-of-6;
   D-Q has only 4 enumerated items — D-L is the largest
   enumerated D-clause set by item count).
5. **First D-clause to traverse from 0-of-N closed → ALL-N
   closed entirely under the Phase-37 framework era** (D-L
   items first enumerated Phase 38; all 6 closed by Phase 66;
   28-phase arc from creation to completion).
6. **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER
   OBSERVED** at 28-phase carryover (Phase 38 → 66; extends
   Phase-65 27-phase record by 1 phase).
7. **Second post-tie absolute-record extension** (Phase 65
   first post-tie extension; Phase 66 confirms post-tie-
   EXTENSION pattern as sustained trajectory).
8. **First 6-consecutive-phase set-or-extend streak** in
   project history (Phase 61 new + 62 extend + 63 extend +
   64 tie + 65 extend + 66 extend).
9. **25-phase APPEND-deferral closure cadence sustained**
   (Phase 42-66) — new longest sustained cadence at the time.
10. **33rd APPEND on ADR-0018 D-G**; twenty-fourth two-letter
    APPEND letter D-AX; first 33-APPEND D-clause state.
11. **Fifty-seventh NON-§13 phase**; first 57-phase ledger-
    closure streak. **31st consecutive no-new-ADR phase**
    (Phase 36-66; first 31-phase no-new-ADR streak).
12. **61st "Continue" override invocation** — eleventh past
    half-century threshold.

### Phase 67 firsts (12)

1. **First multi-className emit realization** in project
   history. Phase 65 emitted single-class `["wikilink"]`;
   Phase 67 conditionally emits the 2-class array `["wikilink",
"wikilink-unresolved"]` based on the `isValidTarget?`
   plugin-option.
2. **Second plugin-body output-shape sub-pattern realization**
   (extends Phase-65 sub-pattern to 2 realizations; **first
   2-realization for the output-shape sub-pattern**). Sub-
   pattern depth ranks: input-regex 7 + output-shape **2**.
3. **9th plugin-body axis realization** in project history
   (extends Phase-65 8-realization record to 9; **first 9-
   realization for plugin-body axis**).
4. **Third plugin-option-axis realization** in project history
   (extends Phase-62/63 2-realization streak; **first 3-
   realization for plugin-option axis**; **first state where
   the plugin-option axis has 3+ realizations**). Mirrors
   Phase-62 `buildHref?` pattern verbatim.
5. **Wikilinks consumer gains 6th evolution post-first-ship**
   (Phase 42 + 46 + 62 + 63 + 65 + 67). **First state where a
   consumer has 6+ evolutions** in project history.
6. **First "build-time + render-time" defense-in-depth
   pattern** in project history (Phase 66 build-time + Phase 67
   render-time compose via the same Phase-66 validator helper).
7. **First state where the Phase-66 validator helper has 2
   consumers** (audit script + factory arm closure; drift-free
   — both assemble `ValidWikilinkTargets` from the same 4
   Velite collections).
8. **First 3-phase gap between new-`MARKDOWN_EXTENSIONS`-arm
   additions** in project history (Phase 64 `tables-per-
surface` → Phase 67 `wikilinks-validated`; Phases 65 + 66
   added zero arms).
9. **Ties Phase-51 pubmed alias + Phase-59 bioRxiv cross-
   surface 1-phase fastest-closure record**. Phase 67 closes
   Phase-66 APPEND-D-AX render-time-fallback item at 1-phase
   carryover. **First single-phase-carryover closure of a
   deferral introduced in the immediately-prior phase's
   APPEND** in project history — establishes the "fresh-
   deferral fast-closure" sub-pattern.
10. **26-phase APPEND-deferral closure cadence sustained**
    (Phase 42-67) — new longest sustained cadence (extends
    Phase-66 25-phase record to 26).
11. **First non-set-or-extend phase since Phase 60** in
    project history. Phase 67's 1-phase carryover does NOT
    set, extend, OR tie the absolute-record carryover (which
    remains at 28-phase from Phase 66). **Ends the 6-
    consecutive-phase set-or-extend streak** (Phase 61-66).
12. **34th APPEND on ADR-0018 D-G** + twenty-fifth two-letter
    APPEND letter D-AY. **Fifty-eighth NON-§13 phase**; first
    58-phase ledger-closure streak. **32nd consecutive no-new-
    ADR phase** (Phase 36-67; first 32-phase no-new-ADR
    streak). **62nd "Continue" override invocation** —
    twelfth past half-century threshold; **first 13-
    consecutive-phase post-half-century-Continue-override
    streak** (Phases 55-67).

## Remaining workload estimate

### Tier 1 — Framework-evolution (Phase 68+)

The Phase-67 acceptance gate
(`docs/thinking/67.4-phase-67-acceptance-gate.md`) enumerates
**10 ranked Phase-68 candidate threads**. The most-natural
cluster is autonomous-tractable framework evolutions; each
phase is ~3-5 units mirroring the Phase 41-67 shapes. The
cluster naturally completes when (a) the framework has
realizations along all 4 (or 5+) principal axes at depth 2+,
(b) all current APPEND-deferral items are closed, and (c) the
8th concrete consumer (OSF) ships.

| Phase            | Theme                                                                          | Lean                                                                                                                                                                                                                                                                                                                                                                                 | Units |
| ---------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- |
| **68 (pending)** | **2nd build-time-validation realization**                                      | Adds a second `AuditCheck` type using build-time validation (e.g., `markdown-link-target-fk` for non-wikilink markdown links to local paths). **WOULD ELEVATE "build-time-validation" from Phase-66 sub-pattern to recognized PRINCIPAL AXIS** — **first 5th principal axis in project history**. **First state where the framework has 5 principal axes of zero-rework extension**. | 2-3   |
| 69               | Period-allowing slug character-class extension                                 | Would let regex + validator + render-time fallback all match paper IDs like `[[paper:2109.07958]]`; plugin-body-axis realization lifting all three simultaneously. XSS audit per attribute-injection vector via dotted slugs.                                                                                                                                                        | 1-2   |
| 70               | Locale-prefixed cross-entity wikilink paths                                    | Concrete `buildHref` variant producing `/{locale}/papers/${slug}`; **fourth plugin-option-axis realization** (or new factory arm).                                                                                                                                                                                                                                                   | 1-2   |
| 71               | Curator-configurable className value via plugin-option axis                    | `ResolveWikilinksOptions.className?: string[]` — generalizes Phase-67 hardcoded array. **Fourth plugin-option-axis realization**. XSS audit per CSS-class-injection vector.                                                                                                                                                                                                          | 1-2   |
| 72               | Multi-className emit for entity-type-specific styling variants                 | E.g., `<a class="wikilink wikilink-paper">`. **Third plugin-body output-shape realization** composing with Phase-67 pattern.                                                                                                                                                                                                                                                         | 1-2   |
| 73               | Per-surface schema-options consumer beyond bio-restricted                      | E.g., `reviewNotes-extended` variant. **Second schema-options-axis realization** — extends Phase-64 axis to 2 realizations; first 2-realization for the FOURTH principal axis.                                                                                                                                                                                                       | 1-2   |
| 74               | Empty-alias fallback unification across consumers                              | Phase-48 deferral; smallest-scope.                                                                                                                                                                                                                                                                                                                                                   | 1     |
| 75               | Bare arxiv / DOI / PubMed / ORCID / bioRxiv IDs without prefix                 | Regex evolution; ambiguity-sensitive.                                                                                                                                                                                                                                                                                                                                                | 1-2   |
| 76               | Legacy numeric-only bioRxiv IDs (pre-2019 format) — 8th plugin-regex-extension | Small-scope; mirrors Phase-53 arxiv legacy ID-class pattern.                                                                                                                                                                                                                                                                                                                         | 1-2   |

**Tier 1 subtotal**: ~9 framework-cluster phases (68-76) ×
~3-5 units ≈ **~33-40 units ≈ 7-9 full-day single-session
sprints** to reach a state where (a) build-time-validation is
elevated to recognized PRINCIPAL AXIS (5th axis), (b) plugin-
option axis has 4+ realizations, (c) plugin-body output-shape
sub-pattern has 3 realizations, (d) schema-options axis has 2
realizations, and (e) all currently open APPEND deferrals are
closed.

### Tier 2 — New-consumer + ADR (Phase 77+)

| Phase | Theme                                                                                                                                                                             | Units    |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 77-78 | **OSF preprint consumer** — 8th concrete consumer (2-3 units for first-ship + 1-2 for alias + 1 for cross-surface; Phase 50/54/58 sibling-consumer pattern)                       | 4-6      |
| 79    | **ADR-0025 concrete content-moderation provider** — closes 32+ phase no-new-ADR streak (Phase 36-67); promotes `NoopModerator` default via `MODERATION_PROVIDER` env-var dispatch | 3-5      |
| 80+   | Schema-options 3rd realization OR plugin-only-emit 2nd plugin OR other follow-ons driven by curator demand                                                                        | 1-3 each |

**Tier 2 subtotal**: ~3-4 phases × ~3-6 units ≈ **~12-18 units
≈ 3-4 full-day sprints**.

### Tier 3 — Operational gates (curator-track; blocks production deploy)

Six gates pending unchanged Phase 37-67:

| Gate | Question                           | Estimated work                                                  |
| ---- | ---------------------------------- | --------------------------------------------------------------- |
| Q54  | GitHub OAuth production app        | 1-2 units (credential setup + redirect URL config)              |
| Q55  | Turso production DB (libSQL)       | 2-3 units (provision + migration apply + connection-string env) |
| Q69  | Vercel Blob production token       | 1 unit (token mint + env)                                       |
| Q73  | Google OAuth production app        | 1-2 units (mirrors Q54 for Google)                              |
| Q75  | Resend domain verification         | 1-2 units (DNS records + verification ping)                     |
| Q77  | Cron secret (`VERCEL_CRON_SECRET`) | 1 unit (secret mint + env + verify cron endpoint header)        |

**Tier 3 subtotal**: ~6 phases × ~1-3 units ≈ **~10-15 units ≈
2-3 full-day sprints** of curator-dependent work to bring up
production deploy.

### Aggregate remaining-workload estimate

**Total framework (Tier 1) + new-consumer/ADR (Tier 2) +
operational gates (Tier 3) ≈ 55-73 units ≈ 12-18 single-
session days** to reach deployable + framework-cluster-complete
state.

Comparison to Phase-65-close estimate:

- Phase-65-close estimated ~54-65 units to deployable + cluster-
  complete state (8 framework + 4 new-consumer/ADR + 6
  operational).
- Phase-67-close estimates ~55-73 units (9 framework + 3-4
  new-consumer/ADR + 6 operational). The slight revision
  upward reflects: (a) Phase 66 + 67 closed 2 APPEND-deferral
  items (D-L item 5 + D-AX render-time-fallback) at expected
  pacing — but Phase 67 also INTRODUCED a fresh deferral (the
  rank-2 period-allowing slug extension; rank 4 curator-
  configurable className value) for Phase 68+ to address; (b)
  the rank-1 Phase-68 thread (2nd build-time-validation
  realization) is a principal-axis-introduction milestone that
  warrants 2-3 units on its own; (c) Tier 2 ADR-0025 timing
  remains ~Phase 79.

After Tier 1 + 2 + 3 complete, the project shifts from
framework-evolution-intensive to **content-authoring-intensive**
(more seed problems, papers, rating actions, bilingual
content). The framework's current capability ceiling (**7
consumers** × **4 surfaces** × **3 slots** + **4 principal
axes**; **34 D-G APPENDs**; **11 MARKDOWN_EXTENSIONS single-
value arms**; 2 D-clauses with ALL items closed at Phase 66; 1
consumer with 6+ evolutions at Phase 67; plugin-only emit +
multi-className emit + build-time-validation patterns
recognized) is sufficient to support the content workload
through ~year 1 of public operation.

## Pacing observations

- **Architectural-firsts cadence**: Phases 62-67 each shipped
  10-12 architectural firsts per phase. The recent acceleration
  reflects the framework's increasing depth — each new
  realization intersects with multiple prior realizations to
  produce meta-firsts (e.g., "first state where a consumer has
  6+ evolutions" at Phase 67; "first state where 2 D-clauses
  have ALL items closed" at Phase 66).
- **Absolute-record set-or-extend streak**: Phase 61-66 = 6
  consecutive set-or-extend phases (longest streak in project
  history). Phase 67 ENDED the streak — first non-set-or-extend
  phase since Phase 60. Phase 67's 1-phase fresh-deferral fast-
  closure marks a new sub-pattern within the APPEND-closure
  cadence.
- **No-new-ADR streak**: Phase 36-67 = 32 consecutive phases
  without a new ADR (first 32-phase milestone). ADR-0018 D-G
  APPENDs have absorbed ALL Phase-37+ framework evolutions.
- **Single-session-phases streak**: Phases 54-64 ran as 11
  consecutive single-session phases; Phase 65 had 5 parallel-
  session commits interleaved; Phase 66-67 returned to single-
  session pattern (no parallel commits this session).
- **Test-suite growth**: 1452 (Phase 61 close) → 1486 (Phase
  63 close) → 1512 (Phase 64 close) → 1524 (Phase 65 close) →
  1528 (post-Phase-65 viz hotfix) → 1552 (Phase 66 close) →
  1573 (Phase 67 close). Steady ~20 new tests per phase.
- **`MARKDOWN_EXTENSIONS` arm cadence**: Phase 38 wikilinks →
  Phase 39 tables → Phase 41 arxiv → Phase 45 doi → Phase 50
  pubmed → Phase 54 orcid → Phase 58 biorxiv → Phase 63
  wikilinks-cross-entity → Phase 64 tables-per-surface → **Phase
  67 wikilinks-validated**. 3-phase gap between Phase 64 → 67
  is the **first 3-phase gap** in project history (most prior
  gaps were 4-5 phases except Phase 63 → 64 back-to-back).

## Six operational gates (pending, all curator-track)

| Q-number | Gate                         | Action                                                                                                                                   |
| -------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Q54      | GitHub OAuth production app  | Register OAuth app at github.com/settings/applications/new; set redirect URL; populate `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` env vars. |
| Q55      | Turso production libSQL DB   | Provision at turso.tech; apply migrations; populate `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.                                           |
| Q69      | Vercel Blob production token | Mint via Vercel dashboard; populate `BLOB_READ_WRITE_TOKEN`.                                                                             |
| Q73      | Google OAuth production app  | Mirror of Q54 for Google Identity (`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`).                                                             |
| Q75      | Resend domain verification   | Add DNS records; verify with Resend; populate `RESEND_FROM_EMAIL` for verified sender domain.                                            |
| Q77      | Cron secret                  | Mint `VERCEL_CRON_SECRET`; verify cron endpoint Authorization header check.                                                              |

None of these blocks framework work; all block the production
deploy from sending real emails / persisting real user data /
running real cron jobs.

## What the next session can do

The Phase-67-close `SESSION_HANDOFF_2026-05-20_phase-67-close.md`
file is the paste-into-fresh-session payload. Drop it into a
new Claude Code session at `c:\opensource\OpenProblems` and
the new session will pick up Phase 68 with the rank-1
candidate (2nd build-time-validation realization; would elevate
to first 5th principal axis) defaulted per the Phase-67-gate
recommendation, awaiting "Continue" sign-off per §12.

Alternative entry points for the next session:

- **Rank 2 (period-allowing slug character-class)**: 1-2 units;
  XSS audit per attribute injection vector; would lift regex +
  validator + render-time fallback simultaneously.
- **Rank 3 (locale-prefixed cross-entity paths)**: 1-2 units;
  4th plugin-option-axis realization.
- **Rank 4 (curator-configurable className value)**: 1-2 units;
  XSS audit per CSS-class-injection vector; would generalize
  Phase-67 hardcoded array.
- **Rank 5 (multi-className for entity-type-specific styling)**:
  1-2 units; 3rd plugin-body output-shape realization composing
  with Phase-67 pattern.
- **Rank 7 (OSF preprint consumer)**: 2-3 units; introduces
  8th concrete consumer; would be Phase 77 in the canonical
  ordering.
- **Rank 10 (ADR-0025 moderation provider)**: 3-5 units; not
  autonomous-tractable; would close the 32+ phase no-new-ADR
  streak.

Per §12, the user must explicitly sign off ("Continue") to
proceed past the Phase-68 boundary.
