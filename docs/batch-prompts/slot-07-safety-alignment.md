# Slot 07 — safety-alignment (BATCH-MIXED)

| Field        | Value                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| Mode         | `BATCH-MIXED`                                                                                                |
| Territory    | social-aspects/alignment, social-aspects/safety, social-aspects/accountability-transparency-interpretability |
| New problems | 18                                                                                                           |
| Updates      | scalable-oversight, mechanistic-interpretability                                                             |
| Curator      | `jikun`                                                                                                      |
| RUN_ID       | `2026-05-20T06-07-071a4d`                                                                                    |
| Branch       | `curate/BATCH-MIXED-safety-alignment-2026-05-20T06-07-071a4d`                                                |

**Subdomains the session may author into:**

- `social-aspects/alignment`
- `social-aspects/safety`
- `social-aspects/accountability-transparency-interpretability`

**Existing slugs to deep-research-update (if any):**

- `scalable-oversight`
- `mechanistic-interpretability`

---

## How to launch this slot

1. **Open a fresh Claude Code session** with working directory `c:\opensource\OpenProblems` (or the slot's git-worktree path — see `docs/batch-prompts/README.md` §"Worktree isolation (recommended for 20 sessions)").
2. **Verify** `git status` is clean and `git log --oneline -1` matches the other sessions' HEAD.
3. **Copy everything between the two `===PROMPT-START===` / `===PROMPT-END===` lines below** and paste it as your first user message. Nothing else needs to be typed.
4. **Let the session run unattended** (~60–120 min). It will branch, deep-research, author, commit one slug at a time, and stop with a final `Branch: …` summary. Do not interrupt unless it explicitly asks for input.
5. **Do not push, do not merge.** After all 20 slots finish, run the serial merge pass from `docs/BATCH_GENERATION_PROMPT.md` § "Serial merge pass" in a 21st session.

If the session aborts with a "working tree not clean" message: the session you opened landed in a directory where another session is mid-author. Use a worktree (README §"Worktree isolation") or wait for the other session to finish.

===PROMPT-START===
You are a content curator and researcher for LLM OpenProblems at c:\opensource\OpenProblems. The constitution is MASTER_PROMPT.md; the methodology is content/methodology/v1.mdx (v1.0.0); the parallel-safety contract is docs/CURATION_PROMPT.md (read its "Parallel-safety contract" section before doing anything else). You operate under §15.6 — NEVER invent leaderboard numbers, paper titles, paper authors, venues, dates, or rating scores. Every cited paper title must be verified via WebSearch / WebFetch against arXiv or the venue's public listing in this session; if you cannot verify, write `[unverified]` next to it and surface to the inbox. When in doubt, write TODO(curate) and route the question to docs/open-questions-inbox/<RUN-ID>.md.

== RUN PARAMETERS ==

MODE: BATCH-MIXED # BATCH-NEW | BATCH-DEEP-UPDATE | BATCH-MIXED
TERRITORY: social-aspects/alignment,social-aspects/safety,social-aspects/accountability-transparency-interpretability # comma-separated "domain/subdomain" pairs, e.g. # "optimization/convex,optimization/non-convex,optimization/stochastic,optimization/discrete-combinatorial"
TERRITORY_LABEL: safety-alignment # short kebab-case slug for branch name, e.g. "opt-cluster-a"
TARGET_NEW_COUNT: 18 # for BATCH-NEW or BATCH-MIXED; target across the whole campaign (8–22 typical; this session caps at 15, deferring any remainder via Step 2.5 + 6.5)
TARGET_UPDATE_SLUGS: scalable-oversight,mechanistic-interpretability # for BATCH-DEEP-UPDATE or BATCH-MIXED; comma-separated existing slugs to deeply re-research, "" if none
CURATOR: jikun # default `jikun`
RUN_ID: 2026-05-20T06-07-071a4d # YYYY-MM-DDTHH-MM-RAND6 (UTC, hyphens, no colons — Windows-safe)

== STEP 1 — BRANCH AND ORIENT ==

1.1. `git status --short` and `git log --oneline -8`. If the working tree is not clean, abort with one sentence to the user.
1.2. `git checkout -b curate/<MODE>-<TERRITORY-LABEL>-<RUN_ID>`. Never push, never merge.
1.3. Read, in order: - MASTER_PROMPT.md §3.1 (five rating dimensions), §8 (methodology), §15.6 (no-invent rule), §16 (seed exemplars). - docs/CURATION_PROMPT.md "Parallel-safety contract" + "Evidence formats" sections. - lib/schemas/{problem.ts, rating-action.ts, paper.ts, benchmark.ts, \_primitives.ts}. - content/taxonomy.yaml — verify every "domain/subdomain" pair in <TERRITORY> resolves to an existing pair; if any does not, abort and write to docs/open-questions-inbox/<RUN_ID>.md. - One existing problem as a shape reference: content/problems/hallucination-reduction/ (full folder).
1.4. List existing slugs in your territory: `git ls-files content/problems/ | sed -n 's|content/problems/\([^/]*\)/problem.yaml|\1|p'`. Read each one's problem.yaml to learn its title + subdomain. You must not duplicate an existing problem; you MAY cross-link new problems to existing ones via `related_problems`.

== STEP 2 — CANDIDATE-LIST + SLUG CLAIM (BATCH-NEW / BATCH-MIXED) ==

2.1. For each subdomain in <TERRITORY>, brainstorm 2–4 candidate open problems whose authoring is feasible from public literature. Each candidate must clear the §16-quality bar: - Substantive open research question (not a solved engineering problem, not a tool wishlist). - At least one recognised benchmark family or evaluation surface exists in the literature (you will name it but you will NOT cite numerical SOTA). - At least one survey or position paper from the last 4 years on or near the topic (you will verify this in Step 3 before committing the problem). - Not a near-duplicate of an existing slug in this repo (subjective; lean toward "yes it's distinct" if the rated dimensions would differ materially).
2.2. From the brainstorm, select **min(<TARGET_NEW_COUNT>, 15)** candidates spread across the subdomains in <TERRITORY> (aim for ≥ 1 per subdomain if N ≥ |subdomains|). The cap at 15 is the chunk-discipline rule from §2.5 — even when <TARGET_NEW_COUNT> is 50 or 80, this session authors at most 15 of them; the remainder is brainstormed but DEFERRED for a continuation session via Step 6.5.
2.3. Mint a kebab-case `<NEW-SLUG>` for each of the 15-or-fewer candidates you are authoring **this session**. Slug rules: lowercase letters / digits / hyphens; 3–6 words; concept-first, not adjective-first (`offline-rl-conservatism` not `conservative-offline-rl`); avoids overlap with existing slugs. Do NOT mint slugs for deferred candidates — leaving them un-claimed lets the continuation session claim them (or revise them based on what authored cleanly).
2.4. Write the slug-claim manifest at `docs/new-problem-claims/<RUN_ID>.md`:
`      ---
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
     `
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

3.1. Survey-anchor pass: - WebSearch with the working title + "survey" + a recent year range, e.g. `"<title-keywords> survey 2024..2026 arxiv"`. - WebSearch with the working title + "open problems" or "review", e.g. `"<title-keywords> open problems"`. - From the top 5 results, pick the 1–2 most authoritative (arXiv survey, ICLR/NeurIPS/ICML/ACL track paper, lab roadmap, NIST/standards-body report).
3.2. Benchmark / evaluation pass: - WebSearch for the canonical evaluation surface, e.g. `"<title-keywords> benchmark dataset"`. - Identify 1–4 named benchmarks. Each named benchmark must be confirmable from a public listing — Hugging Face datasets, Papers With Code legacy mirror, or the paper that introduces it. - Note the metric direction (higher-is-better vs. lower-is-better). Omit `upper_bound` unless a paper explicitly states a human-expert or theoretical ceiling.
3.3. Verification pass: - For each cited paper, WebFetch the arXiv abstract page (or the venue's official page) to verify the title, authors, and year. If WebFetch returns the abstract, you have ground truth. If it 404s or the title does not match, drop the citation. - Maintain a per-slug evidence ledger in your scratch (you will copy it into the rating-action's `signals_considered`).
3.4. Cross-link pass: - From existing slugs (Step 1.4), pick 0–3 that this new problem materially depends on or is depended on by. Add them to `related_problems` in the new problem.yaml. One-direction links are OK (the cross-link auditor handles symmetry later).
3.5. (Optional) HF MCP delegate: - If `mcp__claude_ai_Hugging_Face__paper_search` is available, run one query per slug with the working title and `days=730 top=5` to surface candidates the WebSearch passes missed. Treat results as additional signals, not as replacements for verification.
3.6. STOP CONDITION. If after Step 3 you have fewer than 3 verified primary sources for a slug, drop it from your batch. Note the drop in docs/open-questions-inbox/<RUN_ID>.md ("could not assemble defensible evidence for <SLUG> — recommend human triage"). It is better to ship 4 high-quality problems than 8 thin ones.

== STEP 4 — AUTHOR each new problem (BATCH-NEW / BATCH-MIXED) ==

For each verified `<NEW-SLUG>`, produce the five files in a single commit. Shape reference: content/problems/hallucination-reduction/.

4.1. `content/problems/<NEW-SLUG>/problem.yaml` — validates against OpenProblemSchema (lib/schemas/problem.ts):
`yaml
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
     `

4.2. `content/problems/<NEW-SLUG>/background.mdx` — 4–8 short paragraphs, frontmatter `{title, summary}`. Must: - State why the problem is open as of <YYYY-MM>. - Cite at least 2 of the verified sources from Step 3 inline by year + first author (e.g. "Smith et al., NeurIPS 2024 showed …"). Never cite a paper you did not verify. - Define key terms a non-specialist could need. - Avoid code blocks unless the problem is formal / algorithmic. - 300–600 words.

4.3. `content/problems/<NEW-SLUG>/definition.mdx` — formal or working definition, frontmatter `{title, summary}`. KaTeX is OK (`$inline$`, `$$display$$`). Must: - State the input, output, and success criterion in math or precise prose. - Define every symbol introduced. - Distinguish this problem's success criterion from adjacent problems (referenced via [[wikilink-slug]]). - 150–400 words.

4.4. `content/problems/<NEW-SLUG>/history.mdx` — chronology in 2–3 short paragraphs, frontmatter `{title, summary}`. Must: - Span at least 5 years of progress (or note explicitly when the problem is younger than 5 years). - Cite waves of work generically ("the 2020–22 retrieval-augmented wave") OR specifically (Step-3-verified paper IDs). - End with the present-day frontier as of <YYYY-MM>. - 200–500 words.

4.5. `content/problems/<NEW-SLUG>/ratings/<YYYY-MM-DD>-initial-<RUN_ID>.yaml` — validates against RatingActionSchema. ALL FIVE dimensions present (ADR-0005). Default confidences for a first pass: 0.5–0.7. Saturation rules: - If a defensible numeric ceiling exists and you can place SOTA on it, you may write `value: <0-100>` with a TODO(curate) note that the exact number needs human confirmation. - Otherwise, use the §8.2 N/A escape hatch: `value: null` + `qualitative_band: low|medium|high`. This is the preferred default for fresh problems where you have not done a leaderboard pass.
`yaml
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
     `

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
5.2. Deep-research the slug since `editorial.last_curated`: - WebSearch: `"<problem-title-keywords> 2025..2026 arxiv"`, `"<problem-title-keywords> SOTA 2025"`, `"<benchmark-name> leaderboard"`. - WebFetch the top 2–3 arXiv abstract pages to verify titles + dates. - HF MCP `paper_search` if available: `query="<title-keywords>" days=180 top=8`.
5.3. Apply the materiality test from CURATION_PROMPT.md §3U.a: - Difficulty: ≥ 1 letter-grade move. - Saturation: ≥ 10 points OR a band change (low → medium etc.). - Urgency / Value / Industry Call: ≥ 1 star move. - AND the evidence is from a top-tier venue, frontier-lab roadmap, ≥ 2 replications, or a regulator.
5.4. If nothing moves, emit only a curation log noting "no material change". Bias toward staying put — every emitted action is a public record.
5.5. If something moves, draft a new rating action at content/problems/<SLUG>/ratings/<YYYY-MM-DD>-<REASON>-<RUN_ID>.yaml. REASON ∈ {sota-bump, frontier-finding, watchlist-on, watchlist-off, methodology-refresh, regulator-signal}. Full snapshot of all five dimensions (ADR-0005). Confidence < 0.5 on any dim ⇒ set `watchlist: true`.
5.6. If your research surfaced an arXiv paper NOT already in content/papers/, AND that paper would be a primary signal for this slug's rating, ALSO author content/papers/<ARXIV-ID>.yaml in the same commit. Verify the arxiv_id is not already taken: `git ls-files content/papers/<ARXIV-ID>.yaml`. The paper YAML follows PaperSchema; `tldr` must be ≤ 400 chars and honest (no fabricated numbers); use `[TLDR pending human review]` if you cannot summarise without speculation.
5.7. Commit: `content(<SLUG>): <YYYY-MM-DD> <MODE> — <one-line summary>`. One commit per slug.

== STEP 6 — CURATION LOGS + INBOX FILES (always) ==

6.1. For each slug touched (new or updated), write content/problems/<SLUG>/.curation-log/<RUN_ID>.md. Schema per CURATION_PROMPT.md §5; include an "Evidence verified" section listing each WebFetch URL that confirmed a citation.
6.2. If any ambiguity surfaced (subdomain mismatch, two candidates that may be the same problem, missing benchmark protocol, etc.), append to docs/open-questions-inbox/<RUN_ID>.md (create if not present). One <RUN_ID>.md file per session, multiple Q-blocks inside it.
6.3. Write docs/changelog-inbox/<RUN_ID>.md with one bullet per commit that landed:
`      ---
     run_id: <RUN_ID>
     phase: <current-phase-number>
     ---
     - content(<KEY>): <one-line summary, past tense, ≤ 100 chars>
     - content(<KEY>): ...
     `
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
`      Branch: curate/<MODE>-<TERRITORY-LABEL>-<RUN_ID>  (HEAD: <SHORT-HASH>)
     New problems: <N-new>  (<comma-separated slugs>)
     Updated slugs: <M-updated>  (<comma-separated slugs or "none">)
     Verified sources: <K> across <N+M> commits
     Inbox files: open-questions-inbox/<RUN_ID>.md (<Q-count>), changelog-inbox/<RUN_ID>.md, new-problem-claims/<RUN_ID>.md
     Checkpoint: <docs/resume-checkpoints/<RUN_ID>.md (remaining: <remaining>) — paste its continuation prompt into a fresh session to resume>  OR  <"none — target met in single chunk">
     `
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
  ===PROMPT-END===
