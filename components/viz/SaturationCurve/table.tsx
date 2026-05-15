import type { RatingAction } from "@/lib/schemas/rating-action";

/**
 * SaturationCurveTable — tabular fallback for SaturationCurve (Unit 3.12).
 *
 * Renders the same data the chart plots, in a `<table>` element. Used by the
 * /problems/[slug]/history page wrapped in ChartTableSwitch.
 */

export interface SaturationCurveTableProps {
  actions: RatingAction[];
}

function toDateString(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

export function SaturationCurveTable({ actions }: SaturationCurveTableProps) {
  if (actions.length === 0) {
    return <p className="text-muted-foreground text-sm italic">No rating actions to tabulate.</p>;
  }
  return (
    <table className="w-full border-collapse text-sm">
      <caption className="sr-only">Saturation over time, one row per rating action.</caption>
      <thead className="text-muted-foreground text-xs">
        <tr>
          <th className="px-3 py-2 text-left font-medium">Date</th>
          <th className="px-3 py-2 text-left font-medium">Saturation</th>
          <th className="px-3 py-2 text-left font-medium">Qualitative band</th>
          <th className="px-3 py-2 text-left font-medium">Confidence</th>
        </tr>
      </thead>
      <tbody>
        {actions.map((a, i) => {
          const s = a.dimensions.saturation;
          const date = toDateString(a.date);
          return (
            <tr key={`${date}-${i}`} className="border-border border-t">
              <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                <time dateTime={date}>{date}</time>
              </td>
              <td className="px-3 py-2 font-mono">{s.value === null ? "N/A" : s.value}</td>
              <td className="text-muted-foreground px-3 py-2 text-xs">
                {s.qualitative_band ?? "—"}
              </td>
              <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                {(s.confidence * 100).toFixed(0)}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
