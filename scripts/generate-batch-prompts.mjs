#!/usr/bin/env node
/**
 * Generate 20 ready-to-paste batch-curation prompts from the master
 * template at docs/BATCH_GENERATION_PROMPT.md.
 *
 * Reads the fenced prompt block out of the master file (single source of
 * truth) and substitutes only the RUN PARAMETERS block per slot — every
 * other `<…>` placeholder in the body is instructional and must remain
 * for the running session to interpret.
 *
 * Output:
 *   docs/batch-prompts/README.md
 *   docs/batch-prompts/slot-01-dl-lm-frontier.md
 *   ... through slot-20-theory.md
 *
 * Re-run any time you want to refresh RUN_IDs (e.g., before a new burst).
 *   RUN_ID_PREFIX=2026-05-21T09-00 node scripts/generate-batch-prompts.mjs
 *
 * Defaults to a stable RUN_ID prefix of 2026-05-20T17-00 so the committed
 * files have deterministic content.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "docs/BATCH_GENERATION_PROMPT.md");
const OUT_DIR = path.join(ROOT, "docs/batch-prompts");

const RUN_ID_PREFIX = process.env.RUN_ID_PREFIX ?? "2026-05-20T17-00";

const slots = [
  {
    id: "01",
    label: "dl-lm-frontier",
    mode: "BATCH-MIXED",
    territory:
      "deep-learning/large-language-models,deep-learning/attention-mechanisms,deep-learning/foundation-models",
    newCount: 22,
    updates:
      "hallucination-reduction,long-horizon-agent-reliability,long-context-rag,compute-optimal-test-time-reasoning",
    suffix: "a1c87f",
  },
  {
    id: "02",
    label: "dl-generative",
    mode: "BATCH-NEW",
    territory:
      "deep-learning/generative-models,deep-learning/self-supervised-learning,deep-learning/representation-learning",
    newCount: 14,
    updates: "",
    suffix: "b2d493",
  },
  {
    id: "03",
    label: "dl-architecture",
    mode: "BATCH-MIXED",
    territory:
      "deep-learning/algorithms,deep-learning/graph-neural-networks,deep-learning/sequential-models",
    newCount: 13,
    updates: "compute-optimal-test-time-reasoning",
    suffix: "c3e547",
  },
  {
    id: "04",
    label: "dl-theory-robust",
    mode: "BATCH-NEW",
    territory: "deep-learning/theory,deep-learning/robustness,deep-learning/dl-other",
    newCount: 10,
    updates: "",
    suffix: "d4f6a8",
  },
  {
    id: "05",
    label: "rl-frontier",
    mode: "BATCH-MIXED",
    territory:
      "reinforcement-learning/deep-rl,reinforcement-learning/multi-agent,reinforcement-learning/policy-search",
    newCount: 13,
    updates: "multi-agent-llm-coordination",
    suffix: "e5072b",
  },
  {
    id: "06",
    label: "rl-offline-inverse",
    mode: "BATCH-NEW",
    territory:
      "reinforcement-learning/batch-offline,reinforcement-learning/inverse,reinforcement-learning/online,reinforcement-learning/planning,reinforcement-learning/rl-other",
    newCount: 10,
    updates: "",
    suffix: "f6183c",
  },
  {
    id: "07",
    label: "safety-alignment",
    mode: "BATCH-MIXED",
    territory:
      "social-aspects/alignment,social-aspects/safety,social-aspects/accountability-transparency-interpretability",
    newCount: 18,
    updates: "scalable-oversight,mechanistic-interpretability",
    suffix: "071a4d",
  },
  {
    id: "08",
    label: "safety-fairness",
    mode: "BATCH-NEW",
    territory:
      "social-aspects/fairness,social-aspects/privacy,social-aspects/robustness,social-aspects/security,social-aspects/social-other",
    newCount: 12,
    updates: "",
    suffix: "182b5e",
  },
  {
    id: "09",
    label: "applied-bio-health",
    mode: "BATCH-MIXED",
    territory: "applications/health-medicine,applications/neuroscience",
    newCount: 12,
    updates: "genome-foundation-models",
    suffix: "293c6f",
  },
  {
    id: "10",
    label: "applied-physical",
    mode: "BATCH-MIXED",
    territory: "applications/chem-phys-earth,applications/energy,applications/time-series",
    newCount: 12,
    updates: "operator-learning-foundation-models",
    suffix: "3a4d70",
  },
  {
    id: "11",
    label: "applied-perception",
    mode: "BATCH-NEW",
    territory: "applications/computer-vision,applications/language-speech,applications/robotics",
    newCount: 16,
    updates: "",
    suffix: "4b5e81",
  },
  {
    id: "12",
    label: "applied-social-mix",
    mode: "BATCH-NEW",
    territory: "applications/social-sciences,applications/applications-other",
    newCount: 8,
    updates: "",
    suffix: "5c6f92",
  },
  {
    id: "13",
    label: "genml-data-eval",
    mode: "BATCH-MIXED",
    territory: "general-ml/data,general-ml/evaluation,general-ml/methodology",
    newCount: 12,
    updates: "benchmark-integrity",
    suffix: "6d70a3",
  },
  {
    id: "14",
    label: "genml-causal-rep",
    mode: "BATCH-NEW",
    territory: "general-ml/causality,general-ml/representation-learning,general-ml/clustering",
    newCount: 10,
    updates: "",
    suffix: "7e81b4",
  },
  {
    id: "15",
    label: "genml-online-trans",
    mode: "BATCH-NEW",
    territory:
      "general-ml/online-active-bandits,general-ml/transfer-multitask-meta,general-ml/unsup-semisup,general-ml/supervised-learning",
    newCount: 12,
    updates: "",
    suffix: "8f92c5",
  },
  {
    id: "16",
    label: "genml-systems",
    mode: "BATCH-NEW",
    territory:
      "general-ml/hardware-software,general-ml/scalable-algorithms,general-ml/sequential-network-time-series,general-ml/kernel-methods,general-ml/general-ml-other",
    newCount: 10,
    updates: "",
    suffix: "90a3d6",
  },
  {
    id: "17",
    label: "opt-classical",
    mode: "BATCH-NEW",
    territory: "optimization/convex,optimization/non-convex,optimization/stochastic",
    newCount: 9,
    updates: "",
    suffix: "a1b4e7",
  },
  {
    id: "18",
    label: "opt-applied",
    mode: "BATCH-NEW",
    territory:
      "optimization/discrete-combinatorial,optimization/large-scale-parallel-distributed,optimization/zero-order-black-box,optimization/optimization-other",
    newCount: 8,
    updates: "",
    suffix: "b2c5f8",
  },
  {
    id: "19",
    label: "prob-methods",
    mode: "BATCH-NEW",
    territory:
      "probabilistic-methods/bayesian,probabilistic-methods/variational-inference,probabilistic-methods/monte-carlo-sampling,probabilistic-methods/gaussian-processes,probabilistic-methods/graphical-models,probabilistic-methods/spectral-methods,probabilistic-methods/structure-learning,probabilistic-methods/probabilistic-other",
    newCount: 13,
    updates: "",
    suffix: "c3d609",
  },
  {
    id: "20",
    label: "theory",
    mode: "BATCH-NEW",
    territory:
      "theory/dl-theory,theory/learning-theory,theory/rl-planning-theory,theory/optimization-theory,theory/game-theory,theory/probabilistic-theory,theory/online-bandits,theory/active-interactive,theory/domain-adaptation-transfer,theory/theory-other",
    newCount: 16,
    updates: "",
    suffix: "d4e71a",
  },
];

const src = await fs.readFile(SRC, "utf8");
const fenceMatch = src.match(/\n````\n([\s\S]+?)\n````\n/);
if (!fenceMatch) {
  console.error(`Could not find the fenced prompt block in ${SRC}.`);
  process.exit(1);
}
const promptTemplate = fenceMatch[1];

await fs.mkdir(OUT_DIR, { recursive: true });

function substitute(template, slot, runId) {
  return template
    .replace("MODE: <MODE>", `MODE: ${slot.mode}`)
    .replace("TERRITORY: <TERRITORY>", `TERRITORY: ${slot.territory}`)
    .replace("TERRITORY_LABEL: <TERRITORY-LABEL>", `TERRITORY_LABEL: ${slot.label}`)
    .replace("TARGET_NEW_COUNT: <N>", `TARGET_NEW_COUNT: ${slot.newCount}`)
    .replace("TARGET_UPDATE_SLUGS: <SLUGS>", `TARGET_UPDATE_SLUGS: ${slot.updates}`)
    .replace("CURATOR: <CURATOR>", "CURATOR: jikun")
    .replace("RUN_ID: <RUN-ID>", `RUN_ID: ${runId}`);
}

const indexRows = [];

for (const slot of slots) {
  const runId = `${RUN_ID_PREFIX}-${slot.suffix}`;
  const filled = substitute(promptTemplate, slot, runId);
  const subdomainBullets = slot.territory
    .split(",")
    .map((s) => `- \`${s}\``)
    .join("\n");
  const updateBullets = slot.updates
    ? slot.updates
        .split(",")
        .map((s) => `- \`${s}\``)
        .join("\n")
    : "_(none — this slot only authors new problems)_";

  const slotFile = `# Slot ${slot.id} — ${slot.label} (${slot.mode})

| Field         | Value                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Mode          | \`${slot.mode}\`                                                                                  |
| Territory     | ${slot.territory.replaceAll(",", ", ")}                                                          |
| New problems  | ${slot.newCount}                                                                                  |
| Updates       | ${slot.updates ? slot.updates.replaceAll(",", ", ") : "(none)"}                                  |
| Curator       | \`jikun\`                                                                                         |
| RUN_ID        | \`${runId}\`                                                                                      |
| Branch        | \`curate/${slot.mode}-${slot.label}-${runId}\`                                                    |

**Subdomains the session may author into:**

${subdomainBullets}

**Existing slugs to deep-research-update (if any):**

${updateBullets}

---

## How to launch this slot

1. **Open a fresh Claude Code session** with working directory \`c:\\opensource\\OpenProblems\` (or the slot's git-worktree path — see \`docs/batch-prompts/README.md\` §"Worktree isolation (recommended for 20 sessions)").
2. **Verify** \`git status\` is clean and \`git log --oneline -1\` matches the other sessions' HEAD.
3. **Copy everything between the two \`===PROMPT-START===\` / \`===PROMPT-END===\` lines below** and paste it as your first user message. Nothing else needs to be typed.
4. **Let the session run unattended** (~60–120 min). It will branch, deep-research, author, commit one slug at a time, and stop with a final \`Branch: …\` summary. Do not interrupt unless it explicitly asks for input.
5. **Do not push, do not merge.** After all 20 slots finish, run the serial merge pass from \`docs/BATCH_GENERATION_PROMPT.md\` § "Serial merge pass" in a 21st session.

If the session aborts with a "working tree not clean" message: the session you opened landed in a directory where another session is mid-author. Use a worktree (README §"Worktree isolation") or wait for the other session to finish.

===PROMPT-START===
${filled}
===PROMPT-END===
`;

  await fs.writeFile(path.join(OUT_DIR, `slot-${slot.id}-${slot.label}.md`), slotFile);
  indexRows.push(
    `| ${slot.id} | [\`slot-${slot.id}-${slot.label}.md\`](./slot-${slot.id}-${slot.label}.md) | \`${slot.mode}\` | ${slot.newCount} | ${slot.updates ? slot.updates.replaceAll(",", ", ") : "—"} |`,
  );
}

const totalNew = slots.reduce((acc, s) => acc + s.newCount, 0);
const totalUpdates = slots.reduce(
  (acc, s) => acc + (s.updates ? s.updates.split(",").length : 0),
  0,
);

const readme = `# Batch-prompts — 20 paste-ready slots, 250-problem campaign

This directory contains **20 self-contained prompt files** ready to be pasted into 20 concurrent Claude Code sessions. Each file is one batch-curation run targeting a disjoint **territory** (a set of taxonomy subdomains) so the 20 sessions never collide on a slug.

Generated by \`scripts/generate-batch-prompts.mjs\` from the master template at [\`docs/BATCH_GENERATION_PROMPT.md\`](../BATCH_GENERATION_PROMPT.md). To refresh RUN_IDs before each new burst:

\`\`\`pwsh
$env:RUN_ID_PREFIX = [DateTime]::UtcNow.ToString("yyyy-MM-ddTHH-mm")
node scripts/generate-batch-prompts.mjs
\`\`\`

## Campaign target — 250 problems, the project's North Star

| Total slots | New problems target | Existing slugs updated | Bursts to complete | Total wall-clock |
| ----------- | ------------------- | ----------------------- | ------------------ | ---------------- |
| 20          | **${totalNew}**     | **${totalUpdates}**     | ~1.2 (one main + one short continuation) | 2–4 hours with worktrees |

Today the repo has 10 problems / 30 papers. After the campaign, expect ~${10 + totalNew} problems with ≥ 3 verified primary sources each and a refreshed rating on every existing slug.

**Why 250 and not more.** The 80-subdomain taxonomy's natural carrying capacity at the §15.6 quality bar (every entry needs 3+ verified primary sources) is 230–280. Historical precedent for canonical research-problem lists (Hilbert: 23, Smale: 18, Clay: 7, NLP-progress: ~80) shows quality, not count, earns trust. Papers-with-Code's failure at ~10K is the cautionary tale. Editorial sustainability for a 1–3 person board: 250 × 1–2 hr/quarter re-rating = ~500–1000 hr/year, feasible; ~10× that is not. See full audit in [\`docs/BATCH_GENERATION_PROMPT.md\`](../BATCH_GENERATION_PROMPT.md) §"20-session shard manifest".

**Burst shape:**

| Burst | Sessions | New problems landed | Cumulative | Notes |
| ----- | -------- | ------------------- | ---------- | ----- |
| 1 (main) | 20 in parallel | ~228 | ~228 | 16 slots ≤ 15 slugs complete in one shot; 4 high-density slots (01, 07, 11, 20) land 15 each and checkpoint the remainder |
| 2 (continuation) | 4 sessions | ~22 | **250** | Resumes the 4 deferred slots on the same parent branches via Step 6.5 |

## Pre-flight (once, before opening any session)

1. **Repo is on \`main\` and tree is clean.**
   \`\`\`pwsh
   git switch main
   git status --short        # must be empty
   git pull --ff-only         # if you collaborate with a remote
   \`\`\`
2. **Dependencies installed.** \`pnpm install\` if you have not run it lately. The pre-commit hook runs \`pnpm test\` (~25 s), \`lint-staged\` (Prettier on staged \`.md\`/\`.yaml\`), and the ADR-0005 immutability check.
3. **Web tools enabled.** Each session does deep research via WebSearch + WebFetch. Confirm Claude Code's web tools are not disabled by settings. At 1000 problems × 3+ verified sources each, the campaign issues several thousand web calls in aggregate — within Opus 4.7's tool-call budget but plan for it.
4. **(Optional) Hugging Face MCP.** If \`mcp__claude_ai_Hugging_Face__paper_search\` is configured, sessions will use it for one extra paper-search pass per slug.
5. **Worktrees set up** (next section). At this scale (~1000 commits across 20 branches), running all sessions in the same working directory makes commit throughput unworkable.

## Worktree isolation (mandatory for the 1000-problem campaign)

Twenty Claude Code sessions in the same working directory will trip over one another the moment they run \`git checkout -b\`, and at 1000 commits the \`.git/index\` lock contention becomes the dominant cost. Use one git worktree per slot:

\`\`\`pwsh
# One-time setup: 20 worktrees under c:\\opensource\\OpenProblems-worktrees\\
# Each shares the same .git/ but has its own HEAD, index, and lock files.
# Use --detach because main is already checked out by the primary worktree;
# each session's Step 1.2 (git checkout -b curate/...) leaves detached state.
$base = "c:\\opensource\\OpenProblems-worktrees"
New-Item -ItemType Directory -Force -Path $base | Out-Null
Get-ChildItem c:\\opensource\\OpenProblems\\docs\\batch-prompts -Filter 'slot-*.md' | ForEach-Object {
  $slotDir = Join-Path $base $_.BaseName    # e.g. slot-01-dl-lm-frontier
  if (-not (Test-Path $slotDir)) {
    git -C c:\\opensource\\OpenProblems worktree add --detach $slotDir main
  }
}

# After the entire campaign + merge pass finishes (NOT between bursts):
# git -C c:\\opensource\\OpenProblems worktree remove c:\\opensource\\OpenProblems-worktrees\\slot-01-dl-lm-frontier
\`\`\`

For chunk-2 / chunk-3 continuation sessions, **re-use the same worktree** for the slot. The branch is already checked out there from chunk 1, and the continuation prompt's \`git checkout curate/...\` finds the same branch ref.

Throughput: with worktrees, expect **~5–10 commits/minute aggregate** across the 20 sessions (limited by vitest in pre-commit). Without worktrees, ~1 commit/minute — meaning chunk 1 alone takes 5+ hours instead of ~60–90 minutes.

## Burst 1: launching the initial 20 sessions

For each slot file (\`slot-01-…\` through \`slot-20-…\`):

1. Open a new Claude Code window/tab with working directory \`c:\\opensource\\OpenProblems-worktrees\\slot-NN-<label>\`.
2. Open the slot file (in the main repo or the worktree, either works for reading).
3. Copy everything **between the \`===PROMPT-START===\` and \`===PROMPT-END===\` markers**.
4. Paste as your first message in the session and press Enter.
5. Repeat for the next slot. Spacing launches by ~10 seconds smooths the initial \`pnpm test\` warm-up.

Sessions run unattended for ~60–90 minutes each. Each authors ~15 new slugs, then either declares the slot complete (low-target slots like slot 12 with 30) OR writes a resume checkpoint at \`docs/resume-checkpoints/<RUN_ID>.md\` containing a paste-ready continuation prompt for burst 2.

## Bursts 2, 3, 4: continuation sessions

After burst 1 finishes, identify which slots still have remaining work:

\`\`\`pwsh
# List all checkpoints; "remaining: 0" means the slot is done.
Select-String -Path c:\\opensource\\OpenProblems\\docs\\resume-checkpoints\\*.md -Pattern '^remaining:'
\`\`\`

For each checkpoint with \`remaining > 0\`:

1. Open a fresh Claude Code session in the **same worktree** as the parent session (the branch is already checked out there from burst 1).
2. Open the matching \`docs/resume-checkpoints/<RUN_ID>.md\` checkpoint file.
3. Copy the fenced \`CONTINUATION PROMPT\` block from inside the checkpoint (the parent session wrote it for you, with the carry-over evidence scratchpad and deferred-candidate list).
4. Paste into the new session. It will \`git checkout\` the existing branch (NOT \`-b\`), read the checkpoint, and author the next ~15 slugs with RUN_ID suffix \`-c2\` (or \`-c3\`, \`-c4\` for subsequent bursts).
5. The continuation session writes its own checkpoint if it still defers candidates, so this loop is self-perpetuating until a slot's \`remaining\` reaches 0.

Each continuation session also takes ~60–90 minutes. With worktrees, run all 20 simultaneously.

## Slot index

| #  | File                                             | Mode             | New | Update slugs |
| -- | ------------------------------------------------ | ---------------- | --- | ------------ |
${indexRows.join("\n")}

## What every session does (one-line summary)

1. \`git checkout -b curate/<MODE>-<LABEL>-<RUN_ID>\` (chunk 1) OR \`git checkout curate/<MODE>-<LABEL>-<RUN_ID>\` (chunk 2+) — never pushes, never merges.
2. Reads MASTER_PROMPT.md §3.1 / §8 / §15.6 / §16, CURATION_PROMPT.md parallel-safety contract, schemas, taxonomy, the hallucination-reduction reference folder.
3. Brainstorms candidates inside its territory, picks the first 15 (Step 2.5 chunk discipline), writes \`docs/new-problem-claims/<RUN_ID>.md\` listing the claimed slugs.
4. For each claimed candidate: WebSearch + WebFetch verification, drop any candidate with < 3 verified primary sources.
5. Authors the 5-file problem bundle (\`problem.yaml\`, \`background.mdx\`, \`definition.mdx\`, \`history.mdx\`, initial rating action with \`saturation: { value: null, qualitative_band: … }\` per ADR-0006 §8.2). One commit per slug.
6. For mixed-mode slots in chunk 1: deep-researches existing slugs and emits UPDATE/WATCH rating actions where the materiality test passes; never edits past rating files (ADR-0005). Chunk 2+ skips this step.
7. Writes \`docs/changelog-inbox/<RUN_ID>.md\` and \`docs/open-questions-inbox/<RUN_ID>.md\` as needed; per-slug \`.curation-log/<RUN_ID>.md\`.
8. If \`target_total > authored\`: writes \`docs/resume-checkpoints/<RUN_ID>.md\` with deferred candidates + carry-over evidence + a paste-ready continuation prompt; commits the checkpoint.
9. \`pnpm validate-content\`. Prints final \`Branch: … Checkpoint: …\` report. Exits.

## What to do after the final continuation session

Open a **merge** session in the main worktree (\`c:\\opensource\\OpenProblems\`). Follow the **"Serial merge pass"** runbook at the bottom of [\`docs/BATCH_GENERATION_PROMPT.md\`](../BATCH_GENERATION_PROMPT.md). Key differences from the smaller-batch merge:

1. **Run the merge ONLY once**, after the final chunk of every slot completes — NOT between bursts. Each slot accumulates 3–4 chunks of commits on the same branch by design.
2. **Aggregate \`docs/resume-checkpoints/*.md\` first** to confirm every slot has \`remaining: 0\` (or to consciously accept that some slots stopped short, e.g., at ~600/1000 if quality bar tightened).
3. **\`git merge --no-ff\`** each kept branch — the merge picks up all chunks because they share the branch.
4. **Aggregate inbox files**: \`open-questions-inbox/*.md\` → \`OPEN_QUESTIONS.md\`, \`changelog-inbox/*.md\` → \`CHANGELOG.md\`. With ~80 inbox files (20 slots × ~4 chunks), expect a long aggregation pass.
5. **Cross-link audit** (\`pnpm tsx scripts/cross-link-audit.ts\`) — at 1000 problems, expect dozens of asymmetric \`related_problems\` links. Symmetrise them in a follow-up unit, not in the merge commit.
6. **Final \`pnpm validate-content && pnpm build\`** — these are forbidden during bursts but mandatory at the merge boundary.

Budget 2–4 hours for the merge pass at this scale.

## Caveats

- **RUN_IDs in committed slot files are stable but stale-looking** (prefix \`${RUN_ID_PREFIX}\`). They are unique strings, not real timestamps. Regenerate with a fresh prefix any time you want today's timestamp baked in.
- **Two sessions sharing the same RUN_ID would write to the same paths**, which is why every slot has a distinct 6-hex suffix. Do not edit the suffixes by hand.
- **Chunk discipline (Step 2.5) is non-negotiable.** Even with 1M-context Opus, authoring 50+ slugs in one session degrades quality. The 15-slug cap is calibrated from web-research + file-generation budget per slug.
- **Saturation defaults to qualitative-band on initial ratings.** This is the most-honest default given §15.6. A follow-up \`BATCH-DEEP-UPDATE\` campaign converts qualitative bands to numeric values once curators place SOTA on the ceiling.
- **\`authors: []\` and \`institutions: []\` are permitted** in incidentally-authored paper YAMLs. The author/institution graph is filled in a Phase-2 cross-link pass.
- **The 1000-problem target is aspirational.** Some narrow subdomains (kernel methods, certain optimization subspecialties) may saturate at 10–15 quality problems before the well runs dry. A session that ships fewer than its target with an inbox note explaining why is still a successful session — quality > volume (\`docs/BATCH_GENERATION_PROMPT.md\` absolute guardrails).

`;

await fs.writeFile(path.join(OUT_DIR, "README.md"), readme);

console.log(`Wrote ${slots.length} slot files + README.md to ${OUT_DIR}`);
