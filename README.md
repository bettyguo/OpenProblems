# LLM OpenProblems

A rated, taxonomy-organized encyclopedia of open problems in LLM and AI research — leaderboards, historical tracks, and dynamic agency-style ratings (Difficulty, Saturation, Urgency, Value, Industry Call) for every problem in every subdomain.

This repository is governed by [`MASTER_PROMPT.md`](./MASTER_PROMPT.md), which serves as the project's constitution. Every implementation decision must trace back to a section there or to an Architecture Decision Record (ADR) in [`docs/adr/`](./docs/adr/) that explicitly amends it.

## Status

- **Phase 0 (Foundation):** complete locally; awaiting first push to GitHub for CI run and Vercel preview-deploy verification. See [§13 of the master prompt](./MASTER_PROMPT.md) and `docs/thinking/0.12-phase-0-acceptance.md` for the acceptance audit.
- **Phase 1 (Core MVP):** in progress. Unit 1.0 (license + brand finalization + accent shift to HKU-green hue 170°) landed; Unit 1.1 (Velite content pipeline) is next.

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

- **Code** (`app/`, `components/`, `lib/`, `scripts/`, configs) is licensed under **Apache-2.0** — see [`LICENSE`](./LICENSE).
- **Content** (`content/` — `taxonomy.yaml`, problems, papers, authors, institutions, methodology) is licensed under **CC-BY-4.0** — see [`content/LICENSE.md`](./content/LICENSE.md).

Q4 resolved in Unit 1.0 (2026-05-14); Apache-2.0 picked over MIT for the explicit patent grant, given the project intends a citable methodology paper.
