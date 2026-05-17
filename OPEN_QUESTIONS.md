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

**Status:** open (privacy candidate; surfaced 2026-05-16 Unit 16.1 per ADR-0017 D-B + D-H deferral; Phase 17+ if user privacy report surfaces).

Phase 16 ships image upload WITHOUT EXIF stripping. User-uploaded photos may embed GPS coordinates, camera serial numbers, datetime metadata, and other PII. The `imageOverride` URL is publicly served via Vercel Blob CDN; any client downloading the avatar can read the embedded EXIF.

Deferred per ADR-0017 D-H: "EXIF stripping — privacy concern (GPS metadata, camera serials). Defer until first user privacy report."

Phase-17+ resolution options (in roughly increasing complexity):

- **`sharp` server-side pipeline** — reads upload, strips EXIF, re-encodes; ~30 KB additional bundle; well-known + battle-tested. Lean choice.
- **External transcoding service** (Vercel Image Optimization / Cloudinary / similar) — heavier; eats into request budget.
- **Client-side stripping pre-upload** — browser-side EXIF strip via JavaScript; user-trustable surface; ~10 KB additional bundle on `/profile`; couples to client component.

Surfaces ADR-0018+ candidate for the image-transcoding pipeline choice. ~2-3 units when promoted.

Couples to **Q68 expansion** (content moderation on uploaded images) — both surfaces sit in the "uploaded image needs server-side processing" category; pipeline choice may land them together.
