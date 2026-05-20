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
    newCount: 8,
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
    newCount: 6,
    updates: "",
    suffix: "b2d493",
  },
  {
    id: "03",
    label: "dl-architecture",
    mode: "BATCH-MIXED",
    territory:
      "deep-learning/algorithms,deep-learning/graph-neural-networks,deep-learning/sequential-models",
    newCount: 6,
    updates: "compute-optimal-test-time-reasoning",
    suffix: "c3e547",
  },
  {
    id: "04",
    label: "dl-theory-robust",
    mode: "BATCH-NEW",
    territory: "deep-learning/theory,deep-learning/robustness,deep-learning/dl-other",
    newCount: 6,
    updates: "",
    suffix: "d4f6a8",
  },
  {
    id: "05",
    label: "rl-frontier",
    mode: "BATCH-MIXED",
    territory:
      "reinforcement-learning/deep-rl,reinforcement-learning/multi-agent,reinforcement-learning/policy-search",
    newCount: 6,
    updates: "multi-agent-llm-coordination",
    suffix: "e5072b",
  },
  {
    id: "06",
    label: "rl-offline-inverse",
    mode: "BATCH-NEW",
    territory:
      "reinforcement-learning/batch-offline,reinforcement-learning/inverse,reinforcement-learning/online,reinforcement-learning/planning,reinforcement-learning/rl-other",
    newCount: 6,
    updates: "",
    suffix: "f6183c",
  },
  {
    id: "07",
    label: "safety-alignment",
    mode: "BATCH-MIXED",
    territory:
      "social-aspects/alignment,social-aspects/safety,social-aspects/accountability-transparency-interpretability",
    newCount: 6,
    updates: "scalable-oversight,mechanistic-interpretability",
    suffix: "071a4d",
  },
  {
    id: "08",
    label: "safety-fairness",
    mode: "BATCH-NEW",
    territory:
      "social-aspects/fairness,social-aspects/privacy,social-aspects/robustness,social-aspects/security,social-aspects/social-other",
    newCount: 6,
    updates: "",
    suffix: "182b5e",
  },
  {
    id: "09",
    label: "applied-bio-health",
    mode: "BATCH-MIXED",
    territory: "applications/health-medicine,applications/neuroscience",
    newCount: 5,
    updates: "genome-foundation-models",
    suffix: "293c6f",
  },
  {
    id: "10",
    label: "applied-physical",
    mode: "BATCH-MIXED",
    territory: "applications/chem-phys-earth,applications/energy,applications/time-series",
    newCount: 5,
    updates: "operator-learning-foundation-models",
    suffix: "3a4d70",
  },
  {
    id: "11",
    label: "applied-perception",
    mode: "BATCH-NEW",
    territory: "applications/computer-vision,applications/language-speech,applications/robotics",
    newCount: 6,
    updates: "",
    suffix: "4b5e81",
  },
  {
    id: "12",
    label: "applied-social-mix",
    mode: "BATCH-NEW",
    territory: "applications/social-sciences,applications/applications-other",
    newCount: 4,
    updates: "",
    suffix: "5c6f92",
  },
  {
    id: "13",
    label: "genml-data-eval",
    mode: "BATCH-MIXED",
    territory: "general-ml/data,general-ml/evaluation,general-ml/methodology",
    newCount: 5,
    updates: "benchmark-integrity",
    suffix: "6d70a3",
  },
  {
    id: "14",
    label: "genml-causal-rep",
    mode: "BATCH-NEW",
    territory: "general-ml/causality,general-ml/representation-learning,general-ml/clustering",
    newCount: 5,
    updates: "",
    suffix: "7e81b4",
  },
  {
    id: "15",
    label: "genml-online-trans",
    mode: "BATCH-NEW",
    territory:
      "general-ml/online-active-bandits,general-ml/transfer-multitask-meta,general-ml/unsup-semisup,general-ml/supervised-learning",
    newCount: 6,
    updates: "",
    suffix: "8f92c5",
  },
  {
    id: "16",
    label: "genml-systems",
    mode: "BATCH-NEW",
    territory:
      "general-ml/hardware-software,general-ml/scalable-algorithms,general-ml/sequential-network-time-series,general-ml/kernel-methods,general-ml/general-ml-other",
    newCount: 5,
    updates: "",
    suffix: "90a3d6",
  },
  {
    id: "17",
    label: "opt-classical",
    mode: "BATCH-NEW",
    territory: "optimization/convex,optimization/non-convex,optimization/stochastic",
    newCount: 5,
    updates: "",
    suffix: "a1b4e7",
  },
  {
    id: "18",
    label: "opt-applied",
    mode: "BATCH-NEW",
    territory:
      "optimization/discrete-combinatorial,optimization/large-scale-parallel-distributed,optimization/zero-order-black-box,optimization/optimization-other",
    newCount: 5,
    updates: "",
    suffix: "b2c5f8",
  },
  {
    id: "19",
    label: "prob-methods",
    mode: "BATCH-NEW",
    territory:
      "probabilistic-methods/bayesian,probabilistic-methods/variational-inference,probabilistic-methods/monte-carlo-sampling,probabilistic-methods/gaussian-processes,probabilistic-methods/graphical-models,probabilistic-methods/spectral-methods,probabilistic-methods/structure-learning,probabilistic-methods/probabilistic-other",
    newCount: 6,
    updates: "",
    suffix: "c3d609",
  },
  {
    id: "20",
    label: "theory",
    mode: "BATCH-NEW",
    territory:
      "theory/dl-theory,theory/learning-theory,theory/rl-planning-theory,theory/optimization-theory,theory/game-theory,theory/probabilistic-theory,theory/online-bandits,theory/active-interactive,theory/domain-adaptation-transfer,theory/theory-other",
    newCount: 6,
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

const readme = `# Batch-prompts — 20 paste-ready slots

This directory contains **20 self-contained prompt files** ready to be pasted into 20 concurrent Claude Code sessions. Each file is one batch-curation run targeting a disjoint **territory** (a set of taxonomy subdomains) so the 20 sessions never collide on a slug.

Generated by \`scripts/generate-batch-prompts.mjs\` from the master template at [\`docs/BATCH_GENERATION_PROMPT.md\`](../BATCH_GENERATION_PROMPT.md). To refresh RUN_IDs (e.g., before a new burst):

\`\`\`pwsh
$env:RUN_ID_PREFIX = (Get-Date -AsUTC).ToString("yyyy-MM-ddTHH-mm")
node scripts/generate-batch-prompts.mjs
\`\`\`

## Expected burst output

| Slot count | New problems target | Existing slugs updated | Wall-clock |
| ---------- | ------------------- | ----------------------- | ---------- |
| 20         | **${totalNew}**     | **${totalUpdates}**     | ~60–180 min |

Today the repo has 10 problems / 30 papers. After one burst, expect ~${10 + totalNew} problems and a refreshed rating on every existing slug.

## Pre-flight (one-time, before opening any session)

1. **Repo is on \`main\` and tree is clean.**
   \`\`\`pwsh
   git switch main
   git status --short        # must be empty
   git pull --ff-only         # if you collaborate with a remote
   \`\`\`
2. **Dependencies installed.** \`pnpm install\` if you have not run it lately. The pre-commit hook runs \`pnpm test\` (~25 s), \`lint-staged\` (Prettier on staged \`.md\`/\`.yaml\`), and the ADR-0005 immutability check.
3. **Web tools enabled.** Each session does deep research via WebSearch + WebFetch. Confirm Claude Code's web tools are not disabled by settings.
4. **(Optional) Hugging Face MCP**. If \`mcp__claude_ai_Hugging_Face__paper_search\` is configured, sessions will use it for one extra paper-search pass per slug. Not required.

## Worktree isolation (recommended for 20 sessions)

Twenty Claude Code sessions in the same working directory will trip over one another the moment they run \`git checkout -b\`. The clean solution is a **per-slot git worktree** so each session has its own filesystem head.

\`\`\`pwsh
# One-time: create 20 worktrees under c:\\opensource\\OpenProblems-worktrees\\.
# Each shares the same .git/ but has its own HEAD and index.
$base = "c:\\opensource\\OpenProblems-worktrees"
New-Item -ItemType Directory -Force -Path $base | Out-Null
Get-ChildItem c:\\opensource\\OpenProblems\\docs\\batch-prompts -Filter 'slot-*.md' | ForEach-Object {
  $slotDir = Join-Path $base $_.BaseName    # e.g. slot-01-dl-lm-frontier
  if (-not (Test-Path $slotDir)) {
    git -C c:\\opensource\\OpenProblems worktree add $slotDir main
  }
}

# To clean up after the burst (after merging the branches you want):
# git -C c:\\opensource\\OpenProblems worktree remove c:\\opensource\\OpenProblems-worktrees\\slot-01-dl-lm-frontier
\`\`\`

When you open the Claude Code session for slot 01, point its working directory at \`c:\\opensource\\OpenProblems-worktrees\\slot-01-dl-lm-frontier\` rather than the main repo. The prompt's hardcoded \`c:\\opensource\\OpenProblems\` path still works as a *narrative* reference (MASTER_PROMPT.md is reachable via the same relative paths inside the worktree) — but the actual branch checkout happens in the worktree.

If you skip worktrees, you can still run all 20 sessions in the same directory, but commits will serialize at the OS file-lock level on \`.git/index\` and \`node_modules/.vitest\`. Throughput drops to ~1 commit/minute aggregate. Worktrees take throughput to ~5–10 commits/minute aggregate.

## Launching the 20 sessions

For each slot file (\`slot-01-…\` through \`slot-20-…\`):

1. Open a new Claude Code window/tab in the slot's worktree directory (or in \`c:\\opensource\\OpenProblems\` if you are not using worktrees).
2. Open the slot file in any editor.
3. Copy everything **between the \`===PROMPT-START===\` and \`===PROMPT-END===\` markers**.
4. Paste as your first message in the session and press Enter.
5. Repeat for the next slot. Spacing the launches by ~10 seconds smooths the initial \`pnpm test\` warm-up if you are sharing one tree.

You can also drive this from the orchestrator block at the bottom of \`docs/BATCH_GENERATION_PROMPT.md\` (PowerShell \`Start-Job\` per slot); the prompt-file approach is simply easier to operate by hand and easier to interrupt selectively.

## Slot index

| #  | File                                             | Mode             | New | Updates |
| -- | ------------------------------------------------ | ---------------- | --- | ------- |
${indexRows.join("\n")}

## What every session does (one-line summary)

1. \`git checkout -b curate/<MODE>-<LABEL>-<RUN_ID>\` — never pushes, never merges.
2. Reads MASTER_PROMPT.md §3.1 / §8 / §15.6 / §16, CURATION_PROMPT.md parallel-safety contract, schemas, taxonomy, the hallucination-reduction reference folder.
3. Brainstorms candidates inside its territory, writes \`docs/new-problem-claims/<RUN_ID>.md\` listing the slugs it plans to mint (collision-detection input for the merger).
4. For each candidate: WebSearch + WebFetch verification, drop any candidate with < 3 verified primary sources.
5. Authors the 5-file problem bundle (\`problem.yaml\`, \`background.mdx\`, \`definition.mdx\`, \`history.mdx\`, initial rating action with \`saturation: { value: null, qualitative_band: … }\` per ADR-0006 §8.2). One commit per slug.
6. For mixed-mode slots, deep-researches existing slugs and emits UPDATE/WATCH rating actions where the materiality test passes; never edits past rating files (ADR-0005).
7. Writes \`docs/changelog-inbox/<RUN_ID>.md\` and \`docs/open-questions-inbox/<RUN_ID>.md\` as needed; per-slug \`.curation-log/<RUN_ID>.md\`.
8. \`pnpm validate-content\`. Prints final \`Branch: …\` report. Exits.

## What to do after all 20 sessions finish

Open a **21st** session (any directory in the main worktree). Follow the **"Serial merge pass"** runbook at the bottom of [\`docs/BATCH_GENERATION_PROMPT.md\`](../BATCH_GENERATION_PROMPT.md):

1. Aggregate \`docs/new-problem-claims/*.md\` to detect cross-session slug collisions and rename if any.
2. Review each branch's \`.curation-log/<RUN_ID>.md\`. Drop branches whose log shows < 3 verified sources per slug.
3. \`git merge --no-ff\` each kept branch.
4. Lift \`docs/changelog-inbox/*.md\` bullets into \`CHANGELOG.md\` under the right Phase heading.
5. Lift \`docs/open-questions-inbox/*.md\` Q-blocks into \`OPEN_QUESTIONS.md\` with fresh Q-numbers.
6. \`git rm\` the inbox files. Final commit: \`chore(curation): merge <N> branches from batch <YYYY-MM-DD>\`.
7. \`pnpm validate-content && pnpm build\` for a final tree-wide gate (these are forbidden during the burst but mandatory at the merge boundary).

## Caveats

- **RUN_IDs in committed slot files are stable but stale-looking** (prefix \`${RUN_ID_PREFIX}\`). They are unique strings, not real timestamps; the session embeds them in branch + filenames. Regenerate with a fresh prefix any time you want today's timestamp baked in.
- **Two sessions sharing the same RUN_ID would write to the same paths**, which is why every slot has a distinct 6-hex suffix. Do not edit the suffixes by hand.
- **Saturation defaults to qualitative-band on initial ratings.** This is the most-honest default given §15.6. A follow-up \`BATCH-DEEP-UPDATE\` burst (re-run with mixed mode on existing slugs only) converts qualitative bands to numeric values where ceilings are defensible.
- **\`authors: []\` and \`institutions: []\` are permitted** in incidentally-authored paper YAMLs. The author/institution graph is filled in a Phase-2 cross-link pass.

`;

await fs.writeFile(path.join(OUT_DIR, "README.md"), readme);

console.log(`Wrote ${slots.length} slot files + README.md to ${OUT_DIR}`);
