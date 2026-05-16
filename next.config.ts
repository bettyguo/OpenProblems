import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl plugin (Unit 7.2; ADR-0011 D-A). Points at the per-request i18n
// config in lib/i18n/request.ts. Pure build-time plumbing — does not affect
// pages that don't import next-intl.
const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const config: NextConfig = {
  reactStrictMode: true,
  // ESLint is owned by Unit 0.8 (separate config + CI step). Do not let Next's
  // bundled lint step run during `next build` with a different ruleset.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Type errors fail the build. Typecheck also runs independently in CI (Unit 0.11).
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withNextIntl(config);
