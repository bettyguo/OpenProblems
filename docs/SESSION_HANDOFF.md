# Session handoff — LLM OpenProblems, Phase 2 closed → Phase 3 gated

> Paste the **entire fenced block below** into a fresh Claude Code session opened at `c:\opensource\OpenProblems`. The new session will read the constitution + auto-memory + recent CHANGELOG and either (a) finish the Phase 2 sign-off follow-ons or (b) start Phase 3 once you authorize it.

```
You're picking up a multi-month project at `c:\opensource\OpenProblems`. Phase 2 just closed (HEAD = 80cf802). Read MASTER_PROMPT.md end-to-end first — it's the project constitution. Then read these in order:

1. The auto-memory entries (loaded automatically) — `project_llm_openproblems.md`, `feedback_unit_rhythm.md`, `reference_parallel_curator.md`. They cover what this project is, how the user wants you to work, and the parallel-curator workflow.
2. The last ~250 lines of `CHANGELOG.md` — every Phase 0 / 1 / 2 unit is documented with file paths and rationale.
3. `OPEN_QUESTIONS.md` — Q1, Q4, Q5, Q12, Q13, Q27 resolved; the rest are open but most aren't load-bearing.
4. `git log --oneline -30` — commit history.
5. `docs/thinking/2.0-phase-2-prep.md` — Phase 2 unit breakdown (all 13 units done) and Phase-3 anticipations.
6. `docs/thinking/2.13-phase-2-acceptance-gate.md` — what closed the §13 acceptance gate.
7. `docs/thinking/2.9-leaderboard-page.md` — last Phase-2 commit; explains why `/problems/[slug]/leaderboard` ships empty and how it activates.

## Where we are

Phase 0 (Foundation): 13 units committed, last at `62eb8eb`.
Phase 1 (Core MVP): 13 units committed, last at `fc17e23` (Q27 close).
Phase 2 (Papers / Authors / Institutions / Leaderboards): 13 units of the 2.0 plan plus one hygiene unit, last at `80cf802`.

  2.0  Phase 2 prep                                    — 4b61cba  done
  2.1  authors + institutions content                  — a2a2c67  done
  2.2  Velite collections + load helpers               — d5189ea  done
  2.3  author + institution detail pages               — c1cf7ae  done
  2.4  seed papers batch 1 (10)                        — d0c6f45  done
  2.5  seed papers batch 2 (10)                        — 29e01fb  done
  2.6  seed papers batch 3 (10) — §13 30-paper floor   — 492b90c  done
  2.6b institution backfill (hygiene)                  — 846a5c1  done
  2.7  paper detail page `/papers/[id]`                — 689db9f  done
  2.8  papers index `/papers`                          — abd6dc7  done
  2.11 cross-link audit `scripts/cross-link-audit.ts`  — bc671ec  done   ★ §13 acceptance
  2.13 Phase 2 acceptance gate (CI + visual baselines) — b60dbd4  done   ★ §13 acceptance
  2.12 aggregate rollups (cumulativeImpact)            — 8b53a9f  done
  2.9  leaderboard page (+ 2.10 scaffold)              — 80cf802  done

State at HEAD `80cf802`:
- 30 papers, 12 authors, 14 institutions, 10 problems, 10 problem leaderboards
- 178 SSG routes; bundles unchanged from Phase-1 envelope
- 86/86 Vitest tests across 15 files; 7/7 Playwright tests in ~33 s
- `pnpm validate-content` → 77 files green
- `pnpm audit-content` → 0 errors / 6 warnings (all `related-problems-symmetry`, expected per Q32)
- `pnpm build` → 178 routes; First Load JS shared chunk 103 kB
- CI gate (Unit 2.13): `audit-content` is required from this commit onward

## What's gated and how to unblock

**Phase 3 cannot start** until two things land:

  1. **Human sign-off on Phase 2.** Per §12 cardinal rule + project memory ("Never start Phase N+1 work while Phase N's acceptance gate is open"). The §13 gate criteria are met (audit green, visual baselines captured), but sign-off is the human's call. Surface and wait.

  2. **CI Ubuntu run on a push.** Local Phase-1 + Phase-2 baselines are `chromium-win32`. The CI gate (.github/workflows/e2e-lighthouse.yml is `required` from Unit 1.12) will fail visual-regression on first PR until someone:
     - pushes a branch with these baselines,
     - lets CI fail once,
     - downloads the playwright-report artifact,
     - or just runs `pnpm exec playwright test --update-snapshots` in a CI job,
     - commits the resulting `chromium-linux.png` files alongside the existing `chromium-win32.png`.

There are also three Phase-2 follow-ons that are NOT gate-blocking but are real:
- **Author backfill for Units 2.5/2.6 papers.** All 20 of those papers carry `authors: []`. Cross-link audit (Unit 2.11) currently reports 0 dangling author refs *because* the arrays are empty. A future content unit mints the missing author slugs.
- **ROR IDs on institutions.** Unit 2.6b deliberately omitted `ror_id:` on the 5 new institutions (no fabricated IDs per §15.6). A curator pulls them from `ror.org`.
- **`entries.json` content.** Unit 2.9 ships the leaderboard page empty. Per §15.6, real benchmark scores need curator-attested sources. Either a manual curator pass or a leaderboard-ingest tool (Phase-5-style) lands the content.

## Phase 3 — what to start when authorized

Per MASTER_PROMPT §12 and §13:

  3.0  Phase 3 prep — write `docs/thinking/3.0-phase-3-prep.md` with the unit breakdown
  3.x  Second + third rating actions for ≥ 5 seed problems (simulate revisions
       across past months; net-new YAML files only per ADR-0005 immutability)
  3.x  `/problems/[slug]/ratings` sub-page with full action history
  3.x  `/ratings` global feed (HTML + JSON + RSS — RSS must pass W3C feed validator)
  3.x  `SaturationCurve` viz on `/problems/[slug]/history` (catalog item 2 per §11)
  3.x  `MoversBoard` Bloomberg-style table on `/trending` (catalog item 3 per §11)
  3.x  `RatingHistoryStream` streamgraph on `/problems/[slug]/history` (catalog item 8)
  3.x  "Recompose" UI on `/problems` letting the user re-weight composite
  3.x  Phase 3 acceptance gate — all charts have table-fallback toggles;
       RSS validates; Lighthouse a11y still ≥ 95 with new charts

The "second + third rating actions" deliverable is content-heavy and the only one
that meaningfully exercises the rating-action append-only flow. It should ship
early in Phase 3 so the visualisations have multi-action histories to render
against.

## Working rhythm (feedback memory)

  - One unit at a time: THINK doc → implementation → smoke gates → CHANGELOG → commit. Don't batch.
  - Do NOT pause for sign-off, even on critical-path units. Pick the most defensible default and flag the tradeoff in the summary.
    **Exception:** the phase boundary (Phase 2 → Phase 3) DOES need explicit human sign-off per §12. Surface and wait.
  - After every commit, proceed to the next unit without asking.

## Parallel-curator workflow (project memory)

This repo runs **multiple Claude Code sessions concurrently**. Before starting
ANY unit:

  1. `git log --oneline -5` to see the latest commits.
  2. `git status --short` to see in-flight work.
  3. **Uncommitted working-tree changes belong to the parallel session.** Yield
     and pick a non-colliding scope.

If you ship a unit and find the parallel session already shipped the same one,
your diff was likely absorbed into their commit; check `git log --oneline -3`
and the latest commit's `--stat` to confirm. Trust their refactors per the
unit-rhythm memory.

For PAPER-INGEST / UPDATE / NEW-PROBLEM / WATCH curation runs, see
`docs/CURATION_PROMPT.md` (the prompt + parallel-safety contract) and
`docs/PAPER_INGEST_RUNBOOK.md` (the single-session step-by-step).

## Known wrinkles

  - **Velite 0.3.x + Zod 4 incompat (Q31):** Velite calls `schema._parse(...)`;
    Zod 4 renamed that internal. Schemas are duplicated in `velite.config.ts`
    using Velite's bundled `s` factory. `lib/schemas/*.ts` (Zod 4) remains the
    source of truth. `scripts/validate-content.ts` cross-validates. Don't break
    this contract — same pattern when adding the `entries` collection later.
  - **`exactOptionalPropertyTypes: true`** in tsconfig. `field?: T` cannot receive
    `undefined` — either omit the key or use `field: T | undefined`. Both Phase-2
    loaders (Units 2.2, 2.12) follow the "assign-only-when-defined" pattern.
  - **`pnpm-workspace.yaml`** has esbuild + sharp + unrs-resolver allowed. New
    deps with postinstall need `pnpm approve-builds --all`.
  - **Path aliases:** `@/*` → project source; `#site/content` → Velite outputs
    (`.velite/`).
  - **Windows.** Use the Bash tool for git commands and PowerShell for `pnpm` +
    `node_modules\.bin\*.cmd`. Files on commit get LF→CRLF warnings from git;
    benign. prettier-plugin-tailwindcss reorders Tailwind classes on commit;
    ESLint may rewrite imports. Do NOT revert these — they're intentional.
  - **CRLF on commits.** If `git diff` shows empty but `git status --short`
    shows `M`, the change is CRLF-only and git canonicalised it on `add`.
    Re-`git add` and the commit succeeds.
  - **Pre-commit hooks:** lint-staged + ADR-0005 immutability check (blocks
    M/D/R on `content/problems/*/ratings/*.yaml`) + pnpm test. Never use
    `--no-verify`; if a hook fails, fix the underlying issue.
  - **Auto-memory has 3 entries that load automatically.** Don't re-add them.
  - **HF MCP `paper_search` was unavailable** during Units 2.5 / 2.6 (the
    `claude.ai Hugging Face` MCP server reported `Server not found`). If it's
    still down, follow the CURATION_PROMPT rule: "MCP unavailable — passive
    review only" and proceed with prior signals from the problem.yamls /
    signals_considered fields.

## Resolved open questions (don't re-ask)

  Q1   Brand                  = LLM OpenProblems
  Q4   License                = Apache-2.0 (code) + CC-BY-4.0 (content)
  Q5   Accent                 = deep cyan, HKU green register, OKLCH hue 170°
  Q12  Package manager        = pnpm
  Q13  Master prompt filename = MASTER_PROMPT.md
  Q27  e2e + Lighthouse       = required CI gate from Phase 1 (closed in Unit 1.12)
  Q32  related_problems       = symmetry is warning-class, not error-class

## First action

Run these three commands first to verify the resume state:

  git log --oneline -8
  git status --short
  pnpm audit-content

If the audit reports 0 errors / 6 warnings and HEAD is `80cf802`, you're at
the Phase-2-closed snapshot. Either:

  (a) Ask the user whether Phase 2 sign-off is granted. If yes, write
      `docs/thinking/3.0-phase-3-prep.md` with the Phase 3 unit breakdown,
      then start Unit 3.0 (Phase 3 prep — a docs-only unit that resolves
      Phase-3-blocking open questions and lists the units 3.x).

  (b) If sign-off isn't granted, pick a non-blocking Phase-2 follow-on:
      author backfill for Units 2.5/2.6, ROR IDs for the 5 Unit-2.6b
      institutions, or a curator-driven `entries.json` content pass on a
      single problem (`hallucination-reduction` is the most-populated
      problem and would surface the cross-link audit's
      `entries-contributions-agreement` check).

  (c) If the user just says "Continue", start Unit 3.0 — but flag that
      §12's cardinal rule says Phase 3 needs sign-off and you're proceeding
      under their "Continue" override (the unit-rhythm memory permits this).

Then continue unit-by-unit per the rhythm.
```
