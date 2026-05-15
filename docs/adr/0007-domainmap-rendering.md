# ADR-0007 — DomainMap rendering target & D3 import policy

- **Status:** accepted
- **Date authored:** 2026-05-15
- **Date accepted:** 2026-05-15
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §11 catalog item 4 specifies **DomainMap**:

> "D3 force-directed graph of (domain → subdomain → problem) nodes, sized by composite rating; brushable. (Landing + /domains.)"

The 4 existing visualizations (Unit 1.5 `RatingRadar`, Units 3.6 / 3.7 / 3.8 `SaturationCurve` / `MoversBoard` / `RatingHistoryStream`) are all **SSR-only static SVG**, no D3, no client JS. DomainMap is structurally different from those: a force-directed graph requires per-frame position computation that ships in a JS library.

Two decisions follow:

1. **What renders the graph?** SVG, Canvas, or HTML/CSS.
2. **How does D3 land in the dep tree?** Tree-shaken sub-packages, umbrella `d3`, or no D3 at all.

[OPEN_QUESTIONS Q40](../../OPEN_QUESTIONS.md#q40-adr-0007-scope) (Unit 4.0 THINK) leaned toward a single ADR covering both decision-clusters. They form one design question — "how do we render force graphs in this codebase" — and splitting them is bureaucratic without architectural value.

## Decision Drivers

- **§13 acceptance-gate a11y.** Lighthouse a11y ≥ 95 is a cross-phase gate enforced from Unit 1.12 (closes Q27). Phase-3 SVG vizes pass via `role="img"` + `aria-describedby` → `<desc>` pattern; DomainMap must inherit this.
- **§5.5 bundle-size budget.** First Load JS shared chunk held at 103 kB across all of Phase 3 (Units 3.0 – 3.13). D3 introduces the largest dep delta of any Phase-4 unit; the choice between umbrella and tree-shaken governs whether the bundle bump is ~150 KB gz or ~15 KB gz.
- **Operator familiarity.** The 4 existing vizes share an SSR-SVG pattern + the `chart-table-switch.tsx` table-fallback (Unit 3.12). Any new render target diverges from that pattern.
- **Hydration safety.** Server-rendered SVG with deterministic positions removes a class of bugs the future client-drag follow-on would otherwise create.
- **Q31 — Velite-Zod duplication.** No relevance here (DomainMap doesn't add new schemas), but worth noting that staying on the established SVG / SSR / loaders pattern means no new contract surface.

## Considered Options

1. **SVG render target + tree-shaken D3 sub-packages** (chosen).
2. **Canvas (or OffscreenCanvas) render target + tree-shaken D3 sub-packages.**
3. **SVG render target + umbrella `d3` package.**
4. **HTML/CSS render target + tree-shaken D3 sub-packages.**
5. **A React force-graph wrapper library** (e.g. `react-force-graph-2d`).

## Decision Outcome

**Chosen: Option 1 — SVG render + tree-shaken D3 sub-packages.**

### Render target (SVG)

DomainMap (`components/viz/DomainMap/index.tsx`, Unit 4.2) renders a single `<svg viewBox="0 0 600 420">` with:

- `role="img"`, `aria-label`, `aria-describedby` → `<desc>` listing all visible nodes (mirrors Phase-3 viz a11y plumbing).
- `<g>` group per node with a native `<title>` for hover tooltip + (when applicable) an enclosing `<a href>` for click navigation.
- `<line>` elements for edges, marked `aria-hidden="true"` (parent/child relationship is in the `<desc>`).
- No `"use client"` directive. Pure SSR.

### D3 import policy (tree-shaken)

| Sub-package         | Status            | Phase-4 rationale                                    |
|---------------------|-------------------|------------------------------------------------------|
| `d3-force`          | **installed + imported** (Unit 4.1 + 4.2) | Force simulation primitives. |
| `d3-selection`      | **installed**, unused at HEAD (Unit 4.1)  | Reserved for the future client-drag follow-on; tree-shaken from client bundle. |
| `d3-scale`          | not installed     | `Math.sqrt` covers `radius = sqrt(composite) × k` (Unit 4.0 D-4); install when 4.3 / 4.4 reveal a need. |
| `d3-zoom`           | not installed     | Zoom/pan scoped out per Unit 4.0 D-6.                |
| umbrella `d3`       | **forbidden**     | ~150 KB gz vs. ~15 KB gz tree-shaken; the 10× bundle penalty buys nothing. |

### Deterministic SSR layout

`d3-force` normally seeds with `Math.random()` for initial node positions, which would produce different SSR output across renders. DomainMap pre-seeds each node's `x` / `y` on a circle around the viewport center, indexed by input-array position:

```ts
const seedR = Math.min(VIEW_W, VIEW_H) / 3;
const simNodes = nodes.map((n, i) => ({
  ...n,
  x: VIEW_W / 2 + Math.cos((i / nodes.length) * Math.PI * 2) * seedR,
  y: VIEW_H / 2 + Math.sin((i / nodes.length) * Math.PI * 2) * seedR,
}));
```

Deterministic initial positions + deterministic forces (forceLink + forceManyBody + forceCenter) → identical simulation output across SSR renders. No `Math.random()` drift.

Test coverage: `components/viz/DomainMap/index.test.tsx` asserts `render(props) === render(props)` for the same input — locked in by the parallel session in Unit 4.2.

### Realized tuning constants (Unit 4.2)

| Constant              | Value | Owner            |
|-----------------------|-------|------------------|
| `VIEW_W`              | 600   | Layout           |
| `VIEW_H`              | 420   | Layout           |
| `LINK_DISTANCE`       | 60    | force-link       |
| `CHARGE_STRENGTH`     | -180  | force-charge     |
| `CENTER_STRENGTH`     | 0.05  | force-center     |
| `N_TICKS`             | 300   | simulation       |
| `RADIUS_K_PROBLEM`    | 5     | sizing           |
| `RADIUS_K_SUBDOMAIN`  | 5.5   | sizing           |
| `RADIUS_K_DOMAIN`     | 7     | sizing           |

Re-tuning trigger: if content scales 3× (Phase-5 ingest), or if user-research signals reveal density / readability issues, re-evaluate these via empirical observation. Re-tuned values supersede this ADR's table via a follow-on note in the relevant unit's CHANGELOG entry; the constants themselves move via the implementation file.

### Consequences

- **Positive:** Inherits Phase-3 viz a11y pattern (`role="img"` + `<desc>`); Lighthouse-a11y ≥ 95 gate carries over without bespoke work.
- **Positive:** **First Load JS shared chunk remained 103 kB UNCHANGED** through Unit 4.2's commit. `d3-force` runs server-side only; the static SVG that ships to clients is just markup. The Unit 4.0 D-2 projection of +20–25 KB gz applies when Units 4.3 / 4.4 wire client-side filter chips around the viz — that bump is page-attributed, not viz-attributed.
- **Positive:** Deterministic SSR makes hydration-mismatch a non-issue for the future drag follow-on.
- **Positive:** Same `chart-table-switch.tsx` table-fallback pattern works (Unit 4.2 ships `DomainMapTable` as the sibling fallback).
- **Negative:** Force-simulation constants are empirically tuned. New content shapes may require re-tuning; the table above must be kept current.
- **Negative:** `d3-selection` is installed but unused at Unit 4.2. Until the drag follow-on lands, it adds ~5 KB gz to `node_modules` (not to the client bundle — tree-shaking handles that).
- **Negative:** Static-only Phase-4 DomainMap defers drag (Unit 4.0 D-6 interaction #3). Click + hover + filter-chip dimming are the realized interactions; pin-and-release force-drag is a Phase-5 enhancement.

## Pros and Cons of the Options

### Option 1 — SVG + tree-shaken D3 (chosen)

- Good — same a11y pattern as 4 existing vizes; gate carries over.
- Good — bundle weight ~15 KB gz across all D3 sub-packages used.
- Good — `<title>` + `<a>` interactions are zero-JS; no client bundle for hover/click.
- Good — deterministic SSR; identical render across requests.
- Bad — force-layout tuning is manual + empirical (no native CSS or HTML auto-layout for force graphs).

### Option 2 — Canvas + tree-shaken D3

- Good — raw render speed (Canvas can paint 10,000+ nodes; SVG saturates around 1,000).
- Bad — no semantic structure for AT; would need a parallel hidden DOM mirror for a11y.
- Bad — `<a href>` click navigation is non-trivial on Canvas (hit-testing + manual nav).
- Bad — bundle weight similar to Option 1; speed advantage is unused at ~30 nodes.

### Option 3 — SVG + umbrella `d3`

- Good — single import; tree-shaking concerns offloaded to the bundler.
- Bad — ~150 KB gz of D3 modules we don't use (geo, hierarchy, axis, brush, transition).
- Bad — the bundler-tree-shaking story is fragile across Next.js / esbuild / webpack moves.

### Option 4 — HTML/CSS + tree-shaken D3

- Good — CSS transform-based positioning is fast.
- Bad — force-graph edges need SVG `<path>` regardless; ends up with two render systems.
- Bad — a11y story for absolutely-positioned `<div>` graphs is weaker than `<svg>`'s semantics.

### Option 5 — React force-graph wrapper

- Good — minimal code in the viz; pre-built drag + zoom + tooltip.
- Bad — most popular wrappers bundle Canvas; conflicts with the SVG-first Phase-3 pattern.
- Bad — wrappers carry opinions about state model and event handling that constrain a11y plumbing.
- Bad — larger dep tree.

## Links

- MASTER_PROMPT.md §5.5 (bundle budget), §11 catalog item 4 (DomainMap), §13 Phase-4 deliverables.
- [OPEN_QUESTIONS Q40](../../OPEN_QUESTIONS.md#q40-adr-0007-scope) — the open question this ADR closes.
- Related ADRs: [ADR-0001](./0001-nextjs-app-router.md) (App Router; informs the SSR / "use client" boundary), [ADR-0006](./0006-saturation-na-encoding.md) (most recent ADR; structural precedent).
- Phase-4 prep: [docs/thinking/4.0-phase-4-prep.md](../thinking/4.0-phase-4-prep.md) — D-1 and D-2 sections.
- Implementation: [`components/viz/DomainMap/index.tsx`](../../components/viz/DomainMap/index.tsx) (Unit 4.2, commit `be29236`).
