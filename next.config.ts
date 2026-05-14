import type { NextConfig } from "next";

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

export default config;
