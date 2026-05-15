# Open Questions

Load-bearing decisions awaiting the human. Per `MASTER_PROMPT.md` §15.6: Claude Code surfaces ambiguity here rather than guessing. Items below are tracked with a `Status` field; resolved items remain in the file (struck through with a decision note) for audit.

Numbering: Q1–Q9 are verbatim from `MASTER_PROMPT.md` §17. Q10+ are added by Claude Code as work surfaces new ambiguity.

> **Parallel curator workflow.** This file is a shared singleton — concurrent curation runs must **not** write here directly. They drop ambiguities into `docs/open-questions-inbox/<RUN-ID>.md` instead; a serial merge pass appends them as new Q-numbers below. See [`docs/CURATION_PROMPT.md`](./docs/CURATION_PROMPT.md) for the full parallel-safety contract.

---

## Q1. Brand name

**Status:** decided 2026-05-14 (Unit 1.0): **LLM OpenProblems** · **Surfaced:** MASTER_PROMPT.md §17.

Confirmed: the working title stands. Alternatives (_AIORatings_, _OpenAI-Problems_, _ResearchRatings_) closed.

## Q2. Domain (DNS)

**Status:** open · **Surfaced:** §17 · **Blocks:** Vercel deployment configuration (Unit 0.12).

Placeholder in §5.10 is `llm-openproblems.org`. Confirm or replace.

## Q3. Hosting

**Status:** open · **Surfaced:** §17 / §5.10 · **Blocks:** Unit 0.12 (preview deploy).

Vercel is assumed by the stack rationale (Next.js native, ISR, edge runtime). Confirm.

## Q4. License

**Status:** decided 2026-05-14 (Unit 1.0): **Apache-2.0** (code) + **CC-BY-4.0** (content) · **Surfaced:** §17.

- **Code → Apache-2.0.** Picked over MIT for the explicit patent grant — defensible for a project that intends a citable methodology paper and may attract downstream derivatives. Full text at [`LICENSE`](./LICENSE); `package.json#license = "Apache-2.0"` (SPDX).
- **Content (`content/`) → CC-BY-4.0.** Permissive attribution-required license, standard for academic-adjacent published content. Scope and canonical-text pointer at [`content/LICENSE.md`](./content/LICENSE.md).

## Q5. Primary brand accent

**Status:** decided 2026-05-14 (Unit 1.0): **deep cyan, HKU-green register, OKLCH hue 170°** · **Surfaced:** §17 / §10.1.

User direction: "deep cyan like the HKU green visuals (hku.hk)" — i.e., the cyan branch of Q5 but biased toward HKU's distinctive deep-teal green. Implemented as `--accent: oklch(0.5 0.1 170)` (light) and `oklch(0.7 0.13 170)` (dark) in `app/globals.css`. Vermilion alternative closed. `--ring` follows `--accent` for focus consistency. `--chart-saturation` was nudged from hue 160° → 140° in the same edit to preserve ≥ 30° hue separation from the accent.

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

**Status:** decided · **Surfaced:** Unit 0.5 THINK · **Resolved:** Unit 3.11 ([ADR-0006](./docs/adr/0006-saturation-na-encoding.md)).

MASTER_PROMPT §8.2 says: "When no ceiling exists, mark Saturation = N/A and use a qualitative band (Low / Medium / High)." [ADR-0006](./docs/adr/0006-saturation-na-encoding.md) picks **option (a)** — extends `SaturationDimensionSchema` with `value: z.number().min(0).max(100).nullable()` plus `qualitative_band: z.enum(["low", "medium", "high"]).optional()` plus a `.refine()` ensuring at least one is set. Additive change: all 20 v1.0 rating actions continue to validate unchanged (ADR-0005 immutability preserved). Future N/A-cases set `value: null` and pick a band. Velite mirror in `velite.config.ts` matches the shape (Zod-3 `.nullable()` is supported in Velite's bundled `s` factory).

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

**Status:** decided · **Surfaced:** Unit 0.11 THINK · **Resolved:** Unit 1.12 (Phase 1 acceptance gate, commit `939062c`).

`.github/workflows/e2e-lighthouse.yml` ran Playwright e2e and Lighthouse CI with `continue-on-error: true` through Phase 0 — advisory, not blocking. Unit 1.12 dropped `continue-on-error` from both jobs at Phase 1 kickoff: the Playwright nav spec + visual-regression baseline and the Lighthouse perf/a11y/SEO ≥ 95 thresholds on `/`, `/problems/[slug]`, `/domains/[domain]` are now PR-blocking. Follow-on: the Linux baseline for the RatingRadar visual snapshot must be captured on first CI run (only the `chromium-win32` baseline is committed) — one-shot `--update-snapshots` from a CI artifact, then commit the resulting `chromium-linux.png`.

## Q28. GitHub branch-protection rules

**Status:** open · **Surfaced:** Unit 0.11 THINK · **Blocks:** PR merge enforcement.

Branch-protection rules cannot be declared in code; they're configured on the repo via GitHub settings. Required Phase 0 checks: `verify` job (the fast-CI matrix), plus the `Conventional Commits` PR title check if enabled. Defer to first GitHub setup pass — likely happens at Phase 0 acceptance (Unit 0.12) when the repo is pushed to GitHub for the first preview deploy.

## Q29. Velite MDX plugin set

**Status:** open · **Surfaced:** Unit 1.1 THINK · **Blocks:** Unit 1.3 (methodology page).

Phase 1 needs KaTeX (inline + display math) and Shiki (code highlight) wired into Velite's MDX pipeline. Mermaid is listed in §5.4 but no Phase 1 deliverable requires it. Lean: wire KaTeX + Shiki in Unit 1.3 when the first MDX file lands; defer Mermaid until a content author asks for it.

## Q30. Snapshot publishing via `/api/v1/snapshot.json`

**Status:** open · **Surfaced:** Unit 1.1 THINK · **Blocks:** nothing in Phase 1; revisit when the 5 MB-gz trigger (ADR-0004) looms.

The `.velite/` JSON snapshot is the "static JSON snapshot the client consumes" of §5.7. Whether to also expose it publicly at `/api/v1/snapshot.json` (capped, gzipped) for third-party consumers — vs. keeping it server-side only — is a separate decision. Defer to Unit 1.10 (landing) or later.

## Q31. Velite + Zod 4 incompatibility

**Status:** open · **Surfaced:** Unit 1.1 CODE · **Blocks:** "no schema duplication" promise of ADR-0003.

Velite 0.3.1 bundles Zod 3 internally; its runtime calls `schema._parse(...)` which Zod 4 renamed. Passing a Zod-4 schema from `lib/schemas/*` directly to `defineCollection({ schema })` throws `schema._parse is not a function`. Workaround in Unit 1.1: duplicate the (small) taxonomy schema in `velite.config.ts` using Velite's bundled `s` factory. The canonical schemas in `lib/schemas/*` remain the source of truth, and `scripts/validate-content.ts` (Unit 0.7) cross-validates content against them — so any drift surfaces in CI on the next commit that authors content.

Action: track Velite upstream for Zod-4 support. When it ships, replace the `s.object({...})` blocks in `velite.config.ts` with direct imports from `@/lib/schemas/*` and close this question.

## Q32. `related_problems[]` symmetry — warning-class vs. error-class

**Status:** decided · **Surfaced:** Unit 2.11 (cross-link audit script) · **Resolved:** Unit 2.11 (commit `bc671ec`).

Per `scripts/cross-link-audit.ts` (Unit 2.11), if problem A lists B in `related_problems[]` but B does not list A back, the audit reports a **warning**, not an error. Rationale: editorial intent may legitimately be asymmetric (A "relates to" B without B "relating to" A — e.g., a niche problem points to a foundational one without the foundation pointing back to every niche descendant). The cross-link audit surfaces the asymmetry for human review but does not fail CI. Current count: 6 such asymmetric edges, all expected per editorial intent at HEAD ≈ `cfe0f6f`.

## Q33. RSS feed `<dc:creator>` / `<managingEditor>` shape

**Status:** open · **Surfaced:** Unit 3.0 THINK · **Blocks:** Unit 3.5 (JSON + RSS feeds).

RSS items conventionally name a person. Two slots: per-`<item>` `<dc:creator>` and channel-level `<managingEditor>`. Lean: item-level `<dc:creator>` = action's `curator` field directly (e.g. `jikun`); channel-level `<managingEditor>` = a project-level address once decided. W3C validator accepts a project-level email in `name@example.com (Name)` form. Surface when Unit 3.5 ships if no email is available — fall back to `noreply@<domain>` until Q2 resolves.

## Q34. Watchlist signal in the simulated revisions

**Status:** open · **Surfaced:** Unit 3.0 THINK · **Blocks:** Unit 3.7 (`MoversBoard`) rendering coverage.

§13 says MoversBoard tracks "watch-list additions". The `RatingActionSchema.watchlist` boolean is per-action; a watchlist-add is a `false → true` transition. No problems in the seed set have `watchlist: true` yet. Decision needed before Unit 3.7 ships: should at least one of the 5 simulated revisions in Unit 3.1 flip a watchlist to demonstrate the rendering? Lean: yes — flip `mechanistic-interpretability`'s q4 to `watchlist: true` (low confidence on a dimension's recent move makes a defensible watchlist signal).

## Q35. "Recompose" UI persistence to localStorage

**Status:** open · **Surfaced:** Unit 3.0 THINK · **Blocks:** Unit 3.10 (Recompose UI control).

The composite-weight Recompose control (`/problems` page, §13) stores weights in URL search params for shareability (Unit 3.0 D-6 default). Whether to also persist to localStorage so a return visit restores the user's last-used weights is open. Lean: defer to Phase 4 — URL-only keeps Phase 3 simple and avoids the SSR / hydration mismatch class of bugs that localStorage hydration introduces.

## Q36. Recompose UI scope — `/problems` only or cross-page

**Status:** open · **Surfaced:** Unit 3.0 THINK · **Blocks:** Unit 3.10 reach.

When the user re-weights via the Recompose control, do leaderboards on `/`, `/domains/[domain]`, `/domains/[domain]/[subdomain]` also re-sort, or is the recompose scoped to the `/problems` index page only? Lean: `/problems` only for Phase 3 — cross-page weight propagation needs a global state lift (Zustand / Context / URL-sync-across-pages) that's more architectural than scoping suggests. Phase 4 enhancement if user-research signals demand it.

## Q37. Issue-template form-field schemas

**Status:** open · **Surfaced:** Unit 4.0 THINK · **Blocks:** Units 4.7–4.10 (the 4 `.github/ISSUE_TEMPLATE/*.yml` files).

§13 names 4 templates: new-problem / new-paper / leaderboard-entry / rating-challenge. Each needs a field schema (form-based `.yml` per Unit 4.0 D-8). Lean: minimum-viable per template — 3–5 required fields covering the data needed to draft the corresponding YAML (e.g., for new-paper: arXiv ID, title, primary problem slug, lead-author ORCID; for new-problem: proposed slug, domain, one-paragraph statement, primary contributing paper) plus 2–4 optional context fields and a free-text "additional notes" textarea. Detailed schemas decided in the per-template THINK docs.

## Q38. Filter-chip URL persistence on DomainMap

**Status:** decided-as-lean · **Surfaced:** Unit 4.0 THINK · **Blocks:** Units 4.3 + 4.4 (DomainMap consumers).

Filter-chip selection on the `/domains` and `/` DomainMap surfaces — persist to URL search params (`?d=domain-a,domain-b`) for deep-link sharing, or keep ephemeral? Lean: **URL search params**, mirroring Unit 3.10's Recompose pattern. Confirmed in Unit 4.0 D-6. Override path: revert to ephemeral if hydration-mismatch issues surface during Unit 4.3 / 4.4 build-out.

## Q39. DomainMap node accessibility on small viewports

**Status:** open · **Surfaced:** Unit 4.0 THINK · **Blocks:** Units 4.3 + 4.4 responsive behaviour and Unit 4.13 acceptance gate.

At viewport widths `< 640px` (mobile), 30+ force-layout nodes overlap meaningfully and become un-tappable. Lean: default to the `<details>` table-fallback on `< 640px` (still toggleable up to the viz via the disclosure). Re-evaluate after the first responsive smoke pass in Unit 4.3.

## Q40. ADR-0007 scope

**Status:** decided-as-lean · **Surfaced:** Unit 4.0 THINK · **Blocks:** Unit 4.11 ADR shape.

ADR-0007 ships after Unit 4.2 to record the realized DomainMap rendering decisions. Two decision-clusters could plausibly split into separate ADRs: (a) SVG-vs-Canvas-vs-HTML-CSS, (b) the D3 sub-package import policy (tree-shaken vs umbrella). Lean: **single ADR covering both** — they form one decision-cluster ("how we render force graphs in this codebase") and splitting adds bureaucratic overhead without architectural value.
