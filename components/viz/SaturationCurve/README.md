# SaturationCurve

Phase 3 catalog item 2 (§11). Line chart of one problem's saturation over time.

## Data shape

Input: `RatingAction[]` — chronologically ordered (oldest → newest) rating actions for a single problem. The component reads `action.dimensions.saturation` from each and plots it.

Per ADR-0006:

- `saturation.value: number (0-100)` — plotted directly.
- `saturation.value: null, qualitative_band: 'low' | 'medium' | 'high'` — plotted at the band's center-of-bucket (20 / 50 / 80) as a **hollow circle with an "N/A" label**. The connecting line breaks around qualitative points so the viz doesn't visually conflate numeric and qualitative samples.

For a problem with a single initial rating action, only one dot renders (no line).

For an empty `actions` array, the component renders a figure with caption "No rating actions to plot".

## Output

- SVG `viewBox="0 0 400 200"`.
- Y-axis: 0 → 100 with ticks at 0 / 25 / 50 / 75 / 100. The 100 line is dashed and labelled "ceiling (§8.2)".
- X-axis: dates linearly mapped between min and max action date. Labels at first / middle / last when ≥ 3 points; all when ≤ 3.
- Line: `stroke="var(--color-chart-2)"`, the saturation chart hue (Unit 0.4 design tokens).
- Numeric dots: solid `--color-chart-2`.
- Qualitative dots: hollow (white-fill stroked with `--color-chart-2`), with a small "N/A" label above.

## A11y

- `role="img"` + derived `aria-label` (defaults to `<problemTitle> — saturation over time`).
- `<desc id="saturation-curve-desc">` lists each action's date + raw value + confidence percent — fully serialized text for screen readers.
- Per-point `<title>` for hover tooltips: `"<date>: <rawDisplay> (confidence N%)"`.
- All text uses `font-family: var(--font-sans)` or `var(--font-mono)` per token convention.

## Storybook stories

- `HallucinationReduction3Actions` — 3 actions (initial 35 → q3 32 → q4 32). Hallucination-reduction-like.
- `ComputeOptimal3Actions` — 3 actions (initial 35 → q3 30 → q4 30). Compute-optimal-like.
- `SingleInitialOnly` — single point, no line.
- `Empty` — `actions: []`, renders the empty-state figure.
- `QualitativeOnly` — 3 actions, all `value: null + qualitative_band` (forward-looking — no current data exercises this). Demonstrates band-center plotting.
- `MixedNumericAndQualitative` — alternating numeric / qualitative; the line breaks around the qualitative point.

## Where this renders

- `/problems/[slug]/history` page composition lands in Unit 3.9 — stacked with `RatingHistoryStream` (Unit 3.8) and a TimelineRibbon-light (anticipated Phase-4 scope).
- Table-fallback toggle: wired in Unit 3.12.

## Performance

Pure server-render. No client JS. No D3 dependency. All coordinate math is inline (proportional date-mapping + linear y-scale). SVG output is small (~2KB per render for a 3-point series).
