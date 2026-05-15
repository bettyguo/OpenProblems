# RatingHistoryStream

Phase 3 catalog item 8 (§11). Stepped center-baseline stacked area ("streamgraph") of the 5 rating dimensions over time for one problem.

## Data shape

Input: `RatingAction[]` — chronologically ordered (oldest → newest) rating actions for one problem.

For each action, the component computes the 5 normalized [0, 5] dimension values via `dimensionsToRadar` (Unit 0.4 + Unit 3.11 ADR-0006 handling for null saturation).

## Output

- SVG `viewBox="0 0 480 220"` with stepped polygons centered on a horizontal midline.
- 5 bands, color-coded by `--color-chart-1` … `--color-chart-5` (matching Unit 0.4 design tokens):
  - chart-1 = Difficulty
  - chart-2 = Saturation (openness)
  - chart-3 = Urgency
  - chart-4 = Value
  - chart-5 = Industry call
- Band thickness = the dimension's normalized [0, 5] value at that time slice.
- Stack ordering is fixed (`DIMENSION_ORDER` constant); changing order changes which color sits adjacent to which.
- Steps between time slices via `M x1 y1 L midX y1 L midX y2 L x2 y2` — the band holds its prior value to the midpoint between consecutive action dates, then jumps to the new value (Unit 3.0 D-10).
- A 5-item legend along the top names each band's dimension.
- X-axis labels in `YYYY-MM` form at first / middle / last actions (or all when ≤ 3 actions).
- Dashed center midline for visual reference.

## A11y

- `<svg role="img" aria-label="..." aria-describedby="rating-history-stream-desc">`.
- `<desc>` serializes every action's date + the 5 dimensions' normalized values for screen readers.
- `<title>` on each `<path>` carries the dimension name for hover tooltips.
- Text uses `var(--font-sans)` at font-size 7–8 with `--color-muted-foreground` — meets AA contrast.

## Storybook stories

- `HallucinationReduction3Actions` — saturation drops, others flat.
- `ScalableOversight3Actions` — difficulty S throughout, saturation slow climb.
- `AllDimensionsMove4Actions` — showcase with movement on every dimension.
- `SingleInitialOnly` — 1 action, renders as a single time slice (no stepped transitions).
- `Empty` — renders the empty-state figure.

## Where this renders

- `/problems/[slug]/history` page composition (Unit 3.9), stacked under TimelineRibbon-light and SaturationCurve. The streamgraph adds the multi-dimensional view; the curve focuses on saturation alone.
- Table-fallback toggle: wired in Unit 3.12 — will surface the same data as a `<table>` for keyboard / screen-reader users.

## Performance

Pure server-render. No client JS. No D3. Polygon paths are O(n_actions × 5_dimensions) — tractable for any plausible history length. SVG output is a few KB per render.
