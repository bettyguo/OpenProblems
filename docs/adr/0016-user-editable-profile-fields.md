# ADR-0016 — User-editable profile field model (`displayName` + `bio`; plain-text)

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phase 14 ([ADR-0015](./0015-per-user-privacy-model.md)) shipped the
**read-only public profile route** at `/[locale]/u/[handle]` with a
GitHub-derived field partition (`name` + `image` + `githubLogin` +
`createdAt` + status-partitioned activity counts + curator-of-record
badge). ADR-0015 D-C explicitly deferred **user-editable fields** to
Phase 15+: *"Phase 14 ships READ-ONLY public profile … Phase 15+
writes can extend the contract incrementally with user-feedback data
from Phase 14's read-only delivery."*

Phase 15's keystone thread is **Q63 promotion** (user-editable
profile fields). Three architectural surfaces converge:

1. A **first user-controlled writes surface** for the `users` table.
   Phase 9 established `users` row creation via Auth.js v5
   `events.linkAccount` (auth-side metadata population); Phase 15
   adds the first **user-controlled** write path — distinct concern
   from auth-side population.
2. **Second ALTER migration** in project history. First was Phase-12
   `0003_rating_challenge_review` ([ADR-0014](./0014-curator-review-pipeline.md)
   D-E). Phase 15's `0004_user_profile_fields` adds 2 nullable text
   columns; same additive ALTER pattern.
3. **Public profile consumption update**. ADR-0015 D-A's fallback
   chain (`name → githubLogin → translated fallback`) extends to
   `displayName → name → githubLogin → translated fallback`. Affects
   `/u/{handle}` (Phase 14) + `/profile` (Phase 10) + AuthControl pill
   (Phase 9).

Plus the operational tail: editable fields require validation +
sanitization + length caps + UX patterns for save/error feedback. The
phase has to pick.

Decisions to pin in this ADR:

1. **Which fields are editable in Phase 15?** Display name only? Bio?
   Image override? Username?
2. **What is the validation + sanitization model?** Length caps?
   Markdown rendering? HTML escape? Content moderation?
3. **What is the edit surface route shape?** Extend existing
   `/profile`? Separate `/profile/edit`? Modal?
4. **Server-action or REST API?** Inheriting Phase 10/11/12 pattern
   vs the Phase 9/11/12 API-route pattern.
5. **What is the public consumption fallback chain?** How does
   `displayName` interact with GitHub-derived `name`?
6. **How does bio display format?** Plain text? Markdown? Link
   detection?
7. **What's deferred to Phase 16+?** Image override? Markdown? Content
   moderation?

[Q63 candidate](../thinking/14.0-phase-14-prep.md) (anticipated in
Phase 14) becomes [Q63 promoted](../../OPEN_QUESTIONS.md#q63-user-editable-profile-fields)
in Unit 15.7. This ADR closes Q63 by pinning each sub-question
concretely.

## Decision Drivers

- **§3.1** "ratings are revisable" framing extended to user identity
  — display preferences (custom name + bio) are a basic identity-
  platform expectation that closes the public-attribution chain
  Phase 14 established (read-only public profile + per-user
  challenges + SiteHeader link).
- **[ADR-0015](./0015-per-user-privacy-model.md) D-C** explicit
  Phase-15+ deferral — Phase 14 anticipated this surface as the
  natural follow-on; preserving Phase 14's scope-cap discipline.
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant — no NEW public-data category introduced. Editable
  `displayName` + `bio` are user-controlled overrides of fields that
  are ALREADY public (GitHub-derived `name` is public at github.com;
  bio is opt-in user-controlled text that doesn't expose anything the
  user didn't choose to expose).
- **[ADR-0012](./0012-auth-provider.md) D-E** `users.githubLogin`
  joining — Phase 15 must NOT touch `githubLogin` (URL key; immutable
  post-OAuth-link). New columns extend `users` without touching auth
  metadata.
- **[ADR-0013](./0013-db-choice.md) D-B** migration immutability —
  applied migrations never edited. Phase 15's `0004_user_profile_fields`
  is the second ALTER migration; same pattern as Phase 12's
  `0003_rating_challenge_review` (additive nullable column adds; no
  data migration; no FK changes; no `ON DELETE` clause).
- **[ADR-0014](./0014-curator-review-pipeline.md) D-E** ALTER
  migration discipline — additive nullable column adds; drizzle-kit
  generates clean SQL; snapshot + journal atomic; no manual
  inspection expected for nullable text columns (unlike Phase-12's FK
  edge case).
- **§5.7 trigger (a)** ALREADY FIRED in Unit 9.6; Phase 15 adds no
  new tables (ALTER is additive); no further trigger evaluation
  needed.
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB
  end-to-end through Phase 9–14; Phase 15 must not regress.
- **§15.5 reviewer-mode mindset** — "could a future user misuse this
  surface?" — applied to BOTH the edit affordance (XSS via bio text;
  display-name impersonation; bio length abuse) and the public
  consumption (broken fallback chain; stale `name` value).
- **Phase-9 Class B item 12** (middleware-based auth-route protection)
  threshold — lifts at 3+ protected page routes. Phase 15 doesn't
  add a new protected route (the edit form is INLINE on the existing
  `/profile`); threshold stays at 2 (profile + curator dashboard).
- **Phase 15 scope cap** (Unit 15.0 D-1 + scope discipline) — 9
  units; `displayName` + `bio` ONLY; image override + markdown +
  content moderation deferred to Phase 16+ as Q66 / Q67 / Q68
  candidates.
- **§14.4** CHANGELOG + ADR contract: pin the choice with Pros/Cons
  before code lands.

## Considered Options

### Option 1: `displayName` + `bio` + plain-text + server-action + `/profile` extension (chosen)

The recommendation in [Unit 15.0 D-1 through D-10](../thinking/15.0-phase-15-prep.md).
Adds two nullable text columns (`users.displayName` 80 chars max +
`users.bio` 280 chars max); plain-text rendering with `whitespace-pre-wrap`
(no markdown / no link detection); server-action driven inline edit
form on existing `/[locale]/profile` route; public consumption
fallback chain extended to `displayName → name → githubLogin →
translated fallback`; image override deferred to Phase 16+ (needs
storage ADR-0017 candidate).

- **Pros:**
  - Closes [Q63](../../OPEN_QUESTIONS.md#q63-user-editable-profile-fields)
    with a concrete architectural pin (anticipated promotion: `open`
    → `resolved` in Unit 15.7).
  - **No new public-data category** introduced (per ADR-0015 D-A
    invariant preserved). Editable fields are user-controlled
    overrides of fields already public elsewhere.
  - **Honors ADR-0015 D-C deferral path** verbatim. Phase 15 picks up
    the surface ADR-0015 anticipated.
  - **Scope cap discipline**: 80 / 280 char limits match
    GitHub/Twitter/Bluesky standards; conservative; Phase 16+ may
    expand based on usage feedback.
  - **Plain text rendering minimizes XSS surface**. React's default
    escape handles literal text safely; `whitespace-pre-wrap` for
    newline preservation. NO markdown rendering = NO new dependency
    (remark/rehype etc.) = NO new sanitization library = NO new
    surface for abuse.
  - **Server-action mirrors Phase 10/11/12 pattern** verbatim
    (sign-out form; submit-challenge form; withdraw button; curator
    review buttons). CSRF + cookie handling for free; no REST
    surface.
  - **Inline edit on `/profile` preserves "two surfaces per identity"
    pattern** (ADR-0015 D-F: `/profile` = edit; `/u/{login}` =
    public). Doesn't split editing from surrounding context (watchlist
    + challenges).
  - **Second ALTER migration** validates Phase-12 D-E pattern at
    second exercise. Discipline crystallized.
  - **Reversible**: image override + markdown + content moderation
    promotes Phase 16+ without schema rework (Q66 / Q67 / Q68
    candidates incrementally).
  - **Phase 15 scope stays tight** (9 units; matches Phase 12 + Phase
    14's 9-unit shape).

- **Cons:**
  - **No image override Phase 15** means users wanting custom avatars
    must wait. GitHub avatar is the only Phase-15 surface; users may
    push back. Mitigation: Q67 promotion in Phase 16+ alongside
    storage ADR-0017 candidate.
  - **No markdown in bio Phase 15** limits expressiveness for power
    users (researchers may want code blocks, citations, links).
    Mitigation: Q66 promotion in Phase 16+ if signal demands; plain
    text is the conservative default.
  - **Display-name uniqueness NOT enforced**. Multiple users can
    pick the same `displayName`. Phase 15 lean: rely on `githubLogin`
    as the unique identity key (URL canonical); `displayName` is
    display-only. Phase 16+ may add uniqueness check if signal
    demands.
  - **No content moderation Phase 15**. Abusive `bio` content (slurs,
    spam) goes through without filter. Mitigation: Q68 candidate
    flagged; Phase 16+ if abuse signals accumulate.
  - **No edit history / audit log Phase 15**. Users edit displayName
    + bio; previous values not retained. Mirrors GitHub's pattern
    (display name + bio editable freely; no edit history surface).
    Phase 16+ may add audit log if curator demands editorial
    accountability on identity changes.

### Option 2: Full per-user-editable Phase 15 (incl. image override + markdown)

Phase 15 ships full surface from day one: displayName + bio + image
override (Vercel Blob upload pipeline) + markdown rendering (remark +
rehype + sanitize plugin) + edit history audit log.

- **Pros:**
  - One-shot delivery of "complete editable profile" thread.
  - Power-user features available immediately.

- **Cons:**
  - Triples Phase 15 scope. Image upload pipeline requires storage
    ADR (Vercel Blob vs S3 vs URL allowlist) + CORS preload + EXIF
    stripping + cropping UI + content moderation on images.
  - Markdown rendering requires remark/rehype pipeline + sanitization
    library + XSS audit + dependency review.
  - Audit log requires new `userProfileEdits` table + migration +
    history rendering UI.
  - Phase 15 unit count blows out to 15+; pushes scope beyond Phase
    9/12/14's 9-10-unit envelope.
  - **Phase-16+ scope is the natural home** for image + markdown +
    audit. Each is a distinct architectural concern. Phase 15 ships
    the foundation (plain text writes); Phase 16+ extends.

### Option 3: Markdown bio in Phase 15 (without image override)

Same as Option 1 but adds markdown rendering for bio via remark +
rehype + sanitize plugin.

- **Pros:**
  - Power-user bio expressiveness from day one.
  - Sets pattern for markdown rendering in other surfaces (rationale
    text? rating-action descriptions?).

- **Cons:**
  - New dependency: `remark@15+` + `rehype@13+` + `rehype-sanitize@7+`
    (or similar). ~120 kB transitive deps. Stack contamination.
  - Sanitization audit surface: rehype-sanitize defaults are
    conservative but project must verify allowed tags + attributes;
    add additional ADR for the safe-markdown subset.
  - XSS audit: a bug in the sanitization pipeline = stored XSS on
    every public profile.
  - Phase 15 ships read-only-side first (`whitespace-pre-wrap`
    plain text); Phase 16+ may upgrade to markdown if signal shows.
  - Conservative default beats premature richness.

### Option 4: Separate `/profile/edit` route

Edit surface lives at a new route `/[locale]/profile/edit`; `/profile`
stays read-mode.

- **Pros:**
  - Clear edit-vs-read mode separation in URL.
  - Easier to add per-section edit affordances later.

- **Cons:**
  - Splits editing affordance from surrounding context (watchlist +
    challenges) — worse UX.
  - Adds a 3rd protected page route (lifts Phase-9 Class B item 12
    middleware threshold; that's a follow-on concern, not a Phase
    15 keystone).
  - Phase-10 Unit 10.2 D-? established "single profile route holds
    signed-in own state"; Option 4 violates that convention without
    clear benefit.
  - ADR-0015 D-F's "two surfaces per identity" pattern (`/profile`
    edit; `/u/{login}` public) is sufficient; a third surface is
    over-engineering.

## Decision Outcome

**Chosen: Option 1 — `displayName` + `bio` + plain-text + server-action + `/profile` extension.**

The decision pins seven concrete contracts:

### D-A. Editable field set

| Field | Phase 15 editable? | Max chars | Validation | Notes |
|---|---|---|---|---|
| `users.displayName` | **YES** | 80 | trim + length cap; React's default escape handles XSS | Falls back to `users.name` (GitHub-derived) on null. |
| `users.bio` | **YES** | 280 | trim + length cap; React's default escape | Plain text; newlines preserved via `whitespace-pre-wrap`. NO markdown / NO link detection. |
| `users.image` (override) | **NO** (Phase 16+) | — | — | Needs storage ADR (Vercel Blob / S3 / URL allowlist). **ADR-0017 candidate**. |
| `users.githubLogin` | **NO** (immutable post-OAuth-link) | — | — | GitHub-canonical per ADR-0012 D-E. |
| `users.email` | **NO** (never surfaces) | — | — | Per ADR-0015 D-A. |
| `users.name` (GitHub-derived) | **NO** (read-only; `displayName` overrides on render) | — | — | Auth.js v5 populates from OAuth profile; not user-editable. |

**Length-cap rationale**:
- 80 chars matches GitHub's display-name limit + Bluesky's
  display-name limit.
- 280 chars matches Twitter/X/Bluesky's bio limit + offers enough
  space for a research-bio sentence ("I work on alignment +
  interpretability; PhD at Mila").
- Both are conservative; Phase 16+ may expand based on usage feedback.

### D-B. Validation + sanitization model

1. **Length cap** enforced client-side (textarea `maxLength`) AND
   server-side (return 400 if exceeded). Mirrors Phase-11 rationale
   field validation pattern.
2. **Trim whitespace** on save (no leading / trailing whitespace
   stored). Empty string after trim = clear the field (store NULL).
3. **No HTML / no markdown**. Plain text only. Renders via
   `whitespace-pre-wrap` for newline preservation. React's default
   escape handles XSS; no sanitization library needed.
4. **No regex content filter**. Phase 15 trusts users; Phase 16+
   may add explicit content moderation if abuse signals appear
   (**Q68 candidate**).
5. **No uniqueness check on `displayName`**. Multiple users may pick
   the same display name; `githubLogin` remains the unique URL key.

**EXTENDED Phase 35 Unit 35.2** — Q68 content moderation candidate **RESOLVED architecturally as framework-only** per [ADR-0024](./0024-content-moderation.md). `lib/users/index.ts` `updateProfile()` now calls `getModerator().moderateText(bio, { surface: "bio", userIdOrEmail })` between bio validation and the DB UPDATE; only fires when `set.bio` is non-empty; returns the moderator's first reason string on `severity: "block"`. **`NoopModerator` default ships Phase 35**: zero API cost / latency / false positives — pass-through behavior preserves Phase 15-34 trust-users posture verbatim. Concrete provider commitment (OpenAI moderation / Perspective / regex-wordlist / custom) deferred Phase 36+ per ADR-0024 D-G operational-API-gate. `displayName` is NOT moderated per ADR-0024 D-12 lean (short-form field; future provider can extend). **First APPEND on ADR-0016 D-B** at 20-phase age (Phase 15 → Phase 35) — the demand-signal-first concern that previously deferred Q68 12+ phases is dissolved by the no-op default reducing pre-position cost to zero. **Seventh APPEND-pattern ADR D-clause cluster** in project history.

**Implementation**:
- `lib/users/index.ts` exports `validateDisplayName(s)` +
  `validateBio(s)` returning `null` on valid OR a human-readable
  error string on invalid. Mirrors Phase-11
  `validateProposedValue` + `validateRationale` shape.
- `lib/users/index.ts` exports `updateProfile(userId, fields)`
  performing the validated UPDATE. Empty strings → NULL; valid
  trimmed strings → stored as-is.

### D-C. Edit surface route shape

**Decision**: extend the existing `/[locale]/profile` route with an
**inline edit form** below the existing signed-in own surface. NOT a
separate `/profile/edit` route.

- `/profile` stays the **EDIT-mode surface** per ADR-0015 D-F.
- `/u/{login}` stays the **PUBLIC canonical** per ADR-0015 D-F.
- Inline edit form placement: between the existing header card and
  the watchlist section. Mirrors the Phase-10 layout that puts the
  user-state actions adjacent to the user-state display.
- **No new protected route**; Phase-9 Class B item 12 middleware
  threshold (3+ protected page routes) stays uncrossed (still 2:
  profile + curator).

### D-D. Server-action vs API route

**Decision**: **server actions** for profile edit. NOT a
`/api/v1/profile/edit` REST endpoint.

- Server actions are the Phase-10 + 11 + 12 precedent for signed-in
  own-state mutations (sign-out form; submit challenge inline form;
  withdraw challenge button; curator review buttons).
- REST endpoint is the precedent for **external surfaces** that
  third parties might consume (watchlist API; rating-challenges API;
  curator review API). Profile edit is an internal UX-only surface;
  no third-party demand.
- Server actions get CSRF protection + cookie handling for free.
- Mirrors Phase-10 Unit 10.2's sign-out form pattern verbatim.

**Action shape** (Unit 15.4):

```tsx
const updateProfileAction = async (formData: FormData) => {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
  const displayName = String(formData.get("displayName") ?? "");
  const bio = String(formData.get("bio") ?? "");
  // validate + update; revalidatePath; return error on failure
};
```

### D-E. Public consumption fallback chain

Phase 14's display-name fallback chain (`name → githubLogin →
translated fallback`) extends to:

```
displayName → name → githubLogin → translated fallback
```

Affected surfaces:
- `/[locale]/u/[handle]/page.tsx` (Phase 14 public shell).
- `/[locale]/profile/page.tsx` (Phase 10 signed-in own).
- `components/auth-control/index.tsx` (signed-in pill; currently
  `name ?? email ?? fallback` updates to `displayName ?? name ??
  email ?? fallback`).
- SiteHeader "Your profile" link (Unit 14.5) — **unchanged**;
  displays `@login` (URL key), NOT displayName.

Bio display: NEW section on `/u/{handle}` rendered ONLY when bio is
non-null. Plain text via `whitespace-pre-wrap`. Placement between
header card (avatar + display name + @login + member-since +
curator-of-record badge) and activity section.

### D-F. Bio display formatting

- Plain text rendering with `whitespace-pre-wrap` for newline
  preservation.
- 280-char max (server-side enforced; client-side textarea also
  limits).
- **NO markdown** / NO HTML / NO link-detection Phase 15. **Q66
  candidate** flagged for Phase 16+ if usage signal demands.
- Bio placement on `/u/{handle}`: between header card and activity
  section. Rendered as plain `<p>` with `whitespace-pre-wrap` class.
  Section omitted entirely when bio is null (no placeholder).
- Bio placement on `/profile`: rendered inline below the edit form
  (as a "current value" preview) when bio is non-null.

### D-G. Image override Phase-16+ deferral

Image override (custom avatar OR avatar URL override) DEFERRED to
Phase 16+. Rationale:

- **Storage ADR needed** (currently no project storage layer beyond
  Velite-built content + Turso DB). **ADR-0017 candidate** for
  Phase 16+:
  - Vercel Blob (~$0.02/GB; first-party; tight integration).
  - S3 / R2 (cheaper at scale; third-party).
  - External URL allowlist (no storage; CORS preload + URL pattern
    matching).
- **Image-upload pipeline complexity**: file size limits + cropping
  UI + EXIF stripping + content moderation. Each is its own concern.
- **Phase-15 scope discipline**: ship `displayName` + `bio`
  text-only; observe usage; promote image override Phase 16+ if
  signal demands.

## Consequences

### Positive

- **Closes [Q63](../../OPEN_QUESTIONS.md#q63-user-editable-profile-fields)**
  with a concrete architectural pin (anticipated promotion: `open` →
  `resolved` in Unit 15.7).
- **Closes the Phase 14 → Phase 15 architectural inheritance** —
  Phase 14 shipped read-only public profile; Phase 15 makes it
  write-able. Natural progression.
- **No new public-data category** introduced (per ADR-0015 D-A
  invariant preserved). Editable fields are user-controlled overrides
  of fields already public elsewhere.
- **Second ALTER migration validates Phase-12 D-E pattern** at
  second exercise. ALTER discipline crystallized for Phase 16+
  inheritance.
- **First user-controlled writes surface for `users` table**
  introduced. Subsequent identity-edit surfaces (image override
  Phase 16+; opt-out toggle Q64 Phase 16+; markdown bio Q66 Phase
  16+) inherit the validation + server-action + inline-edit pattern.
- **Server-action mirrors Phase 10/11/12 precedent** — no new
  architectural surface added; pattern continues.
- **Plain text rendering minimizes XSS surface** — no new dependency;
  no sanitization library; React's default escape handles everything.
- **§5.7 trigger** unchanged (no new tables; ALTER additive).
- **First Load JS** unchanged (entirely server-rendered edit form;
  no client islands).
- **Reversibility**: image override + markdown + content moderation
  + edit history each promote Phase 16+ incrementally without
  Phase-15 schema rework.
- **Scope cap honored**: Phase 15 ships ~9 units; Q66 / Q67 / Q68
  flagged for Phase 16+.

### Negative

- **No image override Phase 15** — users wanting custom avatars wait
  for Phase 16+ + storage ADR. Mitigation: Q67 candidate flagged.
- **No markdown in bio Phase 15** — power-user expressiveness limited
  to plain text + newlines. Mitigation: Q66 candidate flagged.
- **Display-name uniqueness NOT enforced** — multiple users can pick
  identical display names. `githubLogin` remains unique URL key.
  Mitigation: Phase 16+ uniqueness check if signal demands.
- **No content moderation Phase 15** — abusive bio text goes through
  unfiltered. Mitigation: Q68 candidate flagged.
- **No edit history / audit log Phase 15** — users edit freely;
  previous values not retained. Mirrors GitHub's pattern. Phase 16+
  may add audit log if curator demands editorial accountability.
- **One new ADR claims the ADR-0016 slot** — multi-provider OAuth
  expansion (Phase-9 Class B item 8; previously ADR-0016 candidate)
  becomes ADR-0017+ if Phase 16+ picks it. Acceptable cost; ADR-0016
  vs ADR-0017 enumeration ordering is not load-bearing.

## Cross-references

- **§3.1** "ratings are revisable" framing extended to user identity
  (Phase 14's read-only public profile + Phase 15's user-controlled
  write surface jointly close the per-user attribution chain).
- **§14.4** CHANGELOG + ADR contract.
- **§15.5** reviewer-mode mindset (applied throughout deliberation;
  driver for plain-text-no-markdown decision + XSS surface
  minimization).
- **[ADR-0004](./0004-file-first-no-db.md)** file-first / no-DB-for-
  content (preserved — Phase 15 ships USER-STATE writes only; content
  stays file-first).
- **[ADR-0011](./0011-i18n-strategy.md)** i18n strategy (Phase 15's
  new `messages.profile_edit.*` namespace follows the established
  sibling-file convention).
- **[ADR-0012](./0012-auth-provider.md)** auth provider (D-E
  `users.githubLogin` joining preserved; this ADR's D-A excludes
  `githubLogin` from editable fields — URL key immutable).
- **[ADR-0013](./0013-db-choice.md)** DB choice (D-B migration
  immutability + D-F USER-STATE only — both respected; Phase 15's
  ALTER is additive USER-STATE).
- **[ADR-0014](./0014-curator-review-pipeline.md)** D-E ALTER
  migration discipline — this ADR's D-A schema change inherits the
  pattern; second ALTER migration in project history validates the
  discipline at second exercise.
- **[ADR-0015](./0015-per-user-privacy-model.md)** D-C user-editable
  Phase-15+ deferral — this ADR closes that deferral; D-A field
  partition extended (displayName + bio added to public-visible
  list); D-F SiteHeader integration unchanged (uses URL key).
- **[OPEN_QUESTIONS Q63](../../OPEN_QUESTIONS.md#q63-user-editable-profile-fields)**
  (promoted in Unit 15.7 alongside this ADR's acceptance).
- **[Unit 15.0 prep](../thinking/15.0-phase-15-prep.md)** D-1 through
  D-11 (the Phase-15 thread recommendation + decision ledger this ADR
  pins).
- **Phase-9 Class B item 12** middleware-based auth-route protection
  (unaffected — inline edit form on existing `/profile` doesn't add
  a new protected route; threshold stays at 2).
- **Phase-16+ Q66 candidate** (markdown rendering in bio; D-F
  deferral).
- **Phase-16+ Q67 candidate** (image override / avatar upload; D-G
  deferral; **ADR-0017 candidate** for storage choice).
- **Phase-16+ Q68 candidate** (content moderation on bio text; D-B
  deferral).
