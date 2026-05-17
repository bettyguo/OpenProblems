# ADR-0020 — Multi-provider OAuth expansion (Google as the second provider; lifts ADR-0012 D-B single-provider restriction)

- **Status:** accepted
- **Date authored:** 2026-05-17
- **Date accepted:** 2026-05-17
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes (partial):** [ADR-0012](./0012-auth-provider.md) D-B (single-provider restriction lifted; ADR-0012's other four D-clauses preserved)
- **Superseded by:** —

## Context and Problem Statement

Phase 9 ([ADR-0012](./0012-auth-provider.md)) shipped NextAuth.js v5 + GitHub OAuth + Drizzle adapter + DB-backed sessions. ADR-0012 D-B explicitly pinned **GitHub OAuth as the ONLY initial provider** and made multi-provider expansion *"forbidden in Phase 9. Future expansion lands as a follow-on ADR or an explicit Q-promotion."*

Phase 28's keystone thread per [Unit 28.0 D-1](../thinking/28.0-phase-28-prep.md) is **multi-provider OAuth expansion** — Phase-9 Class B item 8 carried **17 phases** since Phase 9 closed (the strongest non-multi-phase architectural patience signal in the project). Phase 28 picks the thread up:

1. **Reverses ADR-0012 D-B's single-provider restriction.** The "Phase 9 scope cap" objection was about not over-engineering before the first sign-in flow worked; eighteen NON-§13 phases later the sign-in flow is mature, tested, and integrated across 5+ surfaces. Multi-provider expansion is now under-engineering relative to the rest of the project's maturity.
2. **Closes the ADR-0020 slot at 14 phases unclaimed** (since ADR-0019 shipped Phase 19). Each new operational-script-keystone phase (Phase 20-25) + each inheritance-pattern phase (Phase 26-27) deferred the slot. Phase 28 claims it.
3. **Broadens the user base** to non-GitHub identity holders. Academic users especially carry institutional Google accounts but not necessarily GitHub accounts; the project's curator community is GitHub-native (per `/contributing` v1.x §1) but the broader submitter community per Phase 11+ rating-challenge submission is not constrained to GitHub.
4. **Preserves the curator-of-record model.** File-system `editorial.primary_curator` (per [ADR-0005](./0005-rating-action-immutability.md) + [ADR-0012](./0012-auth-provider.md) D-E) joins to `users.githubLogin`, which is populated only via the GitHub `linkAccount` event. Non-GitHub users CAN submit challenges + edit their profile but CANNOT be a curator-of-record in Phase 28. This boundary is preserved deliberately; widening it is [Q74](../../OPEN_QUESTIONS.md#q74-non-github-users-as-curators) for Phase 29+.

Decisions to pin in this ADR:

1. **Multi-provider runtime contract.** What's allowed in `providers: [...]`? What's still forbidden?
2. **Which provider as the second?** Google, GitLab, email-link, passkeys?
3. **Env-var naming convention.** Match Auth.js v5 canonical naming?
4. **Curator-of-record gate.** Does the second provider also populate `users.githubLogin`? Are non-GitHub users eligible to be curators?
5. **Account-linking strategy.** Same-email-different-provider = same user, or two separate users?
6. **Sign-in UX.** Chooser modal, per-provider buttons, or dropdown?

[Q73 candidate](../thinking/28.0-phase-28-prep.md) (operational gate for Google OAuth registration) lands alongside this ADR as a Q-promotion in Unit 28.4. This ADR closes the architectural sub-questions by pinning each concretely.

## Decision Drivers

- **§5.8** auth recommendation (Clerk or NextAuth.js v5; GitHub OAuth "strongly preferred for community signal" — but does not preclude additional providers).
- **[ADR-0012](./0012-auth-provider.md) D-A** runtime singleton: NextAuth.js v5 is the only auth runtime; Phase 28 stays inside this constraint by adding a `next-auth/providers/google` adapter, not a new runtime.
- **[ADR-0012](./0012-auth-provider.md) D-B** single-provider restriction: explicitly the surface this ADR lifts.
- **[ADR-0012](./0012-auth-provider.md) D-E** editorial-identity model: GitHub-login-keyed; Phase 28 preserves this. Q74 surfaces the non-GitHub-curator question without resolving it.
- **[ADR-0013](./0013-db-choice.md)** Drizzle + Auth.js adapter: `accounts` table already supports multi-provider per the canonical adapter schema (one row per `(provider, providerAccountId)`); zero migration work for Phase 28.
- **Reversibility.** `lib/auth/index.ts` abstracts the runtime; adding/removing providers is a one-config-block edit per provider (no consumer-side refactor).
- **Phase-9 "pre-emptive for non-existent user base" objection has 7+ phases of receipts.** At each prior phase (Phase 20-27), deferral was defensible because Q54/Q55/Q69 operational gates were pending. But: (a) the deferral cost grows linearly each phase; (b) planning the architectural surface BEFORE deployment unblocks the deploy + user-acquisition timeline from multi-provider work; (c) Q54 already names "GitHub OAuth registration" as operational — broadening to multi-provider lets the curator confront the OAuth surface uniformly.
- **§14.4** CHANGELOG + ADR contract: pin the choice with Pros/Cons before code lands.

## Considered Options

### Option 1: NextAuth.js Google provider (chosen as the second provider)

Add `next-auth/providers/google` as the second entry in the `providers: [...]` array. Reuse Auth.js v5's canonical env-var convention (`AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET`).

- **Pros:**
  - Broadest reach among non-GitHub users (academic users especially have Google accounts via institutional emails).
  - Mature `next-auth/providers/google` adapter; widely tested.
  - Free OAuth registration via Google Cloud Console.
  - Strong identity guarantees (Google verifies email ownership).
  - Auth.js v5 default profile field mapping (Google `name` → `user.name`; Google `email` → `user.email`; Google `picture` → `user.image`) works out of the box.
- **Cons:**
  - Google OAuth registration requires a Google Cloud Console project (operational gate Q73).
  - Privacy posture differs from GitHub: Google profiles carry mandatory email; GitHub allows private emails (Phase-9 implementation handles both via Auth.js defaults).
  - Account-linking semantics (same email = same user vs separate users) require explicit decision per ADR-0020 D-E below.

### Option 2: GitLab as the second provider

Add `next-auth/providers/gitlab`. Closer to GitHub identity model (academic-Git users overlap heavily); smaller user base.

- **Pros:**
  - Identity model nearly identical to GitHub (login handle + email + avatar).
  - Could populate a `gitlabLogin` field analogous to `githubLogin` — natural curator-eligibility path forward (less drift in editorial-identity semantics).
- **Cons:**
  - Significantly smaller user base than Google.
  - Most users with GitLab also have GitHub (low marginal value).
  - Phase 29+ candidate (would extend `editorial.primary_curator` semantics; bigger downstream change than Google).

### Option 3: Email-link (passwordless) as the second provider

Add Auth.js's `Email` provider (sends magic links via SMTP).

- **Pros:**
  - Broadest possible reach (anyone with an email address).
  - No third-party OAuth flow.
- **Cons:**
  - Requires SMTP infrastructure (provider integration — SendGrid / Postmark / AWS SES; new env vars; operational gate).
  - Multi-phase scope (foundation + verification flow + template authoring + rate-limiting).
  - Phase 29+ candidate if email-link demand surfaces.

### Option 4: WebAuthn / passkeys as the second provider

Add Auth.js's `Passkey` provider (WebAuthn-based).

- **Pros:**
  - Strongest security posture (no shared secret; phishing-resistant).
  - Aligned with modern auth direction.
- **Cons:**
  - Browser support uneven (older browsers / managed enterprise environments unreliable).
  - User-facing complexity (passkey enrollment UX still maturing).
  - Multi-phase scope to ship well.
  - Phase 30+ candidate.

### Option 5: Defer multi-provider expansion (continue Phase 28 with a different thread)

Pick one of A (Q68 expansion content moderation), I (subscriber-list email), or K-other (operational tail) instead.

- **Pros:**
  - Maintains Phase-20-27 single-author Github-only auth posture for one more phase.
  - Each alternative thread has its own merits (especially I — 21+ phase patience signal).
- **Cons:**
  - Defers the strongest non-multi-phase architectural patience signal further.
  - ADR-0020 slot stays unclaimed for a 15th phase.
  - The "pre-emptive for non-existent user base" objection has 7+ phases of receipts; each deferral compounds the cost.

## Decision Outcome

**Chosen: Option 1 — NextAuth.js Google provider as the second provider.**

The decision pins six concrete contracts:

### D-A. Multi-provider runtime contract

`next-auth/providers/*` adapters are now allowed in the `providers: [...]` array of `NextAuth({...})`. Adding a new provider is a one-config-block edit (one import + one entry in the providers array + two env vars).

Other auth runtimes (Clerk SDK, Lucia, Iron Session, etc.) remain **forbidden** per [ADR-0012 D-A](./0012-auth-provider.md#d-a-runtime--nextauthjs-v5-authjs). This ADR widens the *providers* surface, not the *runtime* surface.

[ADR-0012 D-B](./0012-auth-provider.md#d-b-identity-provider--github-oauth-initially-the-only-provider)'s single-provider restriction is **explicitly lifted** by this ADR.

### D-B. Second provider = Google OAuth

The `providers: [...]` array in `NextAuth({...})` contains exactly two entries at Phase 28 close:

```ts
providers: [GitHub, Google],
```

- **Ordering**: GitHub first, Google second. Preserves Phase-9 user expectation; rendering order in the sign-in UI matches.
- **Phase 28 ships exactly 2 providers.** Adding a third (GitLab, email-link, passkeys, etc.) requires a follow-on ADR amendment or an explicit new ADR. The "no third provider without ADR" rule mirrors ADR-0012 D-B's spirit at the new boundary.

### D-C. Env-var convention

Auth.js v5 canonical naming (`AUTH_<PROVIDER>_ID` + `AUTH_<PROVIDER>_SECRET`) per ADR-0012 D-A precedent. Phase 28 adds:

```
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
```

Env-var count 7 → 9. `.env.example` extends with a Phase-28 Auth multi-provider block (mirrors Phase-9's GitHub OAuth block shape; Q73 operational gate cross-referenced).

When `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are unset, the Google provider treats `clientId`/`clientSecret` as undefined; the sign-in flow surfaces an OAuth-configuration error to the user (mirrors Phase 9 / Q54 graceful-degradation for GitHub). SiteHeader's `safeAuth()` catches any DB-read failure and passes `session = null`, so the signed-out branch always renders.

### D-D. Curator-of-record gate remains GitHub-only

File-system `editorial.primary_curator` (per [ADR-0005](./0005-rating-action-immutability.md) + [ADR-0012 D-E](./0012-auth-provider.md#d-e-user-identity-model)) joins to `users.githubLogin`. The `linkAccount` event in `lib/auth/index.ts` populates `githubLogin` **only when `account.provider === "github"`** — Phase-9 Unit 9.6 verbatim, preserved in Phase 28.

**Non-GitHub users (Google-only) cannot be a curator-of-record in Phase 28.** They can:
- Sign in via Google OAuth.
- Submit rating challenges (Phase 11+ submission flow).
- Edit their profile (display name, bio, image override per Phase 15-19).
- View public surfaces (Phase 13+ public visibility).

They cannot:
- Be named as `primary_curator` on a rating-action YAML.
- Review challenges via `/curator/...` routes (Phase-12 `LOP_CURATOR_LOGINS` env var contains GitHub logins).
- Appear as the reviewer on Phase-26 detail page acceptance metadata.

Widening curator eligibility to non-GitHub users is [Q74](../../OPEN_QUESTIONS.md#q74-non-github-users-as-curators) (architectural; Phase 29+ if curator demand surfaces). It would require either: (a) a non-GitHub editorial-identity field on `users`; (b) a username-claim mechanism; (c) widening `editorial.primary_curator` schema to accept non-GitHub identities.

### D-E. Account-linking strategy = Auth.js default (no dangerous email linking)

The `NextAuth({...})` config sets `allowDangerousEmailAccountLinking: false` (Auth.js default). Users who sign in once with GitHub then later with Google **using the same email** get **two separate `users.id` rows** (one per provider; one `accounts` row each).

Rationale:
- **Security posture.** Auth.js recommends `false` because automatic email-based account linking is vulnerable if either provider's email verification is weaker than expected (e.g., a takeover at the email provider could lead to account compromise on the destination provider).
- **Editorial-identity simplicity.** `users.githubLogin` is populated only via the GitHub `linkAccount` event; same-email cross-provider linking would muddy the curator-identity semantics.
- **Phase 29+ account-merge UI.** If curator-reported confusion about "I signed in with both — why two profiles?" surfaces, Phase 29+ can add a per-user account-merge flow (user-initiated, not automatic).

### D-F. Sign-in UX = per-provider buttons

`components/auth-control/index.tsx` renders one `<form>` per provider in the signed-out branch:

- Stacked vertically on mobile; side-by-side on `sm:` breakpoint.
- Each button shows the provider name via i18n: "Sign in with GitHub" / "Sign in with Google".
- Each form posts to the respective `/api/auth/signin/<provider>` route.
- No chooser modal; no dropdown menu.

The existing `auth.sign_in` i18n key (plain "Sign in") is retained as the aria-label for the form group; per-provider strings (`auth.sign_in_with_github` + `auth.sign_in_with_google`) are new.

Mirrors [ADR-0012 D-D](./0012-auth-provider.md#d-d-sign-in-ux--redirect-to-provider-no-modal)'s redirect-to-provider pattern verbatim per provider. When the project's provider list grows beyond 3, a chooser-modal pattern may be re-introduced (deferred to Phase 30+ if signal). Signed-in branch unchanged.

## Consequences

### Positive

- **Broadens user base** without compromising curator-eligibility model. Non-GitHub users can participate in submission + profile editing + public viewing surfaces.
- **Closes the strongest non-multi-phase architectural patience signal.** Phase-9 Class B item 8 carried 17 phases; deferring further compounds cost.
- **Reuses Auth.js v5 idioms.** No new runtime; one config-block edit; canonical env-var naming.
- **Zero schema migration cost.** `accounts` table already supports multi-provider; `users.githubLogin` stays nullable.
- **Reversibility preserved.** Removing Google later is a one-line edit (remove from `providers: [...]` + env vars).
- **Account-linking conservatism.** `allowDangerousEmailAccountLinking: false` avoids the email-provider-takeover attack surface.
- **Per-provider UX clarity.** Users see explicit buttons; no surprise about which provider they're authenticating with.

### Negative

- **Operational gate for Google OAuth registration** (Q73). Two Google Cloud Console projects recommended: one for production, one for local dev.
- **Two `users.id` rows for same-email cross-provider users** (Auth.js default). Documented as accepted trade-off; Phase 29+ account-merge UI candidate if curator confusion surfaces.
- **Non-GitHub users blocked from curator-of-record.** Acceptable in Phase 28; Q74 reserved for Phase 29+ if curator demand widens.
- **Env-var count grows 7 → 9.** Marginal operational complexity; mirrors Phase-9 + Phase-16 env-var-additions pattern.
- **Sign-in UI takes more vertical space.** Mitigated by `sm:` side-by-side layout; mobile users see a stacked layout that fits within existing SiteHeader.
- **Configuration-as-code grows linearly with providers.** Acceptable for the foreseeable 2-3 provider count; if the list grows large, a config-table-driven approach (env-driven provider registration) may be introduced (Phase 30+).

## Cross-references

- **[ADR-0012](./0012-auth-provider.md)** auth provider runtime choice (NextAuth.js v5 + GitHub OAuth + Drizzle adapter). D-B's single-provider restriction is **lifted** by this ADR; D-A / D-C / D-D / D-E preserved. ADR-0012 receives an APPEND-not-EDIT Phase-28 amendment note in Unit 28.4 documenting D-B's supersession.
- **[ADR-0005](./0005-rating-action-immutability.md)** rating-action immutability + curator-of-record (`editorial.primary_curator` joins to `users.githubLogin`; Phase 28 preserves this).
- **[ADR-0013](./0013-db-choice.md)** Turso + Drizzle. `accounts` table multi-provider support is the canonical Auth.js v5 adapter shape; zero schema migration Phase 28.
- **[OPEN_QUESTIONS Q54](../../OPEN_QUESTIONS.md#q54-github-oauth-app-registration)** (operational; Phase 28 does not resolve — GitHub OAuth registration still pending; Q54 carries forward).
- **[OPEN_QUESTIONS Q73](../../OPEN_QUESTIONS.md#q73-google-oauth-app-registration)** (NEW operational; surfaced Phase 28; mirrors Q54 shape).
- **[OPEN_QUESTIONS Q74](../../OPEN_QUESTIONS.md#q74-non-github-users-as-curators)** (NEW architectural; surfaced Phase 28; Phase 29+ if curator demand).
- **§5.8** auth recommendation (Clerk or NextAuth.js v5; GitHub OAuth preferred for community signal — preserved as the first provider).
- **§13** Phase-6+ deliverables list ("Read+write API with token auth" — closed Phase 9; Phase 28 widens the auth surface but is inferred-not-§13).
- **MASTER_PROMPT.md §14.4** ADR + CHANGELOG contract: pin choice with Pros/Cons before code lands.
