# ADR-0010 — Discussions backend (Giscus embed + first-party GraphQL read-side)

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §13 Phase-6+ lists three open-ended threads. [Unit 6.0](../thinking/6.0-phase-6-prep.md) (`ada448b`) recommended GitHub Discussions integration as Phase 6's first thread, accepted via "Continue" override.

This ADR pins the **backend** for the integration before any Phase-6 code lands. Two coupled choices:

1. **Comment UI** — how do visitors author and read comments? Giscus iframe widget, Utterances iframe widget, Disqus, or a first-party server-rendered thread that we build ourselves?
2. **Read-side metadata** — how do problem cards and the digest pipeline (Phase-5 Unit 5.7) learn about thread counts + last-activity timestamps? Pure embed (no metadata; cards stay static), or a separate first-party query against GitHub's GraphQL API?

The two choices are coupled because the embed-only path locks out the activity-badge surface that [Unit 6.0 D-5](../thinking/6.0-phase-6-prep.md) committed to. Pinning both in one ADR avoids the drift where Unit 6.2 builds a read-side client that Unit 6.4's embed never coordinates with.

[OPEN_QUESTIONS Q46](../../OPEN_QUESTIONS.md#q46-discussions-backend-giscus-embed-vs-first-party-graphql) (decided-as-lean from Unit 6.0) and [Q47](../../OPEN_QUESTIONS.md#q47-github-repository-discussions-enablement) (open operational) frame the choices. This ADR closes Q46. Q47 remains open as an out-of-band operational gate (repo settings must enable Discussions before Unit 6.2's GraphQL queries return non-empty).

## Decision Drivers

- **§13 deliverable wording** — "GitHub Discussions" (not "Issues", not "Disqus", not "no comments"). Constrains to options that surface GitHub Discussions data.
- **§5.5 perf budget** — First Load JS shared chunk = 103 kB through Phase 5; held since Phase 1. Any new component must not move the shared chunk. Iframe-based options are essentially free against this budget (iframe loads independently).
- **§14.2 testing** — Every page route needs a Playwright smoke. Tests must not depend on cross-origin iframe contents loading.
- **Phase-4 `/contributing` framing** — "The site stores no user accounts." Pact survives ONLY under iframe-delegated auth (Giscus / Utterances / Disqus). A first-party comment build would force the auth thread immediately.
- **ADR-0004 (file-first; no DB)** — Holds under any iframe option + a build-time JSON cache. Breaks under a first-party write-path comment system.
- **ADR-0008 D-C precedent** — Env-driven token discipline (`ANTHROPIC_API_KEY`). Generalises to `GITHUB_TOKEN` for the GraphQL read-side.
- **ADR-0009 D-E precedent** — Filesystem cache pattern (`.arxiv-cache/`, `.pdf-cache/`). Generalises to `.github-cache/` for GraphQL responses.
- **Rating-agency framing** (per `project_llm_openproblems.md`) — Activity surfacing on problem cards is load-bearing. "Which problems have active community engagement?" should be answerable at-a-glance.
- **Reversibility** — Giscus is an iframe widget; switching providers later would be a one-file swap in `components/discussions/GiscusEmbed.tsx` plus a one-line ADR-0010-supersede. GraphQL read-side is a thin wrapper in `lib/discussions/`; equally swappable.

## Considered Options

1. **Giscus embed + first-party GraphQL read-side** — chosen.
2. **Giscus embed only** (no read-side metadata; problem cards stay static).
3. **First-party GraphQL build** (server-rendered thread; no Giscus; writes via GitHub OAuth).
4. **Utterances** (Issues-based, not Discussions).
5. **Disqus** (third-party, non-GitHub).
6. **No comments — defer to existing GitHub Issue templates.**

## Decision Outcome

**Chosen: Option 1 — Giscus embed for the comment UI + first-party GitHub GraphQL for the read-side metadata.**

The decision pins six concrete contracts:

### D-A. Embed backend = Giscus

`@giscus/react` (the official React wrapper) is the only Discussions-embed dependency in `package.json`. Concrete behaviour:

- The wrapper renders a Giscus iframe in `components/discussions/GiscusEmbed.tsx` (Unit 6.4).
- The iframe is mounted only on `app/problems/[slug]/talk/page.tsx` (Unit 6.3) — never on problem detail / leaderboard / history / ratings sub-pages.
- The iframe loads lazily (after the page shell renders), so the SSG-rendered shell + Lighthouse score do not depend on iframe load time.
- Auth-via-GitHub happens inside the iframe; we never receive an OAuth token.

Other iframe-comment providers (Utterances, Disqus) are **forbidden** in `package.json` without a follow-on ADR that supersedes this one.

### D-B. Read-side metadata = first-party GitHub GraphQL

`lib/discussions/github-graphql.ts` (Unit 6.2) is the only first-party Discussions client. It queries GitHub's GraphQL API for:

- **Per-problem thread metadata**: discussion ID, total comment count, last-activity timestamp.
- **Recent-activity feed**: for the digest pipeline (Unit 6.6) — new threads opened or commented-on in the trailing-7-days window.

The client is build-time only — SSG pages capture the metadata at `pnpm build` time; runtime requests don't hit GitHub. This means metadata can be stale between deploys (acceptable; Discussions evolve on minute scale, deploys on hour scale).

### D-C. Per-problem mapping = pathname-based (Giscus default; lazy creation)

The talk-page URL pattern is `/problems/<slug>/talk`. Giscus's `mapping: "pathname"` strategy:

- First comment on a problem creates a new GitHub Discussion in a designated category (e.g., `talk`).
- The discussion's title defaults to the pathname; subsequent comments attach to the same discussion.
- Problems with no comments have **no discussion** (vs. an empty seeded thread). GraphQL counts return 0 cleanly.

**Rejected alternative**: one-discussion-per-problem with pre-seeding via a `talk_discussion_id` field on `problem.yaml`. Pre-seeding imposes admin burden; pathname-based lazy creation removes it.

### D-D. Token + scope = `GITHUB_TOKEN` env, `public_repo` minimum

Per ADR-0008 D-C env-token precedent:

- `GITHUB_TOKEN` from env. No fallback, no committed token, no UI prompt.
- Scope: `public_repo` (read-only) is the minimum for `repository.discussions` queries. **Never write.**
- The Giscus iframe's writes use GitHub's own OAuth inside the iframe (the visitor authenticates against GitHub directly); we never see or store the visitor's token.
- Failure mode: scripts running without `GITHUB_TOKEN` fail loudly. The Phase-5 `ANTHROPIC_API_KEY`-absent pattern transfers exactly.

### D-E. Caching = `.github-cache/<query-hash>.json` (gitignored)

Per ADR-0009 D-E filesystem-cache precedent:

- Top-level `.github-cache/` directory, gitignored (Unit 6.2's `.gitignore` update).
- Each query writes a JSON sidecar keyed by SHA-256 of the GraphQL document + variables.
- TTL: per-build (cache wiped on `pnpm build --no-cache` or by deleting `.github-cache/` locally).
- GitHub Search API rate limits are 30 req/min authenticated; the build-time read pattern fits comfortably under this with caching.
- A future `pnpm clean-cache` script (operational, not architectural) could wipe all `.{*}-cache/` dirs in one shot — out of scope here.

### D-F. Moderation routing = defer to GitHub Discussions native

Q49 (decided-as-lean from Unit 6.0) holds:

- Comment moderation flows through GitHub Discussions' native UI on the embedded thread.
- We do NOT build a first-party moderation queue alongside.
- Curators with repo-maintainer access moderate via GitHub's standard surface.
- Revisit ONLY if curator workload signals a real backlog OR if moderation needs to flow into rating-action evidence chains (which would couple Discussions to the editorial pipeline in a way Phase 6 v1 doesn't require).

### Consequences

- **Positive.** Single-source-of-truth for comment storage (GitHub Discussions); no first-party DB; ADR-0004 holds.
- **Positive.** Auth-via-GitHub is delegated; "site stores no user accounts" pact from Phase-4 `/contributing` holds.
- **Positive.** Read-side metadata enables the activity-badge surface on problem cards (Unit 6.5) and the digest-pipeline extension (Unit 6.6) without coupling them to the embed.
- **Positive.** Reversibility — the embed swap is one component file; the read-side swap is one lib file.
- **Positive.** Cost = $0 (no third-party paid service; GitHub Discussions + GraphQL API both free for public repos).
- **Negative.** Two dependencies (`@giscus/react` + `@octokit/graphql`) vs. one for embed-only. Acceptable; both are typed, mature, small.
- **Negative.** Read-side metadata is stale between deploys. Acceptable per the deploy-cadence reasoning above.
- **Negative.** Iframe contents (the comment thread itself) are NOT crawlable by search engines. Acceptable — the talk-page SHELL is crawlable (problem name, "Discuss" heading, link to the discussion on GitHub); the comment thread itself is a community surface, not editorial content the encyclopedia wants indexed.
- **Negative — operational prereq**: Q47 stays open. GitHub Discussions must be enabled in the `bettyguo/OpenProblems` repository settings before Unit 6.2's GraphQL queries return non-empty. Owner action; tracked as a Phase-6 operational gate, not an ADR-resolvable question.
- **Negative — theme sync friction**: Giscus's `data-theme` syncs via `postMessage`; Unit 6.4 implements the `useEffect` + `postMessage` bridge. One-time implementation cost.
- **Negative — IE/older-browser**: Giscus loads JS; visitors with JS disabled see no comments. Acceptable — the talk-page shell still renders the problem name + a link to the GitHub discussion URL as a no-JS fallback (Unit 6.3 implementation detail).

## Pros and Cons of the Options

### Option 1 — Giscus embed + first-party GraphQL read-side (chosen)

- Good — preserves Phase-4 "no user accounts" pact (auth delegated to iframe).
- Good — preserves ADR-0004 file-first / no-DB (GraphQL read with build-time cache; no first-party storage).
- Good — both deliverables (activity badge + digest extension) land on the read-side without coupling to the embed.
- Good — two cleanly-swappable concerns; provider switches are one-file changes.
- Bad — two dependencies (`@giscus/react` + `@octokit/graphql`); slightly larger surface than embed-only.
- Bad — read-side metadata is stale between deploys.

### Option 2 — Giscus embed only

- Good — one dependency; simpler setup; no token, no cache, no rate-limit handling.
- Good — preserves Phase-4 + ADR-0004 contracts identically to Option 1.
- Bad — drops the activity-badge surface; problem cards stay static.
- Bad — drops the digest-pipeline extension; Phase-5 digest unchanged.
- Bad — fails [Unit 6.0 D-5](../thinking/6.0-phase-6-prep.md)'s read-side surfacing commitment.

### Option 3 — First-party GraphQL build (server-rendered thread; no Giscus)

- Good — full SSR control over comment rendering; comments are crawlable; consistent theme without iframe sync.
- Good — smaller per-route JS (no embed wrapper).
- Bad — we build the comment UI ourselves (input, threading, reactions, moderation). Estimated 5-8 additional units; Phase 6 grows from 11 → ~18.
- Bad — WRITES require GitHub OAuth flow handled by us; breaks "site stores no user accounts" pact; cascades into a DB-trigger flip + the auth thread.
- Bad — comment-thread XSS surface; CSRF; we own all of it.

### Option 4 — Utterances

- Good — similar simplicity to Giscus; iframe-delegated auth.
- Good — preserves Phase-4 + ADR-0004 contracts.
- Bad — backed by GitHub **Issues**, not Discussions. Worse threading model; one-author-per-issue.
- Bad — Issues clutter the repo's issue tracker; mixes talk threads with Phase-4's 4 issue templates.
- Bad — less actively maintained than Giscus.
- Bad — fails §13's "GitHub Discussions" wording.

### Option 5 — Disqus

- Good — mature; widely deployed; standard comment UX.
- Bad — third-party (non-GitHub); breaks the "stay inside the GitHub ecosystem" implicit thread of the project.
- Bad — free tier injects ads; paid tier costs money.
- Bad — privacy posture (tracking + ad-network) incompatible with editorial-integrity framing.

### Option 6 — No comments; defer to existing GitHub Issue templates

- Good — zero new code, zero new deps; Phase-6 work pivots to bilingual or auth thread instead.
- Bad — fails §13's "GitHub Discussions integration" deliverable.
- Bad — equivalent to redirecting Phase 6 away from the Discussions thread (which is the Unit 6.0 D-1 recommendation, accepted via "Continue").

## Links

- MASTER_PROMPT.md §5.5 (perf budget), §12 (Phase 6 boundary), §13 (Phase 6+ deliverables verbatim), §14.2 (testing contract).
- [OPEN_QUESTIONS Q46](../../OPEN_QUESTIONS.md#q46-discussions-backend-giscus-embed-vs-first-party-graphql) — closed by this ADR (backend split pinned).
- [OPEN_QUESTIONS Q47](../../OPEN_QUESTIONS.md#q47-github-repository-discussions-enablement) — remains open as an operational prereq (repo-settings action).
- [OPEN_QUESTIONS Q48](../../OPEN_QUESTIONS.md#q48-talk-page-indexing-posture) — decided-as-lean; not closed by this ADR (route-layout concern; Unit 6.7 area).
- [OPEN_QUESTIONS Q49](../../OPEN_QUESTIONS.md#q49-comment-moderation-routing) — decided-as-lean; codified in this ADR's D-F.
- Related ADRs: [ADR-0004](./0004-file-first-no-db.md) (file-first; still holds), [ADR-0008](./0008-llm-provider-anthropic.md) (D-C env-token precedent), [ADR-0009](./0009-human-review-diff.md) (D-E filesystem-cache precedent).
- Phase-6 prep: [docs/thinking/6.0-phase-6-prep.md](../thinking/6.0-phase-6-prep.md) — D-3 / D-4 / D-5 sub-decisions promoted to firm contracts here.
- This unit's THINK: [docs/thinking/6.1-adr-0010-discussions-backend.md](../thinking/6.1-adr-0010-discussions-backend.md).
- Implementation: arrives in Units 6.2 (`lib/discussions/github-graphql.ts`), 6.3 (`app/problems/[slug]/talk/page.tsx`), 6.4 (`components/discussions/GiscusEmbed.tsx`), 6.5 (`components/problem-card/` extension), 6.6 (`lib/digest/build-digest.ts` extension).
