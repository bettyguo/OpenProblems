# ADR-0021 — Subscriber-list email foundation (Resend; per-domain double opt-in; soft-delete unsubscribe; closes Phase-5 D-4 punt at 22+ phase carryover)

- **Status:** accepted
- **Date authored:** 2026-05-17
- **Date accepted:** 2026-05-17
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phase 5 ([MASTER_PROMPT.md §5](../../MASTER_PROMPT.md) Phase-5 deliverables list) named *"Email/RSS digest: per-domain weekly summary"* as a Phase 5 deliverable. The **RSS half landed Phase 5** (`lib/digest/build-digest.ts` + `lib/digest/rss.ts` + `/api/v1/digest/[domain]` route + `/[locale]/digest` HTML preview page). The **email half punted** to Phase 6+ ("email digest infrastructure deferred to follow-on phase").

Phase-5 D-4's punt carried **22+ phases** at Phase 30 entry (Phase 5 closed → Phase 30 = 25 phases elapsed; D-4 first carried Phase 6 → Phase 30 = 24-phase carryover). After Phase 28 closed Phase-9 Class B item 8 (multi-provider OAuth) at 17-phase carryover, **Phase-5 D-4 is uncontested as the single longest patience signal in project history**. Phase 30's keystone thread per [Unit 30.0 D-1](../thinking/30.0-phase-30-prep.md) picks the thread up.

Three architectural surfaces converge:

1. **First `lib/email/` infrastructure** in project history. Establishes provider-isolated module pattern (similar to `lib/markdown/` Phase 17 + `lib/storage/` Phase 19); future templates extend via sibling helpers; tests stub the provider client.
2. **First new DB table since Phase 11** (`ratingChallenge`; 19-phase gap). The `subscriber` table is the second non-Auth.js-canonical user-state table; foundation for future per-user-account subscriptions ([Q76](../../OPEN_QUESTIONS.md#q76-per-user-account-based-subscriptions) Phase 31+).
3. **First architectural commitment to transactional email** in project history. Sender identity + DKIM/SPF/DMARC + provider-account ops are new operational surfaces; [Q75](../../OPEN_QUESTIONS.md#q75-resend-account-domain-provisioning) operational gate mirrors Q54 + Q73 shape verbatim.

Decisions to pin in this ADR:

1. **Which email provider?** Resend / Postmark / AWS SES / SendGrid / raw SMTP?
2. **What is the subscriber data model?** DB-backed table; columns + indexes; status enum; token shapes.
3. **What is the subscription scope?** Per-domain only Phase 30? Per-user-account? Per-problem?
4. **What is the verification flow?** Single opt-in / double opt-in / OAuth-linked?
5. **What is the unsubscribe flow?** Token-based / authenticated / one-click?
6. **What email content ships Phase 30?** Verify + welcome only? Or include digest template?
7. **What is the sender identity?** DKIM / SPF / DMARC strategy; env-var shape.
8. **What is deferred to Phase 31+?**

[Q75 + Q76 candidates](../thinking/30.0-phase-30-prep.md) land alongside this ADR as Q-promotions in Unit 30.4. This ADR closes the architectural sub-questions by pinning each concretely.

## Decision Drivers

- **§5** Phase-5 deliverables list ("Email/RSS digest: per-domain weekly summary"); RSS half landed; email half deferred to follow-on phase.
- **[ADR-0013](./0013-db-choice.md) D-A + D-F** Turso + Drizzle ORM; USER-STATE-only DB scope. The `subscriber` table is USER-STATE (subscriber-set is user-derived data, not content-side); preserves ADR-0013 D-F invariant.
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data invariant — subscriber data is NOT publicly readable; subscriber email + token columns are private; only the unsubscribe-token URL is shared (per email).
- **[ADR-0012](./0012-auth-provider.md) D-E** editorial-identity model preserved — anonymous subscribers (email-only) coexist with authenticated subscribers Phase 31+ (Q76); curator-of-record gate unchanged.
- **[ADR-0014](./0014-curator-review-pipeline.md) D-A** no-auto-merge analog — no auto-send Phase 30 (no scheduler); manual or curator-triggered digest send Phase 31+ when scheduler lands.
- **§5.7 trigger (b)** FIRED Phase 30 — subscriber data model genuinely requires DB-side persistence (token expiry + status tracking + soft-delete semantics); content-side YAML insufficient.
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB end-to-end through every Phase 9-29 unit (38 consecutive units). Phase 30 must NOT regress: `resend@4+` is server-only; subscribe form is server-action-driven (no client-side Resend SDK).
- **§15.5 reviewer-mode mindset** — applied to: (a) **subscribe-spam abuse** (rate-limit deferred; Resend free-tier daily cap as natural ceiling); (b) **token-guessing attacks** (32-byte random; URL-safe base64 = 256 bits entropy; cryptographically infeasible to brute force); (c) **email-list-leak via timing** (verify route returns identical response on valid/invalid tokens; constant-time string comparison); (d) **unsubscribe-link abuse** (idempotent; soft-delete; no destructive operation accessible via GET); (e) **stale verification tokens** (24h expiry; auto-cleanup deferred Phase 31+ as B.19); (f) **email-content XSS** (HTML email content is template-controlled; no user-input echoed back).
- **§14.4** CHANGELOG + ADR contract: pin choice with Pros/Cons before code lands.
- **Phase-9 Class B item 12** middleware-based auth-route protection threshold — Phase 30 doesn't add a protected route (subscribe / verify / unsubscribe are public); threshold stays at 2.

## Considered Options

### Option 1: Resend as the email provider (chosen)

Add `resend@4+` as a server-only runtime dep. Wrap the SDK behind `lib/email/index.ts` exposing `sendEmail(to: string, subject: string, html: string): Promise<...>`.

- **Pros:**
  - **Modern TypeScript SDK** with first-class Next.js ergonomics; widely adopted in the Next.js ecosystem.
  - **Simple API**: `resend.emails.send({ from, to, subject, html })`. No SMTP plumbing.
  - **Free tier sufficient at MVP scale**: 100 emails/day + 3,000/month covers Phase 30 verification + welcome traffic; weekly digest send Phase 31+ monitored against ceiling.
  - **DKIM/SPF/DMARC managed via Resend's domain-verification flow**; one operational gate (Q75) instead of three.
  - **Server-only**: no client bundle impact; **First Load JS UNCHANGED at 103 kB** preserved.
  - **Graceful degradation**: when `RESEND_API_KEY` unset, subscribe form returns error message (i18n `email.send_unavailable`); no subscriber row created; the OTHER project surfaces continue to work.

- **Cons:**
  - **Vendor lock-in**: switching providers Phase 31+ requires `lib/email/index.ts` rewrite (one helper function — small surface).
  - **Free-tier ceiling** at 3,000/month constrains subscriber list size when weekly digest send launches Phase 31+ (3,000 / 4 weekly sends = ~750 subscribers cap).
  - **Vendor dependency** on Resend's uptime + DKIM-signing infrastructure.

### Option 2: Postmark transactional email

Postmark targets transactional email; high deliverability reputation.

- **Pros:**
  - **High deliverability** for transactional emails.
  - **100 emails/month free** (lower than Resend's daily cap; sufficient for MVP).
  - **Mature API** (15+ years; stable).

- **Cons:**
  - **More expensive at scale** (post-free-tier).
  - **Less modern SDK** vs Resend; less Next.js-ergonomic.
  - **Weekly digest send at scale would exceed free tier earlier**.

### Option 3: AWS SES (raw SMTP or SDK)

AWS Simple Email Service via the AWS SDK or raw SMTP.

- **Pros:**
  - **Cheapest at scale** ($0.10 per 1,000 emails post-Vercel-egress).
  - **AWS-native** if other infrastructure is on AWS.

- **Cons:**
  - **Operational complexity high for MVP**: AWS account setup + IAM policies + DKIM/SPF/DMARC manual config + sandbox-mode-exit application + production-access tier upgrade.
  - **Cold-start latency** for serverless SES SDK initialization.
  - **Less Next.js-aligned ergonomics** vs Resend.

### Option 4: SendGrid

Twilio SendGrid; long-running provider.

- **Pros:**
  - **Mature** (15+ years); stable API; widely used.
  - **100 emails/day** free tier.

- **Cons:**
  - **Complex API** vs Resend; more configuration surface.
  - **Less modern TypeScript SDK** ergonomics.
  - **Acquisition noise** (Twilio integration history; account management is dual-platform).

### Option 5: Raw SMTP via nodemailer + Mailgun / Mailchimp / etc.

`nodemailer` + a transactional-relay provider; vendor abstracted at the SMTP level.

- **Pros:**
  - **Maximum vendor flexibility**: switch transactional providers without code change (SMTP creds env-var swap).
  - **Mature** (`nodemailer` is the de-facto Node.js SMTP client).

- **Cons:**
  - **Operational complexity** for hobby-scale: SMTP relay configuration + DKIM/SPF/DMARC + provider account still required.
  - **Performance overhead** vs HTTP-based SDK (SMTP connection pooling + handshake).
  - **No abstraction-layer benefit at MVP scale**: vendor switching is rare; simpler SDK wins.
  - **Cold-start latency** in serverless environments.

### Option 6: Defer subscriber-list email infrastructure (continue Phase 30 with a different thread)

Pick one of A / D / G / J-other / K-other / L / M instead.

- **Pros:**
  - Maintains 13-phase 0-migration streak.
  - Each alternative thread has its own merits.

- **Cons:**
  - **Defers the sole strongest patience signal further** (Phase-5 D-4 at 22+ phases compounds linearly each phase).
  - **ADR-0021 candidate slot stays open** for another phase without claim.
  - The "subscribe-list-email won't help without users" objection has 22+ phases of receipts; planning the architectural surface BEFORE user-base growth unblocks the deploy-and-iterate timeline.

## Decision Outcome

**Chosen: Option 1 — Resend as the email provider.**

The decision pins eight concrete contracts:

### D-A. Email provider = Resend

`resend@4+` (latest stable at Phase 30) as the server-only runtime dep. Wrap the SDK behind `lib/email/index.ts` exposing `sendEmail(to: string, subject: string, html: string, options?: { from?: string }): Promise<...>`. Default `from` reads from `EMAIL_FROM` env var.

Other email providers (Postmark, AWS SES, SendGrid, raw SMTP, etc.) remain **forbidden** per the runtime-singleton principle (similar to ADR-0012 D-A's Auth.js v5 runtime singleton). Switching providers Phase 31+ requires a follow-on ADR or amendment.

### D-B. Subscriber data model (DB-backed `subscriber` table)

New `subscriber` table in `lib/db/schema.ts`:

```ts
export const subscriber = sqliteTable("subscriber", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  status: text("status", { enum: ["pending_verification", "verified", "unsubscribed"] }).notNull(),
  domainSubscriptions: text("domain_subscriptions").notNull(),  // JSON-encoded string[]
  verificationToken: text("verification_token"),
  verificationTokenExpiresAt: integer("verification_token_expires_at"),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  verifiedAt: integer("verified_at"),
  unsubscribedAt: integer("unsubscribed_at"),
  createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
}, (t) => ({
  emailIdx: uniqueIndex("subscriber_email_idx").on(t.email),
  verificationTokenIdx: index("subscriber_verification_token_idx").on(t.verificationToken),
  unsubscribeTokenIdx: uniqueIndex("subscriber_unsubscribe_token_idx").on(t.unsubscribeToken),
}));
```

**Column semantics**:
- `id`: 21-char nanoid (matches existing `ratingChallenge.id` convention).
- `email`: lowercase canonical form (callers normalize before insert); UNIQUE index prevents duplicate subscriptions.
- `status`: enum `pending_verification` (initial; verification email sent) / `verified` (token confirmed) / `unsubscribed` (soft-delete via unsubscribe-token click).
- `domainSubscriptions`: JSON-encoded `string[]` of taxonomy domain IDs (e.g., `["general-ml","applications"]`); foundation Phase 30 = single domain per row in practice but column shape allows multi-domain; Phase 31+ may normalize to a join table if subscription count per row grows beyond ~10 distinct domains.
- `verificationToken`: 32-byte URL-safe base64 random (256 bits entropy); nullable (NULL after verify).
- `verificationTokenExpiresAt`: unix timestamp; 24h after row creation; nullable (NULL after verify).
- `unsubscribeToken`: 32-byte URL-safe base64 random (256 bits entropy); NEVER expires; never NULL.
- `verifiedAt`: unix timestamp; nullable (NULL until verify).
- `unsubscribedAt`: unix timestamp; nullable (NULL until unsubscribe; not cleared on re-subscribe — preserves audit trail).
- `createdAt`: unix timestamp; default `unixepoch()`.
- `updatedAt`: unix timestamp; default `unixepoch()`; callers update on each row mutation.

**Indexes**:
- UNIQUE on `email`.
- INDEX on `verificationToken` (for verify-route lookup; nullable column so non-unique).
- UNIQUE on `unsubscribeToken` (collision prevention; cryptographically impossible at 256-bit entropy but unique constraint is cheap).

**Migration**: new file in `lib/db/migrations/`; `drizzle-kit generate`. **Migration count 6 → 7**; **breaks 13-phase 0-migration streak**; **first non-zero-migration phase since Phase 16** = 14-phase gap.

### D-C. Subscription scope = per-domain Phase 30 (Q76 architectural for Phase 31+)

Phase 30 ships **per-domain subscriptions only**: subscribers opt into one or more taxonomy domains (`general-ml`, `applications`, `deep-learning`); receive a weekly digest per opted-in domain when Phase 31+ scheduler lands.

**Phase 31+ candidates** (each requires Q76 promotion + follow-on ADR amendment or new ADR):
- **Per-user-account subscriptions** (authenticated; couples to `users.id`; non-anonymous subscriber rows).
- **Per-problem subscriptions** (e.g., subscribe to all rating actions on `hallucination-reduction`); couples to `content/problems/<slug>/` content shape.
- **Cross-domain summary subscriptions** (single weekly email aggregating all opted-in domains).

[Q76](../../OPEN_QUESTIONS.md#q76-per-user-account-based-subscriptions) surfaced Phase 30 Unit 30.4; three resolution options to document there: (a) FK from `subscriber.userId` to `users.id` with non-anonymous flag; (b) separate `user_subscriptions` table keyed on `users.id`; (c) keep email-only Phase 30+ with auth-account-merge UI Phase 32+ alongside ADR-0020 D-E candidate.

### D-D. Verification flow = double opt-in; 24h token expiry

Standard transactional double opt-in:

1. User submits subscribe form on `/[locale]/digest` (Phase-30 UI).
2. Server validates email format + canonicalizes (lowercase).
3. Server checks existing row: (a) no row → create new row with `status = pending_verification` + fresh tokens; (b) existing `pending_verification` → refresh `verificationToken` + `verificationTokenExpiresAt`; (c) existing `verified` → no-op return "already subscribed"; (d) existing `unsubscribed` → re-use row + set `status = pending_verification` + fresh tokens.
4. Server sends verification email via Resend with link to `/api/v1/subscribe/verify/[token]`.
5. User clicks link → server validates token + expiry → updates status to `verified` + clears `verificationToken` + clears `verificationTokenExpiresAt` + sets `verifiedAt` → renders confirmation page (or returns JSON for API clients).
6. Server sends welcome email confirming subscription + listing subscribed domains + including unsubscribe link.

**Token semantics**:
- `verificationToken`: 32-byte URL-safe base64 random; 24h expiry; single-use (cleared after verify); regenerated on re-submit.
- **Constant-time token comparison** via `crypto.timingSafeEqual` (defense against timing side-channels).

**Verification failures** (status preserved):
- **Invalid token** → 404; i18n message `email.invalid_token`.
- **Expired token** → 410 Gone; i18n message `email.token_expired`; user instructed to re-submit subscribe form.
- **Already-verified** → 200 idempotent (treat as success).

### D-E. Unsubscribe flow = single-click token; soft-delete; one-time idempotent

Single-click unsubscribe via token-based GET endpoint:

1. Every email (verification + welcome + Phase 31+ digest) includes `https://<host>/api/v1/subscribe/unsubscribe/[unsubscribeToken]`.
2. User clicks link → server validates token → updates status to `unsubscribed` + sets `unsubscribedAt` → renders confirmation page ("You've been unsubscribed; click here to re-subscribe").
3. **Token NOT cleared** (idempotent — re-clicking returns same confirmation page; no error).
4. **Soft delete**: row preserved with `status = unsubscribed`; preserves audit trail; prevents accidental email-list loss if re-imported from backups.

**Re-subscribe flow**: existing row with `status = unsubscribed` re-enters subscribe form → status reset to `pending_verification`; fresh `verificationToken` + expiry; new verification email sent. **`unsubscribedAt` NOT cleared** (audit trail).

### D-F. Email content = verify + welcome templates Phase 30; digest template Phase 31+

Phase 30 ships **2 email templates** as TSX server components in `lib/email/templates/*.tsx`:

1. **Verification email**: subject `Confirm your LLM OpenProblems digest subscription`; body = brief intro + button-styled verification link + plain-text fallback URL + expiry note (24h) + support contact (env-var-driven).
2. **Welcome email**: subject `You're subscribed to the LLM OpenProblems digest`; body = subscribed domains list + next-digest ETA placeholder ("when the weekly digest scheduler launches in a future release") + unsubscribe link + support contact.

**Template authoring**: TSX server components rendered to HTML via `renderToStaticMarkup` from `react-dom/server`. No React Email; no MJML; no templating engine. Foundation-only.

**Phase 31+ deferrals (D-H)**:
- Weekly **digest email template** (consumes existing `DigestPayload` from `lib/digest/build-digest.ts`).
- **React Email adoption** if template count grows beyond ~5.
- **Localization of email content** (Phase 30 ships English-only emails; FR translation Phase 31+ if curator-translated).
- **Email-content i18n keys** (Phase 30 = inline strings in templates; Phase 31+ promote if FR support lands).

### D-G. Sender identity = `EMAIL_FROM` env var + Q75 operational gate

Phase 30 uses:
- `EMAIL_FROM` env var: e.g., `"LLM OpenProblems <digest@<domain>>"` (canonical RFC 5322 format with display name + email).
- Resend domain verification (operational gate **Q75**): DKIM + SPF + DMARC records on the Q2-resolved DNS domain.

**[Q75](../../OPEN_QUESTIONS.md#q75-resend-account-domain-provisioning) operational gate** mirrors Q54 (GitHub OAuth registration) + Q73 (Google OAuth registration) shape verbatim: Resend account setup + domain verification + DKIM/SPF/DMARC propagation. **Three operational gates total in `lib/email/` / `lib/auth/` stacks** at Phase 30 close (Q54 + Q73 + Q75).

**Graceful degradation** when `RESEND_API_KEY` unset: subscribe form returns error message (i18n key `email.send_unavailable`); no subscriber row created. Mirrors Q54 + Q73 graceful-degradation precedent for OAuth providers.

### D-H. Phase 31+ deferrals

Phase 30 ships MINIMAL email surface. Deferred to Phase 31+:

| Concern | Class | Notes |
|---|---|---|
| **Weekly digest email send** | UX + scheduler | Phase 31+; consumes existing `DigestPayload` via new digest template; couples to scheduler. |
| **Vercel Cron scheduler** | Infrastructure | Phase 31+; weekly trigger; per-domain digest send. |
| **Per-user-account subscriptions** (authenticated) | Architectural | Q76 candidate; Phase 31+ if user demand surfaces. Couples to `users.id`. |
| **Per-problem subscriptions** | UX | Phase 31+; couples to content schema. |
| **React Email templates** | DX | Phase 31+ if template count grows beyond ~5. |
| **Email i18n** (FR translation) | UX | Phase 31+ curator-track. |
| **Email-content i18n keys** | DX | Phase 31+ if FR support lands. |
| **Rate limiting subscribe endpoint** | Abuse | Phase 31+ if spam emerges; Vercel Edge rate-limit config. |
| **Subscriber-list export tooling** | Ops | Phase 31+ for backup / migration. |
| **Admin / curator UI for subscriber management** | UX | Phase 31+; couples to ADR-0014 curator-review-pipeline patterns. |
| **Stale-verification-token cleanup job** | Ops | Phase 31+ B.19; daily / weekly cron to clean rows where `status = pending_verification` AND `verificationTokenExpiresAt < now`. |
| **Bulk-unsubscribe / "unsubscribe from all"** | UX | Phase 31+; single endpoint to mark all rows for an email as `unsubscribed`. |

## Consequences

### Positive

- **Closes Phase-5 D-4 punt** at 22+ phase carryover — **single longest patience-signal closure in project history** (exceeds Phase 28's Phase-9 Class B item 8 17-phase closure as prior longest).
- **Establishes `lib/email/` infrastructure** for future templates + provider-isolated module pattern.
- **Provider-isolation contract** preserves switching ease: `sendEmail` helper signature is provider-agnostic; switching to Postmark / SES / SendGrid Phase 31+ is a `lib/email/index.ts` rewrite (single helper) not a multi-file rip-up.
- **Server-only Resend SDK** preserves the **First Load JS 103 kB invariant** (38th consecutive unit at 103 kB; Phase 9-29).
- **DB-backed subscriber model** with explicit status enum + soft-delete preserves audit trail + supports re-subscribe ergonomically.
- **Double opt-in** with 24h token expiry meets transactional-email industry-standard for spam-prevention + GDPR-friendly opt-in semantics.
- **Single-click unsubscribe** with one-time-idempotent semantics meets CAN-SPAM + GDPR compliance shape.
- **Q75 + Q76 promotion pair** mirrors Phase-28's Q73 + Q74 shape (operational + architectural Q-pair coupled to a single ADR).
- **Reversibility**: switching to authenticated subscriptions Phase 31+ adds a column (`userId` FK) without disrupting existing email-only rows.

### Negative

- **Breaks 13-phase 0-migration streak** (Phase 17-29). Acceptable — subscriber data model genuinely requires DB-side persistence.
- **First new DB table since Phase 11** = 19-phase gap. Adds operational complexity (migration coordination + Turso schema sync). Acceptable — preserved via Drizzle migration tooling.
- **Vendor lock-in to Resend** at the provider layer. Mitigation: `sendEmail` helper signature is provider-agnostic; switching is a single-file rewrite.
- **`resend@4+` new runtime dep**. Mitigation: server-only; client bundle unaffected; First Load JS UNCHANGED.
- **Env count grows 9 → 11**. Mitigation: graceful degradation when unset; mirrors Phase-28 OAuth env-var-addition precedent.
- **Q75 operational gate** before deploy; cannot send emails Phase 30 without Resend domain verification. Mitigation: graceful degradation when `RESEND_API_KEY` unset; subscribe form returns error message; project remains buildable + testable without provisioning.
- **Foundation-only Phase 30 has weak UX** without Phase 31+ scheduler — subscribers can opt in but won't receive digest emails until scheduler lands. Mitigation: welcome email mentions "next digest will arrive when scheduler launches in a future release"; sets user expectation correctly.
- **Free-tier ceiling** (3,000/month) bounds future subscriber-list size when weekly digest ships Phase 31+ (~750 subscribers max on free tier). Mitigation: monitor and upgrade tier or switch provider before ceiling hit; Q75 operational gate includes tier-monitoring sub-step.

## Cross-references

- **[ADR-0013](./0013-db-choice.md)** Turso + Drizzle. `subscriber` table is the second new user-state table since ADR-0013 (after Phase-11 `ratingChallenge`); ADR-0013 receives an APPEND-not-EDIT Phase-30 cross-ref note in Unit 30.4.
- **[ADR-0014](./0014-curator-review-pipeline.md) D-A** no-auto-merge analog — no auto-send Phase 30; manual / curator-triggered digest send Phase 31+ when scheduler lands.
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data invariant preserved — subscriber data is private; only unsubscribe-token URL is shared per email.
- **[Phase-5 D-4 punt](../../MASTER_PROMPT.md)** ("Email/RSS digest: per-domain weekly summary") — RSS half landed Phase 5; email half closed by this ADR.
- **[`lib/digest/`](../../lib/digest/)** Phase 5 digest infrastructure (build-digest.ts + rss.ts) — consumer of email-send Phase 31+ alongside scheduler.
- **[OPEN_QUESTIONS Q75](../../OPEN_QUESTIONS.md#q75-resend-account-domain-provisioning)** (NEW operational; surfaced Phase 30; mirrors Q54 + Q73 shape).
- **[OPEN_QUESTIONS Q76](../../OPEN_QUESTIONS.md#q76-per-user-account-based-subscriptions)** (NEW architectural; surfaced Phase 30; Phase 31+ if user demand widens).
- **§5** Phase-5 deliverables list ("Email/RSS digest: per-domain weekly summary").
- **§14.4** CHANGELOG + ADR contract: pin choice with Pros/Cons before code lands.
