# ADR-0012 — Auth provider: NextAuth.js v5 + GitHub OAuth

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §13 names "read+write API with token auth" as the third Phase-6+ thread (Phase 6 closed Discussions; Phase 7 + 8 closed Bilingual). Phase 9 pulls this last §13 thread per [Unit 9.0 prep](../thinking/9.0-phase-9-prep.md) D-1.

§5.8 lists "Clerk or NextAuth.js v5 when needed. GitHub OAuth strongly preferred for community signal." This ADR closes the provider choice before any auth code lands.

Decisions to pin:

1. **Which auth runtime?** Clerk (SaaS), NextAuth.js v5 / Auth.js (open-source library), or GitHub OAuth direct (we own the OAuth flow).
2. **Which identity provider(s) initially?** GitHub OAuth only, or GitHub + Google + email-link, or hand-rolled JWT?
3. **Session storage strategy?** Database-backed (Drizzle adapter) or JWT-only sessions.
4. **Sign-in UX?** Redirect to provider, modal, or popup?

[OPEN_QUESTIONS Q54](../../OPEN_QUESTIONS.md#q54-github-oauth-app-registration) (operational gate; surfaced Unit 9.0) is downstream — once this ADR pins GitHub OAuth as the provider, Q54 names the operational unblock.

## Decision Drivers

- **§5.8** explicit recommendation: Clerk OR NextAuth.js v5; GitHub OAuth preferred for community signal.
- **§5.7** data-layer rule: write paths trigger the DB migration. Auth's user / session tables ride alongside.
- **ADR-0004** file-first / no-DB-for-content posture. Auth lands a DB layer but ONLY for user-state (sessions, user identity, future watchlist + rating-challenge drafts). Content stays file-first.
- **§3 brand & operator familiarity.** Every existing curator + contributor has a GitHub account (per `/contributing` v1.x §1). GitHub OAuth aligns with the community.
- **Reversibility.** `lib/auth/` will abstract the runtime calls behind a thin wrapper; switching providers later should be one-file edits, not a refactor (mirroring [ADR-0010](./0010-discussions-backend.md) + [ADR-0011](./0011-i18n-strategy.md) precedent).
- **SaaS lock-in vs first-party data.** Clerk's user records live in Clerk's DB; NextAuth.js stores them in OUR DB. The latter is more auditable + portable + free.
- **Phase 9 scope cap** (per Unit 9.0 D-5): one write-path (watchlist). Provider needs to handle the simplest flow well; multi-provider expansion is Phase 10+.
- **§14.4** CHANGELOG + ADR contract: pin the choice with Pros/Cons before code lands.

## Considered Options

### Option 1: NextAuth.js v5 (Auth.js) + GitHub OAuth + Drizzle adapter (chosen)

[NextAuth.js v5](https://authjs.dev) is the open-source App Router-compatible auth library; provider abstraction (GitHub, Google, email-link, etc.); Drizzle adapter mature; runs as a Next.js route handler (`app/api/auth/[...nextauth]/route.ts`).

- **Pros:**
  - §5.8 explicitly lists NextAuth.js v5 as a candidate.
  - Free; no SaaS pricing curve.
  - User records live in our Drizzle DB (see [ADR-0013](./0013-db-choice.md)) — full data ownership; portable to any DB.
  - Drizzle adapter is well-supported (v5 schema mature).
  - App Router-native (route handler + `auth()` server helper).
  - Multi-provider expansion is one config block per provider (not a rewrite).
  - Community-canonical for self-hosted Next.js apps.
- **Cons:**
  - More wiring than Clerk (we build sign-in UI components).
  - We own session storage (DB-backed; extra read per request).
  - Provider configuration lives in code (env vars + `lib/auth/`); SaaS dashboards offer easier UX.
  - V5 is still tagged `beta` in some channels (5.0 stable released; still maturing).

### Option 2: Clerk SaaS

[Clerk](https://clerk.com) is a SaaS auth provider with drop-in React components (`<SignIn />`, `<UserButton />`).

- **Pros:**
  - Fastest wiring (drop-in components).
  - Multi-provider OAuth out-of-box.
  - Managed user store (no DB schema work for user identity).
  - Strong DX; well-documented App Router integration.
  - Free tier 10k MAU.
- **Cons:**
  - User data lives in Clerk's DB — separate from our DB (cross-table joins become Clerk-API-call-shaped, not SQL-shaped).
  - SaaS pricing curve at scale (paid tiers ~$0.02/MAU after the free tier).
  - Vendor lock-in (migrating away is a user-export-and-re-onboard exercise).
  - Less control over the sign-in flow's surface (Clerk-hosted UI vs ours).
  - Doesn't align with §5.7's "file-first / no-DB-for-content" ethos as cleanly — auth state lives in a third-party DB instead of ours.

### Option 3: GitHub OAuth direct

Implement OAuth 2.0 flow ourselves against GitHub's `/login/oauth/authorize` + `/login/oauth/access_token` endpoints; store sessions in our DB.

- **Pros:**
  - Minimal abstraction (no third-party library beyond GitHub itself).
  - Zero new runtime dependency.
  - Community-signal-rich (GitHub-only matches the curator community).
- **Cons:**
  - We own EVERYTHING: OAuth state, CSRF tokens, session refresh, sign-out cleanup, multi-provider expansion (would require re-implementation).
  - Higher per-unit complexity (Phase-9 unit count expands by 2-3 to cover OAuth flow + session management).
  - No multi-provider expansion path without rewrite.
  - Security audit surface is ours (every CSRF / state-mismatch / replay-attack defense is on us).

### Option 4: No auth (defer Phase 9)

Push the auth thread to Phase 10+; ship subscriber-list (third-party) or HTML shell migration as Phase 9 instead.

- **Pros:**
  - Defers the §5.7 DB-trigger flip further.
  - Smaller phase scope.
- **Cons:**
  - Closes nothing on §13 (auth is the last Phase-6+ thread).
  - Postpones the architectural commitment indefinitely.
  - DB trigger has been deferred 5 phases in a row already; further deferral is technical-debt accumulation.
  - Doesn't address the project's "read+write API with token auth" §13 deliverable.

## Decision Outcome

**Chosen: Option 1 — NextAuth.js v5 + GitHub OAuth + Drizzle adapter.**

The decision pins five concrete contracts:

### D-A. Runtime = NextAuth.js v5 (Auth.js)

[`next-auth@^5`](https://authjs.dev) is the only auth runtime dependency in `package.json` (`dependencies`, not `devDependencies` — runtime import). Other auth libraries (Clerk SDK, Lucia, Iron Session, etc.) are **forbidden** from landing in `dependencies` or `devDependencies` until a follow-on ADR explicitly authorises multi-runtime work. Pin via `^5.x`.

The `Auth.js` brand is the v5 rebrand of NextAuth.js; the package name remains `next-auth` for backward compatibility. We use the new `auth()` server helper + the new route-handler signature (`app/api/auth/[...nextauth]/route.ts` re-exports `handlers.GET` + `handlers.POST`).

Configuration lives in `lib/auth/index.ts` exporting `{ auth, handlers, signIn, signOut }` from a single `NextAuth({...})` call.

### D-B. Identity provider = GitHub OAuth (initially the ONLY provider)

The `providers` array in `NextAuth({...})` contains a single entry: `GitHub({ clientId: process.env.GITHUB_CLIENT_ID, clientSecret: process.env.GITHUB_CLIENT_SECRET })`.

Multi-provider expansion (Google, GitLab, email-link, etc.) is **forbidden in Phase 9**. Future expansion lands as a follow-on ADR or an explicit Q-promotion.

GitHub OAuth is "strongly preferred for community signal" per §5.8. Every curator + contributor has a GitHub account (the existing Phase-6 Discussions integration assumes this; per `/contributing` v1.x §1 templates).

OAuth app registration is the operational unblock surfaced as [Q54](../../OPEN_QUESTIONS.md#q54-github-oauth-app-registration).

### D-C. Session strategy = database-backed (Drizzle adapter)

The `adapter` field of `NextAuth({...})` is `DrizzleAdapter(db, { usersTable, accountsTable, sessionsTable, verificationTokensTable })`. Session records live in the `sessions` Drizzle table; the cookie holds the session ID; server-side `auth()` reads the DB on each request.

JWT-only sessions are **forbidden** in Phase 9. Trade-off: extra DB read per `auth()` call vs revocability + auditability + simpler rotation. Per Unit 9.0 D-6 lean.

### D-D. Sign-in UX = redirect-to-provider (no modal)

Sign-in flow:

1. User clicks "Sign in" in SiteHeader → navigates to `/api/auth/signin/github` (NextAuth.js v5 route).
2. NextAuth.js redirects to `https://github.com/login/oauth/authorize?client_id=...&state=...&redirect_uri=...`.
3. User authorizes on github.com.
4. GitHub redirects to `/api/auth/callback/github?code=...&state=...`.
5. NextAuth.js exchanges the code for an access token + user profile; persists the user + session via Drizzle adapter; redirects to the original page.

No modal sign-in UI. No popup sign-in UI. The full-page redirect flow is the standard, accessibility-friendly default; popup/modal flows would add UI complexity for marginal UX gain. Mirrors the ADR-0010 D-A "use the canonical third-party runtime" precedent.

### D-E. User identity model

The `users` Drizzle table schema (Unit 9.3 implementation):

```ts
users: {
  id:            text("id").primaryKey(),           // NextAuth-generated UUID
  name:          text("name"),                       // GitHub display name
  email:         text("email"),                      // GitHub primary email (may be private)
  image:         text("image"),                      // GitHub avatar URL
  emailVerified: integer("email_verified", { mode: "timestamp" }),
  createdAt:     integer("created_at", { mode: "timestamp_ms" }).$default(() => new Date()),
}
```

Plus the NextAuth-required `accounts`, `sessions`, `verification_tokens` tables (canonical Drizzle adapter shape). The `githubLogin` field (the `@curatorname` handle for the curator-of-record system) is added to `users` as a separate column in Unit 9.3:

```ts
githubLogin: text("github_login").unique(),  // GitHub login (e.g. "bettyguo")
```

Populated on first sign-in from the GitHub OAuth profile's `login` field. This is the field that joins to `editorial.primary_curator` + `curator` on rating-action YAML files (already file-first per ADR-0005). No FK constraint — file-system content references the GitHub login as a string; the DB tracks "is this GitHub login currently signed in".

§8.6 COI policy data lives ON the file-system editorial records (curator-of-record + paper.authors), not in the DB. The user's `id` from NextAuth-internal IDs does NOT replace `primary_curator` semantics; both coexist (DB tracks sign-in identity; file-system tracks editorial accountability).

## Consequences

### Positive

- **App Router-canonical surface.** NextAuth.js v5's `auth()` server helper + route-handler shape are aligned with Phase-0-8 Next.js 15 idioms.
- **Mature SDK.** v5 stable since Dec 2024; Drizzle adapter mature; widely adopted; good docs.
- **Free.** No SaaS pricing curve. Self-hosted via Vercel + our DB.
- **Data ownership.** User records live in our Drizzle DB; portable; auditable; cross-table joins are SQL.
- **§5.8 explicit recommendation honored.** Matches the listed candidate.
- **Reversibility.** `lib/auth/` abstracts the runtime; switching to Clerk later is a file-rewrite, not a refactor of every consumer.
- **Multi-provider expansion path.** Adding Google / GitLab / email-link later is one config block per provider.
- **Curator-community alignment.** Every contributor has GitHub.

### Negative

- **`next-auth@^5`** is still maturing; some integration edge cases may surface (Drizzle adapter has had v5-specific bugs in the past — pin to a recent stable patch version; track upstream).
- **Configuration is code-shaped, not dashboard-shaped.** Adding a new provider = editing `lib/auth/index.ts` + adding env vars. Less convenient than Clerk's dashboard for non-engineers.
- **Session storage adds a per-request DB read.** Mitigation: DB is local (Turso edge-replica per ADR-0013); read is cached by next-auth's session-cookie heuristics; ~5ms overhead per request acceptable on a 103 kB First Load JS budget.
- **GitHub-only initial provider blocks users without GitHub accounts.** Acceptable for Phase 9 — the curator community is GitHub-native; non-GitHub user expansion (Google / email-link) is a Phase 10+ Q-promotion.
- **No SaaS-side analytics.** Sign-in counts / monthly-active-users / etc. must be queried from our DB (not a Clerk dashboard). Acceptable; Phase-5 Vercel Analytics + PostHog cover the broader observability surface.

## Cross-references

- **§5.8** auth recommendation (Clerk or NextAuth.js v5; GitHub OAuth preferred).
- **§5.7** data-layer trigger (first write-path fires DB migration; auth's user/session tables ride alongside).
- **§13** Phase-6+ deliverables list ("Read+write API with token auth").
- **ADR-0004** file-first / no-DB-for-content (auth lands a USER-STATE DB layer; content stays file-first).
- **ADR-0005** rating-action immutability + curator-of-record (DB `users.githubLogin` joins to file-system `primary_curator`).
- **ADR-0010** Discussions backend (sets the "canonical third-party runtime + first-party thin wrapper" precedent; this ADR mirrors).
- **ADR-0011** i18n strategy (sets the "thin `lib/X/` wrapper around the runtime" precedent).
- **ADR-0013** (TBD; Unit 9.2) — DB choice (Turso/libSQL + Drizzle); the Drizzle adapter referenced in D-C lives over the chosen DB.
- [OPEN_QUESTIONS Q54](../../OPEN_QUESTIONS.md#q54-github-oauth-app-registration) (operational gate downstream).
- [OPEN_QUESTIONS Q56](../../OPEN_QUESTIONS.md#q56-watchlist-table-key-shape) (DB lands USER-STATE only; preserves ADR-0004 file-first for content).
