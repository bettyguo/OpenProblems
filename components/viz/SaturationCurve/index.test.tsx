import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SaturationCurve } from "./index";
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
    curator: "test-curator",
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

function render(props: Parameters<typeof SaturationCurve>[0]): string {
  return renderToStaticMarkup(<SaturationCurve {...props} />);
}

describe("SaturationCurve", () => {
  it("renders an SVG with role=img and a derived aria-label", () => {
    const html = render({
      actions: [makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)],
      problemTitle: "Hallucination Reduction",
    });
    expect(html).toMatch(/<svg [^>]*role="img"/);
    expect(html).toMatch(/aria-label="Hallucination Reduction — saturation over time"/);
  });

  it("emits a <desc> listing each action's date + value + confidence", () => {
    const html = render({
      actions: [makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)],
    });
    expect(html).toMatch(/2026-05-14: 35 \(confidence 60%\)/);
    expect(html).toMatch(/2026-09-01: 32 \(confidence 60%\)/);
  });

  it("renders one <path> segment connecting consecutive numeric points", () => {
    const html = render({
      actions: [
        makeAction("2026-05-14", 35),
        makeAction("2026-09-01", 32),
        makeAction("2026-12-15", 30),
      ],
    });
    const paths = html.match(/<path\b/g) ?? [];
    expect(paths.length).toBe(1);
  });

  it("renders no <path> segment for a single-point series", () => {
    const html = render({ actions: [makeAction("2026-05-14", 35)] });
    const paths = html.match(/<path\b/g) ?? [];
    expect(paths.length).toBe(0);
  });

  it("breaks the path into segments around a qualitative-band point (ADR-0006)", () => {
    const html = render({
      actions: [
        makeAction("2026-05-14", 25),
        makeAction("2026-09-01", null, "medium"),
        makeAction("2026-12-15", 40),
      ],
    });
    // Numeric points before + after the qualitative point form 2 single-numeric runs,
    // neither has ≥ 2 numeric points, so no segments render — the line breaks entirely.
    const paths = html.match(/<path\b/g) ?? [];
    expect(paths.length).toBe(0);
  });

  it("renders an open hollow circle and 'N/A' label for a qualitative-band point", () => {
    const html = render({
      actions: [makeAction("2026-05-14", null, "medium")],
    });
    expect(html).toMatch(/N\/A \(medium\)/);
    expect(html).toMatch(/>N\/A</);
  });

  it("renders an empty-state figure for actions=[]", () => {
    const html = render({ actions: [] });
    expect(html).toMatch(/No rating actions to plot/);
    expect(html).toMatch(/aria-label="Saturation curve \(no data\)"/);
  });

  it("renders y-axis tick labels at 0/25/50/75/100", () => {
    const html = render({ actions: [makeAction("2026-05-14", 50)] });
    for (const tick of ["0", "25", "50", "75", "100"]) {
      expect(html).toContain(`>${tick}<`);
    }
  });

  it("includes the §8.2 ceiling annotation", () => {
    const html = render({ actions: [makeAction("2026-05-14", 50)] });
    expect(html).toMatch(/ceiling \(§8\.2\)/);
  });
});
