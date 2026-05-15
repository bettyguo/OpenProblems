import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SaturationCurveTable } from "./table";
import type { RatingAction } from "@/lib/schemas/rating-action";

function makeAction(
  date: string,
  value: number | null,
  band?: "low" | "medium" | "high",
): RatingAction {
  return {
    problem_slug: "test",
    date,
    methodology_version: "1.0.0",
    curator: "test",
    dimensions: {
      difficulty: { grade: "A", confidence: 0.7, rationale: "x" },
      saturation:
        band !== undefined
          ? { value, qualitative_band: band, confidence: 0.4, rationale: "x" }
          : ({
              value,
              confidence: 0.6,
              rationale: "x",
            } as RatingAction["dimensions"]["saturation"]),
      urgency: { stars: 5, confidence: 0.7, rationale: "x" },
      value: { stars: 5, confidence: 0.7, rationale: "x" },
      industry_call: { stars: 5, confidence: 0.7, rationale: "x" },
    },
    watchlist: false,
  };
}

describe("SaturationCurveTable", () => {
  it("renders an empty-state message for actions=[]", () => {
    const html = renderToStaticMarkup(<SaturationCurveTable actions={[]} />);
    expect(html).toMatch(/No rating actions to tabulate/);
  });

  it("renders one <tr> per action plus the header row", () => {
    const html = renderToStaticMarkup(
      <SaturationCurveTable
        actions={[makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)]}
      />,
    );
    const trs = html.match(/<tr\b/g) ?? [];
    expect(trs.length).toBe(3);
  });

  it("renders the numeric saturation value verbatim", () => {
    const html = renderToStaticMarkup(
      <SaturationCurveTable actions={[makeAction("2026-05-14", 35)]} />,
    );
    expect(html).toContain(">35<");
  });

  it("renders 'N/A' for null saturation with the qualitative band column populated", () => {
    const html = renderToStaticMarkup(
      <SaturationCurveTable actions={[makeAction("2026-05-14", null, "medium")]} />,
    );
    expect(html).toContain(">N/A<");
    expect(html).toContain(">medium<");
  });

  it("renders confidence as a rounded percent", () => {
    const html = renderToStaticMarkup(
      <SaturationCurveTable actions={[makeAction("2026-05-14", 35)]} />,
    );
    expect(html).toContain(">60%<");
  });
});
