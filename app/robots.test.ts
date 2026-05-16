import { describe, expect, it } from "vitest";
import robots from "./robots";
import { SITE } from "@/lib/sitemap/build-sitemap";

describe("robots", () => {
  const result = robots();

  it("returns a permissive baseline rule for all user agents", () => {
    expect(result.rules).toEqual([{ userAgent: "*", allow: "/" }]);
  });

  it("points the Sitemap directive at the Unit 7.8 sitemap", () => {
    expect(result.sitemap).toBe(`${SITE}/sitemap.xml`);
  });

  it("declares the canonical host", () => {
    expect(result.host).toBe(SITE);
  });
});
