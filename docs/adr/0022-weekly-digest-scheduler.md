# ADR-0022 — Weekly digest scheduler + send template (Vercel Cron; weekly Monday 00:00 UTC; per-domain × per-subscriber loop; `CRON_SECRET` bearer + `vercel-cron` header belt-and-suspenders; `subscriber.lastDigestSentAt` idempotency column; closes Phase-30 B.15 item 1 at 1-phase carryover)

- **Status:** accepted
- **Date authored:** 2026-05-17
- **Date accepted:** 2026-05-17
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phase 30 ([ADR-0021](./0021-subscriber-list-email.md)) shipped the
**subscriber-list email foundation** — Resend provider integration in
`lib/email/` + new `subscriber` DB table + double opt-in verification flow
+ single-click soft-delete unsubscribe + verify + welcome templates +
`/digest` subscribe form + Q75 operational gate + Q76 architectural
candidate. ADR-0021 D-H named **"weekly digest email send"** and **"Vercel
Cron scheduler"** as the first two Phase 31+ deferrals. ADR-0021's
Consequences section flagged the foundation→production-send gap explicitly:
*"foundation-only Phase 30 has weak UX without scheduler — subscribers can
opt in but won't receive digest emails until Phase 31+ ships the scheduler."*

Phase 31's keystone thread per [Unit 31.0 D-1](../thinking/31.0-phase-31-prep.md)
picks the thread up. Phase-30 B.15 item 1 ("weekly digest scheduler +
digest-send email template") closes at **1-phase carryover** — mirrors
the Phase 21/23/25/27/29 tight-follow-on close cadence verbatim (foundation
phase consistently followed by its production-completion phase).

Three architectural surfaces converge:

1. **First Vercel Cron infrastructure** in project history. Establishes
   the scheduled-trigger API endpoint pattern; future cron jobs (Phase
   32+ stale-token cleanup B.15 item 4, retry queues, etc.) extend the
   shape.
2. **First `vercel.json` top-level config file** in project history.
   The Phase-9-30 Next.js + Vercel deployment relied entirely on
   convention-based config; Phase 31 introduces the explicit `crons`
   array as the first deviation.
3. **First production transactional email send loop** in project history.
   Phase 30 shipped the verify + welcome verification path (single-
   recipient per click); Phase 31 ships the recurring digest path
   (per-domain × per-subscriber nested loop bounded by the Resend
   3,000/month free-tier ceiling at ~750 subscribers).

Decisions to pin in this ADR:

1. **Which scheduler runtime?** Vercel Cron / GitHub Actions / Inngest
   / Trigger.dev / external cron?
2. **What schedule?** Daily / weekly / bi-weekly / monthly? What day +
   time?
3. **What send semantics?** Per-domain × per-subscriber loop / per-
   subscriber × per-domain inverted / single aggregated email per
   subscriber?
4. **How is the cron endpoint authenticated?** Path obscurity / shared
   secret / Vercel's built-in `vercel-cron` header / belt-and-suspenders?
5. **What template shape ships Phase 31?** TSX server component / plain
   template-literal string builder / React Email / MJML?
6. **How are partial failures handled?** Per-row try/catch + log /
   first-failure abort / retry queue?
7. **How is the Resend free-tier ceiling managed?** Monitor + manual
   upgrade / hard-cap in code / per-domain rate limit?
8. **What is deferred to Phase 32+?**

Per-unit deferred decisions from Phase-31 prep that this ADR also closes:

- **D-10 idempotency strategy**: `subscriber.lastDigestSentAt` column
  extension (1 migration) vs new `digest_send` audit table (1 migration;
  richer history) vs stateless send-window key (0 migrations; fragile).
- **D-11 digest-send template HTML shape**: reuse Phase-5 RSS preview
  shape vs richer HTML; mobile-friendly width; image stripping.
- **D-12 cron endpoint protection**: `CRON_SECRET` bearer-token vs
  Vercel Cron's built-in `vercel-cron` header check vs both.
- **D-13 `vercel.json` `crons` config shape**.

[Q77 + Q78 candidates](../thinking/31.0-phase-31-prep.md) (operational
Vercel Cron setup + architectural digest-send analytics) land alongside
this ADR as Q-promotions in Unit 31.4 if hygiene-pass signal warrants.

## Decision Drivers

- **§5** Phase-5 deliverables list ("Email/RSS digest: per-domain weekly
  summary"); RSS half landed Phase 5; email-foundation half landed
  Phase 30 via [ADR-0021](./0021-subscriber-list-email.md); production
  send loop is the Phase-31 close.
- **[ADR-0021](./0021-subscriber-list-email.md) D-A** Resend provider
  isolation preserved — digest send goes through the same `lib/email/sendEmail`
  wrapper Phase 30 established; no additional provider lock-in.
- **[ADR-0021](./0021-subscriber-list-email.md) D-B** `subscriber` table
  is the consumer-side data source; D-10 idempotency choice may add one
  column (extends D-B without superseding it).
- **[ADR-0021](./0021-subscriber-list-email.md) D-C** per-domain
  subscription scope preserved — outer loop iterates taxonomy domains,
  inner loop iterates verified subscribers who opted into that domain.
- **[ADR-0021](./0021-subscriber-list-email.md) D-F** plain template-
  literal string-builder pattern preserved — `digest.tsx` sibling to
  `verification.tsx` + `welcome.tsx` matches the Phase-30 precedent
  (no `react-dom/server` per Next.js App Router restriction).
- **[ADR-0021](./0021-subscriber-list-email.md) D-G** `EMAIL_FROM` env
  var + Q75 operational gate carried; digest send adds a tier-monitoring
  sub-step under Q75.
- **[ADR-0021](./0021-subscriber-list-email.md) D-H** Phase 31+
  deferrals — "weekly digest email send" + "Vercel Cron scheduler" are
  the first two rows; this ADR closes both.
- **[ADR-0013](./0013-db-choice.md) D-F** USER-STATE-only DB scope —
  `subscriber.lastDigestSentAt` column extension preserves the invariant
  (subscription state is user-derived data); not a new table; no
  superseding ADR-0013.
- **[ADR-0014](./0014-curator-review-pipeline.md) D-A** no-auto-merge
  analog preserved — Vercel Cron triggers the send loop but does NOT
  create rating actions or content; the loop is consume-side only
  (reads existing `DigestPayload` from Phase-5 `lib/digest/build-digest`).
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant preserved — subscriber emails remain private; digest email
  content is taxonomy-derived + content-derived (never echoes other
  subscribers' data).
- **§5.7 trigger (b)** conditional — fires Phase 31 if D-10 chooses the
  migration path. Lean per this ADR D-10 = **fires** (column extension
  on `subscriber` table; **second consecutive migration phase** since
  Phase 30 broke the 13-phase 0-migration streak; **first migration
  cluster since Phase 15-16**).
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB end-to-end
  through every Phase 9-30 unit (40 consecutive units at 103 kB). Phase
  31 must NOT regress: cron endpoint is server-only; digest-send template
  is plain template-literal string builder; **First Load JS expected
  UNCHANGED at 103 kB**.
- **§15.5 reviewer-mode mindset** — applied to: (a) **cron-endpoint
  abuse** (unauthenticated POST would let anyone trigger 3,000 emails/
  month; D-D `CRON_SECRET` + `vercel-cron` belt-and-suspenders);
  (b) **double-send risk** under Vercel Cron at-least-once delivery
  semantics + retries on 5xx (D-10 `lastDigestSentAt` idempotency
  column); (c) **per-row failure must not short-circuit the loop**
  (D-F per-row try/catch); (d) **Resend free-tier exhaustion** (D-G +
  Q75 monitoring sub-step); (e) **digest-template XSS** (template
  consumes content-derived `DigestPayload`; defensive HTML-escape
  matches Phase-30 templates); (f) **empty-window digest skip** (zero-
  items digests are skipped, not sent — preserves "weekly meaningful
  digest" UX contract).
- **§14.4** CHANGELOG + ADR contract: pin choice with Pros/Cons before
  code lands.
- **Phase-9 Class B item 12** middleware-based auth-route protection
  threshold — Phase 31 doesn't add a protected page route (the cron
  route is server-only and not user-facing); threshold stays at 2.

## Considered Options

### Option 1: Vercel Cron + per-domain × per-subscriber loop + plain string template + `subscriber.lastDigestSentAt` idempotency (chosen)

Use Vercel's native cron scheduler defined via `vercel.json` `crons`
array; weekly Monday 00:00 UTC schedule; cron POSTs to
`/api/v1/cron/digest-send`; route authenticates via `CRON_SECRET`
bearer-token + `vercel-cron` header presence (belt-and-suspenders);
loops taxonomy domains × verified subscribers; per-(domain, subscriber)
pair, builds `DigestPayload` via existing `lib/digest/build-digest`,
skips if `items.length === 0`, renders via new
`lib/email/templates/digest.tsx` plain string builder, sends via
existing `lib/email/sendEmail`, on success updates
`subscriber.lastDigestSentAt`. Failures per-row try/catch + log; do NOT
update `lastDigestSentAt` on failure (next week's cron retries).

- **Pros:**
  - **Native to Vercel deployment**; no extra service to provision; no
    new vendor account; no new monthly cost.
  - **Standard `vercel.json` `crons` config**; widely documented; first-
    class observability via Vercel dashboard.
  - **Built-in `vercel-cron` header injection** + **`Authorization:
    Bearer ${CRON_SECRET}` header injection** per Vercel's documented
    pattern — auth surface is mature.
  - **Reuses Phase-5 + Phase-30 surfaces verbatim**: `lib/digest/build-digest`
    payload builder; `lib/email/sendEmail` transactional wrapper;
    `lib/subscribers/` row management. Phase 31 = compose three surfaces
    into a send loop.
  - **Plain template-literal string builder** matches Phase-30 verify +
    welcome precedent — no `react-dom/server` (blocked in Next.js App
    Router); no React Email runtime dep; no MJML templating engine.
  - **Per-row idempotency** via `lastDigestSentAt` column survives Vercel
    Cron retries / function timeouts / partial batches. Vercel's at-
    least-once delivery semantics are tolerated.
  - **Per-row try/catch + log** ensures one bad recipient does NOT halt
    the batch; failed rows retry next week (no in-week retry; Phase 32+).
  - **Empty-window skip** preserves the "weekly meaningful digest" UX
    contract; subscribers don't get empty no-news emails.
  - **First Load JS UNCHANGED at 103 kB** preserved (server-only
    surfaces; no client bundle delta).
  - **Reversibility**: switching schedulers Phase 32+ (e.g., to Inngest
    for retry queue) is a `vercel.json` removal + new ADR; the cron
    route + send loop survive verbatim. Switching email providers
    remains ADR-0021 D-A's single-file rewrite.

- **Cons:**
  - **Vercel-specific** — moving the deployment off Vercel Phase 32+
    requires replacing the scheduler (cron-job.org / GitHub Actions /
    etc.). Mitigation: cron config is two files (`vercel.json` +
    `app/api/v1/cron/digest-send/route.ts`); migration is small.
  - **Adds `CRON_SECRET` env var** (env count 11 → 12); requires
    operational provisioning at deploy time (Q77 operational candidate).
  - **Adds 1 migration** (`0007_subscriber_last_digest_sent_at.sql`);
    establishes **first migration cluster since Phase 15-16** (second
    consecutive migration phase after Phase 30); mitigation: column
    extension is the smallest write surface.
  - **At-least-once delivery semantics** mean theoretical double-send
    race window under concurrent cron invocations; mitigation: per-
    row `lastDigestSentAt` UPDATE is SQLite-serialized; race-window
    documented as known limitation; row-level lock pattern deferred
    Phase 32+ if signal.
  - **No retry queue** Phase 31 — failed sends wait until next week;
    mitigation: Phase 32+ D-H deferral; reliability signal triggers
    promotion.
  - **Resend free-tier ceiling at 3,000/month**: bounds subscriber list
    at ~750 (4 weekly sends × 750 = 3,000); mitigation: Q75 monitoring
    sub-step + curator manual tier upgrade or provider switch.

### Option 2: GitHub Actions scheduled workflow

GitHub Actions `on: schedule` workflow that calls the Vercel deployment
endpoint (or commits results back to the repo).

- **Pros:**
  - **No new infrastructure** if calling Vercel endpoint.
  - **Free for public repos** (GitHub Actions minutes).
  - **Cron config in `.github/workflows/`** colocates with other CI.

- **Cons:**
  - **Re-introduces the endpoint-auth problem** — workflow must call a
    public endpoint with a shared secret; same `CRON_SECRET` surface
    as Vercel Cron with extra layer.
  - **Commit-back-to-repo path is rejected outright** — Vercel runtime
    filesystem is read-only + breaks ADR-0004 file-first content
    invariant.
  - **Worse observability** vs Vercel Cron's first-class dashboard
    integration.
  - **Workflow runs on GitHub infrastructure, calls Vercel** — split
    failure domain (GitHub Actions down ≠ Vercel down; either failure
    breaks the cron).

### Option 3: Inngest / Trigger.dev / external event-driven orchestrator

Full event-driven job runtime (Inngest, Trigger.dev, etc.) — events,
queues, retries, observability dashboard.

- **Pros:**
  - **Retry queue built in** (vs Phase 31 D-F's per-row log + skip).
  - **Rich observability** dashboard + per-event tracing.
  - **Eventually-consistent semantics** with backoff + DLQ patterns.

- **Cons:**
  - **Overkill for a single weekly cron** in a foundation phase.
  - **New vendor account + monthly cost** above MVP scale.
  - **New runtime dep** + new auth surface + new SDK to learn.
  - **Vendor lock-in to job runtime** in addition to email provider
    lock-in (ADR-0021 D-A's Resend) — premature.
  - Reserve for Phase 32+ if reliability signal emerges.

### Option 4: External cron service (cron-job.org, EasyCron)

Third-party scheduler that pings a public HTTP endpoint.

- **Pros:**
  - **Provider-agnostic** — would survive a Vercel → Netlify migration
    with config-only changes.
  - **Free tier** at most providers covers single weekly cron.

- **Cons:**
  - **Re-introduces endpoint-auth problem** with extra vendor account.
  - **No upside vs Vercel Cron** on a Vercel deployment.
  - **Worse observability** (external dashboard separate from Vercel
    + GitHub).

### Option 5: In-process timer / `setInterval` / long-running worker

Background worker inside the Next.js process (e.g., via `instrumentation.ts`).

- **Pros:**
  - No external scheduler dependency.

- **Cons:**
  - **Rejected outright** — Next.js App Router on Vercel does NOT have
    a long-running process model; Vercel functions are request-scoped;
    the process tears down between requests; timers never fire.

### Option 6: Defer the scheduler (continue Phase 31 with a different thread)

Pick A / D / G / J-other / K-other / L / M from the Phase-31 prep doc.

- **Pros:**
  - Avoids the second consecutive migration phase.
  - Each alternative thread has its own merits.

- **Cons:**
  - **Defers the Phase-30 acceptance gate's "foundation-only weak UX
    without scheduler" boundary statement** indefinitely. The
    foundation→production-send gap is the tightest follow-on signal at
    Phase 31 entry (1-phase age; mirrors Phase 21/23/25/27/29 cadence).
  - **ADR-0022 candidate slot stays open** for another phase without
    claim.
  - **Phase-30 subscribers signed up expecting weekly digests** — the
    welcome email mentions "when the weekly digest scheduler launches in
    a future release"; Phase 31 closes this promise.

## Decision Outcome

**Chosen: Option 1 — Vercel Cron + per-domain × per-subscriber loop +
plain string template + `subscriber.lastDigestSentAt` idempotency.**

The decision pins eight concrete contracts mirroring ADR-0021's eight-
clause shape:

### D-A. Scheduler runtime = Vercel Cron

`vercel.json` top-level `crons` array as the scheduler config surface.
Vercel injects `Authorization: Bearer ${CRON_SECRET}` header + sets
`vercel-cron: 1` header on cron invocations.

Other scheduler runtimes (GitHub Actions / Inngest / Trigger.dev /
cron-job.org / in-process timers / external orchestrators) remain
**forbidden** per the runtime-singleton principle (mirrors ADR-0021
D-A's Resend singleton and ADR-0012 D-A's NextAuth.js singleton).
Switching schedulers Phase 32+ requires a follow-on ADR or amendment.

**Reversibility cost**: small. `vercel.json` removal + replacement of
`app/api/v1/cron/digest-send/route.ts`'s auth check is the entire
migration surface; the per-domain × per-subscriber send loop survives
verbatim.

### D-B. Schedule = weekly Monday 00:00 UTC

Single `crons` entry with `schedule: "0 0 * * 1"` (standard cron
expression for "minute 0 of hour 0 on Monday"; Vercel Cron interprets
in UTC). Matches the RSS-side `lib/digest/build-digest` default 7-day
window for content alignment.

Daily / bi-weekly / monthly / per-subscriber-preferred-day scheduling
all deferred per D-H Phase 32+. Empty-window weeks (zero rating actions
+ zero entries + zero discussions for a domain) are skipped per D-F.

### D-C. Send semantics = per-domain × per-subscriber nested loop

```
for domain in taxonomy.domains:
  payload = buildDigest({ domain: domain.id })
  if payload.items.length === 0: continue        # D-F empty-window skip
  subscribers = getVerifiedSubscribersForDomain(domain.id)
  for subscriber in subscribers:
    if subscriber.lastDigestSentAt && subscriber.lastDigestSentAt > weekStartMs:
      continue                                    # D-10 idempotency
    try:
      html = renderDigestEmail({ payload, unsubscribeUrl, supportEmail })
      result = await sendEmail(subscriber.email, subject, html)
      if result.ok:
        await db.update(subscribers).set({ lastDigestSentAt: now }).where(...)
        sentCount++
      else:
        failedCount++; log({ id, domain, error: result.error })
    catch (err):
      failedCount++; log({ id, domain, error: err.message })
```

**One email per (subscriber, domain) pair**. Subscribers opted into N
domains receive N emails per week.

`getVerifiedSubscribersForDomain(domain)` (new Unit 31.2 selector)
filters `status = "verified"` AND `JSON_EXTRACT(domainSubscriptions, ...)
LIKE domain`. SQLite `LIKE` over JSON-encoded string is acceptable for
Phase 31 scale (≤ 750 subscribers per free tier); index-scan optimization
deferred Phase 32+ if signal.

Aggregated-cross-domain send (single email per subscriber summarizing
all opted-in domains) deferred Phase 32+ per D-H (Q76 sibling
consideration).

### D-D. Auth boundary = `CRON_SECRET` bearer-token + `vercel-cron` header (belt-and-suspenders)

Cron endpoint authenticates via **BOTH** layers:

1. **`Authorization` header check**: `req.headers.get("authorization")
   === \`Bearer ${process.env.CRON_SECRET}\`` via constant-time
   comparison (mirrors Phase-30 `safeCompareTokens` pattern). Vercel
   injects this header automatically on cron invocations per documented
   pattern.
2. **`vercel-cron` header presence check**: `req.headers.has("vercel-cron")`.
   Vercel sets `vercel-cron: 1` on cron invocations. Defense-in-depth:
   catches the edge case where `CRON_SECRET` was somehow leaked but the
   attacker doesn't know to forge `vercel-cron` too.

**Both must pass**. On failure, return `401 { error: "unauthorized" }`.

Reasoning for both: the `vercel-cron` header check costs nothing and
adds a second authentication layer. `CRON_SECRET` alone is the standard
Vercel pattern; adding the header check exceeds the standard but is
defensible at the §15.5 reviewer-mode threshold.

Constant-time comparison is non-optional: token-comparison timing side-
channels are the canonical attack vector (same rationale as Phase-30
`safeCompareTokens`).

**EXTENDED Phase 32 Unit 32.2** — Multi-cron reuse realized via Unit
32.1's `/api/v1/cron/cleanup-stale-tokens` route. Both Phase-31
digest-send cron and Phase-32 cleanup-stale-tokens cron authenticate
via the **same shared `CRON_SECRET`** through the **same `checkCronAuth`
pure-function helper** (extracted in Phase 31 exactly for this multi-
cron reuse case). `vercel.json` `crons` array grows 1 → **2** entries
with **single shared auth contract** — validates ADR-0022's "single
shared secret across both cron endpoints" anticipation. **No new
operational gate** (Q77 carries; covers both endpoints). **No new
env var**. **First reuse of the Phase-31 extracted helper** in project
history; confirms the extraction-for-reuse design intent. Phase 33+
cron jobs (retry queue / bounce-handling / etc.) extend the same auth
pattern + same `CRON_SECRET` + same `checkCronAuth` helper.

### D-E. Send template = `lib/email/templates/digest.tsx` plain string builder

New template file `lib/email/templates/digest.tsx` sibling to Phase-30
`verification.tsx` + `welcome.tsx`. Same plain template-literal pattern
(no `react-dom/server`; no React Email; no MJML).

**Inputs**: `DigestPayload` (the same type RSS already consumes from
`lib/digest/build-digest`; PRESERVES TYPE-LEVEL CONTRACT) + `unsubscribeUrl`
+ `supportEmail`.

**Output**: HTML string suitable for `Resend.emails.send({ html })`.
Mobile-friendly width (`max-width: 600px`; standard transactional-email
pattern). Defensive HTML-escape on all string inputs (matches Phase-30
templates).

**Shape**: header (domain title + "Weekly digest" + date range) +
items list (per `DigestItem`: title + date + 1-2-sentence description +
link) + footer (next-digest cadence reminder + unsubscribe link +
support email).

**No images / no charts** Phase 31. `DigestItem` schema has no
`imageUrl` field; chart images require server-side rendering + CDN
which is out-of-scope for foundation. Deferred Phase 32+ per D-H.

### D-F. Failure handling = per-row try/catch + log/skip; no retry queue Phase 31

Per-row try/catch wraps the inner-loop body. Failures log
`{ subscriber_id, domain, error_message }` and continue to the next
subscriber. Failed rows do NOT update `lastDigestSentAt` — next week's
cron retries naturally.

**Empty-window skip**: if `buildDigest` returns `payload.items.length === 0`
for a domain, skip the entire inner loop for that domain. Subscribers'
`lastDigestSentAt` stays unchanged; if next week has content, they
receive the digest.

**No retry queue, no DLQ, no in-week re-attempt** Phase 31. Reliability
signals (chronic per-week failure on the same recipient; Resend API
outages exceeding 1 week; etc.) trigger Phase 32+ promotion to a real
event-driven runtime (Q78 candidate).

**Route response shape**: `200 { sent: N, failed: M, skipped: K,
domains: D, durationMs: T }`. Vercel Cron dashboard surfaces this for
weekly observability.

### D-G. Free-tier rate-limit awareness = Resend 3,000/month + Q75 monitoring sub-step

Resend free tier: 100/day + **3,000/month**. Weekly cadence × 750
subscribers (averaged across 1 opted-in domain per subscriber) = 3,000
sends/month; **ceiling at ~750 subscribers**.

**Documentation**: this ADR + the cron-route's response payload report
`sent: N` per invocation. Curators add up 4 weeks/month against the
3,000 ceiling.

**Q75 operational gate extension**: ADR-0021's Q75 operational gate
already includes "monitor monthly send count against tier ceiling;
upgrade or switch provider before ceiling hit." Phase 31 reinforces
this by surfacing the per-week count as the primary monitoring signal.

**No hard-cap in code** Phase 31. Partial-list sends would create unfair
experience (some subscribers get digest, others don't, deterministic by
row order); better to monitor + upgrade tier when needed. Hard-cap
deferred Phase 32+ if signal.

### D-H. Phase 32+ deferrals

Phase 31 ships **MINIMAL send loop**. Deferred to Phase 32+:

| Concern | Class | Notes |
|---|---|---|
| **Retry queue for failed sends** | Reliability | Phase 32+; promotes to event-driven runtime (Inngest / Trigger.dev) if signal. Q78 candidate. |
| **Send analytics / delivery-status webhooks** | Observability | Phase 32+; Resend webhook integration; per-send delivery / bounce / complaint tracking. Q78 candidate. |
| **Per-subscriber preferred send-day / send-time** | UX | Phase 32+; couples to subscriber-row schema column extension. |
| **Digest content customization per subscriber** | UX | Phase 32+; per-problem subscription + per-rating-dimension filtering. |
| **React Email template adoption** | DX | Phase 32+ if template count grows beyond ~5 (Phase 31 = 3 templates). |
| **MJML template adoption** | DX | Phase 32+; same threshold as React Email. |
| **FR translation of digest content** | UX | Phase 32+ curator-track; mirrors verify + welcome FR deferral per ADR-0021 D-F. |
| **Per-problem subscription** | UX | Phase 32+ Q76 expansion; couples to content schema. |
| **Authenticated subscriber link to `users.id`** | UX | Phase 32+ Q76; FK column on `subscriber` table. |
| **Cross-domain aggregated weekly summary** | UX | Phase 32+; single email per subscriber summarizing all opted-in domains. |
| **Admin / curator UI for digest analytics** | UX | Phase 32+; couples to ADR-0014 curator-review-pipeline patterns. |
| **Manual / curator-triggered "send now" override** | UX | Phase 32+; off-cycle ad-hoc trigger for breaking-news digests. |
| **Resend tier upgrade automation** | Ops | Phase 32+; webhook on monthly-count threshold + alert to curator. |
| **Row-level lock for concurrent-cron-invocation race** | Reliability | Phase 32+; SQLite `BEGIN IMMEDIATE` pattern OR Drizzle transaction with row-lock. Phase 31 documents the race window as known limitation. |
| **Stale verification-token cleanup job** | Ops | Phase 31+ B.15 item 4 (carried from ADR-0021 D-H); add as second `crons` entry in `vercel.json` when cleanup script lands. |
| **Bounce / complaint handling** | Reliability | Phase 32+; Resend webhook flips `subscriber.status` to `unsubscribed` on hard bounce or spam complaint. |

## Consequences

### Positive

- **Closes Phase-30 B.15 item 1** at 1-phase carryover — **tightest
  follow-on cadence** mirrors Phase 21/23/25/27/29 verbatim (foundation
  phase consistently followed by its production-completion phase at
  1-phase age).
- **Closes the Phase-30 acceptance gate's "foundation-only weak UX
  without scheduler" boundary statement** — subscribers who signed up
  Phase 30 start receiving weekly digests Phase 31+ (assuming Q75
  operational gate satisfied).
- **First Vercel Cron infrastructure** in project history; establishes
  the scheduled-trigger API endpoint pattern for future cron jobs
  (Phase 32+ stale-token cleanup, retry queues, etc.).
- **First `vercel.json` top-level config file** in project history;
  establishes the explicit-deviation-from-convention precedent.
- **First production transactional email send loop**; Phase 30 verify
  + welcome path was single-recipient-per-click; Phase 31 ships the
  recurring multi-row loop bounded by free-tier ceiling.
- **First multi-row INSERT-or-UPDATE loop bounded by external rate-
  limit ceiling** (Resend 3,000/month free tier).
- **Reuses Phase-5 + Phase-30 surfaces verbatim**: `lib/digest/build-digest`
  + `lib/email/sendEmail` + `lib/subscribers/` — Phase 31 = three-
  surface composition.
- **Reuses ADR-0021 D-F plain template-literal string-builder pattern**:
  `digest.tsx` is a sibling to `verification.tsx` + `welcome.tsx`; no
  new templating dependency.
- **Per-row idempotency** survives Vercel Cron retries / function
  timeouts / partial batches; double-send race window minimized to
  concurrent cron invocations (acceptable for foundation phase).
- **Per-row try/catch** ensures one bad recipient does NOT halt the
  batch; failed rows retry naturally next week.
- **Empty-window skip** preserves the "weekly meaningful digest" UX
  contract; subscribers don't get empty no-news emails.
- **Server-only cron route + plain-string template** preserves the
  **First Load JS 103 kB invariant** (40th consecutive unit at 103 kB;
  Phase 9-30 invariant carried into Phase 31).
- **Reversibility**: switching schedulers Phase 32+ is a `vercel.json`
  removal + auth-check rewrite (single-file impact). Switching to event-
  driven runtime is a `crons` removal + new ADR. The send-loop body
  survives any scheduler swap.

### Negative

- **Adds 1 migration** (`0007_subscriber_last_digest_sent_at.sql`);
  **second consecutive migration phase** since Phase 30 broke the 13-
  phase 0-migration streak; **first migration cluster since Phase 15-16**
  (Phase-15 `displayName` + `bio` → Phase-16 `imageOverride`). Acceptable
  — column extension is the smallest possible write surface; mirrors
  Phase-15-16 series shape.
- **Adds 1 env var** (`CRON_SECRET`); env count 11 → 12. Mitigation:
  graceful degradation when unset returns 401 from the cron route; no
  emails sent; project remains buildable + testable without provisioning.
- **First Vercel-specific config file** (`vercel.json`); mild deployment-
  platform lock-in. Mitigation: file is two-key (`crons[].path` +
  `crons[].schedule`); migration to alternative scheduler is small.
- **Vercel Cron at-least-once delivery semantics** mean theoretical
  double-send race window under concurrent invocations. Mitigation:
  `lastDigestSentAt` UPDATE is SQLite-serialized; SELECT-then-UPDATE
  race window documented as known limitation; row-level lock pattern
  deferred Phase 32+.
- **No retry queue** Phase 31 — failed sends wait until next week;
  chronic per-recipient failure (e.g., invalid email) silently retries
  weekly until manual investigation. Mitigation: Phase 32+ D-H deferral;
  Resend webhook integration (Q78 candidate) auto-unsubscribes hard-
  bounce recipients.
- **Resend free-tier ceiling at 3,000/month** bounds subscriber list at
  ~750. Mitigation: Q75 operational gate includes tier-monitoring
  sub-step; curator manual upgrade or provider switch before ceiling
  hit; cron-route response surfaces `sent: N` for observability.
- **No FR translation** of digest content Phase 31 (carries ADR-0021
  D-F's English-only template precedent); mitigation: Phase 32+ curator-
  track via D-H deferral.
- **5 operational gates pending** at Phase 31 close (Q54 + Q55 + Q69 +
  Q73 + Q75) — unchanged from Phase 30; Q77 candidate (Vercel Cron
  setup + `CRON_SECRET` provisioning) potentially adds a sixth in Unit
  31.4 if hygiene-pass signal warrants.

## Cross-references

- **[ADR-0021](./0021-subscriber-list-email.md)** subscriber-list email
  foundation. ADR-0022 is the direct production-send realization of
  ADR-0021 D-H rows 1 + 2 ("weekly digest email send" + "Vercel Cron
  scheduler"). ADR-0021 D-F receives an APPEND-not-EDIT Phase-31 cross-
  ref note in Unit 31.4 documenting the `digest.tsx` template addition.
- **[ADR-0013](./0013-db-choice.md) D-F** USER-STATE-only DB scope
  preserved — `subscriber.lastDigestSentAt` column extension preserves
  the invariant (subscription state is user-derived data).
- **[ADR-0014](./0014-curator-review-pipeline.md) D-A** no-auto-merge
  analog preserved — cron triggers the consume-side send loop; does not
  create rating actions or content.
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant preserved — subscriber emails private; digest content is
  taxonomy-derived + content-derived.
- **[Phase-30 B.15 item 1](../../CHANGELOG.md#unit-304--phase-30-hygiene--open_questions-q75-q76--adr-0013-d-f-phase-30-cross-ref-note-21-adrs-b15-newly-surfaced-1-phase-q-tally-freeze-ends)**
  (weekly digest scheduler + send template) — closed by this ADR at
  1-phase carryover.
- **[`lib/digest/build-digest`](../../lib/digest/build-digest.ts)**
  (Phase 5) — `DigestPayload` source of truth; consumed by Unit 31.3
  cron route via the new `digest.tsx` template.
- **[`lib/email/sendEmail`](../../lib/email/index.ts)** (Phase 30) —
  Resend wrapper consumed by Unit 31.3 cron route.
- **[`lib/subscribers/`](../../lib/subscribers/index.ts)** (Phase 30) —
  extended in Unit 31.2 with `getVerifiedSubscribersForDomain(domain)`
  selector.
- **[OPEN_QUESTIONS Q75](../../OPEN_QUESTIONS.md#q75-resend-account--domain-provisioning-operational-resend_api_key--email_from--dkimspfdmarc-records)**
  operational gate carried Phase 31; tier-monitoring sub-step added.
- **[OPEN_QUESTIONS Q77](../../OPEN_QUESTIONS.md#q7-editorial-governance)**
  (candidate; operational Vercel Cron setup + `CRON_SECRET` provisioning)
  — anticipated landing in Unit 31.4 hygiene if signal warrants.
- **[OPEN_QUESTIONS Q78](../../OPEN_QUESTIONS.md#q7-editorial-governance)**
  (candidate; architectural digest-send analytics / observability Phase
  32+) — anticipated landing in Unit 31.4 hygiene if signal warrants.
- **§5** Phase-5 deliverables list ("Email/RSS digest: per-domain weekly
  summary") — RSS half Phase 5 + email-foundation Phase 30 + production-
  send loop closed by this ADR Phase 31.
- **§5.7 trigger (b)** fires Phase 31 via D-10 column-extension migration.
- **§14.4** CHANGELOG + ADR contract: pin choice with Pros/Cons before
  code lands.
