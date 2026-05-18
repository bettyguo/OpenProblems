# ADR-0024 — Content moderation as framework-only `ContentModerator` interface + `NoopModerator` default + factory dispatch (no provider commitment in same ADR; `MODERATION_PROVIDER` env var Phase-36+ operational gate; closes Q68 expansion at 12+ phase carryover — strongest non-just-surfaced patience signal; first framework-only ADR in project history)

- **Status:** accepted
- **Date authored:** 2026-05-17
- **Date accepted:** 2026-05-17
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

[Q68 content moderation on `users.bio` text](../../OPEN_QUESTIONS.md)
was first deferred in Phase 15 ([ADR-0016](./0016-user-editable-profile-fields.md)
D-B) on the rationale "no users yet → no abuse signals → no demand."
Phase 17 ([ADR-0017](./0017-image-storage.md) D-H) expanded the scope
to cover uploaded avatar images; Phase 19/20 ([ADR-0019](./0019-image-transcoding.md)
D-F) re-affirmed the deferral and named the integration point
(between `.rotate()` and `.toBuffer()` in the transcode pipeline).
Phase 21-34 acceptance-gate boundary statements carried Q68 expansion
forward unchanged with the same "Phase 35+ if user-base signals
accumulate" or "if abuse signals" markers — **12+ phase carryover at
Phase-34 close**, **strongest non-just-surfaced patience signal** in
the Phase-35+ candidate tally.

Four existing surfaces accept user-submitted content with no
moderation hook today:

1. **`users.bio`** text write path (Phase 15 ADR-0016 D-B; profile
   server action).
2. **Avatar upload** binary path (Phase 17-19 ADR-0017 + ADR-0019;
   `lib/images/transcode.ts` between `.rotate()` and `.toBuffer()`).
3. **Rating-challenge `rationale:`** text submission (Phase 11
   community-side write path).
4. **Subscribe-email** submission (Phase 30 ADR-0021 D-G subscribe
   server action; email address is the user-input text).

Phase 35 has to pick **whether** to act, **what** to commit to, and
**how broadly** to wire it. The demand-signal-first concern that
deferred Q68 12+ phases needs to be re-examined under the lens of
"can we close the architectural surface without pre-paying for
unobserved abuse?"

Decisions to pin in this ADR:

1. **Ship moderation Phase 35, defer to Phase 36+, or ship a
   framework-only commitment?**
2. **If framework-only: what is the interface shape?** Single
   `ContentModerator` with `moderateText` + `moderateImage` vs.
   split `TextModerator` + `ImageModerator`?
3. **What is the result shape?** Boolean / numeric score / two-state
   severity / pass-through provider labels?
4. **What is the default provider?** No-op / regex-wordlist / real
   API?
5. **How is the provider selected at runtime?** Env-var dispatch /
   build-time wiring / DI container?
6. **Which surfaces wire the framework Phase 35?** All four / subset
   / one canary?
7. **What is deferred to Phase 36+?**

Per-unit deferred decisions from Phase-35 prep that this ADR also
closes:

- **D-9 interface shape**: single vs split (resolved: single).
- **D-10 severity field**: two-state vs numeric vs pass-through
  (resolved: two-state `block | warn`).
- **D-11 per-surface refusal UX**: generic vs custom messaging
  (resolved: generic Phase 35; per-surface polish Phase 36+).
- **D-12 rating-challenge surface scope**: `rationale:` only vs all
  submitter-text fields (resolved: `rationale:` only).
- **D-13 subscribe-email integration**: moderate email-as-text vs
  skip entirely (resolved: wire the call; no-op default makes it
  costless; future regex-wordlist can refuse slur-containing emails).

## Decision Drivers

- **§8.6 conflict-of-interest** is the project's only existing
  curator-policy enforcement surface; moderation is the analogous
  surface for community-side input. Establishing a framework here
  parallels the [ADR-0014](./0014-curator-review-pipeline.md) tier
  pattern (mechanical / advisory / attestation) for the moderation
  axis (block / warn / pass-through).
- **§15.5 reviewer-mode mindset** — "could a future curator misuse
  this surface?" applies to all four wired surfaces. The framework-
  with-noop default establishes the *capability* to refuse without
  the *commitment* to refuse — leaves the policy decision to the
  curator + the operational-gate moment.
- **§14.4 CHANGELOG + ADR contract** — pin the framework choice now
  before code lands; defer provider commitment to a separate ADR-
  0025+ when signals warrant.
- **§5.7 DB-migration trigger** — framework-only does NOT trigger;
  persistent decision audit log (Phase 36+) would trigger trigger (b).
- **[ADR-0016](./0016-user-editable-profile-fields.md) D-B** — bio-
  text moderation was the original Q68 home; Phase 35 framework
  closes the D-B deferral architecturally (full enforcement waits on
  provider commitment).
- **[ADR-0017](./0017-image-storage.md) D-H + [ADR-0019](./0019-image-transcoding.md)
  D-F** — image moderation expansion home; integration point pinned
  (between `.rotate()` and `.toBuffer()`).
- **[ADR-0021](./0021-subscriber-list-email.md) D-A** — provider-
  isolation pattern (`lib/email/` single wrapper) inspires the
  factory shape here; difference is ADR-0021 pinned Resend in the
  same ADR while ADR-0024 leaves the provider open.
- **Phase-35-prep D-1 to D-13** — Phase-35-prep decisions resolved
  before code lands; this ADR codifies them.
- **Demand-signal-first concern** (12+ phase carryover) — dissolved
  by the no-op default: zero API cost, zero latency, zero false-
  positive rate; framework can ship without pre-paying for
  unobserved abuse.

## Considered Options

### Option 1: Framework-only with `NoopModerator` default + factory dispatch + 4-surface wiring (chosen)

Define `ContentModerator` interface in `lib/moderation/types.ts`;
ship `NoopModerator` returning `{ ok: true }` as the default; factory
`getModerator()` dispatches on `MODERATION_PROVIDER` env var with
`noop` default; Unit 35.2 wires the factory call into all four
existing surfaces; provider commitment (OpenAI moderation / Perspective
/ regex-wordlist) deferred to Phase 36+ + operational gate.

- **Pros:**
  - Closes [Q68 expansion](../../OPEN_QUESTIONS.md) at 12+ phase
    carryover — strongest non-just-surfaced patience-signal closure
    in project history.
  - **Dissolves the demand-signal-first concern**. No-op default =
    zero API cost / latency / FP. Shipping the framework now does
    NOT pre-pay for unobserved abuse.
  - **Multi-surface wiring is a one-time cost** (Unit 35.2). Future
    provider commitment costs only the new provider file + env-var
    flip — not a multi-surface refactor.
  - **First framework-only ADR in project history**. Establishes the
    playbook for [Q66](../../OPEN_QUESTIONS.md) (markdown evolution)
    + [Q70](../../OPEN_QUESTIONS.md) (EXIF stripping) + future
    framework-first decisions.
  - **Reuses Phase-30 + Phase-21 provider-isolation pattern**
    (`lib/<module>/` with single factory entry point) — but FIRST
    with no-op default rather than committed provider.
  - **Mirrors [ADR-0014](./0014-curator-review-pipeline.md) tier
    pattern** on the moderation axis (block / warn / pass-through
    parallels mechanical / advisory / attestation).
  - **Zero client-bundle impact** — all `lib/moderation/` work is
    server-side; 103 kB First Load JS invariant preserved.
  - **Zero migration** — pure framework code; persistent decision
    audit log deferred Phase 36+ when provider commitment lands.
- **Cons:**
  - **No real enforcement until provider commits**. Abuse that arrives
    before Phase 36+ provider-commitment is not blocked. Mitigation:
    framework wires extension points so swap-in is mechanical when
    signal arrives; curator can flip `MODERATION_PROVIDER=regex-
    wordlist` + author a wordlist as a Phase-36 fast-path.
  - **Future provider may want richer context shape** than D-C
    `{ surface, userIdOrEmail }`. Mitigation: `ModerationContext`
    is a TypeScript interface, additive extensions are non-breaking;
    fields can be added without bumping existing callers.
  - **Caller-side code path always exists** even when noop. Slight
    perf overhead (one async-await + one object allocation per
    write). Mitigation: noop methods are synchronously-wrapped-in-
    `Promise.resolve()`; the overhead is microseconds per call;
    write paths are not hot.

### Option 2: Ship with committed OpenAI Moderation API provider

Same interface + factory shape, but `getModerator()` defaults to
`OpenAIModerator` reading `OPENAI_API_KEY` env var; ships actual
enforcement Phase 35.

- **Pros:**
  - Real Day-1 enforcement. Q68 expansion fully closed (not just
    framework-only).
  - Concrete policy enforced (OpenAI's policy verbatim).
  - Demonstrates the framework with a real provider; future
    providers slot into the same pattern.
- **Cons:**
  - **Vendor lock-in to OpenAI**. Symmetric to the [ADR-0008](./0008-llm-provider-anthropic.md)
    Anthropic lock-in but for a different vendor; doubles the
    project's third-party-API surface.
  - **API cost per call**. Subscribe-form spam attack = direct API-
    bill amplification; rate-limit before moderation needed.
  - **CI requires `OPENAI_API_KEY`** for build smoke. Doubles the
    Class-A operational gate count.
  - **OpenAI's policy may not match project's**. Tech-research papers
    discussing weapons / extremism / drug-related ML may trip false
    positives.
  - **Demand-signal-first concern preserved** — pre-pays API cost
    for unobserved abuse.
  - **Locks the project into a specific moderation philosophy**
    Phase 35; revising later is a multi-surface refactor.

### Option 3: Defer entirely to Phase 36+

Carry the current posture forward. No ADR-0024 ships Phase 35; Q68
expansion stays open at 13+ phase carryover at Phase-36 close.

- **Pros:**
  - Zero new code; zero new ADR; zero risk.
  - Matches the established Phase 15-34 posture verbatim.
- **Cons:**
  - **Q68 expansion accumulates phases without closure**. 13+ phases
    at Phase-36 close; potentially 14+ / 15+ / longer.
  - **Future multi-surface refactor cost grows** as more surfaces
    get added without the extension point pre-positioned.
  - **Pattern not established** for Q66 / Q70 / similar framework-
    first decisions; each deferred-provider decision continues to
    require its own ADR.
  - **Phase 35 thread menu is no narrower** than Phase 34's; the
    same options surface at Phase 36+ kickoff.

### Option 4: Framework + regex-wordlist default

Same interface + factory + four-surface wiring as Option 1, but
default provider is `RegexWordlistModerator` with a project-curated
wordlist.

- **Pros:**
  - Real enforcement at zero API cost.
  - Deterministic (same input always produces same output; auditable).
  - No vendor lock-in.
- **Cons:**
  - **Wordlist authoring is curator-track** — requires policy work
    upfront; Phase 35 cannot ship without curator input.
  - **False positives on legitimate technical terms** (papers about
    weapons-detection, extremism-counter-research, etc.). Project's
    domain is AI research; ML safety + alignment work routinely
    surfaces such terms.
  - **Wordlist maintenance is ongoing** — never-finished work; curator
    becomes the moderation policy author by accident.
  - **Doesn't dissolve the demand-signal-first concern** the way
    Option 1 does — wordlist is real enforcement Day 1 even without
    observed abuse.

## Decision

**Option 1 chosen.** Framework-only `ContentModerator` interface +
`NoopModerator` default + factory dispatch on `MODERATION_PROVIDER`
env var. Unit 35.2 wires the factory call into all four existing
surfaces. Provider commitment (OpenAI / Perspective / regex-wordlist
/ custom) deferred to Phase 36+ + operational-API-gate decision.

### D-A. Interface shape — single `ContentModerator` with two methods

```ts
export interface ContentModerator {
  moderateText(text: string, ctx: ModerationContext): Promise<ModerationResult>;
  moderateImage(buffer: Buffer, ctx: ModerationContext): Promise<ModerationResult>;
}
```

Single interface (not split text/image) per Phase-35-prep D-9 lean.
Parallels the Resend SDK single-client; simpler factory dispatch;
providers that handle only one modality return `{ ok: true }` for
the other (or throw "unsupported" — deferred to per-provider
implementation Phase 36+).

### D-B. Result shape — discriminated union with two-state severity

```ts
export type ModerationResult =
  | { ok: true }
  | { ok: false; reasons: ReadonlyArray<string>; severity: "block" | "warn" };
```

Discriminated union per TypeScript `exactOptionalPropertyTypes: true`
discipline. Two-state severity (`block | warn`) per Phase-35-prep
D-10 lean. Numeric provider scores get mapped to this two-state by
the provider implementation (e.g., OpenAI's category scores → `block`
above threshold, `warn` between threshold and floor, `ok: true` below
floor). Centralizes the two-state at the framework boundary;
simplifies caller side.

### D-C. Context shape — `{ surface, userIdOrEmail }`

```ts
export interface ModerationContext {
  surface: "bio" | "avatar" | "rating-challenge" | "subscribe";
  userIdOrEmail: string;
}
```

`surface` is a literal-union over the four wired surfaces Phase 35
covers. `userIdOrEmail` is the actor identity (DB user id for signed-
in surfaces; canonical email for subscribe surface). The context lets
future providers tune per-surface (e.g., higher threshold for public
bio than for subscribe email; different policy version per surface).
The noop default ignores context; future providers may key on it.

### D-D. Default provider — `NoopModerator`

```ts
export class NoopModerator implements ContentModerator {
  async moderateText(): Promise<ModerationResult> { return { ok: true }; }
  async moderateImage(): Promise<ModerationResult> { return { ok: true }; }
}
```

Zero API cost. Zero latency (synchronously-wrapped-in-`Promise.resolve`).
Zero false-positive rate. Default when `process.env.MODERATION_PROVIDER`
is unset, empty-string, or literal `"noop"`. Documents the project's
moderation default posture: pass-through. Curator can flip the env-var
to enable real enforcement when a Phase-36+ provider lands.

### D-E. Factory + dispatch — `getModerator()` with lazy singleton

`getModerator()` in `lib/moderation/index.ts` reads
`process.env.MODERATION_PROVIDER`; dispatches on value; caches the
returned instance per-process. Default + literal `"noop"` →
`NoopModerator`. Unknown value → throws `Error` with a clear message
listing supported values (currently `noop`; future providers extend
the dispatch table).

Throw-on-unknown is the right posture for a misconfiguration: a
curator who typos `MODERATION_PROVIDER=openni` would otherwise
silently fall through to noop — exactly the wrong default for a
mis-typed enforcement intent. Surfacing the error at process startup
matches the Phase-9 `safeAuth()` "fail loud on config error" pattern.

### D-F. Test reset hook — `__resetModeratorForTests()`

Mirrors `lib/email/__resetResendClientForTests()` (Phase 30). Vitest
tests need per-suite env-var control; the reset hook clears the
singleton between suites. Exported as a top-level function with the
`__` prefix marking it as test-only by convention (Phase 30 precedent).

### D-G. Env var — `MODERATION_PROVIDER`

Added to `.env.example` in Unit 35.2 alongside first integration call
site (deferred from Unit 35.1 to keep this unit pure-framework + parallel-
safe). Documented default = `noop`; future values = `openai` |
`perspective` | `regex-wordlist` | `custom`. Total env-var count
12 → 13 at Unit 35.2 close.

### D-H. Phase 36+ deferrals

Explicit deferrals carried verbatim into Phase-35 acceptance-gate
boundary statement:

- **Concrete provider implementations**: `OpenAIModerator` /
  `PerspectiveModerator` / `RegexWordlistModerator` / `CustomModerator`.
  Each ships as a new file in `lib/moderation/`; factory dispatch
  table extends.
- **Persistent moderation-decision audit log**: new `moderation_decisions`
  table + migration. Captures `{ id, surface, userIdOrEmail, decision,
  reasons, severity, providerVersion, timestamp }`. Triggers §5.7
  trigger (b) when shipped.
- **Per-user appeal mechanism**: UX surface for blocked content.
- **Bulk-rescan of historical content** under a newly-enabled
  provider — reuses the Phase-20 backfill pattern.
- **Moderation-policy versioning** — curator-facing rule-set editing.
- **Per-surface severity-threshold tuning** — block-vs-warn
  calibration once real-provider data accumulates.
- **Block-vs-warn UX divergence** — surfaces may render warning chip
  on `warn` vs hard 422 on `block`; Phase 35 ships generic 422 on
  `block` only.
- **Webhook for async moderation** — providers like Perspective
  return synchronously, but content-rich providers (image moderation
  with deep classifiers) may need async + webhook acknowledgment.

## Consequences

### Positive

- **Closes [Q68 expansion](../../OPEN_QUESTIONS.md) architecturally at
  12+ phase carryover** — strongest non-just-surfaced patience-signal
  closure in project history.
- **First framework-only ADR in project history**. Establishes
  playbook for Q66 / Q70 / future framework-first decisions.
- **First multi-surface extension-point wiring from a single ADR**.
  Four surfaces wired Unit 35.2 vs. accrete-via-copy pattern of
  `safeAuth()`.
- **First "demand-signal-first concern dissolved by zero-cost-default
  framework" pattern** in project history. Pre-positions extension
  points without pre-paying for unobserved abuse.
- **`lib/moderation/` new directory** = third deferred-provider-
  pattern dir after `lib/email/` (Phase 30) + `lib/cron/` (Phase 31)
  — but **first with no-op default rather than committed provider**.
- **Provider swap-in is mechanical** when signal arrives: one new
  file in `lib/moderation/` + one env-var change. Not a multi-
  surface refactor.
- **§5.7 trigger (b) cold** — Phase 35 ships no migration. Persistent
  audit log deferred Phase 36+.
- **103 kB First Load JS invariant preserved** — all
  `lib/moderation/` work is server-side.

### Negative

- **No real enforcement Phase 35**. Abuse arriving before Phase 36+
  provider-commitment is not blocked. Mitigation: the framework wires
  extension points so swap-in is mechanical when signal arrives. A
  curator can flip `MODERATION_PROVIDER=regex-wordlist` + author a
  wordlist as a Phase-36 fast-path without further code work.
- **Future provider may want richer context shape** than D-C. Mitigation:
  `ModerationContext` is a TypeScript interface; additive extensions
  are non-breaking.
- **Slight perf overhead per write** (one async-await + one object
  allocation per call). Mitigation: noop is synchronously-wrapped-in-
  `Promise.resolve()`; overhead is microseconds per call; write paths
  are not hot.
- **The 4-surface integration in Unit 35.2 establishes 4 call sites**
  that each need updating when provider context shape evolves. Mitigation:
  shared `ModerationContext` interface centralizes the shape; refactors
  are mechanical TypeScript-driven find-and-replace.
- **Operational-gate count grows by 1** (`MODERATION_PROVIDER` env var)
  once curator commits a provider Phase 36+. Pre-Phase-36 the env var
  is documented but optional; production deploys with the env unset
  → noop default → no operational gate firing.

## Cross-references

- **[Q68 expansion content moderation](../../OPEN_QUESTIONS.md)** —
  this ADR closes; status flip to `resolved` in Unit 35.3 hygiene.
- **[ADR-0014](./0014-curator-review-pipeline.md)** — D-C tier pattern
  inspires the moderation framework's two-state severity.
- **[ADR-0016](./0016-user-editable-profile-fields.md) D-B** — bio-
  text moderation deferral; Unit 35.2 wires the integration; Unit 35.3
  APPENDs realization note.
- **[ADR-0017](./0017-image-storage.md) D-H** — image moderation
  expansion deferral; Unit 35.2 wires; Unit 35.3 APPENDs.
- **[ADR-0019](./0019-image-transcoding.md) D-F** — image transcode
  pipeline integration point (between `.rotate()` and `.toBuffer()`);
  Unit 35.2 wires; Unit 35.3 APPENDs.
- **[ADR-0021](./0021-subscriber-list-email.md) D-A + D-G** —
  provider-isolation pattern + subscribe surface; subscribe integration
  Unit 35.2; Unit 35.3 APPENDs.
- **[Q66 markdown evolution in `users.bio`](../../OPEN_QUESTIONS.md)**
  — sibling-Q candidate for framework-only-pattern reuse; advisory
  cross-ref Unit 35.3.
- **[Q70 EXIF stripping](../../OPEN_QUESTIONS.md)** — sibling-Q
  candidate for framework-only-pattern reuse; advisory cross-ref Unit
  35.3.
- **§8.6 conflict-of-interest** (`docs/methodology/coi.md`) — parallel
  policy-enforcement surface on the curator-side axis.
- **§15.5 reviewer-mode mindset** — exercised by Unit 35.2's 4-surface
  wiring.
- **§14.4 CHANGELOG + ADR contract** — this ADR pins the framework
  choice; Unit 35.2 ships the wiring; Unit 35.3 reconciles ADR D-clause
  APPENDs.
