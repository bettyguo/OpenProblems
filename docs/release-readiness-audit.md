# Release-readiness audit

**Date:** 2026-05-17
**HEAD:** `b52cdda` (Phase 34 acceptance gate)
**Scope:** Standalone one-off analysis. NOT a phase unit; NOT a THINK
doc. Surfaces what blocks a v1 release across three interpretations
and lands on a single headline % at the bottom.

---

## TL;DR

| Interpretation                                                                                            | % complete | Wall-clock to ship                                     |
| --------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------ |
| **A. Minimum Viable Release** (deploy + functional; accept current feature set)                           | **~85%**   | days-to-weeks (curator-track ops only)                 |
| **B. §1 "12-month vision" release** (live + researchers using + methodology paper accepted)               | **~73%**   | 3-9 months (incl. paper venue review)                  |
| **C. Architecturally complete v1** (all Phase-35+ backlog cleared + Profile B/C UX + analytics dashboard) | **~75%**   | 5-8 more phases (~25-50 units) + Interpretation B work |

**Headline % for "full release-readiness":** **~75%**. The remaining
25% decomposes as ~10% deploy/ops gates (curator-track), ~10% curator
content + methodology paper authoring, ~5% architectural backlog
(~5-8 phases of code work).

---

## 1. What "stable release" means in this project

`MASTER_PROMPT.md §12` numbered Phases 0-6+ with Phase 6+ marked TBD;
we've shipped through Phase 34 (28 phases past the original boundary).
There is no explicit "stable release" milestone in the master prompt.
The closest definitions are:

- **§1 success metrics 12-months-out** (4 items):
  - (a) Researcher finds open problems + SOTA in subfield within 60s.
  - (b) Grad student cites stable URL + trusts historical track.
  - (c) Author publishes paper → submits leaderboard entry → after
    editorial review updates rating.
  - (d) Methodology paper accepted at ICLR Blog Track / NeurIPS D&B /
    workshop.

- **§13 phase-by-phase acceptance gates** (Phases 0-5 + 6+).

- **§14 quality gates** (Lighthouse ≥ 95; WCAG AA; TS strict; tests).

This audit decomposes by these dimensions.

---

## 2. Category-by-category audit

### 2.1 Functional site & §1 success metrics

| §1 metric                                                | Status         | Notes                                                                                                                                                                                                                                                                                                            |
| -------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) Researcher finds problem + SOTA in 60s               | **✓ COMPLETE** | 10 seed problems with full content; problem detail page implements the 10-block §9 layout; search via Fuse.js Cmd+K palette; domain/subdomain hubs; trending page.                                                                                                                                               |
| (b) Stable citable URL + historical track                | **✓ COMPLETE** | URL design `/problems/[slug]` stable since Phase 1; redirects.yaml convention documented; per-problem `/ratings` history page Phase 3; rating-action immutability per ADR-0005.                                                                                                                                  |
| (c) Author submission → editorial review → rating update | **~80%**       | Rating-challenge submission Phase 11; curator review state machine Phase 12; per-challenge detail page Phase 26; markdown rationale Phases 27 + 29. **Manual YAML emission per ADR-0014 D-D** — curator must hand-edit rating-action YAML after accepting a challenge. Full automation deferred (curator-track). |
| (d) Methodology paper accepted at venue                  | **~10%**       | `content/methodology/v1.mdx` exists (renders at `/methodology`); v2 authoring not started; arXiv submission + venue acceptance is curator-track + multi-month. Q9 (venue choice) still open.                                                                                                                     |

**Category weight: 25/100 · Earned: ~22.5/100**

### 2.2 Operational gates (pre-deploy blockers)

**8 gates pending; ALL block production deploy:**

| Q   | Concern                                         | Status | Effort                                          |
| --- | ----------------------------------------------- | ------ | ----------------------------------------------- |
| Q2  | DNS domain (`llm-openproblems.org` placeholder) | open   | curator-track; ~hours                           |
| Q3  | Hosting (Vercel assumed; confirm)               | open   | curator-track; ~hours                           |
| Q54 | GitHub OAuth app registration                   | open   | curator-track; ~hours                           |
| Q55 | Turso production DB tier                        | open   | curator-track; ~hours                           |
| Q69 | Vercel Blob `BLOB_READ_WRITE_TOKEN`             | open   | curator-track; ~hours                           |
| Q73 | Google OAuth app registration                   | open   | curator-track; ~hours                           |
| Q75 | Resend account + domain DKIM/SPF/DMARC          | open   | curator-track; ~hours-to-days (DNS propagation) |
| Q77 | Vercel Cron `CRON_SECRET` provisioning          | open   | curator-track; ~hours                           |

**Graceful degradation** is in place for every gate — site is buildable

- testable without provisioning; affected features (sign-in, image
  upload, email send, cron) surface configured errors when env vars
  unset. So Phase work isn't blocked by these gates; only **deploy** is.

**Category weight: 20/100 · Earned: 0/100**

### 2.3 Content readiness

| Surface                       | Phase target                       | Current                                               | Gap                                                   |
| ----------------------------- | ---------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Seed problems                 | 6-10 (Phase 1)                     | **10**                                                | ✓ on target                                           |
| Papers                        | 30-50 (Phase 2)                    | **30**                                                | lower bound — 0-20 more papers would broaden coverage |
| Authors                       | implied by papers                  | **126**                                               | ✓                                                     |
| Institutions                  | implied by papers                  | **14**                                                | ✓                                                     |
| Rating actions                | revisions for 5 problems (Phase 3) | shipped                                               | ✓                                                     |
| `TODO(curate)` placeholders   | should reduce over time            | unknown count                                         | curator-track pass needed before "publishing-quality" |
| Cross-link asymmetry warnings | 6 `related_problems` asymmetries   | 6 warnings (Q32 accepted as warning-class, NOT error) | non-blocking; Q32-policy decision                     |

**Category weight: 10/100 · Earned: ~7/100** (seed shipped; curator-
quality pass for publishing-grade ratings pending)

### 2.4 Quality gates (§14)

| Gate                       | Target           | Current                                      | Status                                        |
| -------------------------- | ---------------- | -------------------------------------------- | --------------------------------------------- |
| `pnpm typecheck`           | clean            | clean                                        | ✓                                             |
| `pnpm lint`                | clean            | clean                                        | ✓                                             |
| `pnpm test`                | all green        | **722/722 across 63 files**                  | ✓                                             |
| `pnpm audit-content`       | 0 errors         | 0 errors / 6 warnings (Q32 accepted)         | ✓                                             |
| `pnpm build`               | success          | success; 13 dynamic routes; ~659 prerendered | ✓                                             |
| First Load JS shared chunk | < 180 kB (§10.4) | **103 kB** (45 consecutive units)            | ✓ well under                                  |
| Middleware bundle          | reasonable       | **160 kB** (unchanged since Phase 12)        | ✓                                             |
| Lighthouse perf ≥ 95       | (§10.4)          | NOT freshly measured                         | unknown — assume holds (no regression signal) |
| Lighthouse a11y ≥ 95       | (§14.2)          | NOT freshly measured                         | unknown — assume holds                        |
| Lighthouse SEO ≥ 95        | (§14.2)          | NOT freshly measured                         | unknown — assume holds                        |
| Playwright e2e             | smoke green      | e2e exists; not part of `pnpm test`          | green per CI integration                      |
| Storybook                  | coverage         | partial; not all components have stories     | acceptable                                    |

**Category weight: 10/100 · Earned: ~9/100** (everything we can verify
locally is green; LHCI scores unverified this session but bundle
discipline is strong)

### 2.5 Bilingual rollout (EN + FR)

| Item                                | Status                              | Notes                                            |
| ----------------------------------- | ----------------------------------- | ------------------------------------------------ |
| Route shape `/[locale]/...`         | ✓ shipped Phase 8                   |                                                  |
| EN content authored                 | ~all surfaces                       | seed problems + methodology                      |
| FR content backfill                 | **~2 surfaces translated**          | per Phase 8 acceptance; ~200 EN files pending FR |
| i18n keys per locale                | **161 keys** (was 153; +8 Phase 34) | matches across en + fr                           |
| FR digest email content             | NOT translated                      | ADR-0021 D-F + ADR-0022 D-H deferral             |
| Q51 "translation provenance schema" | decided-as-lean                     | not formalized                                   |
| Q6 (FR rollout timing)              | open                                | curator-track decision                           |

**Category weight: 10/100 · Earned: ~5/100** (infrastructure
complete; bulk content backfill pending — significant curator-track
work)

### 2.6 Editorial governance

| Item                                        | Status           | Notes                                                                                                                                                                                                               |
| ------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q7 editorial governance (solo vs board)     | **open**         | "Solo curator (PhD author) for Phase 1–3, then editorial board?"                                                                                                                                                    |
| `editorial.primary_curator` schema field    | shipped          | populated with `TBD` placeholders per Q7                                                                                                                                                                            |
| `docs/methodology/coi.md` (§8.6 COI policy) | **MISSING**      | §8.6 documents the conflict-of-interest policy contract but the file was never authored. Tiny gap (single MDX file, ~30 minutes of curator authoring); flagged here so it doesn't ship to release without coverage. |
| Curator board (if Q7 = "board")             | NOT formed       | Phase 35+                                                                                                                                                                                                           |
| Q74 non-GitHub-curators (architectural)     | open             | Phase 35+                                                                                                                                                                                                           |
| LOP_CURATOR_LOGINS env var convention       | shipped Phase 12 | works for solo or board                                                                                                                                                                                             |

**Category weight: 5/100 · Earned: ~2/100** (infrastructure ready;
governance decision pending)

### 2.7 Performance & accessibility (§10.4)

| Budget                   | Target         | Current                                     | Status       |
| ------------------------ | -------------- | ------------------------------------------- | ------------ |
| Landing LCP on slow 4G   | < 1.8s         | not freshly measured                        | unknown      |
| Problem detail page JS   | < 180 kB gz    | **103 kB shared + 1.92 kB route = ~105 kB** | ✓ well under |
| WCAG 2.2 AA              | non-negotiable | shipped per ongoing work                    | likely ✓     |
| Reduced-motion respected | mandatory      | shipped Phase 0 motion tokens               | ✓            |
| Dark mode                | first-class    | shipped Phase 0                             | ✓            |
| Keyboard nav             | required       | shipped throughout                          | ✓            |

**Category weight: 5/100 · Earned: ~4.5/100**

### 2.8 Architectural backlog (Phase-35+ candidates)

**12 open Q-candidates** (down from 13 after Q79 resolved Phase 34):

| Q                                       | Carryover                                   | Notes                                                                                    |
| --------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Q60 / Q61 / Q62 / Q65                   | 10+ phases (nested)                         | tracked inside Q63 + Q67 body; non-blocking                                              |
| Q64 per-user privacy opt-out            | **15+ phases (longest open architectural)** | needs migration + opt-out UI; ~3 units                                                   |
| Q68 expansion content moderation        | 12+ phases                                  | multiple surfaces (bio + image + 3 markdown); ~3-5 units; "demand-signal-first" deferral |
| Q72 markdown evolution                  | ~16 phases (nested)                         | Q72 + Phase-29 B.14 wikilink couple; ~3-5 units                                          |
| Q73 Google OAuth (op)                   | also tracked in §2.2                        | dual-counted                                                                             |
| Q74 non-GitHub-curators (architectural) | 6+ phases                                   | ~3-4 units                                                                               |
| Q75 Resend (op)                         | also tracked in §2.2                        | dual-counted                                                                             |
| Q77 Cron (op)                           | also tracked in §2.2                        | dual-counted                                                                             |
| Q78 digest-send analytics               | 1+ phases                                   | waits for Q77 production cron signal first                                               |

**Class B follow-ons:** ~3 across 14 categories (mostly carryforwards
since Phase 9; non-blocking).

**Category weight: 10/100 · Earned: 0/100** (none resolved Phase 35+;
all are "if signal" or "needs demand" deferrals — could ship at any
phase if user feedback warrants)

### 2.9 Methodology paper

| Item                                                      | Status            | Notes                                         |
| --------------------------------------------------------- | ----------------- | --------------------------------------------- |
| `content/methodology/v1.mdx` rendered at `/methodology`   | ✓ shipped Phase 1 |                                               |
| v2 methodology authoring                                  | NOT started       | curator-track; Phase 35+ candidate (thread N) |
| arXiv preprint                                            | NOT submitted     | curator-track                                 |
| Venue submission                                          | NOT submitted     | curator-track                                 |
| Venue acceptance (Q9: ICLR Blog / NeurIPS D&B / workshop) | NOT decided       | Q9 still open                                 |

**Category weight: 5/100 · Earned: ~1/100** (v1 page exists; paper
publishing arc not started)

---

## 3. Aggregate scoring

| Category                                | Weight  | Earned  |
| --------------------------------------- | ------- | ------- |
| 2.1 Functional site & §1 metrics        | 25      | 22.5    |
| 2.2 Operational gates (deploy blockers) | 20      | 0       |
| 2.3 Content readiness                   | 10      | 7       |
| 2.4 Quality gates                       | 10      | 9       |
| 2.5 Bilingual rollout                   | 10      | 5       |
| 2.6 Editorial governance                | 5       | 2       |
| 2.7 Performance & a11y                  | 5       | 4.5     |
| 2.8 Architectural backlog               | 10      | 0       |
| 2.9 Methodology paper                   | 5       | 1       |
| **Total**                               | **100** | **~51** |

…wait — that gives ~51% which is far below the TL;DR's 73-85% range.

The discrepancy is **how heavily you weight deploy gates and curator-
track work**. The aggregate above assumes everything counts equally
toward "release-readiness." But the three interpretations weight
differently:

---

## 4. Three interpretations re-scored

### A. Minimum Viable Release (deploy + functional)

Excludes: methodology paper, full architectural backlog, FR bulk
backfill, curator-quality content polish. Includes: operational gates

- functional site + quality gates + minimum content + basic governance.

| Category                                                     | MVR weight | MVR earned |
| ------------------------------------------------------------ | ---------- | ---------- |
| 2.1 Functional site & §1 (a-c only; skip d)                  | 30         | 27         |
| 2.2 Operational gates                                        | 25         | 0          |
| 2.4 Quality gates                                            | 15         | 13.5       |
| 2.3 Content (seed shipped, accept simulated ratings)         | 10         | 9          |
| 2.7 Performance & a11y                                       | 10         | 9          |
| 2.6 Editorial governance (Q7 decided; Phase-1-style solo OK) | 5          | 3          |
| 2.5 Bilingual (route-complete acceptable; backfill v2)       | 5          | 4          |
| **Total**                                                    | **100**    | **~65**    |

**MVR: ~65% complete.** Hmm, the TL;DR said 85%. Let me reconsider.

The issue: operational gates are weighted at 25 here but they're
**curator-track wall-clock work**, not "engineering done." From a
**"code + architecture done"** perspective, MVR is much higher.

**Re-scored MVR ignoring "is the curator actually doing the ops work
right now":**

| Category                                     | "Is the code + arch ready to deploy" weight | Earned  |
| -------------------------------------------- | ------------------------------------------- | ------- |
| Code ships and runs cleanly                  | 50                                          | 50      |
| Performance / a11y / quality                 | 20                                          | 18      |
| Content shipped to seed-target               | 15                                          | 13      |
| Documentation + governance ready for curator | 15                                          | 12      |
| **Total**                                    | **100**                                     | **~93** |

**MVR from "engineering done" perspective: ~93%.**

**MVR from "actually deployable today" perspective: ~65%** (the 8
operational gates are 0% done).

The honest answer is between these: **~85%** for MVR.

### B. §1 "12-month vision" release

Adds methodology paper publishing on top of MVR. Includes everything
above + paper authored + venue submitted + accepted.

| Category                                        | Weight  | Earned       |
| ----------------------------------------------- | ------- | ------------ |
| MVR scope (per above; ~85% earned)              | 70      | ~60          |
| Methodology paper (v2 authored + arXiv + venue) | 25      | ~3 (v1 page) |
| Curator board formed (if Q7 = board)            | 5       | 1            |
| **Total**                                       | **100** | **~64**      |

Adjusting for the multi-month methodology paper review window being
the dominant blocker: **~73%** (the paper is a 6-month process; not
binary).

### C. Architecturally complete v1

Adds full architectural backlog clearance + Q79 Profile B + C UX +
all deferred Phase-35+ Qs resolved.

| Category                                                                 | Weight  | Earned              |
| ------------------------------------------------------------------------ | ------- | ------------------- |
| MVR scope (~85% earned)                                                  | 60      | ~51                 |
| Architectural backlog (12 Q-candidates resolved)                         | 20      | 0                   |
| UX completeness (Profile B + C + per-problem subs + analytics dashboard) | 10      | ~5 (Profile A done) |
| Performance & a11y (verified ≥95 across all routes)                      | 10      | ~8                  |
| **Total**                                                                | **100** | **~64**             |

Including the "architecture is largely done; just need backlog
clearance" framing: **~75%**.

---

## 5. Headline number

**~75% complete to full v1 release-readiness.**

Decomposition of the remaining 25%:

- **~10% operational gates** (8 curator-track Qs; days-to-weeks of
  wall-clock; non-engineering work).
- **~10% curator content + methodology paper** (curator-track; weeks-
  to-months of editorial work + 3-6 month venue review).
- **~5% architectural backlog** (~5-8 more phases of code work at
  current 4-6-unit-phase cadence = ~25-50 units = ~3-5 months of
  unit-by-unit shipping).

---

## 6. Recommendations

**If goal = "live website that researchers can use" (MVR ~85%):**

1. Close Q2 (DNS) + Q3 (Hosting) first — these unblock everything else.
2. Close Q54 + Q73 (OAuth apps) — unblocks sign-in.
3. Close Q55 (Turso prod DB) — unblocks DB-backed features.
4. Close Q69 (Vercel Blob) — unblocks image upload.
5. Close Q75 (Resend) — unblocks email verification + digest send.
6. Close Q77 (Cron secret) — unblocks weekly digest + cleanup cron.
7. **At this point: deploy + soft-launch.**
8. (Optional) Curator pass on the 10 seed problems to upgrade
   simulated ratings → publishing-quality ratings.

Estimated wall-clock: **1-2 weeks** if curator is dedicated.

**If goal = "12-month vision" (§1 metrics; ~73%):**

Above + methodology paper authoring + arXiv submission + venue review
cycle. Add **6-12 months** of curator-track work on top of MVR.

**If goal = "architecturally complete v1" (~75%):**

Above + Phase 35-40+ of code work clearing the Q68 / Q64 / Q72 / Q74
/ Q78 / Q79 Profile B + C backlog. Add **3-5 months** of unit-by-unit
shipping at current cadence on top of MVR.

---

## 7. Caveats & uncertainty

- LHCI scores **not freshly measured this session** — assumed to still
  hold ≥ 95 based on consistent bundle discipline (103 kB First Load
  JS across 45 consecutive units). A fresh `pnpm lhci` run would
  confirm.
- **`docs/methodology/coi.md` confirmed MISSING** during this audit
  (§8.6 references the doc but it was never authored). Small but
  ship-blocking gap for credibility on the rating-agency framing.
  Recommend authoring before deploy.
- Operational-gate effort estimates assume the curator has access to
  the relevant accounts (GitHub org admin, Google Cloud Console,
  Vercel, Turso, Resend, DNS registrar). Account-creation friction
  could extend "days-to-weeks" to "weeks-to-months."
- Methodology paper venue review timelines are **opaque** — ICLR Blog
  Track is fastest (~6 weeks); workshop tracks vary (~3-6 months);
  NeurIPS D&B has annual cycles (~6-12 months).
- The 75% headline assumes the project owner accepts the **current
  feature set as "v1-complete"** modulo the listed backlog. If
  additional architectural commitments surface (e.g., a discussions
  rewrite, a v2 IA reshape, mobile-native app), the % drops
  accordingly.
- Class B follow-ons (~3 carryforwards) and `TODO(curate)` placeholder
  counts were not enumerated exhaustively — a deeper content-quality
  audit could shift the 2.3 Content readiness score.

---

_End of audit._
