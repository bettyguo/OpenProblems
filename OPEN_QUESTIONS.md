# Open Questions

Load-bearing decisions awaiting the human. Per `MASTER_PROMPT.md` §15.6: Claude Code surfaces ambiguity here rather than guessing. Items below are tracked with a `Status` field; resolved items remain in the file (struck through with a decision note) for audit.

Numbering: Q1–Q9 are verbatim from `MASTER_PROMPT.md` §17. Q10+ are added by Claude Code as work surfaces new ambiguity.

---

## Q1. Brand name

**Status:** open · **Surfaced:** MASTER_PROMPT.md §17 · **Blocks:** Phase 1 visual design (Unit 1.x).

Working title: *LLM OpenProblems*. Alternatives floated: *AIORatings*, *OpenAI-Problems*, *ResearchRatings*. A decision is needed before any logo / typography / accent work in Phase 1.

## Q2. Domain (DNS)

**Status:** open · **Surfaced:** §17 · **Blocks:** Vercel deployment configuration (Unit 0.12).

Placeholder in §5.10 is `llm-openproblems.org`. Confirm or replace.

## Q3. Hosting

**Status:** open · **Surfaced:** §17 / §5.10 · **Blocks:** Unit 0.12 (preview deploy).

Vercel is assumed by the stack rationale (Next.js native, ISR, edge runtime). Confirm.

## Q4. License

**Status:** open · **Surfaced:** §17 · **Blocks:** any public push of this repo.

- Code: MIT vs Apache-2.0 (Apache-2.0 gives explicit patent grant; MIT is simpler and more common in academic web tooling).
- Content (MDX + YAML in `content/`): CC-BY-4.0 recommended.

Until resolved, no `LICENSE` file is committed and the README states "all rights reserved".

## Q5. Primary brand accent

**Status:** open · **Surfaced:** §17 / §10.1 · **Blocks:** Unit 0.4 (design tokens).

Vermilion vs deep cyan. §17 says "Mock both, decide on the landing v1," but Unit 0.4 (design tokens) needs at least a placeholder. Proposal: stub the accent as a CSS custom property `--accent` and pick a default for Unit 0.4 that we can swap by editing one token.

## Q6. Bilingual rollout (FR / EN)

**Status:** open · **Surfaced:** §17 · **Blocks:** Phase 1 IA shape if EN-only is *not* the answer.

Phase 6 default; bring earlier? FR is the realistic primary candidate given Montréal. Decision affects `next-intl` / `next-i18n-router` choice and route shape (`/[locale]/...` vs no-locale).

## Q7. Editorial governance

**Status:** open · **Surfaced:** §17 · **Blocks:** §8.6 COI enforcement implementation.

Solo curator (PhD author) for Phase 1–3, then editorial board? Affects `editorial.primary_curator` schema field and the COI doc at `docs/methodology/coi.md`.

## Q8. arXiv-API rate-limit strategy

**Status:** open · **Surfaced:** §17 · **Blocks:** Phase 5 only.

OAI-PMH bulk + rate-limited live queries? Caching layer? Defer detail until Phase 5 planning.

## Q9. Methodology paper venue

**Status:** open · **Surfaced:** §17 · **Blocks:** nothing in code; affects framing.

ICLR Blog Track / NeurIPS D&B / position-paper workshop. Affects the tone and citation patterns we adopt in `content/methodology/v1.mdx`.

---

## Q10. "Eight phases" wording vs. seven rows

**Status:** open · **Surfaced:** Unit 0.0 THINK · **Blocks:** nothing critical; readability of `MASTER_PROMPT.md` itself.

Appendix A says "summarize the eight phases," but §12 lists 7 rows (0, 1, 2, 3, 4, 5, 6+). Options:

- (a) Split Phase 6+ into Phase 6 (Discussions / talk pages) and Phase 7 (API auth + i18n + monetization). 8 phases, matches Appendix A.
- (b) Edit Appendix A to say "seven phases."

## Q11. Subdomain id collisions across domains

**Status:** open · **Surfaced:** Unit 0.0 THINK · **Blocks:** Unit 0.6 (`content/taxonomy.yaml`) and Unit 0.10 (route stubs).

`representation-learning` appears under both `deep-learning` and `general-ml`. `robustness` appears under both `deep-learning` and `social-aspects`. `theory` is itself a top-level domain id *and* a subdomain id (under `deep-learning`). The default URL design `/domains/[domain]/[subdomain]` keeps each id scoped under its parent and is safe. But:

- Any flatten-to-global lookup (e.g., a future `/subdomains/[id]` page or a tag system) would collide.
- Search facets need to disambiguate.

Proposal: keep ids domain-scoped (default), forbid a global-only route, and add a `validate-content` rule that allows duplicate subdomain ids only when scoped under distinct parents. Confirm.

## Q12. Package manager

**Status:** decided 2026-05-14 (Unit 0.1 sign-off): **pnpm** · **Surfaced:** Unit 0.0 THINK · **Was blocking:** Unit 0.2.

`MASTER_PROMPT.md` §15.3 shows `pnpm typecheck && pnpm lint && pnpm test && pnpm validate-content` as the pre-push command, implying pnpm. Confirmed pnpm — workspace-aware, fast, ecosystem-standard for Next.js. Unit 0.2 will scaffold with `pnpm create next-app` and commit a `pnpm-lock.yaml`.

## Q13. Master prompt filename

**Status:** decided in Unit 0.0 · **Surfaced & resolved:** Unit 0.0.

Renamed `OpenProblems_MASTER_PROMPT.md` → `MASTER_PROMPT.md` to match the doc's self-references (Appendix A step 4, §6 repo structure). Done via `git mv` in this unit.
