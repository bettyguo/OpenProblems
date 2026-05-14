import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * Storybook 10 config. Stories live alongside their components per §11:
 *   `components/<area>/<Name>/index.stories.tsx`.
 * App-router showcase pages may also expose stories under `app/**`.
 * The auto-generated `stories/` example was removed in Unit 0.9.
 */
const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(ts|tsx|mdx)", "../app/**/*.stories.@(ts|tsx|mdx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
  },
};

export default config;
