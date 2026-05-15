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

test.describe("Phase 2 paper detail nav", () => {
  test("can reach a paper detail page from /papers and back-link to a problem", async ({
    page,
  }) => {
    // Pick an exemplar paper (Unit 2.4 seed; SWE-bench).
    await page.goto("/papers/2310.06770");

    await expect(page.getByRole("heading", { level: 1, name: /SWE-bench/i })).toBeVisible();

    // Block 2 contributions table — every paper has at least one row.
    await expect(page.getByRole("heading", { level: 2, name: /Contributions/i })).toBeVisible();

    // Block 4 BibTeX-style citation block.
    await expect(page.getByRole("heading", { level: 2, name: /Cite this/i })).toBeVisible();
  });
});

test.describe("Phase 2 visual regression: paper + author + institution detail", () => {
  test("RatingRadar v1 baseline (Phase 1 carryover)", async ({ page }) => {
    await page.goto("/problems/hallucination-reduction");
    const radar = page.getByRole("img", { name: /Current rating radar/i });
    await expect(radar).toBeVisible();
    await expect(radar).toHaveScreenshot("rating-radar-hallucination-reduction.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.005,
    });
  });

  test("paper detail page baseline", async ({ page }) => {
    await page.goto("/papers/2310.06770");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).toHaveScreenshot("paper-detail-swe-bench.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });

  test("author detail page baseline", async ({ page }) => {
    await page.goto("/authors/shunyu-yao");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).toHaveScreenshot("author-detail-shunyu-yao.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });

  test("institution detail page baseline", async ({ page }) => {
    await page.goto("/institutions/anthropic");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("main")).toHaveScreenshot("institution-detail-anthropic.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });
});
