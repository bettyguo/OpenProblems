// ESLint 10 flat config.
// See docs/thinking/0.8-lint-format-hooks.md for rationale.
//
// Phase 0: minimal stack — typescript-eslint + jsx-a11y + prettier. Next-
// specific rules from `eslint-config-next` are temporarily DISABLED in this
// repo because `eslint-config-next/core-web-vitals` 16.x triggers an
// `@eslint/eslintrc` "Converting circular structure to JSON" crash under
// ESLint 10 (see OPEN_QUESTIONS Q19). Phase 1 / Unit 0.10 will re-enable
// them once the IA stubs land and the upstream issue stabilizes.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier/flat";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "storybook-static/**",
      "next-env.d.ts",
      "pnpm-lock.yaml",
      ".husky/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // Node scripts and config files run under Node, not the browser.
    files: [
      "scripts/**/*.{js,mjs,cjs,ts}",
      "*.config.{js,mjs,cjs,ts}",
      "vitest.config.ts",
      "next.config.ts",
      "postcss.config.{mjs,js}",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "test/**"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
    },
  },
  prettier,
);
