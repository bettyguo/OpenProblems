import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import remarkMath from "remark-math";
import { defineCollection, defineConfig, s } from "velite";

/**
 * Velite content pipeline (ADR-0002).
 *
 * Velite 0.3.x bundles Zod 3 internally (its `s` factory and its runtime
 * call `schema._parse(...)`). Our `lib/schemas/*` use Zod 4 (ADR-0003),
 * which renamed/refactored the parse internals — passing a Zod-4 schema
 * directly to `defineCollection({ schema })` crashes with
 * `schema._parse is not a function`.
 *
 * Until Velite ships Zod-4 support, schemas are duplicated here using
 * Velite's bundled `s` factory. This is a controlled, single-file
 * duplication. The canonical schemas in `lib/schemas/*` remain the
 * source of truth for everything else — `scripts/validate-content.ts`
 * (Unit 0.7) cross-validates `content/` against them, so any drift
 * between the two definitions surfaces in CI on the next commit that
 * authors content. Tracked in OPEN_QUESTIONS Q31.
 *
 * Consumers import via the `#site/content` tsconfig path alias:
 *
 *   import { taxonomy, problems, ... } from "#site/content";
 *
 * Runs as the first half of `pnpm build` and `pnpm dev` (`velite && ...`).
 *
 * Phase 1.1 ships `taxonomy` only. Later content units (1.3 methodology,
 * 1.4 first problem) will extend this file with their collections.
 */

const SubdomainSchema = s.object({
  id: s.string(),
  title: s.string(),
});

const DomainSchema = s.object({
  id: s.string(),
  title: s.string(),
  subdomains: s.array(SubdomainSchema),
});

const TaxonomySchema = s.object({
  domains: s.array(DomainSchema),
});

const taxonomy = defineCollection({
  name: "Taxonomy",
  pattern: "taxonomy.yaml",
  single: true,
  schema: TaxonomySchema,
});

const methodology = defineCollection({
  name: "Methodology",
  pattern: "methodology/*.mdx",
  schema: s
    .object({
      version: s.string(),
      title: s.string(),
      summary: s.string(),
      date: s.isodate(),
      supersedes: s.string().optional(),
      slug: s.path(),
      body: s.mdx(),
    })
    .transform((data) => ({
      ...data,
      // Strip the `methodology/` prefix from the path slug for clean URLs.
      slug: data.slug.replace(/^methodology\//, ""),
    })),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  mdx: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [
      [rehypeKatex],
      [
        rehypePrettyCode,
        {
          theme: { light: "github-light", dark: "github-dark" },
          keepBackground: false,
        },
      ],
    ],
  },
  collections: {
    taxonomy,
    methodology,
  },
});
