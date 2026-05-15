# Open Questions

Load-bearing decisions awaiting the human. Per `MASTER_PROMPT.md` §15.6: Claude Code surfaces ambiguity here rather than guessing. Items below are tracked with a `Status` field; resolved items remain in the file (struck through with a decision note) for audit.

Numbering: Q1–Q9 are verbatim from `MASTER_PROMPT.md` §17. Q10+ are added by Claude Code as work surfaces new ambiguity.

---

## Q1. Brand name

**Status:** open · **Surfaced:** MASTER_PROMPT.md §17 · **Blocks:** Phase 1 visual design (Unit 1.x).

Working title: _LLM OpenProblems_. Alternatives floated: _AIORatings_, _OpenAI-Problems_, _ResearchRatings_. A decision is needed before any logo / typography / accent work in Phase 1.

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

**Status:** open · **Surfaced:** §17 · **Blocks:** Phase 1 IA shape if EN-only is _not_ the answer.

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

`representation-learning` appears under both `deep-learning` and `general-ml`. `robustness` appears under both `deep-learning` and `social-aspects`. `theory` is itself a top-level domain id _and_ a subdomain id (under `deep-learning`). The default URL design `/domains/[domain]/[subdomain]` keeps each id scoped under its parent and is safe. But:

- Any flatten-to-global lookup (e.g., a future `/subdomains/[id]` page or a tag system) would collide.
- Search facets need to disambiguate.

Proposal: keep ids domain-scoped (default), forbid a global-only route, and add a `validate-content` rule that allows duplicate subdomain ids only when scoped under distinct parents. Confirm.

## Q12. Package manager

**Status:** decided 2026-05-14 (Unit 0.1 sign-off): **pnpm** · **Surfaced:** Unit 0.0 THINK · **Was blocking:** Unit 0.2.

`MASTER_PROMPT.md` §15.3 shows `pnpm typecheck && pnpm lint && pnpm test && pnpm validate-content` as the pre-push command, implying pnpm. Confirmed pnpm — workspace-aware, fast, ecosystem-standard for Next.js. Unit 0.2 will scaffold with `pnpm create next-app` and commit a `pnpm-lock.yaml`.

## Q13. Master prompt filename

**Status:** decided in Unit 0.0 · **Surfaced & resolved:** Unit 0.0.

Renamed `OpenProblems_MASTER_PROMPT.md` → `MASTER_PROMPT.md` to match the doc's self-references (Appendix A step 4, §6 repo structure). Done via `git mv` in this unit.

## Q14. React Compiler opt-in timing

**Status:** open · **Surfaced:** Unit 0.2 THINK · **Blocks:** nothing in Phase 0; revisit at Phase 1 kickoff.

Next.js 15 supports the React 19 Compiler experimentally (via `experimental.reactCompiler` in `next.config.ts`). Lean: **defer to Phase 1+**. Reasons: (a) the compiler's behavior on heavy interactive viz code (D3, react-force-graph, Cytoscape.js — see §5.5) is undertested; (b) Phase 0 routes are RSC-only stubs where the compiler has no measurable effect; (c) opting in later costs a CHANGELOG entry, opting in now and out later costs a half-day of debugging. Revisit when Phase 1 visualization components start landing.

## Q15. Node version pin policy

**Status:** open · **Surfaced:** Unit 0.2 THINK · **Blocks:** nothing critical; affects CI image choice in Unit 0.11.

Pinned to Node `>=22 <24` in `package.json#engines.node` and `22` in `.nvmrc`. Two open sub-questions:

- (a) Pin to LTS Active (22 now, rotates to 24 in late 2026) or follow Node's latest LTS as it rolls?
- (b) When Node 24 hits LTS Active, do we treat the bump as ADR-class or routine? Lean: routine for the pin, but document any tooling incompat as an ADR if one surfaces.

## Q16. Font subset

**Status:** open · **Surfaced:** Unit 0.3 THINK · **Blocks:** nothing critical; revisit when first content with non-Latin characters lands.

`next/font/google` is currently loading the `latin` subset for Inter, Source Serif 4, and JetBrains Mono. When Phase 1 author / paper metadata arrives (names with diacritics — e.g., "Łukasz", "Müller", "François"), some glyphs will fall back to the system font and the visual register will break. Switching to `latin-ext` increases payload by ~20% per family but covers most European diacritics. Decide: expand to `latin-ext` proactively (now), reactively (when first diacritic appears in committed content), or never (deliberately ASCII-fold author names).

## Q17. shadcn/ui base color

**Status:** open · **Surfaced:** Unit 0.3 · **Blocks:** Unit 0.4 (design tokens) for the final color values.

Unit 0.3 installed shadcn/ui with `baseColor: "neutral"` (true grays, no hue cast) as a placeholder. Unit 0.4 will replace the palette anyway with the project's two-tone foundation (#0B0D10 / #FAFAF7 per MASTER_PROMPT §10.1) plus the brand accent (Q5). Confirm: keep `neutral` as the stated base for `components.json` (so future shadcn add commands get sensible defaults for any component the project doesn't override) or change to `slate` / `stone` / `zinc` / `gray` for a tinted base?

## Q18. Saturation N/A encoding

**Status:** open · **Surfaced:** Unit 0.5 THINK · **Blocks:** nothing in Phase 0; revisit at Phase 3 when SaturationCurve / MoversBoard land.

MASTER_PROMPT §8.2 says: "When no ceiling exists, mark Saturation = N/A and use a qualitative band (Low / Medium / High)." The Unit 0.5 `RatingActionSchema.dimensions.saturation` is strictly numeric (`value: z.number().min(0).max(100)`), with no N/A escape hatch. Phase 3 will need to either (a) extend the schema with `value: z.number().nullable()` plus a `qualitative_band` field, or (b) treat the qualitative case as a separate dimension variant via `z.discriminatedUnion`. Decision deferred to a Phase-3 ADR.

## Q19. `eslint-config-next` 16.x crash under ESLint 10 flat config

**Status:** open · **Surfaced:** Unit 0.8 · **Blocks:** Next-specific lint rules (`@next/next/no-img-element`, `no-html-link-for-pages`, image / link / `next/script` linters). Phase 0 routes are stub-shaped; the gap is tolerable until Unit 0.10.

Tried both the FlatCompat shim (`compat.config({ extends: ["next/core-web-vitals"] })`) and the direct flat-config import (`import nextCoreWebVitals from "eslint-config-next/core-web-vitals"`). Both surface the same `TypeError: Converting circular structure to JSON` from `@eslint/eslintrc/lib/shared/config-validator.js` under ESLint 10.3 + `eslint-config-next@16.2.6`. Likely a packaging bug in the upstream config (a plugin object reference is being JSON-serialized for validator output).

Decision deferred: re-enable when (a) the upstream issue is fixed, or (b) we author a hand-rolled minimal Next config (just the `@next/eslint-plugin-next` plugin with the rules we want) without pulling in the broken `eslint-config-next`. Track issue in next iteration. The `@next/eslint-plugin-next` package is already a transitive dep — we can flat-config it directly.

## Q25. JSON API envelope shape

**Status:** open · **Surfaced:** Unit 0.10 THINK · **Blocks:** Phase 1 API implementation (when `/api/v1/*` flips from 501 stubs to real handlers).

Phase 0 stubs return `{ endpoint, status: "not-implemented", phase: 0, message }` with HTTP 501. The canonical Phase 1+ envelope is undecided. Three plausible shapes:

- (a) JSON:API style: `{ data, meta, links }` — verbose but tooling-friendly.
- (b) Flat resource: `{ slug, title, ...fields }` for singletons; arrays for collections.
- (c) Hybrid: flat resources at `/api/v1/<entity>/<id>`, paginated `{ items, page, total }` for `/api/v1/<entity>`.

Lean: (c). Decide at Phase 1 kickoff before the first real API handler ships.

## Q26. Per-segment `not-found.tsx` strategy

**Status:** open · **Surfaced:** Unit 0.10 THINK · **Blocks:** nothing critical; revisit when first stub is replaced with a real resolver in Phase 1.

Phase 0 uses Next's default 404 for unknown paths. Phase 1 will start resolving dynamic segments against real content; missing slugs should 404 with a _helpful_ message ("No problem with slug `xyz` — see the index at /problems"). Two options:

- (a) Per-segment `not-found.tsx` co-located with `[slug]/page.tsx`. More files; richer messaging.
- (b) Single global `app/not-found.tsx` with conditional copy based on the current URL pathname.

Lean: (a) for problems / authors / papers / institutions (each has a natural "see the index" CTA); (b) global fallback for everything else.

## Q27. e2e + Lighthouse: advisory → required

**Status:** open · **Surfaced:** Unit 0.11 THINK · **Blocks:** Phase 1 acceptance gate.

`.github/workflows/e2e-lighthouse.yml` runs Playwright e2e and Lighthouse CI with `continue-on-error: true` in Phase 0 — they report status but don't block merges. Reason: Playwright browser install + Lighthouse perf are flaky on shared runners until baselines stabilize. At Phase 1 kickoff, flip `continue-on-error: false` once 3 consecutive PRs have passed without intervention.

## Q28. GitHub branch-protection rules

**Status:** open · **Surfaced:** Unit 0.11 THINK · **Blocks:** PR merge enforcement.

Branch-protection rules cannot be declared in code; they're configured on the repo via GitHub settings. Required Phase 0 checks: `verify` job (the fast-CI matrix), plus the `Conventional Commits` PR title check if enabled. Defer to first GitHub setup pass — likely happens at Phase 0 acceptance (Unit 0.12) when the repo is pushed to GitHub for the first preview deploy.
