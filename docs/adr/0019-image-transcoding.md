# ADR-0019 — Image-transcoding pipeline for EXIF stripping (`sharp` + server-side `lib/storage/putAvatar` integration)

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phase 16 ([ADR-0017](./0017-image-storage.md)) shipped
`users.imageOverride` with Vercel Blob upload pipeline + MIME
validation + size cap + magic-byte defense + delete-on-replace.
ADR-0017 D-B + D-H explicitly deferred **EXIF stripping** to
Phase 17+: *"EXIF stripping — privacy concern (GPS metadata,
camera serials). Defer until first user privacy report."*

Phase 19's keystone thread per Unit 19.0 D-1 is **Q70 promotion**
— EXIF stripping on uploaded images. Three architectural surfaces
converge:

1. **First server-side image processing surface** in project
   history. Phase 16 stored images as-is via Vercel Blob; Phase
   19 transcodes (re-encodes without EXIF metadata) before upload.
2. **First explicit privacy-by-default surface**. Phase 16's
   imageOverride shipped without EXIF stripping — privacy-by-
   omission. Phase 19 closes the privacy gap intentionally:
   user-uploaded photos commonly embed GPS coordinates (mobile
   default), camera serial numbers, datetime metadata, software
   signatures. Vercel Blob serves the avatar URL publicly; anyone
   can read embedded EXIF via standard tooling.
3. **Establishes transcoding pipeline pattern** that Phase 20+
   image-processing surfaces inherit: Q68 expansion (content
   moderation on uploaded images); cropping UI; server-side
   resizing; format conversion.

Plus the operational tail: library choice + dependency surface +
auto-rotation handling + backwards compatibility + test fixture
authoring. The phase has to pick.

Decisions to pin in this ADR:

1. **Which image-processing library?** `sharp` vs `exifreader` vs
   `piexifjs` (browser-side) vs Vercel Image Optimization vs
   external service (Cloudinary / Imgix)?
2. **What EXIF tags are stripped?** All? Allow-list? Deny-list?
   Color profile preserved?
3. **Where does the pipeline run?** Server-side in
   `lib/storage/putAvatar`? Client-side pre-upload? External
   service POST?
4. **How is image orientation handled?** Strip EXIF Orientation
   tag breaks visual correctness on iOS uploads — how to preserve?
5. **What about existing images?** Phase 16-18 uploaded avatars
   without EXIF strip — backfill or grandfather?
6. **What does Phase 20+ inherit?** Pipeline shape for content
   moderation / cropping / resizing.

[Q70 candidate](../thinking/16.0-phase-16-prep.md) (anticipated in
Phase 16) becomes [Q70 promoted](../../OPEN_QUESTIONS.md#q70-exif-stripping)
in Unit 19.4. This ADR closes Q70 by pinning each sub-question
concretely.

## Decision Drivers

- **§3.1** "ratings are revisable" framing extended to user
  privacy — strip-by-default is the conservative posture for
  PII surfaces.
- **[ADR-0017](./0017-image-storage.md) D-B + D-H** explicit
  Phase-17+ deferral with explicit Q70 candidate reservation —
  Phase 16 anticipated this surface as the follow-on; preserving
  Phase 16's scope-cap discipline.
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant — EXIF stripping does NOT add a new public-data
  category. It REMOVES embedded private data from the public
  surface (`imageOverride` URL serves publicly via Vercel Blob
  CDN); strict subset of Phase-16's public-data shape.
- **[ADR-0013](./0013-db-choice.md) D-F** USER-STATE only — no
  schema change Phase 19; `imageOverride` column unchanged.
- **[ADR-0018](./0018-markdown-sanitization.md) D-F** bundle
  invariant — First Load JS shared chunk = 103 kB UNCHANGED
  end-to-end through every Phase 9-18 unit. Phase 19 must not
  regress: image-transcoding library must be server-only.
- **§10.4 perf budget** — `sharp` is server-only; client bundle
  unchanged. Server-side cold-start cost negligible (libvips
  native bindings; ~100 ms first-call; pre-warmed in subsequent
  calls).
- **§15.5 reviewer-mode mindset** — applied to: (a) EXIF privacy
  leak (concrete signal); (b) auto-rotation preservation (visual
  correctness regression risk if mishandled); (c) DoS surface
  (sharp transcoding cost on large uploads — already 2 MB-capped
  per ADR-0017 D-B); (d) test-fixture trust (checked-in fixture
  with real EXIF tags + assertion harness).
- **Phase 19 scope cap** (Unit 19.0 D-1 + scope discipline) — ~6
  units; EXIF stripping ONLY; backfill script / Q68 expansion /
  cropping UI / resizing all Phase 20+.
- **§14.4** CHANGELOG + ADR contract: pin the choice with
  Pros/Cons before code lands.

## Considered Options

### Option 1: `sharp` server-side transcoding pipeline (chosen)

The recommendation in [Unit 19.0 D-4 + D-5](../thinking/19.0-phase-19-prep.md).
Install `sharp@0.34+` (if not already transitively present via
`next/image`); extend `lib/storage/putAvatar` to invoke
`sharp(buffer).rotate().toBuffer()` before Vercel Blob upload.
EXIF stripping happens by default on `sharp`'s `.toBuffer()` call.
`.rotate()` preserves visual correctness by applying EXIF
Orientation tag to pixel data before stripping. Color profile +
dimensions + encoding settings preserved.

- **Pros:**
  - Closes [Q70](../../OPEN_QUESTIONS.md#q70-exif-stripping) with
    a concrete architectural pin.
  - **Battle-tested library**: `sharp` is the de-facto Node.js
    image processing standard (used by Vercel Image Optimization,
    Next.js `next/image`, Cloudinary, Strapi, Payload CMS, etc.).
  - **Native libvips bindings** make `sharp` 10x faster than
    `gm`/`imagemagick`; matches Vercel serverless cold-start
    budget.
  - **EXIF stripping is the default behavior** on `.toBuffer()`
    — opt-in to preserve metadata via `.withMetadata({...})`.
    Inverted-allow-list shape; security-correct defaults.
  - **Server-only**: no client bundle impact; **First Load JS
    UNCHANGED at 103 kB** per ADR-0018 D-F invariant extension.
  - **Likely already transitive dep** of `next/image` — TBD
    verify Unit 19.2; if so, zero new direct deps.
  - **Re-encoding support**: same library handles future Phase
    20+ resizing / format conversion (WebP / AVIF) / cropping
    transforms if Q68 expansion or cropping UI ships. Pattern
    established for inheritance.
  - **`.rotate()` no-arg semantics**: reads EXIF Orientation tag
    (1-8); applies rotation/flip to pixel data; resets
    Orientation to 1. iOS portrait shots render correctly across
    all clients including those that ignore EXIF Orientation.
  - **Color profile preservation** (D-B) via `.withMetadata({
    icc: true })` if observed needed; Phase-19 default conservative
    strip-everything.
  - **Reversibility**: Phase 20+ extensions add config to the same
    `lib/storage/putAvatar` function — no architectural rework.
  - **Establishes `lib/storage/` transcoding-pipeline pattern**
    for Phase 20+ image-processing inheritance (Q68 expansion /
    cropping / resizing all consume the same `sharp` instance).
  - **Test fixtures + assertion harness reuse `sharp.metadata()`**
    — same library production + test; consistent EXIF probe.
  - **Phase 19 scope stays tight** (~6 units; matches Phase 17/18
    cadence minus a UI consumer surface).

- **Cons:**
  - **New dep if not transitive**: `sharp@0.34+` may need explicit
    `pnpm add` if `next/image` doesn't pull it transitively
    (TBD Unit 19.2). Mitigation: ~30 kB transitive (server-only);
    no client bundle impact.
  - **Server-side cold-start cost**: libvips native bindings load
    on first invocation (~100 ms); subsequent calls amortized.
    Acceptable Phase-19 scale; observable Phase 20+ if call
    frequency grows.
  - **Backwards compatibility**: existing Phase 16-18 avatars
    aren't retroactively stripped — backfill script Phase 20+
    candidate per D-E.
  - **Auto-rotate edge cases**: rare images with corrupt
    Orientation tags can fail in `.rotate()`; mitigation: error
    propagates to caller; user re-uploads.
  - **Re-encoding artifacts**: JPEG re-encode at default quality
    settings may produce slight pixel differences vs original.
    Mitigation: `.jpeg({ quality: 90 })` if observed; defer
    Phase 20+ if signal demands.

### Option 2: `exifreader` / `exiftool` Node bindings (rejected)

Read-only EXIF parsing (`exifreader`) or external-binary
invocation (`exiftool` Node bindings).

- **Pros:**
  - Smaller deps (~10 kB).
  - Read-only modes useful for EXIF inspection / debugging.

- **Cons:**
  - **Read-only or external-binary**: doesn't re-encode the image
    itself; stripping EXIF needs separate encoding step. Net more
    work vs `sharp` one-shot pipeline.
  - **`exiftool` requires shell binary**: Vercel serverless
    runtime doesn't ship `exiftool`; would need bundled binary
    (~10 MB) — over deployment-size budget.
  - **`exifreader` doesn't write metadata**: useful only for
    inspection; can't perform the actual stripping step.

### Option 3: Browser-side stripping (`piexifjs` or similar; rejected)

Strip EXIF in the client component before upload via JavaScript
library.

- **Pros:**
  - Server doesn't process image at all (saves serverless
    runtime cost).
  - Network upload payload reduced.

- **Cons:**
  - **Adds client bundle (~10 kB)**: First Load JS regresses
    from 103 kB → ~113 kB; violates ADR-0018 D-F invariant
    carried through every Phase 9-18 unit.
  - **Trust boundary moves to client**: malicious user can
    intercept and skip stripping; defense must still run
    server-side. Net more code (client strip + server re-strip).
  - **Browser File API EXIF support is uneven**: older browsers
    may strip metadata silently on file selection; client
    stripping is a UX wash, not a guarantee.

### Option 4: Vercel Image Optimization API (rejected)

Leverage Vercel's built-in `next/image` optimization for runtime
image serving.

- **Pros:**
  - First-party Vercel; zero additional deps.
  - Handles resizing + format conversion + CDN serving.

- **Cons:**
  - **Read-side optimization only**: Vercel Image Optimization
    runs on image SERVE, not image UPLOAD. EXIF metadata is
    already stored in Vercel Blob by the time the optimizer
    sees it. Defeats the goal of stripping at upload.
  - Phase 19 needs upload-path transcoding; this option
    doesn't apply.

### Option 5: External transcoding service (Cloudinary / Imgix / rejected)

POST upload buffer to third-party transcoding service; service
strips EXIF + returns processed URL.

- **Pros:**
  - Most flexible; supports any transcoding need (Q68 expansion +
    cropping + resizing all out-of-the-box).
  - Provider-managed; no library install.

- **Cons:**
  - **Per-image cost** (~$0.001-0.01 per upload at MVP scale).
  - **Operational gate** (new API key + account + billing).
  - **Network latency** (one extra hop on upload path).
  - **Vendor lock-in** (URL format becomes Cloudinary-specific).
  - **Over-engineered for Phase 19 scope** — single library
    (`sharp`) handles all anticipated Phase 19-20 needs.

## Decision Outcome

**Chosen: Option 1 — `sharp` server-side transcoding pipeline.**

The decision pins six concrete contracts:

### D-A. Library choice

**`sharp@0.34+`** as the image-processing library. Installed as
direct runtime dep if not already transitively present via
`next/image` (TBD verify Unit 19.2).

| Library | Phase 19 | Phase 20+ |
|---|---|---|
| `sharp` | YES (this ADR D-A) | extend with resizing / format conversion / cropping |
| `exifreader` | NO | optional read-only EXIF inspection if signal demands |
| `piexifjs` | NO | client-side strip rejected (regresses 103 kB invariant) |
| Vercel Image Optimization API | NO | read-side serving (already used by `next/image`); not upload-path |
| Cloudinary / Imgix | NO | Phase 20+ alternative if multi-feature transcoding scope grows |

### D-B. EXIF allow-list

**Strip everything by default**; opt-in to preserving via
explicit `.withMetadata({...})` flags. Phase 19 conservative
default = strip all:

| EXIF concern | Phase 19 stripped? | Notes |
|---|---|---|
| GPS coordinates | **YES** | Primary privacy concern. |
| Camera serial / model | **YES** | Device fingerprinting surface. |
| Datetime metadata | **YES** | Schedule / location-history inference. |
| Software signatures | **YES** | OS / app fingerprinting. |
| Author / Copyright tags | **YES** | PII surface. |
| Comment / Description tags | **YES** | Free-text PII surface. |
| Color profile (ICC) | **PRESERVED** | Image rendering integrity. |
| Image dimensions | **PRESERVED** | Layout requirement. |
| Compression / quality | **PRESERVED** | Re-encoding correctness. |

`sharp`'s default `.toBuffer()` behavior strips ALL EXIF; we'd
need explicit opt-in via `.withMetadata()` to preserve any.
**Phase 19 ships with NO `.withMetadata()` call** — strip
everything. Color profile preservation can be opt-in Phase 20+
via `.withMetadata({ icc: true })` if observation shows color
shift on common image profiles.

### D-C. Pipeline placement

**Decision**: `lib/storage/putAvatar` extension — server-side
transcoding BEFORE Vercel Blob upload.

Pipeline:

```ts
import sharp from "sharp";

export async function putAvatar(file: File, userId: string): Promise<string> {
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const strippedBuffer = await sharp(inputBuffer)
    .rotate()                                          // D-D auto-rotation
    .toBuffer();                                       // strip EXIF (D-B inverted-allow-list)
  // existing Vercel Blob upload logic, but with strippedBuffer
}
```

**Why server-side** (not client-side):
- Trust boundary stays on server (D-D defense-in-depth).
- 103 kB First Load JS invariant preserved.
- `sharp` is server-only; client bundle unchanged.

**Why in `putAvatar`** (not in `updateProfileImage` server
action):
- Encapsulation: storage layer handles all blob-related
  transforms.
- Future Phase 20+ extensions (cropping / resizing / Q68
  expansion content moderation) all run inside `putAvatar`;
  single integration point.
- Tests at the `lib/storage/` layer cover transcoding correctness
  without depending on server-action mocks.

### D-D. Auto-rotation preservation

**Decision**: invoke `sharp(buffer).rotate()` (no args) BEFORE
`.toBuffer()`.

**Behavior**:
- Reads EXIF Orientation tag (1-8).
- Applies rotation/flip to **pixel data**.
- Resets Orientation tag to 1 (default upright).

**Rationale**:
- **iOS cameras default to landscape sensor + portrait display
  Orientation metadata** (Orientation = 6 typically, for portrait
  shots). Stripping EXIF without first applying Orientation
  renders the image **sideways** in clients that don't read EXIF
  (most CDN-served `<img>` rendering).
- **Auto-rotate preserves visual correctness across ALL
  clients** including those that ignore EXIF Orientation.
- **Same call also handles other rotation cases** (180° / 270° /
  flipped horizontally). No special-casing needed.

### D-E. Backwards compatibility

**Decision**: Phase 19 only strips on NEW uploads via
`updateProfileImageAction`. **Existing Phase 16-18 avatars NOT
retroactively processed.**

Rationale:
- Backfill script needs ~100-1000 KB download + sharp process +
  upload per existing user → non-trivial cost + operational
  surface (rate limits / progress tracking / failure recovery).
- Phase-19 scope-cap discipline.
- **Backfill script Phase 20+ candidate** if curator demands
  retroactive privacy correction.

**Phase 20+ backfill** (if promoted):
- Script in `scripts/backfill-exif-strip.ts`.
- Iterates `users.imageOverride` URLs that match Vercel Blob
  pattern + non-null + uploaded-before-Phase-19-deploy-date.
- For each: download blob → `sharp(buffer).rotate().toBuffer()`
  → upload stripped buffer → update DB column → delete original
  blob.
- Manual invocation by curator; CLI flag for dry-run.
- ~1-2 unit scope when promoted.

### D-F. Phase 20+ inheritance contract

Phase-19 `lib/storage/putAvatar` extension establishes the
**transcoding pipeline integration point** for Phase 20+ image-
processing surfaces:

```
Phase 19 (this ADR):       sharp(buf).rotate().toBuffer()
                            └── strip EXIF (D-B default)

Phase 20+ Q68 expansion:   sharp(buf).rotate()
                            .pipe(moderationApi)         // content moderation
                            .toBuffer()

Phase 20+ cropping:        sharp(buf).rotate()
                            .extract({...})              // user-selected crop region
                            .toBuffer()

Phase 20+ resizing:        sharp(buf).rotate()
                            .resize(maxSize)             // optimization
                            .toBuffer()

Phase 20+ format:          sharp(buf).rotate()
                            .resize(maxSize)
                            .webp({ quality: 85 })       // WebP/AVIF transcoding
                            .toBuffer()
```

Each Phase 20+ surface inserts its transform between `.rotate()`
and `.toBuffer()`. Audit boundary stays explicit; transforms
compose. Multiple Phase 20+ transforms can stack (moderation +
crop + resize + webp).

## Consequences

### Positive

- **Closes [Q70](../../OPEN_QUESTIONS.md#q70-exif-stripping)**
  with a concrete architectural pin.
- **First server-side image processing surface** in project
  history. Phase 9-18 stored images as-is; Phase 19 transcodes.
- **First explicit privacy-by-default surface** — Phase 16
  shipped privacy-by-omission; Phase 19 closes the gap
  intentionally.
- **No new public-data category** (per ADR-0015 D-A invariant
  preserved). EXIF stripping REMOVES embedded private data from
  the public surface; strict subset of Phase-16 public-data
  shape.
- **Third consecutive 0-migration phase** (Phase 17 + 18 + 19; 6
  of 10 phases since DB landed).
- **`lib/storage/` transcoding-pipeline pattern established** for
  Phase 20+ image-processing inheritance.
- **Reversibility**: Phase 20+ Q68 expansion / cropping /
  resizing / format conversion each extend the same
  `sharp(buffer).rotate()...toBuffer()` integration point; no
  architectural rework.
- **Bundle invariant preserved** — First Load JS shared chunk =
  **103 kB UNCHANGED** end-to-end through every Phase 9-19 unit
  per ADR-0018 D-F invariant extension.
- **`sharp` is likely already transitive** via `next/image` (TBD
  verify Unit 19.2); if so, zero new direct deps Phase 19.
- **Auto-rotation preserves visual correctness** across all
  clients including those that ignore EXIF Orientation.

### Negative

- **New runtime dep if not transitive** — `sharp@0.34+` ~30 kB
  server-only. Mitigation: confirm transitive status Unit 19.2;
  if explicit install required, accept the dep.
- **Server-side cold-start cost** — libvips native bindings load
  on first invocation (~100 ms); subsequent calls amortized.
- **No backwards compatibility Phase 19** — existing Phase 16-18
  avatars carry EXIF. Mitigation: backfill script Phase 20+
  candidate.
- **Re-encoding artifacts** — JPEG re-encode may produce slight
  pixel differences vs original. Mitigation: defer quality
  tuning Phase 20+ if observed.
- **Auto-rotate edge cases** — rare images with corrupt
  Orientation tags can fail; user re-uploads on error.

## Cross-references

- **§3.1** "ratings are revisable" framing extended to user
  privacy.
- **§14.4** CHANGELOG + ADR contract.
- **§15.5** reviewer-mode mindset (privacy-by-default;
  defense-in-depth on auto-rotation; trust boundary).
- **[ADR-0008](./0008-llm-provider-anthropic.md)** Vercel hosting
  context (`sharp` is native dep; libvips bindings work in Vercel
  serverless).
- **[ADR-0013](./0013-db-choice.md)** D-F USER-STATE only
  preserved.
- **[ADR-0015](./0015-per-user-privacy-model.md)** D-A public-data
  invariant preserved (strict subset of Phase 16 public surface).
- **[ADR-0017](./0017-image-storage.md)** D-B + D-H EXIF stripping
  Phase-17+ deferral closed by this ADR.
- **[ADR-0018](./0018-markdown-sanitization.md)** D-F server-side-
  only / 103 kB First Load JS invariant — preserved.
- **[OPEN_QUESTIONS Q70](../../OPEN_QUESTIONS.md#q70-exif-stripping)**
  (promoted in Unit 19.4 alongside this ADR's acceptance).
- **[Unit 19.0 prep](../thinking/19.0-phase-19-prep.md)** D-1
  through D-8 (the Phase-19 thread recommendation + decision
  ledger this ADR pins).
- **Phase-9 Class B item 12** middleware-based auth-route
  protection (unaffected — Phase 19 doesn't add a protected
  route; threshold stays at 2).
- **Phase-20+ Q68 expansion** (content moderation on uploaded
  images; D-F inheritance contract).
- **Phase-20+ cropping UI / resizing / format conversion** (D-F
  inheritance contract).
- **Phase-20+ backfill script** (D-E deferral; Class B carryover).
