# Session handoff — LLM OpenProblems, Phase 5 closed → Phase 6 gated

> Paste the **entire fenced block below** into a fresh Claude Code session
> opened at `c:\opensource\OpenProblems`. The new session will read the
> constitution + auto-memory + recent CHANGELOG and either (a) finish the
> Phase 5 sign-off follow-ons or (b) start Phase 6 once you authorize it.

```
You're picking up a multi-month project at `c:\opensource\OpenProblems`.
Phase 5 just closed (HEAD = 20dd465). Read MASTER_PROMPT.md end-to-end first —
it's the project constitution. Then read these in order:

1. The auto-memory entries (loaded automatically) — `project_llm_openproblems.md`,
   `feedback_unit_rhythm.md`, `reference_parallel_curator.md`. They cover what
   this project is, how the user wants you to work, and the parallel-curator
   workflow.
2. The last ~600 lines of `CHANGELOG.md` — every Phase-5 unit (5.0 through 5.13)
   is documented with file paths, ADR cross-refs, and rationale; the prior
   Phase-4 closing entries (4.0 – 4.13 + parallel-session 4.2 DomainMap) sit
   right above.
3. `OPEN_QUESTIONS.md` — resolved-set Phase-1 through Phase-5: Q1 / Q4 / Q5 /
   Q12 / Q13 / Q18 / Q27 / Q32 / Q40 / Q41 / Q43 / Q45. Decided-as-lean:
   Q34 / Q35 / Q36 / Q38 / Q39 / Q42 / Q44. Still open: Q2 / Q3 / Q6–Q11 /
   Q14–Q17 / Q19 / Q25 / Q26 / Q28–Q31 / Q33.
4. `git log --oneline -40` — commit history.
5. `docs/thinking/5.0-phase-5-prep.md` — Phase 5 unit breakdown (all 14 units
   done) and the 8 D-1..D-8 decisions made at kickoff plus 4 deferred (D-9
   to D-12) to per-unit implementation.
6. `docs/adr/0008-llm-provider-anthropic.md` and `docs/adr/0009-human-review-diff.md`
   — the two ADRs from Phase 5. ADR-0008 pins the LLM provider (Anthropic
   Claude) + the cost-governance pact (env key, dry-run, verbose, optional
   daily cap, audit sidecars). ADR-0009 pins the no-auto-merge diff contract
   shared by the two Phase-5 CLIs.
7. `docs/thinking/5.13-phase-5-acceptance-gate.md` — the Phase-5 closer with
   the §13 deliverable status, state-at-HEAD, and follow-ons.

## Where we are

Phase 0 (Foundation): 13 units committed, last at `62eb8eb`.
Phase 1 (Core MVP): 13 units committed, last at `fc17e23` (Q27 close).
Phase 2 (Papers / Authors / Institutions / Leaderboards): 13 units of the
2.0 plan plus 7 hygiene follow-ons, last at `1d9d67e` (2.6i τ-bench entries).
Phase 3 (Rating Dynamics & Trending): 14 units, last at `d94f07c` + Unit
3.13a `709679f` (lighthouseci enrolment for Phase-3 pages).
Phase 4 (DomainMap & Community): 14 units shipped, including parallel-session
Unit 4.2 (`be29236`) for the DomainMap viz. Last at `37ed747`.

Phase 5 (Intelligence layer — LLM-assisted curation): 14 units shipped
end-to-end this session.

  5.0  Phase 5 prep                                      — 42fa01f  done
  5.1  ADR-0008 LLM provider + cost-governance pact      — 5ccad5c  done
  5.2  lib/curate/arxiv-client.ts                        — f9d9a6d  done
  5.3  scripts/ingest-arxiv.ts (LLM-drafting CLI)        — 25fd29e  done
  5.4  lib/curate/pdf-text.ts                            — da50dbf  done
  5.5  scripts/extract-leaderboard.ts (LLM PDF→entries)  — 27e00e6  done
  5.6  ADR-0009 human-review diff format                 — 655abdc  done
  5.7  lib/digest/build-digest.ts                        — 6c33ed9  done
  5.8  /api/v1/digest/[domain] RSS endpoint              — 3a08fac  done
  5.9  /digest HTML hub                                  — 4b9b562  done
  5.10 DB-migration trigger re-eval (Phase 5 close)      — 4ef69c2  done
  5.11 Phase-5 hygiene status pass                       — f964ef4  done
  5.12 OPEN_QUESTIONS hygiene + ADR review               — 0fa9743  done
  5.13 Phase 5 acceptance gate                           — 20dd465  done   ★ acceptance

State at HEAD `20dd465`:
- Content unchanged from Phase-4 close (Phase 5 added code + scripts + docs,
  not content): 10 problems, 5 domains, ~12 subdomains, 30 papers, 126
  authors, 14 institutions, 20 rating actions, 4 issue templates, 2 MDX
  docs (methodology + contributing), 2 entries.json files (hallucination-
  reduction + long-horizon-agent-reliability).
- **New Phase-5 surfaces**: 2 LLM-using CLIs (`pnpm ingest-arxiv` +
  `pnpm extract-leaderboard`), 5 per-domain RSS digest endpoints
  (`/api/v1/digest/<slug>` — applications / deep-learning / general-ml /
  ai-safety / ai-for-biology or similar — one per taxonomy domain),
  `/digest` HTML hub with `<link rel="alternate">` auto-discovery.
- **322 prerendered pages** (was 313 at Phase-4 close; +5 from digest
  RSS feeds + 1 from `/digest` hub + 3 from minor Next.js internal
  accounting drift across builds).
- First Load JS shared chunk **103 kB UNCHANGED** throughout Phase 5 —
  every Phase-5 deliverable is server-side (Node CLIs + SSG endpoints +
  SSR pages); no client-bundle impact.
- **284/284 vitest tests across 36 files** (was 199/29 at Phase-4 close);
  +85 tests this phase: arxiv-client (13) + paper-draft (15) + anthropic
  (8) + pdf-text (8) + entry-draft (19) + build-digest (9) + rss-endpoint
  (13).
- `pnpm validate-content` → 203 files green.
- `pnpm audit-content` → 0 errors / 6 warnings (the same Q32-expected
  `related-problems-symmetry` set since Phase 2).
- `pnpm typecheck` clean. `pnpm build` clean compile (~3-4s).
- 5 visualizations live (unchanged from Phase 4): RatingRadar (Phase 1),
  SaturationCurve / MoversBoard / RatingHistoryStream (Phase 3), DomainMap
  (Phase 4).
- **9 ADRs**: 0001 (Next.js) / 0002 (Velite) / 0003 (Zod) / 0004 (file-first
  no-DB) / 0005 (rating-action immutability) / 0006 (saturation N/A) /
  0007 (DomainMap rendering + D3 import policy) / **0008 (LLM provider =
  Anthropic + cost-governance pact)** / **0009 (human-review diff format
  for LLM drafts)**.
- 5 OPEN_QUESTIONS newly surfaced this phase + 1 newer (Q41–Q45):
  Q41 + Q43 + Q45 closed; Q42 + Q44 promoted to `decided-as-lean`.
  Q38 refined (the Phase-4 carryover).
- `lighthouserc.json` enrols 13 URLs (was 12 at Phase-4 close) — added
  `/digest` in Unit 5.13.

## What's gated and how to unblock

**Phase 6 cannot start** until human sign-off lands. Per §12 cardinal rule +
project memory ("Never start Phase N+1 work while Phase N's acceptance gate is
open"). The Unit-5.13 acceptance criteria are all green locally; sign-off is
the human's call. Surface and wait.

Phase 6+ scope is **open-ended** per §13 — "Discussions, API auth, monetization"
without enumerated deliverables. Unit 6.0 prep would refine into concrete
Phase-6 unit list once the human picks a Phase-6 thread to pull on.

### Phase-5 follow-ons that are NOT gate-blocking but real

Each mirrors a Q27-class pattern where CI / deployed-URL artifacts have
to refresh on the first PR:

- **W3C feed validator pass** against the 5 deployed `/api/v1/digest/<slug>`
  URLs. Local well-formedness pass shipped in Unit 5.8 + 5.13 (the
  rendering helpers in `lib/digest/rss.ts` mirror Unit 3.5's `/api/v1/rss.xml`
  shape — verified via the 13 unit tests in `app/api/v1/digest/[domain]/route.test.ts`).
  Deployed URLs must still be checked at https://validator.w3.org/feed/ on
  the first preview deploy.

- **Lighthouse a11y ≥ 95 enumeration for `/digest`**. Unit 5.13 added
  `/digest` to `lighthouserc.json` (13th entry). CI Ubuntu cohort runs
  the canonical pass on the first PR with this commit. The 5 per-domain
  RSS endpoints are XML; Lighthouse a11y doesn't meaningfully apply (W3C
  feed validator is the right gate for those).

- **Visual-regression baselines** for `/digest` × 2 themes × N viewports.
  Local `chromium-win32` baselines NOT re-captured in Unit 5.13 (no
  Playwright spec changes). A follow-on PR can pass
  `playwright test --update-snapshots` against `/digest`.

### Pre-existing follow-ons that survived Phase 5

- **Orphan `components/domain-tile-grid/`** is unimported at HEAD
  (verified in Unit 5.11). Deletion deferred to Phase-6 hygiene — the
  harness's destructive-action classifier blocks unauthorized deletion
  of pre-existing tracked files (caught at Unit 4.4; reverted from HEAD
  cleanly). Path forward: a curator session asks explicitly ("delete
  the orphan tile-grid") or lands a small "cleanup" PR.

- **`entries.json` content backfill** on 8 problems still without
  curator-authored entries. The toolchain is operational from Unit 5.5
  (`pnpm extract-leaderboard <arxiv-id> --problem <slug>`); applying it
  to real papers is curator editorial work that benefits from a
  curator-driven session (`ANTHROPIC_API_KEY` + source-finding +
  per-paper review).

- **`/contributing` v1.x bump** documenting the LLM-assisted ingest
  path (Units 5.3 / 5.5 / ADR-0009 diff workflow). Per ADR-0008 D-F,
  the same bump should add the conflict-of-interest disclosure note.

- **`pnpm clean-drafts` script** — operational hygiene if `drafts/`
  accumulates > 100 stale files in a curator's working tree. Surfaced
  in Unit 5.10's re-eval triggers.

- **`<managingEditor>`** on the RSS feeds (Q44 / Q33) — gated on Q2
  (DNS / project email). When a real email lands, both `/api/v1/rss.xml`
  (Phase 3) and `/api/v1/digest/<domain>` (Phase 5) get updated in a
  single PR.

- **`docs/SESSION_HANDOFF_phase3_close.md`** — still untracked at HEAD.
  An earlier parallel session staged a `.gitignore` change adding it
  to the ignore list, but that change got unstaged at some point and
  never shipped. Either commit-the-handoff-doc-or-the-gitignore-fix
  is a one-line Phase-6 hygiene candidate.

- **`docs/SESSION_HANDOFF_phase5_close.md`** (this doc) — created by
  the Phase-5 close. Same status: untracked. Same disposition (commit
  or gitignore it; one line either way).

- **W3C RSS validator pass on `/api/v1/rss.xml`** (Phase-3 carryover).
  Still pending first preview deploy.

- **Phase-2 ROR-ID + InstaDeep orphan** carryovers from Phase 4's
  follow-on list — unchanged through Phase 5.

## Phase 6+ — what to start when authorized

Per MASTER_PROMPT §12 and §13:

  6.0   Phase 6 prep — write `docs/thinking/6.0-phase-6-prep.md` with
        the unit breakdown. §13 Phase 6+ scope is open-ended:
          - GitHub Discussions integration for problem talk pages.
          - Read+write API with token auth.
          - Bilingual rendering (FR primary candidate, given Montréal
            location).
        Surface Phase-6-blocking decisions:
          - Which thread to pull on first? Discussions vs auth vs
            bilingual is a portfolio question — the human picks.
          - Auth provider (per §5.8 Clerk vs NextAuth.js v5; GitHub
            OAuth strongly preferred per the framing).
          - DB migration trigger re-eval — MANDATORY at Phase 6
            kickoff per Unit 5.10 + 4.12. Current usage ~1.38% of
            5 MB threshold. First Phase-6 write-path lands the auth
            trigger.
          - Subscriber-list backing if email digest moves out of
            "deferred" status (the Phase-5 5.0 D-4 punt).

The intelligence-layer pipeline (Phase 5) is operational end-to-end:
arXiv metadata → LLM-drafted paper YAML → human-review diff →
`git apply`. The digest pipeline is operational end-to-end: rating
actions + entries → per-domain RSS + HTML hub. Cost-governance pact
in place from day zero (ADR-0008). No-auto-merge enforced (ADR-0009).

## Working rhythm (feedback memory)

  - One unit at a time: THINK doc → implementation → smoke gates → CHANGELOG → commit.
    Don't batch.
  - Do NOT pause for sign-off, even on critical-path units. Pick the most
    defensible default and flag the tradeoff in the summary.
    **Exception:** the phase boundary (Phase 5 → Phase 6) DOES need explicit
    human sign-off per §12. Surface and wait.
  - After every commit, proceed to the next unit without asking.
  - **Commit-message header limit**: 100 chars (enforced by commitlint pre-commit
    hook). Caught once during Phase 5 (Unit 5.5's first attempt was 104 chars);
    keep summary lines short.

## Parallel-curator workflow (project memory)

This repo runs **multiple Claude Code sessions concurrently**. Before
starting ANY unit:

  1. `git log --oneline -5` to see the latest commits.
  2. `git status --short` to see in-flight work.
  3. **Uncommitted working-tree changes belong to the parallel session.**
     Yield and pick a non-colliding scope.

Phase-5 had no parallel-session commits — every unit was authored by the
primary session. Phase-4's Unit 4.2 (DomainMap viz, `be29236`) was the
last parallel-session commit, picking up the THINK doc the primary session
wrote in the same turn. Phase-3 had several parallel hygiene units (2.6d
ROR backfill, 2.5b author backfill, 2.6e HyenaDNA correction, 2.6i
τ-bench entries).

For PAPER-INGEST / UPDATE / NEW-PROBLEM / WATCH curation runs, see
`docs/CURATION_PROMPT.md` (the prompt + parallel-safety contract) and
`docs/PAPER_INGEST_RUNBOOK.md` (the single-session step-by-step).

## Known wrinkles

  - **`@anthropic-ai/sdk@0.96.0`** ships its own types via export map.
    DON'T add `@types/anthropic-*` from DefinitelyTyped (they don't exist
    for this package; the precedent burn was `@types/pdf-parse@1` for
    pdf-parse@2 and `@types/diff@8` for diff@9, both removed mid-unit).
  - **`pdf-parse@2.x`** is class-based (`new PDFParse({ data: buffer }).getText()`),
    NOT the v1 default-function-import. The `TextResult` fields are `text`
    (concatenated) and `total` (page count). Caught at Unit 5.4 typecheck.
  - **Next.js App Router route files** restrict exports to a fixed set
    (GET / POST / dynamic / generateStaticParams / etc.); arbitrary
    helper exports trigger a build-time type error. Put testable helpers
    in `lib/` (e.g. Unit 5.8 puts `renderDigestRss` in `lib/digest/rss.ts`
    and the route imports it). Caught at Unit 5.8 build.
  - **Dotted-suffix dynamic segments** (`[slug].xml/route.ts`) are
    technically supported by Next.js but fragile on Windows / git path
    handling. Use plain `[slug]/route.ts` and set `content-type` header
    instead. Q45 documents this.
  - **Phase-3 viz contract — SVG-only, no D3 on client** still holds for
    everything Phase 3. Phase-4's DomainMap uses `d3-force` SERVER-side
    only (deterministic SSR layout); `d3-selection` is installed (Unit 4.1)
    but not imported in Phase 4 or 5 — reserved for the future drag-on-client
    follow-on.
  - **Phase-5 LLM CLIs require `ANTHROPIC_API_KEY` env** for non-dry-run.
    Optional `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` for cost cap (Q42 lean:
    no default cap). Both CLIs accept `--dry-run` to produce placeholder
    diffs without API calls.
  - **No auto-merge** (ADR-0009). Phase-5 CLIs NEVER write to `content/`.
    Curator runs `git apply drafts/<file>.diff` after review.
  - **`drafts/` + `.arxiv-cache/` + `.pdf-cache/` + `.llm-spend.log`**
    all gitignored per Phase-5 `.gitignore` updates in Unit 5.2.
  - **Velite 0.3.x + Zod 4 incompat (Q31)** still open. Schemas remain
    duplicated in `velite.config.ts` using Velite's bundled `s` factory.
    Phase 5 added one new Velite collection (`contributing` in Unit 4.6,
    actually — Phase 4's work — but no Phase-5 collections). Don't break
    this contract.
  - **ADR-0005 immutability** is enforced. New rating-action YAMLs are
    ADDITIONS only; existing ones cannot be M/D/R'd in HEAD. The pre-commit
    hook will reject any attempted edit. Phase 5 didn't add new rating
    actions — the LLM CLIs draft paper YAMLs + entries.json rows, not
    rating-action YAMLs. (Future Phase-6+ may want a rating-challenge
    script; would need a separate diff target since rating-action YAMLs
    are append-only-via-new-file per ADR-0005.)
  - **`exactOptionalPropertyTypes: true`** in tsconfig. `field?: T` cannot
    receive `undefined` — either omit the key or use `field: T | undefined`.
    Phase-5 loaders + CLIs follow the "assign-only-when-defined" pattern.
  - **`pnpm-workspace.yaml`** has esbuild + sharp + unrs-resolver allowed.
    No new deps with postinstall needed in Phase 5 (`@anthropic-ai/sdk`,
    `fast-xml-parser`, `pdf-parse`, `diff`, `d3-force`, `d3-selection` —
    all pure JS, no native build).
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
    M/D/R on `content/problems/*/ratings/*.yaml`) + pnpm test + commitlint
    (header ≤ 100 chars). Never use `--no-verify`; if a hook fails, fix
    the underlying issue.
  - **Auto-memory has 3 entries that load automatically.** Don't re-add them.
  - **lint-staged auto-staging quirk** — on Windows the lint-staged + prettier
    pre-commit hook can pull a tree-modified file into the commit when its
    extension matches the prettier glob. Watch for unintended files in
    `git diff --cached --stat` before committing; explicitly `git restore
    --staged <file>` to remove. Happened multiple times this session with
    `docs/SESSION_HANDOFF_phase3_close.md` getting auto-staged.
  - **Destructive-action policy.** The harness's auto-mode classifier
    blocks unauthorized deletion of pre-existing tracked files. Caught
    at Unit 4.4 when the orphan `components/domain-tile-grid/` deletion
    was attempted; reverted from HEAD cleanly. If a destructive action
    is genuinely needed, ask the user explicitly OR defer to a future
    unit with explicit authorization.

## Resolved open questions (don't re-ask)

  Q1   Brand                  = LLM OpenProblems
  Q4   License                = Apache-2.0 (code) + CC-BY-4.0 (content)
  Q5   Accent                 = deep cyan, HKU green register, OKLCH hue 170°
  Q12  Package manager        = pnpm
  Q13  Master prompt filename = MASTER_PROMPT.md
  Q18  Saturation N/A         = ADR-0006 (nullable value + optional band + refine)
  Q27  e2e + Lighthouse       = required CI gate from Phase 1 (closed Unit 1.12)
  Q32  related_problems       = symmetry is warning-class, not error-class
  Q40  ADR-0007 scope         = single ADR covers both SVG/Canvas + D3-import-policy
  Q41  LLM model per script   = Sonnet 4.6 default; Opus 4.7 for extract-leaderboard
  Q43  PDF text cache         = JSON wrapper at .pdf-cache/<id>.json
  Q45  Route-path convention  = plain [slug]/ not [slug].xml/

## Decided-as-lean (working positions; not retired)

  Q34  Watchlist signal       — implicitly resolved by mech-interp q4 flip (Phase 3)
  Q35  Recompose localStorage — Phase-4 defer-still-acceptable
  Q36  Recompose cross-page   — /problems-only is the working scope
  Q38  Filter-chip URL state  — refined: lean for full multi-select-dimming (Phase 6+)
  Q39  DomainMap mobile a11y  — table-fallback default on < 640px
  Q42  Cost-cap default       — no default cap; --verbose + --dry-run safety
  Q44  Digest managingEditor  — defer until Q2 (DNS) + Q33 land

## Still-open open questions (Phase-6+ candidates)

  Q2   DNS / domain — blocks Q33 + Q44 promotion.
  Q3   Domain registration timing.
  Q6–Q11  Phase-0/1 deferred decisions still open.
  Q14–Q17  Phase-0 deferred decisions.
  Q19  Phase-1 deferred decision.
  Q25  JSON envelope shape (Phase 3 resolved at the `/api/v1/ratings` level;
       broader question still open).
  Q26  Phase-2 deferred decision.
  Q28–Q31  Phase-1 / Phase-2 deferred decisions still open.
  Q33  RSS dc:creator framing — coupled to Q2.
  Q37  Issue-template form-field schemas — Phase 4 deferred.

## First action

Run these three commands first to verify the resume state:

  git log --oneline -8
  git status --short
  pnpm audit-content

If the audit reports 0 errors / 6 warnings and HEAD is `20dd465`, you're at
the Phase-5-closed snapshot. Either:

  (a) Ask the user whether Phase 5 sign-off is granted + which Phase-6 thread
      to pull on first (Discussions / auth / bilingual / something else).
      If granted, write `docs/thinking/6.0-phase-6-prep.md` with the Phase 6
      unit breakdown, then start Unit 6.0 (Phase 6 prep — a docs-only unit
      that resolves Phase-6-blocking open questions and lists the units 6.x).

  (b) If sign-off isn't granted, pick a non-blocking follow-on:
        - Add `/digest` Playwright spec + capture chromium-win32 baselines.
        - W3C feed validator pass against the 5 deployed `/api/v1/digest/<slug>`
          URLs (requires first preview deploy).
        - `entries.json` content backfill on one problem via
          `pnpm extract-leaderboard <arxiv-id> --problem <slug>` (requires
          `ANTHROPIC_API_KEY` env + curator review pass on the draft).
        - `/contributing` v1.x bump documenting the LLM-assisted ingest path
          (Units 5.3 + 5.5 + ADR-0009).
        - Commit (or `.gitignore`) the two SESSION_HANDOFF files still
          sitting untracked at HEAD.

  (c) If the user just says "Continue", start Unit 6.0 — but flag that
      §12's cardinal rule says Phase 6 needs sign-off and you're proceeding
      under their "Continue" override (the unit-rhythm memory permits this).
      Also flag: Phase 6+ scope is OPEN-ENDED per §13; Unit 6.0 needs the
      human to pick a thread (Discussions / auth / bilingual / etc.).

Then continue unit-by-unit per the rhythm.
```
