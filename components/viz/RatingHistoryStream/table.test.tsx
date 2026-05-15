import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RatingHistoryStreamTable } from "./table";
import type { RatingAction } from "@/lib/schemas/rating-action";

function makeAction(date: string, satValue: number): RatingAction {
  return {
    problem_slug: "test",
    date,
    methodology_version: "1.0.0",
    curator: "test",
    dimensions: {
      difficulty: { grade: "A", confidence: 0.7, rationale: "x" },
      saturation: { value: satValue, confidence: 0.6, rationale: "x" },
      urgency: { stars: 5, confidence: 0.7, rationale: "x" },
      value: { stars: 5, confidence: 0.7, rationale: "x" },
      industry_call: { stars: 4, confidence: 0.7, rationale: "x" },
    },
    watchlist: false,
  };
}

describe("RatingHistoryStreamTable", () => {
  it("renders an empty-state message for actions=[]", () => {
    const html = renderToStaticMarkup(<RatingHistoryStreamTable actions={[]} />);
    expect(html).toMatch(/No rating actions to tabulate/);
  });

  it("renders 6 columns (Date + 5 dimensions) per row", () => {
    const html = renderToStaticMarkup(
      <RatingHistoryStreamTable actions={[makeAction("2026-05-14", 35)]} />,
    );
    expect(html).toContain("Difficulty");
    expect(html).toContain("Saturation");
    expect(html).toContain("Urgency");
    expect(html).toContain("Value");
    expect(html).toContain("Industry call");
  });

  it("renders raw display + normalized score for each dimension", () => {
    const html = renderToStaticMarkup(
      <RatingHistoryStreamTable actions={[makeAction("2026-05-14", 35)]} />,
    );
    // Difficulty A → normalized 4.0
    expect(html).toMatch(/A \(4\.0\)/);
    // Saturation 35 → normalized 3.25 → toFixed(1) = 3.3 (rounded)
    expect(html).toMatch(/35 \(3\.3\)/);
  });

  it("renders one <tr> per action plus the header row", () => {
    const html = renderToStaticMarkup(
      <RatingHistoryStreamTable
        actions={[makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)]}
      />,
    );
    const trs = html.match(/<tr\b/g) ?? [];
    expect(trs.length).toBe(3);
  });
});
