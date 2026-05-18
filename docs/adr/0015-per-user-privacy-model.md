# ADR-0015 — Per-user privacy model (public profile contract for `/[locale]/u/[handle]`)

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phases 9 – 13 have accumulated a per-user surface area without a per-user public identity surface. Today:

- Phase 9 ships **auth + `users` table** (with `users.githubLogin` joining to file-system curator-of-record per [ADR-0012](./0012-auth-provider.md) D-E) + the **watchlist** USER-STATE table.
- Phase 10 ships `/[locale]/profile` — a **signed-in own-state surface** (the user views their own watchlist + sign-out form). Public profile route at `/[locale]/u/[handle]` was deferred there explicitly (Phase-10 Class B item 1).
- Phase 11 ships **rating-challenge submission** (USER-STATE writes) + extends `/profile` to show the user's own challenges.
- Phase 12 ships **curator review pipeline** ([ADR-0014](./0014-curator-review-pipeline.md)) — adds a second authorization tier + a status-machine on `ratingChallenge` rows.
- Phase 13 ships **Q58 per-status public visibility** (counter on problem detail + per-problem listing at `/problems/[slug]/challenges`) — establishes the **first read-side public surface for USER-STATE content** + **first status-gated visibility policy** (`submitted ∪ under_review ∪ accepted` public; `rejected ∪ withdrawn` submitter-only).

Phase 14 closes the four-phase honored-deferral lineage by adding `/[locale]/u/[handle]` — the **per-USER read-side public surface**. Phase 13 explicitly deferred the `/u/{handle}/challenges` per-user surface to Phase 14+ (Q58 lean #3) on the grounds that the per-user privacy model deserves its own ADR — this is that ADR.

Phase 13's per-problem listing today renders submitter `@githubLogin` as **plain text linking to nothing** (Unit 13.3 D-13 deferred the link target). Phase 14's public profile route makes those references navigable end-to-end, closing the dangling seam.

Decisions to pin in this ADR:

1. **Which user fields are PUBLIC on `/u/{handle}`?** GitHub-derived (`name` + `image` + `githubLogin` + `createdAt`)? USER-STATE-derived aggregate counts? Curator-of-record badge?
2. **Which fields are NEVER public?** `email`? `LOP_CURATOR_LOGINS` membership? `rejected` / `withdrawn` challenge counts?
3. **What is the URL canonical case for `[handle]`?** Lowercase canonical with case-mismatch redirects, or case-preserved with case-insensitive lookup?
4. **Are profile fields user-editable in Phase 14?** Or read-only / GitHub-derived only (with Phase 15+ promotion)?
5. **What is the per-user privacy opt-out story?** Phase 14, or deferred?
6. **How does the curator-of-record badge match?** Case-sensitive against `editorial.primary_curator`? Case-insensitive?
7. **What is the SiteHeader integration shape?** Where does `/profile` (edit mode) live relative to `/u/{login}` (public mode)?

This ADR closes the per-user-privacy architectural surface, mirroring how ADR-0014 closed the curator-review architectural surface in Phase 12. The next architectural surface (per-user EDITABILITY) is anticipated as a Phase 15+ ADR that will supersede this ADR's D-C clause.

## Decision Drivers

- **§3.1** "ratings are revisable" framing — the per-user surface contributes the **attribution** half of the editorial-action chain that §13 + ADR-0005 + ADR-0012 D-E establish (curator field in YAML = git commit author = `users.githubLogin`). Phase 14's per-user surface is the **public face of that attribution**.
- **§8.6** COI policy spirit — applied here as "submitter identity should be discoverable to support COI auditability". The per-user surface helps reviewers + readers verify that the curator is not the submitter on accepted challenges (mirrors ADR-0014 D-C hard-block rationale, surfaced on the read side).
- **§13** public-facing editorial workflow — accepted challenges fold into rating-action history that §13 surfaces via RSS + `/ratings`. The per-user surface gives the **per-user view** of that history (currently only available per-problem via Phase-13 listing).
- **[ADR-0012](./0012-auth-provider.md) D-E** `users.githubLogin` joining — GitHub-OAuth identity is **inherently public** at GitHub's source-of-truth surface (github.com/{login}). Mirroring `@login` + `name` + `image` on `/u/{login}` matches the user's existing public identity. **No new public-data category** is introduced by this ADR.
- **[ADR-0014](./0014-curator-review-pipeline.md) D-C** simplified COI — Phase 14's curator-of-record badge surface is the read-side mirror of Phase 12's COI write-side enforcement. Together they form a "self-review surfaced both as a block AND as public attribution" pair.
- **[Phase-13 Unit 13.0 D-3](../thinking/13.0-phase-13-prep.md)** status-gated visibility policy — `rejected` + `withdrawn` stay submitter-only. Phase 14 inherits this policy verbatim: per-user aggregate counts respect the same partition.
- **§5.7 trigger (a)** ALREADY FIRED; Phase 14 adds **NO new tables / columns / migrations**. Read-only on existing Phase-9 / Phase-11 / Phase-12 DB data.
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB end-to-end. Phase 14's surfaces are server-rendered; zero client-bundle delta anticipated.
- **§15.5 reviewer-mode mindset** — "could a future curator misuse this surface?" applied as "could a future visitor learn something about a user from this page that they shouldn't?". Driver for the `email` exclusion + `rejected` / `withdrawn` privacy.
- **Phase 14 scope cap** (Unit 14.0 D-1 + scope discipline) — 9 units; read-only per-user surface ONLY; user-editable name / image / bio deferred to Phase 15+; per-user activity feed / contribution timeline deferred to Phase 15+; per-user privacy opt-out toggle deferred to Phase 15+.
- **Phase-9 Class B item 12** middleware-based auth-route protection — threshold = 3+ protected page routes. Phase 14's `/u/{handle}` is **NOT auth-protected** (any visitor can view); the protected-route count stays at 2 (profile from Phase 10; curator dashboard from Phase 12). Middleware lift remains deferred.
- **§14.4** CHANGELOG + ADR contract: pin the choice with Pros/Cons before code lands.

## Considered Options

### Option 1: GitHub-derived public + USER-STATE aggregate counts (status-partitioned per Phase-13) + read-only Phase 14 + case-preserved-URL + curator-of-record case-sensitive (chosen)

The recommendation in [Unit 14.0 D-1 through D-13](../thinking/14.0-phase-14-prep.md). All Phase-14 public profile fields are either (a) inherent in GitHub identity (`name` + `image` + `githubLogin` + `createdAt` join-date) OR (b) USER-STATE aggregate counts that respect the Phase-13 status-gated visibility partition (`submitted ∪ under_review ∪ accepted` counts public; `rejected ∪ withdrawn` counts submitter-only). `email` never surfaces. Profile route is `/[locale]/u/[handle]` with case-preserved URL + case-insensitive DB lookup (no redirect on case mismatch). Profile is read-only Phase 14; user-editability deferred Phase 15+. Curator-of-record badge uses case-sensitive comparison against `editorial.primary_curator`. SiteHeader signed-in surface gets a "Your profile" link to `/u/{login}` (public canonical); `/profile` becomes the EDIT surface.

- **Pros:**
  - Closes the four-phase honored-deferral lineage (Phase-10 Class B item 1 + Phase-12 Class B item 12 + Phase-13 Class B item 1 + Q58 lean #3) with a concrete architectural pin.
  - **No new public-data category introduced**: every public field on `/u/{handle}` is already public elsewhere (GitHub.com itself for `name` + `image` + `githubLogin`; problem-detail-page attribution for accepted challenges; problem.yaml `primary_curator` for curator-of-record).
  - Respects Phase-13's status-gated visibility verbatim: per-user aggregate counts inherit the same partition; no policy regression.
  - **Read-only Phase 14 keeps scope tight**: no writes surface; no new validation/sanitization burden; no XSS surface from user-controlled text fields. Phase 15+ writes can extend the contract incrementally.
  - **Case-preserved URLs match GitHub's pattern**: GitHub.com/BettyGuo and GitHub.com/bettyguo both resolve to the canonical-cased profile (case-insensitive routing; URL-case preserved in browser bar). Phase 14 mirrors this — no redirect overhead.
  - Curator-of-record case-sensitivity matches the file-system YAML's literal string semantics + ADR-0012 D-E's "join key is text-equal" framing. Phase 15+ may relax if observed mismatches accumulate.
  - SiteHeader split ("Your profile" → public, `/profile` → edit) is intuitive once the public surface exists; mirrors GitHub's nav pattern.
  - **Anticipates per-user privacy opt-out** (D-D Phase-15+ flag; Q64 candidate) without coupling it into Phase 14 scope.
  - **No new dependencies / env vars / DB migrations**. Stack stable; Phase 14 ships purely additive surfaces.
  - Scope cap honored: Phase 14 ships ~9 units; matches Phase 12's shape.

- **Cons:**
  - **No opt-out for Phase 14**: a signed-in GitHub user discovering they have a `/u/{login}` page they didn't ask for may want to hide it. Mitigation: every field on the page is already public at github.com; no NEW public data is created. Q64 candidate flagged for Phase 15+ if signal appears.
  - **No customization Phase 14**: power users may want a custom display name OR a bio. Phase 15+ writes surface (Q63 candidate) is the response.
  - **Case-sensitivity edge case on curator-of-record badge**: a curator with `editorial.primary_curator: BettyGuo` in YAML but `users.githubLogin = "bettyguo"` (or vice versa) gets no badge. Rare but possible. Mitigation: D-E lean adjusts to case-insensitive if pattern observed.
  - **`createdAt` joins-date exposure**: account-age signals seniority/recency on the platform. Marginal privacy implication; some users may prefer not to expose it. Phase 15+ opt-out (D-D) covers this.
  - **Aggregate counts don't link to detail**: `Watching N problems` shows the count but not the slug list. Phase 15+ could expose an opt-in watchlist visibility flag.

### Option 2: Full per-user-editable Phase 14 (name + image + bio writable)

Phase 14 ships writes from day one: edit-name + upload-or-link-image + bio textarea on `/profile`; `/u/{handle}` reads those custom values when set, falls back to GitHub-derived otherwise.

- **Pros:**
  - Single-phase delivery of the customization story.
  - User control over public display from launch.
  - Matches GitHub/Twitter/most-social patterns.

- **Cons:**
  - Doubles Phase 14 scope: requires writes surface (`POST /api/v1/profile/edit` or server actions) + new DB columns (`users.displayName`, `users.bio`, possibly `users.imageOverride`) + new migration + validation (length caps; XSS sanitization on bio).
  - **Image upload pipeline** requires Vercel Blob OR S3 OR similar storage + ADR; not in Phase 14 scope.
  - **OR** image override via URL adds an external-URL validation surface (CORS preload? URL allowlist?); messy.
  - Bio text introduces user-controlled markdown/text surface; new XSS audit needed; Phase-14 scope blow-out.
  - **Phase-15+ scope is the natural home** for the writes surface. ADR-0015 in this option becomes a heavyweight ADR spanning two architectural concerns (privacy + writes) instead of one.
  - Honored-deferral discipline: Phase 14's read-only delivery still closes the four-phase lineage; user-editability is a separate question that benefits from delivery feedback on the read-only version first.

### Option 3: Opt-in public profile (default private)

`/u/{handle}` returns 404 by default; users explicitly opt-in via a toggle on `/profile`. Public surface only renders for opted-in users.

- **Pros:**
  - Maximum default privacy.
  - Matches "GDPR conservative" intuition.
  - Per-user choice baked in.

- **Cons:**
  - **No new public-data category is introduced by Phase 14** (Option 1 framing). Defaulting to opt-out for data that's already public at GitHub.com is over-conservative — like making my GitHub repo's README hidden by default.
  - Adds a `users.profilePublic` boolean column + migration + writes surface + new validation. Scope blow-out.
  - Breaks Phase-13 Unit 13.3 D-13's `@login`-link future: per-problem listing's `@login` link would 404 on opted-out users; UX papercut. Mitigation: render `@login` as plain text for opted-out — but that defeats Phase 14's "close the dangling link" goal.
  - Curator-of-record badge has nowhere to live if curators opt out — but `editorial.primary_curator` is itself public via problem.yaml + RSS feeds. The badge would just be a public-vs-public surface; opt-out doesn't change the underlying public data.
  - Premature without observed opt-out signal. Q64 candidate is the right vehicle: ship Option 1; observe; promote to per-user opt-out if feedback warrants.

### Option 4: Per-user subdomain routing (`/[locale]/users/[handle]`) instead of `/u/[handle]`

Use the longer URL form.

- **Pros:**
  - Self-explanatory URL.
  - Matches `/papers/[id]` + `/authors/[slug]` + `/institutions/[slug]` shape.

- **Cons:**
  - `@login` references on listing pages would be visually unmoored from URL pattern.
  - `/u/{login}` matches GitHub's pattern (which the project's identity layer already inherits via ADR-0012). User intuition is preserved.
  - URL length: `/u/{login}` is dense and shareable; `/users/{handle}` adds 5 chars per share.
  - The `/authors/[slug]` route already exists for **paper authors** (different entity: file-system curated; not auth-derived). Sharing the `/users` namespace would conflate two distinct identity systems.
  - Aesthetic + brevity preference; not architecturally load-bearing. Lean: `/u/{handle}` per Phase-10 Class B item 1's original naming.

## Decision Outcome

**Chosen: Option 1 — GitHub-derived public + USER-STATE aggregate counts per Phase-13 partition + read-only Phase 14 + case-preserved-URL + curator-of-record case-sensitive.**

The decision pins six concrete contracts:

### D-A. Public-profile field partition

| Field | Source | Public? | Editable Phase 14? | Notes |
|---|---|---|---|---|
| `githubLogin` | `users.githubLogin` | **YES** | NO (immutable) | URL key; canonical case from GitHub OAuth profile. |
| `name` | `users.name` | **YES** | NO Phase 14 (Phase 15+) | From GitHub profile at sign-in via Auth.js v5. |
| `image` | `users.image` | **YES** | NO Phase 14 (Phase 15+) | GitHub avatar URL; rendered as bare `<img>` per Phase-10 Unit 10.2 D-10 precedent. |
| `createdAt` | `users.createdAt` | **YES** | N/A | Join-date signal; rendered as "Member since {date}". |
| watchlist count | `watchlist` aggregate (COUNT by `userId`) | **YES** | N/A | "Watching N problems". List of slugs NOT exposed Phase 14. |
| submitted-challenge count | `ratingChallenge` aggregate (status='submitted'∪'under_review') | **YES** | N/A | "N pending challenges". Mirrors Phase-13 public partition. |
| accepted-challenge count | `ratingChallenge` aggregate (status='accepted') | **YES** | N/A | "M accepted challenges". |
| **rejected count** | `ratingChallenge` aggregate (status='rejected') | **NO** (submitter-only) | N/A | Per Phase-13 Unit 13.0 D-3. |
| **withdrawn count** | `ratingChallenge` aggregate (status='withdrawn') | **NO** (submitter-only) | N/A | Per Phase-13 Unit 13.0 D-3. |
| **curator-of-record badge** | scan `content/problems/*/problem.yaml#editorial.primary_curator` | **YES** (when match exists) | N/A | First-class editorial-record attribution; rendered as a small badge. |
| `email` | `users.email` | **NO** | NO (forever) | Auth.js-internal; never surfaced anywhere. |
| `LOP_CURATOR_LOGINS` membership | env-var allowlist | **NO** (operational not editorial) | NO | Curator-of-record badge already shows editorial role; membership in the env-var allowlist is operational metadata that should NOT be public (e.g., a curator-trainee on the allowlist who hasn't yet authored a rating action has no public-facing editorial reason to be flagged). |

**Public-data invariant**: **no new public-data category is introduced by this ADR**. Every PUBLIC field on `/u/{handle}` is either (a) already public at github.com/{login}, (b) already public at problem-detail-page attribution / per-problem listing (Phase 13), OR (c) an aggregate count derived from already-public data with the same status partition as Phase 13.

**Per-status visibility partition**: inherits Phase-13's verbatim. Submitter-only surfaces (the user's own `/profile`) show all 5 status counts; public surface (`/u/{handle}` rendered to other viewers) shows only the 3 public statuses' aggregates.

**Email never surfaces**: even on the user's own `/profile`, email is not displayed publicly. (`/profile` may render email to the signed-in own user in Phase 15+ alongside an editable-email surface; not in scope here.)

**EXTENDED Phase 36 Unit 36.1 → 36.2** — Q64 per-user privacy opt-out **REALIZED** via new `users.profilePublic` boolean column (default `true` = public-by-default; backfills existing rows verbatim) + opt-out toggle UI on `/[locale]/profile` + `getPublicProfileByHandle` returns null when `profilePublic = false` → `/[locale]/u/{handle}` renders pure 404 (no friendly "private" notice; minimizes handle-existence information leakage per Phase-36-prep D-H). **Extension, not contradiction**: the public-data invariant above remains true _for users who choose to be public_; the opt-out is the user's right to opt out of that public surface entirely. Phase-37+ deferrals: granular per-surface opt-outs (per-problem watchlist visibility / per-challenge submission visibility / subscription visibility); friend-only profiles (vs strictly public/private); explicit-consent UX on first sign-in (vs public-by-default); opt-out audit trail; bulk CSV opt-out; friendlier "this profile is private" notice page. **First public-data-invariant exception** in project history — closes Q64 architectural carryover at **15+ phase carryover = longest open architectural Q in project history post-Q68 resolution**. **Tenth APPEND-pattern ADR D-clause cluster** in project history (ADR-0013 D-F + ADR-0018 D-G + ADR-0021 D-F + ADR-0022 D-D + ADR-0021 D-C + ADR-0023 D-H + ADR-0016 D-B + ADR-0017 D-H + ADR-0019 D-F + **ADR-0015 D-A** = 10 distinct D-clauses with APPENDs).

### D-B. Handle routing canonical case

URL: `/[locale]/u/[handle]` where `[handle]` is **case-preserved** (no rewrite). DB lookup is **case-insensitive** via `LOWER(githubLogin) = LOWER(?)`. **No redirect on case mismatch** — both `/u/BettyGuo` and `/u/bettyguo` render the same profile content; the URL case the user typed stays in the browser bar.

- **Why no redirect**: GitHub.com does the same — `github.com/BettyGuo` and `github.com/bettyguo` both render the canonical profile without bouncing through a redirect. Mirrors user intuition + saves a server round-trip.
- **Why case-insensitive lookup**: GitHub login registration is case-insensitive (you can't register both `BettyGuo` and `bettyguo`); `users.githubLogin` stores the case GitHub returned, which may differ from a user-typed link.
- **Why case-preserved URL**: respects the case the linker chose (preserves citability / archival fidelity); avoids "I shared `/u/BettyGuo` but the canonical is `/u/bettyguo`" social-link breakage.

**Edge case**: GitHub.com itself displays the canonical case from registration (which Auth.js v5 returns via `profile.login` populated by [ADR-0012](./0012-auth-provider.md) D-E's `events.linkAccount` callback). `users.githubLogin` therefore stores the canonical case. **Profile body always renders the canonical case** regardless of URL case (e.g., URL `/u/bettyguo` renders body header `@BettyGuo` if that's the canonical). User intuition: URL case is the link-time choice; rendered handle is the canonical identity.

### D-C. User-editable fields (Phase 15+ deferral)

Phase 14 ships **READ-ONLY public profile**. `users.name` + `users.image` are populated from the GitHub OAuth profile at sign-in via Auth.js v5; **no editing surface in Phase 14**.

**Phase 15+ deferred** (will require new ADR):

- Editable display name (`users.name` user-controlled with length cap + XSS sanitization).
- Editable bio (new `users.bio` column; migration; textarea on `/profile`; markdown rendering on `/u/{handle}`).
- Editable image override (new `users.imageOverride` column OR Vercel-Blob-backed upload pipeline; cross-origin image validation; ADR for storage choice).
- Editable display preference (e.g., "Show watchlist publicly" — couples to Q64 candidate).

**Why deferred**: writes surface doubles Phase 14 scope (validation + sanitization + new migration + image-upload pipeline ADR); read-only Phase 14 still closes the four-phase honored-deferral lineage; Phase 15+ writes can extend the contract incrementally with user-feedback data from Phase 14's read-only delivery.

**Anticipated Q63 candidate**: user-editable profile fields; promoted to Q63 if Phase 14 surfaces UX feedback about wanting custom names / bios.

### D-D. Per-user privacy opt-out (Phase 15+ flag; Q64 candidate)

Phase 14 ships **NO opt-out** — `/u/{handle}` renders for any user with a `users.githubLogin` value (which is every signed-in user post Unit 9.6's `events.linkAccount` callback).

**Rationale**: per D-A's public-data invariant, no NEW public-data category is introduced. The `/u/{handle}` surface is a unified rendering of data already public elsewhere. Defaulting to public-on (Option 1) is consistent with the existing public surface; defaulting to public-off (Option 3 rejected) would create the "I want to hide my GitHub profile from being mirrored" surface, which is a different conversation than this ADR pins.

**Phase 15+ deferred**: a `users.profilePublic` boolean column + opt-out toggle on `/profile` + 404 response on `/u/{handle}` when opted-out. Anticipated Q64 candidate; promote if usage signals demand.

**Pre-emptive mitigation**: Phase 14 ships a small "Why is this page public?" link in the page footer pointing to a future explainer at `/about/privacy` (Phase 15+) that documents the public-data invariant + the opt-out path. Phase 14 footer link target = `/about` for now (existing route); Phase 15+ expands the explainer.

### D-E. Curator-of-record badge case-sensitivity

`getCuratorOfRecordSlugs(handle)` compares the YAML `editorial.primary_curator` field against `handle` **case-sensitively**:

```ts
problems.filter(p => p.editorial.primary_curator === handle).map(p => p.slug);
```

- **Why case-sensitive**: matches the file-system YAML's literal string semantics. `editorial.primary_curator` is a curator-typed string; the canonical case is what the curator chose. Case-insensitive comparison would lose the editorial precision.
- **Match-criterion**: `handle` here is the **canonical case** from `users.githubLogin` (loaded by `getPublicProfileByHandle`), NOT the URL `[handle]` segment. So even if the URL is `/u/bettyguo` but `users.githubLogin = "BettyGuo"`, the badge compares `"BettyGuo"` against YAML.
- **Edge case**: YAML has `editorial.primary_curator: bettyguo` (lowercase) but `users.githubLogin = "BettyGuo"`. Comparison fails; no badge renders. Mitigation: curators should keep `editorial.primary_curator` in sync with their GitHub canonical case. ADR-0015 D-E may relax to case-insensitive if observed mismatches accumulate (Phase 15+ correction).

**Phase 15+ deferred**:
- Case-insensitive badge matching (single-line `.toLowerCase()` change; pure server-side).
- "Curated N problems" expansion link → `/u/{handle}/curated` per-curator activity page (Q65 candidate).

### D-F. SiteHeader integration shape

SiteHeader gets a **"Your profile" link** when signed-in. Target = `/u/{login}` (the PUBLIC canonical). The existing `/profile` becomes the **EDIT-mode surface**.

- **Display**: avatar (16×16 rounded) + `@login` truncated to 12 chars. Matches GitHub's nav pattern. Hidden when `users.githubLogin === null` (Phase-9 retrofit edge from Unit 9.6's deferred `events.linkAccount` on prior sign-ins).
- **Placement**: between the "Trending" nav link and the right-side controls (search + locale + theme + auth). Renders inline with primary nav for discovery.
- **`/profile` vs `/u/{login}` semantics**:
  - `/profile` = signed-in own-state surface (watchlist + own challenges + sign-out + Phase-15+ edit fields).
  - `/u/{login}` = public profile (anyone can view; aggregates only; no edit affordances unless `session.user.id === profile.userId` in which case render "Edit your profile" CTA → `/profile`).
- **Empty-state behaviour**: a signed-in user viewing their own `/u/{login}` with no activity sees the "@login hasn't watched any problems or submitted any challenges yet" + an "Edit your profile" CTA → `/profile`.

**Phase 15+ deferred**:
- Avatar dropdown with name + login + sign-out (overkill for v1; AuthControl already handles sign-out).
- "Your profile" link on mobile nav (Phase 14 lean: desktop-first; mobile adopts SiteHeader's existing `hidden sm:flex` pattern).

## Consequences

### Positive

- **Closes the four-phase honored-deferral lineage** (Phase-10 Class B item 1 + Phase-12 Class B item 12 + Phase-13 Class B item 1 + Q58 lean #3).
- **Closes Phase-13 Unit 13.3's dangling `@login` plain-text link target** via Unit 14.4's per-problem-listing `@login`-to-Link upgrade.
- **No new public-data category** introduced (per D-A invariant). Every public field is mirror-of-already-public-data.
- **Status-gated visibility partition preserved**: Phase-14 aggregate counts inherit Phase-13's `submitted ∪ under_review ∪ accepted` public / `rejected ∪ withdrawn` submitter-only partition verbatim.
- **Read-only Phase 14 keeps scope tight**: no writes surface; no new validation/sanitization burden; no XSS surface from user-controlled text fields.
- **Phase 14 ships NO new dependencies / env vars / DB migrations**. Stack stable.
- **First Load JS unchanged**: server-rendered surfaces; zero client-bundle delta anticipated.
- **§5.7 trigger unchanged** (no new tables; no ALTERs).
- **Read-side mirror of Phase-12 COI write-side**: Phase-12 ADR-0014 D-C's "curator = submitter hard block" is reinforced by Phase-14's public attribution surface — readers can verify that the curator (per problem.yaml + rating-action YAML) is NOT the submitter (per `/u/{handle}`'s "@login submitted N challenges" surface).
- **Anticipates Phase 15+ extension**: opt-out (D-D / Q64), user-editability (D-C / Q63), per-curator activity feed (D-E expansion / Q65) are all flagged but not promoted. Three Phase-15+ ADR candidates are surfaced and bounded.
- **Establishes the "first per-USER read-side public surface" pattern** — Phase 14's shell + sub-route framework will be inherited by future per-user surfaces (per-user contributions; per-user activity timeline; per-curator dashboard view).

### Negative

- **No opt-out for Phase 14**: users discovering `/u/{login}` without opt-in may want to hide. Mitigation: every field is already public; Q64 promotion path documented.
- **No customization Phase 14**: power users wanting custom names / bios deferred Q63 to Phase 15+. Mitigation: read-only delivery still closes the four-phase lineage; UX feedback informs Phase 15+ writes surface.
- **Case-sensitivity edge on curator-of-record badge**: a YAML/GitHub case mismatch silently skips the badge. Mitigation: D-E lean adjusts case-insensitive if observed.
- **`createdAt` exposure** signals account-age. Marginal privacy; Q64 opt-out covers if signal appears.
- **`/profile` vs `/u/{login}` may confuse signed-in users initially**: two surfaces for the same identity, one editable, one not. Mitigation: SiteHeader "Your profile" link surfaces `/u/{login}` as canonical; `/profile` accessible via "Edit your profile" CTA from the public surface; existing `/profile` link in auth-control dropdown stays. Phase 14 UX is admittedly transitional until Phase 15+ writes consolidate the editable affordances.
- **Aggregate-only counts** don't link to detail: `Watching N problems` shows count without slug list. Phase 15+ opt-in flag (D-D adjacent) can promote.
- **One new ADR claims the ADR-0015 slot** — the subscriber-list-email alternative path becomes ADR-0016+ if Phase 15+ picks it. Acceptable cost; ADR-0015 vs ADR-0016 enumeration ordering is not load-bearing.

## Cross-references

- **§3.1** "ratings are revisable" framing (this ADR adds the per-user read-side attribution surface that closes the editorial chain).
- **§8.6** COI policy spirit (this ADR's D-A surfaces submitter identity for COI auditability; mirrors ADR-0014 D-C write-side block).
- **§13** editorial workflow (this ADR's D-A + D-E preserve curator-of-record attribution chain from problem.yaml → rating-action YAML → `/u/{handle}` badge).
- **§14.4** CHANGELOG + ADR contract.
- **§15.5** reviewer-mode mindset (applied throughout deliberation; driver for `email` exclusion + `rejected/withdrawn` privacy + `createdAt` exposure trade-off).
- **[ADR-0004](./0004-file-first-no-db.md)** file-first / no-DB-for-content (preserved — D-E reads `editorial.primary_curator` from YAML; no DB-side mirror).
- **[ADR-0011](./0011-i18n-strategy.md)** i18n strategy (Phase 14's new `messages.public_profile.*` namespace follows the established sibling-file convention).
- **[ADR-0012](./0012-auth-provider.md)** auth provider (D-E `users.githubLogin` joining + D-D redirect-to-provider UX — both prerequisites; this ADR's D-F SiteHeader integration extends D-D's signed-in branch).
- **[ADR-0013](./0013-db-choice.md)** DB choice (D-F USER-STATE-only respected — Phase 14 reads aggregates, writes nothing).
- **[ADR-0014](./0014-curator-review-pipeline.md)** curator review pipeline (D-A state machine drives D-A's per-status partition; D-C simplified COI mirrored on read side by D-A's badge surface; D-D manual emission's `acceptedActionId` attribute is referenced on the public surface).
- **[OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance)** (open; editorial-governance future — Phase 14+ alongside `curatorRoles` table promotion; couples to D-D opt-out + future curator-specific surfaces).
- **[OPEN_QUESTIONS Q58](../../OPEN_QUESTIONS.md#q58-rating-challenge-visibility-to-non-author-users)** (resolved Phase 13; this ADR's D-A inherits the per-status partition verbatim; closes Q58 lean #3 deferred from Unit 13.0 D-9 + Unit 13.5).
- **[Phase-13 Unit 13.0 prep](../thinking/13.0-phase-13-prep.md)** D-3 (per-status visibility policy; this ADR's D-A inherits).
- **[Phase-13 Unit 13.3](../thinking/13.0-phase-13-prep.md) D-13** (submitter-login linking deferred to Phase 14+; this ADR's D-A + Unit 14.4 close the seam).
- **[Unit 14.0 prep](../thinking/14.0-phase-14-prep.md)** D-1 through D-13 (the Phase-14 thread recommendation + decision ledger this ADR pins).
- **Phase-9 Class B item 12** middleware-based auth-route protection (unaffected — `/u/{handle}` is NOT auth-protected; protected-route count stays at 2).
- **Phase-15+ Q63 candidate** (user-editable profile fields; D-C deferral).
- **Phase-15+ Q64 candidate** (per-user privacy opt-out toggle; D-D deferral).
- **Phase-15+ Q65 candidate** (per-curator activity feed / contribution timeline; D-E expansion).
