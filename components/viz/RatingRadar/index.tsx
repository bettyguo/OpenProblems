import { dimensionsToRadar, meanConfidence, type RadarPoint } from "@/lib/ratings/normalize";
import type { RatingAction } from "@/lib/schemas/rating-action";

const AXIS_LABELS: Record<RadarPoint["dimension"], string> = {
  difficulty: "Difficulty",
  saturation: "Open vs. saturated",
  urgency: "Urgency",
  value: "Value",
  industry_call: "Industry call",
};

const CHART_VAR_INDEX: Record<RadarPoint["dimension"], 1 | 2 | 3 | 4 | 5> = {
  difficulty: 1,
  saturation: 2,
  urgency: 3,
  value: 4,
  industry_call: 5,
};

const VIEW_BOX = 200;
const CENTER = VIEW_BOX / 2;
const MAX_R = 80;
const LABEL_R = 96;
// Padding around the chart geometry to give axis labels room to render
// without being clipped by the SVG viewBox. The geometry (CENTER, MAX_R,
// LABEL_R) is unchanged; only the SVG's visible coordinate window
// expands outward by this amount on every side. With the default
// `preserveAspectRatio="xMidYMid meet"` and the explicit `width={size}`,
// the chart's apparent size shrinks slightly to fit the wider window.
const LABEL_PADDING = 36;
const ANGLES = [-90, -18, 54, 126, 198] as const; // 5 vertices, 72° apart, starting at top

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + Math.cos(rad) * r,
    y: CENTER + Math.sin(rad) * r,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export interface RatingRadarProps {
  dimensions: RatingAction["dimensions"];
  size?: number;
  ariaLabel?: string;
  /** When true, omit the entry animation. Useful for Storybook capture. */
  staticRender?: boolean;
}

export function RatingRadar({
  dimensions,
  size = 240,
  ariaLabel = "Rating radar",
  staticRender = false,
}: RatingRadarProps) {
  const points = dimensionsToRadar(dimensions);
  const confidence = meanConfidence(points);
  const fillOpacity = clamp(0.15 + (0.55 - 0.15) * confidence, 0.15, 0.55);

  // Polygon path through each normalized value.
  const polygonPoints = points
    .map((p, i) => {
      const angle = ANGLES[i % ANGLES.length] ?? -90;
      const r = (p.normalized / 5) * MAX_R;
      const { x, y } = polar(angle, r);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const desc = points
    .map(
      (p) =>
        `${AXIS_LABELS[p.dimension]}: ${p.rawDisplay} (confidence ${(p.confidence * 100).toFixed(
          0,
        )}%)`,
    )
    .join(". ");

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      aria-describedby="rating-radar-desc"
      viewBox={`${-LABEL_PADDING} ${-LABEL_PADDING} ${VIEW_BOX + 2 * LABEL_PADDING} ${VIEW_BOX + 2 * LABEL_PADDING}`}
      width={size}
      height={size}
      className="block"
    >
      <desc id="rating-radar-desc">{desc}</desc>

      {/* Grid rings */}
      {[0.2, 0.4, 0.6, 0.8, 1].map((step) => (
        <circle
          key={step}
          cx={CENTER}
          cy={CENTER}
          r={MAX_R * step}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={step === 1 ? 0.75 : 0.4}
        />
      ))}

      {/* Axes */}
      {points.map((p, i) => {
        const angle = ANGLES[i % ANGLES.length] ?? -90;
        const end = polar(angle, MAX_R);
        const idx = CHART_VAR_INDEX[p.dimension];
        return (
          <line
            key={p.dimension}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke={`var(--color-chart-${idx})`}
            strokeWidth={0.5}
            opacity={0.6}
          />
        );
      })}

      {/* Value polygon */}
      <polygon
        points={polygonPoints}
        fill="var(--color-foreground)"
        fillOpacity={fillOpacity}
        stroke="var(--color-foreground)"
        strokeWidth={1.25}
        strokeLinejoin="round"
        style={
          staticRender
            ? undefined
            : {
                transformOrigin: `${CENTER}px ${CENTER}px`,
                animation: "rating-radar-enter 250ms ease-out both",
              }
        }
      />

      {/* Value dots — colored by dimension */}
      {points.map((p, i) => {
        const angle = ANGLES[i % ANGLES.length] ?? -90;
        const r = (p.normalized / 5) * MAX_R;
        const { x, y } = polar(angle, r);
        const idx = CHART_VAR_INDEX[p.dimension];
        return (
          <circle
            key={p.dimension}
            cx={x}
            cy={y}
            r={3}
            fill={`var(--color-chart-${idx})`}
            stroke="var(--color-background)"
            strokeWidth={1}
          >
            <title>
              {AXIS_LABELS[p.dimension]}: {p.rawDisplay} (confidence{" "}
              {(p.confidence * 100).toFixed(0)}%)
            </title>
          </circle>
        );
      })}

      {/* Axis labels */}
      {points.map((p, i) => {
        const angle = ANGLES[i % ANGLES.length] ?? -90;
        const { x, y } = polar(angle, LABEL_R);
        const isTop = angle === -90;
        const isBottom = angle === 126 || angle === 54;
        // angle === -90 (top): center horizontally above the apex.
        // angle === 198 (left): grow leftward from the anchor point so the
        // label doesn't straddle and get clipped at the viewBox edge.
        // Other angles: start/end based on horizontal half.
        const anchor = angle === -90 ? "middle" : x > CENTER ? "start" : "end";
        return (
          <text
            key={p.dimension}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline={isTop ? "auto" : isBottom ? "hanging" : "middle"}
            fontSize={8}
            fill="var(--color-muted-foreground)"
            fontFamily="var(--font-sans)"
          >
            {AXIS_LABELS[p.dimension]}
          </text>
        );
      })}

      <style>{`
        @keyframes rating-radar-enter {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </svg>
  );
}
