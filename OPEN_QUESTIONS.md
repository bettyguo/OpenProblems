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

**Status:** decided-as-lean · **Surfaced:** Unit 7.0 · **Refined:** Unit 8.8.

Translating 30 papers + 10 problems + 5 domains + ~12 subdomains + 4 issue templates is curator-editorial work. The infrastructure (i18n runtime + content storage + locale routing) lands in Phase 7; the actual translation backfill happens incrementally.

**Lean** (refined Unit 8.8 post-Phase-8 close): **defer full content backfill to a curator-track that runs in parallel with future phases**. Phase 7 acceptance ships INFRASTRUCTURE complete (FR pilot on `/methodology` validates the pipeline end-to-end); Phase 8 acceptance ships ROUTE coverage (Unit 8.1 bulk migration; every page route has a `[locale]/` shadow under `localePrefix: "always"`) + TWO content surfaces translated as pilots (home hero in Unit 8.2 via `messages.home.*`; `/contributing/v1.1` in Unit 8.6 via sibling-file MDX). Remaining ~200 EN files (problems / papers / per-problem MDX / issue-template forms) are the curator-track horizon. Promotion to `resolved` deferred until either bulk content backfill lands (cadence proven by ~50%+ surface coverage) or §13 ledger explicitly retires the bilingual thread without further content work.

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

## Q54. GitHub OAuth app registration

**Status:** open (operational, not architectural) · **Surfaced:** Unit 9.0 · **Blocks:** Unit 9.4 auth wrapper smoke; Unit 9.6 watchlist write-path end-to-end smoke; Phase-9 acceptance gate's "OAuth flow end-to-end" check.

The Phase-9 auth thread depends on a registered GitHub OAuth app. Operational gate (mirrors Q47 for Discussions) — requires the curator-of-record to:

1. Register the OAuth app under the `bettyguo` GitHub org with `Homepage URL: https://llm-openproblems.org` (Q2 placeholder; may shift when DNS lands), `Authorization callback URL: https://llm-openproblems.org/api/auth/callback/github` (NextAuth.js v5 default callback path under `localePrefix: "always"` middleware).
2. Generate the OAuth app's Client ID + Client Secret.
3. Store `AUTH_GITHUB_ID` + `AUTH_GITHUB_SECRET` + `AUTH_SECRET` (a 32-byte base64 secret generated via `openssl rand -base64 32` or `npx auth secret`) in Vercel project env (production + preview scopes). Auth.js v5 auto-detects these by canonical names; provider config in `lib/auth/index.ts` invokes `GitHub` without explicit args (Unit 9.4 commit).
4. Add a separate OAuth app for local-dev (`http://localhost:3000` Homepage + `http://localhost:3000/api/auth/callback/github` callback).
5. Optionally: a third OAuth app per-curator for individual local-dev (so multiple curators don't share secrets).

Until resolved, Unit 9.4's auth wrapper code lands BUT can't smoke against a real OAuth flow; Unit 9.6's watchlist toggle UI lands BUT can't be exercised end-to-end. Each unit's smoke gate documents the operational deferral.

**Lean**: same-day curator unblock at Unit 9.4 if possible; otherwise unit ships in "infrastructure-complete, awaiting OAuth app" state and the acceptance-gate (9.9) records the carryover.

## Q55. DB hosting tier for production

**Status:** open (operational) · **Surfaced:** Unit 9.0 · **Blocks:** Phase-9 acceptance gate's "DB persists across requests" check; Phase-9 LHCI run latency baseline.

Per [ADR-0013](./docs/adr/0013-db-choice.md) (TBD; lean Unit 9.2): Turso/libSQL free tier supports project scale (500 databases / 8 GB total / 1 billion row reads/month). For production, we need to:

1. Decide between a single Turso database (single-tenant) vs branched databases (one per preview deploy via Turso branching).
2. Set production tier upgrade trigger (e.g., monthly active users > X → upgrade to paid tier).
3. Decide on backup/snapshot cadence.

**Lean**: single Turso database (single-tenant); free tier indefinitely; manual snapshot on every preview deploy via `pnpm db:snapshot` script (deferred follow-on). Phase 9 acceptance ships with free-tier; tier upgrade decision deferred to a Phase 10+ Q-promotion if user count grows.

## Q56. Watchlist table key shape

**Status:** resolved 2026-05-16 (Unit 9.6): **`problemSlug` plain text column with no FK; composite primary key on `(userId, problemSlug)`; FK only on `userId` → `user.id` with `ON DELETE cascade`** · **Surfaced:** Unit 9.0 · **Resolved:** Unit 9.6.

For the Unit 9.6 watchlist write-path: does `problem_slug` reference `content/problems/<slug>/problem.yaml` (file-system) or a `problems` Drizzle table (DB)?

**Decision** (mirrors Unit 9.0 lean verbatim — landed without redirection at code time): keep `problemSlug` as a plain `text` column with no FK constraint; `content/problems/` stays the source of truth for problem metadata; the DB table is the source of truth for **user-specific state only** (watchlist memberships, future user preferences, rating-challenge drafts). File-first / no-DB-for-content ([ADR-0004](docs/adr/0004-file-first-no-db.md)) preserved — Phase 9 added a USER-STATE DB layer per [ADR-0013](docs/adr/0013-db-choice.md) D-F; it does NOT migrate content into the DB.

Realized in Unit 9.6's `lib/db/migrations/0001_watchlist.sql`:

```sql
CREATE TABLE `watchlist` (
    `userId` text NOT NULL,
    `problemSlug` text NOT NULL,
    `createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
    PRIMARY KEY(`userId`, `problemSlug`),
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
```

No FK on `problemSlug` (file-system reference); orphan entries (problemSlug pointing at a deleted `content/problems/<slug>/problem.yaml`) handled via a periodic cleanup script (deferred follow-on per ADR-0013 D-F; orphan tolerated until script lands).

## Q57. Rating-challenge curator review pipeline shape

**Status:** resolved 2026-05-16 (Unit 12.1): pinned in [ADR-0014](./docs/adr/0014-curator-review-pipeline.md) — state machine (`submitted → under_review → accepted | rejected | withdrawn` + fast lanes) + env-var allowlist authz (`LOP_CURATOR_LOGINS`) + simplified COI (curator ≠ submitter hard block; curator ≠ `primary_curator` soft warn; full §8.6 24-mo collaborator check deferred to Phase 13+) + manual rating-action YAML emission (UI surfaces "Attach action YAML" form post-acceptance; preserves curator-of-record semantics; CLI / web-side automation deferred Phase 13+/14+) + page-local auth + ALTER migration discipline (`0003_rating_challenge_review` is the project's first ALTER migration). · **Surfaced:** Unit 11.0 prep + Unit 11.5 hygiene (Class A item 1) · **Resolved:** Unit 12.1 (ADR-0014 acceptance).

[Unit 11.0 D-3 + D-4](./docs/thinking/11.0-phase-11-prep.md) deferred the curator-review pipeline to Phase 12+ explicitly. Phase 11 ships rating-challenge **submission only**: any signed-in user can `POST /api/v1/rating-challenges` (or use the inline form on `/[locale]/problems/[slug]`), and Phase-11 Unit 11.4's profile-page extension lists the user's own submissions. No curator-facing surface exists for triage / status transitions / acceptance.

What the curator review pipeline needs to decide (Phase 12+ architectural questions):

- **Status transitions**: `submitted → under_review → accepted | rejected | withdrawn`. Today `ratingChallenges.status` defaults to `"submitted"` per Unit 11.1; Phase 11 never writes any other value. Phase 12+ migration (likely `0003_rating_challenge_review`) adds the curator-review columns deferred per Unit 11.0 D-3: `reviewedAt`, `reviewerId` (FK to `users` with cascade-or-set-null), `reviewNotes`, plus the policy decision around `acceptedActionId` (pointer to the rating-action YAML file emitted on acceptance OR a free-text path; see below).
- **Acceptance → rating-action YAML**: when a curator accepts a challenge, a new rating-action YAML lands in `content/problems/<slug>/ratings/<date>-<slug>.yaml`. This is editorial content, not USER-STATE, so the WRITE happens in the file-system (likely a CLI helper invoked by the curator, similar to Phase-5's `extract-leaderboard.ts` shape), NOT directly from the API route. The DB `ratingChallenges.acceptedActionId` would then point at the emitted YAML filename. Preserves ADR-0004 file-first for content.
- **COI policy enforcement** per §8.6: "A curator must not rate a problem where they (or their direct collaborators within the last 24 months) hold a current leaderboard top-5 entry." Application to challenges: should the SAME curator who would normally rate a problem be allowed to review a challenge to THAT rating? Two viable shapes — (a) inherit the same COI rule (curator cannot review a challenge for a problem where COI applies); (b) relax for challenges since review is meta-rating rather than rating itself. Lean: inherit; conservatism over expediency.
- **Curator-admin route shape**: `/[locale]/curator/challenges`? `/admin/...`? Auth-aware route protection escalates from "page-local server-component check" (Phase 10 + 11 pattern) to "middleware-based" (Phase-9 Class B item 12 follow-on) when 3+ protected routes exist. The curator dashboard would likely be the third protected route.
- **Notification surface**: should the submitter be emailed when their challenge is reviewed? Couples to Phase-5 D-4 subscriber-list thread.

**Lean** (subject to a future ADR; possibly ADR-0014): inherit COI policy verbatim; introduce `0003_rating_challenge_review` migration with the 4 columns; ship a curator-admin route at `/[locale]/curator/challenges` (middleware-protected); defer email notifications to a separate Phase 13+ scope alongside `lib/email/`. None blocking Phase 11; all gated on explicit Phase 12+ kickoff sign-off per §12.

## Q58. Rating-challenge visibility to non-author users

**Status:** resolved 2026-05-16 (Unit 13.3): per-status visibility policy realized in `lib/rating-challenges/PUBLIC_CHALLENGE_STATUSES` + `getPublicChallengesByProblem` + `getAcceptedChallengeCountByProblem` (Unit 13.1) + counter section on problem detail page (Unit 13.2) + per-problem listing route at `/[locale]/problems/[slug]/challenges` (Unit 13.3); `submitted` + `under_review` + `accepted` public on counter + listing (with submitter `@githubLogin` displayed per ADR-0012 D-E semantics); `rejected` + `withdrawn` submitter-only (privacy preservation on editorial decisions + change-of-mind); submitter-login privacy note added to `messages.rating_challenge.description` in EN + FR for explicit submitter awareness. Q58 lean #3 (`/[locale]/u/[handle]/challenges` per-user surface) deferred to Phase 14+ alongside public profile route + per-user privacy model ADR. · **Surfaced:** Unit 11.0 D-? (anticipated) + Unit 11.5 hygiene (Class A item 2) · **Resolved:** Unit 13.3.

Today Phase 11's only consumer of `getUserChallenges` is the submitter's own profile page (`/[locale]/profile`). A user cannot see anyone else's challenges; the problem detail page does not display a count or list of active challenges.

Three viable visibility shapes for Phase 12+:

1. **Counter on problem detail page** (smallest surface): `<p>3 active rating challenges →</p>` linking to a per-problem challenges view. Requires a helper like `getChallengeCountByProblem(slug)`. Easy to implement; no rationale-text exposure.
2. **Per-problem challenge listing** (medium surface): `/[locale]/problems/[slug]/challenges` route showing all active challenges with truncated rationale previews. Reveals the editorial debate publicly; risks doxxing the submitter (who chose to be visible via GitHub login).
3. **Public profile of all of a user's submitted challenges** (couples to Phase-10 Class B item 1): `/[locale]/u/[handle]/challenges` route. Submitter-scoped; requires the public-profile route to land first.

Policy questions inseparable from the shape choice:

- Should rejected challenges be visible publicly? (Privacy concern; reveals editorial decisions.) Lean: NO — only `submitted` and `accepted` statuses are public; `rejected` / `withdrawn` stay submitter-only.
- Should the submitter's GitHub login be displayed publicly? (Today `users.githubLogin` is the join key to file-system curator-of-record; the column is `unique` but not `public`.) Lean: YES if status is `accepted` (the accepted challenge becomes part of the editorial record); NO if status is `submitted` (the challenge is in-flight; submitter identity should not gate the rating-action attribution).
- Should the rationale text be displayed publicly? Lean: YES (the rationale is the substantive content; concealing it defeats the public-feedback mechanism).

**Lean** (subject to a future ADR alongside Q57): start with #1 (counter on problem detail page) as the smallest surface; expand to #2 (per-problem listing) when usage volume justifies it; defer #3 (public profile of challenges) until the public profile thread lands. Aligns with Phase 11's "submission-only MVP" framing and Phase 12+'s expected curator-review-pipeline keystone.

## Q63. User-editable profile fields (`displayName` + `bio`)

**Status:** resolved 2026-05-16 (Unit 15.1): pinned in [ADR-0016](./docs/adr/0016-user-editable-profile-fields.md) — `users.displayName` (80 chars max; falls back to GitHub-derived `users.name` per fallback chain `displayName → name → githubLogin → translated fallback`) + `users.bio` (280 chars max; plain text only, NO markdown / NO HTML / NO link-detection — Q66 candidate Phase 16+ if power-user demand surfaces) realized via migration `0004_user_profile_fields` (**second ALTER migration** in project history; first was Phase-12 `0003_rating_challenge_review` per ADR-0014 D-E discipline) + `validateDisplayName` / `validateBio` / `updateProfile` helpers in `lib/users/` (Unit 15.3; +17 tests; 497/52 file-suite total) + inline edit form on existing `/[locale]/profile` (NOT separate `/profile/edit` per D-C; mirrors ADR-0015 D-F's "two surfaces per identity" pattern) + server-action driven (NOT REST endpoint per D-D; mirrors Phase 10/11/12 precedent) + 24-key `messages.profile_edit.*` namespace across EN + FR (atomic pre-add per Phase-14 discipline) + fallback chain consumption on `/u/{handle}` + `/profile` + AuthControl pill (Unit 15.5; two-tier email semantics — email on own surfaces, never on public per ADR-0015 D-A invariant). Image override DEFERRED to Phase 16+ (Q67 candidate; needs **ADR-0017** for storage choice — Vercel Blob / S3 / external URL allowlist); content moderation DEFERRED to Phase 16+ (Q68 candidate; needs moderation API integration ADR); display-name uniqueness NOT enforced (multiple users may pick same display name; `githubLogin` remains unique URL key); edit history / audit log NOT retained (mirrors GitHub pattern; Phase 16+ if editorial accountability demanded). · **Surfaced:** Unit 14.0 D-? (anticipated as Q63 candidate per ADR-0015 D-C deferral) + Unit 14.6 hygiene (Class B item 1) + Unit 14.8 acceptance gate · **Resolved:** Unit 15.1 (ADR-0016 acceptance).

[Unit 14.0 D-1](./docs/thinking/14.0-phase-14-prep.md) deferred user-editable fields to Phase 15+ explicitly: Phase 14 shipped READ-ONLY public profile per ADR-0015; ADR-0015 D-C explicitly anticipated this surface as the natural follow-on with the conditional "Phase 15+ writes can extend the contract incrementally with user-feedback data from Phase 14's read-only delivery." Phase 15 honors the deferral path verbatim.

What Q63 closes architecturally:

- **First user-controlled writes surface for `users` table**. Phase 9 established `users` row creation via Auth.js v5 `events.linkAccount` (auth-side metadata population from OAuth profile); Phase 15 adds the first **user-controlled** write path — distinct concern from auth-side population.
- **Second ALTER migration in project history**. Validates the Phase-12 D-E ALTER discipline (`0003_rating_challenge_review`'s FK edge case required manual SQL correction; Phase-15's `0004_user_profile_fields` shipped clean — drizzle-kit's nullable text ALTER emission is reliable). Pattern crystallized.
- **Public-data invariant preserved** (per ADR-0015 D-A). Editable `displayName` + `bio` are user-controlled overrides of fields that are ALREADY public elsewhere (GitHub `name` at github.com; bio is opt-in user-controlled text the user chose to expose). NO NEW public-data category introduced.

Phase-16+ follow-on candidates explicitly flagged in ADR-0016:

- **Q66 candidate** (markdown rendering in bio; ADR-0016 D-F deferral) — needs remark/rehype/sanitize pipeline ADR + XSS audit. Phase 16+ if power-user demand surfaces.
- **Q67 candidate** (image override / avatar upload; ADR-0016 D-G deferral) — needs **ADR-0017** for storage choice (Vercel Blob ~$0.02/GB / S3 / R2 / external URL allowlist) + upload pipeline + cropping + EXIF stripping + image content moderation.
- **Q68 candidate** (content moderation on bio text; ADR-0016 D-B deferral) — needs moderation API integration ADR (OpenAI moderation / Perspective / custom regex+wordlist). Phase 16+ if abuse signals accumulate.

## Q67. Image override / avatar upload (`users.imageOverride`)

**Status:** resolved 2026-05-16 (Unit 16.1): pinned in [ADR-0017](./docs/adr/0017-image-storage.md) — `users.imageOverride` (512-char URL cap; nullable text column; stores absolute Vercel Blob public URL matching `^https://[a-z0-9-]+\.public\.blob\.vercel-storage\.com/.+` per D-F) realized via migration `0005_user_image_override` (**third ALTER migration** in project history; ADR-0014 D-E discipline crystallized at third exercise — clean drizzle-kit emission) + new `lib/storage/` module wrapping `@vercel/blob@2.3.3` (`putAvatar` + `delAvatar` thin wrappers; **first storage layer in project history** alongside file-system content + Turso DB) + `validateImageOverride` / `updateProfileImage` (7-step pipeline: MIME + size + magic-byte + SELECT existing + upload + UPDATE + best-effort delete-on-replace) / `clearProfileImage` helpers in `lib/users/` (Unit 16.3; +22 tests; 519/53 file-suite total) + inline image-upload form on existing `/[locale]/profile` (NOT separate `/profile/edit/avatar` per D-C; continues ADR-0016 D-C "two surfaces per identity" pattern) + new sibling server actions `updateProfileImageAction` (multipart) + `clearProfileImageAction` (per D-D; mirrors Phase 10/11/12/15 inline server-action precedent) + 22-key `messages.profile_edit.image_*` namespace across EN + FR (atomic pre-add per Phase-14/15 discipline) + fallback chain consumption on `/u/{handle}` + `/profile` (Unit 16.5; per D-E: `imageOverride → image → omit`) + `getUserMetadataById` extended with `imageOverride` forward-compat (Unit 16.5; no current SiteHeader avatar consumer; Phase-14 Class B avatar-dropdown follow-on). Storage choice **Vercel Blob** (first-party Vercel; ~$0.02/GB; single `BLOB_READ_WRITE_TOKEN` env var = **Q69 operational candidate** parallel to Q54 + Q55); URL allowlist + S3/R2 documented as ADR-0017 deferral matrix (Phase 17+ if signal demands). Upload pipeline scope: **MIME validation** (`image/jpeg`, `image/png`, `image/webp` only; SVG excluded for XSS surface) + **2 MB size cap** + **first-bytes magic-byte defense-in-depth** + delete-on-replace transactional (orphan tolerated per try/finally; abandoned-blob cleanup script as Class B follow-on). EXIF stripping DEFERRED to Phase 17+ (**Q70 candidate**; privacy concern with embedded GPS metadata); content moderation on uploaded images DEFERRED to Phase 17+ (**Q68 expansion**; couples to bio moderation); cropping UI / server-side resizing / multiple-avatars-history / GIF support all DEFERRED to Phase 17+ per ADR-0017 D-H. · **Surfaced:** Unit 15.1 (ADR-0016 D-G anticipated as Q67 candidate) + Unit 15.6 hygiene (Class B item 2) + Unit 15.7 OQ-hygiene (flagged) + Unit 15.8 acceptance gate ("strongest honored-deferral pick") · **Resolved:** Unit 16.1 (ADR-0017 acceptance).

What Q67 closes architecturally:

- **First user-controlled BINARY write surface** in project history. Phase 9 established auth-side writes (Auth.js `events.linkAccount`); Phase 11 added challenge submission writes; Phase 15 added user-controlled TEXT writes (`displayName` + `bio`); Phase 16 closes the surface category progression with user-controlled BINARY writes. Surface-category lineage complete for Phase 9-16 identity architecture.
- **First binary storage layer in project history** (Vercel Blob alongside file-system content + Turso DB). Establishes `lib/storage/` module pattern (~3 functions; thin wrapper; vendor-swap surface bounded) for Phase 17+ binary-asset inheritance (paper figures? curator-review attachments? methodology diagrams?). Preserves ADR-0013 D-F USER-STATE-only DB (binary lives in Blob; DB stores only URL pointer).
- **Third ALTER migration validates ADR-0014 D-E discipline at THIRD exercise** — clean drizzle-kit emission on nullable text column (Phase-15 cleared at second exercise; Phase-16 confirms reliability for nullable additions).
- **First new runtime dependency since Phase-9 auth stack** (`@vercel/blob@2.3.3`; ~30 kB server-only). 5-phase dependency-discipline interval (Phase 10-15 added zero new runtime deps).
- **First `"use client"` boundary on `/profile`** (`ProfileImageUploadField` for `URL.createObjectURL` preview; ~50 lines; +9 kB page-scoped; shared chunk UNCHANGED at 103 kB). First multipart-form server action in project history (`updateProfileImageAction` with `encType="multipart/form-data"`).
- **Public-data invariant preserved** (per ADR-0015 D-A). User-controlled `imageOverride` is an override of a field already public at github.com (avatar URL from OAuth profile is public-by-default); no NEW public-data category introduced.

Phase-17+ follow-on candidates explicitly flagged in ADR-0017:

- **Q70 candidate** (EXIF stripping on uploaded images; ADR-0017 D-B + D-H deferral) — privacy concern; embedded GPS coordinates + camera serial numbers in user-uploaded photos. Phase 17+ if user privacy report surfaces; needs `sharp` or similar server-side pipeline. ~2-3 units.
- **Q68 expansion** (content moderation on uploaded images; ADR-0017 D-H deferral) — extends Phase-15's Q68 candidate scope from bio text to cover uploaded imagery. Phase 17+ if abuse signals accumulate; needs moderation API integration ADR.
- **External URL allowlist composability** (ADR-0017 Option 2 deferral) — pre-existing-URL paste affordance alongside file upload. Phase 17+ if power-user demand surfaces; ~3-5 units; adds ADR-0018+ sanitization-subset candidate.
- **Cropping UI** + **server-side resizing/transcoding** + **multiple-avatars/history** + **image dimensions check** + **GIF/animated WebP support** — all ADR-0017 D-H deferrals; Phase 17+ if signals demand.
- **Abandoned-blob cleanup script** (ADR-0017 D-B + D-H Class B follow-on) — orphan blobs tolerated until script lands; periodic reconciliation against `users.imageOverride`. ~1-2 units; needs cron schedule.

## Q69. Vercel Blob storage token provisioning (operational; `BLOB_READ_WRITE_TOKEN`)

**Status:** open (operational; surfaced 2026-05-16 Unit 16.1; expected to resolve when curator provisions Vercel Blob store + sets env var via `vercel env pull`).

Phase 16's image-storage architecture per [ADR-0017](./docs/adr/0017-image-storage.md) D-G requires `BLOB_READ_WRITE_TOKEN` env var at runtime. Vercel auto-provisions the token when a Blob store is created via Vercel dashboard (Storage → Blob → Create store); local dev pulls it via `vercel link` + `vercel env pull`.

Operational unblock path:

1. Curator opens Vercel project dashboard.
2. Storage → Blob → Create store (or use existing if one was created out-of-band).
3. Vercel auto-adds `BLOB_READ_WRITE_TOKEN` to project env vars (production + preview + development scopes).
4. Local dev: `vercel link` (one-time) + `vercel env pull .env.local` (pulls all env vars including blob token).
5. `.env.example` documents the var with a placeholder (defer; not yet added).

Graceful degradation when unset:

- `updateProfileImageAction` returns error banner ("Image must be a JPEG, PNG, or WebP file." or similar — the `@vercel/blob` SDK throws inside `putAvatar` when token missing; the helper bubbles a generic error).
- Rest of `/profile` (text fields + watchlist + challenges) keeps working.
- Sign-in / sign-out / read-side surfaces unaffected.
- `/u/{handle}` displays fall back to GitHub avatar (or omits when both `imageOverride` + `image` null).

Parallel to **Q54** (GitHub OAuth app registration) + **Q55** (Turso production DB provisioning). All three operational gates carry the same shape: architecture is complete; deployment unblock pending curator action. Phase 17+ may bundle Q54/Q55/Q69 into a single "operational unblock" thread once deployment is closer.

## Q70. EXIF stripping on uploaded images (privacy)

**Status:** resolved 2026-05-16 (Unit 19.1): pinned in [ADR-0019](./docs/adr/0019-image-transcoding.md) — `sharp@0.34.5` server-side `lib/storage/putAvatar` integration (`sharp(buffer).rotate().toBuffer()` pipeline; auto-rotation preserved via `.rotate()` no-args reading EXIF Orientation tag before stripping; strip-everything-by-default per `sharp.toBuffer()`'s inverted-allow-list behavior; no `.withMetadata()` call Phase 19 — color profile + dimensions + encoding settings preserved by sharp internally; conservative privacy default per Unit 19.0 D-3). Realized via Unit 19.2 (`lib/storage/index.ts` extension + 5 tests: 2 new sharp-integration shape verification + 3 modified JPEG/PNG/WebP shape tests asserting `STRIPPED_BUFFER` as `put()` arg; mocked sharp via `vi.mock("sharp")` for unit-test reliability; real EXIF-strip verified by sharp's own test suite + Phase 20+ integration tests against real fixtures). **First server-side image processing surface + first explicit privacy-by-default surface in project history** (Phase 16 imageOverride shipped privacy-by-omission; Phase 19 closes the privacy gap intentionally — conservative posture for PII surfaces; single user privacy report would surface this immediately). **First inverted-allow-list pattern** in project history (vs Phase-17 / Phase-18 bioSchema / reviewNotesSchema explicit-allow-list approach). Phase-20+ inheritance contract per D-F documents how Q68 expansion (content moderation) + cropping UI + server-side resizing + WebP/AVIF transcoding all compose via the same `.rotate()` ↔ `.toBuffer()` integration point. Backwards compatibility per D-E: existing Phase 16-18 avatars NOT retroactively processed; **Phase-20+ backfill script candidate** `scripts/backfill-exif-strip.ts` ~1-2 units when promoted. Bundle invariant preserved per ADR-0018 D-F extension: **103 kB First Load JS UNCHANGED** end-to-end through every Phase 9-19 unit (sharp is server-only; no client bundle delta). · **Surfaced:** Phase-16 Unit 16.1 (ADR-0017 D-B + D-H deferral) + Phase-17 Unit 17.5 B.1 carryover + Phase-18 Unit 18.4 B.1 carryover + Phase-18 Unit 18.6 acceptance-gate "strongest privacy signal" callout · **Resolved:** Unit 19.1 (ADR-0019 acceptance) + Unit 19.2 (helper-layer realization).

What Q70 closes architecturally:

- **First server-side image processing surface in project history**. Phase 9-18 stored images as-is via Vercel Blob; Phase 19 transcodes (re-encodes without EXIF) before upload. Establishes the integration-point pattern for Phase-20+ image-processing surfaces per ADR-0019 D-F inheritance contract.
- **First explicit privacy-by-default surface in project history**. Phase 16 imageOverride shipped without EXIF stripping — privacy-by-omission. Phase 19 closes the privacy gap intentionally (single user privacy report would surface this immediately; conservative posture for PII surfaces; strip-by-default is the security-correct approach).
- **First inverted-allow-list pattern in project history**. Phase-17 + 18 used explicit-allow-list `bioSchema` / `reviewNotesSchema` (specify what's allowed; everything else stripped). Phase 19 uses inverted-allow-list via `sharp.toBuffer()`'s strip-everything default (specify what's preserved via opt-in `.withMetadata({...})`; everything else stripped). Both patterns establish security-correct defaults via library choice.
- **Third consecutive 0-migration phase** (Phase 17 + 18 + 19; 6 of 10 phases since DB landed are 0-migration). Phase 19 ships rendering layer expansion only; `users.imageOverride` column already existed from Phase-16 `0005_user_image_override` migration.
- **Bundle invariant preserved** per ADR-0018 D-F extension — First Load JS shared chunk = **103 kB UNCHANGED** end-to-end through every Phase 9-19 unit (sharp is server-only; no client bundle delta).
- **First "explicit-dep promotion" of transitive dep**. `sharp` was previously transitively available via `next/image` per Phase-0 `pnpm-workspace.yaml` `allowBuilds.sharp: true` configuration; Phase 19 promotes to direct runtime dep for stability across future `next` updates.

Phase-20+ follow-on candidates explicitly flagged in ADR-0019 D-E + D-F + Unit 19.3 hygiene catalog:

- **EXIF backfill script** (`scripts/backfill-exif-strip.ts`) — ~~Phase-20+ ~1-2 units when promoted~~ **CLOSED Phase 20 Unit 20.1**. Per-row 5-phase pipeline (fetch → `sharp(buf).rotate().toBuffer()` → `put(<new-key>)` → `UPDATE user SET imageOverride` → `del(<old-url>)`) + `--dry-run` CLI flag + URL-pattern filter narrowing to `https://*.public.blob.vercel-storage.com/avatars/*` + per-row try/catch (one bad row doesn't kill batch). **First retroactive-privacy-correction surface** in project history; **first operational-script-only phase** in project history; **first "zero new dep + zero new test + zero new ADR" well-scoped phase** (reuses Phase-19 `sharp@0.34.5` direct dep + Phase-16 `@vercel/blob` + Phase-9 drizzle-orm). `--user-id` + `--verbose` + session-level dry-run sentinel deferred to Phase-21+ refinements (Phase-20 D-4 + D-6).
- **Q68 expansion content moderation** on uploaded images — Phase-21+ ~3-4 units; ADR-0020+ candidate; inserts moderation API call between `.rotate()` and `.toBuffer()` per ADR-0019 D-F inheritance contract. **Phase-20 backfill pattern reusable** if Q68 expansion ships — same `scripts/backfill-content-moderation.ts` shape can retroactively scan existing avatars for moderation policy violations.
- **Cropping UI** + **server-side resizing** + **WebP/AVIF format conversion** + **color profile preservation** — Phase-21+ image-processing expansion candidates per ADR-0019 D-F.

## Q66. Markdown rendering in `users.bio`

**Status:** resolved 2026-05-16 (Unit 17.1): pinned in [ADR-0018](./docs/adr/0018-markdown-sanitization.md) — `unified@11+` + `remark-parse@11+` + `remark-gfm@4+` + `remark-rehype@11+` + `rehype-sanitize@7+` + `rehype-stringify@10+` pipeline (multi-stage; explicit sanitization boundary; ~120 kB transitive **server-only** preserving 103 kB First Load JS invariant) realized via new `lib/markdown/` module (`renderBioMarkdown` + `bioSchema` + `index.test.ts` with 33-test suite covering 14 happy-path + 12 XSS-vector + 4 heading-demotion + 3 null-edge tests per ADR-0018 D-A through D-F; **first markdown processing pipeline + first XSS-audit surface + first three-step pipeline boundary + first `dangerouslySetInnerHTML` surface in project history**); two consumer integration points (`/[locale]/u/[handle]/page.tsx` bio section public canonical surface + `/[locale]/profile/page.tsx` read-mode preview own surface per D-E); allowed markdown subset (D-B) = bold / italic / inline-code / fenced-code-blocks / links / autolinks / unordered + ordered + task lists (read-only) / blockquotes / horizontal-rules / GFM strikethrough / paragraphs / headings demoted (D-C: `#` → `<h3>`, `##` → `<h4>`, `###` → `<h5>`, `####+` clamp to `<h6>` for page outline preservation); EXCLUDES tables / footnotes / images / raw HTML / `class` / inline `style` / event handlers / `<iframe>` / `<object>` / `<script>` / `<style>` / `<base>` / `<a target>` / `<a rel>` / `<a title>`; URL scheme allow-list (D-D) = `https:` + `mailto:` ONLY (`http:`/`javascript:`/`data:`/`file:`/`vbscript:`/relative URLs DENIED; bare-URL GFM autolinks pass through same filter; defense-in-depth via custom `rehypeStripUnsafeHrefs` plugin catching schemeless URLs that rehype-sanitize's `protocols.href` filter doesn't); bio length cap UNCHANGED at 280 chars (per ADR-0016 D-A preserved). Phase-18+ follow-on candidates explicitly flagged in ADR-0018 D-H: GFM tables / footnotes / images / syntax-highlighted code blocks / `@mentions` / markdown-rendered curator review notes (Phase-15 Class B B.2 item 5 inheritance via sibling `renderReviewNotesMarkdown` helper + `reviewNotesSchema` derived schema per D-G) / markdown rating-action `rationale` / task-list interactivity / live preview in edit form (caveat: breaks 103 kB First Load JS invariant) / `<a target>` / `<a rel>` / `<a title>` / Tel + FTP URL schemes / per-user schema configurability / DOMPurify defense-in-depth on client. · **Surfaced:** Unit 15.1 (ADR-0016 D-F anticipated as Q66 candidate) + Unit 15.6 hygiene (Class B B.2 item 5) + Unit 15.7 OQ-hygiene (flagged) + Unit 15.8 acceptance gate + Unit 16.6 hygiene carryover + Unit 16.7 + Unit 16.8 acceptance gate · **Resolved:** Unit 17.1 (ADR-0018 acceptance).

What Q66 closes architecturally:

- **First markdown processing pipeline + first XSS-audit surface + first three-step pipeline boundary + first `dangerouslySetInnerHTML` surface in project history** — four architectural firsts converge in one phase. Establishes `lib/markdown/` module pattern (3 files; ~3-helper-per-surface inheritance shape) that Phase-18+ markdown surfaces (curator review notes + rating-action rationale + possibly methodology-page markdown) inherit verbatim per ADR-0018 D-G.
- **Closes the Phase 14 → 15 → 16 → 17 identity-surface arc** — Phase 14 shipped read-only public profile; Phase 15 shipped editable text fields (plain-text bio + displayName); Phase 16 shipped editable image (imageOverride); **Phase 17 closes the bio expressiveness gap** that Phase 15 D-F explicitly deferred to Phase 16+. Identity-surface arc COMPLETE across four phases.
- **First phase since Phase 9 to ship zero migrations** (Phase 11 + 12 + 15 + 16 each shipped 1; Phase 10 + 13 + 14 shipped 0; Phase 17 is the second 0-migration phase since DB landed). Markdown-rendering surface adds rendering layer only; `users.bio` column already exists from Phase 15.
- **Bundle invariant preserved** (per ADR-0018 D-F) — First Load JS shared chunk = **103 kB UNCHANGED** end-to-end through every Phase 9-17 unit. Markdown deps are server-only (8 new packages ~120 kB transitive; rendered HTML inlined via `dangerouslySetInnerHTML` in async server components at request time). Middleware = **160 kB UNCHANGED**.
- **Public-data invariant preserved** (per ADR-0015 D-A) — markdown rendering changes the FORMAT of bio data, not the data class; bio is already public from Phase 15.
- **i18n discipline preserved + first TEXT UPDATE** — Phase 17 added 3 keys per locale (`bio_preview_heading` + `bio_preview_aria_label` + `bio_hint` text update — first i18n key TEXT UPDATE since the namespace was first added in Phase 7; Phase-10 through Phase-16 all ADD-only patterns).

Phase-18+ follow-on candidates explicitly flagged in ADR-0018 D-H + Unit 17.5 hygiene catalog:

- **Tables (GFM)** + **footnotes (GFM)** + **images** + **syntax-highlighted code blocks** + **bio length expansion** + **`@mentions`** + **task-list interactivity** + **live preview client boundary** — 8 markdown subset expansion candidates.
- **Markdown-rendered curator review notes** (Phase-15 Class B B.2 item 5; ADR-0018 D-G inheritance via `renderReviewNotesMarkdown` + `reviewNotesSchema` sibling — ~1-2 units when promoted).
- **Markdown rating-action `rationale`** + **methodology page markdown unification** + **per-user schema configurability** + **`<a target>`/`<a rel>`/`<a title>`** + **Tel/FTP schemes** + **DOMPurify defense-in-depth on client** — additional Phase-18+ deferrals.

## Q71. Multi-surface markdown render (`ratingChallenge.reviewNotes` via ADR-0018 D-G inheritance)

**Status:** resolved 2026-05-16 (Unit 18.1): pinned in [ADR-0018](./docs/adr/0018-markdown-sanitization.md) D-G inheritance contract (Phase-17 documented; Phase-18 first exercise). Realized via `renderReviewNotesMarkdown(text)` sibling helper + `reviewNotesProcessor` singleton + `reviewNotesSchema` (identical-to-`bioSchema` Phase-18 per Unit 18.0 D-3 scope-cap discipline; **Q72 candidate** Phase-19+ if curator demand surfaces for tables / footnotes / extended subset divergence) in new `lib/markdown/` extension (Unit 18.1; +10 tests across 7 happy-path + XSS spot-checks + 3 schema-parity tests; 562/54 file-suite total). Two consumer surfaces shipped: `/[locale]/curator/challenges/[id]/page.tsx` (Phase-12 curator dashboard; **FULL render — no clamp** per Unit 18.0 D-5 curator wants full editorial readability; Unit 18.2) + `/[locale]/profile/page.tsx` own-challenges listing (markdown render + **CSS `line-clamp-3`** visual truncation per Unit 18.0 D-9 + Unit 18.1 incompatibility analysis — replaces Phase-12's `truncateRationale(challenge.reviewNotes)` source-truncation which is incompatible with markdown rendering: mid-tag truncation risks broken formatting; Unit 18.3). `truncateRationale()` helper PRESERVED for the rationale plain-text field (Phase-11; not markdown Phase 18; Phase-19+ candidate if rationale markdown promotes). **Fourth `dangerouslySetInnerHTML` surface** in project history (4 total: bio /u/{handle} + bio /profile preview Phase 17 + reviewNotes /curator/challenges/[id] + reviewNotes /profile listing Phase 18); **first 4-surface markdown render consistency** (single 14-class arbitrary-variant prose-styling vocabulary across all 4 surfaces); **first CSS `line-clamp` visual truncation** in project history; **first XSS-audit schema-parity pattern** (3 parity tests assert `reviewNotesSchema` ≡ `bioSchema` Phase-18); **first "rename refactor" code unit** (`bioProcessor` rename per Unit 18.0 D-8; zero behavior change). · **Surfaced:** Phase-15 Class B B.2 item 5 (carryover) + Phase-15 Unit 15.6 hygiene + Phase-15 Unit 15.7 OQ-hygiene + Phase-15 Unit 15.8 acceptance gate + Phase-17 ADR-0018 D-G inheritance contract (documented but not exercised) + Phase-17 Unit 17.5 B.2 surface expansion item (carryover) + Phase-18 Unit 18.0 prep (Q71 promotion anticipated) · **Resolved:** Unit 18.1 (first ADR-0018 D-G exercise).

What Q71 closes architecturally:

- **First ADR-0018 D-G inheritance exercise** in project history. Phase 17 documented the inheritance pattern (sibling helper + sibling schema per surface; audit boundary explicit per surface); Phase 18 realized it at second exercise. Validates the contract shape: future markdown surfaces (Phase-19+ markdown rationale; Phase-19+ methodology page markdown unification) inherit via the same sibling-helper pattern.
- **First reviewNotes markdown surface** in project history — Phase-12 reviewNotes plain-text rendering (`whitespace-pre-wrap`) upgraded to markdown render across both consumer surfaces. 4000-char cap (Phase-12 ADR-0014) preserved; markdown changes format, not length.
- **Second consecutive 0-migration phase** (Phase 17 + Phase 18; 5 of 9 phases since DB landed are 0-migration). Phase 18 ships rendering layer expansion only; reviewNotes column already existed from Phase-12 `0003_rating_challenge_review` migration.
- **Bundle invariant preserved** (per ADR-0018 D-F invariant unchanged through every Phase 9-18 unit) — First Load JS shared chunk = **103 kB UNCHANGED**; middleware = **160 kB UNCHANGED**. Phase 18 added zero new runtime deps (Phase-17 `unified` stack reused via sibling processor instances).
- **Schema-parity-by-explicit-shallow-copy decision** — `reviewNotesSchema = { ...baseSchemaConfig }` signals "intentional parity Phase-18" rather than "same object reference." 3 parity tests enforce the equivalence; Phase-19+ divergence (Q72 candidate) requires explicit parity-test removal + audit comment per surface-specific schema.
- **`truncateRationale()` source-truncation incompatibility resolution** — markdown source mid-tag truncation risks broken formatting (unclosed `**`, `[`, etc.); Phase-18 establishes the pattern that when source-truncation breaks rendering (markdown / HTML / other structured text), CSS `line-clamp` visual truncation is the correct approach.

Phase-19+ follow-on candidates explicitly flagged in Phase 18 Unit 18.4 hygiene catalog:

- **Q72 candidate** (`reviewNotesSchema` divergence from `bioSchema` — markdown subset extensions for curator reviewNotes: tables / footnotes / extended subset). 4000-char reviewNotes field may justify tabular COI comparisons + footnoted citations + structured editorial reasoning. Phase-19+ if curator demand surfaces; needs surface-specific schema authoring per ADR-0018 D-G + Phase-18 schema-parity test removal + audit comment.
- **Markdown rating-action `rationale`** (Phase-11 plain-text field; couples to existing `truncateRationale()` helper; promotion would need analogous CSS line-clamp + markdown render swap; couples to per-challenge detail page).
- **Methodology page markdown unification** (long-term; Velite MDX pipeline vs `lib/markdown/` USER-STATE markdown — unification is a larger architectural decision).
- **Per-challenge detail page** (Phase-11 + 13 carryover; couples to Phase-18 Unit 18.3's `line-clamp-3` UX — user clicks through for full reviewNotes / rationale rendering). ~2-3 units when promoted.

## Q73. Google OAuth app registration (operational; `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`)

**Status:** open (operational; surfaced 2026-05-17 Unit 28.4; expected to resolve when curator provisions Google Cloud Console OAuth app + sets env vars via `vercel env pull`). · **Blocks:** Phase-28 Google sign-in end-to-end smoke; production deploy with Google sign-in enabled. · **Surfaced:** [ADR-0020](./docs/adr/0020-multi-provider-oauth.md) D-C; Phase-28 prep D-9.

Mirrors [Q54](./OPEN_QUESTIONS.md#q54-github-oauth-app-registration) shape verbatim for the second provider. Phase 28's [ADR-0020](./docs/adr/0020-multi-provider-oauth.md) (D-B + D-C + D-F) lifts ADR-0012 D-B's single-provider restriction and adds Google OAuth via `next-auth/providers/google`; the provider's env vars (`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`) follow the Auth.js v5 canonical naming convention. Phase-28 implementation (Unit 28.2) ships the lib/auth + UI + i18n + `.env.example` extensions; the operational unblock is the OAuth app registration in Google Cloud Console.

Required steps (mirrors Q54 verbatim per Phase-28 D-3 lean):

- **Production app**: register in Google Cloud Console under the project's Google Cloud organization (e.g., a dedicated `llm-openproblems-prod` GCP project). Authorized JavaScript origins = `https://llm-openproblems.org`; Authorized redirect URIs = `https://llm-openproblems.org/api/auth/callback/google`. Populate `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` in production env (Vercel).
- **Local dev app**: register a separate Google Cloud Console OAuth app (avoids polluting production OAuth state with dev redirects). Authorized JavaScript origins = `http://localhost:3000`; Authorized redirect URIs = `http://localhost:3000/api/auth/callback/google`. Populate `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` in `.env.local`.

**Graceful degradation when unset** (per Phase-28 Unit 28.2 + ADR-0020 D-C): the Google provider treats `clientId`/`clientSecret` as undefined; Auth.js v5 surfaces an OAuth-configuration error page on click for the Google sign-in button. **The GitHub sign-in button still works if Q54 is satisfied** (independent failure modes per provider; SiteHeader's `safeAuth()` catches any DB-read failure and renders the signed-out branch with both buttons regardless).

**Why Phase 28+ operational, not Phase 28 unit-shipping**: provisioning is curator-track (requires Google Cloud Console access + decision about which GCP org owns the app + production/dev split governance); not a code-shipping step. The code (Unit 28.2) ships ready to consume the env vars once provisioned.

**Cross-references**: [ADR-0020](./docs/adr/0020-multi-provider-oauth.md) (multi-provider OAuth); [Q54](./OPEN_QUESTIONS.md#q54-github-oauth-app-registration) (analogous GitHub operational gate); ADR-0012 D-B (now lifted by ADR-0020); [Q69](./OPEN_QUESTIONS.md#q69-vercel-blob-storage-token-provisioning-operational-blob_read_write_token) (precedent for the operational-gate-Q pattern; Phase-16 carryover).

## Q74. Non-GitHub users as curators (architectural; ADR-0020 D-D Phase 29+ deferral)

**Status:** open (architectural; surfaced 2026-05-17 Unit 28.4; Phase 29+ candidate if curator demand widens). · **Blocks:** nothing critical; affects future editorial-identity model. · **Surfaced:** [ADR-0020](./docs/adr/0020-multi-provider-oauth.md) D-D.

Phase 28's [ADR-0020](./docs/adr/0020-multi-provider-oauth.md) D-D preserves the GitHub-only curator-of-record gate: `users.githubLogin` is populated only via the GitHub `linkAccount` event (Phase-9 Unit 9.6 verbatim); non-GitHub users (Google sign-ins) leave `githubLogin` NULL. File-system `editorial.primary_curator` (per [ADR-0005](./docs/adr/0005-rating-action-immutability.md) + [ADR-0012 D-E](./docs/adr/0012-auth-provider.md#d-e-user-identity-model)) joins to `users.githubLogin`, so non-GitHub users **cannot be a curator-of-record** on rating-action YAML in Phase 28. They CAN:

- Sign in via Google OAuth.
- Submit rating challenges (Phase 11+ submission flow).
- Edit their profile (display name, bio, image override per Phase 15-19; markdown rationale per Phase 27).
- View public surfaces (Phase 13+ public visibility; Phase 14+ `/u/{handle}` profile; Phase 26+ per-challenge detail page).

They CANNOT (in Phase 28):

- Be named as `primary_curator` on a rating-action YAML.
- Review challenges via `/curator/...` routes (Phase-12 `LOP_CURATOR_LOGINS` env var contains GitHub logins).
- Appear as the reviewer on Phase-26 detail page acceptance metadata.

**Question to resolve in Phase 29+**: should non-GitHub users be eligible to be curators? If yes, what's the editorial-identity model?

- **Option A**: add a separate `users.googleLogin` (or generic `users.editorialIdentity`) column; expand `LOP_CURATOR_LOGINS` env var or split into per-provider lists; widen `editorial.primary_curator` schema to accept multi-provider identities. ~3-4 units; bigger downstream change than the Phase-28 widening.
- **Option B**: introduce a username-claim mechanism (users pick a stable handle independent of provider; rating-action YAML uses the claimed handle). ~4-6 units; requires migration + claim-resolution UX + collision-handling.
- **Option C**: keep curator-of-record GitHub-only indefinitely; accept that the broader Google user base is a submitter community only. Phase 28's lean.

**Phase-28 D-3 rationale for deferral**: curator-of-record semantics have ten phases of accreted invariants (`editorial.primary_curator` schema + `LOP_CURATOR_LOGINS` env-var convention + Phase-12 curator dashboard authz + Phase-14 `/u/{handle}` reviewer info + Phase-22-23 emit-challenge-action attribution). Widening this surface needs explicit curator buy-in + a new ADR; Phase 28's scope is the **submitter** + **profile-editing** widening, not the **curator-eligibility** widening.

**Cross-references**: [ADR-0020 D-D](./docs/adr/0020-multi-provider-oauth.md) (the Phase-28 boundary statement preserving the GitHub-only gate); [ADR-0012 D-E](./docs/adr/0012-auth-provider.md#d-e-user-identity-model) (the Phase-9 editorial-identity model preserved); [ADR-0014 D-C](./docs/adr/0014-curator-review-pipeline.md) (curator identity + COI surface); [ADR-0005](./docs/adr/0005-rating-action-immutability.md) (rating-action immutability + `editorial.primary_curator` schema).

## Q75. Resend account + domain provisioning (operational; `RESEND_API_KEY` + `EMAIL_FROM` + DKIM/SPF/DMARC records)

**Status:** open (operational; surfaced 2026-05-17 Unit 30.4; Phase 31+ before deploy or when subscribe form needs live testing). · **Blocks:** end-to-end verification + welcome + (future) weekly digest email delivery; subscribe form returns `email.send_unavailable` until resolved. · **Surfaced:** [ADR-0021](./docs/adr/0021-subscriber-list-email.md) D-G.

Mirrors [Q54](#q54-github-oauth-app-registration) (GitHub OAuth registration) + [Q73](#q73-google-oauth-app-registration) shape verbatim. Phase 30 ships the architectural commitment; production-grade transactional email delivery requires:

1. **Resend account** at resend.com (free tier: 100 emails/day + 3,000/month; sufficient for MVP-scale verification + welcome traffic Phase 30; weekly digest send Phase 31+ will monitor against the per-month ceiling — at 750 subscribers × 4 weekly sends = 3,000 the free tier saturates).
2. **API key generation** in Resend dashboard → set as `RESEND_API_KEY` env var on Vercel production + on `.env.local` for any dev that wants to exercise the live send path.
3. **Sender domain verification**: Resend's domain setup flow provisions DKIM + SPF + DMARC records on the Q2-resolved DNS domain (presumably `llm-openproblems.org` per §5.10 placeholder). Without verified sender identity, recipient mail providers (Gmail / Outlook / iCloud) will mark transactional emails as spam or reject outright.
4. **`EMAIL_FROM` env var** in canonical RFC 5322 format with display name + email address, e.g. `"LLM OpenProblems <digest@llm-openproblems.org>"`. The email portion MUST be on a Resend-verified domain.
5. **Reply-to handling** (operational): Resend supports a separate reply-to. Phase 30 ships no explicit reply-to (recipients reply to the sender domain); operational decision Phase 31+ if curator volume signals needing routing.

**Graceful degradation Phase 30**: when `RESEND_API_KEY` unset, the subscribe form returns `email.send_unavailable` (i18n message); the subscriber row is still created in `pending_verification` status (server doesn't know the row will never receive a verification email; consistent with the i18n message advising the user to contact support). When `EMAIL_FROM` unset, same code path. Mirrors Phase-28 Q73 + Phase-9 Q54 graceful-degradation posture.

**Cross-references**: [ADR-0021 D-G](./docs/adr/0021-subscriber-list-email.md#d-g-sender-identity--email_from-env-var--q75-operational-gate) (sender identity + Q75 gate); [Q2](#q2-domain-dns) (DNS domain that DKIM/SPF/DMARC records attach to — Q75 depends on Q2 resolution); [Q54](#q54-github-oauth-app-registration) + [Q73](#q73-google-oauth-app-registration) (parallel operational gates with identical graceful-degradation shape).

## Q76. Per-user-account-based subscriptions (architectural; ADR-0021 D-C Phase 31+ deferral)

**Status:** resolved 2026-05-17 (Unit 33.1): **Option A FK extension** pinned in [ADR-0023](./docs/adr/0023-per-user-account-subscriptions.md) — `subscriber.userId text references users(id) on delete cascade` nullable column extension via migration `0008_subscriber_user_id.sql`. Subscribe-route POST handler reads `safeAuth()` for session + auto-populates `userId = session.user.id` if signed-in else NULL per ADR-0023 D-C; existing rows' `userId` updates per `decideSubscriberUserId` pure helper realizing ADR-0023 D-E/D-F/D-G semantics (anonymous → authenticated migration smooth + cross-user re-subscribe conservative-preserve). Anonymous email-only path preserved verbatim (NULL `userId` = Phase-30 path). Cascade-on-user-delete enables future account-deletion flow (Phase 34+ candidate) to automatically remove subscription rows. Per-problem subscriptions + cross-domain summary subscriptions + "manage my subscriptions" UX page + curator analytics dashboard + subscription-preference editing UX deferred to Phase 34+ per ADR-0023 D-H ([Q79](#q79-manage-my-subscriptions-ux-page-architectural-adr-0023-d-h-phase-34-deferral) candidate for the "manage my subscriptions" page). **Option B** (separate `user_subscriptions` table) + **Option C** (stay anonymous-only-indefinitely) rejected. **Closes the Phase-31+ anticipation at 2-phase Q-carryover** (Phase 30 → 31 → 32 → 33). **First ADR to close an explicit prior ADR's Phase-N+1 anticipation at tight follow-on** in project history. **Subscriber-list-email arc completes Phase 30 → 31 → 32 → 33 = first 4-phase complete-feature pair in project history**. · **Surfaced:** [ADR-0021](./docs/adr/0021-subscriber-list-email.md) D-C; **Resolved:** Unit 33.1 (ADR-0023 acceptance).

Phase 30's [ADR-0021](./docs/adr/0021-subscriber-list-email.md) D-C scopes subscriptions to **per-domain only** with **anonymous email-only** rows in the `subscriber` table — no FK to `users.id`. A user signed in via GitHub / Google can subscribe via the form but the subscription row has no relationship to their `users.id`; from the system's view, the subscription is identified purely by email + token.

Phase 30 is the **foundation**; Phase 31+ candidates for richer subscription semantics:

1. **Authenticated-user subscriptions**: when a signed-in user submits the subscribe form, link the resulting `subscriber` row to their `users.id` via a nullable FK. Enables: (a) "manage my subscriptions" page on `/profile`; (b) auto-unsubscribe on account deletion; (c) curator analytics ("which signed-in users are subscribed").
2. **Per-problem subscriptions**: subscribe to all rating actions on `hallucination-reduction` (independent of domain). Couples to content schema; requires either a separate `problem_subscriptions` table or a `domainSubscriptions`-shaped extension (`problemSubscriptions` JSON column).
3. **Cross-domain weekly-digest summary**: single weekly email aggregating all opted-in domains for the user (vs N separate emails Phase 30 baseline).

**Question to resolve in Phase 31+**: should signed-in users get account-linked subscriptions automatically (on form submit when signed in) OR via an explicit opt-in toggle? Three resolution options:

- **Option A**: FK from `subscriber.userId` to `users.id` with `ON DELETE cascade`; populated automatically on form submit when `auth()` returns a session; nullable for anonymous email-only subscribes. ~2-3 units; preserves email-only path; adds the `userId` column + migration.
- **Option B**: separate `user_subscriptions` table keyed on `users.id` × `domain`; the `subscriber` table stays anonymous email-only; the curator analytics / "manage my subscriptions" page queries the new table. ~3-4 units; more separation between anonymous + authenticated paths.
- **Option C**: keep `subscriber` anonymous email-only indefinitely; "manage my subscriptions" UX uses the email-token verification cycle (user enters email; receives a manage-subscriptions link). ~0 units (already shipped Phase 30); least UX-pleasant but architecturally simplest.

**Cross-references**: [ADR-0021 D-C](./docs/adr/0021-subscriber-list-email.md#d-c-subscription-scope--per-domain-phase-30-q76-architectural-for-phase-31) (the Phase-30 boundary statement scoping subscriptions to per-domain); [ADR-0015 D-A](./docs/adr/0015-per-user-privacy-model.md) (public-data invariant — subscriber email is private; authenticated-subscription linkage would preserve this); [ADR-0012 D-E](./docs/adr/0012-auth-provider.md#d-e-user-identity-model) (the existing user-identity model; FK from `subscriber.userId` would join here); [ADR-0020 D-D](./docs/adr/0020-multi-provider-oauth.md) (Phase-28 boundary on `users.githubLogin`-based gating; Phase-30+ subscriptions are provider-agnostic since they key on `users.id` not `githubLogin`).

## Q77. Vercel Cron production setup + `CRON_SECRET` provisioning (operational; weekly digest scheduler)

**Status:** open (operational; surfaced 2026-05-17 Unit 31.4; Phase 31+ before production cron fires for the first time). · **Blocks:** end-to-end weekly digest send loop in production; cron route returns 401 until resolved. · **Surfaced:** [ADR-0022](./docs/adr/0022-weekly-digest-scheduler.md) D-D.

Mirrors [Q54](#q54-github-oauth-app-registration) + [Q73](#q73-google-oauth-app-registration) + [Q75](#q75-resend-account--domain-provisioning-operational-resend_api_key--email_from--dkimspfdmarc-records) shape verbatim. Phase 31 ships the architectural commitment via [ADR-0022](./docs/adr/0022-weekly-digest-scheduler.md) + `vercel.json` `crons` config + `app/api/v1/cron/digest-send/route.ts` + per-row idempotency column extension; **production cron operation** requires:

1. **`CRON_SECRET` generation**: `openssl rand -base64 32` → 44-char URL-safe random string. Set as Vercel production env var; mirror in `.env.local` for any dev that wants to exercise the cron path manually via `curl -H "vercel-cron: 1" -H "Authorization: Bearer ..."`.
2. **`vercel.json` `crons` config recognition**: Vercel detects the top-level `crons` array on next production deploy. Cron jobs are **production-only by default** (preview deploys don't fire). Verify via Vercel dashboard → Settings → Cron Jobs after deploy.
3. **First-week execution monitoring**: watch the Vercel cron dashboard the first Monday after enable for cron-route invocation logs + `DigestSendResult` JSON response payload (`{ sent, failed, skippedEmptyDomains, skippedAlreadySent, domains, durationMs }`). Expected first-week shape: `sent` = number of (domain, verified-subscriber) pairs; `failed` = 0 in steady-state; `skippedEmptyDomains` = number of taxonomy domains with zero rating actions + zero entries + zero discussions in the trailing-7-day window; `skippedAlreadySent` = 0 first invocation (no prior `lastDigestSentAt` populated).
4. **Resend free-tier monitoring** (couples to Q75): per ADR-0022 D-G, weekly cadence × 750 subscribers = 3,000/month free-tier ceiling. Q75 operational gate's tier-monitoring sub-step extends to "monitor monthly send count via cron-route response payload `sent: N` × 4 weeks vs Resend dashboard's monthly count."
5. **Vercel Cron logs retention** (operational): Vercel retains cron logs per the Pro/Hobby plan's general log-retention policy. For longer-term observability, the cron-route's `console.error` calls for `digest-build-failed` / `subscriber-fetch-failed` / `send-failed` / `send-threw` flow to Vercel's log drain; Q78 (architectural) considers per-send analytics + Resend webhook integration as Phase 32+ evolution.

**Graceful degradation Phase 31**: when `CRON_SECRET` unset, the cron route returns `401 { error: "unauthorized", reason: "missing_cron_secret_env" }` (mirrors Q54 + Q73 + Q75 graceful-degradation posture). The Phase-30 subscribe form + verify + welcome path is unaffected; production deploy is buildable + testable without `CRON_SECRET` provisioning (just no weekly digest sends until provisioned).

**Why Phase 31+ operational, not Phase 31 unit-shipping**: provisioning is curator-track (requires Vercel dashboard access + decision about which secret value to use); not a code-shipping step. The code (Unit 31.3) ships ready to consume `CRON_SECRET` once provisioned. Mirrors the Q54 / Q55 / Q69 / Q73 / Q75 operational-gate cadence verbatim.

**Cross-references**: [ADR-0022 D-D](./docs/adr/0022-weekly-digest-scheduler.md) (auth boundary); [Q54](#q54-github-oauth-app-registration) + [Q73](#q73-google-oauth-app-registration) + [Q75](#q75-resend-account--domain-provisioning-operational-resend_api_key--email_from--dkimspfdmarc-records) (parallel operational gates with identical graceful-degradation shape — five total operational gates pending at Phase 31 close); [Q78](#q78-digest-send-analytics--observability-architectural-adr-0022-d-h-phase-32-deferral) (architectural sibling for Phase 32+ deeper observability).

## Q78. Digest-send analytics + observability (architectural; ADR-0022 D-H Phase 32+ deferral)

**Status:** open (architectural; surfaced 2026-05-17 Unit 31.4; Phase 32+ candidate if reliability or analytics signal surfaces). · **Blocks:** nothing critical; affects future digest-send observability + retry-queue + bounce-handling. · **Surfaced:** [ADR-0022](./docs/adr/0022-weekly-digest-scheduler.md) D-H.

Phase 31's [ADR-0022](./docs/adr/0022-weekly-digest-scheduler.md) D-F + D-G + D-H scope the weekly digest send loop to **MINIMAL** observability: cron-route response payload reports aggregate `{ sent, failed, skippedEmptyDomains, skippedAlreadySent, domains, durationMs }`; per-row failures are `console.error`-logged to Vercel's stderr capture. **No per-send delivery tracking, no bounce handling, no retry queue, no Resend webhook integration, no historical send-count storage.**

Phase 32+ candidates for richer observability:

1. **Per-send delivery tracking**: store the Resend message ID + delivery status per (subscriber, domain, week) tuple. Couples to ADR-0022 D-10's alternative `digest_send` audit table (the path rejected in Phase 31 in favor of `subscriber.lastDigestSentAt` column extension; would re-surface here as the storage shape).
2. **Resend webhook integration**: subscribe to Resend's `email.bounced` + `email.complained` + `email.delivered` webhooks. Auto-flip `subscriber.status` to `unsubscribed` on hard bounce or spam complaint; auto-skip chronically-bouncing recipients on future cron runs. Requires a new `/api/v1/webhooks/resend` route + Resend webhook secret verification + soft-bounce vs hard-bounce semantics decision.
3. **Retry queue for transient send failures**: promote from per-row try/catch + skip to a real event-driven runtime (Inngest / Trigger.dev / Vercel Queues when GA). One-time failures (Resend 5xx, network blips) retry within the same week instead of waiting 7 days. Requires a runtime decision + dependency addition + ADR amendment.
4. **Send-count history dashboard**: per-week aggregates (sent / failed / skipped) over a trailing-12-week window; curator-facing analytics page at `/curator/digest-analytics` (extends ADR-0014 curator-review-pipeline patterns).
5. **Bounce / complaint rate alerting**: weekly threshold (e.g., >5% bounce rate) triggers curator notification + manual investigation. Phase 32+ if signal.
6. **Resend monthly-count alerting**: when monthly send count crosses 80% of the 3,000/month free tier ceiling (~2,400 sends), curator notification + upgrade-or-switch decision prompt. Phase 32+; mitigates Q75 monitoring-burden via automation.

**Question to resolve in Phase 32+**: which of the 6 candidates ship first? Three resolution profiles:

- **Profile A (Resend-webhook-first)**: ship #2 + #5 first (bounce/complaint handling + alerting). Lowest infra cost (no new runtime); highest reliability win (eliminates silent-failure recipients).
- **Profile B (analytics-first)**: ship #4 + #6 first (dashboard + monthly-count alerting). Lowest infra cost; addresses Q75 monitoring burden + curator visibility.
- **Profile C (retry-queue-first)**: ship #3 first (real event-driven runtime). Highest infra cost (new runtime + dependency + ADR); addresses chronic-failure recipients but premature without observed signal.

**Phase-31 lean**: Profile A is the most defensible Phase-32+ first thread (lowest cost, highest reliability win), but the decision waits for Phase 31 production cron operation to surface real signal (first-week + first-month invocation patterns).

**Cross-references**: [ADR-0022 D-F](./docs/adr/0022-weekly-digest-scheduler.md) (failure handling scope); [ADR-0022 D-G](./docs/adr/0022-weekly-digest-scheduler.md) (free-tier monitoring sub-step); [ADR-0022 D-H](./docs/adr/0022-weekly-digest-scheduler.md) (Phase 32+ deferrals); [Q75](#q75-resend-account--domain-provisioning-operational-resend_api_key--email_from--dkimspfdmarc-records) (operational sibling — Q78 automates Q75's tier-monitoring sub-step); [Q77](#q77-vercel-cron-production-setup--cron_secret-provisioning-operational-weekly-digest-scheduler) (operational sibling — Q77 is the gate Q78 evolves observability for).

## Q79. "Manage my subscriptions" UX page (architectural; ADR-0023 D-H Phase 34+ deferral)

**Status:** resolved 2026-05-17 (Unit 34.1): **Profile A read-only widget pinned** via the `/[locale]/profile` "Digest subscriptions" section per ADR-0023 D-H first-row realization. Realization shape: new `getSubscriptionsForUser(userId)` DB helper + `formatLastDigestLabel` pure helper in `lib/subscribers/` (third in-module DB helper after `getVerifiedSubscribersForDomain` Phase 31 + `createOrRefreshPendingSubscription` Phase 30); new `<section>` widget on `/[locale]/profile` between Watching + Your rating challenges (mirrors existing multi-widget density pattern); per-row display = domain title(s) joined as list + last-digest ISO date or "Never" + per-row "Unsubscribe" `<a>` link reusing Phase-30 ADR-0021 D-E unsubscribe-token flow (**no new server action; no JS confirmation; direct href click matches single-click email-link UX**); 8 new i18n keys per locale extending existing `profile.*` namespace; zero client-bundle cost (server-rendered; `/profile` page bundle UNCHANGED at 2.31 kB / 117 kB). **First user-visible consumer of Phase-33 `subscriber.userId` FK** in project history. **Closes ADR-0023 D-H first-row deferral at 0-phase age — tightest possible deferral-to-realization gap in project history** (Q79 surfaced Phase 33 + closed Phase 34 = 0-phase Q-carryover; prior tightest = 1-phase via Phase 30 → 31 B.15 item 1 close). **Subscriber-list-email arc extends to 5 phases** = Phase 30 (foundation) → 31 (scheduler) → 32 (cleanup) → 33 (auth-linkage) → 34 (UX) = **first 5-phase complete-feature-with-UX arc in project history**. **Profile B full-edit UX** (add / remove domains inline without re-submit; subscription-preference editing) + **Profile C combined-with-curator-analytics dashboard** remain Phase 35+ candidates per ADR-0023 D-H; if Phase-34+ feedback surfaces a need for them, they ship as UX-track follow-ons (~1-2 units Profile A → 3-4 units Profile B → 3-4 units Profile C). Other ADR-0023 D-H deferrals (per-problem subscriptions / cross-domain aggregated summary / subscriber-list export / user-merge UI / account-deletion flow that uses the cascade / per-user-account-subscription audit trail / soft-delete vs hard-delete revisit) carry forward Phase 35+. · **Surfaced:** [ADR-0023](./docs/adr/0023-per-user-account-subscriptions.md) D-H; **Resolved:** Unit 34.1 (Profile A widget ship).

Phase 33's [ADR-0023](./docs/adr/0023-per-user-account-subscriptions.md) D-H names "manage my subscriptions" page on `/[locale]/profile` as the **first Phase-34+ deferred surface**. Phase 33 ships the FK column + auto-populate logic + cascade-on-user-delete constraint architecturally; signed-in users CAN have their subscriptions linked to their account but CANNOT view / manage them through a dedicated UI (existing unsubscribe-token flow per ADR-0021 D-E continues to work — single-click email link).

**Phase 34+ candidates** (each requires Q79 promotion + follow-on UX-track work):

1. **Read-only "my subscriptions" widget on `/[locale]/profile`** — list subscribed taxonomy domains + last-digest-sent-at (from Phase-31 `lastDigestSentAt` column) + per-subscription unsubscribe button. Minimal scope; couples to existing `/profile` page Phase-15+.
2. **Full subscription-management UX** — add / remove domain subscriptions inline without re-submitting the subscribe form; per-row state-machine UI; couples to `lib/subscribers/createOrRefreshPendingSubscription` (Phase-30 + 33) + new `updateSubscriptionDomains` helper.
3. **Per-problem subscription opt-in UI** — if Phase-34+ ships per-problem subscriptions (Q76-sibling-expansion per ADR-0023 D-H), the `/profile` UI adds problem-checklist controls.
4. **Email-preference editing** — per-subscriber preferred send-day / send-time (couples to ADR-0022 D-H deferral); requires schema column extension.

**Question to resolve in Phase 34+**: which scope to ship first? Three resolution profiles:

- **Profile A (read-only first)**: ship #1 minimal widget. ~1-2 units; lowest scope; lays the surface for #2 progressive enhancement.
- **Profile B (full-edit first)**: ship #2 full-management UX. ~3-4 units; couples to new domain-update helper + state-machine UI; higher complexity but full feature parity with subscribe form.
- **Profile C (combined #1 + curator analytics)**: ship #1 widget + ADR-0023 D-H second-row curator analytics dashboard in tandem. ~3-4 units; couples to ADR-0014 curator-review-pipeline patterns.

**Phase-33 lean**: Profile A is the most defensible Phase-34+ first thread (lowest cost, builds the surface progressively). But the decision waits for signed-in user feedback to inform the management-UX shape (which subscriptions to manage / how often to edit / etc.).

**Cross-references**: [ADR-0023 D-H](./docs/adr/0023-per-user-account-subscriptions.md) (Phase 34+ deferrals — names this page as the first-row deferral); [Q76](#q76-per-user-account-based-subscriptions) (architectural parent — resolved Phase 33 via ADR-0023; Q79 is the UX-side follow-on); [ADR-0015 D-F](./docs/adr/0015-per-user-privacy-model.md) ("two surfaces per identity" pattern — `/profile` Phase-14 surface extends for Q79); [ADR-0021 D-E](./docs/adr/0021-subscriber-list-email.md) (unsubscribe-token flow — preserved; Q79 widget complements, does NOT replace).
