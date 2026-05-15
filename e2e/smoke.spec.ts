import { expect, test } from "@playwright/test";

/**
 * Phase 1 acceptance smoke (MASTER_PROMPT §13).
 *
 * Asserts the §13 nav path lands on every step, plus a visual-regression
 * baseline on the RatingRadar at /problems/hallucination-reduction (the
 * Unit 1.4 seed; the only fully-rated problem at Phase 1 commit). The
 * RatingRadar entry animation is frozen by passing `animations: "disabled"`
 * to `toHaveScreenshot`.
 */

test.describe("Phase 1 landing", () => {
  test("renders the §13 hero, primary nav, and global header", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Rated open problems in LLM .* AI research\./i,
      }),
    ).toBeVisible();

    // SiteHeader (Unit 1.9) provides primary nav on every page.
    // exact: true so "Problems" doesn't accidentally match "LLM OpenProblems".
    const header = page.getByRole("banner");
    for (const label of ["Domains", "Problems", "Methodology", "Trending"]) {
      await expect(header.getByRole("link", { name: label, exact: true })).toBeVisible();
    }

    // Landing hero CTAs (Unit 1.10).
    await expect(page.getByRole("link", { name: "Browse problems" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Read the methodology" })).toBeVisible();
  });
});

test.describe("Phase 1 §13 nav: landing → domain → subdomain → problem → leaderboard", () => {
  test("traverses the canonical nav path with one click per step", async ({ page }) => {
    await page.goto("/");

    // landing → /domains
    await page.getByRole("banner").getByRole("link", { name: "Domains" }).click();
    await expect(page).toHaveURL("/domains");
    await expect(page.getByRole("heading", { level: 1, name: "Domains" })).toBeVisible();

    // /domains → /domains/deep-learning (the densest hub)
    await page.getByRole("link", { name: "Deep Learning" }).first().click();
    await expect(page).toHaveURL("/domains/deep-learning");
    await expect(page.getByRole("heading", { level: 1, name: "Deep Learning" })).toBeVisible();

    // /domains/deep-learning → /domains/deep-learning/large-language-models
    await page.getByRole("link", { name: "Large Language Models" }).first().click();
    await expect(page).toHaveURL("/domains/deep-learning/large-language-models");

    // /domains/.../large-language-models → /problems/hallucination-reduction
    // The Unit 1.4 seed lives in this subdomain and is the canonical
    // exemplar for the visual-regression baseline below.
    await page
      .getByRole("link", { name: /Hallucination Reduction/i })
      .first()
      .click();
    await expect(page).toHaveURL("/problems/hallucination-reduction");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Faithful .* Calibrated Hallucination Reduction in LLMs/i,
      }),
    ).toBeVisible();

    // RatingRadar present (Unit 1.5; rendered server-side, no JS needed).
    await expect(page.getByRole("img", { name: /Current rating radar/i })).toBeVisible();

    // /problems/[slug] → /problems/[slug]/leaderboard (still a Phase 0 stub —
    // §13 says "leaderboard placeholder", so navigation arriving is the gate).
    await page.getByRole("link", { name: "View full leaderboard →" }).click();
    await expect(page).toHaveURL("/problems/hallucination-reduction/leaderboard");
  });
});

test.describe("Phase 1 visual regression: RatingRadar", () => {
  test("RatingRadar v1 on /problems/hallucination-reduction matches the baseline", async ({
    page,
  }) => {
    await page.goto("/problems/hallucination-reduction");

    const radar = page.getByRole("img", { name: /Current rating radar/i });
    await expect(radar).toBeVisible();

    // toHaveScreenshot creates the baseline on first run and gates against
    // it thereafter. Baselines are platform-specific (font / pixel
    // rendering) — first CI run will land an Ubuntu baseline that
    // supersedes any locally-captured baseline.
    await expect(radar).toHaveScreenshot("rating-radar-hallucination-reduction.png", {
      animations: "disabled",
      // Tight diff threshold: the radar is pure SVG, so cross-machine
      // rendering should be near-pixel-identical.
      maxDiffPixelRatio: 0.005,
    });
  });
});
