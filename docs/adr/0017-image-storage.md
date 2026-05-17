# ADR-0017 — Image storage architecture for user profile pictures (Vercel Blob + file-upload pipeline)

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phase 15 ([ADR-0016](./0016-user-editable-profile-fields.md)) shipped
the **first user-controlled writes surface for the `users` table**
with two editable text fields (`displayName` 80c + `bio` 280c).
ADR-0016 D-G explicitly deferred **image override / avatar upload**
to Phase 16+: *"Image override (custom avatar OR avatar URL
override) DEFERRED to Phase 16+. Storage ADR needed (currently no
project storage layer beyond Velite-built content + Turso DB).
ADR-0017 candidate."*

Phase 16's keystone thread is **Q67 promotion** (image override /
avatar upload). Four architectural surfaces converge:

1. **First binary storage layer in project history**. The project's
   existing persistence layers are (a) file-system content via
   Velite (`content/**/*.{yaml,mdx,json}` — ADR-0002 + ADR-0004) and
   (b) Turso/SQLite DB for user-state per ADR-0013. Phase 16 adds a
   third: **binary blob storage** for user-uploaded images.
   Establishes the `lib/storage/` module pattern for any Phase 17+
   binary-asset inheritance (paper figures? curator-review
   attachments?).
2. **Third ALTER migration in project history**. First was Phase-12
   `0003_rating_challenge_review` ([ADR-0014](./0014-curator-review-pipeline.md)
   D-E). Second was Phase-15 `0004_user_profile_fields` ([ADR-0016](./0016-user-editable-profile-fields.md)).
   Phase 16's `0005_user_image_override` adds 1 nullable text column;
   same additive ALTER pattern. **ADR-0014 D-E discipline
   crystallized at THIRD exercise** — pattern fully validated.
3. **Public profile consumption update**. ADR-0016 D-E's fallback
   chain (`displayName → name → githubLogin → fallback`) gains a
   sibling image chain `imageOverride → image → fallback initials
   placeholder`. Affects `/u/{handle}` (Phase 14) + `/profile`
   (Phase 10) + `getPublicProfileByHandle` (Phase 14) +
   `getUserMetadataById` (Phase 15).
4. **First new env var since Phase 12**. The chosen storage path
   determines the operational gating shape — Vercel Blob requires
   `BLOB_READ_WRITE_TOKEN`; URL allowlist requires none; S3/R2
   requires four+ vars. Surfaces a new operational gate alongside
   Q54 (GitHub OAuth) + Q55 (Turso DB).

Plus the operational tail: image upload requires MIME validation,
size caps, EXIF handling decisions, cropping affordance, content
moderation decisions, abandoned-blob cleanup. The phase has to
pick.

Decisions to pin in this ADR:

1. **Which storage backend?** Vercel Blob (first-party)? S3/R2
   (third-party)? External URL allowlist (no storage)? Hybrid?
2. **What upload pipeline does Phase 16 ship?** MIME validation?
   Size caps? EXIF stripping? Cropping UI? Content moderation?
3. **What is the edit surface route shape?** Extend the existing
   Phase-15 `/profile` form? Separate `/profile/edit/avatar`?
4. **Server-action shape?** Extend Phase-15's `updateProfileAction`?
   Sibling action `updateProfileImageAction`? REST API?
5. **What is the public consumption fallback chain?** How does
   `imageOverride` interact with GitHub-derived `image`?
6. **What is the validation + sanitization model?** Allowed MIME
   types? Size limit? URL format check?
7. **What new operational gate surfaces?** Env-var provisioning;
   parallel to Q54 / Q55.
8. **What's deferred to Phase 17+?** EXIF? Moderation? Cropping?
   Transcoding? Multiple avatars? Cleanup script?

[Q67 candidate](../thinking/15.6-phase-15-hygiene.md) (anticipated
in Phase 15) becomes [Q67 promoted](../../OPEN_QUESTIONS.md#q67-image-override-avatar-upload)
in Unit 16.7. This ADR closes Q67 by pinning each sub-question
concretely.

## Decision Drivers

- **§3.1** "ratings are revisable" framing extended to user
  identity — image preference is a basic identity-platform
  expectation that closes the identity-surface progression Phase 14
  + Phase 15 established (Phase 14: read-only public profile;
  Phase 15: editable text fields; Phase 16: editable image).
- **[ADR-0016](./0016-user-editable-profile-fields.md) D-G** explicit
  Phase-16+ deferral — Phase 15 anticipated this surface as the
  natural follow-on; preserving Phase 15's scope-cap discipline.
- **[ADR-0016](./0016-user-editable-profile-fields.md) D-A**
  user-controlled override pattern — `displayName` overrides
  `name` (GitHub-derived); same architectural shape applies:
  `imageOverride` (user-controlled) overrides `image`
  (GitHub-derived). New column; not a replacement column.
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant — no NEW public-data category introduced. Avatar
  imagery is ALREADY public at github.com (the OAuth-provided
  `image` field is public-by-default); user-controlled override
  doesn't expose anything the user didn't choose to expose.
- **[ADR-0008](./0008-llm-provider-anthropic.md) §3 cost-governance
  pact** — applied by analogy to storage cost. Vercel Blob's
  ~$0.02/GB stored at MVP scale (100 users × 200 KB = 20 MB =
  ~$0.0004/month) is negligible; S3/R2's slightly-cheaper rate
  doesn't justify the operational complexity at MVP scale.
- **[ADR-0012](./0012-auth-provider.md) D-E** `users.githubLogin`
  joining — Phase 16 must NOT touch `githubLogin` (URL key;
  immutable post-OAuth-link). New column extends `users` without
  touching auth metadata.
- **[ADR-0013](./0013-db-choice.md) D-B** migration immutability
  — applied migrations never edited. Phase 16's
  `0005_user_image_override` is the third ALTER migration; same
  additive nullable column pattern Phase 12 + Phase 15
  established.
- **[ADR-0013](./0013-db-choice.md) D-F** USER-STATE-only DB —
  preserved. Image storage lives in Vercel Blob (a separate
  storage primitive), NOT in the DB. The DB stores only the URL
  pointer.
- **[ADR-0014](./0014-curator-review-pipeline.md) D-E** ALTER
  migration discipline — additive nullable column adds; drizzle-kit
  generates clean SQL; no manual inspection expected for nullable
  text columns (mirrors Phase-15 Unit 15.2's clean emission).
- **§5.7 trigger (a)** ALREADY FIRED in Unit 9.6; Phase 16 adds no
  new tables (ALTER is additive); no further trigger evaluation
  needed.
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB
  end-to-end through Phase 9–15; Phase 16 must not regress.
  Image upload form needs ~50 lines of client-side JS for
  `URL.createObjectURL` preview; isolated to a small `"use
  client"` boundary; minimal bundle impact.
- **§15.5 reviewer-mode mindset** — "could a future user misuse
  this surface?" applied to BOTH the upload affordance (SVG XSS
  surface; large-file DoS; abandoned-blob proliferation; offensive
  imagery) and the public consumption (broken fallback chain;
  stale URL).
- **Phase-9 Class B item 12** (middleware-based auth-route
  protection) threshold — Phase 16 doesn't add a new protected
  route (image upload is INLINE on existing `/profile`); threshold
  stays at 2 (profile + curator dashboard).
- **Phase 16 scope cap** (Unit 16.0 D-1 + scope discipline) — 9
  units; `imageOverride` URL column ONLY; EXIF stripping +
  cropping UI + content moderation + transcoding + multiple
  avatars + cleanup script all deferred to Phase 17+ as Q70 / Q68
  expansion / Class B items.
- **§14.4** CHANGELOG + ADR contract: pin the choice with
  Pros/Cons before code lands.

## Considered Options

### Option 1: Vercel Blob with file-upload pipeline (chosen)

The recommendation in [Unit 16.0 D-1 through D-10](../thinking/16.0-phase-16-prep.md).
Adds one nullable text column (`users.imageOverride` 512 chars
max storing the Vercel Blob public URL); new `lib/storage/` module
wrapping `@vercel/blob` SDK with `putAvatar` + `delAvatar`
helpers; server-action-driven inline image upload section on the
existing `/[locale]/profile` Phase-15 edit form; public
consumption fallback chain extended to `imageOverride → image →
fallback initials placeholder`; deferral matrix for S3/R2 + URL
allowlist documented.

- **Pros:**
  - Closes [Q67](../../OPEN_QUESTIONS.md#q67-image-override-avatar-upload)
    with a concrete architectural pin (anticipated promotion:
    `open` → `resolved` in Unit 16.7).
  - **No new public-data category** introduced (per ADR-0015 D-A
    invariant preserved). User-controlled image override of a
    field already public at github.com.
  - **Honors ADR-0016 D-G deferral path** verbatim. Phase 16
    picks up the surface ADR-0016 anticipated.
  - **First-party Vercel integration**. Project is already on
    Vercel; Blob is tightly integrated; same token works locally
    via `vercel link` + `vercel env pull` and in production.
  - **No CORS / IAM setup**. Token-gated server-side ops; simpler
    than S3's bucket/IAM-policy ceremony.
  - **Public URLs immediately CDN-served**. Vercel Blob URLs are
    fronted by Vercel's CDN; no extra cache layer needed.
  - **Storage cost negligible at MVP scale**. ~$0.02/GB stored +
    ~$0.36/M reads; 100 users × 200 KB avatars = 20 MB =
    ~$0.0004/month. Effectively free.
  - **Natural user flow**: file picker → upload → done. Matches
    user expectation from social platforms (Twitter / Bluesky /
    GitHub itself).
  - **Cleanup-on-replace is a single SDK call**. `del(oldUrl)`
    inside try/finally before writing new URL.
  - **Mirrors Phase-15 architectural pattern**. New column
    `imageOverride` parallels Phase-15's `displayName` (both are
    user-controlled overrides of GitHub-derived fields).
  - **Inline `/profile` extension continues Phase-15 D-C pattern**.
    No new route; no lifted middleware threshold; single edit
    surface for all identity attributes.
  - **Server-action mirrors Phase 10/11/12/15 precedent**. CSRF
    + cookie handling for free.
  - **Third ALTER migration validates ADR-0014 D-E pattern** at
    third exercise. Discipline crystallized.
  - **Reversible**: EXIF stripping + content moderation + cropping
    UI + transcoding promote Phase 17+ without schema rework
    (Q70 / Q68 expansion / Class B items incrementally).
  - **Phase 16 scope stays tight** (9 units; matches Phase 12 +
    Phase 14 + Phase 15's 9-unit shape).

- **Cons:**
  - **Vendor lock-in.** Migrating to S3 / R2 means rewriting
    `lib/storage/` (small surface; ~100 lines). Mitigation:
    keep `lib/storage/index.ts` deliberately thin (just `put` +
    `del` + `getUrlForKey`) so the swap is straightforward.
  - **New env var operational gate** (Q69 candidate). Sign-in /
    sign-up + watchlist + challenge + profile edit surfaces all
    work without it (image upload silently degrades to "GitHub
    avatar only" if token missing); operational unblock parallel
    to Q54 / Q55.
  - **Abandoned-blob concern**. Delete-on-replace can fail
    partway (e.g., DB write succeeds but blob delete fails);
    orphan blobs accumulate. Phase-16 mitigation: try/finally
    around delete; orphan-blob cleanup script flagged as
    Class B follow-on (Unit 16.6).
  - **New dependency** (`@vercel/blob@1.x`, ~30 kB server-only).
    First new runtime dep since Phase 12's `LOP_CURATOR_LOGINS`
    threading (no actual dep there) — really first new runtime
    dep since Phase 9's auth stack (next-auth + drizzle-adapter
    + drizzle-orm + libsql-client). Acceptable cost for the
    feature.
  - **No GIF / animated WebP** support Phase 16. Acceptable
    (static avatars are the universal convention; GIFs can be
    distracting in profile UIs).
  - **No EXIF stripping** Phase 16. Privacy concern: photos can
    embed GPS coordinates. Mitigation: Q70 candidate flagged;
    Phase 17+ if user privacy report surfaces.
  - **No content moderation** Phase 16. Abusive imagery
    (NSFW / hateful) goes through unfiltered. Mitigation: Q68
    expansion flagged; Phase 17+ if abuse signals accumulate.
  - **No cropping UI** Phase 16. User crops before upload via OS
    tooling. Mitigation: Phase 17+ if feedback surfaces; CSS
    `object-fit: cover` handles non-square images on display.

### Option 2: External URL allowlist (no storage; no upload pipeline)

`users.imageOverride` stores a user-provided URL; server-action
validates URL format + matches against a narrow allowlist
(`gravatar.com`, `avatars.githubusercontent.com`,
`raw.githubusercontent.com`, `*.imgur.com`, possibly LinkedIn
or Bluesky CDN URLs); no upload pipeline; no storage layer; no new
env var; no new dependency.

- **Pros:**
  - Simplest architecture; smallest blast radius.
  - No vendor lock-in.
  - No abandoned-blob cleanup concern.
  - No new env var; no operational gate.
  - No new dependency; no bundle impact.
  - Smallest phase scope (5-6 units instead of 9).
  - Users with Gravatar / GitHub raw / similar URLs work day one.

- **Cons:**
  - **Most users have no usable image URL handy**. Power-user-only
    feature. Defeats the "I want to use my professional headshot"
    use case that motivates avatar override.
  - **External URLs can rot, 404, or change content** (allowlist
    domains mitigate but don't eliminate). Stale references
    surface as broken images on `/u/{handle}`.
  - **User cropping / sizing happens before paste; no in-app
    affordance**.
  - **Phase 17+ would still need upload pipeline** for
    non-power-users; net more total work split across phases.
  - **Allowlist maintenance burden** — adding new providers
    requires curator action.

### Option 3: S3 / R2 (cheapest at scale; complex)

`users.imageOverride` stores the S3-or-R2 public URL;
`lib/storage/` wraps the relevant SDK (`@aws-sdk/client-s3` or
similar); IAM policy + bucket policy + lifecycle rules; multi-
env-var operational gate.

- **Pros:**
  - Cheapest at scale (R2 has zero egress).
  - Provider-portable (S3 API is widely supported).
  - Better operational control (lifecycle rules, versioning,
    encryption-at-rest options).

- **Cons:**
  - **Most complex setup**. IAM policy + bucket policy +
    lifecycle rules + CORS config — each is its own
    architectural surface.
  - **Multi-env-var operational gate** (AWS_ACCESS_KEY_ID +
    AWS_SECRET_ACCESS_KEY + S3_BUCKET + AWS_REGION, or
    R2-equivalent four). Lifts Q-candidate count by ~3.
  - **Heaviest dependency** (`@aws-sdk/client-s3` ~120 kB
    server-only transitive). 4× Vercel Blob's footprint.
  - **Cost savings dominated by complexity at MVP scale**. ~$0.02/GB
    vs ~$0.015/GB (R2) for 20 MB is a $0.0001/month difference;
    irrelevant.
  - **Vercel Blob is already first-party** for this project; no
    egress to a third-party storage provider.
  - **Operational burden** (rotating credentials; bucket policy
    audits) higher than token-only Vercel Blob.

### Option 4: Hybrid — Vercel Blob upload OR external URL paste

`users.imageOverride` stores either a Vercel Blob URL (uploaded)
or an allowlisted external URL (pasted). Edit form offers both
affordances; server-action distinguishes them.

- **Pros:**
  - Covers both natural-flow upload (Vercel Blob) and
    power-user-existing-URL (allowlist) use cases.
  - Maximum flexibility.

- **Cons:**
  - **Triples implementation surface vs Option 1**. Two paths
    through server-action; two validation paths; two preview UI
    paths.
  - **Phase 16 scope blows out to 11+ units**. Pushes scope beyond
    Phase 12 + 14 + 15's 9-unit envelope.
  - **Phase 17+ is the natural home** for the URL allowlist
    extension; ship Vercel Blob first (Option 1), observe usage,
    promote URL allowlist if power-user demand surfaces.
  - **Validation complexity**: URL must EITHER match Vercel Blob
    pattern OR match the allowlist; harder to reason about.
  - **UX clutter**: two affordances may confuse users who just
    want to upload a picture.

## Decision Outcome

**Chosen: Option 1 — Vercel Blob with file-upload pipeline.**

The decision pins eight concrete contracts:

### D-A. Storage architecture choice

**Decision**: Vercel Blob via `@vercel/blob@1.x` SDK.
`users.imageOverride` stores the absolute public Vercel Blob URL
returned by the upload call. Storage-key naming scheme:
`avatars/<userId>-<timestamp>.<ext>` (per Unit 16.3 D-18 lean —
user-keyed for cleanup; timestamp prevents CDN cache collisions
on rapid replace; extension preserves browser content-type
sniffing fallback).

**Deferral matrix**:
- Option 2 (URL allowlist) deferred to Phase 17+ if power-user
  demand surfaces. May land as a composable extension
  (`imageOverride` accepts EITHER Blob URL OR allowlisted URL).
- Option 3 (S3 / R2) deferred indefinitely. Trigger for
  re-evaluation: storage cost crosses $10/month (50× MVP scale)
  OR vendor-portability becomes a load-bearing requirement.

**Rationale**:
- First-party Vercel integration; no CORS / IAM ceremony.
- Storage cost negligible at MVP scale.
- Single env var; small dependency.
- Natural user flow (upload from computer) matches social-platform
  convention.
- Server-side SDK ops keep upload tokens off the client.

### D-B. Upload pipeline scope (Phase 16)

| Step | Phase 16 ships? | Notes |
|---|---|---|
| MIME validation | **YES** | `image/jpeg`, `image/png`, `image/webp` only. **SVG explicitly excluded** (XSS surface — SVG can embed `<script>` tags). Validated client-side via `file.type` AND server-side via first-bytes magic-number check (defense-in-depth against forged MIME). |
| File size cap | **YES** | 2 MB. Client-side `file.size` check + server-side re-check. Vercel Blob accepts up to 500 MB but bandwidth at SSR time matters; 2 MB is generous for avatar use case. |
| EXIF stripping | **NO** (Phase 17+) | **Q70 candidate**. Privacy concern (GPS metadata, camera serials). Defer until first user privacy report. |
| Content moderation | **NO** (Phase 17+) | **Q68 expansion**. Defer until abuse signals. |
| Cropping UI | **NO** (Phase 17+) | User crops before upload via OS tooling. CSS `object-fit: cover` handles non-square images. Phase 17+ if feedback demands `react-easy-crop` or similar. |
| Server-side resizing / transcoding | **NO** (Phase 17+) | CSS fixed-size containers handle MVP. Phase 17+ if bandwidth concerns surface (large originals served on every render). |
| Image dimensions check | **NO** (Phase 17+) | Square-ratio enforcement not necessary; `object-fit` covers non-square. |
| GIF / animated WebP | **NO** | Static images only Phase 16. Animated avatars distract in profile UIs. |
| Delete-on-replace | **YES** | Old Blob URL → parse storage key → `del()` → only then write new URL. Wrapped in try/finally; orphan tolerated on partial failure. |
| Clear-by-empty-submit | **YES** | Submitting form with empty file input → clear override (write NULL to `imageOverride`; delete old Blob). Mirrors Phase-15 "delete displayName by saving empty" pattern. |
| Abandoned-blob cleanup script | **NO** (Phase 16 Class B follow-on) | Orphan tolerated; cleanup script flagged in Unit 16.6 hygiene. |

### D-C. Edit surface route shape

**Decision**: extend the existing `/[locale]/profile` Phase-15
inline edit form with a new image-upload section. NOT a separate
`/profile/edit/avatar` route.

- `/profile` stays the **EDIT-mode surface** per ADR-0015 D-F +
  ADR-0016 D-C.
- `/u/{login}` stays the **PUBLIC canonical** per ADR-0015 D-F.
- Image-upload section placement: between Phase-15's "Edit
  profile" text-field section and the watchlist section. Mirrors
  the Phase-15 layout that puts edit affordance adjacent to its
  surface.
- **No new protected route**; Phase-9 Class B item 12 middleware
  threshold (3+ protected page routes) stays uncrossed (still 2:
  profile + curator).

### D-D. Server-action shape

**Decision**: **new sibling server action**
`updateProfileImageAction` distinct from Phase-15's
`updateProfileAction`. NOT a REST endpoint.

- Multipart-form encoding is structurally different from
  text-form encoding; separating server actions avoids mixing
  `FormData` parsing branches.
- Phase-15's `updateProfileAction` stays unchanged (single-
  responsibility preserved).
- Mirrors Phase-15 inline server-action pattern verbatim
  (Phase 10/11/12/15 precedent).
- CSRF + cookie handling for free.

**Action shape** (Unit 16.4):

```tsx
const updateProfileImageAction = async (formData: FormData) => {
  "use server";
  const session = await auth();
  if (!session?.user?.id) redirect(`/api/auth/signin/github?callbackUrl=/${locale}/profile`);
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    // clear-by-empty-submit path
    await clearProfileImage(session.user.id);
  } else {
    const error = await updateProfileImage(session.user.id, file);
    if (error) redirect(`/${locale}/profile?error=${encodeURIComponent(error)}`);
  }
  revalidatePath(`/${locale}/profile`);
  redirect(`/${locale}/profile?saved=image`);
};
```

### D-E. Public consumption fallback chain

Phase 15's display-name fallback chain established the
**user-controlled-override-then-GitHub-derived** pattern. Phase 16
extends to image:

```
image fallback chain: imageOverride → image (GitHub-derived) → fallback initials placeholder
```

Affected surfaces:
- `/[locale]/u/[handle]/page.tsx` (Phase 14 public shell) —
  avatar `<img>` src updated.
- `/[locale]/profile/page.tsx` (Phase 10 signed-in own) —
  header card avatar src updated.
- `components/auth-control/index.tsx` (signed-in pill) —
  **unchanged Phase 16** (no avatar pill currently; defer until
  SiteHeader avatar-dropdown lands as Phase-14 Class B item).
- `components/site-header/index.tsx` — **unchanged Phase 16**
  (no avatar in header currently; same deferral).

Helper extensions:
- `lib/users/getPublicProfileByHandle` (Phase 14) returns
  `PublicProfile` shape extended with `imageOverride: string |
  null` alongside `displayName` + `bio`.
- `lib/auth/getUserMetadataById` (Phase 15) returns
  `{ githubLogin, displayName, imageOverride }` in one query.

Fallback initials placeholder (current Phase 9-15 behavior when
GitHub `image` is null) stays unchanged at the bottom of the
chain.

### D-F. Validation + sanitization model

1. **MIME**: `image/jpeg`, `image/png`, `image/webp` only. SVG
   excluded. Server-action checks via `file.type` (browser-
   provided) AND first-bytes magic-number check (`0xFF 0xD8 0xFF`
   for JPEG; `0x89 0x50 0x4E 0x47` for PNG; `0x52 0x49 0x46 0x46`
   for WebP-RIFF).
2. **Size**: 2 MB max. Client-side `file.size` check + server-
   side re-check. Server-side check authoritative (defends
   against curl POST / browser quirk).
3. **Length cap on stored URL** (post-upload): 512 chars. Same
   enforcement layer as Phase-15 text fields.
   `MAX_IMAGE_URL_CHARS` constant.
4. **URL format**: must start with `https://` AND match Vercel
   Blob public URL pattern
   `https://*.public.blob.vercel-storage.com/...`. Validated in
   `validateImageOverride(url)` helper.
5. **No regex content filter**. Phase 16 trusts the upload
   (storage is trusted via Blob token; content is unscrutinized).
   Phase 17+ may add content moderation (Q68 expansion).
6. **No uniqueness check on `imageOverride` URL**. Multiple users
   may technically point to identical storage keys (rare in
   practice; storage-key naming prevents collisions).
7. **Delete-on-replace** wraps the blob lifecycle (D-B).

**Implementation**:
- `lib/users/index.ts` exports `validateImageOverride(url)`
  returning `null` on valid OR a human-readable error string
  on invalid. Mirrors Phase-15's `validateDisplayName` +
  `validateBio` shape.
- `lib/users/index.ts` exports `updateProfileImage(userId, file)`
  + `clearProfileImage(userId)`. Together they perform the
  validated upload + write OR the validated clear + delete.
- `lib/storage/index.ts` exports `putAvatar(file, userId)` +
  `delAvatar(url)` thin wrappers around `@vercel/blob`'s
  `put()` + `del()`. Server-only module.

### D-G. Operational gating (Q69 candidate)

The Vercel Blob path introduces **`BLOB_READ_WRITE_TOKEN`** as a
new env-var operational gate. Surfaces a new **Q69 candidate** in
OPEN_QUESTIONS (Unit 16.7) parallel to existing operational
gates:

- Q54 (GitHub OAuth app registration: `AUTH_GITHUB_ID` +
  `AUTH_GITHUB_SECRET` + `AUTH_SECRET`).
- Q55 (Turso production DB provisioning: `TURSO_DATABASE_URL` +
  `TURSO_AUTH_TOKEN`).
- **Q69** (Vercel Blob token provisioning:
  `BLOB_READ_WRITE_TOKEN`).
- Phase-12 `LOP_CURATOR_LOGINS` (no Q-entry; documented inline).

Operational unblock path:
1. Vercel dashboard → project → Storage → Blob → Create store.
2. Vercel auto-provisions `BLOB_READ_WRITE_TOKEN` env var; pulls
   into local dev via `vercel link` + `vercel env pull`.
3. `.env.example` documents the var with a placeholder.

**Graceful degradation**: if `BLOB_READ_WRITE_TOKEN` is unset,
the upload action returns an error message; the rest of `/profile`
(displayName + bio + watchlist + challenges) keeps working.
Sign-in / sign-up / read-side surfaces unaffected.

### D-H. Phase 17+ deferrals

Phase 16 ships MINIMAL image override surface. Deferred to Phase
17+:

- **Q70 candidate** (privacy): EXIF stripping. Defer until first
  user privacy report.
- **Q68 expansion** (content moderation on uploaded images).
  Defer until abuse signals.
- **Cropping UI** (`react-easy-crop` or similar). Defer until
  user feedback demands.
- **Server-side resizing / transcoding** (sharp on Vercel
  serverless). Defer; CSS `object-fit` covers MVP.
- **Multiple avatars / avatar history**. Defer.
- **Image dimensions check** (square-ratio enforcement). Defer.
- **Abandoned-blob cleanup script** (Phase 16 Class B
  follow-on).
- **GIF / animated WebP** support. Defer; static only Phase 16.
- **External URL allowlist composability** (Option 2 as a
  composed extension). Defer until power-user demand surfaces.

## Consequences

### Positive

- **Closes [Q67](../../OPEN_QUESTIONS.md#q67-image-override-avatar-upload)**
  with a concrete architectural pin (anticipated promotion:
  `open` → `resolved` in Unit 16.7).
- **Closes the Phase 15 → Phase 16 architectural inheritance** —
  Phase 14 shipped read-only public profile; Phase 15 made it
  text-editable; Phase 16 makes it image-editable. Natural
  progression complete.
- **No new public-data category** introduced (per ADR-0015 D-A
  invariant preserved). Image override is a user-controlled
  override of a field already public elsewhere (github.com).
- **Third ALTER migration validates ADR-0014 D-E pattern** at
  third exercise. ALTER discipline crystallized for Phase 17+
  inheritance.
- **First binary storage layer in project history** introduced.
  Establishes `lib/storage/` module pattern for Phase 17+
  binary-asset inheritance (paper figures? curator-review
  attachments? methodology diagrams?).
- **Server-action mirrors Phase 10/11/12/15 precedent** — no new
  architectural surface added; pattern continues.
- **§5.7 trigger** unchanged (no new tables; ALTER additive).
- **First Load JS** unchanged on read-side; +~50 lines of
  client-side JS in a small `"use client"` boundary on the
  edit form for `URL.createObjectURL` preview. Minimal impact.
- **Reversibility**: EXIF stripping + content moderation +
  cropping UI + transcoding + multiple-avatars + cleanup script
  each promote Phase 17+ incrementally without Phase-16 schema
  rework.
- **Scope cap honored**: Phase 16 ships ~9 units; Q70 + Q68
  expansion flagged for Phase 17+.

### Negative

- **Vendor lock-in to Vercel Blob**. Migrating to S3 / R2 means
  rewriting `lib/storage/` (~100 lines). Mitigation: keep
  `lib/storage/index.ts` deliberately thin.
- **New env var operational gate** (Q69 candidate). Image upload
  silently degrades to "GitHub avatar only" if token missing;
  user-visible feature but not a critical path.
- **Abandoned-blob concern**. Delete-on-replace failure leaves
  orphans. Mitigation: try/finally + cleanup-script follow-on.
- **No EXIF stripping Phase 16**. Privacy concern for users
  uploading personal photos. Mitigation: Q70 candidate flagged.
- **No content moderation Phase 16**. Abusive imagery
  unfiltered. Mitigation: Q68 expansion flagged.
- **No cropping UI Phase 16**. Non-power users may struggle with
  pre-upload cropping. Mitigation: CSS `object-fit: cover`
  produces acceptable defaults; Phase 17+ if demand.
- **No SVG support**. Vector avatars (e.g., monogram logos)
  excluded. Acceptable trade for XSS safety.
- **No animated WebP / GIF support**. Acceptable per
  social-platform convention.
- **One new ADR claims the ADR-0017 slot**. Multi-provider OAuth
  expansion (previously ADR-0018 candidate flagged) becomes
  ADR-0018 verbatim; subscriber-list email (Phase-5 D-4 punt)
  becomes ADR-0018+ candidate; full §8.6 24-mo COI becomes
  ADR-0019+; markdown-bio sanitization couples to Q66 and
  surfaces an ADR-0019+ candidate. ADR enumeration ordering is
  not load-bearing.

## Cross-references

- **§3.1** "ratings are revisable" framing extended to user
  identity (Phase 14's read-only public profile + Phase 15's
  user-controlled text writes + Phase 16's user-controlled image
  writes jointly close the per-user editable-identity surface).
- **§14.4** CHANGELOG + ADR contract.
- **§15.5** reviewer-mode mindset (applied throughout
  deliberation; driver for SVG-exclusion + size-cap + first-bytes
  magic-number check decisions).
- **[ADR-0004](./0004-file-first-no-db.md)** file-first / no-DB-
  for-content (preserved — Phase 16 ships USER-STATE writes only;
  content stays file-first; binary storage is a separate
  primitive).
- **[ADR-0008](./0008-llm-provider-anthropic.md)** §3
  cost-governance pact (applied by analogy to storage cost; MVP
  scale storage cost negligible).
- **[ADR-0011](./0011-i18n-strategy.md)** i18n strategy (Phase
  16's new `messages.profile_edit.image_*` keys follow the
  established sibling-file convention; extends Phase-15's
  `messages.profile_edit.*` namespace).
- **[ADR-0012](./0012-auth-provider.md)** auth provider (D-E
  `users.githubLogin` joining preserved; this ADR's D-A excludes
  `githubLogin` from editable fields — URL key immutable).
- **[ADR-0013](./0013-db-choice.md)** DB choice (D-B migration
  immutability + D-F USER-STATE only — both respected; Phase 16's
  ALTER is additive USER-STATE; binary storage lives in Vercel
  Blob, not the DB).
- **[ADR-0014](./0014-curator-review-pipeline.md)** D-E ALTER
  migration discipline — this ADR's D-A schema change inherits
  the pattern; **third ALTER migration in project history
  validates the discipline at third exercise**.
- **[ADR-0015](./0015-per-user-privacy-model.md)** D-A
  public-data invariant — preserved (image override is
  user-controlled override of a field already public at
  github.com); D-F two-surfaces-per-identity preserved.
- **[ADR-0016](./0016-user-editable-profile-fields.md)** D-G
  image override Phase-16+ deferral — this ADR closes that
  deferral; D-A field partition extended (`imageOverride` added
  to user-controlled column set); D-C `/profile` extension
  pattern reused; D-D server-action pattern reused; D-E
  fallback chain pattern reused for image.
- **[OPEN_QUESTIONS Q67](../../OPEN_QUESTIONS.md#q67-image-override-avatar-upload)**
  (promoted in Unit 16.7 alongside this ADR's acceptance).
- **[Unit 16.0 prep](../thinking/16.0-phase-16-prep.md)** D-1
  through D-11 (the Phase-16 thread recommendation + decision
  ledger this ADR pins).
- **Phase-9 Class B item 12** middleware-based auth-route
  protection (unaffected — image upload form on existing
  `/profile` doesn't add a new protected route; threshold stays
  at 2).
- **Phase-16+ Q69 candidate** (`BLOB_READ_WRITE_TOKEN`
  operational gate; D-G).
- **Phase-17+ Q70 candidate** (EXIF stripping; D-B + D-H).
- **Phase-17+ Q68 expansion** (content moderation on uploaded
  images; D-B + D-H).
