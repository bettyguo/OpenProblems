# Batch-generation prompt — parallel mass-authoring + deep-research updates

> A single self-contained prompt designed for **20 concurrent Claude Code sessions** to grow the dataset by an order of magnitude in one run while staying inside the project's correctness invariants. Each session is bound to a **territory** (a set of taxonomy subdomains) rather than a single slug, authors 3–8 new problems inside that territory, and / or runs deep-research UPDATE passes against existing slugs in the territory. Inherits the isolation contract from [`CURATION_PROMPT.md`](./CURATION_PROMPT.md).

---

## Why a separate prompt

`CURATION_PROMPT.md` is **per-key**: one slug or one arXiv ID per run, ideal for daily hygiene. It cannot grow the dataset fast because (a) it never authors more than one problem per run, and (b) it has no coverage-aware sharding — two sessions could independently pick the same subdomain.

This prompt is **per-territory**: one bounded set of subdomains per run, multiple new problems per run, multiple update passes per run. It is meant for **discrete burst campaigns** — open 20 sessions, let them author for 1–4 hours each, merge the branches in a serial pass, repeat next week.

The parallel-safety contract is **inherited verbatim** from `CURATION_PROMPT.md` (read it before launching this one). The additions here are: (1) territory sharding, (2) the slug-claim manifest that prevents two sessions from minting the same slug, (3) deep-research checklist that grounds every new problem in real, verified literature, and (4) batch commit cadence (one commit per new problem).

---

## Parallel-safety additions on top of CURATION_PROMPT.md

| Path                                                               | Mode that may write | Conflict-free because                                                                            |
| ------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------ |
| `docs/new-problem-claims/<RUN-ID>.md`                              | BATCH-NEW           | RUN-ID-suffixed; lists slugs this run intends to author; merger detects cross-session collisions |
| `content/problems/<NEW-SLUG>/{problem.yaml, *.mdx}`                | BATCH-NEW           | orchestrator pre-shards territories; slug-claim manifest is the second line of defence           |
| `content/problems/<NEW-SLUG>/ratings/<DATE>-initial-<RUN-ID>.yaml` | BATCH-NEW           | RUN-ID-suffixed                                                                                  |
| `content/problems/<SLUG>/ratings/<DATE>-<REASON>-<RUN-ID>.yaml`    | BATCH-DEEP-UPDATE   | RUN-ID-suffixed                                                                                  |
| `content/papers/<ARXIV-ID>.yaml`                                   | both (incidental)   | arXiv ID is globally unique; check `git ls-files content/papers/<ARXIV-ID>.yaml` before writing  |
| `content/problems/<SLUG>/.curation-log/<RUN-ID>.md`                | both                | RUN-ID-suffixed                                                                                  |
| `docs/open-questions-inbox/<RUN-ID>.md`                            | both                | RUN-ID-suffixed                                                                                  |
| `docs/changelog-inbox/<RUN-ID>.md`                                 | both                | RUN-ID-suffixed                                                                                  |

**Territory invariant.** The orchestrator MUST hand each parallel slot a disjoint `TERRITORY` (a comma-separated list of `domain/subdomain` pairs). Two sessions sharing a territory may race on a fresh `<NEW-SLUG>`. The territory list in §"20-session shard manifest" below is pre-checked disjoint.

**Slug-claim manifest.** Step 2 of the run writes `docs/new-problem-claims/<RUN-ID>.md` listing every slug the run plans to mint, **before** authoring any file under that slug. The merger reads all claim manifests at merge time and, if two RUN-IDs claim the same slug, keeps the first commit and renames the second's slug + redirects in the merge pass. In practice, with disjoint territories, collisions are rare (a handful per 20-session burst).

**Branch per run.** `curate/<MODE>-<TERRITORY-LABEL>-<RUN-ID>` where `<TERRITORY-LABEL>` is a short kebab-case label assigned by the orchestrator (e.g., `opt-cluster-a`, `theory-cluster-b`). Never push.

Everything else — `pnpm validate-content` is the only allowed tree-checking command, no writes outside the allow-list, ADR-0005 immutability enforced by the pre-commit hook, MASTER_PROMPT §15.6 "never invent leaderboard numbers / paper titles / rating scores" — is **identical** to `CURATION_PROMPT.md` and not repeated here.

---

## The prompt (paste-and-run, one slot per parallel session)

The orchestrator substitutes the six `<…>` placeholders before pasting. Paste the entire fenced block. Working directory is `c:\opensource\OpenProblems`.

````
You are a content curator and researcher for LLM OpenProblems at c:\opensource\OpenProblems. The constitution is MASTER_PROMPT.md; the methodology is content/methodology/v1.mdx (v1.0.0); the parallel-safety contract is docs/CURATION_PROMPT.md (read its "Parallel-safety contract" section before doing anything else). You operate under §15.6 — NEVER invent leaderboard numbers, paper titles, paper authors, venues, dates, or rating scores. Every cited paper title must be verified via WebSearch / WebFetch against arXiv or the venue's public listing in this session; if you cannot verify, write `[unverified]` next to it and surface to the inbox. When in doubt, write TODO(curate) and route the question to docs/open-questions-inbox/<RUN-ID>.md.

== RUN PARAMETERS ==

MODE: <MODE>                           # BATCH-NEW | BATCH-DEEP-UPDATE | BATCH-MIXED
TERRITORY: <TERRITORY>                 # comma-separated "domain/subdomain" pairs, e.g.
                                       # "optimization/convex,optimization/non-convex,optimization/stochastic,optimization/discrete-combinatorial"
TERRITORY_LABEL: <TERRITORY-LABEL>     # short kebab-case slug for branch name, e.g. "opt-cluster-a"
TARGET_NEW_COUNT: <N>                  # for BATCH-NEW or BATCH-MIXED; target across the whole campaign (8–22 typical; this session caps at 15, deferring any remainder via Step 2.5 + 6.5)
TARGET_UPDATE_SLUGS: <SLUGS>           # for BATCH-DEEP-UPDATE or BATCH-MIXED; comma-separated existing slugs to deeply re-research, "" if none
CURATOR: <CURATOR>                     # default `jikun`
RUN_ID: <RUN-ID>                       # YYYY-MM-DDTHH-MM-RAND6 (UTC, hyphens, no colons — Windows-safe)

== STEP 1 — BRANCH AND ORIENT ==

1.1. `git status --short` and `git log --oneline -8`. If the working tree is not clean, abort with one sentence to the user.
1.2. `git checkout -b curate/<MODE>-<TERRITORY-LABEL>-<RUN_ID>`. Never push, never merge.
1.3. Read, in order:
     - MASTER_PROMPT.md §3.1 (five rating dimensions), §8 (methodology), §15.6 (no-invent rule), §16 (seed exemplars).
     - docs/CURATION_PROMPT.md "Parallel-safety contract" + "Evidence formats" sections.
     - lib/schemas/{problem.ts, rating-action.ts, paper.ts, benchmark.ts, _primitives.ts}.
     - content/taxonomy.yaml — verify every "domain/subdomain" pair in <TERRITORY> resolves to an existing pair; if any does not, abort and write to docs/open-questions-inbox/<RUN_ID>.md.
     - One existing problem as a shape reference: content/problems/hallucination-reduction/ (full folder).
1.4. List existing slugs in your territory: `git ls-files content/problems/ | sed -n 's|content/problems/\([^/]*\)/problem.yaml|\1|p'`. Read each one's problem.yaml to learn its title + subdomain. You must not duplicate an existing problem; you MAY cross-link new problems to existing ones via `related_problems`.

== STEP 2 — CANDIDATE-LIST + SLUG CLAIM (BATCH-NEW / BATCH-MIXED) ==

2.1. For each subdomain in <TERRITORY>, brainstorm 2–4 candidate open problems whose authoring is feasible from public literature. Each candidate must clear the §16-quality bar:
     - Substantive open research question (not a solved engineering problem, not a tool wishlist).
     - At least one recognised benchmark family or evaluation surface exists in the literature (you will name it but you will NOT cite numerical SOTA).
     - At least one survey or position paper from the last 4 years on or near the topic (you will verify this in Step 3 before committing the problem).
     - Not a near-duplicate of an existing slug in this repo (subjective; lean toward "yes it's distinct" if the rated dimensions would differ materially).
2.2. From the brainstorm, select **min(<TARGET_NEW_COUNT>, 15)** candidates spread across the subdomains in <TERRITORY> (aim for ≥ 1 per subdomain if N ≥ |subdomains|). The cap at 15 is the chunk-discipline rule from §2.5 — even when <TARGET_NEW_COUNT> is 50 or 80, this session authors at most 15 of them; the remainder is brainstormed but DEFERRED for a continuation session via Step 6.5.
2.3. Mint a kebab-case `<NEW-SLUG>` for each of the 15-or-fewer candidates you are authoring **this session**. Slug rules: lowercase letters / digits / hyphens; 3–6 words; concept-first, not adjective-first (`offline-rl-conservatism` not `conservative-offline-rl`); avoids overlap with existing slugs. Do NOT mint slugs for deferred candidates — leaving them un-claimed lets the continuation session claim them (or revise them based on what authored cleanly).
2.4. Write the slug-claim manifest at `docs/new-problem-claims/<RUN_ID>.md`:
     ```
     ---
     run_id: <RUN_ID>
     mode: <MODE>
     territory: <TERRITORY>
     territory_label: <TERRITORY-LABEL>
     curator: <CURATOR>
     planned_count: <ACTUAL-COUNT>
     ---
     ## Claimed slugs
     - <NEW-SLUG-1>  (domain: <D>, subdomain: <S>) — <one-line working title>
     - <NEW-SLUG-2>  ...
     ## Notes
     - <anything the merger should know — e.g. "slug X may overlap conceptually with existing Y, see related_problems link">
     ```
     Commit this manifest alone: `chore(claims): <YYYY-MM-DD> claim <N> slugs in <TERRITORY-LABEL>`. This is your first commit on the branch; everything else hangs off it.
     Note for the `## Notes` section: if <TARGET_NEW_COUNT> > 15, write a one-liner like "chunk 1 of ~`ceil(<TARGET_NEW_COUNT>/15)`; remaining `<deferred-count>` candidates carry over via docs/resume-checkpoints/<RUN_ID>.md (written in Step 6.5)".

== STEP 2.5 — CHUNK DISCIPLINE (when <TARGET_NEW_COUNT> > 15) ==

Realistic per-session ceiling: ~15 quality slugs. Each slug costs ~50–80K context (Step 3 deep-research with 6–8 web calls + Step 4 file generation + commit overhead), so even Opus 4.7's 1M-context budget realistically supports 15–20 slugs before output quality degrades. When <TARGET_NEW_COUNT> exceeds 15:

2.5.a. This session authors the **first 15 candidates** from your Step 2.2 brainstorm — the highest-confidence / best-evidenced ones; the candidates you generated first.
2.5.b. Keep a private scratchpad of the deferred candidates: working title, proposed slug, subdomain, and any verified sources you already noticed in the survey pass. You will dump this into a checkpoint file in Step 6.5.
2.5.c. Do NOT claim deferred slugs in the Step 2.4 manifest. The continuation session re-evaluates them with fresh context and may revise the slug spelling or drop a candidate that turns out to overlap with one you just authored.
2.5.d. If <TARGET_NEW_COUNT> ≤ 15, ignore Step 2.5 and Step 6.5 entirely — this is a single-chunk run.

== STEP 3 — DEEP RESEARCH per new problem (BATCH-NEW / BATCH-MIXED) ==

For each `<NEW-SLUG>` you claimed, run the following research protocol BEFORE writing any content file. Cap web tool calls at ~8 per slug to keep context budget under control.

3.1. Survey-anchor pass:
     - WebSearch with the working title + "survey" + a recent year range, e.g. `"<title-keywords> survey 2024..2026 arxiv"`.
     - WebSearch with the working title + "open problems" or "review", e.g. `"<title-keywords> open problems"`.
     - From the top 5 results, pick the 1–2 most authoritative (arXiv survey, ICLR/NeurIPS/ICML/ACL track paper, lab roadmap, NIST/standards-body report).
3.2. Benchmark / evaluation pass:
     - WebSearch for the canonical evaluation surface, e.g. `"<title-keywords> benchmark dataset"`.
     - Identify 1–4 named benchmarks. Each named benchmark must be confirmable from a public listing — Hugging Face datasets, Papers With Code legacy mirror, or the paper that introduces it.
     - Note the metric direction (higher-is-better vs. lower-is-better). Omit `upper_bound` unless a paper explicitly states a human-expert or theoretical ceiling.
3.3. Verification pass:
     - For each cited paper, WebFetch the arXiv abstract page (or the venue's official page) to verify the title, authors, and year. If WebFetch returns the abstract, you have ground truth. If it 404s or the title does not match, drop the citation.
     - Maintain a per-slug evidence ledger in your scratch (you will copy it into the rating-action's `signals_considered`).
3.4. Cross-link pass:
     - From existing slugs (Step 1.4), pick 0–3 that this new problem materially depends on or is depended on by. Add them to `related_problems` in the new problem.yaml. One-direction links are OK (the cross-link auditor handles symmetry later).
3.5. (Optional) HF MCP delegate:
     - If `mcp__claude_ai_Hugging_Face__paper_search` is available, run one query per slug with the working title and `days=730 top=5` to surface candidates the WebSearch passes missed. Treat results as additional signals, not as replacements for verification.
3.6. STOP CONDITION. If after Step 3 you have fewer than 3 verified primary sources for a slug, drop it from your batch. Note the drop in docs/open-questions-inbox/<RUN_ID>.md ("could not assemble defensible evidence for <SLUG> — recommend human triage"). It is better to ship 4 high-quality problems than 8 thin ones.

== STEP 4 — AUTHOR each new problem (BATCH-NEW / BATCH-MIXED) ==

For each verified `<NEW-SLUG>`, produce the five files in a single commit. Shape reference: content/problems/hallucination-reduction/.

4.1. `content/problems/<NEW-SLUG>/problem.yaml` — validates against OpenProblemSchema (lib/schemas/problem.ts):
     ```yaml
     slug: <NEW-SLUG>
     title: <Title — 5–120 chars, properly capitalised>
     subtitle: <One-line research-grade subtitle, ≤ 200 chars>
     domain: <DOMAIN>                # must resolve in content/taxonomy.yaml
     subdomain: <SUBDOMAIN>          # must resolve under that domain
     tags:
       - <tag-1>                     # 3–7 kebab-case tags, used by search + faceting
       - <tag-2>
       - ...
     status: open                    # default; rare exceptions: partially-solved, converging
     posed_year: <YYYY>              # year the problem became a recognised open problem, not the year of the first paper
     authors_who_posed: []           # OPTIONAL — only if a single canonical "problem-posing" paper exists; leave empty otherwise
     related_problems:
       - <existing-slug-1>
       - <existing-slug-2>
     benchmarks:
       - id: <benchmark-1-id>        # kebab-case, unique within this problem
         name: <Benchmark name>
         dataset: <Dataset name>
         metric: <metric name>
         metric_direction: <higher-is-better | lower-is-better>
         # OMIT upper_bound unless a paper explicitly states a ceiling
         # OMIT protocol_url unless you have a verified URL
         notes: |
           1–3 lines: what this benchmark measures, what split is canonical,
           where the 2024–26 SOTA tends to be reported (NO numerical scores).
     external_links:
       arxiv_survey: <URL>           # OPTIONAL — only if Step 3.1 found one
     editorial:
       primary_curator: <CURATOR>
       last_curated: <YYYY-MM-DD>    # today UTC
     ```

4.2. `content/problems/<NEW-SLUG>/background.mdx` — 4–8 short paragraphs, frontmatter `{title, summary}`. Must:
     - State why the problem is open as of <YYYY-MM>.
     - Cite at least 2 of the verified sources from Step 3 inline by year + first author (e.g. "Smith et al., NeurIPS 2024 showed …"). Never cite a paper you did not verify.
     - Define key terms a non-specialist could need.
     - Avoid code blocks unless the problem is formal / algorithmic.
     - 300–600 words.

4.3. `content/problems/<NEW-SLUG>/definition.mdx` — formal or working definition, frontmatter `{title, summary}`. KaTeX is OK (`$inline$`, `$$display$$`). Must:
     - State the input, output, and success criterion in math or precise prose.
     - Define every symbol introduced.
     - Distinguish this problem's success criterion from adjacent problems (referenced via [[wikilink-slug]]).
     - 150–400 words.

4.4. `content/problems/<NEW-SLUG>/history.mdx` — chronology in 2–3 short paragraphs, frontmatter `{title, summary}`. Must:
     - Span at least 5 years of progress (or note explicitly when the problem is younger than 5 years).
     - Cite waves of work generically ("the 2020–22 retrieval-augmented wave") OR specifically (Step-3-verified paper IDs).
     - End with the present-day frontier as of <YYYY-MM>.
     - 200–500 words.

4.5. `content/problems/<NEW-SLUG>/ratings/<YYYY-MM-DD>-initial-<RUN_ID>.yaml` — validates against RatingActionSchema. ALL FIVE dimensions present (ADR-0005). Default confidences for a first pass: 0.5–0.7. Saturation rules:
     - If a defensible numeric ceiling exists and you can place SOTA on it, you may write `value: <0-100>` with a TODO(curate) note that the exact number needs human confirmation.
     - Otherwise, use the §8.2 N/A escape hatch: `value: null` + `qualitative_band: low|medium|high`. This is the preferred default for fresh problems where you have not done a leaderboard pass.
     ```yaml
     problem_slug: <NEW-SLUG>
     date: <YYYY-MM-DD>
     methodology_version: "1.0.0"
     curator: <CURATOR>
     # NO prior_action — this is the initial rating
     dimensions:
       difficulty:
         grade: <S|A|B|C|D|E>
         confidence: 0.6
         rationale: |
           2–4 sentences. Cite the evidence pattern, not invented numbers.
           Explicitly justify why not the adjacent grades.
       saturation:
         value: null
         qualitative_band: <low|medium|high>
         confidence: 0.5
         rationale: |
           "Initial qualitative band pending a curated SOTA pass.
           TODO(curate): place SOTA on the ceiling for <benchmark>."
       urgency:
         stars: <0-5>
         confidence: 0.6
         rationale: |
           Cite signals: lab roadmaps, downstream blockers, regulatory deadlines, AI-safety reports.
       value:
         stars: <0-5>
         confidence: 0.6
         rationale: |
           Cite spillover signals, downstream-problem unlocks.
       industry_call:
         stars: <0-5>
         confidence: 0.6
         rationale: |
           Cite job-posting, VC, lab-roadmap signals.
     signals_considered:
       - "arxiv:<ID> — <Authors-verified>, <Title-verified>, <Venue> <Year>"
       - "<verified URL>"
       - "<verified URL>"
       # At least 3 entries. All Step-3-verified.
     watchlist: false                # true if any dimension confidence < 0.5
     ```

4.6. Stage and commit ONLY the five files for this slug:
     ```
     content(<NEW-SLUG>): <YYYY-MM-DD> initial — <title-fragment>

     - domain: <D>/<S>
     - benchmarks: <N> named (no scores)
     - signals: <K> verified primary sources
     - related_problems: <list>

     Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
     ```
     Pre-commit hooks (lint-staged, ADR-0005 check, vitest) MUST pass. If vitest fails because of a content-validation error, fix only files inside the slug folder; if it fails for any other reason, abort the slug, `git restore --staged .`, `git checkout -- .`, and surface to the inbox.

4.7. Move to the next `<NEW-SLUG>`. Commit cadence is one-commit-per-slug so a single bad slug never poisons the batch.

== STEP 5 — DEEP-RESEARCH UPDATE per existing slug (BATCH-DEEP-UPDATE / BATCH-MIXED) ==

For each slug in <TARGET_UPDATE_SLUGS>:

5.1. Read content/problems/<SLUG>/problem.yaml + every existing rating action. Identify the latest rating action's filename (= prior_action basename).
5.2. Deep-research the slug since `editorial.last_curated`:
     - WebSearch: `"<problem-title-keywords> 2025..2026 arxiv"`, `"<problem-title-keywords> SOTA 2025"`, `"<benchmark-name> leaderboard"`.
     - WebFetch the top 2–3 arXiv abstract pages to verify titles + dates.
     - HF MCP `paper_search` if available: `query="<title-keywords>" days=180 top=8`.
5.3. Apply the materiality test from CURATION_PROMPT.md §3U.a:
     - Difficulty: ≥ 1 letter-grade move.
     - Saturation: ≥ 10 points OR a band change (low → medium etc.).
     - Urgency / Value / Industry Call: ≥ 1 star move.
     - AND the evidence is from a top-tier venue, frontier-lab roadmap, ≥ 2 replications, or a regulator.
5.4. If nothing moves, emit only a curation log noting "no material change". Bias toward staying put — every emitted action is a public record.
5.5. If something moves, draft a new rating action at content/problems/<SLUG>/ratings/<YYYY-MM-DD>-<REASON>-<RUN_ID>.yaml. REASON ∈ {sota-bump, frontier-finding, watchlist-on, watchlist-off, methodology-refresh, regulator-signal}. Full snapshot of all five dimensions (ADR-0005). Confidence < 0.5 on any dim ⇒ set `watchlist: true`.
5.6. If your research surfaced an arXiv paper NOT already in content/papers/, AND that paper would be a primary signal for this slug's rating, ALSO author content/papers/<ARXIV-ID>.yaml in the same commit. Verify the arxiv_id is not already taken: `git ls-files content/papers/<ARXIV-ID>.yaml`. The paper YAML follows PaperSchema; `tldr` must be ≤ 400 chars and honest (no fabricated numbers); use `[TLDR pending human review]` if you cannot summarise without speculation.
5.7. Commit: `content(<SLUG>): <YYYY-MM-DD> <MODE> — <one-line summary>`. One commit per slug.

== STEP 6 — CURATION LOGS + INBOX FILES (always) ==

6.1. For each slug touched (new or updated), write content/problems/<SLUG>/.curation-log/<RUN_ID>.md. Schema per CURATION_PROMPT.md §5; include an "Evidence verified" section listing each WebFetch URL that confirmed a citation.
6.2. If any ambiguity surfaced (subdomain mismatch, two candidates that may be the same problem, missing benchmark protocol, etc.), append to docs/open-questions-inbox/<RUN_ID>.md (create if not present). One <RUN_ID>.md file per session, multiple Q-blocks inside it.
6.3. Write docs/changelog-inbox/<RUN_ID>.md with one bullet per commit that landed:
     ```
     ---
     run_id: <RUN_ID>
     phase: <current-phase-number>
     ---
     - content(<KEY>): <one-line summary, past tense, ≤ 100 chars>
     - content(<KEY>): ...
     ```
6.4. Commit the curation logs + inbox files in a final housekeeping commit: `chore(curation): <YYYY-MM-DD> logs + inbox for <TERRITORY-LABEL>/<RUN_ID>`.

== STEP 6.5 — RESUME CHECKPOINT (only when you deferred candidates in Step 2.5) ==

Skip this step entirely if `<TARGET_NEW_COUNT> ≤ 15` OR you authored every candidate from Step 2.2 in this session. Otherwise:

6.5.a. Compute: `remaining = <TARGET_NEW_COUNT> − (count of new-problem commits this session)`.
6.5.b. Write `docs/resume-checkpoints/<RUN_ID>.md`:

       ```
       ---
       run_id: <RUN_ID>
       parent_branch: curate/<MODE>-<TERRITORY-LABEL>-<RUN_ID>
       territory_label: <TERRITORY-LABEL>
       territory: <TERRITORY>
       mode: <MODE>
       curator: <CURATOR>
       target_total: <TARGET_NEW_COUNT>
       authored_this_session: <count>
       remaining: <remaining>
       chunk_index: 1
       ---
       ## Already authored this session (commits on parent branch)
       - <new-slug-1>: <short title fragment>
       - <new-slug-2>: ...
       ## Deferred candidates (the next chunk should author these)
       - title: "<working title 1>" | proposed slug: <slug-1> | domain: <D>/<S> | one-line rationale
       - title: "<working title 2>" | proposed slug: <slug-2> | domain: <D>/<S> | one-line rationale
       - ...
       ## Existing slugs deliberately skipped (do not re-propose in continuation)
       - <existing-slug>: <one-line reason — e.g., "already covers this concept">
       ## Verified-source scratchpad (carry-over evidence the continuation can reuse)
       - <deferred-slug-1>:
         - arxiv:XXXX.YYYYY — "<verified title>", <Authors-verified>, <Venue> <Year> (WebFetched in this session)
         - <verified URL 2>
       - <deferred-slug-2>:
         - ...
       ## CONTINUATION PROMPT — paste the fenced block below into a fresh Claude Code session pointed at this same worktree

       ```
       Continue batch-curation campaign <RUN_ID> on branch curate/<MODE>-<TERRITORY-LABEL>-<RUN_ID>.

       1. git status --short && git log --oneline -1  — verify the working tree is clean and HEAD matches the parent-branch tip.
       2. git checkout curate/<MODE>-<TERRITORY-LABEL>-<RUN_ID>  — checkout the EXISTING parent branch; do NOT use `-b` (do not create a new branch).
       3. Read docs/resume-checkpoints/<RUN_ID>.md (this file) end-to-end. Treat the "Deferred candidates" list as your Step 2.2 selection and the "Verified-source scratchpad" as Step 3 carry-over.
       4. Use RUN_ID = <RUN_ID>-c2 for every NEW file this session writes (slug-claim manifest, rating-action filenames, inbox files, curation logs, next checkpoint). The `-c2` suffix makes chunk-2 files globally unique vs chunk-1's `<RUN_ID>` files on the same branch.
       5. Apply Steps 2.4 → 3 → 4 → 6 → 6.5 (if you still defer) → 7 from docs/BATCH_GENERATION_PROMPT.md. SKIP Step 5 entirely — the parent session already ran updates on <TARGET_UPDATE_SLUGS>.
       6. Cap THIS session at 15 new slugs as well (the chunk discipline applies to every session, not just chunk 1). If after this session you still have remaining > 0, write the next checkpoint with chunk_index: 2 and RUN_ID suffix `-c3` for the session after.
       7. Constraints unchanged: MASTER_PROMPT §15.6 no-invent rule (verify every cited paper via WebFetch in THIS session — do not trust unverified entries copied from the carry-over scratchpad), ADR-0005 rating-action immutability, the absolute guardrails at the bottom of BATCH_GENERATION_PROMPT.md.
       8. Do not push, do not merge. The serial merge pass aggregates all chunks per branch at the end of the burst.
       ```
       ```

6.5.c. Stage and commit the checkpoint alone: `chore(curation): <YYYY-MM-DD> checkpoint at <authored>/<TARGET_NEW_COUNT> for <TERRITORY-LABEL>/<RUN_ID>`.
6.5.d. The print in Step 7.3 must also include: `Checkpoint: docs/resume-checkpoints/<RUN_ID>.md (remaining: <remaining>) — copy the continuation prompt from that file into a fresh session to resume.`

== STEP 7 — VALIDATE + STOP ==

7.1. `pnpm validate-content`. If errors, fix only files inside your allow-list (this session's slugs, this session's paper YAMLs, this session's inbox files). If you cannot fix without crossing the allow-list, abort, write the blocker to docs/open-questions-inbox/<RUN_ID>.md, commit only the inbox file, and stop.
7.2. Final `git log --oneline` on your branch — expect: 1 claim commit + N slug commits + 1 housekeeping commit (+ optional 1 checkpoint commit if Step 6.5 fired) = N+2 or N+3 commits total.
7.3. Print to the user exactly:
     ```
     Branch: curate/<MODE>-<TERRITORY-LABEL>-<RUN_ID>  (HEAD: <SHORT-HASH>)
     New problems: <N-new>  (<comma-separated slugs>)
     Updated slugs: <M-updated>  (<comma-separated slugs or "none">)
     Verified sources: <K> across <N+M> commits
     Inbox files: open-questions-inbox/<RUN_ID>.md (<Q-count>), changelog-inbox/<RUN_ID>.md, new-problem-claims/<RUN_ID>.md
     Checkpoint: <docs/resume-checkpoints/<RUN_ID>.md (remaining: <remaining>) — paste its continuation prompt into a fresh session to resume>  OR  <"none — target met in single chunk">
     ```
     Then exit.

== ABSOLUTE GUARDRAILS ==

- Never invent a paper title, author, venue, year, or numeric score (§15.6). Every cited paper must pass a WebFetch verification step in this session.
- Never edit a file outside this run's allow-list. The forbidden list from CURATION_PROMPT.md applies verbatim.
- Never push, never merge. The orchestrator runs the serial merge pass.
- Never use `--no-verify` to skip pre-commit hooks. If a hook fails, fix the underlying cause inside your allow-list or abort with an inbox note.
- Never edit an existing rating-action file (ADR-0005). A correction is a new file with `prior_action:` set.
- Never modify content/taxonomy.yaml. If a candidate problem does not fit any existing (domain, subdomain), drop the candidate and surface the gap to the inbox.
- Cap each web-research pass at ~8 tool calls per slug. Verification quality matters more than count.
- A run that ships zero defensible new problems is a successful run if its inbox file explains why. Quality > volume.
````

---

## 20-session shard manifest

Goal: cover all 80 subdomains with disjoint territories so 20 sessions can run concurrently without slug-claim conflicts. The targets below total **exactly 250 new problems** — the project's defensible North-Star count for becoming a trusted reference. Counts are weighted by subdomain density (LLM / alignment / perception-rich slots take 16–22; narrow theory / optimization slots take 8–10).

**Why 250.** Five reference frames converge on this band: (a) the 80-subdomain taxonomy's natural carrying capacity (~230–280) when every entry must clear the 3-verified-source bar from §15.6; (b) historical precedent for canonical research-problem lists (Hilbert: 23, Smale: 18, Clay: 7, NLP-progress: ~80) — quality, not count, earned trust; (c) Papers-with-Code's failure mode at ~10K showed scale without rigor destroys the methodology; (d) sustainable editorial maintenance: 250 problems × 1–2 hr/quarter re-rating = ~500–1000 hr/year, feasible for a 1–3 person board; (e) the methodology paper (ICLR Blog Track / NeurIPS D&B / position-paper workshop) lands credibly at N=200–300. See the full audit in the project's recommendation thread.

**Burst shape.** Most slots (16/20) target ≤ 15 problems and complete in a single session per the Step 2.5 chunk cap. The 4 highest-density slots (`01 dl-lm-frontier=22`, `07 safety-alignment=18`, `11 applied-perception=16`, `20 theory=16`) need a chunk-2 continuation session via the Step 6.5 resume protocol. Total: **~1.2 effective bursts** for the whole 250-problem campaign.

Each session is also given a small `TARGET_UPDATE_SLUGS` list for deep-research updates within its territory, with explicit fallback to "" if its territory has no existing problems yet. Updates run once per slot in chunk-1; chunk-2 continuations skip Step 5.

The territories below are pre-checked disjoint across the 80 subdomains in `content/taxonomy.yaml`.

| Slot | TERRITORY_LABEL    | Subdomains (domain/subdomain)                                                                                                                                                                                                                                                                                                                          | NEW | Update slugs (existing today)                                                                                 |
| ---- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | ------------------------------------------------------------------------------------------------------------- |
| 01   | dl-lm-frontier     | `deep-learning/large-language-models`, `deep-learning/attention-mechanisms`, `deep-learning/foundation-models`                                                                                                                                                                                                                                         | 22  | `hallucination-reduction,long-horizon-agent-reliability,long-context-rag,compute-optimal-test-time-reasoning` |
| 02   | dl-generative      | `deep-learning/generative-models`, `deep-learning/self-supervised-learning`, `deep-learning/representation-learning`                                                                                                                                                                                                                                   | 14  | ""                                                                                                            |
| 03   | dl-architecture    | `deep-learning/algorithms`, `deep-learning/graph-neural-networks`, `deep-learning/sequential-models`                                                                                                                                                                                                                                                   | 13  | "compute-optimal-test-time-reasoning"                                                                         |
| 04   | dl-theory-robust   | `deep-learning/theory`, `deep-learning/robustness`, `deep-learning/dl-other`                                                                                                                                                                                                                                                                           | 10  | ""                                                                                                            |
| 05   | rl-frontier        | `reinforcement-learning/deep-rl`, `reinforcement-learning/multi-agent`, `reinforcement-learning/policy-search`                                                                                                                                                                                                                                         | 13  | "multi-agent-llm-coordination"                                                                                |
| 06   | rl-offline-inverse | `reinforcement-learning/batch-offline`, `reinforcement-learning/inverse`, `reinforcement-learning/online`, `reinforcement-learning/planning`, `reinforcement-learning/rl-other`                                                                                                                                                                        | 10  | ""                                                                                                            |
| 07   | safety-alignment   | `social-aspects/alignment`, `social-aspects/safety`, `social-aspects/accountability-transparency-interpretability`                                                                                                                                                                                                                                     | 18  | "scalable-oversight,mechanistic-interpretability"                                                             |
| 08   | safety-fairness    | `social-aspects/fairness`, `social-aspects/privacy`, `social-aspects/robustness`, `social-aspects/security`, `social-aspects/social-other`                                                                                                                                                                                                             | 12  | ""                                                                                                            |
| 09   | applied-bio-health | `applications/health-medicine`, `applications/neuroscience`                                                                                                                                                                                                                                                                                            | 12  | "genome-foundation-models"                                                                                    |
| 10   | applied-physical   | `applications/chem-phys-earth`, `applications/energy`, `applications/time-series`                                                                                                                                                                                                                                                                      | 12  | "operator-learning-foundation-models"                                                                         |
| 11   | applied-perception | `applications/computer-vision`, `applications/language-speech`, `applications/robotics`                                                                                                                                                                                                                                                                | 16  | ""                                                                                                            |
| 12   | applied-social-mix | `applications/social-sciences`, `applications/applications-other`                                                                                                                                                                                                                                                                                      | 8   | ""                                                                                                            |
| 13   | genml-data-eval    | `general-ml/data`, `general-ml/evaluation`, `general-ml/methodology`                                                                                                                                                                                                                                                                                   | 12  | "benchmark-integrity"                                                                                         |
| 14   | genml-causal-rep   | `general-ml/causality`, `general-ml/representation-learning`, `general-ml/clustering`                                                                                                                                                                                                                                                                  | 10  | ""                                                                                                            |
| 15   | genml-online-trans | `general-ml/online-active-bandits`, `general-ml/transfer-multitask-meta`, `general-ml/unsup-semisup`, `general-ml/supervised-learning`                                                                                                                                                                                                                 | 12  | ""                                                                                                            |
| 16   | genml-systems      | `general-ml/hardware-software`, `general-ml/scalable-algorithms`, `general-ml/sequential-network-time-series`, `general-ml/kernel-methods`, `general-ml/general-ml-other`                                                                                                                                                                              | 10  | ""                                                                                                            |
| 17   | opt-classical      | `optimization/convex`, `optimization/non-convex`, `optimization/stochastic`                                                                                                                                                                                                                                                                            | 9   | ""                                                                                                            |
| 18   | opt-applied        | `optimization/discrete-combinatorial`, `optimization/large-scale-parallel-distributed`, `optimization/zero-order-black-box`, `optimization/optimization-other`                                                                                                                                                                                         | 8   | ""                                                                                                            |
| 19   | prob-methods       | `probabilistic-methods/bayesian`, `probabilistic-methods/variational-inference`, `probabilistic-methods/monte-carlo-sampling`, `probabilistic-methods/gaussian-processes`, `probabilistic-methods/graphical-models`, `probabilistic-methods/spectral-methods`, `probabilistic-methods/structure-learning`, `probabilistic-methods/probabilistic-other` | 13  | ""                                                                                                            |
| 20   | theory             | `theory/dl-theory`, `theory/learning-theory`, `theory/rl-planning-theory`, `theory/optimization-theory`, `theory/game-theory`, `theory/probabilistic-theory`, `theory/online-bandits`, `theory/active-interactive`, `theory/domain-adaptation-transfer`, `theory/theory-other`                                                                         | 16  | ""                                                                                                            |

Sum across slots: **exactly 250 new problems** distributed across all 80 subdomains. Per-subdomain density averages ~3 problems with high-density slots (01, 07, 11) at 5–7 per subdomain and narrow-theory slots (19, 20) at ~1.5 per subdomain. Aggregate update-pass coverage: every existing slug except `multi-agent-llm-coordination` (covered in slot 05 explicitly) gets at least one deep-research update from its territory owner in chunk-1.

**Realistic burst cadence:** Each session caps at 15 new slugs per chunk (Step 2.5). Reaching 250 takes:

- **Burst 1 (initial):** 20 sessions in parallel. 16 slots ≤ 15 slugs complete in this single burst (~190 problems). 4 high-density slots (01=22, 07=18, 11=16, 20=16) land their first 15 and write Step-6.5 checkpoints deferring 22 problems total.
- **Burst 2 (continuation, 4 slots only):** 4 continuation sessions land the deferred ~22 problems on the same parent branches. No further checkpoints needed.

Total: **~1.2 effective bursts**, ~2–4 hours of wall-clock with worktrees.

---

## Orchestrator — 20 concurrent slots

```pwsh
# PowerShell — 20 concurrent slots, BATCH-MIXED mode. Run from c:\opensource\OpenProblems.
$slots = @(
  @{ Label = "dl-lm-frontier";     Territory = "deep-learning/large-language-models,deep-learning/attention-mechanisms,deep-learning/foundation-models";                                      New = 22; Updates = "hallucination-reduction,long-horizon-agent-reliability,long-context-rag,compute-optimal-test-time-reasoning" },
  @{ Label = "dl-generative";      Territory = "deep-learning/generative-models,deep-learning/self-supervised-learning,deep-learning/representation-learning";                                New = 14; Updates = "" },
  @{ Label = "dl-architecture";    Territory = "deep-learning/algorithms,deep-learning/graph-neural-networks,deep-learning/sequential-models";                                                New = 13; Updates = "compute-optimal-test-time-reasoning" },
  @{ Label = "dl-theory-robust";   Territory = "deep-learning/theory,deep-learning/robustness,deep-learning/dl-other";                                                                        New = 10; Updates = "" },
  @{ Label = "rl-frontier";        Territory = "reinforcement-learning/deep-rl,reinforcement-learning/multi-agent,reinforcement-learning/policy-search";                                      New = 13; Updates = "multi-agent-llm-coordination" },
  @{ Label = "rl-offline-inverse"; Territory = "reinforcement-learning/batch-offline,reinforcement-learning/inverse,reinforcement-learning/online,reinforcement-learning/planning,reinforcement-learning/rl-other"; New = 10; Updates = "" },
  @{ Label = "safety-alignment";   Territory = "social-aspects/alignment,social-aspects/safety,social-aspects/accountability-transparency-interpretability";                                  New = 18; Updates = "scalable-oversight,mechanistic-interpretability" },
  @{ Label = "safety-fairness";    Territory = "social-aspects/fairness,social-aspects/privacy,social-aspects/robustness,social-aspects/security,social-aspects/social-other";                New = 12; Updates = "" },
  @{ Label = "applied-bio-health"; Territory = "applications/health-medicine,applications/neuroscience";                                                                                      New = 12; Updates = "genome-foundation-models" },
  @{ Label = "applied-physical";   Territory = "applications/chem-phys-earth,applications/energy,applications/time-series";                                                                   New = 12; Updates = "operator-learning-foundation-models" },
  @{ Label = "applied-perception"; Territory = "applications/computer-vision,applications/language-speech,applications/robotics";                                                             New = 16; Updates = "" },
  @{ Label = "applied-social-mix"; Territory = "applications/social-sciences,applications/applications-other";                                                                                New = 8;  Updates = "" },
  @{ Label = "genml-data-eval";    Territory = "general-ml/data,general-ml/evaluation,general-ml/methodology";                                                                                New = 12; Updates = "benchmark-integrity" },
  @{ Label = "genml-causal-rep";   Territory = "general-ml/causality,general-ml/representation-learning,general-ml/clustering";                                                               New = 10; Updates = "" },
  @{ Label = "genml-online-trans"; Territory = "general-ml/online-active-bandits,general-ml/transfer-multitask-meta,general-ml/unsup-semisup,general-ml/supervised-learning";                 New = 12; Updates = "" },
  @{ Label = "genml-systems";      Territory = "general-ml/hardware-software,general-ml/scalable-algorithms,general-ml/sequential-network-time-series,general-ml/kernel-methods,general-ml/general-ml-other"; New = 10; Updates = "" },
  @{ Label = "opt-classical";      Territory = "optimization/convex,optimization/non-convex,optimization/stochastic";                                                                         New = 9;  Updates = "" },
  @{ Label = "opt-applied";        Territory = "optimization/discrete-combinatorial,optimization/large-scale-parallel-distributed,optimization/zero-order-black-box,optimization/optimization-other"; New = 8;  Updates = "" },
  @{ Label = "prob-methods";       Territory = "probabilistic-methods/bayesian,probabilistic-methods/variational-inference,probabilistic-methods/monte-carlo-sampling,probabilistic-methods/gaussian-processes,probabilistic-methods/graphical-models,probabilistic-methods/spectral-methods,probabilistic-methods/structure-learning,probabilistic-methods/probabilistic-other"; New = 13; Updates = "" },
  @{ Label = "theory";             Territory = "theory/dl-theory,theory/learning-theory,theory/rl-planning-theory,theory/optimization-theory,theory/game-theory,theory/probabilistic-theory,theory/online-bandits,theory/active-interactive,theory/domain-adaptation-transfer,theory/theory-other"; New = 16; Updates = "" }
)

$ts = (Get-Date -AsUTC).ToString("yyyy-MM-ddTHH-mm")
$promptTemplate = Get-Content docs/BATCH_GENERATION_PROMPT.md -Raw

foreach ($slot in $slots) {
  $runId = "$ts-$(([guid]::NewGuid().ToString('N')).Substring(0,6))"
  $hasUpdates = -not [string]::IsNullOrWhiteSpace($slot.Updates)
  $mode = if ($hasUpdates) { "BATCH-MIXED" } else { "BATCH-NEW" }

  $prompt = $promptTemplate `
    -replace '<MODE>',              $mode `
    -replace '<TERRITORY>',         $slot.Territory `
    -replace '<TERRITORY-LABEL>',   $slot.Label `
    -replace '<TARGET_NEW_COUNT>',  $slot.New.ToString() `
    -replace '<TARGET_UPDATE_SLUGS>', $slot.Updates `
    -replace '<CURATOR>',           'jikun' `
    -replace '<RUN-ID>',            $runId `
    -replace '<RUN_ID>',            $runId

  # spawn-claude-code is your orchestrator entry — Agent SDK / `claude` CLI / GitHub Action runner.
  # Each invocation is a fresh Claude Code session in the same working directory but on its own branch.
  Start-Job -Name "curate-$($slot.Label)" -ScriptBlock {
    param($p) spawn-claude-code --cwd c:\opensource\OpenProblems --prompt $p
  } -ArgumentList $prompt
}

Get-Job -Name 'curate-*' | Wait-Job | Receive-Job
```

Throughput notes for 20 concurrent sessions on this repo:

- Pre-commit runs `pnpm test` tree-wide on every commit. With ~250 new-problem commits across 20 branches, the test runner queues commits at the filesystem-lock level. **Without git worktrees**, practical commit throughput is bounded to ~1–2 commits/minute aggregate (commits serialize on `.git/index` + `node_modules/.vitest/`). **With git worktrees** (one per slot), throughput rises to ~5–10 commits/minute aggregate because the index locks are per-worktree. The README in `docs/batch-prompts/` documents the worktree recipe — **recommended** for a campaign of this size, **mandatory** if you ever scale past 250.
- Sessions are independent on read paths (each reads MASTER_PROMPT.md + schemas + the hallucination-reduction reference once). After the first session warms, prompt-cache hits dominate for these reads.
- Web research dominates wall-clock per slug (Step 3 = 6–8 web calls × ≤15 candidates per chunk). Budget ~3–5 minutes per new problem authored. A 15-slug chunk fits in a 60–90 minute session.
- Realistic completion timeline for the 250-problem target: **2–4 hours of wall-clock** with worktrees, in one main burst + one short continuation burst for 4 high-density slots. Without worktrees, allow 5–8 hours.

---

## Serial merge pass (single session, runs after the final chunk of the campaign)

Run the merge pass **once** at the end — not after every burst. For the 250-problem campaign, this means: after the 4 high-density slots' chunk-2 continuation sessions land their deferred ~22 problems, then merge. Each slot's branch may accumulate 1–2 chunks of commits; that is by design. Running the merge between bursts would force continuation sessions to rebase, multiplying the surface for conflicts and breaking the "continuation session reuses the parent branch" rule from Step 6.5.

After every territory's `remaining` count has reached 0 (or you decide to ship a slot at less than its target):

1. **Slug-collision pass.** `cat docs/new-problem-claims/*.md` — aggregate every claimed slug. If two RUN-IDs (parent or chunk-N) claim the same slug, keep the earlier commit and rename the later branch's slug (`git mv content/problems/<old>/* content/problems/<new>/` + edit problem.yaml's `slug:` field) before merging. Add a redirect entry to `content/redirects.yaml` if/when that file exists. Surface the collision in CHANGELOG.md.
2. **Resume-checkpoint pass.** `cat docs/resume-checkpoints/*.md` — confirm `remaining: 0` on every checkpoint OR a deliberate operator decision to skip the rest. Any non-zero remaining is fine to ship; just log it in CHANGELOG.md as "campaign paused at N/1000 — continuation candidates retained in docs/resume-checkpoints/.archived/".
3. **Branch review.** `git branch --list 'curate/*'` — for each branch, read its `content/problems/*/.curation-log/<RUN_ID>*.md` (multiple curation logs per slot now — one per chunk). Drop branches whose logs show < 3 verified sources per slug or whose problems duplicate existing concepts. Drop **chunks** within a branch you don't trust by hard-resetting the branch to a known-good chunk SHA before merging.
4. **Cherry-pick merge.** For each branch kept: `git merge --no-ff curate/<MODE>-<LABEL>-<RUN_ID>`. The merge picks up all chunks because they share the branch. Resolve any incidental `content/papers/<ARXIV-ID>.yaml` collisions by picking the more-complete YAML (more authors, longer tldr).
5. **Aggregate singletons.**
   - `docs/open-questions-inbox/*.md` (one per session, including continuations) → append as new Q-numbers at the bottom of `OPEN_QUESTIONS.md`. `git rm docs/open-questions-inbox/*.md`.
   - `docs/changelog-inbox/*.md` → append bullets under the right Phase heading in `CHANGELOG.md`. `git rm docs/changelog-inbox/*.md`.
   - `docs/new-problem-claims/*.md` → archive to `docs/new-problem-claims/.archived/<DATE>/` for audit history.
   - `docs/resume-checkpoints/*.md` → archive to `docs/resume-checkpoints/.archived/<DATE>/`. Do NOT `git rm` outright; the deferred-candidate scratchpads are useful for the next campaign cycle.
6. **Cross-link audit.** Run `pnpm tsx scripts/cross-link-audit.ts` (if present) to detect one-direction `related_problems` links produced by sibling sessions, then optionally symmetrise in a follow-up commit. At 1000 problems, expect dozens of asymmetric links — symmetrising them is its own dedicated unit, not part of the merge pass.
7. **Final commit.** `chore(curation): merge <N> slots × <K> chunks = ~1000 new problems from campaign <YYYY-MM-DD>` summarising slot-by-slot counts.

This merge pass is intentionally serial and intentionally the only writer of the global singletons. At 250 problems with ~1–2 chunks per slot, budget **~1 hour** for the merge pass — most of that is reading curation logs and judging branch quality, not git mechanics.

---

## What this prompt does NOT do

- **It does not auto-curate numerical SOTA.** Saturation defaults to the qualitative-band escape hatch (§8.2). A follow-up `BATCH-DEEP-UPDATE` pass populates numbers once a curator places SOTA on the ceiling.
- **It does not author papers' authors / institutions.** `authors: []` / `institutions: []` are valid for fresh PaperSchema-conformant YAMLs (lib/schemas/paper.ts); the author/institution slug graph is filled in a separate Phase 2 cross-link audit pass.
- **It does not touch taxonomy, methodology, ADRs, app/components/lib code, or any config file.** If a candidate problem has nowhere to live in `content/taxonomy.yaml`, the candidate is dropped and the gap surfaces to the inbox for a human ADR call.
- **It does not push, merge, open PRs, or modify shared singletons.** The serial merger does all of that.
- **It does not run `pnpm build`, `pnpm test` (outside the pre-commit hook), `pnpm lint`, or `pnpm typecheck`.** Those write to `.next/` / `node_modules/.cache/` and would race across 20 sessions. `pnpm validate-content` is the only allowed tree-wide command.

---

_End of BATCH_GENERATION_PROMPT.md._
