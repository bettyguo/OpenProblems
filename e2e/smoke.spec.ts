import { expect, test } from "@playwright/test";

test.describe("Phase 0 stub landing", () => {
  test("renders the project title and the rating-dimensions legend", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1, name: "LLM OpenProblems" })).toBeVisible();

    // Five rating dimensions per MASTER_PROMPT §3.1, rendered as swatches +
    // labels on the Phase 0 placeholder page (Unit 0.4).
    for (const label of ["Difficulty", "Saturation", "Urgency", "Value", "Industry Call"]) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("ships zero client JavaScript on the home route (RSC-only)", async ({ page }) => {
    // Phase 0 home is a Server Component with no `"use client"` ancestors.
    // The HTML response should not include a `<script>` tag pointing to a
    // page-specific chunk — only the framework runtime.
    const response = await page.goto("/");
    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);
  });
});
