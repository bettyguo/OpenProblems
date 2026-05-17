# ADR-0023 — Per-user-account subscriptions (Option A FK extension; `subscriber.userId` nullable FK to `users.id` with `ON DELETE cascade`; auto-link on signed-in form submit; closes ADR-0021 D-C Phase-31+ anticipation at 2-phase Q-carryover; subscriber-list-email arc completes Phase 30 → 31 → 32 → 33)

- **Status:** accepted
- **Date authored:** 2026-05-17
- **Date accepted:** 2026-05-17
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phase 30 ([ADR-0021](./0021-subscriber-list-email.md)) shipped the
**subscriber-list email foundation** scoped to **per-domain
subscriptions only** with **anonymous email-only** `subscriber` rows
(no FK to `users.id`). ADR-0021 D-C explicitly named per-user-account
subscriptions as the **first Phase-31+ candidate** via Q76, and the
OPEN_QUESTIONS Q76 entry documented three resolution options (A: FK
extension; B: separate `user_subscriptions` table; C: stay anonymous-
only). Phase 31 shipped the scheduler instead (ADR-0022; B.15 item 1
tightest follow-on); Phase 32 shipped the cleanup-cron (B.15 item 4
operational follow-on); **Phase 33 closes the D-C architectural
anticipation explicitly**.

The subscriber-list-email feature arc completes Phase 30 → 31 → 32 →
33 as a **4-phase complete-feature pair** — first such contiguous-
feature arc in project history (prior 4-phase contiguous-feature
clusters mixed scope or shipped separate sub-features per phase).

Three architectural surfaces converge:

1. **First ADR to close an explicit prior ADR's Phase-N+1 anticipation
   at tight follow-on**. ADR-0021 D-C named Q76 as the Phase-31+
   candidate; Phase 33 = 3-phase-later realization. Mirrors ADR-0020's
   pattern of explicit ADR-0012 D-B partial-supersession but for
   anticipation-vs-supersession.
2. **Third migration on the `subscriber` table within 4 phases**
   (Phase 30 = create + 11 columns; Phase 31 = `+lastDigestSentAt`;
   Phase 33 = `+userId` FK). Most active table-extension cluster in
   project history.
3. **First "migration-cluster-resume-after-1-phase-gap"**. Phase 30 +
   31 = 2-phase migration cluster; Phase 32 = 0-migration gap; Phase
   33 = resume. New pattern; mirrors Phase 15-16 cluster shape but
   extends with the post-cluster-pause pattern.

Decisions to pin in this ADR:

1. **Which of Q76's three resolution options?** Option A FK extension
   / Option B separate table / Option C stay anonymous-only?
2. **Auto-link or opt-in?** When a signed-in user submits the
   subscribe form, populate `userId` automatically OR require
   explicit opt-in toggle?
3. **Cascade or set-null on user delete?** When the future account-
   deletion flow (Phase 34+ candidate) deletes a `user` row, what
   happens to associated `subscriber` rows?
4. **Re-subscribe semantics**. Existing row + signed-in submit — when
   to update `userId`, when to preserve, when to fail?
5. **Cross-user re-subscribe semantics**. Existing row with
   `userId = other_user_id` + new signed-in submit from different
   user — overwrite or preserve?
6. **Anonymous → authenticated migration semantics**. Existing
   anonymous row + signed-in submit from a user with the same email
   — auto-link or preserve anonymous?
7. **Defensive auth() handling**. Subscribe route reads session via
   `auth()`; if that throws (DB unavailable / migration not run /
   etc.), what's the fallback?
8. **What is deferred to Phase 34+?**

## Decision Drivers

- **§5** Phase-5 deliverables list ("Email/RSS digest: per-domain
  weekly summary") — RSS half landed Phase 5; email-foundation
  landed Phase 30; production-send landed Phase 31; cleanup landed
  Phase 32; **authenticated-user linkage landed by this ADR Phase
  33**. The 4-phase arc completes the feature delivery.
- **[ADR-0021](./0021-subscriber-list-email.md) D-C** subscription
  scope = per-domain only Phase 30 + Q76 architectural for Phase
  31+. Phase 33 closes the Q76 anticipation explicitly.
- **[ADR-0021](./0021-subscriber-list-email.md) D-B** `subscriber`
  table 11-column schema. Phase 33 extends with a 12th column
  (`userId`); preserves all 11 existing columns.
- **[ADR-0012](./0012-auth-provider.md) D-A** NextAuth.js v5 runtime
  singleton + D-C DB-backed sessions. Phase 33 reads `auth()` for
  session lookup inside the subscribe route POST handler;
  authenticated user's `session.user.id` populates `subscriber.userId`.
- **[ADR-0012](./0012-auth-provider.md) D-E** editorial-identity
  model preserved — `users.id` is the unique row key; `users.githubLogin`
  is the curator-of-record handle. Phase 33 keys on `users.id` (provider-
  agnostic; both GitHub and Google sign-ins yield `users.id`).
- **[ADR-0013](./0013-db-choice.md) D-F** USER-STATE-only DB scope —
  `subscriber.userId` is USER-STATE (subscription data tied to user);
  preserves ADR-0013 D-F invariant. **Third APPEND-pattern carry-
  forward on ADR-0013 D-F** anticipated in Unit 33.3 (Phase 11 +
  Phase 30 + Phase 33).
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant preserved — subscriber emails private; `userId` FK does
  NOT make the subscription public (only curator analytics dashboard
  Phase 34+ would query; that surface is private). Authenticated-
  subscription linkage preserves the public/private boundary.
- **[ADR-0020](./0020-multi-provider-oauth.md) D-D** curator-of-record
  gate preserved — `users.githubLogin` is the curator key (GitHub-
  only); `users.id` is the subscriber key (provider-agnostic).
  Subscriptions Phase 33 are provider-agnostic (Google sign-ins =
  valid subscribers; GitHub-only = curators).
- **[ADR-0021](./0021-subscriber-list-email.md) D-E** unsubscribe
  semantics preserved — single-click soft-delete unsubscribe via
  `unsubscribeToken` works identically for anonymous + authenticated
  subscribers. Phase 33 does NOT change unsubscribe flow.
- **[ADR-0021](./0021-subscriber-list-email.md) D-D** verification
  flow preserved — double opt-in + 24h token expiry works identically;
  Phase 33 changes only the row-create path (auth-aware userId
  population).
- **[ADR-0022](./0022-weekly-digest-scheduler.md) D-C** per-domain ×
  per-subscriber send semantics preserved — digest send loop reads
  verified subscribers regardless of `userId`; anonymous + authenticated
  rows are sent identically.
- **§5.7 trigger (b)** FIRES Phase 33 via D-A column extension
  migration (`0008_subscriber_user_id.sql`). **Third migration in
  4 phases** (Phase 30 + 31 + 33; Phase 32 gap); **third migration
  on the `subscriber` table** (most active table-extension cluster).
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB end-to-
  end through every Phase 9-32 unit (43 consecutive units). Phase 33
  must NOT regress: schema extension is server-only; subscribe route
  is server-only; auth() call is server-only. **First Load JS
  expected UNCHANGED at 103 kB** (44th consecutive unit if preserved).
- **§15.5 reviewer-mode mindset** — applied to: (a) **anonymous-vs-
  authenticated row collision** (existing anonymous row + signed-in
  submit from a user with same email — must NOT create duplicate
  row; D-G auto-link semantics); (b) **cross-user re-subscribe**
  (existing row with different `userId` + new signed-in submit from
  different user — must preserve existing; D-F conservative posture);
  (c) **defensive `auth()` handling** (build-time SSG / migration-
  pending DB scenarios — must NOT crash subscribe route; D-G `safeAuth()`
  pattern reuse); (d) **cascade-on-delete privacy**
  (account-deletion flow Phase 34+ — `ON DELETE cascade` ensures
  subscription rows vanish with the user; aligns with §3.1 ADR-0015
  privacy posture); (e) **silent-failure on `auth()` throw** — must
  log + fall back to anonymous (preserve Phase-30 path unchanged when
  auth surface fails).
- **§14.4** CHANGELOG + ADR contract: pin choice with Pros/Cons
  before code lands.

## Considered Options

### Option 1: FK extension `subscriber.userId text references users(id) on delete cascade` nullable (chosen)

Add a single nullable text FK column `userId` to the `subscriber`
table referencing `users.id` with `ON DELETE cascade`. Migration
`0008_subscriber_user_id.sql`. Subscribe route POST handler reads
`auth()` for session; if signed-in, populates `userId = session.user.id`
on row create; if not, populates as `null`. Existing anonymous rows
remain valid (NULL userId). Anonymous → authenticated migration on
re-subscribe with matching email is automatic (update `userId` to
current session user's id).

- **Pros:**
  - **Smallest possible schema change** — single nullable column on
    existing table; no new table; no new index aside from the FK
    constraint.
  - **Preserves anonymous email-only path verbatim** — NULL `userId`
    = anonymous; backward-compatible with Phase-30 subscribers.
  - **Cascade-on-user-delete is automatic** via FK constraint; future
    account-deletion flow (Phase 34+ candidate) benefits without
    additional code.
  - **Auto-link on form-submit is the smallest UX change** — no opt-
    in toggle + no new i18n keys + no new env var + no new operational
    gate.
  - **Anonymous → authenticated migration is smooth** — existing
    anonymous row + signed-in submit with matching email updates the
    row in place (no row ambiguity; the user's existing subscription
    "becomes" their authenticated subscription naturally).
  - **Curator analytics Phase 34+ is a simple query** — `SELECT *
    FROM subscriber WHERE userId IS NOT NULL` lists authenticated
    subscribers; `WHERE userId = '...'` lists a specific user's
    subscriptions. Lays the foundation for "manage my subscriptions"
    page (Q79 candidate Phase 34+) without prejudging its UX shape.
  - **Reversibility**: dropping the FK column Phase 34+ would
    require a migration but no application-code rip-up (the
    `userId`-population logic is one `if (session) { userId =
    session.user.id }` line in the subscribe route).
  - **Provider-agnostic**: `users.id` is the same key whether the
    user signed in via GitHub (Phase 9) or Google (Phase 28); Phase
    33 works identically for both providers.
  - **First Load JS UNCHANGED at 103 kB** preserved (schema +
    subscribe route are server-only; no client bundle delta).

- **Cons:**
  - **Adds 1 migration** (`0008_subscriber_user_id.sql`); third in
    4 phases (Phase 30 + 31 + 33); third on the `subscriber` table.
    Mitigation: column extension is the smallest write surface;
    mirrors Phase-30 + Phase-31 column-extension precedent.
  - **Cross-user re-subscribe collision is theoretically possible**
    (existing row with `userId = user-A.id` + new submit from user-B
    with shared email). Resolution per D-F: **preserve existing
    `userId`**. Conservative; documented as known limitation; Phase
    34+ may revise if user-merge signal emerges.
  - **Auto-link without opt-in toggle** removes user control over
    whether their account is linked. Mitigation: signed-in users
    consciously submitted the form; the linkage is implicit consent
    (linkage doesn't change what they receive — only the curator-
    analytics view differs).
  - **No `unique` constraint on `userId`** (allows one user to have
    multiple subscriptions if they submit from different emails —
    e.g., personal + work email). Acceptable Phase 33 — matches the
    "subscriber-email-is-the-primary-identity" model from Phase 30.
  - **Adds 1 migration to a phase that broke the 2-phase cluster
    via Phase 32 gap** — third migration in 4 phases. Acceptable —
    establishes "migration-cluster-resume-after-1-phase-gap" as a
    new shape; not 3-consecutive.

### Option 2: Separate `user_subscriptions` table keyed on `users.id` × `domain`

Add a new `user_subscriptions` table with composite primary key
`(userId, domain)`. The `subscriber` table stays anonymous email-only.
A signed-in user's subscription INSERTS a row into BOTH `subscriber`
(if they're not already verified) AND `user_subscriptions`. Curator
analytics + "manage my subscriptions" UX queries `user_subscriptions`.

- **Pros:**
  - **Clean separation** between anonymous email-only path
    (`subscriber` table) and authenticated path (`user_subscriptions`
    table).
  - **Per-user-per-domain unique constraint via composite primary key**
    (no duplicate signed-in user subscriptions to the same domain).
  - **No FK pollution on `subscriber`** — preserves Phase-30 schema
    exactly.

- **Cons:**
  - **Two writes per signed-in submit** (subscriber + user_subscriptions)
    vs Option A's one write. Transactional complexity.
  - **New table** (Phase 33 = +1 DB table → 8 vs Option A's 7 unchanged).
  - **Anonymous → authenticated migration is brittle** — existing
    anonymous row stays in `subscriber` table; new authenticated row
    in `user_subscriptions` table; "manage my subscriptions" page
    must query both tables and reconcile. Adds reconciliation
    complexity for marginal benefit.
  - **Heavier scope** (~3-4 units vs Option A's ~2-3 units).
  - **Cascade-on-user-delete** still works via FK constraint on
    `user_subscriptions.userId`, but the corresponding `subscriber`
    row's anonymous identity remains (no cascade target). Audit-trail
    asymmetry.
  - **`subscriber.userId` would still be useful** for cascade purposes
    even with this option, leading to either a hybrid (both columns +
    new table) or skipped cascade (loses the privacy posture).

### Option 3: Stay anonymous email-only indefinitely

Keep `subscriber` table as anonymous email-only per Phase-30 D-C.
"Manage my subscriptions" UX uses email-token verification cycle
(user enters email; receives a manage-subscriptions link).

- **Pros:**
  - **Zero schema change**; zero migration; zero code change.
  - **Architecturally simplest**.
  - **Q76 stays open with documented "Option C lean"**.

- **Cons:**
  - **Closes the ADR-0021 D-C anticipation as a punt**, not a
    realization. Q76 carries forward indefinitely.
  - **"Manage my subscriptions" UX is least pleasant**: user must
    re-enter email + wait for verification link, even when signed in
    on the same device with active session.
  - **No cascade-on-user-delete**: orphaned subscriptions persist
    after account deletion (Phase 34+ candidate).
  - **No curator analytics** without an email-to-userId join workflow.
  - **Defers the architectural commitment** indefinitely — the deferral
    cost grows linearly each phase; ADR-0023 candidate slot stays open;
    project never gets feedback on the authenticated-subscription path.

### Option 4: Defer Q76 to Phase 34+ (pick a different Phase-33 thread)

Pick A (Q68 expansion content moderation) / B (Q78 digest-send
analytics) / D (markdown evolution) / G (Q64 per-user privacy
opt-out) / etc. from the Phase-32 prep doc anti-scope.

- **Pros:**
  - Avoids the third-migration-in-4-phases shape.
  - Each alternative thread has its own merits.

- **Cons:**
  - **Defers the ADR-0021 D-C anticipation indefinitely** — Q76 was
    explicitly named the first Phase-31+ candidate; deferring past
    Phase 33 = at least 4-phase carryover before the architectural
    commitment lands.
  - **Subscriber-list-email arc doesn't complete as a 4-phase pair**.
    Phase 30 + 31 + 32 = 3-phase incomplete arc (foundation + scheduler
    + cleanup; missing authenticated-linkage). Phase 33 closure is
    the natural 4-phase shape.
  - **ADR-0023 candidate slot stays open** for another phase without
    claim.

## Decision Outcome

**Chosen: Option 1 — FK extension `subscriber.userId text references
users(id) on delete cascade` nullable.**

The decision pins eight concrete contracts mirroring ADR-0021's +
ADR-0022's 8-clause shape:

### D-A. Per-user-account-subscriptions model = Option A FK extension verbatim per Q76 documentation

Single nullable text FK column `userId` on the `subscriber` table:

```ts
userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
```

Matches Phase-9 `accounts.userId` + `sessions.userId` + Phase-11
`ratingChallenges.userId` precedent (text type for UUID; cascade-on-
delete). **Drizzle FK syntax established Phase 9** carries verbatim.

Other Q76 resolution options remain **forbidden** per the runtime-
singleton principle (Option B separate `user_subscriptions` table /
Option C stay anonymous-only-indefinitely). Switching strategies
Phase 34+ requires a follow-on ADR.

### D-B. Subscriber row shape = nullable `userId`; preserves anonymous email-only path

Phase 33 schema:

```ts
export const subscribers = sqliteTable(
  "subscriber",
  {
    // ... Phase 30 + 31 columns (11 + 1 = 12 columns) ...
    userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
    // ... Phase 30 columns (createdAt, updatedAt) ...
  },
  // ... Phase 30 indexes ...
);
```

**Column semantics**:
- `userId`: nullable text FK to `users.id`. NULL = anonymous
  subscriber (Phase-30 path); NOT NULL = authenticated subscriber
  (Phase-33 path).
- **No new index** beyond the FK constraint Drizzle auto-creates.
- **No `unique` constraint** — one user may have multiple
  subscriptions if they submit from different emails (personal +
  work); preserves email-as-primary-identity model from Phase 30.

**Migration**: `0008_subscriber_user_id.sql` — single-line ALTER
TABLE adding the column. **Migration count 8 → 9**; **third
migration in 4 phases**; **third migration on the `subscriber`
table within 4 phases** (most active table-extension cluster in
project history).

### D-C. Subscribe-route POST handler = `auth()` check + auto-populate `userId` if signed-in

Subscribe route's POST handler reads `auth()` for session inside the
handler; if signed-in, populates `userId = session.user.id` on row
create; if not, populates as `null`. Defensive `safeAuth()` wrapper
(per the 3-component-precedent pattern from Phase 9-30) ensures the
route does NOT crash on `auth()` throw (SSG / DB unavailable / etc.).

```ts
const session = await safeAuth();  // try { auth() } catch { null }
const userId = session?.user?.id ?? null;
const { subscriber, wasRefresh } = await createOrRefreshPendingSubscription(
  email,
  requestedDomains,
  userId,  // new third arg per D-E semantics
);
```

**No new UI flow**; **no opt-in toggle**; **no opt-out**; **no new
i18n keys**. Signed-in form submission = implicit consent to linkage.
The linkage does NOT change what the user receives (verify + welcome
+ digest emails identical to Phase 30-31 path); only the curator-
analytics view (Phase 34+) differs.

### D-D. Cascade-on-user-delete = automatic via FK `ON DELETE cascade`

The FK constraint `ON DELETE cascade` ensures that when the future
account-deletion flow (Phase 34+ candidate; **NOT in Phase 33 scope**)
deletes a `user` row, all associated `subscriber` rows with
`userId = deleted_user.id` are deleted automatically. Phase 33 SHIPS
the constraint; the deletion path itself awaits Phase 34+.

**Privacy posture**: ON DELETE cascade aligns with §3.1 ADR-0015
privacy posture — deleting a user account also removes their
subscription metadata (email + tokens) without manual cleanup. Mirrors
the Phase-9 `accounts.userId` + `sessions.userId` cascade precedent.

### D-E. Re-subscribe semantics (existing row + new signed-in submit) = update `userId` to current session user's id

When an existing subscriber row exists (matched by email) and a new
signed-in submit arrives, the `createOrRefreshPendingSubscription`
helper updates the existing row's `userId` to the current session
user's id (alongside the existing Phase-30 `status` + `verificationToken`
+ `domainSubscriptions` updates).

**Cases** (extends Phase-30 D-D step 3 state-transition semantics):

| Existing row | New submit auth state | userId outcome | Status outcome |
|---|---|---|---|
| (none) | anonymous | NULL | `pending_verification` (new row) |
| (none) | signed-in user-A | user-A.id | `pending_verification` (new row) |
| `verified`, userId=NULL | anonymous | NULL (no-op) | `verified` (no-op; "already subscribed") |
| `verified`, userId=NULL | signed-in user-A | **user-A.id (anonymous → authenticated migration per D-G)** | `verified` (no-op) |
| `verified`, userId=user-A | anonymous | **user-A.id preserved (do NOT clear)** | `verified` (no-op) |
| `verified`, userId=user-A | signed-in user-A | user-A.id (no-op) | `verified` (no-op) |
| `verified`, userId=user-A | signed-in user-B | **user-A.id preserved (per D-F conservative posture)** | `verified` (no-op) |
| `pending_verification`, userId=NULL | signed-in user-A | user-A.id (auto-link) | `pending_verification` (refresh tokens) |
| `unsubscribed`, userId=user-A | signed-in user-A | user-A.id (re-link) | `pending_verification` (re-subscribe; fresh tokens) |
| `unsubscribed`, userId=NULL | signed-in user-A | user-A.id (anonymous → authenticated migration) | `pending_verification` (re-subscribe) |

### D-F. Cross-user re-subscribe semantics = preserve existing `userId` (conservative; do NOT overwrite)

When existing row has `userId = user-A.id` and a new signed-in submit
arrives from user-B (different `userId`; same email), **preserve
existing `userId = user-A.id`** without overwrite. The form-submit
user's session-id does NOT replace a pre-existing different userId.

**Rationale**: same-email-across-different-`users.id` is rare (would
require user-A and user-B to have both registered with the same email,
which `ADR-0020 D-E`'s account-linking strategy `allowDangerousEmailAccountLinking:
false` actively prevents at sign-in time). But IF it occurs (e.g.,
GitHub user-A subscribed first, then Google user-B with same email
tries to subscribe), the conservative posture preserves the original
attribution. Mirrors the Phase-30 D-D step 3 case-(c) "existing
verified → no-op" idempotency posture.

**Phase 34+ revision path**: if user-merge signal emerges (Phase-28's
J-other account-merge UI thread lands), this clause may be revised to
prefer the most-recent-submitter or to merge attribution. Phase 33
posture is conservative.

### D-G. Anonymous → authenticated migration semantics = auto-link existing anonymous row to current session user

When existing row has `userId = NULL` (anonymous) and a new signed-in
submit arrives from user-A with matching email, **update `userId =
user-A.id`** (anonymous → authenticated migration). No row ambiguity;
the existing anonymous row "becomes" the signed-in user's subscription
naturally.

**Cases** covered by this clause:
- User subscribed anonymously Phase 30, then signed in via GitHub or
  Google, then re-submits the subscribe form → existing `verified`
  row gets `userId` populated.
- User clicked unsubscribe Phase 30 (anonymous `unsubscribed` row),
  then signed in, then re-submits → existing row's `userId` populated
  + status reset to `pending_verification` per Phase-30 D-D re-subscribe.

**Defensive `safeAuth()` posture**: if `auth()` throws (DB unavailable
at request time / SSG-time call / etc.), `safeAuth()` returns `null`
and the row stays anonymous. The subscribe-route POST handler does
NOT crash on `auth()` failure (mirrors the 3-component-precedent
Phase 9-30 pattern).

### D-H. Phase 34+ deferrals

Phase 33 ships the **MINIMAL authenticated-subscription surface**.
Deferred to Phase 34+:

| Concern | Class | Notes |
|---|---|---|
| **"Manage my subscriptions" page on `/[locale]/profile`** | UX | Phase 34+; Q79 candidate per Unit 33.3 hygiene; lists user's subscribed domains + manage / unsubscribe buttons; couples to existing `/profile` per ADR-0015 D-F. |
| **Curator analytics dashboard ("which signed-in users are subscribed")** | UX | Phase 34+; couples to ADR-0014 curator-review-pipeline patterns; queries `SELECT users.*, COUNT(subscriber.id) FROM users LEFT JOIN subscriber ON userId = users.id GROUP BY users.id`. |
| **Per-problem subscriptions extension** | UX | Phase 34+ Q76-sibling-expansion; requires either schema column `subscriber.problemSubscriptions` JSON OR new `problem_subscriptions` table. |
| **Subscription-preference editing UX** | UX | Phase 34+; add / remove domain subscriptions without re-submitting the subscribe form. |
| **Cross-domain aggregated weekly summary** | UX | Phase 34+ per ADR-0022 D-H carryover. |
| **Subscriber-list export tooling (curator-analytics-facing)** | Ops | Phase 34+; CSV export of authenticated subscriber data. |
| **User-merge UI** (Phase-28 J-other carryover) | UX | Phase 34+; revisits D-F cross-user re-subscribe posture if user-merge surface lands. |
| **Account-deletion flow (uses the cascade)** | Architectural | Phase 34+; ships `/profile/delete-account` UI + server action; the FK cascade from this ADR D-D makes subscription cleanup automatic. |
| **Per-user-account-subscription audit trail** | Ops | Phase 34+; separate `subscription_audit` table if richer history needed. |
| **Soft-delete on cascade vs hard-delete** | Privacy | Phase 34+ revisit; ADR-0021 D-E unsubscribe = soft-delete (preserves audit), but ADR-0023 D-D ON DELETE cascade = hard-delete (removes the row entirely). Asymmetry is intentional Phase 33 (account-deletion = full data removal per privacy expectation; unsubscribe = audit-trail-preserving). |

## Consequences

### Positive

- **Closes Q76 architectural carryover at 2-phase age** — closes
  ADR-0021 D-C Phase-31+ anticipation explicitly; mirrors ADR-0020's
  pattern of explicit ADR-0012 D-B partial-supersession but for
  anticipation-vs-supersession.
- **Subscriber-list-email arc completes Phase 30 → 31 → 32 → 33** =
  **4-phase complete-feature pair** — first such contiguous-feature
  arc in project history (prior 4-phase contiguous-feature clusters
  mixed scope).
- **Smallest possible schema change** — single nullable column on
  existing table; no new table.
- **Preserves anonymous email-only path verbatim** — NULL `userId` =
  anonymous; backward-compatible with Phase-30 subscribers.
- **Cascade-on-user-delete automatic** via FK constraint; future
  account-deletion flow (Phase 34+) benefits without additional code.
- **Auto-link on form-submit is the smallest UX change** — no opt-in
  toggle + no new i18n keys + no new env var + no new operational
  gate.
- **Anonymous → authenticated migration smooth** — existing anonymous
  row + signed-in submit with matching email updates the row in place.
- **Provider-agnostic** — `users.id` works identically for GitHub
  (Phase 9) and Google (Phase 28) sign-ins.
- **Server-only surfaces** preserve the **First Load JS 103 kB
  invariant** (44th consecutive unit at 103 kB; Phase 9-32 invariant
  carried into Phase 33).
- **Curator analytics Phase 34+ enabled** without prejudging UX
  shape — Q79 candidate per ADR-0023 D-H.
- **Reversibility**: dropping the FK column Phase 34+ would require
  a migration but no application-code rip-up (`userId`-population is
  one-line in subscribe route).

### Negative

- **Adds 1 migration** (`0008_subscriber_user_id.sql`); **third in
  4 phases** (Phase 30 + 31 + 33; Phase 32 gap); **third on the
  `subscriber` table** within 4 phases. Acceptable — establishes
  "migration-cluster-resume-after-1-phase-gap" as a new shape
  (mirrors Phase 15-16 cluster shape with post-cluster-pause
  extension); column extension is the smallest write surface.
- **Cross-user re-subscribe collision** (existing row with `userId =
  user-A.id` + new submit from user-B with shared email): preserves
  existing `userId` (D-F conservative posture). Mitigation:
  `allowDangerousEmailAccountLinking: false` Phase-28 default prevents
  same-email-across-providers at sign-in time; the edge case is
  theoretical; Phase 34+ may revise if user-merge signal emerges.
- **Auto-link without opt-in toggle** removes user control over
  whether their account is linked. Mitigation: signed-in users
  consciously submitted the form; the linkage is implicit consent;
  linkage doesn't change what they receive.
- **No `unique` constraint on `userId`** allows one user to have
  multiple subscriptions if they submit from different emails.
  Acceptable Phase 33 — matches the email-as-primary-identity model.
- **Defensive `safeAuth()` reuse-only** — Phase 33 doesn't extract
  `safeAuth` to a shared helper (4th in-place copy now after
  `watchlist-toggle` + `rating-challenge-form` + `site-header`).
  Mitigation: extraction is a small refactor; deferred until 5+
  in-place copies surface (matches Phase-7 D-8 extraction-threshold
  pattern; current count = 4).
- **No "manage my subscriptions" page Phase 33** — authenticated
  users get the FK column but no UI to see / manage their
  subscriptions. Mitigation: Phase 34+ Q79 candidate; existing
  unsubscribe-token flow works for authenticated users identically
  to anonymous.

## Cross-references

- **[ADR-0021](./0021-subscriber-list-email.md)** subscriber-list
  email foundation. ADR-0023 closes ADR-0021 D-C Phase-31+
  anticipation explicitly. ADR-0021 D-C receives an APPEND-not-EDIT
  Phase-33 cross-ref note in Unit 33.3 documenting the Q76 Option A
  realization.
- **[ADR-0022](./0022-weekly-digest-scheduler.md)** weekly digest
  scheduler. ADR-0022 D-C per-domain × per-subscriber send loop
  works identically for anonymous + authenticated rows (no change
  to digest-send orchestrator).
- **[ADR-0012](./0012-auth-provider.md) D-A + D-C** NextAuth.js v5
  runtime + DB-backed sessions. ADR-0023 reads `auth()` for session
  lookup; provider-agnostic.
- **[ADR-0012](./0012-auth-provider.md) D-E** editorial-identity
  model preserved — `users.id` is the subscriber key (Phase 33);
  `users.githubLogin` remains the curator-of-record key (unchanged).
- **[ADR-0013](./0013-db-choice.md) D-F** USER-STATE-only DB scope
  preserved — `subscriber.userId` is USER-STATE (subscription data
  tied to user). **Third APPEND-pattern carry-forward on ADR-0013
  D-F** anticipated in Unit 33.3 (Phase 11 + Phase 30 + Phase 33).
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant preserved — subscription data remains private;
  `subscriber.userId` FK does NOT make the subscription public;
  curator analytics Phase 34+ would be a private surface.
- **[ADR-0020](./0020-multi-provider-oauth.md) D-D** curator-of-record
  gate preserved — `users.githubLogin` is the curator key (GitHub-
  only); subscriptions Phase 33 are provider-agnostic (Google
  sign-ins = valid subscribers; GitHub-only = curators).
- **[ADR-0020](./0020-multi-provider-oauth.md) D-E** account-linking
  strategy preserved — `allowDangerousEmailAccountLinking: false`
  prevents same-email-across-providers at sign-in time; ADR-0023 D-F
  cross-user re-subscribe handles the theoretical edge case
  conservatively.
- **[Q76](../../OPEN_QUESTIONS.md#q76-per-user-account-based-subscriptions)**
  per-user-account-based subscriptions — RESOLVED via this ADR
  (Option A); status flip from `open` to `resolved` in Unit 33.3
  hygiene.
- **[Phase-30 ADR-0021 D-C](./0021-subscriber-list-email.md#d-c-subscription-scope--per-domain-phase-30-q76-architectural-for-phase-31)**
  per-domain subscription scope + Q76 architectural anticipation —
  closed by this ADR at 2-phase Q-carryover.
- **[`lib/subscribers/`](../../lib/subscribers/)** Phase 30
  subscriber-row management — Unit 33.2 extends
  `createOrRefreshPendingSubscription` signature with `userId` param.
- **[`app/api/v1/subscribe/route.ts`](../../app/api/v1/subscribe/route.ts)**
  Phase 30 subscribe endpoint — Unit 33.2 adds `safeAuth()` + `userId`
  population.
- **[OPEN_QUESTIONS Q79](../../OPEN_QUESTIONS.md#q7-editorial-governance)**
  (candidate; "manage my subscriptions" UX page Phase 34+) —
  anticipated landing in Unit 33.3 hygiene if signal warrants.
- **§5** Phase-5 deliverables list ("Email/RSS digest: per-domain
  weekly summary") — RSS half Phase 5 + email-foundation Phase 30 +
  scheduler Phase 31 + cleanup Phase 32 + **authenticated-linkage
  Phase 33 = full delivery arc complete**.
- **§5.7 trigger (b)** fires Phase 33 via D-A column-extension
  migration; third migration in 4 phases.
- **§14.4** CHANGELOG + ADR contract: pin choice with Pros/Cons
  before code lands.
