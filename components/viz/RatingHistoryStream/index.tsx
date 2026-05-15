import { dimensionsToRadar, type DimensionId } from "@/lib/ratings/normalize";
import type { RatingAction } from "@/lib/schemas/rating-action";

/**
 * RatingHistoryStream — Phase 3 catalog item 8 (§11).
 *
 * Stepped center-baseline stacked area ("streamgraph") of the five rating
 * dimensions over time for one problem. Each dimension's normalized [0, 5]
 * value contributes to a colored band's thickness at each rating-action
 * date; bands are stacked symmetrically around a horizontal midline.
 *
 * Per Unit 3.0 D-10: stepped (rating actions are discrete events, not
 * continuous samples).
 *
 * Sibling to SaturationCurve (Unit 3.6) — same SVG-only / no-D3 /
 * server-renderable / role="img" + <desc> accessibility pattern.
 */

const VIEW_W = 480;
const VIEW_H = 220;
const PAD_LEFT = 8;
const PAD_RIGHT = 8;
const PAD_TOP = 24;
const PAD_BOTTOM = 32;
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const MID = PAD_TOP + PLOT_H / 2;
const MAX_TOTAL = 25; // 5 dimensions × max-normalized 5 each
const Y_PER_UNIT = (PLOT_H / MAX_TOTAL) * 0.9; // 10% headroom

const DIMENSION_ORDER: DimensionId[] = [
  "difficulty",
  "saturation",
  "urgency",
  "value",
  "industry_call",
];

const CHART_VAR_INDEX: Record<DimensionId, 1 | 2 | 3 | 4 | 5> = {
  difficulty: 1,
  saturation: 2,
  urgency: 3,
  value: 4,
  industry_call: 5,
};

const DIM_LABELS: Record<DimensionId, string> = {
  difficulty: "Difficulty",
  saturation: "Saturation (openness)",
  urgency: "Urgency",
  value: "Value",
  industry_call: "Industry call",
};

export interface RatingHistoryStreamProps {
  /** Chronologically ordered (oldest → newest) rating actions for one problem. */
  actions: RatingAction[];
  problemTitle?: string;
  width?: number;
  height?: number;
  ariaLabel?: string;
}

function toDateString(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

function toMs(d: unknown): number {
  if (d instanceof Date) return d.getTime();
  if (typeof d === "string") return new Date(d).getTime();
  return new Date(String(d)).getTime();
}

interface Slice {
  date: string;
  ms: number;
  /** Per-dimension normalized [0, 5] values, in DIMENSION_ORDER. */
  values: number[];
}

function buildSlices(actions: RatingAction[]): Slice[] {
  return actions.map((a) => {
    const points = dimensionsToRadar(a.dimensions);
    // Index points by dimension so we can read in canonical order regardless of input.
    const byDim = new Map<DimensionId, number>(points.map((p) => [p.dimension, p.normalized]));
    return {
      date: toDateString(a.date),
      ms: toMs(a.date),
      values: DIMENSION_ORDER.map((d) => byDim.get(d) ?? 0),
    };
  });
}

export function RatingHistoryStream({
  actions,
  problemTitle,
  width = 480,
  height = 220,
  ariaLabel,
}: RatingHistoryStreamProps) {
  const slices = buildSlices(actions);
  const title = problemTitle
    ? `${problemTitle} — rating dimensions over time`
    : "Rating dimensions over time";
  const computedAriaLabel = ariaLabel ?? title;

  if (slices.length === 0) {
    return (
      <figure className="text-muted-foreground text-xs italic">
        <svg
          role="img"
          aria-label={computedAriaLabel}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width={width}
          height={height}
          className="block"
        >
          <desc>No rating actions to plot.</desc>
        </svg>
        <figcaption>No rating actions to plot.</figcaption>
      </figure>
    );
  }

  const msValues = slices.map((s) => s.ms);
  const minMs = Math.min(...msValues);
  const maxMs = Math.max(...msValues);
  const xPos = (ms: number): number => {
    if (maxMs === minMs) return PAD_LEFT + PLOT_W / 2;
    return PAD_LEFT + ((ms - minMs) / (maxMs - minMs)) * PLOT_W;
  };

  // Per slice, compute the y-coordinate of each band's top edge, stacking
  // upward from the centered baseline. Bands occupy [lower, upper]; bands
  // stack so each band's lower = previous band's upper, and the WHOLE stack
  // is centered: lower of the bottom-most band = MID - total/2 * Y_PER_UNIT.
  const stacked = slices.map((s) => {
    const total = s.values.reduce((acc, v) => acc + v, 0);
    let cursor = MID - (total / 2) * Y_PER_UNIT;
    const bands = s.values.map((v) => {
      const lower = cursor;
      const upper = cursor + v * Y_PER_UNIT;
      cursor = upper;
      return { lower, upper };
    });
    return { x: xPos(s.ms), bands };
  });

  // For each dimension, build a stepped polygon by walking left→right along
  // the upper edge then right→left along the lower edge.
  const streamPaths = DIMENSION_ORDER.map((_dim, dimIdx) => {
    const upperPts: string[] = [];
    const lowerPts: string[] = [];
    for (let i = 0; i < stacked.length; i++) {
      const cur = stacked[i]!;
      const band = cur.bands[dimIdx]!;
      if (i === 0) {
        upperPts.push(`M ${cur.x.toFixed(2)} ${band.upper.toFixed(2)}`);
        lowerPts.unshift(`L ${cur.x.toFixed(2)} ${band.lower.toFixed(2)}`);
        continue;
      }
      const prev = stacked[i - 1]!;
      const prevBand = prev.bands[dimIdx]!;
      const midX = ((prev.x + cur.x) / 2).toFixed(2);
      // Stepped upper edge: hold prev.upper to midX, then jump to cur.upper.
      upperPts.push(`L ${midX} ${prevBand.upper.toFixed(2)}`);
      upperPts.push(`L ${midX} ${band.upper.toFixed(2)}`);
      upperPts.push(`L ${cur.x.toFixed(2)} ${band.upper.toFixed(2)}`);
      // Stepped lower edge (will be reversed at end): collect in forward order.
      lowerPts.unshift(`L ${cur.x.toFixed(2)} ${band.lower.toFixed(2)}`);
      lowerPts.unshift(`L ${midX} ${band.lower.toFixed(2)}`);
      lowerPts.unshift(`L ${midX} ${prevBand.lower.toFixed(2)}`);
    }
    return `${upperPts.join(" ")} ${lowerPts.join(" ")} Z`;
  });

  const desc = slices
    .map(
      (s) =>
        `${s.date}: ${DIMENSION_ORDER.map(
          (d, i) => `${DIM_LABELS[d]} ${s.values[i]!.toFixed(1)}/5`,
        ).join(", ")}`,
    )
    .join("; ");

  return (
    <figure>
      <svg
        role="img"
        aria-label={computedAriaLabel}
        aria-describedby="rating-history-stream-desc"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={width}
        height={height}
        className="block"
      >
        <desc id="rating-history-stream-desc">
          {title}. {desc}
        </desc>

        {/* Center midline */}
        <line
          x1={PAD_LEFT}
          y1={MID}
          x2={VIEW_W - PAD_RIGHT}
          y2={MID}
          stroke="var(--color-border)"
          strokeWidth={0.4}
          strokeDasharray="2 2"
        />

        {/* Dimension streams */}
        {streamPaths.map((d, i) => {
          const dim = DIMENSION_ORDER[i]!;
          const colorIdx = CHART_VAR_INDEX[dim];
          return (
            <path
              key={dim}
              d={d}
              fill={`var(--color-chart-${colorIdx})`}
              fillOpacity={0.65}
              stroke={`var(--color-chart-${colorIdx})`}
              strokeWidth={0.5}
            >
              <title>{DIM_LABELS[dim]}</title>
            </path>
          );
        })}

        {/* X-axis date labels (first / mid / last when ≥ 3; else all) */}
        {(() => {
          const labelIndices =
            slices.length <= 3
              ? slices.map((_, i) => i)
              : [0, Math.floor(slices.length / 2), slices.length - 1];
          return labelIndices.map((i) => {
            const s = slices[i]!;
            return (
              <text
                key={`xlabel-${i}`}
                x={xPos(s.ms)}
                y={VIEW_H - 8}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-muted-foreground)"
                fontFamily="var(--font-sans)"
              >
                {s.date.slice(0, 7)}
              </text>
            );
          });
        })()}

        {/* Dimension legend along the top */}
        {DIMENSION_ORDER.map((dim, i) => {
          const colorIdx = CHART_VAR_INDEX[dim];
          const x = PAD_LEFT + (i * PLOT_W) / DIMENSION_ORDER.length + 4;
          return (
            <g key={`legend-${dim}`}>
              <rect
                x={x}
                y={PAD_TOP - 16}
                width={8}
                height={6}
                fill={`var(--color-chart-${colorIdx})`}
                fillOpacity={0.65}
              />
              <text
                x={x + 12}
                y={PAD_TOP - 11}
                fontSize={7}
                fill="var(--color-muted-foreground)"
                fontFamily="var(--font-sans)"
              >
                {DIM_LABELS[dim]}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
