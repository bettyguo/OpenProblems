# ADR-0001 — Next.js 15 App Router as the application framework

- **Status:** accepted
- **Date authored:** 2026-05-14
- **Date accepted:** 2026-05-14
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

The site has three workload profiles that any framework must serve well:

1. **Long-form content pages** (problem detail, methodology, background MDX) — predominantly server-rendered prose, math, and tables; SEO matters; LCP target < 1.8 s on slow 4G (MASTER_PROMPT.md §10.4).
2. **Dense, interactive dashboards** (`/trending`, problem `/history`, DomainMap) — D3 / Visx / react-force-graph, lazy-loaded chunks, client-side state, filtering.
3. **A read-only JSON API** (`/api/v1/...`) and an RSS feed for the rating actions log (§9, §8.5).

The framework is the load-bearing decision for unit 0.2 and constrains every later unit (routing shape in 0.10, deployment in 0.12, ISR strategy when rating actions land in Phase 3, eventual auth in Phase 4).

## Decision Drivers

- **First-paint performance on content pages.** Server-render the prose; ship JS only for islands of interactivity.
- **Visualization compatibility.** D3, Visx, Recharts, react-force-graph, Cytoscape.js — all React-first. The framework must not impose an SSR straitjacket on these.
- **MDX ergonomics.** First-class MDX support, or trivial integration with one (ADR-0002).
- **Edge / ISR.** Ability to incrementally regenerate problem detail pages when a new rating action is published, without redeploying the whole site.
- **Deployment surface.** Native fit with the assumed host (Vercel, pending Q3).
- **Ecosystem depth.** Tailwind v4 + shadcn/ui + Storybook 9 + Playwright + Lighthouse-CI are all most fluent in a React-first, Next-flavored stack.
- **Hiring & contributor pool.** This is a long-lived academic-adjacent project; contributors are most likely to know React.
- **Methodology cost of change.** This decision is hardest to reverse later. Optimize for "still right in 24 months."

## Considered Options

1. Next.js 15 (App Router) + React 19 + TypeScript strict.
2. Astro 5 + React islands.
3. SvelteKit.
4. Remix (now under the Next umbrella since 2024).

## Decision Outcome

**Chosen: Option 1 — Next.js 15 App Router.**

The App Router's React Server Components match workload (1) better than any competing framework: prose pages ship near-zero JS by default, while dashboard routes opt into client components only where the chart code lives. ISR handles the "publish a rating action, regenerate this one page" workflow with a single revalidation tag, which we will lean on when Phase 3 adds the rating-action log. The Vercel deploy story is native, including preview-per-PR — important for editorial review of content PRs.

We accept that the App Router has rougher edges than the Pages Router (caching semantics evolved through 14.x and 15.x; some libraries lag on RSC compatibility) in exchange for a strictly more capable model.

### Consequences

- **Positive:** RSC for content; ISR for rating regeneration; `next/dynamic` for viz code-splitting; `next/image` and `next/font` (Inter + Source Serif 4 + JetBrains Mono per §5.2); Vercel-native preview deploys; first-class TypeScript and Tailwind v4 support.
- **Positive:** Largest contributor pool of any option — important for a project whose value scales with editorial contributions.
- **Negative:** App Router caching semantics require care; the validate-content script (Unit 0.7) and the rating-actions revalidation flow (Phase 3) must be designed explicitly, not implicitly.
- **Negative:** RSC's "no React context across the server/client boundary" forces some discipline in viz wiring — addressed by keeping viz components in `components/viz/` as client components with thin server-rendered shells.
- **Negative:** A future move to non-Vercel hosting would mean re-implementing ISR semantics; mitigated by treating `revalidateTag` as the only ISR primitive we depend on.

## Pros and Cons of the Options

### Option 1 — Next.js 15 App Router

- Good — RSC for content + client islands for viz is the exact fit for our three workload profiles.
- Good — ISR via `revalidateTag` matches the rating-action publishing model.
- Good — Vercel native (Q3 pending), preview deploys per PR.
- Good — largest ecosystem for the specific libraries we need (shadcn/ui, Velite, Visx, react-force-graph, Cytoscape.js).
- Bad — App Router caching is the steepest learning curve of any option.
- Bad — server/client boundary requires explicit "use client" on every viz component.

### Option 2 — Astro 5 + React islands

- Good — best-in-class for pure-content sites; ships even less JS than Next on prose pages.
- Good — first-class MDX; component-island model maps cleanly to viz.
- Bad — dashboard interactivity (filtering, brushing on DomainMap, the "Recompose" composite re-weighting UI from §13 Phase 3) is awkward outside of one large React island, at which point Next's RSC model is the better fit.
- Bad — no ISR-equivalent; on-demand page regeneration on rating actions requires a custom rebuild trigger.
- Bad — smaller pool of pre-built integrations for Storybook 9 + Lighthouse-CI + Playwright at the depth we need.

### Option 3 — SvelteKit

- Good — excellent DX, smaller bundles, fast.
- Bad — viz ecosystem is materially smaller than React's for our specific list (react-force-graph in particular has no Svelte equivalent at parity).
- Bad — contributor pool noticeably smaller for an academic-adjacent project.
- Bad — shadcn/ui has a Svelte port but it lags the React original.

### Option 4 — Remix

- Good — strong loaders/actions story; great form handling.
- Bad — since the 2024 alignment with Next, Remix's distinctive advantages are narrowing; we get the Next ecosystem either way.
- Bad — ISR story is weaker than App Router's `revalidateTag`.
- Bad — no compelling reason to pick over Option 1 given the merge.

## Links

- MASTER_PROMPT.md §5.1, §5.10, §10.4, §13 Phase 0.
- Related: ADR-0002 (MDX pipeline), ADR-0003 (Zod schemas), ADR-0004 (file-first storage).
