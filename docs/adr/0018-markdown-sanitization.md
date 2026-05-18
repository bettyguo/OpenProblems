# ADR-0018 — Markdown sanitization subset for `users.bio` rendering (`unified` + `rehype-sanitize`; server-side only)

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

Phase 15 ([ADR-0016](./0016-user-editable-profile-fields.md)) shipped
the user-editable `users.bio` column with **plain-text rendering
only** (D-F: *"NO markdown / NO HTML / NO link-detection Phase 15.
Q66 candidate flagged for Phase 16+ if usage signal demands."*).
Phase 16 closed without acting on Q66 — the image-override surface
(Q67) took priority via ADR-0017. Phase 17's keystone thread per
Unit 17.0 D-1 is **Q66 promotion** — markdown rendering in bio.

Phase 17 introduces the project's **first markdown rendering
pipeline** + **first XSS-audit surface** + **first
`dangerouslySetInnerHTML` surface**. The architectural decisions
load-bearing for this surface — library choice, allowed markdown
subset, URL scheme allow-list, render path placement, server-vs-
client boundary, and Phase-18+ deferrals — must be pinned in one
document so downstream Phase-18+ markdown surfaces (curator
review notes per Phase-15 Class B B.2 item 5; possibly rating-
action `rationale`; possibly methodology-page markdown) inherit a
consistent contract.

Three architectural surfaces converge:

1. A **first markdown processing pipeline** in project history. No
   prior code path interprets markdown (Velite's MDX pipeline
   handles content files via separate compilation; this is a
   USER-STATE render path at request time). Establishes
   `lib/markdown/` module pattern for inheritance.
2. **First XSS-audit surface** — `<p
   dangerouslySetInnerHTML={{ __html: rendered }}>` is the
   attack-vector by name. The sanitization layer must be
   audit-friendly + verifiable + documented.
3. **First three-step pipeline boundary** (parse → transform →
   sanitize → stringify) in project history. The `unified` shape
   names the stages explicitly.

Plus the operational tail: bundle impact (markdown deps are
~120 kB transitive — must stay server-side); render performance
(per-request markdown compilation acceptable at MVP scale); future
Phase-18+ surfaces inheriting this contract.

Decisions to pin in this ADR:

1. **Which markdown library / pipeline?** `marked` vs
   `markdown-it` vs `unified`+`remark`+`rehype` vs `react-markdown`?
2. **What is the allowed markdown subset?** Bold, italic, code,
   links, lists, headings (which levels?), blockquotes, tables,
   footnotes, images, raw HTML?
3. **What is the URL scheme allow-list for `<a href>`?** `https:`
   only? `mailto:` allowed? `javascript:` / `data:` / `file:` /
   `http:` denied?
4. **What is the render path placement?** Inline in page
   components? Helper in `lib/markdown/`? `react-markdown`
   component?
5. **Server-side or client-side render?** SSR via `unified` in
   server component? Or `react-markdown` client component?
6. **Heading demotion**: do source `#` headings become `<h1>` or
   `<h3>` (preserving page outline)?
7. **What XSS attack vectors must be defended?** Schema-based
   sanitization is the line of defense; what schema?
8. **What is deferred to Phase 18+?**

[Q66 candidate](../thinking/15.0-phase-15-prep.md) (anticipated
in Phase 15) becomes [Q66 promoted](../../OPEN_QUESTIONS.md#q66-markdown-rendering-in-bio)
in Unit 17.5. This ADR closes Q66 by pinning each sub-question
concretely.

## Decision Drivers

- **§3.1** "ratings are revisable" framing extended to user
  expressiveness — markdown formatting in bios is a basic
  identity-platform expectation researchers carry from GitHub /
  Bluesky / Mastodon (code blocks for citations; links for
  publications; lists for affiliations).
- **[ADR-0016](./0016-user-editable-profile-fields.md) D-F**
  explicit Phase-16+ deferral with explicit Q66 candidate
  reservation — Phase 15 anticipated this surface; preserving
  Phase 15's scope-cap discipline.
- **[ADR-0015](./0015-per-user-privacy-model.md) D-A** public-data
  invariant — no NEW public-data category introduced. Editable
  `bio` is already public (Phase 15); markdown rendering changes
  the **rendering format** of public data, not the data class.
- **[ADR-0011](./0011-i18n-strategy.md)** i18n strategy preserved
  — bio text is not translated (user-authored content per user's
  language choice; rendering pipeline is locale-agnostic).
- **[ADR-0013](./0013-db-choice.md) D-F** USER-STATE only — bio
  column already exists from Phase 15; Phase 17 adds rendering
  layer; no schema change.
- **§5.7 trigger (a)** ALREADY FIRED Unit 9.6; Phase 17 adds no
  new tables OR columns; no further trigger evaluation.
- **§10.4 perf budget** — First Load JS shared chunk = 103 kB
  end-to-end through every Phase 9-16 unit. Phase 17 must NOT
  regress: markdown deps must stay server-side.
- **§15.5 reviewer-mode mindset** — "could a future user misuse
  this surface?" — applied to: (a) **`<script>` injection** via
  raw HTML pass-through (denied); (b) **`javascript:` URL** in
  `<a href>` (denied); (c) **`data:` URL** in `<a href>` (denied;
  exfiltration / phishing); (d) **`onclick` / `onerror` event
  handlers** via inline attributes (denied; rehype-sanitize
  strips); (e) **`<iframe>` / `<object>` / `<embed>`** (denied);
  (f) **CSS `<style>` injection** (denied; no `class`
  attributes); (g) **`<base href>` hijack** (denied);
  (h) **Markdown autolink with crafted URL** (URL scheme allow-
  list defense-in-depth); (i) **HTML entity smuggling**
  (rehype-sanitize re-stringifies via `rehype-stringify`
  authoritatively); (j) **Title attribute** XSS via `[text](url
  "title")` (deny `title` attribute on safe-list).
- **Phase-9 Class B item 12** middleware-based auth-route
  protection threshold — Phase 17 doesn't add a protected route;
  threshold stays at 2.
- **Phase 17 scope cap** (Unit 17.0 D-1 + scope discipline) — 7
  units; `users.bio` markdown render path ONLY; markdown-rendered
  curator review notes deferred Phase 18+ (couples to this ADR's
  inheritance contract); tables / footnotes / images / syntax-
  highlighting / `@mentions` all Phase 18+.
- **§14.4** CHANGELOG + ADR contract: pin the choice with
  Pros/Cons before code lands.

## Considered Options

### Option 1: `unified` + `remark` + `rehype-sanitize` pipeline (chosen)

The recommendation in [Unit 17.0 D-3 + D-4 + D-5 + D-6 + D-7](../thinking/17.0-phase-17-prep.md).
Adds `unified@11+` + `remark-parse@11+` + `remark-gfm@4+` +
`remark-rehype@11+` + `rehype-sanitize@7+` + `rehype-stringify@10+`
(server-only; ~120 kB transitive). New `lib/markdown/index.ts`
module exposes `renderBioMarkdown(text: string | null): string |
null` returning sanitized HTML string. New
`lib/markdown/sanitize-schema.ts` exports the rehype-sanitize
schema narrowed per the Phase-17 subset. Server-side render only
(in async server components); rendered HTML inlined via
`dangerouslySetInnerHTML`. Bio length cap unchanged at 280 chars
(per ADR-0016 D-A).

- **Pros:**
  - Closes [Q66](../../OPEN_QUESTIONS.md#q66-markdown-rendering-in-bio)
    with a concrete architectural pin (anticipated promotion:
    `open` → `resolved` in Unit 17.5).
  - **No new public-data category** introduced (per ADR-0015 D-A
    invariant preserved). Markdown rendering changes the format,
    not the data class.
  - **Honors ADR-0016 D-F deferral path** verbatim. Phase 17
    picks up the surface ADR-0016 anticipated.
  - **`unified` pipeline is the de-facto standard**. The
    `remark`/`rehype` ecosystem is the most widely-vetted markdown
    stack in the JavaScript ecosystem; `rehype-sanitize` ships
    with a conservative default schema (`rehype-sanitize/lib/schema.js`)
    that the OWASP / W3C community has audited.
  - **Multi-stage pipeline boundary is audit-friendly**. The
    sanitization stage is explicit + separate from parsing /
    transformation; a future security review can isolate the
    schema to verify what's permitted.
  - **Server-side render minimizes XSS surface**. Sanitization
    runs in trusted server context; client receives sanitized HTML
    only; no race between client + server render.
  - **First Load JS shared chunk UNCHANGED at 103 kB**. Markdown
    deps are server-only (`unified` pipeline runs in async server
    component; rendered HTML inlined; no client-side markdown
    processing).
  - **URL scheme allow-list defense-in-depth**. `https:` +
    `mailto:` only; bare-URL GFM autolinks pass through the same
    sanitization (rehype-sanitize re-validates `href` against the
    schema's `protocols.href` allowlist).
  - **Heading demotion preserves outline**. Page-level `<h1>` is
    user name; `<h2>` is "Activity"; bio markdown headings demote
    to `<h3>+` so accessibility tools see correct semantic order.
  - **Reversible**: tables / footnotes / images / syntax-
    highlighting / `@mentions` each promote Phase 18+ without
    schema rework — just unlock additional elements in the
    rehype-sanitize schema.
  - **Establishes `lib/markdown/` module pattern** for Phase 18+
    inheritance (curator review notes via Phase-15 Class B B.2
    item 5; possibly rating-action `rationale`; possibly
    methodology-page markdown).
  - **Phase 17 scope stays tight** (~7 units; smaller than
    Phase 12/14/15/16's 9-unit shape).

- **Cons:**
  - **Heavy transitive dep set** (~120 kB total: `unified` ~30 kB
    + `remark-parse` ~25 kB + `remark-gfm` ~20 kB + `remark-rehype`
    ~15 kB + `rehype-sanitize` ~20 kB + `rehype-stringify` ~10
    kB). Mitigation: server-side only; First Load JS UNCHANGED.
  - **`dangerouslySetInnerHTML` is the XSS-attack-vector by
    name**. Mitigation: rehype-sanitize provides the authoritative
    defense; D-B schema is conservative; ADR-0018 D-D URL allow-
    list is defense-in-depth; D-H lists raw HTML / class attrs /
    inline styles as explicit denies.
  - **No live-preview client boundary**. Users see markdown
    rendered only after save (read-mode preview below edit form).
    Mitigation: Phase 18+ may add client-side preview if signal
    demands; bio is short (280 chars) so single-render is
    acceptable.
  - **Heading demotion is non-standard**. Bio's `# H1` becomes
    `<h3>` (not `<h1>`); semantic surprise for users who expect
    full markdown. Mitigation: D-C is intentional — page outline
    integrity wins over per-bio fidelity.
  - **No table / footnote / image / syntax-highlighting support
    Phase 17** — power users may want richer formatting.
    Mitigation: each is a separate Phase 18+ candidate; schema
    extension is incremental.
  - **Sanitization schema must be audited**. The custom subset
    rehype-sanitize schema requires careful authoring (which tags,
    which attributes, which protocols). Mitigation: D-B documents
    the subset; Unit 17.2 ships ~10-vector XSS test suite as
    defense.

### Option 2: `marked` library

Single-library markdown rendering via `marked@13+`. No built-in
sanitization (coupled to external sanitizer like `DOMPurify`).

- **Pros:**
  - Simpler dep tree (single library + sanitizer wrapper).
  - Fast parsing (single-pass).
  - Widely used.

- **Cons:**
  - **No built-in sanitization** — `marked` parses but doesn't
    sanitize. Either couple to `DOMPurify` (client-side) or
    `sanitize-html` (server-side); both add dep + audit surface.
  - **Single-pass parsing** lacks the audit-friendly stage boundary
    of `unified`'s pipeline.
  - **Less standardized schema** — sanitizer config is bespoke per
    project; less community auditing.
  - **Phase 18+ inheritance** would still need a wrapper; might
    as well start with the standard pipeline.

### Option 3: `markdown-it` library

Single-library markdown rendering via `markdown-it@14+`. Plugin
ecosystem for sanitization.

- **Pros:**
  - Plugin extensibility (e.g., `markdown-it-sanitizer`).
  - CommonMark-compliant + GFM extensions.
  - Fast.

- **Cons:**
  - **Sanitization via plugin** is less standardized — multiple
    sanitizer plugins exist with different allowlist shapes;
    less community auditing than rehype-sanitize.
  - **No explicit transform-vs-sanitize stage boundary** — plugins
    chain inline.
  - **Phase 18+ inheritance** would still need a `markdown-it`
    instance + plugin set; less ecosystem-stable than rehype-
    sanitize.

### Option 4: `react-markdown` component

Client-side markdown rendering via `react-markdown@9+` (which
wraps the `unified` stack for React).

- **Pros:**
  - JSX-native (component prop).
  - Built-in sanitization (uses `rehype-sanitize` under the hood).
  - Familiar React idioms.

- **Cons:**
  - **Client-side bundle impact**. React-markdown + transitive deps
    add ~50 kB to the client bundle; First Load JS shared chunk
    would regress from 103 kB → ~150 kB. Violates §10.4 perf
    budget invariant carried through every Phase 9-16 unit.
  - **Requires "use client" boundary**. Bio rendering becomes a
    client component; defeats SSR optimization; client hydration
    cost.
  - **Underlying pipeline is `unified` anyway** — Option 1 uses
    the same pipeline directly without React-wrapping, keeping
    bundle on server.

## Decision Outcome

**Chosen: Option 1 — `unified` + `remark` + `rehype-sanitize`
pipeline (server-side only).**

The decision pins eight concrete contracts:

### D-A. Library choice

**`unified@11+` + `remark-parse@11+` + `remark-gfm@4+` +
`remark-rehype@11+` + `rehype-sanitize@7+` + `rehype-stringify@10+`.**

Pipeline order (Unit 17.2 implementation):

```ts
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize, customSchema)
  .use(rehypeStringify);
```

`allowDangerousHtml: false` at the `remark-rehype` stage ensures
raw HTML in markdown source is stripped at the parse-to-HAST
boundary; rehype-sanitize then re-validates the HAST against the
custom schema as defense-in-depth.

### D-B. Allowed markdown subset

| Element | Phase 17 allowed? | Renders as | Notes |
|---|---|---|---|
| **Bold** (`**text**` / `__text__`) | YES | `<strong>` | Standard CommonMark. |
| **Italic** (`*text*` / `_text_`) | YES | `<em>` | Standard CommonMark. |
| **Inline code** (`` `code` ``) | YES | `<code>` | No syntax highlighting. |
| **Code blocks** (```` ``` ```` fenced) | YES | `<pre><code>` | No syntax highlighting; no language hint enforcement. |
| **Links** (`[text](url)`) | YES | `<a href>` | URL scheme allow-list per D-D; `title` attribute denied. |
| **Bare-URL autolinks** (GFM) | YES | `<a href>` | Same URL allow-list per D-D. |
| **Unordered lists** (`- item`) | YES | `<ul><li>` | Standard. |
| **Ordered lists** (`1. item`) | YES | `<ol><li>` | Standard. |
| **Task lists** (`- [x] item`, GFM) | YES (read-only) | `<input type="checkbox" disabled>` | No interactivity. |
| **Headings** (`# h1` ... `###### h6`) | YES, **demoted** | `<h3>` through `<h6>` (`#` → `<h3>`; `##` → `<h4>`; etc.; per D-C) | Outline preservation. |
| **Blockquotes** (`> text`) | YES | `<blockquote>` | Standard. |
| **Horizontal rules** (`---`) | YES | `<hr>` | Standard. |
| **Strikethrough** (`~~text~~`, GFM) | YES | `<del>` | Standard GFM. |
| **Paragraph** (blank-line separation) | YES | `<p>` | Standard. |
| **Tables** (GFM) | **NO** (Phase 18+) | — | Future Q-candidate. |
| **Footnotes** (GFM) | **NO** (Phase 18+) | — | Future Q-candidate. |
| **Images** (`![alt](url)`) | **NO** (Phase 18+) | — | Bio is text context; avatar lives in `imageOverride` (Phase 16). |
| **Raw HTML** | **NO** | — | rehype-sanitize denies all raw HTML; `allowDangerousHtml: false` at remark-rehype stage too. |
| **`class` attribute / inline `style`** | **NO** | — | rehype-sanitize strips. |
| **Event handlers** (`onclick`, `onerror`, etc.) | **NO** | — | rehype-sanitize strips all `on*` attributes. |
| **`<iframe>` / `<object>` / `<embed>` / `<script>` / `<style>` / `<base>`** | **NO** | — | rehype-sanitize denies. |
| **`<a target>` / `<a rel>`** | **NO** | — | All `<a>` rendered without target / rel; browser default. |
| **`<a title>` attribute** | **NO** | — | Phase 18+ if signal demands; XSS-vector-by-name (title-tag injection). |

**Length cap unchanged**: 280 chars (per ADR-0016 D-A). Phase 17
markdown rendering doesn't expand the cap; users get richer
expressiveness within the same character budget.

### D-C. Heading demotion

**Decision**: source `#` (h1) renders as `<h3>`; `##` (h2) renders
as `<h4>`; `###` (h3) renders as `<h5>`; `####+` renders as
`<h6>` (max).

**Rationale**:
- Page-level `<h1>` is the user's display name on `/u/{handle}`
  + `/profile`.
- Page-level `<h2>` is the activity section heading (e.g., "Edit
  profile", "Activity").
- Bio headings nest within page structure; demoting prevents
  outline collision + maintains semantic-HTML accessibility.
- Implementation: custom rehype plugin OR rehype-sanitize tag
  rewrite. Lean: inline transform in `lib/markdown/index.ts`
  between remark-rehype and rehype-sanitize stages.

### D-D. URL scheme allow-list

**Decision**: `<a href>` allowed schemes = **`https:` + `mailto:`
ONLY**.

| Scheme | Allowed? | Notes |
|---|---|---|
| `https:` | YES | Encrypted-only web links. |
| `mailto:` | YES | Email contact. |
| `http:` | **NO** | Require TLS. |
| `javascript:` | **NO** | XSS vector. |
| `data:` | **NO** | Exfiltration / phishing surface. |
| `file:` | **NO** | Privacy / local-file leak. |
| `vbscript:` | **NO** | Legacy XSS vector. |
| `ftp:` | **NO** | Phase 18+ if signal. |
| `tel:` | **NO** (Phase 18+) | Phone-number contacts; may be added if signal demands. |
| Relative URLs (no scheme) | **NO** | Bio renders on `/[locale]/u/{handle}` + `/profile`; relative URLs would route within OUR site (cross-route abuse); explicit absolute-URL requirement is intentional. |

**Implementation**: rehype-sanitize's `protocols.href` config
restricts the allow-list. Defense-in-depth: bare-URL GFM autolinks
pass through the same `protocols` filter.

### D-E. Render path placement

**Decision**: new `lib/markdown/` module + two consumer
integration points.

- **`lib/markdown/index.ts` (new)**: exports `renderBioMarkdown(text:
  string | null): string | null`. Returns sanitized HTML string;
  null when input null (Phase-15 D-F empty-state preserved); empty
  string when input is "" (caller decides to omit).
- **`lib/markdown/sanitize-schema.ts` (new)**: exports the
  rehype-sanitize schema narrowed per D-B + D-D.
- **`/[locale]/u/[handle]/page.tsx`** (Phase 14 public shell +
  Phase 15 bio + Phase 16 avatar): bio section's `<p
  className="whitespace-pre-wrap">{profile.bio}</p>` replaced with
  `<div className="..." dangerouslySetInnerHTML={{ __html:
  renderBioMarkdown(profile.bio) }} />`. The container `<div>`
  carries prose-styling utilities; rendered HTML is the inner
  content.
- **`/[locale]/profile/page.tsx`** (Phase 10 signed-in own +
  Phase 15 edit form + Phase 16 image upload): read-mode preview
  below the edit form also rendered via `renderBioMarkdown`.
  Edit-form textarea stays plain (markdown source); preview shows
  rendered output on next render after save.

**NO render in AuthControl pill** (no bio there); **NO render on
`/u/{handle}/challenges`** (no bio there); **NO render in
SiteHeader** (no bio there).

### D-F. Server-side only

**Decision**: `unified` pipeline runs in the async server component
render pass at request time. Rendered HTML is inlined via
`dangerouslySetInnerHTML`. **No client-side markdown processing.**

- **Bundle invariant**: First Load JS shared chunk **MUST stay at
  103 kB** end-to-end (unchanged through every Phase 9-16 unit).
  `unified` + dependencies are server-only.
- **No `react-markdown` component** anywhere in the project.
- **No client-side `unified` instance** in any `"use client"`
  boundary.
- **No live-preview** in the edit form Phase 17 (Phase 18+ if
  signal demands).

Caching: no caching Phase 17 (bio markdown renders are cheap at
~280 chars max; `force-dynamic` on `/u/{handle}` re-renders on
each request anyway; per-request rendering matches Phase-15 plain-
text path performance).

### D-G. Couples to markdown-rendered curator review notes

**Decision**: `lib/markdown/renderBioMarkdown` is **bio-specific**
to the Phase-17 scope. Phase-18+ markdown surfaces (curator review
notes `ratingChallenge.reviewNotes` per Phase-15 Class B B.2 item
5; possibly rating-action `rationale`) inherit this module pattern
by adding sibling helpers (`renderReviewNotesMarkdown`,
`renderRationaleMarkdown`).

**Why bio-specific helpers** (vs single generic `renderMarkdown`):
- Different surfaces may have different sanitization schemas
  (curator review notes might allow tables; rating-action
  rationale might allow citations).
- Different surfaces may have different heading demotion rules.
- Different surfaces may have different length caps.
- Sibling helpers keep schema customization local + audit
  boundary explicit per surface.

**Implementation note** (Phase 17): the shared sanitization schema
in `lib/markdown/sanitize-schema.ts` is named `bioSchema` (NOT
`defaultSchema`); Phase 18+ surfaces define their own schemas
(`reviewNotesSchema`, etc.) deriving from a shared base if useful.

**REALIZED Phase 18 Unit 18.2** — `renderReviewNotesMarkdown` +
`reviewNotesSchema` sibling helpers shipped. Surface: curator
review notes on `ratingChallenge.reviewNotes`; first call site
at `/curator/challenges/[id]`; second + third call sites added
on `/profile` and (Phase-26) `/u/{handle}/challenges/{id}`.
`reviewNotesSchema = { ...baseSchemaConfig }` (intentional parity
with `bioSchema`; explicit shallow copy signals "schema may
diverge Phase-19+" — tracked as Q72 candidate Phase-18-onward).

**REALIZED Phase 27 Unit 27.1** — `renderRationaleMarkdown` +
`rationaleSchema` sibling helpers shipped (**third sibling
schema** under this D-G inheritance contract). Surface:
rating-challenge `ratingChallenge.rationale` (NOT NULL per
Phase-11 schema 50-2000 chars; helper signature `string →
string` differs from `bioMarkdown` + `reviewNotesMarkdown` which
accept `string | null`). Four new call sites added in one code
unit: `/u/{handle}/challenges/{id}` (Phase-26 detail page; full
render) + 3 listing pages `/u/{handle}/challenges` + `/profile`
+ `/problems/{slug}/challenges` (full render + CSS `line-clamp-3`
visual truncation; replaces Phase-12 `truncateRationale()`
source-truncation across all 3 listings simultaneously per the
Phase-18 line-clamp-replacing-source-truncation precedent).
`rationaleSchema = { ...baseSchemaConfig }` (intentional parity
with `bioSchema` Phase-27; Phase-28+ Q72-analogue divergence
candidate if user demand surfaces). 10 new vitest tests at
`lib/markdown/index.test.ts` mirror the Phase-18 reviewNotes
test pattern: 7 helper tests + 3 schema parity tests. Phase 27
did NOT need a new ADR — implementation realizes D-G inheritance
at a third call site without architectural surface. Phase-28+
remaining markdown-promotion candidate: rating-action
`dimensions.<dim>.rationale` (distinct schema field from
rating-challenge `rationale`; would extend to a fourth sibling
helper if curator demand surfaces).

**REALIZED Phase 29 Unit 29.1** — `renderActionRationaleMarkdown`
+ `actionRationaleSchema` sibling helpers shipped (**fourth
sibling schema** under this D-G inheritance contract). Surface:
rating-action `RatingAction.dimensions.<dim>.rationale`
(content-side YAML; Velite-validated per ADR-0002 + ADR-0003 +
ADR-0005 every-action-is-complete-snapshot principle; helper
signature `string → string` mirrors Phase-27 `renderRationaleMarkdown`
— rating-action rationale is required per `rating-action.ts`
Zod schema; no null-fallback path). Single render surface:
`app/[locale]/problems/[slug]/ratings/page.tsx` `DimensionCard`
component (Phase-3 surface; replaces `<p className="...whitespace-pre-line">{rationale}</p>`
with `<div className={ACTION_RATIONALE_PROSE_CLASSES}
dangerouslySetInnerHTML={{__html: renderActionRationaleMarkdown(rationale)}} />`).
**`DimensionCard` instantiated 5× per rating action** via
`DimensionsBlock` (difficulty + saturation + urgency + value +
industry_call); per-page call count `5 × actions.length`; all
static-generated at build time.
`actionRationaleSchema = { ...baseSchemaConfig }` (intentional
parity with `bioSchema` Phase-29; Phase-30+ Q72-analogue
divergence candidate if surface-specific demand surfaces — Q72
family now expanded to **3 sibling-divergence candidates** at
Phase 29 entry: `reviewNotesSchema` + `rationaleSchema` +
`actionRationaleSchema`). 11 new vitest tests at
`lib/markdown/index.test.ts` mirror the Phase-18 + Phase-27
sibling-test pattern: 8 helper tests + 3 schema parity tests
(one additional test beyond Phase-27 documents wikilink
preservation as literal text — see Phase-29 Class B.14 below).
Phase 29 did NOT need a new ADR — implementation realizes D-G
inheritance at a fourth call site without architectural surface.

This realization is the **first content-side (Velite-validated
YAML) markdown render call site** under this D-G contract. The
three prior siblings all consume DB-backed columns via Drizzle
(`users.bio`, `ratingChallenges.reviewNotes`,
`ratingChallenges.rationale`); Phase-29 K consumes a Velite
`RatingActions` collection field at build time. **Establishes
the convention that ADR-0018 D-G inheritance is storage-layer-
agnostic** — DB-backed and content-backed surfaces share the
same sanitization audit boundary. The Phase-17 anticipation in
this file's header comment ("Phase-18+ markdown surfaces ...
possibly rating-action `rationale`") is realized **12 phases
later** (Phase 17 → Phase 29 anticipation-to-realization gap);
load-bearing test of D-G inheritance-contract durability.

**Phase-30+ Class B.14 (NOT promoted to Q absent demand
signal)**: rating-action rationale **wikilink resolution**.
Existing YAML content contains `[[problem-slug]]` syntax (e.g.,
`hallucination-reduction/2026-05-14-initial.yaml` value
rationale references `[[scalable-oversight]]` +
`[[long-context-rag]]`). Phase-29 markdown promotion renders
these as literal text — `remark-parse` lacks native wikilink
support; `remark-gfm` does not add wikilink extension; this
D-G tag allow-list excludes custom wikilink elements; no
`remark-wiki-link` plugin in the pipeline. **No regression** vs
the prior Phase-3 `whitespace-pre-line` renderer. Active
wikilink resolution is Phase-30+ candidate gated on demand
signal + cross-surface scope decision (challenge rationale +
review notes + bio could also use wikilinks — needs scope
decision first) + ADR-0018 D-G amendment shape or new ADR if
semantics evolve beyond simple slug-to-href mapping. Could
couple with Q72 family (sibling-divergence candidates) into a
single "markdown evolution" ADR-0021-candidate scope if either
surfaces demand.

**RESOLVED Phase 38 Units 38.1 + 38.2** — Class B.14 (rating-
action rationale wikilink resolution) **structurally CLOSES**
via Phase-37 framework consumption: new
`lib/markdown/extensions/wikilinks.ts` ships the
`rehypeResolveWikilinks` plugin + `WikilinkExtensionRegistry`
class (Unit 38.1; 15 plugin-level + registry tests); new
`MARKDOWN_EXTENSIONS=wikilinks` env-var dispatch arm in
`getExtensionRegistry()` wires it through the Phase-37 factory
(Unit 38.2; 9 dispatch tests + 9 end-to-end actionRationale
render tests). All three Phase-30+-promotion gates documented
above are satisfied:

1. **Demand signal**: 16 `[[problem-slug]]` occurrences across
   rating-action YAMLs at Phase-38 ship — every concrete
   instance references a slug in `content/problems/`.
2. **Cross-surface scope decision**: single-surface scope
   Phase 38 (`actionRationale` ONLY); `bio` + `reviewNotes` +
   `rationale` continue to receive empty extension set per
   `WikilinkExtensionRegistry`'s default-deny. Cross-surface
   expansion Phase 39+ if demand surfaces (zero current
   evidence outside actionRationale).
3. **ADR-0018 D-G amendment shape**: APPEND-not-EDIT (mirrors
   Phase 27 + 29 + 37 APPENDs); Phase-38 EXTENDED block above
   adds APPEND-D-H through APPEND-D-L documenting plugin shape
   + XSS-safety boundary + URL convention + per-surface
   activation + Phase-39+ deferrals.

The Q72-family coupling speculated in this paragraph's last
sentence ("could couple with Q72 family ... into a single
'markdown evolution' ADR-0021-candidate scope") DID NOT
materialize — Q72 closed independently Phase 37 Unit 37.3 via
the Phase-37 schema-divergence framework, and B.14 closed
independently Phase 38 Units 38.1 + 38.2 via the Phase-37
framework's `rehypePlugins` consumption. Both used the SAME
framework (Phase-37 `MarkdownExtensionRegistry`) but as
separate consumers; the speculated single "markdown evolution"
scope was not needed. **9+ phase B.14 carryover** (Phase 29 →
Phase 38; second-longest B-class carryover in project history
after B.15 item 1 22+ phase Phase-30 closure of Q5 punt).

**EXTENDED Phase 37 Unit 37.1** — Q72 markdown schema-divergence
**framework realized** via new `lib/markdown/extensions/` module
(`types.ts` + `default.ts` + `index.ts` + 2 test files; 5 files
total mirroring Phase-35 `lib/moderation/` shape verbatim).
Defines `MarkdownExtensionRegistry` interface +
`MarkdownExtensionSet` per-surface configuration shape +
`MarkdownSurface` literal union over the **four wired surfaces**
(`"bio"` Phase 17 + `"reviewNotes"` Phase 18 + `"rationale"`
Phase 27 + `"actionRationale"` Phase 29). Default
`DefaultExtensionRegistry` returns empty extension set (`{}`)
for all four surfaces — **Day-1 behavioral parity** with the
existing Phase-18/27/29 baseline once Unit 37.2 wires the
registry into the four markdown helpers; folding empty plugin
lists + empty schema overrides into the existing `unified`
pipelines is a no-op. **First framework-only-ADR pattern reuse
in a new domain** — Phase 35 established framework-only via
ADR-0024 in the content-moderation domain; Phase 37 validates
the pattern's reusability in the markdown-rendering domain.

**4-surface path correction** documented explicitly: the
Phase-37-prep doc (`docs/thinking/37.0-phase-37-prep.md`)
anticipated **3 surfaces** (`"bio"` + `"reviewNotes"` +
`"rationale"`) and overlooked `"actionRationale"` which
shipped Phase 29 (a phase AFTER the Q72 candidate was first
noted in Phase 18). Unit 37.1 expanded the `MarkdownSurface`
union to all 4 wired surfaces — otherwise the framework would
ship with an architectural gap from day one on the most-
recently-added markdown surface. Documented mirror of the
Phase-35 path correction (Phase-35-prep anticipated
`app/api/v1/profile/update/route.ts` + `lib/images/transcode.ts`;
actual wiring landed at `lib/users/updateProfile` +
`lib/users/updateProfileImage` per ADR-0019 D-F APPEND).

**Path A** (no new ADR) chosen per Phase-37-prep D-9 lean.
This APPEND extends D-G; **ADR-0025 candidate slot saved** for
Phase 38+ concrete-content-moderation-provider commitment OR
other architectural concern surfacing first. (Path B would
have shipped this framework as a new ADR-0025 mirroring
ADR-0024 shape exactly; rejected as less-defensible per slot-
preservation discipline.)

**APPEND-D-A registry interface** — single-method
`getExtensions(surface: MarkdownSurface): MarkdownExtensionSet`
per Phase-37-prep D-10 lean. Adding a new surface (Phase 38+)
means appending one entry to the `MarkdownSurface` union + one
`case` arm in `DefaultExtensionRegistry.getExtensions` (exhaustive
switch with no `default` arm — TypeScript flags missing arms at
compile time). Per-surface methods rejected (5× method additions
per new surface).

**APPEND-D-B `MarkdownExtensionSet` shape** — three optional
fields per Phase-37-prep D-3 D-A:
- `remarkPlugins?: ReadonlyArray<Pluggable>` — `unified`
  pluggable type.
- `rehypePlugins?: ReadonlyArray<Pluggable>`.
- `schemaOverrides?: Partial<Schema>` — `rehype-sanitize`
  `Options as Schema` alias diff.

Empty `{}` is a valid set (= no extensions for that surface);
`DefaultExtensionRegistry` returns `{}` for all four.

**APPEND-D-C override-replace semantics** (Phase-37-prep D-11
lean): a future `MarkdownExtensionSet` with `schemaOverrides:
{ tagNames: ["p", "table", ...] }` **replaces the entire base
`tagNames` array**; callers supply the COMPLETE replacement
for any field they override. The framework does NOT deep-
merge. Future curators must include the full base list when
overriding a field whose default they wish to extend rather
than replace. Audit-friendly: a single grep of `schemaOverrides`
call sites shows the full sanitization surface of each
extension; no implicit per-key merging that would require
multi-file reasoning.

**APPEND-D-D plugin order: after default plugins** (Phase-37-
prep D-12 lean) — extension plugins fold into the unified
pipeline AFTER `remark-parse` + `remark-gfm` (remark side) and
AFTER `rehype-sanitize` + `rehypeDemoteHeadings` +
`rehypeStripUnsafeHrefs` (rehype side). Extensions are post-
processing; the default pipeline establishes the trusted
sanitization baseline first. Rationale: a future
`rehype-wikilink` plugin transforming `[[slug]]` → `<a
href="/problems/slug">` must run AFTER `rehype-sanitize` so
the wikilink-generated `<a>` is added to the post-sanitize
tree (sanitized output stays trustworthy; new elements are
added under the framework's explicit schema-override allow-
list, not slipped past the sanitizer).

**APPEND-D-E factory shape** (Phase-37-prep D-3 D-C) —
`getExtensionRegistry(): MarkdownExtensionRegistry` lazy
singleton + `__resetRegistryForTests` hook. Mirrors
`getModerator()` Phase-35 + `lib/email/` Resend-client
Phase-30 patterns. Phase 37 has a single default dispatch arm
(returns `DefaultExtensionRegistry`); future Phase 38+ env-var
dispatch (e.g., `MARKDOWN_EXTENSIONS=wikilinks`) adds dispatch
arms with throw-on-unknown discipline mirroring
`getModerator()` D-E.

**APPEND-D-F Phase 38+ deferrals** — concrete extensions land
as new files in `lib/markdown/extensions/` + new factory
dispatch arms:
- **wikilink resolution** per-bio + per-rationale + per-
  reviewNotes + per-actionRationale (Class B.14 carried since
  Phase 29; couples with this Q72 family per Phase-29 D-G
  REALIZED block).
- **GFM tables** per-reviewNotes (D-H Phase-18-deferral
  re-articulated through the framework).
- **GFM footnotes** per-rationale (D-H Phase-18-deferral).
- **`![alt](url)` images** per-bio (D-H Phase-18-deferral).
- **`tel:` URL scheme** per-actionRationale (D-D allow-list
  extension).
- **`<a title>` attribute** per-surface (D-H Phase-18 XSS-
  audit-required extension).
- **Syntax-highlighted code blocks** per-surface (D-H Phase-
  18-deferral).
- **`@mentions`** per-surface (D-H Phase-18-deferral).
- **Per-curator extension preferences** (DB-backed override
  layered atop the env-var dispatch).
- **Curator-facing extension-enable UI** (`/curator/extensions`).
- **Live preview in edit form** (D-H Phase-18 caveat: breaks
  103 kB First Load JS invariant; requires client-boundary
  scope decision).
- **Configurable schema per-user** (D-H Phase-18-deferral
  unchanged).

Each concrete-extension deferral above ships as an independent
1-2-unit Phase 38+ commit consuming the Phase-37 framework
without re-architecting the 4 markdown helpers. **Reversibility
preserved** per ADR-0018's foundational discipline.

**APPEND-D-G zero-cost-default discipline** — Phase 37 ships
**zero new runtime dependencies** + **zero new env vars** Day 1
+ **zero new operational gates** + **zero new migrations** +
**zero new i18n keys** + **zero new ADRs** (Path A). The
framework's existence at the default empty-extension-set
configuration is behaviorally indistinguishable from the
Phase-18/27/29 baseline. First Load JS shared chunk **UNCHANGED
at 103 kB** end-to-end (53rd consecutive unit at 103 kB on
Unit 37.1 ship). Mirrors the Phase-35 `lib/moderation/` zero-
cost-default discipline.

**EXTENDED Phase 38 Unit 38.1** — first concrete Phase-37-
framework consumer: **wikilink resolution on `actionRationale`
surface** via the framework's `rehypePlugins` slot + new
`lib/markdown/extensions/wikilinks.ts` module (~120 lines
including JSDoc + ~15 plugin-level + registry-level tests).
Closes **Class B.14 at 9+ phase carryover** (Phase-29 D-G
REALIZED block surfaced "rating-action rationale wikilink
resolution" as Class B.14; carried unchanged through every
Phase 30-37 acceptance-gate boundary; never promoted to top-
level Q). **First concrete Phase-37-framework consumer in
project history** — validates the framework's "zero-rework
consumption" property documented in Phase-37 APPEND-D-G (the
Phase-38 implementation needed zero edits to Phase-37
framework files; only NEW files added + factory dispatch arm
in Unit 38.2).

**Demand signal at Phase-38 ship**: **16 `[[problem-slug]]`
occurrences** across rating-action YAMLs (per `grep -rn '\[\['
content/problems/`) — every concrete instance references a
slug that exists in `content/problems/`. All currently render
as literal text per Phase-29 markdown promotion. The framework-
consumption ships per-surface activation: `actionRationale`
ONLY at Phase-38 default; the other three markdown surfaces
(`bio` + `reviewNotes` + `rationale`) continue to receive the
empty extension set per `WikilinkExtensionRegistry`'s
`getExtensions` default-deny.

**APPEND-D-H wikilink plugin shape** —
`rehypeResolveWikilinks` rehype plugin walks the post-sanitize
HAST tree, finds text-node substrings matching kebab-case
`[[slug]]` pattern via `WIKILINK_PATTERN = /\[\[([a-z0-9-]+)\]\]/g`,
and splice-replaces each match with an `<a
href="/problems/{slug}">{slug}</a>` element node. **Folds
AFTER `rehype-sanitize` + `rehypeStripUnsafeHrefs` per Phase-37
framework's APPEND-D-D plugin-order-after-default discipline**
— the relative `/problems/{slug}` href bypasses the strip step
because the wikilink plugin adds the link AFTER that step
runs. This is the **first framework-emitted relative URLs in
markdown output** in project history; documents the framework's
"extensions fold after default plugins" design value for
relative-URL-emitting extensions specifically.

**APPEND-D-I XSS-safety boundary** — the wikilink plugin
emits `<a>` elements + `href` attributes that have NOT been
validated by `rehype-sanitize` (`rehype-sanitize` ran BEFORE
the wikilink plugin in the pipeline). The security contract
relies on the plugin's regex `[a-z0-9-]+`:

- Slug pattern is restrictive: kebab-case only; no special
  chars; no path traversal; no scheme injection.
- Href format is fixed: `/problems/${slug}` — no user-
  controllable URL component beyond the validated slug.
- Slug-as-text content is also safe (same restrictive
  character set as href).

**The regex IS the validation.** Anything not matching
`[a-z0-9-]+` falls through as literal text. A curator-
authored YAML rationale containing
`[[javascript:alert(1)]]` would NOT match the wikilink
pattern (special chars in the inner brackets); it renders as
literal `[[javascript:alert(1)]]`. This is the documented
contract for Phase-38 + Phase-39+ framework-consumer
implementations: each post-sanitize extension MUST validate
its own output OR emit only fixed-shape elements
parameterized by regex-validated tokens.

**APPEND-D-J URL-resolution convention** — Phase 38 ships
**locale-less hrefs** (`/problems/{slug}`) per Path A lean
from Phase-38-prep D-8. Next.js i18n middleware (ADR-0011)
forwards `/problems/{slug}` → `/{locale}/problems/{slug}` at
request time using the visitor's current-locale cookie. Phase
39+ may adopt locale-aware hrefs if middleware-redirect
overhead becomes a measurable concern (no evidence yet).

**APPEND-D-K `WikilinkExtensionRegistry` per-surface
activation** — class constructor takes
`ReadonlySet<MarkdownSurface>`; `getExtensions(surface)`
returns `{ rehypePlugins: [rehypeResolveWikilinks] }` for
enabled surfaces, `{}` otherwise. Phase-38 default =
`PHASE_38_DEFAULT_ENABLED_SURFACES = new Set(["actionRationale"])`.
Future surface-list-as-env-var (e.g.,
`MARKDOWN_EXTENSIONS_WIKILINKS_SURFACES=actionRationale,bio`)
deferred to Phase 39+ if multi-surface demand surfaces — no
content evidence currently outside actionRationale (zero
`[[slug]]` occurrences in `users.bio` + `ratingChallenges.reviewNotes`
+ `ratingChallenges.rationale` DB-backed content as of
Phase-38 ship).

**APPEND-D-L Phase 39+ deferrals** (Phase-38 wikilink consumer
scope cap):

- **Cross-surface wikilink expansion** — bio + reviewNotes +
  rationale wikilinks; demand-signal-first; constructor-arg
  change with zero plugin or registry rework.
- **Multi-anchor `[[slug|display-text]]` syntax** — GitHub-wiki-
  flavor alias (e.g., `[[scalable-oversight|the oversight
  problem]]`); zero content evidence.
- **Cross-entity wikilinks** — `[[paper-id]]` → `/papers/{id}`;
  `[[author-slug]]` → `/authors/{slug}`; `[[institution-slug]]`
  → `/institutions/{slug}`. Requires entity-type
  disambiguation in syntax (current `[a-z0-9-]+` matches all
  three); Phase 39+ if cross-entity demand surfaces.
- **`<a class="wikilink">` styling** — schemaOverride needed
  to allow `class` attribute on `<a>`. Phase 39+ if visual-
  styling demand surfaces.
- **404 handling for unresolved slugs** — currently
  `[[unknown-slug]]` generates `<a
  href="/problems/unknown-slug">unknown-slug</a>` pointing at
  a 404 (matches the existing markdown-link-to-nonexistent-URL
  behavior; same failure mode as a regular markdown link to a
  bad URL). Phase 39+ may add build-time validation against
  `content/problems/` directory listing + render-time fallback
  to literal text.
- **Plugin parameterization** — `rehypeResolveWikilinks` is
  hardcoded to `/problems/${slug}` path Phase 38; Phase 39+
  cross-entity expansion would parameterize via plugin options
  (`{ buildHref: (slug) => string }`).

### D-H. Phase 18+ deferrals

Phase 17 ships MINIMAL markdown surface. Deferred to Phase 18+:

| Concern | Class | Notes |
|---|---|---|
| **GFM tables** | UX | Phase 18+ if signal demands; rehype-sanitize schema extension. |
| **GFM footnotes** | UX | Phase 18+ if signal demands. |
| **Images** (`![alt](url)`) | UX | Phase 18+; couples to image-URL sanitization (Vercel Blob URL pattern + external URL allowlist from Phase 16 work). |
| **Syntax-highlighted code blocks** | UX + perf | Separate dep (Prism / Shiki / highlight.js); ~80-300 kB transitive; Phase 18+. |
| **Bio length expansion** beyond 280 chars | UX | Defer; observation may demand 500-1000 chars; Phase 18+. |
| **Markdown-rendered curator review notes** | Surface expansion | Phase-15 Class B B.2 item 5; inherits this ADR's pipeline via sibling helper; ~1-2 units when promoted. |
| **Markdown in rating-action `rationale`** | Surface expansion | Same inheritance; Phase 18+ if curator demand. |
| **`@mentions`** (linking @handle to `/u/{handle}`) | UX | Phase 18+ if signal demands; needs `@`-handle detection + `/u/{handle}` link rewrite. |
| **GitHub Flavored task-list interactivity** | UX | Read-only Phase 17; defer. |
| **Live preview in edit form** | UX | Phase 17 ships read-after-save preview; Phase 18+ may add live preview via client boundary (would break 103 kB invariant — needs careful scope). |
| **`<a target>` / `<a rel>` attributes** | UX | Defer; current default is browser-controlled. |
| **`<a title>` attribute** | XSS audit | XSS-vector-by-name; Phase 18+ if signal demands + careful audit. |
| **Tel / FTP URL schemes** | UX | Phase 18+ if signal. |
| **Markdown subset configurable per-user** | UX | Defer; single schema for Phase 17. |
| **HTML sanitization via DOMPurify on client** | Defense-in-depth | Server-side rehype-sanitize is sufficient; defer. |

## Consequences

### Positive

- **Closes [Q66](../../OPEN_QUESTIONS.md#q66-markdown-rendering-in-bio)**
  with a concrete architectural pin (anticipated promotion:
  `open` → `resolved` in Unit 17.5).
- **Closes the Phase 14 → 15 → 16 → 17 identity-surface arc** —
  Phase 14 read-only profile; Phase 15 editable text fields;
  Phase 16 editable image; Phase 17 expressive text. Identity-
  surface arc complete.
- **No new public-data category** introduced (per ADR-0015 D-A
  invariant preserved). Markdown rendering changes the format,
  not the data class.
- **First markdown processing pipeline in project history**
  established. Phase-18+ markdown surfaces inherit via sibling
  helpers in `lib/markdown/`.
- **First XSS-audit surface in project history**. Sanitization
  layer is explicit + audit-friendly + defended in depth (D-B
  schema + D-D URL allow-list + D-F server-side + magic-byte-
  like multi-stage pipeline).
- **First `dangerouslySetInnerHTML` surface in project history**
  — XSS-safe by ADR-0018 sanitization.
- **First phase since Phase 9 to ship zero migrations** — confirms
  Phase-17 thread's lighter scope vs Phase 12/14/15/16's schema-
  touching phases.
- **First new runtime dep cluster since Phase 16** (~120 kB
  server-only). 1-phase dependency-discipline interval.
- **Server-side rendering preserves bundle invariant**. First
  Load JS shared chunk **UNCHANGED at 103 kB** end-to-end through
  every Phase 9-17 unit.
- **`unified` ecosystem is de-facto standard** — widely vetted +
  community-audited + battle-tested sanitization.
- **Multi-stage pipeline boundary** is audit-friendly.
- **Reversibility**: tables / footnotes / images / syntax-
  highlighting / `@mentions` each promote Phase 18+ via schema
  extension (no architectural rework).
- **Scope cap honored**: Phase 17 ships ~7 units (smaller than
  prior 9-unit phases); Q66 plus subset of D-H deferrals.

### Negative

- **Heavy transitive dep set** (~120 kB; ~6 packages). Mitigation:
  server-only.
- **`dangerouslySetInnerHTML` is XSS-attack-vector by name**.
  Mitigation: rehype-sanitize is the line of defense; D-D URL
  allow-list defense-in-depth; D-B schema is conservative.
- **No live-preview in edit form Phase 17**. Mitigation: Phase 18+
  if signal demands.
- **Heading demotion** is non-standard markdown behavior; users
  expecting `# H1` to render as `<h1>` may be surprised.
  Mitigation: D-C is intentional; page outline integrity wins.
- **No table / footnote / image / syntax-highlighting support
  Phase 17**. Mitigation: each is a separate Phase 18+ candidate;
  schema extension is incremental.
- **Single shared schema** (Phase 17) — different surfaces may
  want different schemas. Mitigation: sibling helpers Phase 18+;
  D-G documents the inheritance shape.
- **Sanitization schema requires audit**. Mitigation: D-B + D-D
  documents the subset; Unit 17.2 ships ~10-vector XSS test
  suite as defense.

## Cross-references

- **§3.1** "ratings are revisable" framing extended to user
  expressiveness.
- **§14.4** CHANGELOG + ADR contract.
- **§15.5** reviewer-mode mindset (applied throughout
  deliberation; drivers for SVG-like allow-list approach +
  multi-stage pipeline boundary).
- **[ADR-0004](./0004-file-first-no-db.md)** file-first / no-DB-
  for-content (preserved — Phase 17 ships USER-STATE markdown
  rendering only; content stays file-first).
- **[ADR-0011](./0011-i18n-strategy.md)** i18n strategy
  (preserved — bio text is user-authored content per user's
  language choice; rendering pipeline is locale-agnostic).
- **[ADR-0013](./0013-db-choice.md)** DB choice (D-F USER-STATE
  preserved; no schema change Phase 17).
- **[ADR-0015](./0015-per-user-privacy-model.md)** D-A public-data
  invariant preserved.
- **[ADR-0016](./0016-user-editable-profile-fields.md)** D-F
  Phase-16+ markdown deferral — this ADR closes that deferral;
  D-A field set preserved (length cap UNCHANGED at 280 chars).
- **[ADR-0017](./0017-image-storage.md)** Phase-16 image storage
  surface unchanged.
- **[OPEN_QUESTIONS Q66](../../OPEN_QUESTIONS.md#q66-markdown-rendering-in-bio)**
  (promoted in Unit 17.5 alongside this ADR's acceptance).
- **[Unit 17.0 prep](../thinking/17.0-phase-17-prep.md)** D-1
  through D-10 (the Phase-17 thread recommendation + decision
  ledger this ADR pins).
- **Phase-9 Class B item 12** middleware-based auth-route
  protection (unaffected — no new protected route; threshold
  stays at 2).
- **Phase-15 Class B B.2 item 5** markdown-rendered curator
  review notes (Phase-18+ inheritance path; D-G documents).
- **Phase-18+ candidates surfaced by D-H**: GFM tables /
  footnotes / images / syntax-highlighting / `@mentions` /
  reviewNotes / rationale / live preview / longer bio caps.
