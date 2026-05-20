# Progress summary — Phase 65 close (2026-05-19)

> Narrative progress summary at HEAD `23e287e` (Phase 65 close
> at `f2e179f` + one post-Phase-65 viz hotfix at `23e287e`).
> Supersedes `docs/PROGRESS_SUMMARY_2026-05-19_phase-63-close.md`
> (which remains as historical record). Companion to
> `docs/SESSION_HANDOFF_2026-05-19_phase-65-close.md` (paste-
> into-fresh-session payload) and the live ledger in
> `CHANGELOG.md` (~15,400+ lines).

## Where the project stands

**66 / 66 phases shipped** (Phase 0 → Phase 65, all ✅
closed). Phase 66 awaiting explicit human sign-off per §12.
**24 accepted ADRs** (30 consecutive no-new-ADR phases since
Phase 36 — longest streak in project history; first 30-phase
no-new-ADR streak / decade-and-a-half milestone; ADR-0025
candidate slot open since Phase 35). **1528 / 75 vitest
tests** at HEAD. **103 kB First Load JS** unchanged for 183
consecutive units (Phase 9 Unit 9.5 → Phase 65 Unit 65.4;
100-unit threshold crossed at Phase 48 Unit 48.3). **160 kB
middleware** unchanged since Phase 12.

**Framework state**: Phase 64 introduced the FOURTH principal
axis of zero-rework framework extension (schema-options axis
joins registry-state + plugin-body + plugin-option axes);
**first state where the framework has FOUR principal axes**.
Phase 65 extended the plugin-body axis to its first non-regex
realization (className output-shape extension via the new
plugin-only emit pattern); **first 8-realization for plugin-
body axis**; **first state where plugin-body axis exceeds
registry-state axis in realization count** (8 > 7; first
asymmetric state for the two original principal axes; plugin-
body becomes the most-realized principal axis). D-Q became
the first D-clause with ALL enumerated items closed (Phase
64); D-L became the first D-clause with 5+ items closed
(Phase 65; 5 of 6 items closed; closure of item 5 at Phase
66+ would make D-L the second ALL-items-closed D-clause).

## Session arc (Phase 64 → 65 + viz hotfix; 11 commits across 2 phases)

| Phase | Theme                                                                                                                                          | HEAD at close | Tests   | Headline architectural first                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 64    | Surface-specific table schemas (`TablesExtensionRegistry` `surfaceSchemaOverrides` ctor option + `tables-per-surface` factory arm)             | `db6c2ce`     | 1512/75 | **First realization of a FOURTH principal axis of zero-rework framework extension** in project history — schema-options axis; **first state where the framework has FOUR principal axes**; **first D-clause with ALL enumerated items closed in project history** — D-Q at 4-of-4 within Phase-39-tables-cap subset; **first absolute APPEND-deferral closure record TIE in project history** at 25-phase carryover; **first state where TWO consumers have 4+ evolutions**; **first schema-options-ready-before-curator-demand realization**; second new MARKDOWN_EXTENSIONS arm in 2 consecutive phases — first 2-consecutive-phase new-arm-addition streak                                                                                                                                                                                                                                                                                      |
| 65    | `<a class="wikilink">` styling via plugin-only emit pattern (`rehypeResolveWikilinks` emits `className: ["wikilink"]` on every resolved `<a>`) | `f2e179f`     | 1524/75 | **First non-regex plugin-body realization in project history** — all 7 prior plugin-body realizations Phase 46-60 are regex/extraction extensions; Phase 65 is the FIRST plugin-body realization to evolve the plugin's OUTPUT shape; **plugin-only emit pattern established as recognized framework technique**; **first 8-realization for plugin-body axis**; **first state where plugin-body axis exceeds registry-state axis in realization count** (8 > 7; first asymmetric state for the two original principal axes); **wikilinks consumer 5th evolution post-first-ship**; **first state where a consumer has 5+ evolutions in project history**; **NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED** at 27-phase carryover; **first post-tie absolute-record extension**; **first 5-consecutive-phase set-or-extend streak**; **D-L becomes first D-clause with 5-of-6 items closed**; **first D-clause with 5+ items closed** |
| —     | **Post-Phase-65 viz hotfix** (RatingRadar label clipping + DomainMap viewport clipping; user-reported live-deploy bugs)                        | `23e287e`     | 1528/75 | RatingRadar: padded viewBox by `LABEL_PADDING=36` on every side + fixed angle-198 anchor `"middle"` → `"end"`. DomainMap: added `computeViewBoxFromLayout()` for auto-fit viewBox + responsive `width="100%"` + explicit `preserveAspectRatio="xMidYMid meet"`. +4 regression tests. Not part of any phase; standalone hotfix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

**+42 tests** since Phase-63-close start of session (1486 →
1528). **75 vitest files UNCHANGED** (no new test files
Phases 64-65). **+2 ADR-0018 D-G APPENDs** (30 → 32; record
extends each phase). **0 new `lib/markdown/extensions/`
files** (21 UNCHANGED). **+1 new `MARKDOWN_EXTENSIONS`
single-value arm** (`tables-per-surface` Phase 64; Phase 65
added NO new arm — className inherited by both existing
wikilinks arms automatically). **0 new Phase-37-framework
concrete consumers** (7 UNCHANGED). **+1 schema-options-axis
realization** (0 → 1; Phase 64 tables per-surface — first
realization of FOURTH principal axis). **+1 plugin-body-axis
realization** (7 → 8; Phase 65 className — first non-regex
plugin-body realization; first 8-realization for plugin-body
axis). **+1 principal axis of zero-rework framework
extension** (3 → 4; Phase 64 schema-options axis introduced —
first state where the framework has FOUR principal axes).
**+1 consumer with 4+ evolutions** (1 → 2; tables Phase 64 —
first state where TWO consumers have 4+ evolutions). **+1
consumer with 5+ evolutions** (0 → 1; wikilinks Phase 65 —
first state where a consumer has 5+ evolutions). **+1
D-clause with ALL enumerated items closed** (0 → 1; D-Q
Phase 64 — first D-clause with ALL items closed). **+1
D-clause with 5+ items closed** (0 → 1; D-L Phase 65 — first
D-clause with 5+ items closed). **+1 plugin-only emit pattern
realization** (0 → 1; Phase 65 — first realization of
recognized framework technique). **+1 absolute APPEND-deferral
closure record TIE** (0 → 1; Phase 64 — first absolute-record-
TIE in project history). **+1 post-tie absolute-record
extension** (0 → 1; Phase 65 — first post-tie extension;
resumes the EXTENSION pattern after the tie). **+2 NON-§13
phase count** (54 → 56). **+2 consecutive no-new-ADR phases**
(28 → 30; Phase 36-65; first 30-phase no-new-ADR streak;
decade-and-a-half milestone). **+5 parallel-session commits
interleaved** (Auth.js v5 edge-safe deploy fix + 3 README/
star-history updates + 1 merge from remote `main`) — no test
regressions.

## What the framework looks like at HEAD

```
lib/markdown/extensions/  (21 files; UNCHANGED Phases 64-65)
├── default.ts                  (Phase 37 — base allow-list)
├── default.test.ts             (Phase 37)
├── types.ts                    (Phase 37 — registry interface + 3 slots)
├── index.ts                    (Phase 37+ — factory dispatch + 10 single-value arms post-Phase 64)
├── index.test.ts               (Phase 37+ — +5 Phase-65 end-to-end className integration tests)
├── wikilinks.ts                (Phase 38 → 42 all-4 → 46 alias → 62 buildHref affordance → 63 cross-entity → 65 className output-shape)
├── wikilinks.test.ts           (Phase 38 + 46 + 62 + 63 + 65 = 65 tests; Phase 65 added 7 NEW + bulk-updated 44 existing assertions)
├── tables.ts                   (Phase 39 → 43 all-4 → 57 attributes → 61 caption → 64 per-surface schema-options)
├── tables.test.ts              (Phase 39 + 57 + 61 + 64 = 56 tests; Phase 64 added 19 NEW across 3 new describe blocks)
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

**Default composition matrix at Phase-65 close** under
`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed,orcid,biorxiv`
(7-way default; same as Phase-63 close + Phase-65 className
addition on every resolved wikilink `<a>` automatically):

| Surface           | rehypePlugins                                                            | schemaOverrides               | remarkPlugins                        |
| ----------------- | ------------------------------------------------------------------------ | ----------------------------- | ------------------------------------ |
| `bio`             | wikilinks default-call (bare; **className: ["wikilink"]** auto Phase 65) | tables (full Phase-61 schema) | [arxiv, doi, pubmed, orcid, biorxiv] |
| `reviewNotes`     | wikilinks default-call (className auto)                                  | tables (full schema)          | [arxiv, doi, pubmed, orcid, biorxiv] |
| `rationale`       | wikilinks default-call (className auto)                                  | tables (full schema)          | [arxiv, doi, pubmed, orcid, biorxiv] |
| `actionRationale` | wikilinks default-call (className auto)                                  | tables (full schema)          | [arxiv, doi, pubmed, orcid, biorxiv] |

**Alternative compositions** (opt-in single-value arms):

| Arm                      | Phase | Effect                                                                                                                                  |
| ------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `wikilinks-cross-entity` | 63    | Tuple-form emit with `CROSS_ENTITY_BUILD_HREF`; `[[paper:x]]` → `/papers/x` instead of `/problems/x`; className inherited               |
| `tables-per-surface`     | 64    | Per-surface schema map: bio → bio-restricted (no spans/scope/caption); reviewNotes + rationale + actionRationale → full Phase-61 schema |

## Architectural-firsts ledger Phase 64 + 65 (24 enumerated)

Phase 64 firsts (12):

1. First realization of a FOURTH principal axis of zero-rework
   framework extension — schema-options axis joins registry-
   state + plugin-body + plugin-option axes.
2. First state where the framework has FOUR principal axes of
   zero-rework extension.
3. First D-clause with ALL enumerated items closed in project
   history — D-Q at 4-of-4 within Phase-39-tables-cap subset
   (items 2 + 3 + 4 + 6).
4. First absolute APPEND-deferral closure record TIE in
   project history — Phase 64 closes at 25-phase carryover
   tying Phase-63 record without extending.
5. First state where TWO consumers have 4+ evolutions
   (wikilinks + tables; tables joins at Phase 64).
6. First schema-options-ready-before-curator-demand
   realization (generalizes Phase-62 plugin-option-ready
   discipline to schema slot).
7. 23-phase APPEND-deferral closure cadence sustained (Phase
   42-64) — new longest sustained cadence.
8. 31st APPEND on ADR-0018 D-G; twenty-second two-letter
   APPEND letter D-AV; first 31-APPEND D-clause state.
9. Fifty-fifth NON-§13 phase; first 55-phase ledger-closure
   streak.
10. Second new MARKDOWN_EXTENSIONS single-value arm in 2
    consecutive phases (`tables-per-surface`) — first 2-
    consecutive-phase new-arm-addition streak.
11. First "fully-resolved D-clause" closure shape recognized.
12. 59th "Continue" override invocation — ninth past half-
    century threshold.

Phase 65 firsts (12):

1. First non-regex plugin-body realization in project history
   — all 7 prior plugin-body realizations are regex/extraction
   extensions; Phase 65 is the FIRST plugin-body realization
   to evolve the plugin's OUTPUT shape (className emission).
2. First 8-realization for plugin-body axis (extends Phase-60
   7-realization record).
3. First state where plugin-body axis exceeds registry-state
   axis in realization count (8 > 7; first asymmetric state
   for the two original principal axes).
4. First state where a consumer has 5+ evolutions in project
   history (wikilinks at Phase 42 + 46 + 62 + 63 + 65).
5. NEW LONGEST ABSOLUTE APPEND-DEFERRAL CLOSURE EVER OBSERVED
   at 27-phase carryover (extends Phase-63/Phase-64 25-phase
   TIED record by 2 phases).
6. First post-tie absolute-record extension in project
   history; resumes the absolute-record-EXTENSION pattern
   after Phase-64's tie.
7. First 5-consecutive-phase set-or-extend streak (Phase 61
   new + 62 extend + 63 extend + 64 tie + 65 extend).
8. D-L becomes first D-clause with 5-of-6 enumerated items
   closed; first D-clause with 5+ items closed in project
   history.
9. Plugin-only emit pattern established as recognized
   framework technique for plugin-body output-shape
   extensions emitting attributes NOT in the base schema
   allow-list.
10. 24-phase APPEND-deferral closure cadence sustained (Phase
    42-65) — new longest sustained cadence.
11. 32nd APPEND on ADR-0018 D-G; twenty-third two-letter
    APPEND letter D-AW; 30th consecutive no-new-ADR phase
    (first 30-phase no-new-ADR streak / decade-and-a-half
    milestone).
12. 60th "Continue" override invocation — tenth past half-
    century threshold; first decade-of-post-half-century-
    Continue milestone reached (Phases 55-65 = 11 phases for
    the 10 overrides past 50th).

## Plus 2 post-Phase-65 hotfix discoveries (viz-rendering)

13. **D3-force layouts in fixed viewBoxes clip content** when
    node count exceeds ~20. Discovered via DomainMap fix
    (96 nodes spreading well outside the legacy `0 0 600 420`
    viewBox). Standard fix: default `width="100%"` +
    `preserveAspectRatio="xMidYMid meet"` + auto-fit viewBox
    computed from `positioned[]` extent.
14. **SVG text labels need viewBox padding** for radii where
    `LABEL_R + max(text_width / 2) > viewBox_half`. Discovered
    via RatingRadar fix (axis labels at radius 96 inside a
    200×200 viewBox were heavily clipped). Standard fix:
    pad the viewBox outward without changing chart geometry.

## Remaining workload estimate

### Tier 1 — Framework-evolution (Phase 66+)

The Phase-65 acceptance gate
(`docs/thinking/65.4-phase-65-acceptance-gate.md`) enumerates
**10 ranked Phase-66 candidate threads**. The most-natural
cluster is autonomous-tractable plugin/regex/schema/registry
evolutions; each phase is ~3-5 units mirroring the Phase 41-65
shapes. The cluster naturally completes when all remaining
APPEND-deferral items are closed and the framework has
realizations along all 4 principal axes at depth 2+.

| Phase            | Theme                                                                                                      | Lean                                                                                                                                                                                                                                                                                                                                                      | Units |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------ | --- |
| **66 (pending)** | 404 handling for unresolved wikilinks (APPEND-D-L item 5)                                                  | Build-time validation against `content/problems/`+`papers/`+`authors/`+`institutions/` (cross-entity-aware per Phase 63) + render-time fallback. **Closure would make D-L the SECOND D-clause with ALL enumerated items closed in project history** (D-Q was first at Phase 64). Likely new helper file `lib/markdown/extensions/wikilinks-validator.ts`. | 2-3   |
| 67               | Locale-prefixed cross-entity wikilink paths                                                                | Concrete `buildHref` variant producing `/{locale}/papers/${slug}`; **third plugin-option-axis realization** (Phase 62 affordance + Phase 63 registry consumer + Phase 67 second registry consumer); new factory arm `wikilinks-cross-entity-locale`.                                                                                                      | 1-2   |
| 68               | Curator-configurable className value via plugin-option axis (`ResolveWikilinksOptions.className?: string`) | Generalizes Phase-65 hardcoded `"wikilink"` to configurable; **third plugin-option-axis realization** OR **second non-regex plugin-body realization** depending on framing. Requires XSS audit per CSS-class-injection vector.                                                                                                                            | 1-2   |
| 69               | Per-surface schema-options consumer beyond bio-restricted (`reviewNotes-extended` variant or similar)      | **Second schema-options-axis realization** — extends Phase 64 axis to 2 realizations; first 2-realization for the FOURTH principal axis.                                                                                                                                                                                                                  | 1-2   |
| 70               | Multi-className emit (entity-type-specific styling variants) — e.g., `<a class="wikilink wikilink-paper">` | **Second plugin-body output-shape realization** — extends Phase-65 sub-pattern to 2 realizations; first 2-realization for the OUTPUT-shape sub-pattern within the plugin-body axis.                                                                                                                                                                       | 1-2   |
| 71               | Empty-alias fallback unification across consumers (Phase-48 deferral)                                      | Smallest-scope; uniform `                                                                                                                                                                                                                                                                                                                                 |       | ` fallback across alias-capable consumers. | 1   |
| 72               | Bare arxiv/DOI/PubMed/ORCID/bioRxiv IDs without prefix (regex evolution; ambiguity-sensitive)              | Smaller-than-alias scope; requires disambiguation heuristic.                                                                                                                                                                                                                                                                                              | 1-2   |
| 73               | Legacy numeric-only bioRxiv IDs (pre-2019 format) — 8th plugin-regex-extension                             | Small-scope; mirrors Phase-53 arxiv legacy ID-class pattern.                                                                                                                                                                                                                                                                                              | 1-2   |

**Tier 1 subtotal**: ~8 framework-cluster phases (66-73) ×
~3-5 units ≈ **~32 units ≈ 7-8 full-day single-session
sprints** to reach a state where all current APPEND-D-L /
D-Y / D-Q / D-AC deferrals are closed AND the framework has
2+ realizations on every principal axis (schema-options + 2nd
plugin-body output-shape).

### Tier 2 — New-consumer + ADR (Phase 74+)

| Phase | Theme                                                                                                                                                                              | Units    |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 74-75 | OSF preprint consumer — 8th concrete consumer (2-3 units for first-ship + 1-2 for alias + 1 for cross-surface; Phase 50/54/58 sibling-consumer pattern)                            | 4-6      |
| 76    | **ADR-0025 concrete content-moderation provider** — closes 30+ phase no-new-ADR streak (Phase 36-65); promotes `NoopModerator` default via `MODERATION_PROVIDER` env-var dispatch. | 3-5      |
| 77+   | Schema-options 3rd realization OR plugin-only-emit 2nd plugin OR other follow-ons driven by curator demand signals                                                                 | 1-3 each |

**Tier 2 subtotal**: ~3-4 phases × ~3-6 units ≈ **~12-18
units ≈ 3-4 full-day sprints**.

### Tier 3 — Operational gates (curator-track; blocks production deploy)

Six gates pending unchanged Phase 37-65:

| Gate | Question                           | Estimated work                                                  |
| ---- | ---------------------------------- | --------------------------------------------------------------- |
| Q54  | GitHub OAuth production app        | 1-2 units (credential setup + redirect URL config)              |
| Q55  | Turso production DB (libSQL)       | 2-3 units (provision + migration apply + connection-string env) |
| Q69  | Vercel Blob production token       | 1 unit (token mint + env)                                       |
| Q73  | Google OAuth production app        | 1-2 units (mirrors Q54 for Google)                              |
| Q75  | Resend domain verification         | 1-2 units (DNS records + verification ping)                     |
| Q77  | Cron secret (`VERCEL_CRON_SECRET`) | 1 unit (secret mint + env + verify cron endpoint header)        |

**Tier 3 subtotal**: ~6 phases × ~1-3 units ≈ **~10-15 units
≈ 2-3 full-day sprints** of curator-dependent work to bring
up production deploy.

### Aggregate remaining-workload estimate

**Total framework (Tier 1) + new-consumer/ADR (Tier 2) +
operational gates (Tier 3) ≈ 54-65 units ≈ 12-16 single-
session days** to reach deployable + framework-cluster-
complete state.

Revised UP from the Phase-63-close estimate of 55 units total
(which projected only ~5 framework-cluster phases). The
revision reflects:

- Phase 64-65 each closed only ONE APPEND-deferral item;
  Phase 66+ ranks 1-5 each close at most ONE more item or
  introduce ONE more realization. Pacing is steady at ~1
  closure per phase.
- Tier 1 expanded from 5 → 8 phases as Phase-65-gate ranking
  surfaced 5 distinct autonomous-tractable threads beyond
  rank 1 (404 handling), all worth shipping as standalone
  phases at the current cadence.
- Tier 2 ADR-0025 timing remains ~Phase 75-76 (after the
  Tier 1 cluster completes).
- Tier 3 operational-gates work is unchanged in scope — it
  is curator-dependent and not part of any phase.

After Tier 1 + 2 + 3 complete, the project shifts from
framework-evolution-intensive to **content-authoring-intensive**
(more seed problems, papers, rating actions, bilingual
content). The framework's current capability ceiling (7
consumers × 4 surfaces × 3 slots + 4 principal axes; 32 D-G
APPENDs; 10 MARKDOWN_EXTENSIONS single-value arms; first
D-clause with ALL items closed at Phase 64; first 5-evolution
consumer at Phase 65; plugin-only emit pattern recognized at
Phase 65) is sufficient to support the content workload
through ~year 1 of public operation.

## Pacing observations

- **Architectural-firsts cadence**: Phases 60-65 each shipped
  10-12 architectural firsts per phase, vs Phases 50-59
  which shipped 7-9. The recent acceleration reflects the
  framework's increasing depth — each new realization
  intersects with multiple prior realizations to produce
  meta-firsts (e.g., "first state where THREE consumers have
  3+ evolutions each" at Phase 62; "first state where TWO
  consumers have 4+ evolutions" at Phase 64; "first state
  where a consumer has 5+ evolutions" at Phase 65).
- **Absolute-record streak**: Phase 61 (22-phase) → Phase 62
  (24-phase) → Phase 63 (25-phase) → Phase 64 (25-phase TIE)
  → Phase 65 (27-phase) — 5 consecutive set-or-extend phases;
  longest streak in project history.
- **No-new-ADR streak**: Phase 36-65 = 30 consecutive phases
  without a new ADR (first 30-phase milestone). ADR-0018 D-G
  APPENDs have absorbed ALL Phase-37+ framework evolutions.
- **Single-session-phases streak**: Phases 54-64 ran as 11
  consecutive single-session phases; Phase 65 had 5 parallel-
  session commits interleaved (Auth.js v5 deploy fix + 3
  README/star-history updates + 1 merge from remote `main`)
  — the new pattern is concurrent mid-session contribution
  rather than alternating-session work.
- **Test-suite growth**: 1452 (Phase 61 close) → 1486 (Phase
  63 close) → 1512 (Phase 64 close) → 1524 (Phase 65 close) →
  1528 (post-Phase-65 viz hotfix). Steady ~12-22 new tests
  per phase; no new vitest files since Phase 58 (75 files
  unchanged).

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

The Phase-65-close `SESSION_HANDOFF_2026-05-19_phase-65-close.md`
file is the paste-into-fresh-session payload. Drop it into a
new Claude Code session at `c:\opensource\OpenProblems` and
the new session will pick up Phase 66 with the rank-1
candidate (404 handling) defaulted per the Phase-65-gate
recommendation, awaiting "Continue" sign-off per §12.

Alternative entry points for the next session:

- **Rank 2 (locale-prefixed cross-entity)**: 1-2 units; small-
  scope follow-on to Phase 63; would extend plugin-option-axis
  to 3 realizations.
- **Rank 3 (curator-configurable className)**: 1-2 units;
  XSS audit required; would extend plugin-option-axis to 3
  realizations OR plugin-body output-shape sub-pattern to 2.
- **Rank 9 (OSF preprint consumer)**: 2-3 units; introduces
  8th concrete consumer; first new consumer since Phase 58
  bioRxiv (7-phase gap; first such long gap in framework
  history).
- **Rank 10 (ADR-0025 moderation provider)**: 3-5 units; not
  autonomous-tractable; would close the 30+ phase no-new-ADR
  streak.

Per §12, the user must explicitly sign off ("Continue") to
proceed past the Phase-66 boundary.
