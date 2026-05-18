# Contributing to LLM OpenProblems

> **Read [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) first.** It is the constitution of this project. Every implementation decision must trace back to a section there or to an Architecture Decision Record (ADR) that explicitly amends it.

Thanks for considering a contribution. This is a multi-month, PhD-led research project — depth & correctness >> speed. We are deliberately conservative about scope additions; the right way to start is almost always with an issue or a comment in [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md), not a PR.

## Three contribution surfaces

### 1. Editorial content (`content/`) — PRs welcome

The `content/` directory holds the editorial state — problems, papers, authors, institutions, methodology, and ratings. It is **file-first** ([ADR-0004](./docs/adr/0004-file-first-no-db.md)); the website is built from these files via Velite.

Adding a new paper, author, institution, or problem:

1. Follow the Zod schemas in [`lib/schemas/`](./lib/schemas/). Mismatches fail `pnpm validate-content` in CI.
2. Cross-references must resolve. `pnpm audit-content` is a 0-errors gate.
3. New problems should have a clear scope statement, at least one rating in each dimension with a written rationale, and at least three canonical papers.
4. New ratings always land as **net-new YAML files** — never in-place edits. Pre-commit hook [ADR-0005](./docs/adr/0005-rating-action-immutability.md) blocks `M` / `D` / `R` / `C` on `content/problems/*/ratings/*.yaml`.

If you're unsure, file an issue first with the proposed entry — a curator can sanity-check the schema and the rating direction before you spend time authoring.

### 2. Code — issue first, then PR

For anything touching an ADR-shaped surface, open an issue first:

- Auth, schemas, content-pipeline, rating-action immutability, markdown allow-list, data model, rating methodology, image processing, content moderation, email pipeline.

Smaller fixes are PR-direct:

- Typos, link corrections, accessibility fixes, dependency bumps (with the lockfile changes), test additions for existing behaviors, CSS / Tailwind class polish.

**Workflow rhythm** (per [`MASTER_PROMPT.md`](./MASTER_PROMPT.md) §15):

1. **THINK** — write a `docs/thinking/<unit>.md` artifact before touching code. State the goal, the alternatives considered, and the decision. This is the cardinal rule of the project — there is no "let's just try it".
2. **DESIGN** — if architectural, draft an ADR in [`docs/adr/`](./docs/adr/) using MADR convention. Either a brand-new ADR or an APPEND to an existing one.
3. **CODE** — implement minimally. No scope drift. TypeScript strict; Zod for boundaries; no client-side markdown rendering.
4. **ITERATE** — run smoke gates: `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm validate-content` · `pnpm audit-content` · `pnpm build`. All must be green before commit.
5. **COMMIT** — update [`CHANGELOG.md`](./CHANGELOG.md) under the open Phase / Unit section; commit with a Conventional Commits header ≤ 100 chars. Never `--no-verify`.

### 3. Discussion — `OPEN_QUESTIONS.md`

Load-bearing architectural questions go into [`OPEN_QUESTIONS.md`](./OPEN_QUESTIONS.md), not a forum thread. Open questions carry forward across phases with explicit `lean` / `resolved` tags so the conversation is auditable.

## Pull request checklist

Before opening a PR, please confirm:

- [ ] I have read [`MASTER_PROMPT.md`](./MASTER_PROMPT.md).
- [ ] My change is in scope for the current phase (see the _Roadmap_ in [`README.md`](./README.md#contributing)).
- [ ] If architectural, an issue exists discussing the approach.
- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm validate-content` / `pnpm audit-content` / `pnpm build` are all green locally.
- [ ] [`CHANGELOG.md`](./CHANGELOG.md) is updated under the open Phase / Unit section.
- [ ] If touching markdown rendering: I added an XSS-audit test for any new `dangerouslySetInnerHTML` surface.
- [ ] If touching the rating model: I read [ADR-0005](./docs/adr/0005-rating-action-immutability.md).
- [ ] I did not use `--no-verify` to bypass pre-commit hooks.

## Commit message conventions

Headers ≤ 100 chars (commitlint enforces). Format: `<type>(<scope>): <subject>`.

- `feat` — new feature (rare; phase-gated)
- `fix` — bug fix
- `docs` — documentation only (THINK artifacts, ADRs, README, CHANGELOG)
- `chore` — scaffolding, infrastructure, refactoring with no behavior change
- `test` — test-only changes
- `style` — formatting only (rare; lint-staged handles this automatically)
- `refactor` — refactoring (only inside a phase boundary)

Scope: typically `phase-N` for in-flight phase work; module name for fixes.

Examples:

```
chore(phase-45): unit 45.1 — DoiExtensionRegistry + APPEND-D-AC (first same-slot; 958/72)
docs(phase-45): unit 45.0 — Phase 45 prep (DOI sibling consumer; 40th Continue)
fix(markdown): trailing-colon DOI lookahead (closes #NN)
```

## Code style

- **Pre-commit hooks** (Husky) auto-format with Prettier and `prettier-plugin-tailwindcss`; do not revert the class re-ordering they produce.
- **TypeScript strict** with `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true`. Never `as any`. Never `// @ts-ignore` without a comment explaining why.
- **Zod 4** for all schema boundaries. Never re-validate at deeper layers — validate once at the edge.
- **Server-only markdown** — `unified` / `remark-*` / `rehype-*` must never ship to the client. The `lib/markdown/` helpers have `"server-only"` import guards.
- **No client-side rating mutation** — ratings are file-system state; modifications happen via curator workflow (`pnpm emit-challenge-action`).

## Security

For security issues — including XSS, sanitization-allow-list bypasses, EXIF-strip bypasses, auth-session weaknesses, and rate-limit gaps — please follow [`SECURITY.md`](./SECURITY.md) rather than opening a public issue.

## Code of conduct

Be kind, be precise, be willing to be wrong. See [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) for the long form.

## Parallel-curator workflow

Multiple Claude sessions may operate on this repo concurrently — particularly during phase work. If you find uncommitted edits in the working tree that aren't yours, they belong to the parallel session. Don't modify them. Run `git log --oneline -10 && git status --short` before starting any unit. See [`docs/CURATION_PROMPT.md`](./docs/CURATION_PROMPT.md) for the full protocol.

## Acknowledgements

This project would not exist without Papers with Code (RIP — Jul 2025), nlp-progress, OpenReview, arXiv, Hugging Face, and the broader open-science movement that established the conventions we extend.
