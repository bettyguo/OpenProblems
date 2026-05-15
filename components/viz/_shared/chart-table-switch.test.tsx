import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ChartTableSwitch } from "./chart-table-switch";

describe("ChartTableSwitch", () => {
  it("renders both the chart and the table at SSR time", () => {
    const html = renderToStaticMarkup(
      <ChartTableSwitch
        chart={<div data-testid="chart">CHART</div>}
        table={<table data-testid="table" />}
      />,
    );
    expect(html).toContain("CHART");
    expect(html).toMatch(/<table\b/);
  });

  it("wraps the table in a <details> disclosure with the default label", () => {
    const html = renderToStaticMarkup(<ChartTableSwitch chart={<div>c</div>} table={<table />} />);
    expect(html).toMatch(/<details\b/);
    expect(html).toContain("View as table");
  });

  it("applies a custom label when provided", () => {
    const html = renderToStaticMarkup(
      <ChartTableSwitch
        chart={<div>c</div>}
        table={<table />}
        label="View saturation data as table"
      />,
    );
    expect(html).toContain("View saturation data as table");
  });

  it("threads aria-label onto the wrapping div", () => {
    const html = renderToStaticMarkup(
      <ChartTableSwitch
        chart={<div>c</div>}
        table={<table />}
        ariaLabel="Saturation curve with table fallback"
      />,
    );
    expect(html).toMatch(/aria-label="Saturation curve with table fallback"/);
  });
});
