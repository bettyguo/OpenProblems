# LLM OpenProblems — Master Implementation Prompt

> **For use with Claude Code.** Paste this file (or `@`-reference it) into a Claude Code session inside an empty repo. Claude Code should treat this document as the **constitution** of the project. Every implementation decision should be traceable back to a section here, or to an ADR (Architecture Decision Record) that explicitly amends a section here.

> **Author intent (PhD student, AI research):** This is a multi-month project. Depth & correctness >> speed. Do not rush. Do not skip the THINK / DESIGN steps. Do not implement features that are not in the current phase. When in doubt, stop and ask in `OPEN_QUESTIONS.md`.

---

## Table of Contents

1. [North Star & Vision](#1-north-star--vision)
2. [Non-Goals](#2-non-goals)
3. [Conceptual Framework: AI as a Credit Rating Agency for Open Problems](#3-conceptual-framework)
4. [Domain Taxonomy (v1)](#4-domain-taxonomy-v1)
5. [Technology Stack & Rationale](#5-technology-stack--rationale)
6. [Repository Structure](#6-repository-structure)
7. [Canonical Data Model](#7-canonical-data-model)
8. [Rating Methodology v1.0](#8-rating-methodology-v10)
9. [Information Architecture & Routes](#9-information-architecture--routes)
10. [Design System & UX Principles](#10-design-system--ux-principles)
11. [Visualization Catalog](#11-visualization-catalog)
12. [Phase Plan](#12-phase-plan)
13. [Per-Phase Detailed Deliverables](#13-per-phase-detailed-deliverables)
14. [Quality Gates & Engineering Conventions](#14-quality-gates--engineering-conventions)
15. [The Think → Design → Code → Iterate Loop (Workflow for Claude Code)](#15-think--design--code--iterate-loop)
16. [Seed Content (Phase 1 problems to author)](#16-seed-content-phase-1)
17. [Open Questions for the Human](#17-open-questions-for-the-human)
18. [Glossary](#18-glossary)

---

## 1. North Star & Vision

**One-sentence pitch.** *LLM OpenProblems* is the daily-go-to web platform for AI researchers — a living encyclopedia of open problems in LLM and AI research, with leaderboards, historical tracks, and **dynamic, agency-style ratings** (Difficulty, Saturation, Urgency, Value, Industry Call) for every problem in every subdomain.

**Why now.** Papers with Code was sunsetted by Meta in July 2025. The community lost its canonical `<task, dataset, metric>` leaderboard graph. Hugging Face's Trending Papers is feed-shaped, not problem-shaped. nlp-progress and OpenReview do not provide a problem-centric, rated, time-evolving view. **There is no rated ontology of open problems in AI research.** This project fills that gap and aims to become both (a) a daily research aid and (b) a citable artifact (the methodology should be publishable as a position paper).

**What success looks like 12 months out.**

- A researcher can land on the site, pick a subfield (e.g., *Mechanistic Interpretability of LLMs*), and within 60 seconds see: the active open problems, current SOTA on each, who's pushing the frontier, and the agency rating with rationale.
- A graduate student writing a "background" section can cite a stable URL on this site and trust the historical track is well-curated.
- An author can publish a paper and submit a leaderboard entry that, after editorial review, updates the public rating.
- The methodology paper is on arXiv and accepted at a venue (ICLR Blog Track / NeurIPS Datasets & Benchmarks / position-paper workshop).

**Design imperatives (in priority order).**

1. **Correctness & academic credibility.** No hallucinated leaderboard entries. Every claim cite-able. Every rating action logged.
2. **Browsability at scale.** Information architecture must remain crisp at 10× current content.
3. **Top-shelf interactive visualization.** The site should *feel* like a Bloomberg Terminal for research, not a Wikipedia stub list.
4. **Academic professionalism + industrial polish.** Serif body type, restrained palette, generous whitespace; but with motion, micro-interactions, dark mode, and chart fidelity that match best-in-class B2B SaaS (Linear, Vercel, Stripe Docs).
5. **Composable content.** Authors should be able to contribute via PRs to MDX files (Phase 1–2) and later via auth-gated UI (Phase 4+).

---

## 2. Non-Goals

Explicitly out of scope. If a feature falls here, do **not** implement it; flag it in `OPEN_QUESTIONS.md`.

- ❌ **Hosting model weights or code execution.** This is not Hugging Face or Kaggle.
- ❌ **General paper search.** This is not Semantic Scholar or arxiv-sanity. Papers exist only as they relate to problems.
- ❌ **Forum / discussion threads.** Optional in Phase 5+ via GitHub Discussions integration only.
- ❌ **A monetization layer in Phase 1–4.** Sponsorship/labels can be discussed in Phase 6.
- ❌ **Real-time collaboration / Google Docs-style editing.** Content is git-versioned.
- ❌ **Replicating arXiv abstracts verbatim.** Use TL;DRs + links.
- ❌ **AI-generated content without human review.** Any LLM-assisted draft (Phase 5+) must pass through a human editor with their handle on the rating action.

---

## 3. Conceptual Framework

### 3.1 The Rating Agency Metaphor

The site occupies the same conceptual slot for **AI research problems** that Moody's / S&P / Fitch occupy for sovereign debt: a third party that publishes **transparent, methodology-backed, time-stamped, revisable ratings** that the community uses as a coordination signal.

Each open problem carries five rating dimensions, each independently scored, each with a rationale, each with a history:

| Dimension       | Plain definition                                                                 | Scale         |
|-----------------|----------------------------------------------------------------------------------|---------------|
| **Difficulty**  | How hard is this, given current methods?                                         | S/A/B/C/D/E   |
| **Saturation**  | How close to "solved" is the current best, vs. the achievable ceiling?           | 0–100 (%)     |
| **Urgency**     | How time-sensitive is progress here? (downstream blockers, safety relevance)     | 0–5 stars     |
| **Value**       | Expected scientific/economic impact if substantively advanced.                   | 0–5 stars     |
| **Industry Call** | How loudly is industry asking for this? (job postings, VC, infra need)         | 0–5 stars     |

Ratings are **revisable**. Each change emits a **rating action** (entry in a public log) with rationale, author, methodology version, and timestamp — analogous to a credit rating action notice. This is core to the brand and **must not be diluted**.

### 3.2 Three Reader Personas

The IA must serve all three on every page:

- **The Surveyor** (lit-review student): wants a curated landscape, taxonomy, key papers, current SOTA.
- **The Frontier Pusher** (PhD/researcher): wants leaderboards, recent rating actions, who their direct competitors are.
- **The Strategist** (PI / industry lead / funder): wants the rating radar, urgency/value/industry-call cross-cuts, "movers" dashboards.

### 3.3 The Three Object Classes

Everything on the site reduces to three first-class entities and their relations:

```
        ┌──────────────┐
        │ OpenProblem  │◄──────── Rating (history, per dimension)
        └──────┬───────┘
               │ has many
               ▼
        ┌──────────────┐
        │  Benchmark   │  (dataset + metric + protocol)
        └──────┬───────┘
               │ has many
               ▼
        ┌──────────────┐
        │   Entry      │ ◄─── Paper ─── Author(s) ─── Institution(s)
        │ (a score)    │
        └──────────────┘
```

Everything else is metadata, view, or aggregate.

---

## 4. Domain Taxonomy (v1)

Top-level taxonomy mirrors the user-specified eight buckets. Each domain has a list of subdomains. The full taxonomy must live in **one canonical YAML file** (`content/taxonomy.yaml`) so it can be regenerated, validated, and rendered everywhere without drift.

```yaml
# content/taxonomy.yaml (excerpt — full version produced in Phase 0)
domains:
  - id: applications
    title: Applications
    subdomains:
      - { id: chem-phys-earth,     title: "Chemistry, Physics & Earth Sciences" }
      - { id: computer-vision,     title: "Computer Vision" }
      - { id: energy,              title: "Energy" }
      - { id: health-medicine,     title: "Health & Medicine" }
      - { id: language-speech,     title: "Language, Speech & Dialog" }
      - { id: neuroscience,        title: "Neuroscience & Cognitive Science" }
      - { id: robotics,            title: "Robotics" }
      - { id: social-sciences,     title: "Social Sciences" }
      - { id: time-series,         title: "Time Series" }
      - { id: applications-other,  title: "Everything Else" }
  - id: deep-learning
    title: Deep Learning
    subdomains:
      - { id: algorithms,                  title: "Algorithms" }
      - { id: attention-mechanisms,        title: "Attention Mechanisms" }
      - { id: foundation-models,           title: "Foundation Models" }
      - { id: generative-models,           title: "Generative Models & Autoencoders" }
      - { id: graph-neural-networks,       title: "Graph Neural Networks" }
      - { id: large-language-models,       title: "Large Language Models" }
      - { id: representation-learning,     title: "Other Representation Learning" }
      - { id: robustness,                  title: "Robustness" }
      - { id: self-supervised-learning,    title: "Self-Supervised Learning" }
      - { id: sequential-models,           title: "Sequential Models & Time Series" }
      - { id: theory,                      title: "Theory" }
      - { id: dl-other,                    title: "Everything Else" }
  - id: general-ml
    title: General Machine Learning
    subdomains: [ causality, methodology, clustering, data, evaluation,
                  hardware-software, kernel-methods, online-active-bandits,
                  representation-learning, scalable-algorithms,
                  sequential-network-time-series, supervised-learning,
                  transfer-multitask-meta, unsup-semisup, general-ml-other ]
  - id: optimization
    title: Optimization
    subdomains: [ convex, discrete-combinatorial, large-scale-parallel-distributed,
                  non-convex, stochastic, zero-order-black-box, optimization-other ]
  - id: probabilistic-methods
    title: Probabilistic Methods
    subdomains: [ bayesian, gaussian-processes, graphical-models,
                  monte-carlo-sampling, spectral-methods, structure-learning,
                  variational-inference, probabilistic-other ]
  - id: reinforcement-learning
    title: Reinforcement Learning
    subdomains: [ batch-offline, deep-rl, inverse, multi-agent, online,
                  planning, policy-search, rl-other ]
  - id: theory
    title: Theory
    subdomains: [ active-interactive, dl-theory, domain-adaptation-transfer,
                  game-theory, learning-theory, online-bandits,
                  optimization-theory, probabilistic-theory,
                  rl-planning-theory, theory-other ]
  - id: social-aspects
    title: Social Aspects
    subdomains: [ accountability-transparency-interpretability, alignment,
                  fairness, privacy, robustness, safety, security,
                  social-other ]
```

This taxonomy is **stable for Phase 1** but **versioned**. Future renames must go via a `redirects.yaml` file to preserve URLs.

---

## 5. Technology Stack & Rationale

> **Decision-making rule.** For each choice, the alternatives considered and the reason for selection are recorded as an ADR in `docs/adr/`. Format: MADR (Markdown ADR). The choices below are *recommendations*; if Claude Code disagrees on any after thinking, write an ADR proposing an alternative and *ask* before deviating.

### 5.1 Application framework

- **Next.js 15 (App Router) + React 19 + TypeScript (strict).** Server Components for fast first-paint on long content pages; ISR for problem detail pages; Edge runtime for the taxonomy index; great DX; large hiring pool; native Vercel deployment.
- Alternatives considered: Astro (better for static content, worse for the heavy interactivity we want); SvelteKit (smaller ecosystem for viz libs); Remix (now Next-aligned anyway).

### 5.2 Styling & component primitives

- **Tailwind CSS v4** + **shadcn/ui** (Radix-based, copy-in, fully owned). This gives us accessibility primitives + total visual control. No bootstrap, no MUI.
- Typography: **Inter** for UI, **Source Serif 4** for long-form prose, **JetBrains Mono** for code. Variable fonts only.

### 5.3 Content authoring

- **MDX** via [`next-mdx-remote`](https://github.com/hashicorp/next-mdx-remote) or **Velite** (preferred — Zod-validated, type-safe, fast). All prose (background, problem definition, rating rationale, methodology pages) lives in `.mdx` files in the repo.
- **YAML/JSON** for structured data (`taxonomy.yaml`, `problems/<slug>/problem.yaml`, `problems/<slug>/entries.json`).

### 5.4 Math, code, diagrams

- **KaTeX** (via `rehype-katex`) for inline & display math.
- **Shiki** for code highlighting (TextMate grammars, no client JS).
- **Mermaid** for in-prose diagrams.

### 5.5 Visualization

- **D3.js v7** for custom one-offs (force graphs, radar, sankey).
- **Visx** (or **Recharts**) for standard chart types (lines, bars).
- **react-force-graph** for citation/influence networks at scale.
- **Cytoscape.js** for larger graphs if needed.
- All visualizations must be:
  - Responsive (uses ResizeObserver / container queries).
  - Themeable (consume CSS custom properties, never hardcode colors).
  - Accessible (table fallback or `<desc>` + ARIA where appropriate).
  - SSR-safe (dynamic-import with `ssr: false` only when strictly necessary).

### 5.6 Search

- **Phase 1:** Fuse.js over a pre-built JSON index (problems + papers + authors). Client-side, ~100KB gz acceptable for 500 records.
- **Phase 4+:** Migrate to **Meilisearch** or **Typesense** (self-host) or **Algolia** (managed). Decision pending; record as ADR when triggered.

### 5.7 Data layer (deferred)

- **Phase 1–3: zero database.** All content is files in the repo, validated by Zod schemas at build time. Build emits a static JSON snapshot the client consumes.
- **Phase 4: introduce SQLite via [Turso/libSQL] or Postgres via [Neon]** + **Drizzle ORM**. Triggered when (a) we need write paths (submissions) or (b) JSON snapshot exceeds ~5MB gzipped.
- **Rule:** do not introduce a DB before the trigger fires.

### 5.8 Auth (deferred to Phase 4)

- **Clerk** or **NextAuth.js v5** when needed. GitHub OAuth strongly preferred for community signal.

### 5.9 Testing / Quality

- **Vitest** for unit + schema tests.
- **Playwright** for e2e + visual regression (screenshot diff on key pages).
- **Storybook 9** for component isolation.
- **Lighthouse CI** with 95+ thresholds on perf, a11y, SEO, BP.
- **TypeScript strict + `noUncheckedIndexedAccess`**. ESLint with `@typescript-eslint`, `eslint-plugin-react`, `eslint-plugin-tailwindcss`, `eslint-plugin-jsx-a11y`. Prettier. Husky + lint-staged.
- **Schema-driven everything.** Zod schemas in `lib/schemas/` are the source of truth. CI fails if any content file fails its schema.

### 5.10 Deployment

- **Vercel** (Next.js native). Preview deployment per PR.
- Domain: TBD — placeholder `llm-openproblems.org`.

### 5.11 Observability

- **Vercel Analytics** + **PostHog** (privacy-focused, EU instance) for usage. Cookieless until consent (GDPR & PIPEDA — Montréal/Canada).

---

## 6. Repository Structure

```
llm-openproblems/
├── README.md
├── MASTER_PROMPT.md              # this file — the source of truth
├── OPEN_QUESTIONS.md             # things Claude Code wants the human to decide
├── CHANGELOG.md                  # human-readable
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── .github/
│   ├── workflows/                # CI: typecheck, lint, test, build, lighthouse
│   └── ISSUE_TEMPLATE/           # new-problem.yml, rating-challenge.yml, leaderboard-entry.yml
├── docs/
│   ├── adr/                      # 0001-use-nextjs.md, 0002-velite-for-mdx.md, ...
│   ├── methodology/              # Rating methodology, public-facing
│   └── contributing.md
├── app/                          # Next.js App Router
│   ├── (marketing)/page.tsx      # landing
│   ├── domains/
│   ├── problems/
│   ├── papers/
│   ├── authors/
│   ├── institutions/
│   ├── methodology/
│   ├── trending/
│   ├── api/                      # public read-only JSON API
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── viz/                      # RatingRadar, SaturationCurve, DomainMap, ...
│   ├── content/                  # MDX components
│   └── layout/
├── lib/
│   ├── schemas/                  # Zod schemas — single source of truth
│   ├── ratings/                  # rating computation engine
│   ├── content/                  # MDX loaders, indexing
│   ├── search/                   # Fuse index builder
│   └── utils/
├── content/
│   ├── taxonomy.yaml
│   ├── methodology/              # MDX
│   ├── problems/
│   │   └── <problem-slug>/
│   │       ├── problem.yaml      # structured fields
│   │       ├── background.mdx
│   │       ├── definition.mdx
│   │       ├── history.mdx
│   │       ├── ratings/          # rating actions, one per .yaml
│   │       │   ├── 2026-05-14-initial.yaml
│   │       │   └── 2026-08-01-upgrade-saturation.yaml
│   │       └── entries.json      # leaderboard entries
│   ├── papers/<arxiv-id>.yaml
│   ├── authors/<slug>.yaml
│   └── institutions/<slug>.yaml
├── public/
└── scripts/
    ├── validate-content.ts       # runs all Zod validations; CI gate
    ├── build-search-index.ts
    ├── compute-aggregates.ts     # rolls up author/institution scores
    └── lint-mdx.ts
```

Rules:

- **One folder per problem.** This is the unit of authorship.
- **Rating actions are immutable.** New action = new file. Never edit a past rating action.
- **Slugs are URL-stable.** Renames go through `redirects.yaml`.

---

## 7. Canonical Data Model

> These are **Zod-style** schema sketches. The actual code goes in `lib/schemas/`. Validate every file at build time.

### 7.1 OpenProblem

```ts
const OpenProblemSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(5).max(120),
  subtitle: z.string().max(200).optional(),
  domain: z.string(),            // FK -> taxonomy.domains[].id
  subdomain: z.string(),         // FK -> taxonomy ...subdomains[].id
  tags: z.array(z.string()),
  status: z.enum(['open', 'partially-solved', 'converging', 'solved', 'retired']),
  posed_year: z.number().int().gte(1950).lte(new Date().getFullYear()),
  authors_who_posed: z.array(z.string()).optional(),   // landmark refs
  related_problems: z.array(z.string()).optional(),    // slugs
  benchmarks: z.array(BenchmarkSchema),                // 0..n
  external_links: z.object({
    arxiv_survey: z.string().url().optional(),
    paperswithcode_legacy: z.string().url().optional(),
    nlp_progress: z.string().url().optional(),
    canonical_survey: z.string().url().optional(),
  }).optional(),
  editorial: z.object({
    primary_curator: z.string(),                       // GitHub handle
    last_curated: z.string(),                          // ISO date
  }),
});

const BenchmarkSchema = z.object({
  id: z.string(),
  name: z.string(),               // e.g., "SWE-bench Verified"
  dataset: z.string(),
  metric: z.string(),             // e.g., "pass@1"
  metric_direction: z.enum(['higher-is-better', 'lower-is-better']),
  upper_bound: z.number().optional(),     // human or theoretical ceiling
  protocol_url: z.string().url().optional(),
  notes: z.string().optional(),
});
```

### 7.2 Rating Action

```ts
const RatingActionSchema = z.object({
  problem_slug: z.string(),
  date: z.string(),               // ISO
  methodology_version: z.string(),
  curator: z.string(),            // GitHub handle
  prior_action: z.string().optional(),    // path to previous file, for diff
  dimensions: z.object({
    difficulty:     z.object({ grade: z.enum(['S','A','B','C','D','E']), confidence: z.number().min(0).max(1), rationale: z.string() }),
    saturation:     z.object({ value: z.number().min(0).max(100), confidence: z.number(), rationale: z.string() }),
    urgency:        z.object({ stars: z.number().int().min(0).max(5), confidence: z.number(), rationale: z.string() }),
    value:          z.object({ stars: z.number().int().min(0).max(5), confidence: z.number(), rationale: z.string() }),
    industry_call:  z.object({ stars: z.number().int().min(0).max(5), confidence: z.number(), rationale: z.string() }),
  }),
  signals_considered: z.array(z.string()).optional(),  // e.g., paper IDs, links
  watchlist: z.boolean().default(false),               // pending review
});
```

### 7.3 Paper

```ts
const PaperSchema = z.object({
  id: z.string(),                  // canonical: arxiv id if exists, else DOI, else generated
  title: z.string(),
  authors: z.array(z.string()),    // slugs
  institutions: z.array(z.string()),
  venue: z.string().optional(),    // ICLR-2026, NeurIPS-2025, arXiv, ...
  year: z.number().int(),
  arxiv_id: z.string().optional(),
  doi: z.string().optional(),
  github: z.string().url().optional(),
  tldr: z.string().max(400),       // human-written; never auto-generated without curator
  contributions: z.array(z.object({
    problem_slug: z.string(),
    benchmark_id: z.string().optional(),
    score: z.number().optional(),
    metric: z.string().optional(),
    rank_at_publication: z.number().int().optional(),
    evidence: z.string().url(),    // paper section or table reference
  })),
});
```

### 7.4 Leaderboard Entry

```ts
const EntrySchema = z.object({
  paper_id: z.string(),
  benchmark_id: z.string(),
  score: z.number(),
  date: z.string(),                // when score was achieved/reported
  verified: z.boolean(),           // editor-verified?
  protocol_notes: z.string().optional(),
});
```

### 7.5 Author / Institution

```ts
const AuthorSchema = z.object({
  slug: z.string(),
  display_name: z.string(),
  affiliations: z.array(z.object({ institution: z.string(), from: z.string(), to: z.string().optional() })),
  homepage: z.string().url().optional(),
  scholar_id: z.string().optional(),
  orcid: z.string().optional(),
});

// Institutions analogous.
```

---

## 8. Rating Methodology v1.0

> This section is **public-facing**. Render it at `/methodology` (the same MDX file lives in `content/methodology/v1.mdx`). It must be **defensible** at the level of a workshop paper.

### 8.1 First principles

- **Transparent.** Every rating action lists the signals considered and the curator.
- **Revisable.** Ratings can move up or down. The history is a first-class object.
- **Versioned.** A rating produced under v1.0 is never silently re-graded by v1.1.
- **Multi-dimensional.** Open problems are not totally ordered; one scalar would be misleading.
- **Discretized.** Letter grades and star buckets prevent false precision.

### 8.2 Dimensions (v1.0 definitions)

**Difficulty (S, A, B, C, D, E).** *"Conditional on current methods, how hard is substantive progress?"*

- **S** — landmark unsolved problems with multi-decade resistance (e.g., reliably truthful long-form generation, formal AGI safety guarantees).
- **A** — major open problems with significant unsolved structure; SOTA improving sub-log-linearly in compute.
- **B** — actively-attacked problems where SOTA improves with compute / data but no closure in sight.
- **C** — engineering-bounded; progress is largely a function of compute & data.
- **D** — close to closure; only edge cases remain.
- **E** — effectively solved on the dominant benchmark family; benchmark may itself be deprecated.

**Saturation (0–100).** *"How close is current SOTA to the achievable ceiling?"*

- Computed (when possible) as `(SOTA - random_baseline) / (ceiling - random_baseline) × 100`.
- `ceiling` = human-expert or theoretical upper bound (must be cited).
- When no ceiling exists, mark **Saturation = N/A** and use a qualitative band (Low / Medium / High).
- A second-derivative signal `Δ(SOTA, 12mo) / Δ(SOTA, 36mo)` ∈ [0, 1] is reported alongside (low = saturating).

**Urgency (0–5 stars).** *"How time-sensitive is progress?"*

- Signals: AI-safety reports citing the problem; downstream applications blocked; regulatory/legal deadlines; reproducibility crises.

**Value (0–5 stars).** *"Expected impact if substantively advanced."*

- Signals: cross-domain spillover; number of downstream problems that unlock; size of the affected economic/scientific community.

**Industry Call (0–5 stars).** *"How loudly is industry asking?"*

- Signals: job-posting frequency citing the keyword; venture funding in adjacent applied domain; presence in major industry labs' published roadmaps.

### 8.3 Aggregate "composite" rating (advisory only)

A single advisory composite for sorting on the landing page:

```
Composite = w_d * Difficulty + w_v * Value + w_u * Urgency
          + w_i * IndustryCall + w_s * (100 - Saturation) / 20
```

Default weights `(w_d, w_v, w_u, w_i, w_s) = (0.25, 0.25, 0.2, 0.15, 0.15)` (publish in methodology page; let users re-weight via UI control). **Sorting on Composite must always show the underlying dimensions; the composite is never displayed alone.**

### 8.4 Confidence

Every dimension carries a `confidence ∈ [0, 1]`. UI renders confidence as opacity or a small bar. A rating with confidence < 0.5 is marked **WATCH** (analogous to a credit watchlist).

### 8.5 Rating Actions log

Every change emits an entry on the global `/ratings` action feed (RSS + JSON). Format mirrors S&P "rating action" press releases: prior → new, on each affected dimension, with rationale.

### 8.6 Conflict-of-interest policy

A curator must not rate a problem where they (or their direct collaborators within the last 24 months) hold a current leaderboard top-5 entry. Documented in `docs/methodology/coi.md`.

---

## 9. Information Architecture & Routes

```
/                                           Landing — movers, hot, trending, search
/domains                                    All 8 domains, tile grid with subdomain counts
/domains/[domain]                           Domain hub: subdomain list + featured problems
/domains/[domain]/[subdomain]               Subdomain page: problems table + viz
/problems                                   All problems, filterable, sortable
/problems/[slug]                            ⭐ Problem detail (canonical URL)
/problems/[slug]/leaderboard                Full leaderboard
/problems/[slug]/history                    Timeline + saturation curve
/problems/[slug]/ratings                    Rating action history
/papers                                     Papers index (filterable)
/papers/[id]                                Paper detail
/authors/[slug]                             Author profile
/institutions/[slug]                        Institution profile
/methodology                                Public methodology doc
/methodology/v[N]                           Versioned methodology snapshots
/trending                                   Hot/cold movers, recent rating actions
/ratings                                    Public rating actions feed (RSS + JSON + HTML)
/api/v1/problems[?domain=...]               Read-only JSON API
/api/v1/problems/[slug]
/api/v1/ratings
/api/v1/rss.xml
/about
/contributing
```

Every problem page MUST contain, in this order:

1. **Header card.** Title, status pill, breadcrumbs, last-curated date.
2. **Rating Radar.** 5-axis radar with confidence shading. Click any axis → expand rationale.
3. **TL;DR.** 2–3 sentences. Never auto-generated.
4. **Background.** MDX, can include images & math.
5. **Formal definition.** Math-heavy section with notation table.
6. **Benchmarks & current SOTA.** Table + a "view leaderboard" CTA.
7. **History timeline.** Horizontal scroll of milestone papers.
8. **Recent rating actions.** Last 3, link to full history.
9. **Related problems.** Graph teaser.
10. **Citation block.** BibTeX entry that cites this URL.

---

## 10. Design System & UX Principles

### 10.1 Visual language

- **Restrained, academic-industrial.** Think: arXiv ergonomics meets Linear polish meets Bloomberg data density.
- **Color.** Two-tone foundation (near-black `#0B0D10` / paper-white `#FAFAF7`). One brand accent (deep cyan or vermilion — pick one and stick with it). Rating dimensions get distinct chart hues, all WCAG AA contrast.
- **Type.** Serif body (Source Serif 4) for prose. Sans (Inter) for UI. Mono (JetBrains Mono) for code & metrics.
- **Density.** Higher than a marketing site. Dashboards approach Bloomberg density on the `/trending` page; problem detail pages stay generous with reading width (~70ch).
- **Motion.** Subtle. 150ms ease. No bouncing. Reduced-motion-respected.
- **Dark mode.** First class. Not a tinted invert — a true second design.

### 10.2 Interaction principles

- **Every chart is also a table.** A "View as table" toggle on every viz — both for a11y and for researchers who want CSV.
- **Every quantity is sourced.** Hover any number → see provenance (paper ID + date).
- **No dead-ends.** From any problem you can: jump to the subdomain, to a top contributor, to a rival problem, to the methodology section that justified its rating.

### 10.3 Accessibility

- WCAG 2.2 AA non-negotiable. AAA where feasible on type contrast.
- Keyboard-navigable everywhere. Skip-to-content. Focus rings visible.
- Reduced motion. Screen-reader-friendly chart fallbacks.

### 10.4 Performance budgets

- LCP < 1.8s on slow 4G for the landing.
- Problem detail page JS budget < 180KB gz (excluding viz route chunks).
- Largest viz chunk lazy-loaded with `next/dynamic`.
- All images `next/image` with explicit dimensions.

---

## 11. Visualization Catalog

Implement (in this order, across phases — see § 13):

1. **RatingRadar** — 5-axis radar, animated entry, dimension-tooltips, confidence shading. (Problem detail.)
2. **SaturationCurve** — line chart of best-known score over time; ceiling line; annotations on landmark papers. (Problem detail + history.)
3. **MoversBoard** — Bloomberg-style table of recent rating moves with sparkline columns. (Trending page.)
4. **DomainMap** — D3 force-directed graph of (domain → subdomain → problem) nodes, sized by composite rating; brushable. (Landing + /domains.)
5. **TimelineRibbon** — horizontal milestone ribbon per problem.
6. **AuthorImpactSparkline** — sparkline + cumulative rank evolution on an author page.
7. **CitationFlowSankey** — papers → benchmarks → problems flow. (Phase 3.)
8. **RatingHistoryStream** — streamgraph of rating dimension changes over time.

Every viz lives in `components/viz/<Name>/` with: `index.tsx`, `index.stories.tsx`, `index.test.tsx`, `README.md` (data shape + a11y notes).

---

## 12. Phase Plan

> **The cardinal rule:** Do **not** start phase N+1 until phase N has shipped its acceptance criteria, an ADR has been written for any deviations, and the human has signed off.

| Phase | Theme                     | Acceptance gate                                                                                   | Duration target |
|-------|---------------------------|---------------------------------------------------------------------------------------------------|-----------------|
| 0     | Foundation                | Repo green: CI, schemas, taxonomy, design system tokens, empty routes; deployable preview.        | 1–2 weeks       |
| 1     | Core MVP                  | 6–10 fully authored problems live; problem detail page complete; RatingRadar + table; search.     | 3–4 weeks       |
| 2     | Leaderboards & Papers     | Paper / Author / Institution pages; benchmark tables; entries.json schema; verified flag.         | 2–3 weeks       |
| 3     | Ratings dynamics & viz    | Rating action log; SaturationCurve; MoversBoard; /trending page; RSS feed.                        | 3 weeks         |
| 4     | DomainMap & community     | DomainMap; issue templates; submission workflow; (optional) DB migration if scale triggers fire.  | 3 weeks         |
| 5     | Intelligence layer        | arXiv ingest helper; LLM-assisted candidate paper extraction with human-in-the-loop UI.           | 4 weeks         |
| 6+    | Discussions, API auth, monetization | TBD                                                                                     | —               |

---

## 13. Per-Phase Detailed Deliverables

### Phase 0 — Foundation (no user-visible content yet)

**Deliverables.**

- Next.js 15 + TS strict + Tailwind v4 + shadcn/ui initialized.
- ESLint, Prettier, Husky, lint-staged, commitlint (Conventional Commits).
- Vitest, Playwright, Storybook, Lighthouse CI wired.
- GitHub Actions: `typecheck`, `lint`, `test`, `build`, `lighthouse`, `validate-content`.
- `lib/schemas/*` — Zod schemas for taxonomy, problem, rating, paper, entry, author, institution.
- `content/taxonomy.yaml` — full populated taxonomy from §4.
- `scripts/validate-content.ts` — runs in CI; fails on schema error.
- Design tokens: typography scale, color tokens (light + dark), spacing, radii, motion tokens.
- Empty App Router structure with stubbed routes (each returns "Phase 1 content pending").
- ADRs: `0001-nextjs-app-router`, `0002-velite-or-next-mdx-remote`, `0003-zod-as-source-of-truth`, `0004-file-first-no-db`, `0005-rating-action-immutability`.
- `OPEN_QUESTIONS.md` initialized.

**Acceptance gate.**

- `pnpm build` is green.
- Preview deployment to Vercel renders the stub landing.
- Lighthouse perf ≥ 95 on the empty landing.
- All schemas have unit tests.

### Phase 1 — Core MVP

**Deliverables.**

- Authored problem content for the **seed list** (§16). For each: `problem.yaml`, `background.mdx`, `definition.mdx`, `history.mdx`, one initial rating action.
- Problem detail page (`/problems/[slug]`) implements the 10-block layout from §9.
- `RatingRadar` v1 (no history yet — just current snapshot).
- Domain & subdomain hub pages (`/domains`, `/domains/[domain]`, `/domains/[domain]/[subdomain]`) — tables + filtered viz teasers.
- Problems index (`/problems`) with client-side filter (domain, status, tag) and sort (title, last-curated, composite).
- Search via Fuse.js — `Cmd/Ctrl+K` palette.
- Landing page v1: hero, "Recently rated" carousel, "By domain" tile grid, methodology link.
- Methodology page rendering `content/methodology/v1.mdx`.
- Dark mode toggle, persisted.
- Storybook entries for every viz + UI primitive used.

**Acceptance gate.**

- All seed problems validate.
- Lighthouse: perf ≥ 95, a11y ≥ 95, SEO ≥ 95 on `/`, `/problems/[any-slug]`, `/domains/[any]`.
- Playwright smoke suite green: navigate landing → domain → subdomain → problem → leaderboard placeholder.
- Visual regression baselines captured.

### Phase 2 — Papers, Authors, Institutions, Leaderboards

**Deliverables.**

- `content/papers/<id>.yaml`, `content/authors/<slug>.yaml`, `content/institutions/<slug>.yaml` schemas live.
- 30–50 seed papers covering the seed problems' SOTA history.
- Paper / Author / Institution detail pages.
- Per-problem leaderboard page with sortable, filterable table.
- `entries.json` per problem; per-entry verified flag rendered.
- Aggregate rollups: each author shows cumulative problem-impact score; each institution shows ranked subdomain coverage.
- Cross-link audit: every paper appears on every problem it contributes to and vice versa (validation script).

**Acceptance gate.**

- Validation script `scripts/cross-link-audit.ts` green.
- New visual regression baselines.

### Phase 3 — Rating Dynamics & Trending

**Deliverables.**

- Second and third rating actions for at least 5 seed problems (simulate revisions across past months).
- Problem `/ratings` sub-page with full action history.
- `/ratings` global feed (HTML + JSON + RSS).
- `SaturationCurve` chart on problem `/history`.
- `MoversBoard` on `/trending` (top upgrades, downgrades, watch-list additions in last 30 days).
- `RatingHistoryStream` (streamgraph) on a problem's `/history`.
- "Recompose" UI control on `/problems` letting the user re-weight composite.

**Acceptance gate.**

- All charts have table-fallback toggles.
- RSS validates (W3C feed validator).
- Lighthouse a11y still ≥ 95 with new charts.

### Phase 4 — DomainMap, Community, optional DB migration

**Deliverables.**

- `DomainMap` (force graph) on `/` and `/domains`.
- GitHub issue templates for: new-problem, new-paper, leaderboard-entry, rating-challenge.
- `/contributing` page rendering the full editorial workflow.
- (Conditional) DB migration: if `gzip(content-snapshot) > 5MB` OR auth is needed for submissions, migrate structured data to Postgres/Drizzle. **Otherwise skip and revisit at Phase 5.**

### Phase 5 — Intelligence layer (LLM-assisted curation)

- arXiv ingestion helper (a CLI in `scripts/`) producing **draft** paper YAML for curator review.
- LLM-assisted extraction of candidate leaderboard entries from a paper PDF (must produce a human-review diff; no auto-merge).
- Email/RSS digest: per-domain weekly summary.

### Phase 6+

- GitHub Discussions integration for problem talk pages.
- Read+write API with token auth.
- Bilingual rendering (FR primary candidate, given Montréal location).

---

## 14. Quality Gates & Engineering Conventions

### 14.1 Code style

- **TypeScript strict + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.**
- Prefer `function` declarations for top-level utilities; arrow functions for callbacks.
- No `any` without an inline `// reason:` comment justifying it.
- Component file structure:
  ```
  ComponentName/
    index.tsx
    index.stories.tsx
    index.test.tsx
    helpers.ts (optional)
    README.md (only if non-trivial)
  ```
- No barrel files (`index.ts` re-exports) that bloat tree-shaking.

### 14.2 Testing

- Every Zod schema: at least 3 tests (valid, invalid, edge).
- Every utility in `lib/ratings/`: property-based tests via `fast-check`.
- Every page route: Playwright smoke (renders, no console errors, key landmarks present).
- Every viz: Storybook + Playwright screenshot.

### 14.3 Content quality

- No prose generated by LLM is committed without `[draft]` in the file front-matter and a `human-reviewer:` field added before removal.
- All numbers carry a source. CI fails if a number appears in MDX without an adjacent `<Cite paper="...">` or footnote.

### 14.4 Commits & PRs

- Conventional Commits.
- Every PR ticks the boxes in `.github/pull_request_template.md`:
  - [ ] Schemas validated
  - [ ] New ADR if architectural
  - [ ] Updates `CHANGELOG.md`
  - [ ] Tests added
  - [ ] Lighthouse delta noted
  - [ ] OPEN_QUESTIONS.md updated if new ambiguity surfaced

---

## 15. Think → Design → Code → Iterate Loop

> **This is how Claude Code should operate inside every phase task.** Treat each numbered phase deliverable as a *unit of work* that goes through all four stages.

### Stage 1 — THINK (5–15% of effort)

Before writing any code, produce `docs/thinking/<unit-id>.md` covering:

- **Problem restatement.** In Claude Code's own words, the goal of this unit.
- **Inputs.** What data, schemas, prior decisions are relevant.
- **Constraints.** From this master prompt, from prior ADRs.
- **Alternatives considered.** Minimum two, with tradeoffs.
- **Edge cases & failure modes.** At least three.
- **Open questions.** Anything unresolved → add to `OPEN_QUESTIONS.md`.
- **Decision.** Crisp.

If the unit touches architecture, escalate the decision into a numbered ADR in `docs/adr/`.

### Stage 2 — DESIGN (10–20% of effort)

- For UI: a low-fi sketch in markdown (ASCII or Mermaid) **before** any JSX.
- For data: the Zod schema and at least one fixture file **before** any reader code.
- For visualization: a Storybook story stub with mock data **before** real wiring.
- For an algorithm (e.g., composite computation): pseudocode + a property list of invariants the implementation must satisfy.

### Stage 3 — CODE (50–60% of effort)

- TDD where feasible: write a failing test, implement, green it, refactor.
- Keep commits small and reversible.
- Run `pnpm typecheck && pnpm lint && pnpm test && pnpm validate-content` locally before pushing.
- Capture screenshots via Playwright for any UI touched.

### Stage 4 — ITERATE (15–25% of effort)

- Self-review with the **reviewer-mode checklist** (below).
- Run Lighthouse against affected routes; record deltas.
- Update `CHANGELOG.md`.
- If the unit invalidated a prior ADR, write a superseding ADR.
- Post a one-paragraph summary to the human; **wait for confirmation** before moving to the next deliverable in the same phase **only if** the unit is on the phase critical path (schemas, IA changes, design tokens). Routine units may proceed without confirmation.

### 15.5 Reviewer-mode checklist (apply at end of every unit)

A senior reviewer for ICLR/NeurIPS would ask:

- [ ] Is every claim sourced?
- [ ] Are statistical artifacts (sample size, variance, ceilings) handled?
- [ ] Have I introduced a baseline / comparison where one is warranted?
- [ ] Is the failure mode of this code documented?
- [ ] Could a future curator misuse the schema in a way I should harden against?
- [ ] Am I leaking implementation into the URL space (URLs should be stable beyond impl details)?
- [ ] Does this change degrade Lighthouse, bundle size, or a11y? If yes — justified or fixed?

### 15.6 Sticky rules for Claude Code

- **Never** invent leaderboard numbers or paper titles. If a number is unknown, write `TODO(curate)` and surface it in `OPEN_QUESTIONS.md`.
- **Never** start Phase N+1 work while Phase N gate is open.
- **Never** silently change schemas; bump a version field and write a migration.
- **Always** read this MASTER_PROMPT before starting any new phase to refresh context.
- **Always** prefer to ask the human via `OPEN_QUESTIONS.md` than to guess on a load-bearing decision.

---

## 16. Seed Content (Phase 1)

> Author full content (`problem.yaml`, `background.mdx`, `definition.mdx`, `history.mdx`, `ratings/2026-05-14-initial.yaml`) for each. Six is the **minimum** for Phase 1 acceptance; ten is the target. Each problem MUST cite primary sources. Numbers in YAML are placeholders until curated.

The seed deliberately spans the taxonomy to stress-test the IA:

1. **Faithful & Calibrated Hallucination Reduction in LLMs**
   - Domain: `deep-learning` / `large-language-models`
   - Why now: hallucination is the perennial open problem; recent test-time-scaling work shows reasoning *increases* hallucinations on knowledge-intensive tasks (Yang et al., NeurIPS 2025).
   - Benchmarks: HaluEval, TruthfulQA-2026, SimpleQA, FACTS.

2. **Reliable Long-Horizon Agent Execution (pass^k reliability gap)**
   - Domain: `deep-learning` / `large-language-models`
   - Why now: SWE-bench Verified pass@1 ≈80% by early 2026, but τ-bench pass^8 < 25%; the "reliability cliff" is the new frontier.
   - Benchmarks: SWE-bench Verified, τ-bench, RE-Bench, OSWorld.

3. **Scalable Oversight Beyond Human-Verifiable Capability**
   - Domain: `social-aspects` / `alignment`
   - Why now: as models surpass humans in narrow domains, debate, recursive reward modeling, and prover-verifier games are active.
   - Benchmarks: GPQA-Diamond split, debate-arena protocols.

4. **Mechanistic Interpretability of Frontier-Scale Transformers**
   - Domain: `social-aspects` / `accountability-transparency-interpretability`
   - Why now: SAE progress in 2024–25; mixed verdict in 2026 status reports; deceptive-alignment auditing remains open.
   - Benchmarks: circuit-recovery benchmarks, IOI-family, SAEBench.

5. **Compute-Optimal Test-Time Reasoning Allocation**
   - Domain: `deep-learning` / `algorithms`
   - Why now: Snell et al. compute-optimal scaling; inverse scaling in test-time compute (2025).
   - Benchmarks: AIME-2026, GPQA, HLE.

6. **Robust Multi-Agent LLM Coordination & Memory**
   - Domain: `reinforcement-learning` / `multi-agent` (with cross-link to `deep-learning` / `large-language-models`)
   - Why now: Han et al. 2024–26 survey; production agent stacks all hit memory-sharing walls.

7. **Genome-scale Foundation Models for Functional Variant Prediction**
   - Domain: `applications` / `health-medicine`
   - Why now: 9.3T-nucleotide foundation models; first AI-discovered drugs entering Phase II.

8. **Operator-Learning Foundation Models for Physical Systems**
   - Domain: `applications` / `chem-phys-earth`
   - Why now: weather/fluid surrogate models; generalization across regimes is open.

9. **Benchmark Integrity & Evaluation Gaming**
   - Domain: `general-ml` / `evaluation`
   - Why now: Berkeley RDI 2026 found 8 agent benchmarks gamable to ~100% without solving any task.

10. **Long-Context Retrieval-Augmented Generation Beyond 1M Tokens**
    - Domain: `deep-learning` / `large-language-models`
    - Why now: context windows have grown but quality plateaus; needle-in-N-haystack is brittle.

For each, **do not fabricate numerical scores** — leave `TODO(curate)` placeholders that the human will fill or that a later curation pass will populate from primary sources.

---

## 17. Open Questions for the Human

Place these (and any new ones that arise) in `OPEN_QUESTIONS.md`. The human will answer asynchronously; do not block on them but do not silently resolve them either.

- [ ] **Brand name.** Working title: *LLM OpenProblems*. Alternatives: *AIORatings*, *OpenAI-Problems*, *ResearchRatings*. Decision needed before Phase 1 visual design.
- [ ] **Domain.** TBD.
- [ ] **Hosting.** Vercel assumed; confirm.
- [ ] **License.** Code: MIT vs Apache-2.0. Content (MDX + YAML): CC-BY-4.0 recommended.
- [ ] **Primary brand accent.** Vermilion vs deep cyan. (Mock both, decide on the landing v1.)
- [ ] **Bilingual rollout (FR/EN).** Phase 6 or earlier?
- [ ] **Editorial governance.** Solo curator (the PhD author) for Phase 1–3, then editorial board?
- [ ] **arXiv-API rate-limit strategy for Phase 5.**
- [ ] **Methodology paper venue target.** ICLR Blog Track? NeurIPS D&B? Position paper at workshop?

---

## 18. Glossary

- **ADR.** Architecture Decision Record. Markdown file in `docs/adr/`, one decision per file, numbered.
- **Benchmark.** Triple of (dataset, metric, protocol). One problem can have many benchmarks.
- **Composite rating.** A weighted scalar over the five dimensions, advisory only.
- **Curator.** A human with commit access who can author rating actions.
- **Entry.** A single (paper, benchmark, score, date) record on a leaderboard.
- **MDX.** Markdown with JSX components. The authoring format for prose.
- **Movers.** Problems whose rating changed in the recent window (rendered on `/trending`).
- **Rating action.** An immutable, timestamped, signed change to a problem's rating across one or more dimensions.
- **Saturation.** A 0–100 measure of distance to ceiling; see § 8.2.
- **TL;DR.** A 2–3-sentence summary; never auto-generated for production.
- **Watchlist.** Confidence-< 0.5 ratings; flagged for re-review.

---

## Appendix A — How to use this prompt with Claude Code

1. Create a new empty git repo on your local machine.
2. `git init && git add . && git commit -m "chore: bootstrap"` (the very first commit can simply contain this file at the repo root).
3. Open Claude Code in that directory.
4. Run a session that begins with:

   > Read `MASTER_PROMPT.md` end-to-end. Confirm understanding by summarizing the eight phases, the five rating dimensions, and the four-stage loop, then propose Phase 0 unit breakdown (no code yet). Wait for my go-ahead before starting Phase 0 Stage 1 (THINK) on the first unit.

5. From there, drive phase-by-phase. After each unit's *iterate* stage, review the summary Claude Code posts; if good, say "proceed to next unit". If a load-bearing decision is involved, answer the new `OPEN_QUESTIONS.md` entries first.

6. When entering a new session (context reset), Claude Code should re-read this file first.

---

## Appendix B — One-line philosophy

> *Ratings should be earned, not declared. Methodology should be public. Disagreements should fork the methodology, not the rating.*

---

*End of MASTER_PROMPT.md.*
