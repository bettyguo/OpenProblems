import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MoversBoard, type MoverRow } from "./index";

const sampleSpark = [
  { date: "2026-05-14", value: 35 },
  { date: "2026-09-01", value: 32 },
  { date: "2026-12-15", value: 32 },
];

const row: MoverRow = {
  actionId: "hallucination-reduction/2026-12-15-q4-revision",
  problemSlug: "hallucination-reduction",
  problemTitle: "Hallucination Reduction",
  date: "2026-12-15",
  curator: "jikun",
  primaryDeltaSummary: "saturation 35 → 32",
  sparkline: sampleSpark,
};

const watchlistRow: MoverRow = {
  ...row,
  actionId: "mechanistic-interpretability/2026-12-15-q4-revision",
  problemSlug: "mechanistic-interpretability",
  problemTitle: "Mech Interp",
  primaryDeltaSummary: "industry_call confidence 0.60 → 0.55",
  watchlistTransition: { from: false, to: true },
};

function render(props: Parameters<typeof MoversBoard>[0]): string {
  return renderToStaticMarkup(<MoversBoard {...props} />);
}

describe("MoversBoard", () => {
  it("renders an empty-state section when rows is empty", () => {
    const html = render({ rows: [], windowDays: 90 });
    expect(html).toMatch(/No rating moves in the last 90 days/);
  });

  it("renders a table with one row per MoverRow", () => {
    const html = render({ rows: [row], windowDays: 90 });
    const trs = html.match(/<tr\b/g) ?? [];
    // Header row + 1 data row.
    expect(trs.length).toBe(2);
  });

  it("renders the primary delta summary as a pill", () => {
    const html = render({ rows: [row], windowDays: 90 });
    expect(html).toMatch(/saturation 35 → 32/);
  });

  it("renders a watchlist transition pill when set", () => {
    const html = render({ rows: [watchlistRow], windowDays: 90 });
    expect(html).toMatch(/false → true/);
  });

  it("links the problem title to /problems/<slug>/ratings#<anchor>", () => {
    const html = render({ rows: [row], windowDays: 90 });
    expect(html).toMatch(
      /href="\/problems\/hallucination-reduction\/ratings#2026-12-15-q4-revision"/,
    );
  });

  it("renders a sparkline SVG per row", () => {
    const html = render({ rows: [row], windowDays: 90 });
    // The Sparkline component renders one <svg> per row in addition to no other top-level SVG.
    const svgs = html.match(/<svg\b/g) ?? [];
    expect(svgs.length).toBe(1);
  });

  it("renders no sparkline path when the row has only one point", () => {
    const singlePoint: MoverRow = { ...row, sparkline: [{ date: "2026-05-14", value: 50 }] };
    const html = render({ rows: [singlePoint], windowDays: 90 });
    const paths = html.match(/<path\b/g) ?? [];
    expect(paths.length).toBe(0);
  });

  it("breaks the sparkline path around a qualitative point", () => {
    const mixed: MoverRow = {
      ...row,
      sparkline: [
        { date: "2026-05-14", value: 25 },
        { date: "2026-09-01", value: null, qualitative_band: "medium" },
        { date: "2026-12-15", value: 40 },
      ],
    };
    const html = render({ rows: [mixed], windowDays: 90 });
    // Each numeric run has < 2 points → no path segment is emitted.
    const paths = html.match(/<path\b/g) ?? [];
    expect(paths.length).toBe(0);
  });

  it("threads windowDays into the empty-state copy", () => {
    const html = render({ rows: [], windowDays: 30 });
    expect(html).toMatch(/No rating moves in the last 30 days/);
  });

  it("includes a screen-reader caption explaining the table contents", () => {
    const html = render({ rows: [row], windowDays: 90 });
    expect(html).toMatch(/Recent rating actions across all problems/);
  });
});
