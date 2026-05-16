# Session handoff — LLM OpenProblems, Phase 3 closed → Phase 4 gated

> Paste the **entire fenced block below** into a fresh Claude Code session
> opened at `c:\opensource\OpenProblems`. The new session will read the
> constitution + auto-memory + recent CHANGELOG and either (a) finish the
> Phase 3 sign-off follow-ons or (b) start Phase 4 once you authorize it.

```
You're picking up a multi-month project at `c:\opensource\OpenProblems`.
Phase 3 just closed (HEAD = d94f07c). Read MASTER_PROMPT.md end-to-end first —
it's the project constitution. Then read these in order:

1. The auto-memory entries (loaded automatically) — `project_llm_openproblems.md`,
   `feedback_unit_rhythm.md`, `reference_parallel_curator.md`. They cover what
   this project is, how the user wants you to work, and the parallel-curator
   workflow.
2. The last ~400 lines of `CHANGELOG.md` — every Phase-3 unit (3.0 through 3.13)
   is documented with file paths and rationale; the prior Phase 2 hygiene
   commits (2.6c, 2.6g, 2.6h, 2.6i, 2.5b, 2.6d, 2.6e) sit right above.
3. `OPEN_QUESTIONS.md` — resolved-set is Q1 / Q4 / Q5 / Q12 / Q13 / Q18 / Q27 / Q32.
   Open: Q2 / Q3 / Q6–Q11 / Q14–Q17 / Q19 / Q25 / Q26 / Q28–Q31 / Q33–Q36.
4. `git log --oneline -30` — commit history.
5. `docs/thinking/3.0-phase-3-prep.md` — Phase 3 unit breakdown (all 14 units
   done) and the 8 D-1..D-8 decisions made at kickoff plus 2 deferred to
   per-unit implementation.
6. `docs/adr/0006-saturation-na-encoding.md` — the new ADR from Unit 3.11
   that closed Q18. Establishes the v1.1 schema shape for the §8.2 N/A case.
7. `docs/thinking/2.6e-hyenadna-correction.md` — Phase-2 data-integrity fix
   shipped late in the prior session (paper 2306.15794 was misidentified as
   "Nucleotide Transformer" in Unit 2.6; arXiv 2306.15794 is actually
   HyenaDNA — corrected in commit b77aa29).

## Where we are

Phase 0 (Foundation): 13 units committed, last at `62eb8eb`.
Phase 1 (Core MVP): 13 units committed, last at `fc17e23` (Q27 close).
Phase 2 (Papers / Authors / Institutions / Leaderboards): 13 units of the
2.0 plan plus 7 hygiene follow-ons, last at `1d9d67e` (2.6i τ-bench entries).

Phase 3 (Rating Dynamics & Trending): 14 units shipped end-to-end this turn.

  3.0  Phase 3 prep                                    — d9f9317  done
  3.1  Simulated multi-action rating histories (5 prob) — 4533eb3  done
  3.2  Cross-problem rating-action loader              — 4fc0114  done
  3.3  Per-problem /problems/[slug]/ratings sub-page   — bb76017  done
  3.4  /ratings global HTML feed                       — 3053613  done
  3.5  /api/v1/ratings JSON + /api/v1/rss.xml RSS      — 669cb6a  done
  3.6  SaturationCurve viz (§11 cat 2)                 — 680c42a  done
  3.7  MoversBoard viz + /trending page (§11 cat 3)    — 58b9456  done
  3.8  RatingHistoryStream streamgraph (§11 cat 8)     — a1d42b3  done
  3.9  /problems/[slug]/history composition            — 8ccf10f  done
  3.10 Recompose weights UI on /problems               — 5d24ee8  done
  3.11 ADR-0006 + Saturation N/A schema (closes Q18)   — 31a943f  done
  3.12 Viz table-fallback toggles                      — e00d1ea  done   ★ acceptance
  3.13 Phase 3 acceptance gate                         — d94f07c  done   ★ acceptance

State at HEAD `d94f07c`:
- 20 rating actions (10 initials + 10 q3/q4 revisions on 5 of the 10 problems)
- 30 papers, 126 authors, 14 institutions, 10 problems
- **198 SSG routes** (was 178 at Phase-2 close): +10 for /problems/[slug]/ratings,
  +10 for /problems/[slug]/history. /trending and /ratings flipped from ƒ stub
  to ○ Static. /api/v1/ratings + /api/v1/rss.xml flipped from ƒ 501 stub to
  ○ Static with real payloads (20 items / 13 kB).
- First Load JS shared chunk 103 kB (unchanged across all of Phase 3).
- **171/171 vitest tests across 25 files** (was 105/16 at Phase-2 close); +13
  new tests just from Unit 3.12's fallback toggles, +19 from Unit 3.2's loader.
- `pnpm validate-content` → 203 files green.
- `pnpm audit-content` → 0 errors / 6 warnings (the same Q32-expected
  `related-problems-symmetry` set).
- `pnpm typecheck` clean; `pnpm build` succeeds at 198 routes.
- 4 visualizations live: RatingRadar (Phase 1), SaturationCurve, MoversBoard,
  RatingHistoryStream. 4 still anticipated for Phase 4+: DomainMap,
  TimelineRibbon (the full force-graph form — Phase-3-light list shipped in
  Unit 3.9), AuthorImpactSparkline, CitationFlowSankey.
- 1 new ADR (ADR-0006); methodology version still v1.0.0 across every
  committed rating-action YAML (the v1.1 bump happens organically as new
  actions use the §8.2 N/A escape hatch).

## What's gated and how to unblock

**Phase 4 cannot start** until human sign-off lands. Per §12 cardinal rule +
project memory ("Never start Phase N+1 work while Phase N's acceptance gate is
open"). The Unit-3.13 acceptance criteria are all green locally; sign-off is
the human's call. Surface and wait.

Three soft Phase-3 follow-ons that are NOT gate-blocking but are real (each
mirrors a Q27-class pattern where the CI Ubuntu cohort has to refresh on the
first PR):

- **W3C RSS validator pass against the deployed `/api/v1/rss.xml`.** Local
  well-formedness pass shipped in Unit 3.13 (20 `<item>` blocks, namespaces,
  ampersand escaping, atom:link rel=self — all verified against
  `.next/server/app/api/v1/rss.xml.body`). The deployed URL must still be
  checked at https://validator.w3.org/feed/ on the first preview deploy.

- **Lighthouse a11y ≥ 95 enumeration for the 4 new Phase-3 pages.** The
  e2e-lighthouse.yml workflow currently enforces on `/`, `/problems/[any-slug]`,
  `/domains/[any]`. Phase 3 added `/problems/[slug]/ratings`,
  `/problems/[slug]/history`, `/trending`, `/ratings`. They have all the
  required a11y plumbing (role=img, aria-label, aria-describedby + <desc>);
  the lighthouseci config just needs the URLs added. One-line change per URL.

- **Visual-regression baselines for the 4 new pages × 2 themes × N viewports.**
  Local chromium-win32 baselines have NOT been re-captured in Unit 3.13 (no
  Playwright spec changes). A follow-on PR can pass
  `playwright test --update-snapshots` against the new routes and commit
  the resulting `chromium-win32.png` files; chromium-linux files appear on
  the first CI run as Q27 documented.

There are also pre-existing Phase-2 follow-ons that survived Phase 3:

- **`entries.json` content** is partial. Unit 2.6h (SimpleQA, 3 entries on
  hallucination-reduction) and Unit 2.6i (τ-bench, 3 entries on
  long-horizon-agent-reliability) shipped. The other 8 problems still have no
  entries.json. A future curator-driven leaderboard-entry workflow or a
  Phase-5-style leaderboard-ingest tool lands the rest.

- **InstaDeep institution slug** is orphan after Unit 2.6e (HyenaDNA correction)
  — no paper references it. Re-anchored if a real Nucleotide Transformer paper
  lands as a bioRxiv-keyed YAML (would need either schema extension to accept
  non-arXiv IDs or a Phase-5 leaderboard-ingest tool).

- **ROR IDs on `meta-fair` and `microsoft-research`** are documented-exception
  omissions (Units 2.6c and 2.6d). ROR has no FAIR-specific or MSR-umbrella
  record; the parent corporate ROR IDs would be a category error. No action
  needed unless ROR's coverage changes.

## Phase 4 — what to start when authorized

Per MASTER_PROMPT §12 and §13:

  4.0   Phase 4 prep — write `docs/thinking/4.0-phase-4-prep.md` with the unit
        breakdown and surface Phase-4-blocking decisions:
          - DomainMap rendering target (SVG vs Canvas vs HTML/CSS — the
            existing vizes are all SVG; force-directed graph layout may
            warrant a different choice).
          - DB migration trigger evaluation: `gzip(.velite snapshot) < 5MB`
            today? If yes, DB migration stays deferred. Check.
          - Issue-template inventory: §13 names new-problem / new-paper /
            leaderboard-entry / rating-challenge. Confirm.
          - The `/contributing` page is a public-facing doc — confirm the
            tone and which workflow it codifies (likely the
            CURATION_PROMPT.md + PAPER_INGEST_RUNBOOK.md flow).
  4.x   `components/viz/DomainMap/` — D3 force-directed graph of
        (domain → subdomain → problem) nodes, sized by composite rating;
        brushable. (§11 catalog item 4.) This is the heaviest viz in the
        catalog — D3 introduces a client-bundle bump; the existing vizes
        are all SVG-only / no-D3.
  4.x   `/` landing-page wiring: replace the existing tile-grid hero with
        a DomainMap teaser + filter chips that link into /domains/[domain].
  4.x   `/domains` updates: replace the static tile grid with the brushable
        DomainMap.
  4.x   `.github/ISSUE_TEMPLATE/`: 4 templates (new-problem, new-paper,
        leaderboard-entry, rating-challenge). Each links to MASTER_PROMPT.md
        and the relevant THINK doc for the editorial workflow.
  4.x   `/contributing` page — replace the existing stub at
        `app/contributing/page.tsx` with the full workflow doc. The
        rendering pattern mirrors `/methodology` (MDX from `content/`).
  4.x   Conditional DB-migration evaluation. §12 says "DB migration if
        `gzip(content-snapshot) > 5MB` OR auth is needed for submissions,
        migrate structured data to Postgres/Drizzle. **Otherwise skip and
        revisit at Phase 5.**" Likely skipped at the current content size
        (~200 files); document the call.
  4.x   Phase 4 acceptance gate — DomainMap a11y ≥ 95; visual baselines for
        the new pages; issue-template smoke-test (manually open one).

DomainMap is the single big-ticket deliverable. The other Phase-4 units are
lighter — issue templates + /contributing are mostly docs + YAML.

## Working rhythm (feedback memory)

  - One unit at a time: THINK doc → implementation → smoke gates → CHANGELOG → commit.
    Don't batch.
  - Do NOT pause for sign-off, even on critical-path units. Pick the most
    defensible default and flag the tradeoff in the summary.
    **Exception:** the phase boundary (Phase 3 → Phase 4) DOES need explicit
    human sign-off per §12. Surface and wait.
  - After every commit, proceed to the next unit without asking.

## Parallel-curator workflow (project memory)

This repo runs **multiple Claude Code sessions concurrently**. Before
starting ANY unit:

  1. `git log --oneline -5` to see the latest commits.
  2. `git status --short` to see in-flight work.
  3. **Uncommitted working-tree changes belong to the parallel session.**
     Yield and pick a non-colliding scope.

During Phase 3 the parallel session shipped several hygiene units in the
same turn (2.6d ROR backfill, 2.5b author backfill, 2.6e HyenaDNA correction,
2.6i τ-bench entries). The session also did the integration glue on Unit 3.10's
ProblemsIndex during the same turn I was authoring Recompose. Trust the
parallel session's refactors per the unit-rhythm memory; check git log + git
status before claiming a unit.

For PAPER-INGEST / UPDATE / NEW-PROBLEM / WATCH curation runs, see
`docs/CURATION_PROMPT.md` (the prompt + parallel-safety contract) and
`docs/PAPER_INGEST_RUNBOOK.md` (the single-session step-by-step).

## Known wrinkles

  - **Velite 0.3.x + Zod 4 incompat (Q31)** still open. Schemas remain
    duplicated in `velite.config.ts` using Velite's bundled `s` factory.
    Unit 3.2's id-injection and Unit 3.11's nullable-saturation are both
    Velite-side additions following the same pattern. Don't break this
    contract.
  - **ADR-0005 immutability** is enforced. New rating-action YAMLs are
    ADDITIONS only; existing ones cannot be M/D/R'd in HEAD. The pre-commit
    hook will reject any attempted edit. Methodology-version handling per
    ADR-0006 is the supported path: write a new file with v1.1.0 + the
    `value: null + qualitative_band` shape.
  - **`exactOptionalPropertyTypes: true`** in tsconfig. `field?: T` cannot
    receive `undefined` — either omit the key or use `field: T | undefined`.
    Phase-3 loaders + Recompose hook all follow the "assign-only-when-defined"
    pattern.
  - **Phase-3 vizes are SVG-only, no D3.** Phase 4's DomainMap will likely
    pull D3 (or a tiny force-layout lib like d3-force) — the first
    client-bundle bump in many phases. The acceptance gate's a11y ≥ 95
    requirement applies; DomainMap will need an `<aria-describedby>` +
    `<desc>` listing every visible node so screen-reader users get the
    same coverage.
  - **`pnpm-workspace.yaml`** has esbuild + sharp + unrs-resolver allowed.
    New deps with postinstall need `pnpm approve-builds --all`.
  - **Path aliases:** `@/*` → project source; `#site/content` → Velite outputs
    (`.velite/`).
  - **Windows.** Use the Bash tool for git commands and PowerShell for `pnpm`
    + `node_modules\.bin\*.cmd`. Files on commit get LF→CRLF warnings from
    git; benign. prettier-plugin-tailwindcss reorders Tailwind classes on
    commit; ESLint may rewrite imports. Do NOT revert these — they're
    intentional.
  - **CRLF on commits.** If `git diff` shows empty but `git status --short`
    shows `M`, the change is CRLF-only and git canonicalised it on `add`.
    Re-`git add` and the commit succeeds.
  - **Pre-commit hooks:** lint-staged + ADR-0005 immutability check (blocks
    M/D/R on `content/problems/*/ratings/*.yaml`) + pnpm test. Never use
    `--no-verify`; if a hook fails, fix the underlying issue.
  - **Auto-memory has 3 entries that load automatically.** Don't re-add them.
  - **lint-staged auto-staging quirk** — on Windows the lint-staged + prettier
    pre-commit hook can pull a tree-modified file into the commit when its
    extension matches the prettier glob. Watch for unintended files in
    `git diff --cached --stat` before committing; explicitly `git restore
    --staged <file>` to remove. Happened twice during Phase 3 with the
    parallel session's HyenaDNA work in flight.

## Resolved open questions (don't re-ask)

  Q1   Brand                  = LLM OpenProblems
  Q4   License                = Apache-2.0 (code) + CC-BY-4.0 (content)
  Q5   Accent                 = deep cyan, HKU green register, OKLCH hue 170°
  Q12  Package manager        = pnpm
  Q13  Master prompt filename = MASTER_PROMPT.md
  Q18  Saturation N/A         = ADR-0006 (nullable value + optional band + refine)
  Q27  e2e + Lighthouse       = required CI gate from Phase 1 (closed Unit 1.12)
  Q32  related_problems       = symmetry is warning-class, not error-class

## Newly surfaced (Phase-3) open questions

  Q33  RSS managingEditor — defer until Q2 (DNS) resolves
  Q34  Watchlist signal in revisions — RESOLVED implicitly by Unit 3.1's
       mech-interp q4 flip (visible on MoversBoard)
  Q35  Recompose UI localStorage persistence — lean: defer to Phase 4
  Q36  Recompose UI cross-page scope — lean: /problems only for Phase 3

## First action

Run these three commands first to verify the resume state:

  git log --oneline -8
  git status --short
  pnpm audit-content

If the audit reports 0 errors / 6 warnings and HEAD is `d94f07c`, you're at
the Phase-3-closed snapshot. Either:

  (a) Ask the user whether Phase 3 sign-off is granted. If yes, write
      `docs/thinking/4.0-phase-4-prep.md` with the Phase 4 unit breakdown,
      then start Unit 4.0 (Phase 4 prep — a docs-only unit that resolves
      Phase-4-blocking open questions and lists the units 4.x).

  (b) If sign-off isn't granted, pick a non-blocking follow-on:
        - Add the 4 Phase-3 pages to lighthouseci config (one-line per URL).
        - Write Playwright specs for /problems/[slug]/ratings and
          /problems/[slug]/history and /trending and /ratings, then capture
          chromium-win32 baselines.
        - Continue the entries.json content pass on a second problem
          (compute-optimal-test-time-reasoning is the next-most-populated
          after hallucination-reduction and long-horizon-agent-reliability).

  (c) If the user just says "Continue", start Unit 4.0 — but flag that
      §12's cardinal rule says Phase 4 needs sign-off and you're proceeding
      under their "Continue" override (the unit-rhythm memory permits this).

Then continue unit-by-unit per the rhythm.
```
