# ADR-0006 — Saturation N/A encoding

- **Status:** accepted
- **Date authored:** 2026-05-15
- **Date accepted:** 2026-05-15
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §8.2 specifies the Saturation dimension as a 0–100 numeric value computed against a defensible ceiling (human-expert or theoretical upper bound). It then carves out an explicit exception:

> "When no ceiling exists, mark **Saturation = N/A** and use a qualitative band (Low / Medium / High)."

The Unit 0.5 `RatingActionSchema.dimensions.saturation` (in [lib/schemas/rating-action.ts](../../lib/schemas/rating-action.ts)) is strictly numeric:

```ts
const SaturationDimensionSchema = z.object({
  value: z.number().min(0).max(100),
  confidence: Confidence,
  rationale: z.string().min(1),
});
```

There is no N/A escape hatch. [OPEN_QUESTIONS Q18](../../OPEN_QUESTIONS.md#q18-saturation-na-encoding) flagged this as a Phase-3 blocker — the SaturationCurve viz (Unit 3.6) and the MoversBoard saturation column (Unit 3.7) need a defined encoding to render N/A entries faithfully rather than silently skip them or coerce to 0.

This ADR picks the encoding.

## Decision Drivers

- **§15.6 — no fabrication.** A curator who genuinely has no ceiling must not be forced to pick a numeric value. Coercing to 0 (or any sentinel number) is fabrication.
- **§8.1 — methodology versioning.** A rating produced under v1.0 must never be silently re-graded by v1.1. The existing 20 v1.0 rating actions all use numeric saturation values and must remain valid under the new schema.
- **ADR-0005 — immutability.** Existing rating-action files are append-only. The new schema must accept all 20 already-committed v1.0 actions without modification.
- **Type safety.** Downstream consumers (Unit 3.2 `diffRatingAction`, Unit 3.6 `SaturationCurve`) need to know at compile time whether a saturation reading is numeric (chartable) or qualitative (display-only).
- **Q31 — Velite duplicate schema.** Whatever shape lands in `lib/schemas/rating-action.ts` must be mirror-able with Velite's bundled `s` factory in `velite.config.ts`. No Zod-4-only features.

## Considered Options

1. **Nullable value + optional `qualitative_band` + refinement** (chosen). Extends the existing schema additively: `value: number | null`, `qualitative_band?: "low" | "medium" | "high"`, with a `.refine()` ensuring at least one is set.
2. **Discriminated union by `mode`.** Replace `value: number` with `mode: "numeric" | "qualitative"` discriminator + per-variant fields. More type-safe but breaking change for v1.0 YAMLs.
3. **Sentinel numeric value** (e.g. `value: -1` means N/A). Fits the existing shape but conflicts with §15.6 (a -1 in the audit log reads as fabricated). Also breaks the `min(0).max(100)` constraint.
4. **Separate `SaturationNaDimensionSchema`** keyed off a top-level dimension-kind field. Doubles the dimension-handling code across the codebase.

## Decision Outcome

**Chosen: Option 1 — nullable `value` + optional `qualitative_band` + `.refine()` requiring at least one.**

New shape:

```ts
const SaturationDimensionSchema = z
  .object({
    value: z.number().min(0).max(100).nullable(),
    qualitative_band: z.enum(["low", "medium", "high"]).optional(),
    confidence: Confidence,
    rationale: z.string().min(1),
  })
  .refine(
    (data) => data.value !== null || data.qualitative_band !== undefined,
    { message: "saturation: either `value` (0–100) or `qualitative_band` must be set" },
  );
```

Velite mirror in `velite.config.ts` matches with `s.number().nullable()` (Velite bundles Zod 3 internally; `.nullable()` is Zod-3-stable per Q31).

### Backwards compatibility — the 20 v1.0 rating actions

Every committed v1.0 action sets `value: <number>` and does not set `qualitative_band`. Under the new schema:

- `value: <number>` satisfies the nullable type ✓
- `qualitative_band: undefined` is allowed by the `.optional()` ✓
- `.refine` passes because `value !== null` ✓

All 20 existing actions parse without modification. **`pnpm validate-content` from this commit forward returns 203 files green just as it did before.** ADR-0005 immutability holds.

### Forward compatibility — N/A actions

A future curator writing a v1.1+ rating action where no ceiling is defensible can write:

```yaml
saturation:
  value: null
  qualitative_band: medium
  confidence: 0.4
  rationale: |
    No theoretical or human-expert ceiling exists for X. The
    medium band reflects substantial-but-not-saturating progress
    relative to qualitatively comparable surfaces.
```

The numeric `value: null` is the explicit "no ceiling" marker; `qualitative_band` carries the editorial signal. Both `value` and `qualitative_band` can coexist in the same action (a curator who is confident in *both* a numeric and a band can record both for downstream redundancy).

### Methodology version bump

Per §8.1 ("a rating produced under v1.0 is never silently re-graded by v1.1"), the schema change *itself* does not silently re-grade v1.0 actions — they remain numeric and valid. But the **availability** of the N/A encoding is a methodology change, so curators writing actions that use the new encoding should set `methodology_version: "1.1.0"` (or whatever the next version increment lands as).

This ADR does **not** mass-bump the v1.0 actions in the repo; that would be a §8.1 violation. The bump happens organically as new actions are written.

### Consequences

- **Positive:** The §8.2 N/A escape hatch finally has a schema representation. Phase-3 vizes (Units 3.6, 3.7) can render N/A entries faithfully — either as a qualitative pill ("Low / Medium / High") or as a gap in the SaturationCurve with an annotation.
- **Positive:** Backwards compatible. All 20 existing v1.0 actions remain valid.
- **Positive:** Forward extension is straightforward — a future ADR could add `qualitative_band: "n/a"` or other variants without re-doing the discriminator.
- **Negative:** Slightly more complex type for downstream consumers. `value: number | null` and `qualitative_band?: "low" | "medium" | "high"` mean the SaturationCurve has to branch on the null case explicitly.
- **Negative:** The `.refine()` is a runtime check, not a static type guard. A consumer that reads `value` without checking for null will hit `null` at runtime in a v1.1 N/A action.

## Pros and Cons of the Options

### Option 1 — Nullable value + optional band + refine (chosen)

- Good — additive; v1.0 actions remain valid unchanged.
- Good — Velite-compatible (Zod-3 nullable + Zod-3 refine).
- Good — the refine error message is explicit.
- Bad — null-handling discipline required in every consumer.

### Option 2 — Discriminated union by `mode`

- Good — type-safe; each variant has its own field set.
- Bad — **breaking change**: all 20 v1.0 actions would need a migration (`mode: "numeric"` added), violating ADR-0005 immutability.
- Bad — Velite's `s` factory's discriminated-union support is uncertain in 0.3.x.

### Option 3 — Sentinel numeric value (e.g. -1)

- Good — no schema shape change at all.
- Bad — §15.6 violation in spirit; a -1 in the audit log is a fabricated number.
- Bad — breaks the `min(0).max(100)` constraint; either drop the constraint (lose validation) or special-case the sentinel.

### Option 4 — Separate schema keyed off a top-level field

- Good — explicit separation of numeric and qualitative cases.
- Bad — doubles the dimension-handling code in Phase-3 vizes.
- Bad — breaking change for v1.0 actions (need a `dimension_kind` discriminator added).

## Links

- MASTER_PROMPT.md §8.1, §8.2, §15.6.
- [OPEN_QUESTIONS Q18](../../OPEN_QUESTIONS.md#q18-saturation-na-encoding) — the open question this ADR closes.
- Related ADRs: [ADR-0003](./0003-zod-as-source-of-truth.md) (schemas as source of truth), [ADR-0005](./0005-rating-action-immutability.md) (rating-action immutability, no editing existing files), [OPEN_QUESTIONS Q31](../../OPEN_QUESTIONS.md#q31-velite--zod-4-incompatibility) (Velite-Zod duplication contract).
- Phase 3 prep: [docs/thinking/3.0-phase-3-prep.md](../thinking/3.0-phase-3-prep.md) — Unit 3.11 row.
