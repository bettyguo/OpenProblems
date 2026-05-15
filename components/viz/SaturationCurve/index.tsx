import type { RatingAction } from "@/lib/schemas/rating-action";

/**
 * SaturationCurve — Phase 3 catalog item 2 (§11).
 *
 * Line chart of saturation over time for one problem. Reads each rating
 * action's `dimensions.saturation` and plots it against the action date.
 * Ceiling line at 100 marks the §8.2-defensible upper bound; lower-saturation
 * = more open problem.
 *
 * Per Unit 3.0 D-9: problem-level (rating-action data), not benchmark-level.
 * Benchmark-overlay is a Phase-4 enhancement.
 *
 * Per ADR-0006: when `value` is null + `qualitative_band` is set, the band
 * center-of-bucket is plotted as a hollow marker with an "N/A" annotation.
 * Numeric and null points coexist on the same curve; the line connects
 * consecutive numeric values only (gaps around null points).
 */

const VIEW_W = 400;
const VIEW_H = 200;
const PAD_LEFT = 40;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;
const PLOT_W = VIEW_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const Y_TICKS = [0, 25, 50, 75, 100];

const BAND_TO_CENTER: Record<"low" | "medium" | "high", number> = {
  low: 20,
  medium: 50,
  high: 80,
};

export interface SaturationCurveProps {
  /** Chronologically ordered (oldest → newest) rating actions for one problem. */
  actions: RatingAction[];
  /** Optional problem title threaded into the aria-label / desc text. */
  problemTitle?: string;
  width?: number;
  height?: number;
  ariaLabel?: string;
}

interface PlottedPoint {
  /** ISO YYYY-MM-DD for display. */
  date: string;
  /** Numeric value to plot (0–100). Equal to action.dimensions.saturation.value
   * when set, or the qualitative_band center-of-bucket when value is null. */
  plotValue: number;
  /** True when this point is the qualitative-band fallback. */
  isQualitative: boolean;
  qualitativeBand?: "low" | "medium" | "high";
  /** Curator confidence in [0, 1]. */
  confidence: number;
  /** Raw display string ("35" or "N/A (medium)"). */
  rawDisplay: string;
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

function shortDate(iso: string): string {
  // "2026-09-01" → "2026-09".
  return iso.slice(0, 7);
}

function normalize(actions: RatingAction[]): PlottedPoint[] {
  return actions.map((a) => {
    const s = a.dimensions.saturation;
    if (s.value !== null) {
      return {
        date: toDateString(a.date),
        plotValue: s.value,
        isQualitative: false,
        confidence: s.confidence,
        rawDisplay: String(s.value),
      };
    }
    const band = s.qualitative_band ?? "medium";
    return {
      date: toDateString(a.date),
      plotValue: BAND_TO_CENTER[band],
      isQualitative: true,
      qualitativeBand: band,
      confidence: s.confidence,
      rawDisplay: `N/A (${band})`,
    };
  });
}

export function SaturationCurve({
  actions,
  problemTitle,
  width = 400,
  height = 200,
  ariaLabel,
}: SaturationCurveProps) {
  const points = normalize(actions);

  if (points.length === 0) {
    const label = ariaLabel ?? "Saturation curve (no data)";
    return (
      <figure className="text-muted-foreground text-xs italic">
        <svg
          role="img"
          aria-label={label}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          width={width}
          height={height}
          className="block"
        >
          <desc>No rating actions on disk yet.</desc>
        </svg>
        <figcaption>No rating actions to plot.</figcaption>
      </figure>
    );
  }

  const msValues = points.map((p) => toMs(p.date));
  const minMs = Math.min(...msValues);
  const maxMs = Math.max(...msValues);

  const xPos = (iso: string): number => {
    if (maxMs === minMs) return PAD_LEFT + PLOT_W / 2;
    const t = (toMs(iso) - minMs) / (maxMs - minMs);
    return PAD_LEFT + t * PLOT_W;
  };
  const yPos = (v: number): number => PAD_TOP + PLOT_H - (v / 100) * PLOT_H;

  // Line path connects only consecutive numeric points; null/qualitative
  // points break the path so the curve doesn't visually conflate the two.
  const segments: string[] = [];
  let currentRun: PlottedPoint[] = [];
  const flush = () => {
    if (currentRun.length >= 2) {
      const d = currentRun
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"} ${xPos(p.date).toFixed(2)} ${yPos(p.plotValue).toFixed(2)}`,
        )
        .join(" ");
      segments.push(d);
    }
    currentRun = [];
  };
  for (const p of points) {
    if (p.isQualitative) {
      flush();
    } else {
      currentRun.push(p);
    }
  }
  flush();

  const title = problemTitle ? `${problemTitle} — saturation over time` : "Saturation curve";
  const desc = points
    .map((p) => `${p.date}: ${p.rawDisplay} (confidence ${(p.confidence * 100).toFixed(0)}%)`)
    .join("; ");
  const computedAriaLabel = ariaLabel ?? title;

  return (
    <figure>
      <svg
        role="img"
        aria-label={computedAriaLabel}
        aria-describedby="saturation-curve-desc"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={width}
        height={height}
        className="block"
      >
        <desc id="saturation-curve-desc">
          {title}. {desc}
        </desc>

        {/* Y-axis grid + tick labels */}
        {Y_TICKS.map((t) => {
          const y = yPos(t);
          return (
            <g key={t}>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={VIEW_W - PAD_RIGHT}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={t === 100 ? 0.75 : 0.4}
                strokeDasharray={t === 100 ? "3 2" : undefined}
              />
              <text
                x={PAD_LEFT - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={8}
                fill="var(--color-muted-foreground)"
                fontFamily="var(--font-sans)"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* Ceiling annotation */}
        <text
          x={VIEW_W - PAD_RIGHT - 2}
          y={yPos(100) - 3}
          textAnchor="end"
          fontSize={8}
          fill="var(--color-muted-foreground)"
          fontFamily="var(--font-sans)"
        >
          ceiling (§8.2)
        </text>

        {/* X-axis baseline */}
        <line
          x1={PAD_LEFT}
          y1={yPos(0)}
          x2={VIEW_W - PAD_RIGHT}
          y2={yPos(0)}
          stroke="var(--color-border)"
          strokeWidth={0.6}
        />

        {/* X-axis date labels (first / mid / last when ≥ 3 points; else all) */}
        {(() => {
          const labelIndices =
            points.length <= 3
              ? points.map((_, i) => i)
              : [0, Math.floor(points.length / 2), points.length - 1];
          return labelIndices.map((i) => {
            const p = points[i]!;
            return (
              <text
                key={`xlabel-${i}`}
                x={xPos(p.date)}
                y={VIEW_H - 8}
                textAnchor="middle"
                fontSize={8}
                fill="var(--color-muted-foreground)"
                fontFamily="var(--font-sans)"
              >
                {shortDate(p.date)}
              </text>
            );
          });
        })()}

        {/* Line segments */}
        {segments.map((d, i) => (
          <path
            key={`seg-${i}`}
            d={d}
            fill="none"
            stroke="var(--color-chart-2)"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Data points */}
        {points.map((p, i) => {
          const cx = xPos(p.date);
          const cy = yPos(p.plotValue);
          return (
            <g key={`pt-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r={p.isQualitative ? 3.5 : 3}
                fill={p.isQualitative ? "var(--color-background)" : "var(--color-chart-2)"}
                stroke="var(--color-chart-2)"
                strokeWidth={p.isQualitative ? 1.25 : 0.75}
              >
                <title>
                  {p.date}: {p.rawDisplay} (confidence {(p.confidence * 100).toFixed(0)}%)
                </title>
              </circle>
              {p.isQualitative ? (
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  fontSize={7}
                  fill="var(--color-muted-foreground)"
                  fontFamily="var(--font-mono)"
                >
                  N/A
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
