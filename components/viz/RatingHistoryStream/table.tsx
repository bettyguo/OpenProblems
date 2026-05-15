import { dimensionsToRadar } from "@/lib/ratings/normalize";
import type { RatingAction } from "@/lib/schemas/rating-action";

/**
 * RatingHistoryStreamTable — tabular fallback for RatingHistoryStream (Unit 3.12).
 *
 * Renders the same per-dimension normalized values the streamgraph plots, in
 * a `<table>` element. Used by the /problems/[slug]/history page wrapped in
 * ChartTableSwitch.
 */

export interface RatingHistoryStreamTableProps {
  actions: RatingAction[];
}

function toDateString(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

export function RatingHistoryStreamTable({ actions }: RatingHistoryStreamTableProps) {
  if (actions.length === 0) {
    return <p className="text-muted-foreground text-sm italic">No rating actions to tabulate.</p>;
  }
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">
        Per-dimension normalized [0, 5] values, one row per rating action.
      </caption>
      <thead className="text-muted-foreground text-xs">
        <tr>
          <th className="px-3 py-2 text-left font-medium">Date</th>
          <th className="px-3 py-2 text-left font-medium">Difficulty</th>
          <th className="px-3 py-2 text-left font-medium">Saturation</th>
          <th className="px-3 py-2 text-left font-medium">Urgency</th>
          <th className="px-3 py-2 text-left font-medium">Value</th>
          <th className="px-3 py-2 text-left font-medium">Industry call</th>
        </tr>
      </thead>
      <tbody>
        {actions.map((a, i) => {
          const points = dimensionsToRadar(a.dimensions);
          const byDim = Object.fromEntries(points.map((p) => [p.dimension, p]));
          const date = toDateString(a.date);
          return (
            <tr key={`${date}-${i}`} className="border-border border-t">
              <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                <time dateTime={date}>{date}</time>
              </td>
              <td className="px-3 py-2 font-mono">
                {byDim.difficulty?.rawDisplay} ({byDim.difficulty?.normalized.toFixed(1)})
              </td>
              <td className="px-3 py-2 font-mono">
                {byDim.saturation?.rawDisplay} ({byDim.saturation?.normalized.toFixed(1)})
              </td>
              <td className="px-3 py-2 font-mono">
                {byDim.urgency?.rawDisplay} ({byDim.urgency?.normalized.toFixed(1)})
              </td>
              <td className="px-3 py-2 font-mono">
                {byDim.value?.rawDisplay} ({byDim.value?.normalized.toFixed(1)})
              </td>
              <td className="px-3 py-2 font-mono">
                {byDim.industry_call?.rawDisplay} ({byDim.industry_call?.normalized.toFixed(1)})
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
