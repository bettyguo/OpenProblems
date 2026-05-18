# Conflict-of-interest policy

**Status:** v1.0 (Phase 34 close, 2026-05-17)
**Authority:** `MASTER_PROMPT.md §8.6` — constitutional pointer.
**User-facing summary:** [`content/methodology/v1.mdx §6`](../../content/methodology/v1.mdx) — what appears at `/methodology/v1.0.0`.
**This document:** the contributor/curator-facing operational doc that `§8.6` points to. Covers definitions, enforcement tiers (what is mechanically blocked vs. what depends on curator attestation), the recusal mechanism, the LLM-provider angle, and the audit-trail mechanics that make COI violations retroactively detectable.

> A curator must not author a rating action for a problem on which they (or a direct collaborator within the last 24 months) hold a current leaderboard top-5 entry. **— `MASTER_PROMPT.md §8.6` verbatim.**

LLM OpenProblems occupies the rating-agency conceptual slot for AI-research open problems (Moody's / S&P / Fitch for sovereign debt → us for open problems). A rating-agency's credibility rests on procedural integrity, not on the absence of conflict — every analyst will, over a career, have _some_ exposure to _some_ issuer. The discipline is to disclose, recuse, and document. This policy is the mechanism.

---

## 1. Who is bound

**Curators.** Anyone authoring a rating action (the `content/problems/<slug>/ratings/<date>-<slug>.yaml` files per [ADR-0005](../adr/0005-rating-action-immutability.md)). At Phase 34, the curator pool is the env-var allowlist defined in [ADR-0014 D-B](../adr/0014-curator-review-pipeline.md). Phase 14+ may promote this to a `curatorRoles` DB table per [Q7](../../OPEN_QUESTIONS.md) (editorial governance).

**Reviewers.** Curators acting in the review surface introduced by Phase 12 (`/[locale]/curator/challenges/[id]`). The submission side (community-side; Phase 11) does not enforce COI — anyone can submit a rating challenge. The review side ([ADR-0014 D-C](../adr/0014-curator-review-pipeline.md)) does, with the tiers documented in §3 below.

**Submitters.** Are NOT bound by §8.6. A submitter who has a leaderboard entry is allowed — they are surfacing information, not adjudicating. The COI surface fires on the _review_ side: the curator reviewing the challenge cannot be the submitter, cannot be the problem's `primary_curator` (soft-warn), and (verbatim §8.6) must not hold a top-5 leaderboard position or have a direct collaborator who does within the 24-month window.

**LLM-drafted content.** [ADR-0008 D-F](../adr/0008-llm-provider-anthropic.md) addresses the Anthropic-Claude-as-drafter angle separately — see §6 below.

---

## 2. Definitions

### 2.1 "A problem"

A `content/problems/<slug>/` directory. The COI surface attaches at problem-slug granularity, not at dimension granularity. A curator with a top-5 entry on `benchmark-integrity` is barred from rating _any_ dimension of `benchmark-integrity`, not just the dimension their leaderboard entry directly touches.

### 2.2 "A current leaderboard top-5 entry"

An entry that appears in the top 5 positions of the problem's leaderboard _at the time of the rating action_. The leaderboard for a problem is derived from the rating actions filed against that problem's reference benchmark per the dimension definitions in [`content/methodology/v1.mdx §2`](../../content/methodology/v1.mdx) (Saturation in particular drives top-5 ranking).

- **"Top 5"** is the ranked position by the leaderboard's primary metric, ties broken by the secondary metric.
- **"Current"** is the leaderboard state at the rating action's `date:` field, not at filing time. A curator whose entry has dropped to top-7 by the time they file is no longer in conflict; conversely, a curator whose entry has risen to top-5 _after_ their last rating action but before filing must check the live leaderboard.
- The curator's `users.githubLogin` must match a `paper.authors[].slug` for the paper that produced the leaderboard entry. The author slug match is exact; ORCID / DBLP / Google Scholar handle matching is out of scope at v1.0 (Phase 35+ candidate per [Q74](../../OPEN_QUESTIONS.md)).

### 2.3 "A direct collaborator within the last 24 months"

A coauthor on any paper indexed in `content/papers/` with `paper.year >= curator-action-year - 2`, OR a coauthor on any non-indexed paper the curator self-discloses in `users.affiliationsNote`.

- The 24-month window is rolling. It starts at the rating action's `date:` field and looks backward 24 calendar months.
- "Direct" means _coauthor_, not "coauthor's coauthor." Erdős distance 1 only.
- "Collaborator" includes industry-side coauthors (lab colleagues, internship hosts) where the collaboration is public via a paper. Private collaborations (unpublished work, advisorship, employment) are NOT mechanically checkable; curators self-disclose under §5.
- Indexing is the gate. If the collaborator's top-5 paper is not in `content/papers/`, the mechanical check cannot fire — but the curator's self-disclosure obligation under §5 still applies.

### 2.4 "Authoring a rating action"

Filing a YAML at `content/problems/<slug>/ratings/<date>-<slug>.yaml`, OR accepting a community-submitted rating challenge that emits one (Phase 12 review surface; see [ADR-0014 D-D](../adr/0014-curator-review-pipeline.md)). The `curator:` field of the rating-action YAML is the binding identity for COI purposes — not the git commit author (though at Phase 34 they are required to match by `users.githubLogin` for accountability per [ADR-0012 D-E](../adr/0012-auth-provider.md)).

A `recusal` rating action (see §4) does not itself trigger COI — recusal is the canonical exit, not a re-entry.

---

## 3. Enforcement tiers

At Phase 34, COI enforcement is split across mechanical (server-side refuse), advisory (UI warning, action proceeds), and attestation (curator's `reviewNotes` documents the check). The split is documented in [ADR-0014 D-C](../adr/0014-curator-review-pipeline.md) and summarized below.

### 3.1 Hard block — curator is the submitter

A curator cannot review their own rating challenge. Enforced at:

1. The review API (`/api/v1/rating-challenges/[id]/decide`) refuses the request with HTTP 403 + `{ error: "self-review" }`.
2. The curator dashboard (`/[locale]/curator/challenges/[id]`) disables the accept / reject buttons and surfaces "You cannot review your own challenge."
3. The `lib/rating-challenges/coi.ts:getCoIStatus()` helper returns `{ blocked: true, reason: "self-review" }`.

Bypassing this requires either tampering with the database directly (out of normal workflow) or impersonating another curator (which leaves a `users.githubLogin` mismatch in the audit trail per §7).

### 3.2 Soft warn — curator is the problem's `primary_curator`

A curator who authored the problem's current rating reviewing a challenge to their own rating creates a self-review surface that the spirit of §8.6 forbids. Phase 12 ships this as a UI warning, not a block: "You authored this problem's current rating — review carefully." The buttons remain active.

The rationale (per [ADR-0014 D-C](../adr/0014-curator-review-pipeline.md)) is that the `primary_curator` is often the most-qualified reviewer for a problem they have curated. Blocking would punt many legitimate reviews into the queue. Phase 13+ may promote this to a hard block based on usage observations (`reviewNotes` field provides the audit signal).

### 3.3 Attestation — full §8.6 24-month collaborator check

The full §8.6 check (curator OR direct collaborator within 24 months has a current top-5 leaderboard entry) requires a multi-hop traversal: `users.githubLogin` → `content/authors/<slug>` → `content/papers/*.yaml` (where `<slug>` is in `paper.authors[].slug`) → `paper.year` filter → leaderboard derivation → top-5 check. Phase 12 left this UNENFORCED at the application layer.

In place of mechanical enforcement, the `reviewNotes` field on every accept / reject decision serves as the human-audit surface. Curators are expected to attest in `reviewNotes` that they have:

- Checked their own coauthorships in the last 24 months against the problem's top-5 leaderboard entries.
- Recused if any conflict surfaced (per §4).

A `reviewNotes` value like _"COI checked — no 24-mo collaboration with leaderboard top-5 authors"_ is the canonical attestation phrasing. Curators MAY omit the attestation when filing the rating action directly (not via the challenge-review surface); in that case the attestation lives in the rating-action YAML's `notes:` field.

### 3.4 Future enforcement promotion

Each tier has a documented promotion path:

| Tier                        | Today                | Promotion path                                                                                                                                                              |
| --------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hard block (self-review)    | mechanical           | already maximal                                                                                                                                                             |
| Soft warn (primary curator) | UI warning           | promote to hard block on usage signal                                                                                                                                       |
| Attestation (24-mo check)   | curator self-attests | promote to mechanical check when `content/authors/` and `content/papers/` coverage of curator's affiliations is high enough that false-positives drop below false-negatives |

The promotion gate for tier 3 is a [Q35](../../OPEN_QUESTIONS.md)-adjacent question: at what point does the file-system coverage of authorships make the mechanical check more accurate than the attestation? Phase 35+ may revisit.

---

## 4. Recusal mechanism

When a curator's status changes mid-cycle (a new collaboration begins; a new paper is accepted; a previously low-ranked paper rises into top-5), they recuse from the affected problems. The recusal itself is recorded as a rating-action YAML of kind `recusal`:

```yaml
date: 2026-08-15
slug: benchmark-integrity
curator: jikun
kind: recusal
problems: [benchmark-integrity]
reason: >
  Coauthored arXiv:2508.01234 (NeurIPS 2026) with the lead author of
  the current top-3 entry on benchmark-integrity's reference benchmark.
  Recusing from all benchmark-integrity rating actions for 24 months
  from 2026-08-15.
effective_until: 2028-08-15
co_curator: parallel-curator-handle
```

**Schema notes:**

- `kind: recusal` distinguishes from the canonical `kind: upgrade | downgrade | watch | confirm` action kinds.
- `effective_until` is the recusal's 24-month forward window. After that date, the curator may resume rating actions on the slug — but must re-check the 24-month backward window at that time (which now slides forward to include the recusal period).
- `co_curator` names the curator taking over. They must NOT themselves be in conflict per §3.
- The `reason:` field is part of the public audit trail per [ADR-0005](../adr/0005-rating-action-immutability.md) immutability — recusals are not hidden.

A recusal YAML lands via the same workflow as any rating-action YAML (file-first per [ADR-0004](../adr/0004-file-first-no-db.md); curator's local git commit per [ADR-0014 D-D](../adr/0014-curator-review-pipeline.md)). Recusals appear in the global `/ratings` RSS feed alongside other rating actions per `MASTER_PROMPT.md §8.5`.

---

## 5. Self-disclosure obligations

Curators are required to maintain in `content/authors/<their-slug>.yaml` (the same author-file format used for paper authors):

- `affiliations:` — current institutional affiliations.
- `affiliations_note:` — free-text disclosure of recent (≤ 24 months) industry consultancies, advisory roles, employment, or significant grant ties. Anything that would constitute a "direct collaborator" under §2.3 but is not paper-indexed.
- `coi_disclosure_updated:` — date the curator last reviewed and updated the file. Curators are expected to refresh this annually at minimum, and immediately on a status change.

The `affiliations_note:` field is curator self-attestation, not editorially verified. Editorial review may flag obviously incomplete disclosures (e.g., a curator with a Google address filing rating actions on Google-DeepMind papers without disclosing the employment relationship), but the bar is "obvious gap" rather than "exhaustive background check."

The full `content/authors/<slug>.yaml` file is public. Curators accept this transparency as a condition of curating.

---

## 6. LLM-drafted content (Anthropic-Claude angle)

[ADR-0008](../adr/0008-llm-provider-anthropic.md) selected Anthropic Claude as the project's LLM provider for paper-ingest scripts and curator-draft suggestions. This is conflict-adjacent: the project indexes Anthropic, OpenAI, Google DeepMind, Meta FAIR, and other labs' papers, and uses Anthropic's product to draft entries about Anthropic's own work as well as its competitors'.

The disclosure surface for this conflict lives in three places:

1. **`content/contributing/v1.1.mdx §3.6`** — the contributor-facing surface (per [Unit 5.13b](../thinking/5.13b-contributing-v1.1-llm-bump.md)). Documents the LLM-assisted ingest path verbatim from [ADR-0008 D-F](../adr/0008-llm-provider-anthropic.md).
2. **Each draft's metadata** — every LLM-drafted YAML carries a `drafts/<unit>-<timestamp>-<slug>.diff.meta.json` companion file recording the model, request token count, response token count, cost estimate, and prompt SHA256. Spot-audit + reproduction tractable per [ADR-0009](../adr/0009-human-review-diff.md).
3. **Curator review responsibility** — the curator filing the rating action is the editorial accountability party, not the LLM. LLM drafts are curator suggestions, not curator-authored content. The `curator:` field of every rating action YAML names a human; "Claude drafted this" is never a valid value.

The §8.6 COI policy does NOT extend to "Anthropic produced the draft." It extends to _the curator_ (human) authoring the rating action. The LLM-provenance disclosure (the three surfaces above) is a _transparency_ obligation, parallel to but distinct from the COI obligation.

---

## 7. Audit trail mechanics

The COI policy is only enforceable in retrospect if past rating actions remain unaltered. [ADR-0005](../adr/0005-rating-action-immutability.md) makes this mechanical:

- Rating-action YAMLs are append-only on disk (no `git mv`; no in-place edit).
- A pre-commit Husky hook refuses commits that modify existing rating-action files.
- A GitHub Actions CI gate independently re-checks the immutability invariant on every pull request.

The combination means a curator who, in 2027, is found to have had an undisclosed 2025 conflict cannot retroactively hide the 2025 rating action they filed. The conflict is investigatable from the historical record.

The complementary audit-trail surfaces:

- **`content/authors/<slug>.yaml`** is git-versioned. A curator's claim "I disclosed that affiliation in 2025" is verifiable against the file's git history at any point.
- **`users.githubLogin`** is the joining identity for all curator actions. A rating-action YAML's `curator:` field and the git commit's author email map back to the same `users.githubLogin` per [ADR-0012 D-E](../adr/0012-auth-provider.md).
- **`/api/v1/rss.xml` `/ratings` feed** is a public, parseable, time-stamped record of every rating action. Recusals appear in the same feed. Third parties can independently rebuild the rating history without access to the project's database.

---

## 8. Cross-references

- **`MASTER_PROMPT.md §8.6`** — constitutional pointer to this document.
- **[`content/methodology/v1.mdx §6`](../../content/methodology/v1.mdx)** — user-facing summary at `/methodology/v1.0.0`.
- **[ADR-0005 rating-action immutability](../adr/0005-rating-action-immutability.md)** — D-3 (auditability) + D-5 (COI enforceability) are the foundation that makes this policy retroactively enforceable.
- **[ADR-0008 LLM provider](../adr/0008-llm-provider-anthropic.md) D-F** — LLM-drafted-content COI framing; informs §6 of this doc.
- **[ADR-0009 human-review diff](../adr/0009-human-review-diff.md)** — LLM-draft metadata contract that backs §6's transparency surface.
- **[ADR-0012 auth provider](../adr/0012-auth-provider.md) D-E** — `users.githubLogin` as the joining identity binding curator actions to the audit trail.
- **[ADR-0014 curator review pipeline](../adr/0014-curator-review-pipeline.md) D-C** — Phase-12 simplified enforcement (the tiers in §3 of this doc).
- **`/contributing/v1.1` §3.6** — contributor-facing LLM-disclosure surface.
- **[Q7 editorial governance](../../OPEN_QUESTIONS.md#q7-editorial-governance)** — open: solo curator vs. editorial board; affects scope of who is bound by §1.
- **[Q35 mechanical 24-mo check](../../OPEN_QUESTIONS.md)** — implicit: promotion of §3.3 attestation to mechanical check.
- **[Q74 non-GitHub-curator identity](../../OPEN_QUESTIONS.md)** — affects §2.2 author-slug matching.

---

## 9. Revision policy

This document is revised under the same SemVer discipline as `content/methodology/v1.mdx` (see `MASTER_PROMPT.md §8.7` methodology-versioning). A material change to the policy (new bound parties; new tiers; collapsed tiers; changed definitions) MUST bump the methodology version (`v1.0` → `v1.1` or `v2.0`) and ship a corresponding `content/methodology/v1.1.mdx` (or v2.0) snapshot. Clarifications that do not change behavior may land in-place with a dated note at the bottom of the affected section.

A rating action produced under v1.0 of this policy is never silently re-graded against v1.1 or v2.0 — the same immutability invariant from `MASTER_PROMPT.md §8.7` and [ADR-0005](../adr/0005-rating-action-immutability.md) applies to past COI judgments.

**Current version:** v1.0 (this document).
**Effective:** 2026-05-17 (Phase 34 close).
**Next-revision triggers:** editorial-board formation ([Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance)); promotion of §3.3 attestation to mechanical check; introduction of non-GitHub curator identities ([Q74](../../OPEN_QUESTIONS.md)).
