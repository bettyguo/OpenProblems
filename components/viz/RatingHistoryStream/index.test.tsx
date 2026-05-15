import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RatingHistoryStream } from "./index";
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
      industry_call: { stars: 5, confidence: 0.7, rationale: "x" },
    },
    watchlist: false,
  };
}

function render(props: Parameters<typeof RatingHistoryStream>[0]): string {
  return renderToStaticMarkup(<RatingHistoryStream {...props} />);
}

describe("RatingHistoryStream", () => {
  it("renders an SVG with role=img and derived aria-label", () => {
    const html = render({
      actions: [makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)],
      problemTitle: "Hallucination Reduction",
    });
    expect(html).toMatch(/<svg [^>]*role="img"/);
    expect(html).toMatch(/aria-label="Hallucination Reduction — rating dimensions over time"/);
  });

  it("emits exactly 5 dimension streams (one <path> per dimension)", () => {
    const html = render({
      actions: [makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)],
    });
    const paths = html.match(/<path\b/g) ?? [];
    expect(paths.length).toBe(5);
  });

  it("includes a <desc> with per-slice normalized dimension values", () => {
    const html = render({
      actions: [makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)],
    });
    expect(html).toMatch(/2026-05-14:.*Difficulty 4\.0\/5/);
    expect(html).toMatch(/2026-09-01:.*Saturation \(openness\) 3\.4\/5/);
  });

  it("renders the 5-item legend across the top", () => {
    const html = render({ actions: [makeAction("2026-05-14", 35)] });
    expect(html).toContain("Difficulty");
    expect(html).toContain("Saturation (openness)");
    expect(html).toContain("Urgency");
    expect(html).toContain("Value");
    expect(html).toContain("Industry call");
  });

  it("renders the empty-state figure for actions=[]", () => {
    const html = render({ actions: [] });
    expect(html).toMatch(/No rating actions to plot/);
  });

  it("renders date labels in YYYY-MM form (first / mid / last)", () => {
    const html = render({
      actions: [
        makeAction("2026-05-14", 35),
        makeAction("2026-09-01", 32),
        makeAction("2026-12-15", 30),
        makeAction("2027-03-15", 28),
      ],
    });
    expect(html).toContain(">2026-05<");
    expect(html).toContain(">2027-03<");
  });

  it("renders a dashed center midline", () => {
    const html = render({
      actions: [makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)],
    });
    expect(html).toMatch(/stroke-dasharray="2 2"/);
  });

  it("uses --color-chart-1..5 across the 5 streams", () => {
    const html = render({
      actions: [makeAction("2026-05-14", 35), makeAction("2026-09-01", 32)],
    });
    for (const i of [1, 2, 3, 4, 5]) {
      expect(html).toContain(`var(--color-chart-${i})`);
    }
  });
});
