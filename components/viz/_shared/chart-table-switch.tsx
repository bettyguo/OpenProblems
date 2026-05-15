import type { ReactNode } from "react";

/**
 * ChartTableSwitch — Phase 3 acceptance-criterion wrapper (Unit 3.12).
 *
 * §13: "All charts have table-fallback toggles."
 *
 * Renders the visualization (SVG / canvas / whatever) by default and tucks the
 * tabular representation inside a native `<details>` disclosure. Zero JS — the
 * `<details>` element is keyboard-accessible by spec and the inner content
 * server-renders, so the table is discoverable by find-in-page and screen
 * readers even when the disclosure is closed (some AT surfaces collapsed
 * details elements; the chart's own `<desc>` carries the full data prose for
 * SR users who don't drill in).
 *
 * Consumers pass both the `chart` and the `table` as React nodes. The wrapper
 * does no presentation beyond the layout shell.
 */

export interface ChartTableSwitchProps {
  /** The visualization component (typically an SVG figure). */
  chart: ReactNode;
  /** The tabular fallback view — usually a `<table>` element. */
  table: ReactNode;
  /** Optional label for the disclosure summary; defaults to "View as table". */
  label?: string;
  /** Optional aria-label for the disclosure region. */
  ariaLabel?: string;
}

export function ChartTableSwitch({
  chart,
  table,
  label = "View as table",
  ariaLabel,
}: ChartTableSwitchProps) {
  return (
    <div aria-label={ariaLabel}>
      {chart}
      <details className="border-border mt-2 rounded border p-3">
        <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs select-none">
          {label}
        </summary>
        <div className="mt-3 overflow-x-auto">{table}</div>
      </details>
    </div>
  );
}
