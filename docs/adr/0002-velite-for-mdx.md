# ADR-0002 — Velite for the MDX content pipeline

- **Status:** accepted
- **Date authored:** 2026-05-14
- **Date accepted:** 2026-05-14
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

The repository is content-heavy by design (MASTER_PROMPT.md §6): one folder per problem, each containing `problem.yaml`, `background.mdx`, `definition.mdx`, `history.mdx`, and one or more rating-action YAML files. Methodology lives in `content/methodology/v[N].mdx`. Papers, authors, and institutions are YAML.

We need a content pipeline that:

- Validates every file against a Zod schema at build time, failing the build on any drift (§5.9, §14.3).
- Produces fully typed data — autocomplete on `problem.benchmarks[0].metric_direction` should work in IDEs without manual type assertions.
- Compiles MDX to a form that Next.js 15 RSC can render directly.
- Builds in single-digit seconds at the Phase 1 content scale (≈ 10 problems × 3 MDX files + supporting YAML) and stays bounded as content grows.

## Decision Drivers

- **Schema enforcement.** Per §15.6 "Always prefer to ask the human… than guess on a load-bearing decision" and §14.3 ("CI fails if any content file fails its schema"), validation must be intrinsic to the pipeline, not bolted on.
- **Type inference end-to-end.** A Zod schema authored in `lib/schemas/` should yield TypeScript types consumed by both the data layer and React components, with no duplicated type definitions.
- **MDX support.** First-class, including frontmatter parsing and rehype/remark plugin composition (KaTeX, Shiki, Mermaid per §5.4).
- **Build speed.** Acceptable: ≤ 5 s incremental on Phase 1 content; ≤ 30 s cold on a 10× content set.
- **Maintenance posture.** Project must be alive: commits in the last 12 months, an open issue tracker, ≥ 2 maintainers.
- **Migration cost on failure.** If the pipeline is abandoned later, swapping it out should be a ≤ 1-week job, not a rewrite.

## Considered Options

1. **Velite** — Zod-validated, build-step content layer with `.velite/` output.
2. **`next-mdx-remote`** — runtime/build-time MDX renderer with no built-in validation layer.
3. **Contentlayer (original)** — Zod-flavored DSL, archived by author Sep 2023; not viable.
4. **Contentlayer2 / fumadocs-style hand-rolled** — community forks of Contentlayer, varying maturity.
5. **Plain MDX + custom loaders** — write our own walker, schema-checker, and compiler.

## Decision Outcome

**Chosen: Option 1 — Velite.**

Velite reduces the gap between "Zod schema in `lib/schemas/`" (ADR-0003) and "typed content the App Router consumes" to a single config file. It composes natively with the rehype/remark plugin pipeline we need for KaTeX + Shiki + Mermaid. It is the lowest-friction way to satisfy the §14.3 quality gate ("CI fails if any content file fails its schema") without bolting validation onto a more general loader.

The dominant risk is project maturity: Velite is younger than `next-mdx-remote`. We mitigate by (a) keeping Velite config narrow — no exotic features — so a future migration to plain MDX + a custom loader stays a week-long job, not a rewrite; and (b) ensuring our Zod schemas (ADR-0003) are framework-independent, so the schemas survive any pipeline change.

### Consequences

- **Positive:** Zod schemas in `lib/schemas/` are the literal source of truth — Velite imports them directly. No duplicated type definitions between content and runtime.
- **Positive:** Build-time validation is intrinsic; the `validate-content` script (Unit 0.7) becomes a thin wrapper around Velite's build.
- **Positive:** Generated `.velite/` artifact is a typed JSON snapshot the App Router consumes — aligns with §5.7's "build emits a static JSON snapshot the client consumes."
- **Negative:** Velite has a smaller community than `next-mdx-remote`; obscure rehype/remark plugin interactions may need workarounds.
- **Negative:** Velite's opinionated structure means any content shape it doesn't anticipate (e.g., editorial talk-page comments in a hypothetical Phase 6) may require an escape hatch.
- **Mitigation:** if Velite is abandoned upstream, swap to `next-mdx-remote` + a custom Zod-on-frontmatter wrapper. Estimated cost: 3–5 days. Schemas survive intact.

## Pros and Cons of the Options

### Option 1 — Velite

- Good — Zod-native; schemas in `lib/schemas/` are the source of truth with no duplication.
- Good — generated artifact (`.velite/index.json`) is shaped exactly for static-snapshot consumption.
- Good — first-class rehype/remark integration for KaTeX, Shiki, Mermaid.
- Good — typed output flows directly to RSC.
- Bad — smaller ecosystem than `next-mdx-remote`; less Stack Overflow surface for debugging.
- Bad — newer project; bus-factor risk.

### Option 2 — `next-mdx-remote`

- Good — battle-tested, large community, robust.
- Good — flexible: render MDX from any source (string, file, CMS) at build or request time.
- Bad — no built-in schema layer. We'd write Zod-on-frontmatter validation ourselves, plus a content walker, plus index building. ≈ 200–400 LoC of glue we don't have to write with Velite.
- Bad — no typed `import` of content; everything is "any" until we cast it.

### Option 3 — Contentlayer (original)

- Bad — archived September 2023. Not viable.

### Option 4 — Contentlayer2 / community forks

- Good — drop-in for projects already on Contentlayer.
- Bad — multiple competing forks; no clear winner; maintenance uncertain.
- Bad — schema DSL is Contentlayer-flavored, not Zod-native — would force us to duplicate or translate.

### Option 5 — Plain MDX + custom loaders

- Good — maximum control; no third-party churn risk.
- Bad — every saved hour of upfront writing is paid back many times in maintenance. We'd reinvent Velite poorly.
- Bad — diverts effort from the rating methodology, which is the actual research contribution.

## Links

- MASTER_PROMPT.md §5.3, §5.4, §5.9, §14.3.
- Related: ADR-0001 (Next.js — Velite is Next-aware), ADR-0003 (Zod — Velite consumes our schemas).
- Velite: https://velite.js.org/
