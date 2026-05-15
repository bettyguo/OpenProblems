# LLM OpenProblems

A rated, taxonomy-organized encyclopedia of open problems in LLM and AI research — leaderboards, historical tracks, and dynamic agency-style ratings (Difficulty, Saturation, Urgency, Value, Industry Call) for every problem in every subdomain.

This repository is governed by [`MASTER_PROMPT.md`](./MASTER_PROMPT.md), which serves as the project's constitution. Every implementation decision must trace back to a section there or to an Architecture Decision Record (ADR) in [`docs/adr/`](./docs/adr/) that explicitly amends it.

## Status

- **Phase 0 (Foundation):** complete locally; awaiting first push to GitHub for CI run and Vercel preview-deploy verification. See [§13 of the master prompt](./MASTER_PROMPT.md) and `docs/thinking/0.12-phase-0-acceptance.md` for the acceptance audit.
- **Next:** Phase 1 (Core MVP) — authoring the seed-content list from §16 against the stub IA Phase 0 froze.

### Phase 0 — what landed

- Next.js 15 + React 19 + TypeScript strict, Tailwind v4, shadcn/ui primitives, variable fonts.
- Design tokens (two-tone foundation + deep-cyan placeholder accent + 5 chart hues for rating dimensions).
- Zod 4 schemas for taxonomy, problem, benchmark, rating action, paper, entry, author, institution — 49 unit tests across 10 files.
- `content/taxonomy.yaml` populated from §4 (8 domains, ~80 subdomains).
- `scripts/validate-content.ts` walking `content/` against the schemas.
- ESLint 9 + Prettier 3 + Husky 9 + lint-staged + commitlint; pre-commit runs the ADR-0005 immutability check, then lint-staged, then Vitest.
- Vitest + Playwright + Storybook 10 + Lighthouse CI wired.
- App Router stubs for every route in §9 (23 routes).
- GitHub Actions: fast `verify` workflow (typecheck · lint · format · test · validate-content · build · ADR-0005 CI gate) and a slow `e2e + lighthouse` workflow (advisory in Phase 0).
- 5 accepted ADRs (Next.js · Velite · Zod · file-first · rating-action immutability).

## Reading order for new contributors

1. [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) — the constitution. Read end-to-end before touching anything.
2. [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md) — load-bearing decisions awaiting the human.
3. [`docs/adr/`](./docs/adr/) — accepted architecture decisions (0001–0005).
4. [`docs/thinking/`](./docs/thinking/) — per-unit THINK artifacts (§15.1 of the master prompt).
5. [`CHANGELOG.md`](./CHANGELOG.md).

## License

Pending — see Q4 in [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md). Until a license is committed, all rights are reserved by the author and no public redistribution is granted.
