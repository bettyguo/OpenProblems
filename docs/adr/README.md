# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for the LLM OpenProblems repository, per `MASTER_PROMPT.md` §5 and §15.1.

## Conventions

- **Format:** [MADR 3.0](https://adr.github.io/madr/) short form (Context · Decision Drivers · Considered Options · Decision Outcome · Consequences · Pros and Cons of the Options).
- **Filename:** `NNNN-kebab-case-title.md` where `NNNN` is monotonically increasing, zero-padded to 4 digits, never reused.
- **Status lifecycle:** `proposed` → `accepted` (on the commit that lands the sign-off) → `deprecated` or `superseded by ADR-MMMM`. The `Status:` field in the header is the *only* part of an accepted ADR that may change after acceptance, and only to track lifecycle transitions (e.g., `accepted` → `superseded by ADR-NNNN`). The substantive sections (Context, Decision Drivers, Considered Options, Decision Outcome, Consequences, Pros and Cons) are **never edited after acceptance**; corrections and reversals are published as a new ADR that explicitly cites the one it supersedes. This mirrors the rating-action immutability rule (see ADR-0005).
- **Numbering authority:** the next ADR number is `max(existing) + 1`. There are no reserved slots.
- **Authoring:** every ADR lists ≥ 2 considered options with explicit Pros/Cons, even when the chosen option is "obvious." This is a hedge against future-us forgetting why obvious-at-the-time wasn't obvious-later.

## Index

| #    | Title                                                          | Status   |
|------|----------------------------------------------------------------|----------|
| 0001 | [Next.js 15 App Router as the application framework](./0001-nextjs-app-router.md) | accepted |
| 0002 | [Velite for the MDX content pipeline](./0002-velite-for-mdx.md) | accepted |
| 0003 | [Zod 4 as the schema source of truth](./0003-zod-as-source-of-truth.md) | accepted |
| 0004 | [File-first storage; no database through Phase 3](./0004-file-first-no-db.md) | accepted |
| 0005 | [Rating-action immutability](./0005-rating-action-immutability.md) | accepted |
| 0006 | [Saturation N/A encoding](./0006-saturation-na-encoding.md) | accepted |
| 0007 | [DomainMap rendering target & D3 import policy](./0007-domainmap-rendering.md) | accepted |
| 0008 | [LLM provider selection (Anthropic Claude) + cost-governance pact](./0008-llm-provider-anthropic.md) | accepted |

ADRs 0001–0005 were authored in Unit 0.1 and accepted on the same commit (2026-05-14) following human sign-off. ADR-0006 was authored in Unit 3.11 (closes OPEN_QUESTIONS Q18; accepted 2026-05-15). ADR-0007 was authored in Unit 4.11 (closes OPEN_QUESTIONS Q40; accepted 2026-05-15). ADR-0008 was authored in Unit 5.1 (closes OPEN_QUESTIONS Q41 + documents Q42 trade-off; accepted 2026-05-15). The next ADR will be numbered 0009.
