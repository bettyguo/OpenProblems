<!-- See MASTER_PROMPT.md §14.4 for the rationale behind this checklist. -->

## Summary

<!-- One or two sentences. -->

## Phase / Unit

<!-- e.g., "Phase 0, Unit 0.x" or "Phase 1 problem authoring" -->

## Checklist

- [ ] Schemas validated (`pnpm validate-content` passes)
- [ ] New ADR if this PR is architectural (link to `docs/adr/NNNN-...md`)
- [ ] `CHANGELOG.md` updated under `[Unreleased]` for the affected unit
- [ ] Tests added or updated (`pnpm test` passes; ≥ 3 cases per new schema; e2e for new routes)
- [ ] Lighthouse delta noted (perf / a11y / SEO / BP; new viz components must lazy-load with `next/dynamic` if > 30 KB gz)
- [ ] `OPEN_QUESTIONS.md` updated for any new ambiguity surfaced
- [ ] For rating-action changes: new file under `content/problems/<slug>/ratings/<date>-<slug>.yaml` (never edit an existing one — ADR-0005)

## Lighthouse delta

<!-- Routes touched + before/after scores. Leave blank if no UI changes. -->

## Notes for the reviewer

<!-- Anything subtle: a non-obvious decision, a trade-off, a follow-up. -->
