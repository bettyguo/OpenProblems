import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { RatingRadar } from "./index";
import type { RatingAction } from "@/lib/schemas/rating-action";

const validDimensions: RatingAction["dimensions"] = {
  difficulty: { grade: "A", confidence: 0.8, rationale: "test" },
  saturation: { value: 40, confidence: 0.6, rationale: "test" },
  urgency: { stars: 4, confidence: 0.7, rationale: "test" },
  value: { stars: 5, confidence: 0.8, rationale: "test" },
  industry_call: { stars: 3, confidence: 0.5, rationale: "test" },
};

function render(props: Parameters<typeof RatingRadar>[0]): string {
  return renderToStaticMarkup(<RatingRadar {...props} />);
}

describe("RatingRadar", () => {
  it("renders an SVG with role=img and the aria-label", () => {
    const html = render({ dimensions: validDimensions, ariaLabel: "Test radar" });
    expect(html).toMatch(/<svg [^>]*role="img"/);
    expect(html).toMatch(/aria-label="Test radar"/);
  });

  it("emits exactly five axis lines and five value dots", () => {
    const html = render({ dimensions: validDimensions });
    const axes = html.match(/<line\b/g) ?? [];
    expect(axes.length).toBe(5);
    const dots = html.match(/<circle\b[^>]*r="3"/g) ?? [];
    expect(dots.length).toBe(5);
  });

  it("emits exactly one value polygon", () => {
    const html = render({ dimensions: validDimensions });
    const polys = html.match(/<polygon\b/g) ?? [];
    expect(polys.length).toBe(1);
  });

  it("includes a <desc> with each dimension's raw value and confidence", () => {
    const html = render({ dimensions: validDimensions });
    expect(html).toMatch(/Difficulty: A \(confidence 80%\)/);
    expect(html).toMatch(/Open vs\. saturated: 40 \(confidence 60%\)/);
    expect(html).toMatch(/Urgency: 4 \(confidence 70%\)/);
    expect(html).toMatch(/Industry call: 3 \(confidence 50%\)/);
  });

  it("renders all five axis labels", () => {
    const html = render({ dimensions: validDimensions });
    expect(html).toContain("Difficulty");
    expect(html).toContain("Urgency");
    expect(html).toContain("Value");
    expect(html).toContain("Industry call");
  });

  it("omits entry animation in staticRender mode", () => {
    const html = render({ dimensions: validDimensions, staticRender: true });
    expect(html).not.toMatch(/animation:\s*rating-radar-enter/);
  });

  it("pads viewBox outward to give axis labels room (regression: labels at radius 96 were clipped by viewBox=0 0 200 200)", () => {
    // Bug: with VIEW_BOX=200 and LABEL_R=96, axis labels were anchored at
    // points only 4 px from each viewBox edge — text extended beyond the
    // bounds and was clipped (e.g. "Difficulty" appearing as "iculty" at
    // the top; "Industry call" as "ustry call" at the left). Fix expands
    // the viewBox by LABEL_PADDING=36 on every side while keeping the
    // chart geometry unchanged.
    const html = render({ dimensions: validDimensions });
    expect(html).toMatch(/viewBox="-36 -36 272 272"/);
  });

  it('anchors the left axis label ("Industry call") with text-anchor="end" so it grows leftward instead of straddling its anchor point', () => {
    // Bug: angle === 198 used text-anchor="middle", which centered the
    // label at x≈9 — half of "Industry call" extended to negative x and
    // was clipped at the viewBox left edge. Fix uses text-anchor="end"
    // so the label grows cleanly leftward.
    const html = render({ dimensions: validDimensions });
    // The label text node for "Industry call" must carry text-anchor="end".
    const industryMatch = html.match(/<text[^>]*text-anchor="([^"]+)"[^>]*>Industry call</);
    expect(industryMatch?.[1]).toBe("end");
  });
});
