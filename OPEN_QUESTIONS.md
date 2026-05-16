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

**Status:** decided-as-lean · **Surfaced:** Unit 4.0 THINK · **Refined:** Unit 5.12.

The original lean (URL search params `?d=domain-a,domain-b`) applies to the **full multi-select-dimming chip pattern** from Unit 4.0 D-6 interaction #4 — NOT the simpler "chip-as-navigation-link" shape Unit 4.4 actually shipped on `/`. Phase 4 deferred the full pattern (multi-select + dim non-matching nodes + URL-state) to Phase 6+ as a brushable-filter enhancement; the URL-persistence lean is still the working call **when** that pattern lands.

## Q39. DomainMap node accessibility on small viewports

**Status:** open · **Surfaced:** Unit 4.0 THINK · **Blocks:** Units 4.3 + 4.4 responsive behaviour and Unit 4.13 acceptance gate.

At viewport widths `< 640px` (mobile), 30+ force-layout nodes overlap meaningfully and become un-tappable. Lean: default to the `<details>` table-fallback on `< 640px` (still toggleable up to the viz via the disclosure). Re-evaluate after the first responsive smoke pass in Unit 4.3.

## Q40. ADR-0007 scope

**Status:** decided · **Surfaced:** Unit 4.0 THINK · **Resolved:** Unit 4.11 ([`docs/adr/0007-domainmap-rendering.md`](./docs/adr/0007-domainmap-rendering.md), accepted 2026-05-15).

ADR-0007 ships after Unit 4.2 to record the realized DomainMap rendering decisions. Two decision-clusters could plausibly split into separate ADRs: (a) SVG-vs-Canvas-vs-HTML-CSS, (b) the D3 sub-package import policy (tree-shaken vs umbrella). Lean was: single ADR covering both. **Confirmed in Unit 4.11**: ADR-0007 covers both as a single decision-cluster ("how we render force graphs in this codebase"); splitting would add bureaucratic overhead without architectural value.

## Q41. LLM model choice per Phase-5 script

**Status:** decided · **Surfaced:** Unit 5.0 THINK · **Resolved:** Unit 5.1 ([`docs/adr/0008-llm-provider-anthropic.md`](./docs/adr/0008-llm-provider-anthropic.md), accepted 2026-05-15).

Phase-5 CLIs (`ingest-arxiv`, `extract-leaderboard`, `build-digest`) make Anthropic API calls. Which Claude model is the default? ADR-0008 D-B pins the per-script defaults:

- `ingest-arxiv` → Sonnet 4.6 (fast + cheap for metadata + abstract → YAML)
- `extract-leaderboard` → Opus 4.7 (multi-table PDF parsing benefits from frontier capability)
- `build-digest` → Sonnet 4.6 (text summarisation; not capability-bound)

Every script accepts a `--model` CLI flag that overrides the default. Per the `claude-api` skill, the project tracks "latest and most capable" Claude models; a follow-on commit updates these defaults when a new flagship lands.

## Q42. Cost-cap default policy

**Status:** decided-as-lean · **Surfaced:** Unit 5.0 THINK · **Refined:** Unit 5.12 (post-Phase-5 close).

Phase-5 CLIs need a cost-governance posture. ADR-0008 D-C ([Unit 5.1](./docs/adr/0008-llm-provider-anthropic.md)) documented the **"no default cap"** working position: fresh installs that don't set `LLM_OPENPROBLEMS_DAILY_BUDGET_USD` get unbounded spend, but `--verbose` prints estimated-cost-before-call so the curator sees the cost line and can abort before the API call fires. Defense-in-depth: `--dry-run` lets curators iterate prompts without API cost.

Phase 5 shipped 2 LLM CLIs (Units 5.3 + 5.5) without user-facing cost issues from missing defaults. **Re-evaluate after 100 real ingest runs** reveal the actual per-call distribution. The promotion to `decided` happens organically when (a) 100 runs land OR (b) a curator hits a surprise bill that motivates a default-cap PR.

## Q43. PDF text-extraction cache

**Status:** decided · **Surfaced:** Unit 5.0 THINK · **Resolved:** Unit 5.4 (`lib/curate/pdf-text.ts`).

PDF re-fetches are expensive (~MB-per-paper network + parse cost). The lean (cache extracted text to disk) shipped in [Unit 5.4](./docs/thinking/5.4-pdf-text.md): `.pdf-cache/<arxiv-id>.json` (gitignored), text + `numPages` + `sourceUrl` + `fetchedAt`. `--no-cache` CLI flag bypasses. Module-singleton rate limiter (capacity 2, refill 1 token / 2000 ms) is separate from the arXiv-Atom-API bucket per Unit 5.4's note (different subdomains, different limits). One refinement vs. the original lean: cache the **JSON wrapper**, not bare `.txt` — lets us store `fetchedAt` + `sourceUrl` alongside the text.

## Q44. Digest RSS `<managingEditor>`

**Status:** decided-as-lean · **Surfaced:** Unit 5.0 THINK · **Refined:** Unit 5.12 (post-Unit-5.8 ship).

[Unit 5.8](./docs/thinking/5.8-digest-rss-endpoint.md) shipped the per-domain digest feeds **without** `<managingEditor>` per the lean. W3C feed validator emits a warning, not an error, when the field is missing — acceptable for Phase 5. Promotion to `decided` is gated on **Q33** (per-feed creator framing) **+ Q2** (DNS / email resolution): when a project email lands, both `/api/v1/rss.xml` and `/api/v1/digest/<domain>` get `<managingEditor>` in a single update PR.

## Q45. Route-path convention for dotted-suffix dynamic segments

**Status:** decided · **Surfaced:** Unit 5.8 (post-deviation observation) · **Resolved:** Unit 5.12.

Next.js 15 App Router supports both `[slug]/route.ts` (plain dynamic) and `[slug].xml/route.ts` (dynamic-plus-literal-suffix) folder conventions. Unit 5.0 planned the per-domain digest endpoint as `[domain].xml/route.ts` — the dotted-suffix shape — for URL-side discoverability (subscribers see `.xml` in the URL → "this is an XML feed"). [Unit 5.8](./docs/thinking/5.8-digest-rss-endpoint.md) deviated to plain `[domain]/route.ts`.

**Reasons** (from the Unit 5.8 deviation note):

- **Windows path quoting** + git's handling of `.` in directory names is inconsistent across Bash, PowerShell, and git-bash workflows. NTFS supports the path; the toolchain around it is the friction.
- **Test fixtures + CI path handling** complications were marginal but real.
- **Discoverability compensation**: `content-type: application/rss+xml` header + Unit 5.9's `/digest` hub `<link rel="alternate">` tags cover the auto-discovery use case.

**Decision**: future dynamic API routes use the plain `[<param>]/route.ts` convention. Concatenated dotted-suffix routes are forbidden by routing-style convention (no ADR — this is a code-style choice, not a load-bearing architectural decision). Override path: a future deliverable that genuinely requires `.xml` in the URL can re-evaluate (rare).

## Q46. Discussions backend (Giscus embed vs first-party GraphQL)

**Status:** decided · **Surfaced:** Unit 6.0 · **Resolved:** Unit 6.1.

Phase 6's first thread (per [6.0 prep doc](./docs/thinking/6.0-phase-6-prep.md) D-1) is GitHub Discussions integration. Two backends were viable for the comment UI: Giscus embed (iframe widget; community-maintained) or a first-party GraphQL build (server-rendered thread from the GitHub GraphQL API).

**Decision** (pinned in [ADR-0010](./docs/adr/0010-discussions-backend.md)): **Giscus embed for the comment UI + first-party GraphQL for the read-side metadata** (counts, last-activity-at, surfaced on problem cards + digest). Giscus handles the auth-via-GitHub UX without us building it; the GraphQL split gives us programmatic access for the metadata side. The two concerns are pinned independently so provider swaps on either side are one-file changes.

Six concrete contracts (ADR-0010 D-A through D-F): embed = Giscus; read-side = first-party GraphQL via `lib/discussions/github-graphql.ts`; per-problem mapping = pathname-based with lazy creation; token = `GITHUB_TOKEN` env with `public_repo` scope minimum; cache = `.github-cache/<query-hash>.json` (gitignored); moderation = defer to GitHub Discussions native.

## Q47. GitHub repository discussions enablement

**Status:** open (operational, not architectural) · **Surfaced:** Unit 6.0 · **Phase-6 hygiene reaffirmed:** Unit 6.9.

GitHub Discussions must be enabled in the `bettyguo/OpenProblems` repository settings for any Phase-6 Discussions surface to render live data. Requires owner action; out-of-band for docs units. Verified at Unit 6.9 hygiene pass: still open. Code-side handling is complete + graceful — Unit 6.2's GraphQL client + Units 6.5 / 6.6's env-safe wrappers (`tryGetDiscussionByPath` / `tryGetRecentDiscussionActivity`) all return null/[] without throwing, and Unit 6.4's embed renders an "embed unavailable" curator-facing message when `NEXT_PUBLIC_GISCUS_REPO_ID` is unset.

Not architectural; tracked as a gating operational checklist item. Unblocks (in order): repo-settings toggle → giscus.app config UI → set `NEXT_PUBLIC_GISCUS_REPO_ID` env on production deploy → set `GITHUB_TOKEN` in CI (auto-injected on GitHub Actions; verify the workflow has the correct permissions).

## Q48. Talk-page indexing posture

**Status:** resolved 2026-05-16 (Unit 7.8) · **Surfaced:** Unit 6.0 · **Refined:** Unit 6.9 · **Resolved:** Unit 7.8.

Should `/problems/<slug>/talk` pages be in the sitemap + linked from problem detail pages?

**Decision-half (linked from detail)**: **resolved Unit 6.3** — Unit 6.3 ships the "Discuss this problem →" link from `app/problems/[slug]/page.tsx`. Unit 6.5 upgraded the link with a parenthesized count when known.

**Decision-half (sitemap-included)**: **resolved Unit 7.8** — `app/sitemap.ts` + `lib/sitemap/build-sitemap.ts` now enumerate every `/problems/<slug>/talk` URL alongside the other problem sub-routes. Builder verified by `lib/sitemap/build-sitemap.test.ts` (10 talk URLs at HEAD for the 10 problems).

## Q49. Comment moderation routing

**Status:** decided · **Surfaced:** Unit 6.0 · **Resolved:** Unit 6.1 (codified in ADR-0010 D-F).

When a Giscus comment is flagged in the embed, where does the curator chain pick it up?

**Decision** (pinned in [ADR-0010 D-F](./docs/adr/0010-discussions-backend.md)): **defer entirely to GitHub Discussions' native moderation**. No first-party moderation queue alongside. Revisit only if curator workload signals a real backlog OR if moderation needs to flow into rating-action evidence chains (out-of-scope for Phase 6 v1; would warrant a future ADR).

ADR-0010 D-F language is the canonical statement; this entry is the OPEN_QUESTIONS-side cross-reference for searchers who reach this file first.

## Q50. i18n runtime choice

**Status:** decided · **Surfaced:** Unit 7.0 · **Resolved:** Unit 7.1.

Phase 7's first thread (per [7.0 prep doc](./docs/thinking/7.0-phase-7-prep.md) D-1) is bilingual rendering (FR primary, given the Montréal location signal in §13). Three viable runtimes: `next-intl` (App Router-canonical; mature; sub-path routing built-in); Paraglide.js (newer; TypeScript-first; smaller bundle); native Next.js i18n + custom translation system.

**Decision** (per [ADR-0011](./docs/adr/0011-i18n-strategy.md) D-A / D-B): **`next-intl`** as the runtime + **sub-path routing** (`/en/...`, `/fr/...`) + **JSON-per-locale message files** (`messages/en.json`, `messages/fr.json`). Default locale = `en`; bare URLs 308-redirect to the defaulted locale.

ADR-0011 also pins the surrounding decisions: D-C content-storage shape = sibling files (`*.fr.{yaml,mdx}`); D-D fallback chain = `fr → en` with a switch hint; D-E English-canonical slugs; D-F site-header locale-toggle UI; D-G `translation_source` provenance frontmatter on translated files.

## Q51. Bilingual content backfill cadence

**Status:** decided-as-lean · **Surfaced:** Unit 7.0.

Translating 30 papers + 10 problems + 5 domains + ~12 subdomains + 4 issue templates is curator-editorial work. The infrastructure (i18n runtime + content storage + locale routing) lands in Phase 7; the actual translation backfill happens incrementally.

**Lean**: **defer full content backfill to a curator-track that runs in parallel with future phases**. Phase 7 acceptance ships INFRASTRUCTURE complete (FR pilot on `/methodology` validates the pipeline end-to-end); CONTENT completion is a long-tail editorial workstream that doesn't block subsequent phases. New translations land via individual PRs over time.

## Q52. Translation provenance schema

**Status:** resolved 2026-05-16 (Unit 7.4) · **Surfaced:** Unit 7.0 · **Resolved:** Unit 7.4 (implementation) + Unit 7.1 (ADR pin).

When a curator commits a `*.fr.yaml` or `*.fr.mdx`, should we record machine-translation vs human-translation provenance?

**Decision** (per [ADR-0011](.\docs\adr\0011-i18n-strategy.md) D-G + Unit 7.4 implementation): yes — `translation_source: "human" | "machine-assisted"` frontmatter field; **required on translated files** (Velite post-transform `.refine` enforces); **absent on EN canonicals** (where it'd be tautological — the EN content IS the source). No default value — curators choose explicitly when authoring `.fr.{yaml,mdx}`.

Realized in code at HEAD: `TRANSLATION_SOURCES = ["human", "machine-assisted"]` constant in `velite.config.ts` applied to 5 collections (methodology, contributing, problemPages, problems, papers); `TranslationSourceSchema = z.enum(["human", "machine-assisted"])` in `lib/schemas/problem.ts` mirrored into `lib/schemas/paper.ts` (per Q31 dual-schema contract). Future translation-CLI (Phase 7+ enhancement) would draft FR content with `translation_source: "machine-assisted"` per the ADR-0009 D-F precedent.

## Q53. Curator authorship attribution per-locale

**Status:** resolved 2026-05-16 (Unit 7.1) · **Surfaced:** Unit 7.0 · **Resolved:** Unit 7.1 (ADR pin).

Should `editorial.primary_curator` (already on `problem.yaml`) be per-locale or stay global?

**Decision** (per [ADR-0011](.\docs\adr\0011-i18n-strategy.md) D-G): **global**. The curator chain (who decided X) doesn't fragment by locale; translation provenance ([Q52](#q52-translation-provenance-schema)) is a separate concern from authorship. Translation provenance answers "how did this rendered language come into being"; `primary_curator` answers "who is responsible for the editorial decision the text encodes". Two separate concerns.

No schema change required: `lib/schemas/problem.ts` already declares `primary_curator: z.string().min(1)` (single string, not per-locale). Q52's `translation_source` field carries the translation-specific provenance independently. Promoted on ADR-pin alone (matching the Q50 precedent — runtime choice was resolved by ADR-0011 D-A in Unit 7.1 before bulk implementation).
