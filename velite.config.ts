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

const contributing = defineCollection({
  name: "Contributing",
  pattern: "contributing/*.mdx",
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
      // Strip the `contributing/` prefix from the path slug for clean URLs.
      slug: data.slug.replace(/^contributing\//, ""),
    })),
});

const BenchmarkS = s.object({
  id: s.string(),
  name: s.string(),
  dataset: s.string(),
  metric: s.string(),
  metric_direction: s.enum(["higher-is-better", "lower-is-better"]),
  upper_bound: s.number().optional(),
  protocol_url: s.string().url().optional(),
  notes: s.string().optional(),
});

const EditorialS = s.object({
  primary_curator: s.string(),
  last_curated: s.isodate(),
});

const ExternalLinksS = s.object({
  arxiv_survey: s.string().url().optional(),
  paperswithcode_legacy: s.string().url().optional(),
  nlp_progress: s.string().url().optional(),
  canonical_survey: s.string().url().optional(),
});

const ProblemS = s.object({
  slug: s.string(),
  title: s.string(),
  subtitle: s.string().optional(),
  domain: s.string(),
  subdomain: s.string(),
  tags: s.array(s.string()),
  status: s.enum(["open", "partially-solved", "converging", "solved", "retired"]),
  posed_year: s.number().int(),
  authors_who_posed: s.array(s.string()).optional(),
  related_problems: s.array(s.string()).optional(),
  benchmarks: s.array(BenchmarkS),
  external_links: ExternalLinksS.optional(),
  editorial: EditorialS,
});

const DimensionGrade = s.object({
  grade: s.enum(["S", "A", "B", "C", "D", "E"]),
  confidence: s.number(),
  rationale: s.string(),
});

// Saturation dimension per ADR-0006: numeric value OR qualitative band.
// The refine() lives in the Zod-4 source-of-truth schema (lib/schemas/rating-
// action.ts) and is enforced by scripts/validate-content.ts. Velite's mirror
// here matches the shape so .velite/ratings.json carries both fields verbatim.
const DimensionSaturation = s.object({
  value: s.number().nullable(),
  qualitative_band: s.enum(["low", "medium", "high"]).optional(),
  confidence: s.number(),
  rationale: s.string(),
});

const DimensionStars = s.object({
  stars: s.number().int(),
  confidence: s.number(),
  rationale: s.string(),
});

const RatingActionS = s
  .object({
    problem_slug: s.string(),
    date: s.isodate(),
    methodology_version: s.string(),
    curator: s.string(),
    prior_action: s.string().optional(),
    dimensions: s.object({
      difficulty: DimensionGrade,
      saturation: DimensionSaturation,
      urgency: DimensionStars,
      value: DimensionStars,
      industry_call: DimensionStars,
    }),
    signals_considered: s.array(s.string()).optional(),
    watchlist: s.boolean().default(false),
    path: s.path(),
  })
  .transform((data) => {
    // path is e.g. "problems/hallucination-reduction/ratings/2026-05-14-initial".
    // Extract the filename-without-extension for a stable, file-unique id used
    // by Phase-3 feeds (Unit 3.5 RSS / JSON) and per-action deep links
    // (Unit 3.4 HTML feed). The id form mirrors Unit 3.0 D-4:
    // <problem_slug>/<filename-without-extension>.
    const m = data.path.match(/^problems\/[^/]+\/ratings\/(.+)$/);
    const file = m?.[1] ?? "";
    return { ...data, id: `${data.problem_slug}/${file}` };
  });

const problems = defineCollection({
  name: "Problem",
  pattern: "problems/*/problem.yaml",
  schema: ProblemS,
});

const ratings = defineCollection({
  name: "RatingAction",
  pattern: "problems/*/ratings/*.yaml",
  schema: RatingActionS,
});

const problemPages = defineCollection({
  name: "ProblemPage",
  pattern: "problems/*/{background,definition,history}.mdx",
  schema: s
    .object({
      title: s.string(),
      summary: s.string(),
      slug: s.path(),
      body: s.mdx(),
    })
    .transform((data) => {
      // path is e.g. "problems/hallucination-reduction/background"
      const m = data.slug.match(/^problems\/([^/]+)\/(background|definition|history)$/);
      const problemSlug = m?.[1] ?? "";
      const kind = (m?.[2] ?? "background") as "background" | "definition" | "history";
      return { ...data, problem_slug: problemSlug, kind };
    }),
});

const ContributionS = s.object({
  problem_slug: s.string(),
  benchmark_id: s.string().optional(),
  score: s.number().optional(),
  metric: s.string().optional(),
  rank_at_publication: s.number().int().optional(),
  evidence: s.string().url(),
});

const PaperS = s.object({
  id: s.string(),
  title: s.string(),
  authors: s.array(s.string()),
  institutions: s.array(s.string()),
  venue: s.string().optional(),
  year: s.number().int(),
  arxiv_id: s.string().optional(),
  doi: s.string().optional(),
  github: s.string().url().optional(),
  tldr: s.string(),
  contributions: s.array(ContributionS),
});

const AffiliationS = s.object({
  institution: s.string(),
  from: s.isodate(),
  to: s.isodate().optional(),
});

const AuthorS = s.object({
  slug: s.string(),
  display_name: s.string(),
  affiliations: s.array(AffiliationS),
  homepage: s.string().url().optional(),
  scholar_id: s.string().optional(),
  orcid: s.string().optional(),
});

const InstitutionS = s.object({
  slug: s.string(),
  display_name: s.string(),
  country: s.string().optional(),
  type: s.enum(["academic", "industry", "government", "nonprofit", "other"]).optional(),
  homepage: s.string().url().optional(),
  ror_id: s.string().optional(),
});

const papers = defineCollection({
  name: "Paper",
  pattern: "papers/*.yaml",
  schema: PaperS,
});

const authors = defineCollection({
  name: "Author",
  pattern: "authors/*.yaml",
  schema: AuthorS,
});

const institutions = defineCollection({
  name: "Institution",
  pattern: "institutions/*.yaml",
  schema: InstitutionS,
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
    contributing,
    problems,
    ratings,
    problemPages,
    papers,
    authors,
    institutions,
  },
});
