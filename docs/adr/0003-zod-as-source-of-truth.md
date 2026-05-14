# ADR-0003 — Zod 4 as the schema source of truth

- **Status:** accepted
- **Date authored:** 2026-05-14
- **Date accepted:** 2026-05-14
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

MASTER_PROMPT.md §5.9 and §7 mandate that one set of schemas drive *everything*: build-time content validation, TypeScript types, the public read-only JSON API responses, the search index builder, and the eventual REST contract (Phase 6). If the schema layer is fragmented across "TS types in one place, JSON Schema in another, runtime validators in a third," drift is inevitable and the credibility of the rated content (which is the project's entire value proposition) suffers.

The chosen library must:

- Have a single canonical encoding that produces both runtime validators and TypeScript types (`z.infer`).
- Compose with Velite (ADR-0002).
- Survive a refactor of the content pipeline (ADR-0002) without changes to schema files.
- Support `discriminatedUnion`, `refine`, `superRefine`, `transform`, and recursive types — we will need all five to model rating actions, conditional benchmark shapes, and slug-FK validation.

## Decision Drivers

- **Single source of truth.** Schema → types + validators in one file; no duplication.
- **Velite compatibility.** Velite consumes Zod natively; any other library is a second-class citizen there.
- **Ecosystem coverage.** Velite, OpenAPI generators, form libraries, ORM mappers (Drizzle if ADR-0004 is superseded) all speak Zod first.
- **Bundle weight on the client.** Schemas may be imported in client search/filter code; tree-shaking matters.
- **Pinned major version.** Zod 4 ships with breaking changes from Zod 3; pin the major to prevent silent regressions.

## Considered Options

1. **Zod 4** (pinned major).
2. **Valibot** (modular, smaller bundle).
3. **ArkType** (TypeScript-syntax-shaped DSL, fast runtime).
4. **`@effect/schema`** (rich, integrates with Effect; heavier mental model).
5. **TypeScript types only** (no runtime validator).
6. **JSON Schema + Ajv** (industry standard, but not TS-type-native).

## Decision Outcome

**Chosen: Option 1 — Zod 4, pinned to `^4.x`.**

Zod is the de facto schema layer of the React/Next ecosystem in 2026. Velite (ADR-0002), `next-safe-action`, `tRPC` (if ever needed), `react-hook-form`, and Drizzle (if/when ADR-0004 is superseded) all integrate first-class with Zod and second-class — or not at all — with the alternatives. The cost of being on Zod is well-understood ergonomics quirks; the cost of being on anything else is sustained integration friction at every later unit.

We pin to Zod 4 explicitly. Zod 4 vs Zod 3 is a hard split with breaking changes; we want any future move (back to 3 or forward to 5) to require a superseding ADR, not a silent bump.

### Consequences

- **Positive:** Single file in `lib/schemas/` per entity; `z.infer<typeof Schema>` gives the TS type for free.
- **Positive:** Velite, OpenAPI codegen, and any future ORM/form library work out of the box.
- **Positive:** `discriminatedUnion` cleanly models rating-action variants if §8 ever splits "initial" vs "revision" vs "watchlist-add" into distinct shapes.
- **Negative:** Zod runtime is ~14 KB gz; non-trivial if shipped to clients. Mitigated by keeping schema imports server-only and shipping only the derived types to the browser.
- **Negative:** Zod error messages are verbose; the validate-content script (Unit 0.7) should format them for human curators, not dump raw Zod output.
- **Negative:** Major-version churn (3 → 4 happened in 2025) is real. Pin and treat upgrades as ADR-class decisions.

## Pros and Cons of the Options

### Option 1 — Zod 4

- Good — de facto standard; richest integration surface.
- Good — `z.infer` types + runtime validator from one declaration.
- Good — composes with Velite (ADR-0002) and Drizzle (future) natively.
- Bad — bundle weight if shipped client-side (mitigable).
- Bad — verbose error format (mitigable in the validate-content layer).

### Option 2 — Valibot

- Good — modular imports → much smaller client bundles (~3 KB gz for typical schemas).
- Good — API similar to Zod, low cost to learn.
- Bad — Velite, Drizzle, and the broader React/Next ecosystem are Zod-first; integrations are second-class or DIY.
- Bad — smaller community → fewer ready-made adapters (e.g., OpenAPI codegen).

### Option 3 — ArkType

- Good — TypeScript-shaped DSL is a delight to write.
- Good — fast runtime (claims ~100× Zod on some benchmarks).
- Bad — adoption curve still climbing in 2025–26; Velite + ecosystem support trails Zod.
- Bad — DSL is a learning surface for contributors who only know Zod.

### Option 4 — `@effect/schema`

- Good — extremely powerful; first-class composition; Effect ecosystem.
- Bad — adopting it pulls in (or wants to pull in) Effect, a much larger paradigm shift than we need for content validation.
- Bad — contributor onboarding cost is high.

### Option 5 — TypeScript types only

- Good — zero runtime cost.
- Bad — **defeats the purpose**. No runtime guarantee → content can be malformed and still build. §14.3 ("CI fails if any content file fails its schema") cannot be enforced.

### Option 6 — JSON Schema + Ajv

- Good — industry-standard schema format; portable; works with arbitrary tooling.
- Bad — not TS-type-native; we'd run JSON Schema → TS types via a generator, introducing a translation step every time a schema changes.
- Bad — Velite does not consume JSON Schema directly.

## Links

- MASTER_PROMPT.md §5.9, §7, §14.3.
- Related: ADR-0002 (Velite consumes these schemas), ADR-0005 (rating-action schema is `proposed`-immutable).
- Zod: https://zod.dev/
