import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright e2e config. Spec files under `e2e/`. Default browser:
 * chromium (headless on CI). Webserver boots the production build to keep
 * Lighthouse + Playwright pinned to the same surface. Phase 1 will add
 * mobile + firefox projects when responsive specs land.
 */
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  ...(isCI ? { workers: 2 } : {}),
  retries: isCI ? 2 : 0,
  reporter: isCI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
