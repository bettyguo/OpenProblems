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

**EXTENDED Phase 39 Unit 39.1** — second concrete Phase-37-
framework consumer: **GFM tables on `reviewNotes` surface**
via the framework's `schemaOverrides` slot + new
`lib/markdown/extensions/tables.ts` module (~70 lines + ~11
tests covering allow-list content + override-replace contract
+ registry class). Validates the **framework slot Phase 38
did NOT exercise** — Phase 38 wikilinks consumer used only
`rehypePlugins`; after Phase 39 the framework has 2 real
consumers exercising 2 of 3 slots; only `remarkPlugins`
remains as Phase-40+ deferral. **First "framework + 2
consumers" 3-phase cluster in project history** (Phase 37
framework + Phase 38 wikilinks + Phase 39 tables).

**APPEND-D-M tables consumer shape** —
`TablesExtensionRegistry` takes `ReadonlySet<MarkdownSurface>`
constructor arg; `getExtensions(surface)` returns
`{ schemaOverrides: GFM_TABLE_SCHEMA_OVERRIDES }` for
enabled surfaces, `{}` otherwise. Phase-39 default =
`PHASE_39_DEFAULT_ENABLED_SURFACES = new Set(["reviewNotes"])`
— the 4000-char curator review notes field (Phase-12
ADR-0014) is the natural surface for tabular COI
comparisons / multi-criterion scoring / structured editorial
reasoning. **`remark-gfm` already parses tables** (Phase-17
pipeline); they were STRIPPED at sanitize because `<table>`
was not in the Phase-17 base allow-list. Phase 39 adds the
tags through `schemaOverrides` — **no new runtime dep, no
new remark plugin, no plugin-order concerns**.

**APPEND-D-N first real-consumer exercise of APPEND-D-C
override-replace semantics** — `GFM_TABLE_SCHEMA_OVERRIDES`
supplies the FULL Phase-17 base `tagNames` allow-list
verbatim PLUS 6 new table tags (`<table>`, `<thead>`,
`<tbody>`, `<tr>`, `<th>`, `<td>`); same shape for
`attributes` (full base verbatim PLUS new `th` / `td`
entries). **First real-consumer exercise** of the framework's
documented "callers supply complete replacement; no deep-
merge" contract. Phase 37 + 38 only tested override-replace
with synthetic test extensions (Unit 37.2's reviewNotes
`tagNames: ["p", "strong"]` test); Phase 39 makes it a
production contract realization. **Divergence-detector test
pattern**: `tables.test.ts` asserts that every entry in
`bioSchema.tagNames` appears in `GFM_TABLE_SCHEMA_OVERRIDES.tagNames`,
so a future ADR-0018 D-B base allow-list expansion that
omits this override surfaces as a test failure.

**APPEND-D-O XSS-audit boundary for tables** — 6 table tags
added are well-understood HTML semantic structure with no
XSS-vector-by-name concerns. `align` attribute on
`<th>` / `<td>` is **value-restricted to `"left" | "center" |
"right"`** via the `[attrName, ...allowedValues]` tuple form;
any other `align` value (including injected JavaScript) is
stripped by `rehype-sanitize`. No `<style>` / `<script>` /
`onclick` / `class` attributes added; the sanitization audit
boundary remains the same surface size for tables as for the
Phase-17 base.

**APPEND-D-P factory dispatch arm** = `MARKDOWN_EXTENSIONS=tables`
joins `MARKDOWN_EXTENSIONS=wikilinks` as the second non-
default dispatch arm in `getExtensionRegistry()` (Unit 39.2).
**Mutually exclusive Phase 39** — operator picks ONE
extension OR the default; multi-value composition
`MARKDOWN_EXTENSIONS=wikilinks,tables` deferred to Phase 40+
per Phase-38-prep D-11 deferral. Would require a
`CompositeExtensionRegistry` that merges per-surface
extension sets from multiple component registries; premature
absent operational need for both extensions simultaneously.

**APPEND-D-Q Phase 40+ deferrals** (Phase-39 tables-consumer
scope cap):

- **Multi-value `MARKDOWN_EXTENSIONS=wikilinks,tables` env-var
  composition** — first composition demand emerges when both
  consumers' surfaces are needed simultaneously; Phase 40+
  if signal.
- **Cross-surface table expansion** — bio + rationale +
  actionRationale could enable tables; demand-signal-first;
  constructor-arg change with zero plugin or registry
  rework.
- **Table-specific attributes** — `colspan` / `rowspan` /
  `scope` on `<th>` / `<td>` for accessibility +
  multi-cell tables; Phase 40+ if demand. Each needs XSS
  audit (numeric-only restriction for span; literal-only
  restriction for scope).
- **`<caption>` element** — GFM doesn't have caption syntax;
  Phase 40+ if non-GFM extension surfaces.
- **`remarkPlugins` slot consumer** (the third framework
  slot) — Phase 38 used `rehypePlugins`; Phase 39 used
  `schemaOverrides`; Phase 40+ candidate consumer for
  `remarkPlugins` would complete the 3-of-3 slot
  demonstration. Candidates: `@mention` resolution
  (needs new plugin authoring) OR custom remark transform
  for some markdown extension not covered by `remark-gfm`.
- **Surface-specific table schemas** — different surfaces
  could enable different table feature sets (e.g.,
  `reviewNotes` allows `colspan`; `bio` does not). Phase
  40+ if cross-surface tables emerge with different
  requirements.

**EXTENDED Phase 40 Unit 40.1** — **multi-consumer composition
infrastructure** via new `lib/markdown/extensions/composite.ts`
module: `CompositeExtensionRegistry` wraps a
`ReadonlyArray<MarkdownExtensionRegistry>` of component
registries; `getExtensions(surface)` walks all components and
merges their per-surface extension sets per APPEND-D-R
composition rules. **Closes Phase-38-prep D-11 deferral**
(multi-value `MARKDOWN_EXTENSIONS` composition) **AND
Phase-39 mutual-exclusivity wrinkle** (Phase 38 + 39 dispatch
arms were alternatives, not composable). **First multi-
consumer composition infrastructure** under Phase-37 framework.
**Seventh APPEND on ADR-0018 D-G** — extends the **first-ADR-
D-clause-with-most-APPENDs record** from 6 → 7. **First
explicit conflict-error within a registry class** in project
history (the composite throws on schemaOverrides conflict;
mirrors `getExtensionRegistry()` throw-on-unknown discipline).

**APPEND-D-R composition rules**:

| Slot | Composition semantics | Order |
|---|---|---|
| `remarkPlugins` | Concatenated across all components | Component registration order |
| `rehypePlugins` | Concatenated across all components | Component registration order |
| `schemaOverrides` | **At most one component per surface**; throws on conflict | N/A |

The `schemaOverrides` conflict-error is the loud-failure
analog to `getExtensionRegistry()` throw-on-unknown
(Phase-37 APPEND-D-E discipline): under APPEND-D-C
override-replace semantics two components both providing
`schemaOverrides.tagNames` (or any field) cannot be safely
merged — the framework explicitly rejects deep-merge.
Throwing on conflict surfaces the misconfiguration loudly
at first call rather than silently dropping one component's
override.

**APPEND-D-S Phase 38+39 composition is conflict-free**:
wikilinks uses `rehypePlugins` only on `actionRationale`
(via `WikilinkExtensionRegistry(Set(["actionRationale"]))`);
tables uses `schemaOverrides` only on `reviewNotes` (via
`TablesExtensionRegistry(Set(["reviewNotes"]))`); the two
consumers' enabled surfaces are disjoint AND each consumer
uses a single distinct slot. Composing them via
`CompositeExtensionRegistry([wikilinks, tables])` produces:
`actionRationale` gets wikilinks; `reviewNotes` gets tables;
`bio` + `rationale` get nothing. Composition order does NOT
affect the outcome (both orderings produce the same result
for any surface) — verified by test.

**APPEND-D-T Phase 41+ deferrals** (Phase-40 composition
scope cap):

- **Resolvable schemaOverrides conflicts** — Phase 40 throws
  on any conflict; Phase 41+ could implement field-level
  resolution (e.g., union of `tagNames` arrays if neither
  component replaces the base; deep-merge for `attributes`
  per-tag arrays). Each resolution rule needs explicit
  documentation + tests + XSS audit. Demand-signal-first;
  zero current need.
- **Order-dependent composition** — Phase 40 composition is
  order-independent for the disjoint-surface Phase-38+39 case;
  not guaranteed in general. Future overlapping consumers
  may require an explicit precedence parameter.
- **Weighted composition** — registries with weighted
  precedence for cases where order is ambiguous (e.g., one
  consumer marked "base" and another marked "override").
- **Composition introspection API** — given a composite,
  enumerate which component contributed each plugin or
  schema-override for debugging. Phase 41+ if debugging
  composition becomes a recurring task.

**EXTENDED Phase 41 Unit 41.1** — **third concrete Phase-37-
framework consumer**: arXiv ID auto-link on `rationale` surface
via `remarkPlugins` slot + new `ArxivExtensionRegistry`.
**Completes 3-of-3 framework slot demonstration via real
consumer**: Phase 38 wikilinks exercised `rehypePlugins`;
Phase 39 tables exercised `schemaOverrides`; Phase 41 arxiv
closes the cycle by exercising the third optional slot
`remarkPlugins`. **First mdast-level synthesis-emitting remark
plugin** in project history (`remark-gfm` is a syntax-parser;
arxiv autolinks splice new `link` nodes from inside pre-existing
`text` nodes via regex pattern match). **First absolute-URL
emission** by a framework extension (wikilinks emit relative
`/problems/<slug>`; tables emit no URLs; arxiv emits
`https://arxiv.org/abs/<id>`). **First `rationale`-surface
extension** — after Phase 41 ship, only `bio` remains
un-enabled-for-any-consumer among the four wired surfaces.
**First 3-way composition feasibility** —
`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv` becomes a valid
env-var value Phase 41 (3 distinct slots × 3 disjoint surfaces;
conflict-free under APPEND-D-R rules). **Eighth APPEND on
ADR-0018 D-G** — extends the **first-ADR-D-clause-with-most-
APPENDs record** from 7 → 8.

**APPEND-D-U arxiv plugin shape** —
`lib/markdown/extensions/arxiv.ts` exports `remarkLinkArxivIds`
mdast plugin walking `text` nodes with the pattern
`/\barxiv:(\d{4}\.\d{4,5})(v\d+)?\b/gi` (case-insensitive
prefix; word-boundary anchors prevent mid-word matches;
modern post-2007 arXiv-ID format only). Each match
splice-replaces the `text` node with a sequence
`[Text?, Link, Text?]` (leading + trailing text preserved). The
emitted `Link` node has `url: https://arxiv.org/abs/<id>[<version>]`
and `children: [{ type: "text", value: <verbatim-match> }]` —
source casing of the `arxiv:` prefix and any version suffix
preserved in the visible link text. The plugin folds at the
remark stage AFTER `remark-parse` + `remark-gfm` per the
Phase-37 framework's APPEND-D-D plugin-order-after-default
discipline; emitted `link` nodes flow through the standard
`remark-rehype` mdast→hast bridge.

**APPEND-D-V XSS-safety boundary** — the arxiv plugin
synthesizes `<a href="https://arxiv.org/abs/...">` elements that
must pass the existing Phase-17 sanitization audit boundary.
Three safety properties combine:

1. **Regex IS validation** (mirrors Phase-38 APPEND-D-I
   wikilink discipline): `\d{4}\.\d{4,5}(v\d+)?` is restrictive
   — only digits + literal dot + optional `v<digits>` suffix.
   No path traversal, no query string, no fragment, no
   protocol injection — the plugin emits a URL constructed
   from regex captures, never from arbitrary input.
2. **Absolute URL with `https:` scheme**: the emitted href
   begins `https://arxiv.org/abs/` verbatim. The `https:`
   scheme is in `bioSchema.protocols.href` allow-list; the
   `arxiv.org` domain is a fixed string. `rehypeStripUnsafeHrefs`
   passes `https://` URLs unchanged (it strips only
   `javascript:` / `data:` / `file:` / relative URLs).
3. **`<a>` + `href` allow-listed Phase-17**: the emitted
   element + attribute already pass the base sanitize schema
   verbatim — **NO `schemaOverrides` required** for arxiv
   autolinks. This is the first framework consumer to require
   ZERO sanitize-schema cooperation; wikilinks needed plugin-
   order discipline (after `rehypeStripUnsafeHrefs`); tables
   needed `schemaOverrides` for new tag-names.

The plugin emits no other element types and no other
attributes; the audit surface is the `Link` node's `url`
field, which is constructed from regex captures only.

**APPEND-D-W URL-emission convention** — Phase 41 ships
`arxiv:<id>[<version>]` → `<a href="https://arxiv.org/abs/<id>[<version>]">arxiv:<id>[<version>]</a>`.
Version suffix preserved verbatim in both href and visible
text (a curator citing `arxiv:2024.01234v3` is intentionally
pinning to revision v3; arXiv resolves the versioned URL to
that revision). The display text preserves source casing of
the prefix (`arxiv:` vs `ArXiv:` vs `ARXIV:`) so curator-
authored prose retains its stylistic intent; the href is
case-normalized (the prefix becomes lowercase in the URL
fragment is irrelevant — arxiv.org URLs do not include the
prefix, only the ID).

**APPEND-D-X `ArxivExtensionRegistry` per-surface enabling +
3-way composition** —
`ArxivExtensionRegistry(new Set(["rationale"]))` ships Phase
41 default-enabled-on-`rationale`-only. The other three
markdown surfaces (`bio` + `reviewNotes` + `actionRationale`)
receive empty extension sets per `ArxivExtensionRegistry`'s
`getExtensions` default-deny. **3-way composition matrix**
under Phase-40 `CompositeExtensionRegistry`:

| Composition | Slot overlap | Surface overlap | Conflict |
|---|---|---|---|
| `arxiv,wikilinks` | none (remark vs rehype) | none (rationale vs actionRationale) | none |
| `arxiv,tables` | none (remark vs schema) | none (rationale vs reviewNotes) | none |
| `arxiv,wikilinks,tables` | none (3 distinct slots) | none (3 disjoint surfaces) | none |

All three pairs / triples are conflict-free under APPEND-D-R
composition rules: the three Phase-41-resident consumers
occupy DISTINCT slots AND DISTINCT surfaces. The 3-way
`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv` env-var value
flows through Phase-40 multi-value parsing + composite-
registry wrapping with zero rework — **first 3-way composition
feasibility** validates the "arbitrary disjoint-surface multi-
consumer composition" claim from Phase-40 boundary statement.

**APPEND-D-Y Phase 42+ deferrals** (Phase-41 arxiv-consumer
scope cap):

- **Cross-surface arxiv expansion**: bio + reviewNotes +
  actionRationale autolinks. No current content evidence in
  user-prose columns; demand-signal-first; Phase 42+
  constructor-arg change with zero plugin or registry rework
  (the property Phase 38 + 39 + 41 each documented).
- **Older-style category-prefixed arXiv IDs**: pre-2007
  `<archive>/<id>` format (`arxiv:math/0211159`,
  `arxiv:cs.AI/0501001`). None encountered in the project's
  existing paper-evidence URLs; the modern-format-only
  Phase-41 regex deliberately rejects them. Phase 42+ if
  curator content surfaces older citations.
- **Bare arXiv IDs without `arxiv:` prefix** (e.g., raw
  `2024.01234` floating in prose): ambiguous with floating
  decimals + version strings + dates. The `arxiv:` prefix is
  the disambiguator; Phase 41 ships prefix-required only.
  Phase 42+ if a stricter context-aware match (e.g., inside
  parenthetical citation prose) becomes warranted.
- **DOI auto-linking** (`doi:10.<reg>/<id>` →
  `https://doi.org/10.<reg>/<id>`): naturally a sibling
  consumer in the same Phase-37 framework slot
  (`remarkPlugins`) — composes cleanly with arxiv via
  `CompositeExtensionRegistry`. Phase 42+ if curator content
  surfaces DOI citations.
- **arXiv ID display-text alias syntax** (e.g.,
  `[[arxiv:NNNN.NNNNN|Smith et al. 2024]]`): GitHub-wiki-
  flavor alias syntax. No current content evidence; Phase 42+.
- **Paper-card hover-preview**: client-side enhancement
  showing title + authors from the matching
  `content/papers/<id>.yaml` Velite entry on link hover.
  Couples to a UI thread (hover-card component + cross-
  collection lookup). Phase 42+.

**EXTENDED Phase 42 Unit 42.1** — **first cross-surface
expansion of a Phase-37-framework consumer**: wikilinks
expand from `actionRationale`-only to ALL 4 markdown surfaces
via constructor-arg change in `PHASE_38_DEFAULT_ENABLED_SURFACES`
(value `Set(["actionRationale"])` → `Set(["bio", "reviewNotes",
"rationale", "actionRationale"])`; constant NAME preserved per
prep-doc D-8 audit-trail discipline). **Closes APPEND-D-L item
1** ("Cross-surface wikilink expansion — bio + reviewNotes +
rationale wikilinks; demand-signal-first; constructor-arg
change with zero plugin or registry rework") at **4-phase
carryover** (Phase 38 → 42); second prep-/APPEND-doc-level
deferral closed by a later phase (first was Phase-40 closure
of Phase-38-prep D-11 multi-value composition deferral).
**Validates "constructor-arg-only with zero plugin/registry
rework" property** each Phase 38/39/41 consumer documented.
**First "all 4 markdown surfaces enabled by ≥1 consumer"
state** in project history — pre-Phase-42 only 3 surfaces
had any consumer (Phase 38 + 39 + 41 enabled one surface
each, disjoint); Phase 42 closes the `bio` gap (wikilinks
becomes the first consumer to enable `bio`). **Ninth APPEND
on ADR-0018 D-G** — extends the **first-ADR-D-clause-with-
most-APPENDs record** from 8 → 9.

**APPEND-D-Z wikilinks default-enabled-surfaces expansion
shape** — `PHASE_38_DEFAULT_ENABLED_SURFACES`'s value
evolves from `Set(["actionRationale"])` (Phase 38 ship through
Phase-41 close) to `Set(["bio", "reviewNotes", "rationale",
"actionRationale"])` (Phase 42 ship). The constant's NAME
preserves the introduction-phase audit trail (Phase 38 = WHEN
the wikilinks consumer first shipped); the VALUE evolves
Phase 42 to reflect demand-signal-relaxed cross-surface ship.

Surface enumeration follows `MarkdownSurface` type-union
order from `./types.ts`: `bio, reviewNotes, rationale,
actionRationale` (chronological introduction order; Phase 17
+ 18 + 27 + 29 respectively). Per prep-doc D-9 lean.

**No demand-signal change**: zero `[[problem-slug]]`
occurrences exist in `users.bio` / `ratingChallenges.reviewNotes`
/ `ratingChallenges.rationale` columns at Phase-42 ship
(curator user-prose surfaces are empty in the current dev
environment). Phase 42 expansion is **architectural property
validation** ("constructor-arg-only with zero plugin/registry
rework") rather than demand-signal-driven content rendering.
Demand-signal-first discipline relaxed for the property-
validation case per Phase-41-gate rank-1 candidate framing.

The `WikilinkExtensionRegistry` class + `rehypeResolveWikilinks`
plugin + factory dispatch arm `MARKDOWN_EXTENSIONS=wikilinks`
all remain **UNCHANGED** Phase 42. The expansion is purely a
constant-value change with cascading test updates; no plugin
rework, no class rework, no factory rework. **Validates the
zero-rework-cross-surface-expansion property** Phase 38 +
39 + 41 each promised in their respective APPENDs.

**Composition matrix expanded Phase 42** under
`CompositeExtensionRegistry`:

| Composition | Same-surface different-slot | Result |
|---|---|---|
| `wikilinks` alone (Phase 42 default) | wikilinks rehype on all 4 surfaces; alone | conflict-free trivially |
| `wikilinks,tables` | **reviewNotes**: wikilinks rehype + tables schema | **conflict-free** (distinct slots) |
| `wikilinks,arxiv` | **rationale**: wikilinks rehype + arxiv remark | **conflict-free** (distinct slots) |
| `wikilinks,tables,arxiv` (3-way default Phase 42) | reviewNotes: w+t; rationale: w+a; bio: w; actionRationale: w | **conflict-free** (each surface has at most one consumer per slot) |

**First canonical same-surface different-slot composition
case under default dispatch** — Phase 41's 3-way example was
disjoint-surface; Phase 42 expansion creates the first
SAME-surface multi-consumer dispatch where two consumers
contribute to the same surface but via distinct slots. The
APPEND-D-R "at most one component per slot per surface" rule
still applies (no slot-overlap on any surface for any of the
above compositions); the framework's conflict-free property
holds end-to-end.

**Phase 43+ deferrals** (Phase-42 cross-surface-expansion
scope cap):

- **Tables cross-surface expansion** to bio + rationale +
  actionRationale — analogous Phase-43 expansion candidate;
  zero current content evidence; demand-signal-first per
  APPEND-D-Q item 1; mirrors Phase-42 constant-value change
  pattern.
- **Arxiv cross-surface expansion** to bio + reviewNotes +
  actionRationale — analogous Phase-44+ expansion candidate;
  zero current content evidence; demand-signal-first per
  APPEND-D-Y item 1; mirrors Phase-42 pattern.
- **Multi-anchor wikilink alias syntax** `[[slug|display-
  text]]` — APPEND-D-L item 2 deferral carries to Phase 43+.
- **Cross-entity wikilinks** (`[[paper-id]]` / `[[author-
  slug]]` / `[[institution-slug]]`) — APPEND-D-L item 3
  deferral carries to Phase 43+; requires entity-type
  disambiguation in syntax (current `[a-z0-9-]+` matches all
  three) + plugin parameterization.
- **`<a class="wikilink">` styling** — APPEND-D-L item 4
  deferral carries to Phase 43+; couples with `schemaOverride`
  for `class` attribute on `<a>`.
- **404 handling for unresolved wikilinks** — APPEND-D-L
  item 5 deferral carries to Phase 43+; build-time
  validation against `content/problems/` directory + render-
  time fallback to literal text for unresolved slugs.
- **Plugin parameterization for wikilink-href-builder** —
  APPEND-D-L item 6 deferral carries to Phase 43+;
  parameterizes `/problems/${slug}` path construction via
  plugin options.

**Single-letter alphabet wrap deferral**: Phase 42 APPEND-D-Z
consumes the last single-letter slot (A through Z = 26
letters); Phase 43+ APPEND letters wrap to two-letter form
(D-AA, D-AB, ...) per prep-doc D-4 Option β.

**EXTENDED Phase 43 Unit 43.1** — **second cross-surface
expansion of a Phase-37-framework consumer**: tables expand
from `reviewNotes`-only to ALL 4 markdown surfaces via
constructor-arg change in `PHASE_39_DEFAULT_ENABLED_SURFACES`
(value `Set(["reviewNotes"])` → `Set(["bio", "reviewNotes",
"rationale", "actionRationale"])`; constant NAME preserved per
Phase-42 D-8 audit-trail precedent). **Mirrors Phase-42
wikilinks expansion pattern verbatim**. **Closes APPEND-D-Q
item 2** ("Cross-surface table expansion — bio + rationale +
actionRationale could enable tables; demand-signal-first;
constructor-arg change with zero plugin or registry rework")
at **4-phase carryover** (Phase 39 → 43; mirrors Phase 38 → 42
gap). **Second prep-/APPEND-doc-level deferral closed by value-
only change in a later phase** — establishes the **APPEND-
deferral closure cadence**: one APPEND-deferral resolved per
phase, oldest first. **First two-letter APPEND letter in
ADR-0018 D-G** — APPEND-D-AA (after Phase-42 APPEND-D-Z
consumed the last single-letter slot); validates Phase-42-
prep D-4 Option β alphabet-wrap convention with Excel-
spreadsheet column lettering. **Tenth APPEND on ADR-0018
D-G** — extends the **first-ADR-D-clause-with-most-APPENDs
record** from 9 → 10.

**APPEND-D-AA tables default-enabled-surfaces expansion
shape** — `PHASE_39_DEFAULT_ENABLED_SURFACES`'s value
evolves from `Set(["reviewNotes"])` (Phase 39 ship through
Phase-42 close) to `Set(["bio", "reviewNotes", "rationale",
"actionRationale"])` (Phase 43 ship). Surface enumeration
follows `MarkdownSurface` type-union order from `./types.ts`:
`bio, reviewNotes, rationale, actionRationale` (mirrors
Phase-42 D-9 precedent).

**First "schemaOverrides on bio + rationale + actionRationale"
production state**: pre-Phase-43, those three surfaces had
base allow-list only (Phase 18/27/29 ship; no
`schemaOverrides` ever applied). Post-Phase-43, all three
surfaces get the tables-augmented allow-list via tables's
`schemaOverrides` (the 6 GFM table tags + `align` attribute
on `<th>`/`<td>`). **First `schemaOverrides`-on-bio surface**
in project history.

**No demand-signal change**: zero GFM-table content exists in
`users.bio` / `ratingChallenges.rationale` / `RatingAction
actionRationale` columns at Phase-43 ship (mirrors Phase-42
demand-signal-relaxed framing). Phase 43 expansion is
**architectural property validation** ("constructor-arg-only
zero-rework expansion" for a second consumer) rather than
demand-signal-driven; the property each Phase 38/39/41
consumer documented now has TWO real-consumer-expansion
realizations (Phase 42 wikilinks + Phase 43 tables).

The `TablesExtensionRegistry` class + `GFM_TABLE_SCHEMA_OVERRIDES`
constant + factory dispatch arm `MARKDOWN_EXTENSIONS=tables`
all remain **UNCHANGED** Phase 43. The expansion is purely a
constant-value change with cascading test updates. **Validates
the zero-rework-cross-surface-expansion property for the
SECOND consumer** (Phase 42 was the first; Phase 43 is the
second; Phase 44+ may apply analogously to arxiv).

**Composition matrix expanded Phase 43** under
`CompositeExtensionRegistry`:

| Surface | `wikilinks,tables` (Phase 43 default) | `wikilinks,tables,arxiv` (3-way Phase 43 default) |
|---|---|---|
| `bio` | wikilinks(rehype) + tables(schema) | wikilinks(rehype) + tables(schema) |
| `reviewNotes` | wikilinks(rehype) + tables(schema) | wikilinks(rehype) + tables(schema) |
| `rationale` | wikilinks(rehype) + tables(schema) | wikilinks(rehype) + tables(schema) + arxiv(remark) |
| `actionRationale` | wikilinks(rehype) + tables(schema) | wikilinks(rehype) + tables(schema) |

**First "all 4 surfaces with same-surface different-slot
composition" state under default dispatch** in project
history. Pre-Phase-43: only `reviewNotes` had wikilinks
(rehype, Phase 42 expansion) + tables (schema, Phase 39
default) co-rendering. Post-Phase-43: **all 4 surfaces co-
render with wikilinks + tables**.

**First "all 3 slots on the same surface" case**: under 3-way
`wikilinks,tables,arxiv` Phase-43 default, the `rationale`
surface receives wikilinks (rehypePlugins) + tables
(schemaOverrides) + arxiv (remarkPlugins) — all three
framework slots active on a single surface simultaneously,
conflict-free per APPEND-D-R (one component per slot).
Validates the **maximal multi-consumer per-surface
composition** the framework supports.

**APPEND letter-sequence naming**: Excel-spreadsheet column
convention — single letters A through Z (26); then two-letter
AA, AB, AC, ... AZ (26); then BA, BB, BC, ... etc. Phase 43
ships D-AA; Phase 44+ would ship D-AB if a single APPEND
suffices; D-AB through D-AZ would carry phases 44-69 in
single-APPEND increments. Phase-43 first to use the two-
letter form.

**Phase 44+ deferrals** (Phase-43 tables-consumer scope cap):

- **Arxiv cross-surface expansion** to bio + reviewNotes +
  actionRationale — analogous Phase-44+ expansion candidate
  (Phase 42 wikilinks; Phase 43 tables; Phase 44 arxiv would
  complete the all-three-consumers-on-all-4-surfaces state);
  APPEND-D-Y item 1 deferral; mirrors Phase-42/43 constructor-
  arg-only change pattern.
- **Table-specific attributes** (`colspan` / `rowspan` /
  `scope`) — APPEND-D-Q item 3 deferral carries forward;
  Phase 44+ if demand. Requires XSS audit (numeric-only
  restriction for `colspan`/`rowspan`; literal-only restriction
  for `scope`).
- **`<caption>` element** — APPEND-D-Q item 4 deferral;
  Phase 44+ if non-GFM extension surfaces.
- **Surface-specific table schemas** — APPEND-D-Q item 6
  deferral; Phase 44+ if cross-surface tables emerge with
  different requirements (e.g., bio with no colspan;
  reviewNotes with full table feature set). Implementation
  shape: TablesExtensionRegistry constructor accepts a
  `Map<MarkdownSurface, Partial<Schema>>` instead of a flat
  `ReadonlySet<MarkdownSurface>`.
- **Multi-anchor wikilink alias syntax** (APPEND-D-L item 2)
  — carries forward to Phase 44+.
- **Cross-entity wikilinks** (APPEND-D-L item 3) — carries
  forward to Phase 44+.
- **DOI sibling consumer** (APPEND-D-Y item 4) — Phase 44+;
  first compositional same-slot case.
- **`@mention` consumer** (APPEND-D-Y item 7) — Phase 44+;
  conditional on Q73 gate.

**EXTENDED Phase 44 Unit 44.1** — **third cross-surface
expansion of a Phase-37-framework consumer**: arxiv expands
from `rationale`-only to ALL 4 markdown surfaces via
constructor-arg change in `PHASE_41_DEFAULT_ENABLED_SURFACES`
(value `Set(["rationale"])` → `Set(["bio", "reviewNotes",
"rationale", "actionRationale"])`; constant NAME preserved per
Phase-42 D-8 audit-trail precedent). **Mirrors Phase-42 +
Phase-43 expansion patterns verbatim**. **Completes the per-
consumer expansion arc** — all 3 Phase-37-framework consumers
(wikilinks Phase 42 + tables Phase 43 + arxiv Phase 44) now
ship default-enabled on all 4 surfaces. **Third real-consumer-
expansion realization** of the "constructor-arg-only zero-
rework expansion" property documented in each Phase 38/39/41
consumer's APPEND.

**Closes APPEND-D-Y item 1** ("Cross-surface arxiv expansion:
bio + reviewNotes + actionRationale autolinks; demand-signal-
first; Phase 42+ constructor-arg change with zero plugin or
registry rework") at **3-phase carryover** (Phase 41 → Phase
44). Third prep-/APPEND-doc-level deferral closed by value-
only change in a later phase (Phase 42 → 38 at 4-phase gap;
Phase 43 → 39 at 4-phase gap; Phase 44 → 41 at 3-phase gap;
the 3-phase gap is faster because APPEND-D-Y was created 2
phases later than D-Q; the per-phase cadence is the same).

**Second two-letter APPEND letter D-AB** (after Phase-43 D-AA).
Excel-spreadsheet column convention continues — D-AC + D-AD
+ ... + D-AZ would carry Phase 45+ at this cadence.

**Eleventh APPEND on ADR-0018 D-G** — extends the **first-
ADR-D-clause-with-most-APPENDs record** from 10 → 11.

**APPEND-D-AB arxiv default-enabled-surfaces expansion shape**
— `PHASE_41_DEFAULT_ENABLED_SURFACES`'s value evolves from
`Set(["rationale"])` (Phase 41 ship through Phase-43 close) to
`Set(["bio", "reviewNotes", "rationale", "actionRationale"])`
(Phase 44 ship). Surface enumeration follows `MarkdownSurface`
type-union order per Phase-42 D-9 + Phase-43 D-9 precedent.
Constant name preserved.

**No demand-signal change**: zero `arxiv:<id>` content exists
in `users.bio` / `ratingChallenges.reviewNotes` / `RatingAction
actionRationale` columns at Phase-44 ship (mirrors Phase-42 +
43 demand-signal-relaxed framing). Phase 44 expansion is
**architectural property validation** ("constructor-arg-only
zero-rework expansion" for a third consumer; pattern matured).

The `ArxivExtensionRegistry` class + `remarkLinkArxivIds`
plugin + factory dispatch arm `MARKDOWN_EXTENSIONS=arxiv` all
remain **UNCHANGED** Phase 44. The expansion is purely a
constant-value change with cascading test updates. **Third
realization of the constructor-arg-only zero-rework expansion
property** validates the framework's stability — plugin + class
+ factory code unchanged since respective Phase 37/38/39/40/41
ship commits.

**Composition matrix at Phase-44 default** under
`CompositeExtensionRegistry`:

| Surface | `wikilinks,tables,arxiv` (Phase 44 3-way default) |
|---|---|
| `bio` | wikilinks(rehype) + tables(schema) + arxiv(remark) |
| `reviewNotes` | wikilinks(rehype) + tables(schema) + arxiv(remark) |
| `rationale` | wikilinks(rehype) + tables(schema) + arxiv(remark) |
| `actionRationale` | wikilinks(rehype) + tables(schema) + arxiv(remark) |

**First "all 3 framework slots on all 4 surfaces under default
dispatch" state in project history** — **maximal multi-
consumer all-surfaces composition**. Pre-Phase-44: only
`rationale` had all 3 slots active under 3-way default (Phase
43 achievement). Post-Phase-44: ALL 4 surfaces have all 3
slots active. Conflict-free per APPEND-D-R "at most one
component per slot per surface" rule (each surface has exactly
one component contributing each of the 3 slots; 3 distinct
slots × 4 surfaces × 3 consumers = 12 component-surface-slot
triples, all distinct).

**Full framework activation state**: all 3 consumers + all 4
surfaces + all 3 slots active under default dispatch. The
framework's **maximal default-enabling configuration** is
reached at Phase 44 ship — no further default-enabling-of-
existing-consumers is possible. Phase 45+ candidates must
necessarily explore: (a) consumer behavior (alias syntax;
cross-entity); (b) schema behavior (table-attributes; class-
styling); (c) validation (404-handling); OR (d) new consumers
(DOI; @mention).

**Phase 45+ deferrals** (Phase-44 arxiv-consumer scope cap):

- **Older-style category-prefixed arxiv IDs** (APPEND-D-Y
  item 2) — Phase 45+ if curator content surfaces.
- **Bare arxiv IDs without prefix** (APPEND-D-Y item 3) —
  Phase 45+ if stricter context-aware match warranted.
- **DOI sibling consumer** (APPEND-D-Y item 4) — Phase 45+;
  **first compositional same-slot case** in project history
  (two consumers both using `remarkPlugins`). APPEND-D-R
  rules for plugin concatenation within slot become live.
- **arxiv display-text alias syntax** `[[arxiv:NNNN.NNNNN|display]]`
  (APPEND-D-Y item 5) — Phase 45+.
- **Paper-card hover-preview** (APPEND-D-Y item 6) — Phase
  45+ couples to UI thread.
- **Multi-anchor wikilink alias `[[slug|display]]`** (APPEND-
  D-L item 2) — Phase 45+.
- **Cross-entity wikilinks** (APPEND-D-L item 3) — Phase 45+.
- **`<a class="wikilink">` styling** (APPEND-D-L item 4) —
  Phase 45+.
- **404 handling for unresolved wikilinks** (APPEND-D-L
  item 5) — Phase 45+.
- **Plugin parameterization for wikilink-href-builder** —
  Phase 45+.
- **Table-specific attributes** (`colspan` / `rowspan` /
  `scope`; APPEND-D-Q item 3) — Phase 45+.
- **`<caption>` element** (APPEND-D-Q item 4) — Phase 45+.
- **Surface-specific table schemas** (APPEND-D-Q item 6) —
  Phase 45+ via constructor-arg-as-map change.

**EXTENDED Phase 45 Unit 45.1** — **fourth concrete Phase-37-
framework consumer**: DOI auto-link on `rationale` surface via
`remarkPlugins` slot + new `DoiExtensionRegistry` + new
single-value dispatch arm `MARKDOWN_EXTENSIONS=doi` (fourth
single-value arm after `wikilinks` + `tables` + `arxiv`).
**First second-consumer in any single framework slot** — DOI
joins arxiv (Phase 41) in `remarkPlugins`; `rehypePlugins` +
`schemaOverrides` slots remain singleton Phase 45.

**Closes APPEND-D-Y item 4** ("DOI auto-linking — `doi:10.<reg>/<id>` →
`https://doi.org/10.<reg>/<id>`: naturally a sibling consumer
in the same Phase-37 framework slot (`remarkPlugins`) — composes
cleanly with arxiv via `CompositeExtensionRegistry`. Phase 42+
if curator content surfaces DOI citations.") at **4-phase
carryover** (Phase 41 → Phase 45; mirrors Phase 38→42 and
Phase 39→43 4-phase gaps). **Fourth prep-/APPEND-doc-level
deferral closed by a later phase** — establishes the **APPEND-
deferral closure cadence sustained 4 phases** (Phase 42 closed
D-L item 1; Phase 43 closed D-Q item 2; Phase 44 closed D-Y
item 1; Phase 45 closes D-Y item 4). **First non-cross-
surface-expansion APPEND-deferral closure** — Phase 42-44
closures were all cross-surface-expansion items; Phase 45
closes a sibling-consumer item.

**First compositional same-slot case in project history.**
Pre-Phase-45 every framework slot (`remarkPlugins` +
`rehypePlugins` + `schemaOverrides`) had exactly one consumer
under default dispatch:

  - `rehypePlugins` ← wikilinks alone (Phase 38, expanded
    Phase 42 to all 4 surfaces; still singleton in the slot).
  - `schemaOverrides` ← tables alone (Phase 39, expanded
    Phase 43 to all 4 surfaces; still singleton in the slot).
  - `remarkPlugins` ← arxiv alone (Phase 41, expanded Phase
    44 to all 4 surfaces; still singleton in the slot).

The `CompositeExtensionRegistry` APPEND-D-R rule "concatenated
across components in registration order" for `remarkPlugins`
and `rehypePlugins` was **trivially satisfied** because no two
consumers ever contributed to the same slot. Phase 45 puts the
concatenation rule under real pressure: under
`MARKDOWN_EXTENSIONS=arxiv,doi` (Phase 45 ship) the
`remarkPlugins` slot on `rationale` (the only shared-enabled
surface; doi Phase-45-default is `rationale`-only) carries
`[remarkLinkArxivIds, remarkLinkDoiIds]` per the registration-
order rule. **First "two plugins active in the same slot on
the same surface under default dispatch" state**.

**Twelfth APPEND on ADR-0018 D-G** — extends the **first-
ADR-D-clause-with-most-APPENDs record** from 11 → 12
(Phase 18 + 27 + 29 + 37 + 38 + 39 + 40 + 41 + 42 + 43 + 44 +
**45**).

**Third two-letter APPEND letter D-AC** (after Phase-43 D-AA
+ Phase-44 D-AB). Excel-spreadsheet column convention
sustained — D-AD + D-AE + ... + D-AZ would carry Phase 46+
at this cadence.

**APPEND-D-AC doi consumer shape** —
`PHASE_45_DEFAULT_ENABLED_SURFACES = Set(["rationale"])` per
Phase-41-arxiv-first-ship demand-signal-first precedent.
`rationale` is the Phase-27 challenge-resolution-rationale
surface — the natural locus for curator paper-citation prose
that cites DOIs. Cross-surface expansion to bio + reviewNotes
+ actionRationale deferred Phase 46+ per the per-consumer-
expansion-as-separate-phase pattern (Phase 38→42, Phase
39→43, Phase 41→44 each established a 4-phase gap; Phase
45→49 would extend the pattern).

**DOI regex**: `\bdoi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?=[\s.,;)]|$)/gi`.
The 4-9-digit registrant bound + suffix-character-class
follow Crossref's "DOIs and matching regular expressions"
reference regex. Trailing lookahead bounds the suffix against
sentence-terminator punctuation (`.`, `,`, `;`, `)`, whitespace,
end-of-string) so prose-embedded DOIs match without trailing
punctuation. Phase-45 ship tradeoff: most curator-prose DOI
citations end on sentence-terminator punctuation; the
lookahead favors typical-prose-correctness over edge-case-
DOI-correctness (hypothetical DOIs with legitimate trailing
periods would be truncated; deferred Phase 46+ for stricter
context-aware matching via curator-content demand signal).
Bare DOIs without `doi:` prefix deferred Phase 46+ per
ambiguity (numeric-only `10.<reg>/<suffix>` looks identical
to generic decimal-then-slash prose).

**Emitted host**: canonical `https://doi.org/<id>`. The
legacy `dx.doi.org` host redirects to `doi.org` and is NOT
emitted Phase 45 (deferred Phase 46+ if curator content
surfaces dx.doi.org legacy URLs).

**Plugin order under composition**: env-var-comma-order
preserved through `CompositeExtensionRegistry` constructor +
plugin concatenation. `MARKDOWN_EXTENSIONS=arxiv,doi` → plugin
order `[remarkLinkArxivIds, remarkLinkDoiIds]`. Plugin order
is **behaviorally equivalent** for arxiv + doi Phase 45
because their regex prefixes (`\barxiv:` vs `\bdoi:` literal-
prefix word-boundary-anchored) are disjoint — neither
plugin's emitted link text matches the other's regex. The
framework's registration-order discipline holds regardless;
future Phase 46+ orderings-may-matter cases will arise if a
consumer's regex could match arxiv- or doi-emitted link text.

**Composition matrix at Phase-45 default** under
`CompositeExtensionRegistry`:

| Composition | New behavior |
|---|---|
| `doi` alone | doi remark on `rationale` only; first second-consumer-in-slot (arxiv already present Phase 44 all 4) |
| `arxiv,doi` | **first same-slot composition**: `rationale` gets `[arxiv, doi]` in `remarkPlugins`; other 3 surfaces get `[arxiv]` only |
| `wikilinks,doi` | `rationale` gets wikilinks rehype + doi remark; other 3 get wikilinks rehype only |
| `tables,doi` | `rationale` gets tables schema + doi remark; other 3 get tables schema only |
| `wikilinks,tables,doi` | `rationale` 3-consumer; other 3 surfaces 2-consumer |
| `wikilinks,arxiv,doi` | `rationale` 3-consumer with `[arxiv, doi]` in remark; other 3 surfaces 2-consumer with arxiv only in remark |
| `tables,arxiv,doi` | `rationale` 3-consumer with `[arxiv, doi]` in remark; other 3 surfaces 2-consumer |
| `wikilinks,tables,arxiv,doi` (Phase 45 4-way default) | **first 4-consumer composition**: `rationale` carries 4 consumers across 3 slots; other 3 surfaces 3-consumer |

**First "4-consumer composition under default dispatch"
state in project history.** Pre-Phase-45 max was 3-consumer
(Phase-44 `wikilinks,tables,arxiv`). Conflict-free per
APPEND-D-R because (a) wikilinks + tables + arxiv each occupy
distinct slots Phase 44; (b) DOI joins arxiv in `remarkPlugins`
under the registration-order concatenation rule. Each surface
still has at most one component contributing to `rehypePlugins`
+ at most one contributing to `schemaOverrides`; only
`remarkPlugins` slot is doubly-occupied (on shared-enabled
surfaces — `rationale` only Phase 45).

**Phase 46+ deferrals** (Phase-45 doi-consumer scope cap):

- **DOI cross-surface expansion** to bio + reviewNotes +
  actionRationale — Phase-46+ analogous to Phase-44 arxiv
  cross-surface expansion; zero current content evidence;
  demand-signal-first; constructor-arg change with zero
  plugin / registry / factory rework (the property each
  Phase 38/39/41/45 consumer documents).
- **DOI display-text alias syntax** `[[doi:10.NNNN/xxx|display]]`
  — Phase 46+ if curator content surfaces; mirrors arxiv
  APPEND-D-Y item 5 deferral.
- **Bare DOIs without `doi:` prefix** — Phase 46+ if stricter
  context-aware match warranted; ambiguity is even higher
  than bare arxiv IDs (the leading `10.` looks identical to
  generic decimal-then-slash prose).
- **`dx.doi.org` legacy-host parsing** — Phase 46+ if curator
  content surfaces dx.doi.org URLs; Phase 45 emits the
  canonical `doi.org` URL only.
- **Stricter trailing-lookahead for legitimate trailing-period
  DOIs** — Phase 46+ if curator content surfaces edge-case
  DOIs (hypothetical `doi:10.1234/abc.` ending in legitimate
  trailing period; Phase 45 lookahead truncates these).
- **Older-style category-prefixed arxiv IDs** (APPEND-D-Y
  item 2 carries) — Phase 46+ if curator content surfaces.
- **Bare arxiv IDs without prefix** (APPEND-D-Y item 3 carries)
  — Phase 46+.
- **arxiv display-text alias syntax** `[[arxiv:NNNN.NNNNN|display]]`
  (APPEND-D-Y item 5 carries) — Phase 46+.
- **Paper-card hover-preview** (APPEND-D-Y item 6 carries) —
  Phase 46+ couples to UI thread.
- **Multi-anchor wikilink alias `[[slug|display]]`** (APPEND-
  D-L item 2 carries) — Phase 46+.
- **Cross-entity wikilinks** (APPEND-D-L item 3 carries) —
  Phase 46+.
- **`<a class="wikilink">` styling** (APPEND-D-L item 4 carries)
  — Phase 46+.
- **404 handling for unresolved wikilinks** (APPEND-D-L item 5
  carries) — Phase 46+.
- **Plugin parameterization for wikilink-href-builder** —
  Phase 46+.
- **Table-specific attributes** (`colspan` / `rowspan` /
  `scope`; APPEND-D-Q item 3) — Phase 46+.
- **`<caption>` element** (APPEND-D-Q item 4) — Phase 46+.
- **Surface-specific table schemas** (APPEND-D-Q item 6) —
  Phase 46+ via constructor-arg-as-map change.
- **3rd-or-later `remarkPlugins` consumer** beyond arxiv + doi
  — Phase 46+ if curator content surfaces additional auto-
  link consumers (e.g., `pubmed:` PMID auto-link;
  `orcid:` ORCID auto-link).
- **2nd `rehypePlugins` consumer** beyond wikilinks — Phase
  46+ analogous case for `rehypePlugins` slot doubling.
- **2nd `schemaOverrides` consumer** beyond tables — Phase
  46+ analogous case; would test APPEND-D-R "at most one
  component per surface" throw-on-conflict rule for
  `schemaOverrides`.

**EXTENDED Phase 46 Unit 46.1** — **first plugin-regex-extension
within an existing Phase-37-framework consumer in project
history**: multi-anchor wikilink alias syntax `[[slug|display-
text]]` via in-place regex extension on `rehypeResolveWikilinks`
in `WikilinkExtensionRegistry`. **First "display-text divergence
from slug" rendering** in any framework consumer. **First alias-
syntax surface** in any framework consumer — sets pattern for
future Phase 47+ alias extensions in arxiv (APPEND-D-Y item 5)
+ doi (new Phase-46 deferral).

**Closes APPEND-D-L item 2** ("Multi-anchor wikilink alias
syntax `[[slug|display-text]]` GitHub-wiki-flavor alias syntax.
No current content evidence; Phase 39+ if signal demands;
plugin-option-extension shape.") at **8-phase carryover**
(Phase 38 → Phase 46). **Longest APPEND-D-L item closure to
date** (item 1 closed Phase 42 at 4-phase gap; item 2 closes
Phase 46 at 8-phase gap; items 3-6 carry forward).

**Fifth prep-/APPEND-doc-level deferral closed by a later
phase**: Phase 42 → 38 D-L item 1; Phase 43 → 39 D-Q item 2;
Phase 44 → 41 D-Y item 1; Phase 45 → 41 D-Y item 4; Phase 46
→ 38 D-L item 2. **APPEND-deferral closure cadence sustained 5
phases**. **Second non-cross-surface-expansion APPEND-deferral
closure** in the cadence (Phase 45 was first; Phase 46 is
second). Pattern: cross-surface-expansion closures exhausted
Phase 42-44; sibling-consumer-introduction (Phase 45) +
regex-extension-within-existing-consumer (Phase 46) closures
start Phase 45-46.

**Thirteenth APPEND on ADR-0018 D-G** — extends the **first-
ADR-D-clause-with-most-APPENDs record** from 12 → 13
(Phase 18 + 27 + 29 + 37 + 38 + 39 + 40 + 41 + 42 + 43 + 44 +
45 + **46**).

**Fourth two-letter APPEND letter D-AD** (after Phase-43 D-AA
+ Phase-44 D-AB + Phase-45 D-AC). Excel-spreadsheet column
convention sustained — D-AE + D-AF + ... + D-AZ would carry
Phase 47+ at this cadence.

**APPEND-D-AD wikilink alias regex shape**:

```ts
// Before (Phase 38 ship through Phase-45 close):
const WIKILINK_PATTERN = /\[\[([a-z0-9-]+)\]\]/g;

// After (Phase 46 ship):
const WIKILINK_PATTERN = /\[\[([a-z0-9-]+)(?:\|([^\]\n]+))?\]\]/g;
```

- Group 1 = slug (unchanged `[a-z0-9-]+`; APPEND-D-I XSS-
  safety contract preserved — slug regex IS the validation).
- Group 2 = optional display text (`[^\]\n]+`; any non-`]`
  non-newline chars; one or more). Excludes `]` (terminator)
  and `\n` (paragraph-break boundary).
- Non-capturing outer group `(?:...)? ` makes the alias clause
  fully optional. **Backwards-compatible**: every existing
  `[[slug]]` occurrence matches identically with group 2
  undefined.

**Plugin body update**:

```ts
const slug = match[1];
const alias = match[2];  // NEW: may be undefined

newNodes.push({
  type: "element",
  tagName: "a",
  properties: { href: `/problems/${slug}` },
  // Display falls back to slug when alias undefined.
  children: [{ type: "text", value: alias ?? slug }],
});
```

The `href` always points to `/problems/{slug}` — **only the
displayed anchor text varies**. Display text becomes the
text-node content of `<a>` (NOT injected HTML); rehype-
stringify's text-node escaping handles HTML-special
characters (e.g., `&` → `&amp;`, `<` → `&#x3C;`) automatically.
**No new XSS surface** introduced — the text-node escape is
the line of defense.

**Empty alias `[[slug|]]` behavior**: regex's display class
requires `+` (one or more chars). Empty `[[slug|]]` does not
satisfy; the whole pattern fails to match; the literal text
passes through unchanged. Phase 46 ship documented behavior;
Phase 47+ refinement candidate (curator content may motivate
empty-alias-as-slug-fallback semantics with regex `*`
quantifier + `||` fallback).

**Whitespace handling**: alias-internal whitespace preserved
verbatim Phase 46 (no auto-trim). Curator-authored
`[[a|  spaced  ]]` emits `<a href="/problems/a">  spaced  </a>`.
Phase 47+ refinement candidate if demand-signal surfaces.

**XSS audit Phase 46**: display text becomes mdast/hast text-
node `value`. Text-node serialization in `rehype-stringify`
escapes `&`, `<`, `>`, `"`, `'` per HTML5 spec. Test
"display with HTML-special chars escapes via rehype text-node
rendering (XSS safety)" asserts `[[a|<script>alert(1)</script>]]`
emits `&#x3C;script&#x3E;...` (NOT `<script>...`). Display is
purely cosmetic text-content; cannot escape its text-node
context. **No new XSS surface introduced beyond Phase-17
sanitize-line-of-defense**.

**No env-var change Phase 46**: alias is plugin-internal regex
evolution. `MARKDOWN_EXTENSIONS=wikilinks` (Phase-42 default-
all-4) automatically picks up alias syntax. Composition matrix
unchanged (`wikilinks,tables,arxiv,doi` 4-way Phase-45 default
continues to work; wikilinks plugin handles `[[slug]]` +
`[[slug|display]]` both).

**Phase 47+ deferrals** (Phase-46 alias-syntax scope cap):

- **Cross-entity wikilinks** (`[[paper-id|display]]` /
  `[[author-slug|display]]` / `[[institution-slug|display]]`;
  APPEND-D-L item 3 carries forward) — Phase 47+; requires
  entity-type disambiguation + plugin parameterization
  (APPEND-D-L item 6).
- **`<a class="wikilink">` styling** (APPEND-D-L item 4
  carries) — Phase 47+; couples with `schemaOverride` for
  `class` attribute on `<a>`.
- **404 handling for unresolved wikilinks** (APPEND-D-L item
  5 carries) — Phase 47+; build-time validation + render-time
  fallback.
- **Plugin parameterization for wikilink-href-builder** (APPEND-
  D-L item 6 carries) — Phase 47+; would make `/problems/${slug}`
  configurable per-consumer.
- **Auto-trim of alias display whitespace** — new Phase-46
  deferral; Phase 47+ if curator content surfaces edge cases.
- **Empty-alias-as-slug-fallback** `[[slug|]]` → `<a>slug</a>`
  — new Phase-46 deferral; Phase 47+ refinement candidate
  (change regex `+` → `*` + plugin `??` → `||`).
- **Alias syntax in arxiv consumer** (`arxiv:NNNN.NNNNN|display`;
  APPEND-D-Y item 5 carries) — Phase 47+ analogous extension.
- **Alias syntax in doi consumer** (`doi:10.NNNN/xxx|display`;
  new Phase-46 deferral mirroring arxiv item 5) — Phase 47+.
- **Older-style category-prefixed arxiv IDs** (APPEND-D-Y item
  2 carries) — Phase 47+.
- **Bare arxiv / DOI IDs without prefix** (APPEND-D-Y item 3
  + new Phase-45 deferral carry) — Phase 47+.
- **DOI cross-surface expansion** (new Phase-45 APPEND-D-AC
  deferral) — Phase ~49 at 4-phase-gap cadence.
- **Paper-card hover-preview** (APPEND-D-Y item 6 carries) —
  Phase 47+.
- **Table-specific attributes** (`colspan` / `rowspan` /
  `scope`; APPEND-D-Q item 3 carries) — Phase 47+.
- **`<caption>` element** (APPEND-D-Q item 4 carries) — Phase
  47+.
- **Surface-specific table schemas** (APPEND-D-Q item 6
  carries) — Phase 47+ via constructor-arg-as-map change.
- **PubMed PMID sibling consumer** (new Phase-45 deferral
  carries) — Phase 47+.
- **3rd-or-later `remarkPlugins` consumer** beyond arxiv +
  doi — Phase 47+.
- **2nd `rehypePlugins` consumer** beyond wikilinks — Phase
  47+.
- **2nd `schemaOverrides` consumer** beyond tables — Phase
  47+.

**EXTENDED Phase 47 Unit 47.1** — **second realization of the
Phase-46 plugin-regex-extension phase-shape pattern**: arxiv
alias syntax `[[arxiv:NNNN.NNNNN|display]]` via in-place regex
extension on `remarkLinkArxivIds` in `ArxivExtensionRegistry`.
**First plugin-regex-extension on a `remarkPlugins` consumer
in project history** (Phase 46 extended a `rehypePlugins`
consumer). **First dual-form regex** in the framework —
alternation between bracketed form (priority) and bare form
(fallback) coexist in a single regex with two alternatives.

**Closes APPEND-D-Y item 5** ("arXiv ID display-text alias
syntax (e.g., `[[arxiv:NNNN.NNNNN|Smith et al. 2024]]`):
GitHub-wiki-flavor alias syntax. No current content evidence;
Phase 42+.") at **6-phase carryover** (Phase 41 → Phase 47).
Faster than the 8-phase Phase-46 wikilinks-alias closure
because the Phase-46 precedent reduced the architectural risk
of alias-syntax extensions; the `remarkPlugins` analog became
tractable at the next phase boundary.

**Sixth prep-/APPEND-doc-level deferral closed by a later
phase**: Phase 42 → 38 D-L item 1; Phase 43 → 39 D-Q item 2;
Phase 44 → 41 D-Y item 1; Phase 45 → 41 D-Y item 4; Phase 46
→ 38 D-L item 2; Phase 47 → 41 D-Y item 5. **APPEND-deferral
closure cadence sustained 6 phases**. **Third non-cross-
surface-expansion APPEND-deferral closure** in the cadence
(Phase 45 was first with new-consumer; Phase 46 was second
with regex-extension on `rehypePlugins`; Phase 47 is third
with regex-extension on `remarkPlugins`).

**Fourteenth APPEND on ADR-0018 D-G** — extends the **first-
ADR-D-clause-with-most-APPENDs record** from 13 → 14
(Phase 18 + 27 + 29 + 37 + 38 + 39 + 40 + 41 + 42 + 43 + 44 +
45 + 46 + **47**).

**Fifth two-letter APPEND letter D-AE** (after Phase-43 D-AA
+ Phase-44 D-AB + Phase-45 D-AC + Phase-46 D-AD). Excel-
spreadsheet column convention sustained — D-AF + D-AG + ... +
D-AZ would carry Phase 48+ at this cadence.

**APPEND-D-AE arxiv alias regex shape**:

```ts
// Before (Phase 41 ship through Phase-46 close):
const ARXIV_PATTERN = /\barxiv:(\d{4}\.\d{4,5})(v\d+)?\b/gi;

// After (Phase 47 ship):
const ARXIV_PATTERN =
  /\[\[arxiv:(\d{4}\.\d{4,5})(v\d+)?(?:\|([^\]\n]+))?\]\]|\barxiv:(\d{4}\.\d{4,5})(v\d+)?\b/gi;
```

**First dual-form regex in the framework**. Alternation
between bracketed (priority) and bare (fallback). Engine tries
the bracketed alternative first at each position; if it fails,
tries the bare alternative.

- **Bracketed form** `\[\[arxiv:(...)(...)?(?:\|([^\]\n]+))?\]\]`:
  - Group 1 = arxiv ID (`\d{4}\.\d{4,5}`; Phase-41 baseline
    preserved).
  - Group 2 = optional version (`v\d+`; Phase-41 baseline
    preserved).
  - Group 3 = optional display text (`[^\]\n]+`; mirrors
    Phase-46 wikilinks alias display class).
- **Bare form** `\barxiv:(...)(...)?\b`:
  - Group 4 = arxiv ID (Phase-41 baseline preserved
    verbatim).
  - Group 5 = optional version (Phase-41 baseline preserved
    verbatim).
  - No alias support in bare form (alias requires bracket-
    wrapping per APPEND-D-Y item 5 deferral text and
    Phase-47 D-3 prep-doc decision).

**Plugin body branches on `isBracketed = match[0].startsWith("[[")`**.
Three display rules:

1. `alias` defined → `display = alias` (bracketed form with
   `|display`).
2. `isBracketed` AND `alias` undefined → `display = match[0].slice(2, -2)`
   (bracketed form without alias; drop `[[` + `]]` while
   preserving source casing).
3. Else (bare form) → `display = match[0]` (Phase-41 baseline:
   verbatim source casing).

**Why bracket-wrapping** (vs the Phase-46 wikilinks pattern
of native-bracket-with-optional-alias): the wikilinks plugin
already had `[[ ]]` brackets as part of its baseline syntax;
adding `|display` is a within-existing-syntax-extension. The
arxiv plugin's Phase-41 baseline is the bare `arxiv:NNNN.NNNNN`
form with NO brackets — `|display` would have an ambiguous
terminator in prose context (no `]]` to mark the end). The
bracket-wrapping introduces explicit delimiters for the alias
form while preserving the bare form via dual-form alternation.

**No collision with wikilinks plugin**: wikilinks regex's slug
class `[a-z0-9-]+` excludes `:` and `.` — both present in
the arxiv ID inside `[[arxiv:NNNN.NNNNN]]`. The wikilinks
plugin's regex would NOT match `[[arxiv:1909.03004]]` or
`[[arxiv:1909.03004|display]]`. No regex-ambiguity. Additionally,
the staged execution order resolves any hypothetical collision
in favor of arxiv: `remarkPlugins` runs BEFORE `rehypePlugins`,
so the bracket-wrapped arxiv form is replaced with a `<a>`
link element BEFORE wikilinks gets a chance to see the text.

**Empty alias `[[arxiv:NNNN.NNNNN|]]` behavior**: mirrors
Phase-46 (display class `+` quantifier; empty alias does not
satisfy). When the bracketed alternative fails, the engine
backtracks and tries the bare alternative — which can match
the inner `arxiv:NNNN.NNNNN` portion, leaving the brackets +
pipe as literal context. Result: `[[<a>arxiv:1909.03004</a>|]]`.
Documented behavior; Phase 48+ refinement candidate.

**XSS audit Phase 47**: display text becomes mdast `text` node
`value` inside an mdast `link` node, then transits through
`remark-rehype` to a hast `<a>` element with text-node children.
The text-node value is HTML-escaped by `rehype-stringify` per
HTML5 spec (`&` → `&#x26;`; `<` → `&#x3C;`; `>` → `&#x3E;`).
Test "Phase-47: alias display HTML-escapes via remark-rehype
text-node rendering (XSS safety)" asserts `[[arxiv:1909.03004|x & y]]`
emits `<a href="...">x &#x26; y</a>`. Display is purely
cosmetic text-content; cannot escape its text-node context.
**No new XSS surface** introduced beyond Phase-17 sanitize-
line-of-defense.

**No env-var change Phase 47**: alias is plugin-internal regex
evolution. `MARKDOWN_EXTENSIONS=arxiv` (Phase-44 default-all-
4) automatically picks up bracketed alias syntax. Composition
matrix unchanged (`wikilinks,tables,arxiv,doi` 4-way Phase-45
default continues to work; arxiv plugin handles bare +
bracketed forms; other consumers unchanged).

**Phase 48+ deferrals** (Phase-47 arxiv-alias scope cap):

- **Alias syntax in doi consumer** `[[doi:10.NNNN/xxx|display]]`
  (new Phase-46 deferral carries) — Phase 48+ candidate; mirrors
  Phase-47 arxiv alias verbatim on the doi plugin via dual-form
  regex. **Most-natural Phase-48 candidate** at rank 1 if cadence
  preserved.
- **Older-style category-prefixed arxiv IDs** (APPEND-D-Y item
  2 carries) — Phase 48+.
- **Bare arxiv IDs without `arxiv:` prefix** (APPEND-D-Y item
  3 carries) — Phase 48+.
- **Bare DOIs without `doi:` prefix** (new Phase-45 deferral
  carries) — Phase 48+.
- **dx.doi.org legacy host parsing** (new Phase-45 deferral
  carries) — Phase 48+.
- **Stricter trailing-lookahead for legitimate trailing-period
  DOIs** (new Phase-45 deferral carries) — Phase 48+.
- **Paper-card hover-preview** (APPEND-D-Y item 6 carries) —
  Phase 48+.
- **Cross-entity wikilinks** (APPEND-D-L item 3 carries) —
  Phase 48+.
- **`<a class="wikilink">` styling** (APPEND-D-L item 4 carries)
  — Phase 48+.
- **404 handling for unresolved wikilinks** (APPEND-D-L item 5
  carries) — Phase 48+.
- **Plugin parameterization for wikilink-href-builder** (APPEND-
  D-L item 6 carries) — Phase 48+.
- **Auto-trim of alias display whitespace** (new Phase-46
  deferral carries) — Phase 48+.
- **Empty-alias-as-slug-fallback** (new Phase-46 deferral
  carries) — Phase 48+.
- **Empty-alias-as-bare-arxiv-fallback** for
  `[[arxiv:NNNN.NNNNN|]]` — new Phase-47 deferral; Phase 48+
  refinement candidate (mirrors Phase-46 wikilinks empty-alias
  question).
- **Table-specific attributes** (APPEND-D-Q item 3 carries) —
  Phase 48+.
- **`<caption>` element** (APPEND-D-Q item 4 carries) — Phase
  48+.
- **Surface-specific table schemas** (APPEND-D-Q item 6 carries)
  — Phase 48+.
- **DOI cross-surface expansion** (new Phase-45 APPEND-D-AC
  deferral carries) — Phase ~49 at 4-phase-gap cadence.
- **PubMed PMID sibling consumer** (new Phase-45 deferral
  carries) — Phase 48+.
- **3rd-or-later `remarkPlugins` consumer beyond arxiv + doi**
  — Phase 48+.
- **2nd `rehypePlugins` consumer beyond wikilinks** — Phase
  48+.
- **2nd `schemaOverrides` consumer beyond tables** — Phase
  48+.

**EXTENDED Phase 48 Unit 48.1** — **third realization of the
Phase-46 plugin-regex-extension phase-shape pattern**: DOI alias
syntax `[[doi:10.NNNN/xxx|display]]` via in-place dual-form regex
extension on `remarkLinkDoiIds` in `DoiExtensionRegistry`.
**Second plugin-regex-extension on a `remarkPlugins` consumer**
in project history (Phase 47 was first). **First "two-
consecutive-`remarkPlugins`-regex-extension phases" pair**
(Phase 47 arxiv + Phase 48 doi). **Second dual-form regex** in
the framework (after Phase-47 arxiv).

**Closes APPEND-D-AC item 2** ("DOI display-text alias syntax
`[[doi:10.NNNN/xxx|display]]` — Phase 46+ if curator content
surfaces; mirrors arxiv APPEND-D-Y item 5 deferral.") at **3-
phase carryover** (Phase 45 → Phase 48). **Ties Phase-44
fastest-closure record of 3-phase carryover** (Phase 41 → 44
D-Y item 1 cross-surface arxiv). **Fastest alias-syntax closure
ever observed**: accelerating cadence Phase-46 wikilinks 8-phase
→ Phase-47 arxiv 6-phase → Phase-48 doi 3-phase. Each alias-
syntax realization halves the architectural risk for the next.

**Seventh prep-/APPEND-doc-level deferral closed by a later
phase**: Phase 42 → 38 D-L item 1; Phase 43 → 39 D-Q item 2;
Phase 44 → 41 D-Y item 1; Phase 45 → 41 D-Y item 4; Phase 46
→ 38 D-L item 2; Phase 47 → 41 D-Y item 5; Phase 48 → 45 D-AC
item 2. **APPEND-deferral closure cadence sustained 7 phases**.
**Fourth non-cross-surface-expansion APPEND-deferral closure**
in the cadence (Phase 45 sibling-consumer; Phase 46 rehype-
regex; Phase 47 remark-regex; Phase 48 remark-regex-second on
the same slot — first "two-consecutive-same-slot-regex-
extension" closure-cadence event).

**Fifteenth APPEND on ADR-0018 D-G** — extends the **first-
ADR-D-clause-with-most-APPENDs record** from 14 → 15 (Phase
18 + 27 + 29 + 37 + 38 + 39 + 40 + 41 + 42 + 43 + 44 + 45 +
46 + 47 + **48**).

**Sixth two-letter APPEND letter D-AF** (after Phase-43 D-AA
+ Phase-44 D-AB + Phase-45 D-AC + Phase-46 D-AD + Phase-47
D-AE). Excel-spreadsheet column convention sustained —
D-AG + D-AH + ... + D-AZ would carry Phase 49+ at this cadence.

**APPEND-D-AF doi alias regex shape**:

```ts
// Before (Phase 45 ship through Phase-47 close):
const DOI_PATTERN =
  /\bdoi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?=[\s,;)]|\.(?:\s|$)|$)/gi;

// After (Phase 48 ship):
const DOI_PATTERN =
  /\[\[doi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?:\|([^\]\n]+))?\]\]|\bdoi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?=[\s,;)]|\.(?:\s|$)|$)/gi;
```

**Second dual-form regex in the framework**. Alternation between
bracketed (priority) and bare (fallback). Engine tries the
bracketed alternative first at each position; if it fails,
tries the bare alternative.

- **Bracketed form** `\[\[doi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?:\|([^\]\n]+))?\]\]`:
  - Group 1 = DOI ID (`10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?`;
    Phase-45 baseline character class preserved verbatim).
  - Group 2 = optional display text (`[^\]\n]+`; mirrors
    Phase-46 wikilinks + Phase-47 arxiv alias display class).
  - **No trailing lookahead** — `]]` is the explicit
    terminator. Full Crossref suffix class permissive inside
    brackets (`;`, `(`, `)`, `.` all allowed).
- **Bare form** `\bdoi:(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+?)(?=[\s,;)]|\.(?:\s|$)|$)`:
  - Group 3 = DOI ID (Phase-45 baseline preserved verbatim).
  - Trailing lookahead `(?=[\s,;)]|\.(?:\s|$)|$)` PRESERVED —
    Phase-45 prose-friendly trailing-punctuation truncation
    discipline unchanged.
  - No alias support in bare form (alias requires bracket-
    wrapping per APPEND-D-AC item 2 deferral text + Phase-48
    D-3 prep-doc decision).

**First "selectively-applied lookahead in dual-form regex"**
discipline. Phase-47 arxiv dual-form regex had no lookahead in
either alternative (arxiv ID class is naturally terminator-free
via `\b` word-boundary). Phase-48 doi dual-form regex introduces
the discipline: bracketed alternative has explicit `]]`
terminator → no lookahead needed; bare alternative preserves
the Phase-45 prose-friendly trailing-punctuation lookahead.
Sets the precedent for future dual-form regexes on consumers
with prior lookahead constraints (e.g., PubMed PMID Phase 49+
or 3rd-`remarkPlugins`-consumer Phase 49+).

**Plugin body branches on `isBracketed = match[0].startsWith("[[")`**.
Mirrors Phase-47 `remarkLinkArxivIds` body shape verbatim with
`arxiv:` → `doi:` substitution + Phase-45
`https://doi.org/${id}` URL construction preserved + version-
suffix branch removed (doi IDs have no version-suffix concept).
Three display rules:

1. `alias` defined → `display = alias` (bracketed form with
   `|display`).
2. `isBracketed` AND `alias` undefined → `display = matched.slice(2, -2)`
   (bracketed form without alias; drop `[[` + `]]` while
   preserving source casing).
3. Else (bare form) → `display = matched` (Phase-45 baseline:
   verbatim source casing).

**Why bracket-wrapping** (mirrors Phase-47 rationale): the doi
plugin's Phase-45 baseline is the bare `doi:10.NNNN/xxx` form
with NO brackets — `|display` would have an ambiguous
terminator in prose context (no `]]` to mark the end, AND the
bare form's lookahead character class is more restrictive than
arxiv's `\b`). The bracket-wrapping introduces explicit
delimiters for the alias form while preserving the bare form
via dual-form alternation.

**No collision with wikilinks plugin**: wikilinks regex's slug
class `[a-z0-9-]+` excludes `:`, `.`, `/` — all three present
in the doi ID inside `[[doi:10.NNNN/xxx]]`. The wikilinks
plugin's regex would NOT match `[[doi:10.1234/abc]]` or
`[[doi:10.1234/abc|display]]`. No regex-ambiguity. Additionally,
the staged execution order resolves any hypothetical collision
in favor of doi: `remarkPlugins` runs BEFORE `rehypePlugins`,
so the bracket-wrapped doi form is replaced with a `<a>` link
element BEFORE wikilinks gets a chance to see the text.

**No collision with arxiv plugin** (same `remarkPlugins` slot
sibling Phase 45): arxiv ID class `\d{4}\.\d{4,5}` requires
4-digit prefix + `.` + 4-5-digit suffix; doi ID class
`10\.\d{4,9}\/...` requires `10.` literal prefix + 4-9-digit
registrant + `/`. The two regexes literally cannot match the
same string (arxiv lacks the `/`; doi requires `/`). Same
`remarkPlugins` slot; distinct regex character classes;
collision-free via regex-disjointness alone. Establishes the
**regex-disjointness-as-sole-defense discipline** for same-slot
composition. The staged-execution-order layer (which protects
cross-slot pairs like wikilinks-vs-arxiv) is moot for same-slot
pairs like arxiv-vs-doi; regex-disjointness becomes the sole
defense. The Phase-45 → Phase-48 evolution shows the discipline
holds even when one of the pair gains alias-syntax (DOI
bracketed form does not contain `\d{4}\.\d{4,5}` followed by
the arxiv suffix shape; remains disjoint).

**Empty alias `[[doi:10.NNNN/xxx|]]` behavior**: mirrors Phase-
46/47 in spirit (display class `+` quantifier; empty alias
does not satisfy the bracketed alternative). DIVERGES from
Phase-47 arxiv in the fallback path: when the bracketed
alternative fails, the engine tries the bare alternative.
Phase-47 arxiv's bare `\b` word-boundary admits the inner ID
match leaving brackets + pipe as literal context (result:
`[[<a>arxiv:1909.03004</a>|]]`). Phase-48 doi's stricter
prose-friendly lookahead `(?=[\s,;)]|\.(?:\s|$)|$)` requires
a specific terminator class that EXCLUDES `|`; the bare
alternative also fails. Result: the entire `[[doi:10.1234/abc|]]`
falls through as fully-literal text. This divergence is the
natural consequence of the Phase-45 prose-friendly bare-DOI
lookahead and is the **first observed dual-form behavior
divergence between two consumers using the same dual-form
pattern**. Documented behavior; Phase 49+ refinement candidate
(see deferrals below). Test
"Phase-48: empty alias [[doi:10.NNNN/xxx|]] falls through to
fully-literal text" asserts the actual fall-through pattern.

**XSS audit Phase 48**: mirrors Phase-47 verbatim. Display text
becomes mdast `text` node `value` inside an mdast `link` node,
then transits through `remark-rehype` to a hast `<a>` element
with text-node children. The text-node value is HTML-escaped
by `rehype-stringify` per HTML5 spec (`&` → `&#x26;`; `<` →
`&#x3C;`; `>` → `&#x3E;`). Test "Phase-48: alias display HTML-
escapes via remark-rehype text-node rendering (XSS safety)"
asserts `[[doi:10.1234/abc|x & y]]` emits
`<a href="...">x &#x26; y</a>`. Display is purely cosmetic text-
content; cannot escape its text-node context. **No new XSS
surface** introduced beyond Phase-17 sanitize-line-of-defense.

**No env-var change Phase 48**: alias is plugin-internal regex
evolution. `MARKDOWN_EXTENSIONS=doi` (Phase-45 default-rationale-
only) and 4-way composite `wikilinks,tables,arxiv,doi` (Phase-45
default) automatically pick up bracketed alias syntax. Composition
matrix unchanged. **Rationale becomes first triple-alias surface**
under 4-way default — carries wikilinks alias (Phase 46) + arxiv
alias (Phase 47) + doi alias (Phase 48) simultaneously. **First
surface with 3 alias-syntax consumers active** in project
history. Other 3 surfaces (bio + reviewNotes + actionRationale)
remain dual-alias (wikilinks + arxiv) because doi is NOT
enabled on them per Phase-45
`PHASE_45_DEFAULT_ENABLED_SURFACES = Set(["rationale"])`.

**Phase 49+ deferrals** (Phase-48 doi-alias scope cap):

- **Older-style category-prefixed arxiv IDs** (APPEND-D-Y item
  2 carries) — Phase 49+.
- **Bare arxiv IDs without `arxiv:` prefix** (APPEND-D-Y item
  3 carries) — Phase 49+.
- **Bare DOIs without `doi:` prefix** (APPEND-D-AC carries) —
  Phase 49+.
- **dx.doi.org legacy host parsing** (APPEND-D-AC carries) —
  Phase 49+.
- **Stricter trailing-lookahead for legitimate trailing-period
  DOIs** (APPEND-D-AC carries) — Phase 49+.
- **Paper-card hover-preview** (APPEND-D-Y item 6 carries) —
  Phase 49+.
- **Cross-entity wikilinks** (APPEND-D-L item 3 carries) —
  Phase 49+.
- **`<a class="wikilink">` styling** (APPEND-D-L item 4
  carries) — Phase 49+.
- **404 handling for unresolved wikilinks** (APPEND-D-L item 5
  carries) — Phase 49+.
- **Plugin parameterization for wikilink-href-builder** (APPEND-
  D-L item 6 carries) — Phase 49+.
- **Auto-trim of alias display whitespace** (Phase-46 deferral
  carries) — Phase 49+.
- **Empty-alias-as-slug-fallback** (Phase-46 deferral carries)
  — Phase 49+.
- **Empty-alias-as-bare-arxiv-fallback** (Phase-47 deferral
  carries) — Phase 49+.
- **Empty-alias-as-bare-doi-fallback** — new Phase-48 deferral;
  unify the bare-form lookahead terminator class across arxiv-
  doi so empty-alias behavior matches across consumers (would
  require adding `|` to the DOI bare-form lookahead terminator
  class). Refinement candidate.
- **Table-specific attributes** (APPEND-D-Q item 3 carries) —
  Phase 49+.
- **`<caption>` element** (APPEND-D-Q item 4 carries) — Phase
  49+.
- **Surface-specific table schemas** (APPEND-D-Q item 6
  carries) — Phase 49+.
- **DOI cross-surface expansion** (APPEND-D-AC carries) —
  Phase ~49 at 4-phase-gap cadence (Phase 45 → 49 would extend
  the per-consumer-expansion 4-phase pattern Phase 38→42,
  39→43, 41→44 each established).
- **PubMed PMID sibling consumer** (Phase-45 deferral carries)
  — Phase 49+.
- **3rd-or-later `remarkPlugins` consumer beyond arxiv + doi**
  — Phase 49+.
- **2nd `rehypePlugins` consumer beyond wikilinks** — Phase
  49+.
- **2nd `schemaOverrides` consumer beyond tables** — Phase
  49+.

**EXTENDED Phase 49 Unit 49.1** — **fourth cross-surface
expansion of a Phase-37-framework consumer**: DOI expands from
`rationale`-only to all 4 markdown surfaces via constructor-arg
change in `PHASE_45_DEFAULT_ENABLED_SURFACES`. Mirrors Phase 42
+ 43 + 44 expansion pattern verbatim. **Fourth realization of
the "constructor-arg-only zero-rework expansion" property**
(Phase 42 wikilinks; Phase 43 tables; Phase 44 arxiv; Phase 49
doi). **Completes the per-consumer all-4-surfaces arc** — all
4 Phase-37-framework consumers ship default-enabled on all 4
markdown surfaces.

**Closes APPEND-D-AC cross-surface item** (Phase 45 documented
"DOI cross-surface expansion to bio + reviewNotes +
actionRationale — Phase-46+ analogous to Phase-44 arxiv cross-
surface expansion; zero current content evidence; demand-
signal-first; constructor-arg change with zero plugin / registry
/ factory rework.") at **4-phase carryover** (Phase 45 → Phase
49). Matches Phase-38 → 42 + Phase-39 → 43 4-phase cadence
verbatim. (Phase-41 → 44 was 3-phase, slightly faster, because
alias-syntax had not yet landed; Phase 49 restores the standard
4-phase cross-surface-expansion cadence.)

**Eighth prep-/APPEND-doc-level deferral closed by a later
phase**: Phase 42 → 38 D-L item 1; Phase 43 → 39 D-Q item 2;
Phase 44 → 41 D-Y item 1; Phase 45 → 41 D-Y item 4; Phase 46
→ 38 D-L item 2; Phase 47 → 41 D-Y item 5; Phase 48 → 45 D-AC
item 2; Phase 49 → 45 D-AC cross-surface item. **APPEND-deferral
closure cadence sustained 8 phases**. **Fifth cross-surface-
expansion APPEND-deferral closure** in the cadence (Phase 42 +
43 + 44 + 49). **First cross-surface-expansion closure since
Phase 44** (4-phase non-cross-surface-expansion streak Phase
45-48 ends at Phase 49). **First D-clause to have BOTH items
closed within the closure cadence** — D-AC carries 2 distinct
items (Phase 48 closed item 2; Phase 49 closes cross-surface).
Sets the precedent for multi-item APPEND closure across phases.

**Sixteenth APPEND on ADR-0018 D-G** — extends the **first-
ADR-D-clause-with-most-APPENDs record** from 15 → 16 (Phase
18 + 27 + 29 + 37 + 38 + 39 + 40 + 41 + 42 + 43 + 44 + 45 +
46 + 47 + 48 + **49**).

**Seventh two-letter APPEND letter D-AG** (after Phase-43 D-AA
+ Phase-44 D-AB + Phase-45 D-AC + Phase-46 D-AD + Phase-47
D-AE + Phase-48 D-AF). Excel-spreadsheet column convention
sustained — D-AH + D-AI + ... + D-AZ would carry Phase 50+ at
this cadence (after D-AZ rolls to D-BA).

**APPEND-D-AG doi cross-surface expansion shape**:

```ts
// Before (Phase 45 ship through Phase-48 close):
export const PHASE_45_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> =
  new Set(["rationale"]);

// After (Phase 49 ship):
export const PHASE_45_DEFAULT_ENABLED_SURFACES: ReadonlySet<MarkdownSurface> =
  new Set(["bio", "reviewNotes", "rationale", "actionRationale"]);
```

**Name discipline preserved** per Phase-42/43/44 D-8 precedent.
Constant NAME encodes the introduction-phase audit trail (Phase
45 = WHEN the doi consumer first shipped); VALUE evolves Phase
49. Surface enumeration follows `MarkdownSurface` type-union
order per Phase-42/43/44 D-9 precedent.

**`DoiExtensionRegistry` class + factory dispatch arm —
UNCHANGED**. The class accepts a `ReadonlySet<MarkdownSurface>`
constructor arg; expansion is constructor-arg-only. **Fourth
real-consumer-expansion realization** of the property — every
Phase-37-framework consumer now exhibits the property in its
own version history.

**Composition matrix Phase 49 expansion** under
`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi` (Phase-49 4-way
default):

| Surface | Composition |
|---|---|
| `bio` | wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — NEW Phase 49 |
| `reviewNotes` | wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — NEW Phase 49 |
| `rationale` | wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — Phase-45 baseline preserved |
| `actionRationale` | wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — NEW Phase 49 |

**All 4 surfaces carry the doubly-occupied `remarkPlugins`
slot** post-Phase-49 — **first "all 4 surfaces have same-slot
composition" state** in project history. Conflict-free per the
regex-disjointness-as-sole-defense discipline established at
Phase 48 (arxiv ID class `\d{4}\.\d{4,5}` lacks `/`; doi ID
class `10\.\d{4,9}\/...` requires `/`; the two regexes literally
cannot match the same string). The Phase-45 same-slot baseline
(rationale only) generalizes to all 4 surfaces under default
dispatch.

**First "all 4 surfaces are triple-alias" state** under 4-way
default + the Phase-46/47/48 alias-syntax extensions on
wikilinks + arxiv + doi. Every surface carries 3 alias-capable
consumers; pre-Phase-49 only rationale was triple-alias. **First
surface-with-3-alias-consumers cardinality of 4** in project
history.

**Maximal multi-consumer all-surfaces composition under default
dispatch** — defines the upper bound for the Phase-37-framework's
current capabilities (4 consumers × 4 surfaces × 3 slots = 48
component-surface-slot positions, of which 16 are active under
4-way default; the doubly-occupied `remarkPlugins` slot accounts
for 4 extra plugin invocations on top of the 12 single-occupancy
positions). Future expansions (5th consumer or 4th surface) would
extend the dimensions, not the cell density.

**Phase 50+ deferrals** (Phase-49 doi-cross-surface scope cap):

- **Older-style category-prefixed arxiv IDs** (APPEND-D-Y item
  2 carries) — Phase 50+.
- **Bare arxiv IDs without `arxiv:` prefix** (APPEND-D-Y item
  3 carries) — Phase 50+.
- **Bare DOIs without `doi:` prefix** (APPEND-D-AC carries) —
  Phase 50+.
- **dx.doi.org legacy host parsing** (APPEND-D-AC carries) —
  Phase 50+.
- **Stricter trailing-lookahead for legitimate trailing-period
  DOIs** (APPEND-D-AC carries) — Phase 50+.
- **Paper-card hover-preview** (APPEND-D-Y item 6 carries) —
  Phase 50+.
- **Cross-entity wikilinks** (APPEND-D-L item 3 carries) —
  Phase 50+.
- **`<a class="wikilink">` styling** (APPEND-D-L item 4
  carries) — Phase 50+.
- **404 handling for unresolved wikilinks** (APPEND-D-L item 5
  carries) — Phase 50+.
- **Plugin parameterization for wikilink-href-builder** (APPEND-
  D-L item 6 carries) — Phase 50+.
- **Auto-trim of alias display whitespace** (Phase-46 deferral
  carries) — Phase 50+.
- **Empty-alias-as-slug-fallback** (Phase-46 deferral carries)
  — Phase 50+.
- **Empty-alias-as-bare-arxiv-fallback** (Phase-47 deferral
  carries) — Phase 50+.
- **Empty-alias unification across consumers** (Phase-48
  deferral carries) — Phase 50+.
- **Table-specific attributes** (APPEND-D-Q item 3 carries) —
  Phase 50+.
- **`<caption>` element** (APPEND-D-Q item 4 carries) — Phase
  50+.
- **Surface-specific table schemas** (APPEND-D-Q item 6
  carries) — Phase 50+.
- **PubMed PMID sibling consumer** (Phase-45 deferral carries)
  — Phase 50+; first 3rd-`remarkPlugins` consumer.
- **3rd-or-later `remarkPlugins` consumer beyond arxiv + doi**
  — Phase 50+.
- **2nd `rehypePlugins` consumer beyond wikilinks** — Phase
  50+.
- **2nd `schemaOverrides` consumer beyond tables** — Phase
  50+.

**EXTENDED Phase 50 Unit 50.1** — **fifth concrete Phase-37-
framework consumer**: PubMed PMID auto-link via new
`PubmedExtensionRegistry` + `MARKDOWN_EXTENSIONS=pubmed` env-var
dispatch arm. **First 3rd-`remarkPlugins` consumer in project
history** (Phase 41 introduced arxiv; Phase 45 introduced doi
as first compositional same-slot case; Phase 50 introduces
pubmed). **First 3-consumer same-slot composition** under
`MARKDOWN_EXTENSIONS=arxiv,doi,pubmed`. Tests whether the
**regex-disjointness-as-sole-defense discipline** (Phase 48
established for 2 same-slot consumers; Phase 49 generalized to
all 4 surfaces) **scales to 3 same-slot consumers** without
architectural change — the three regex character classes are
pairwise disjoint.

**Closes APPEND-D-AC PubMed PMID sibling consumer item** (Phase
45 documented "additional auto-link consumers (e.g., `pubmed:`
PMID auto-link; `orcid:` ORCID auto-link)") at **5-phase
carryover** (Phase 45 → Phase 50). Slower than Phase-41 → 45
4-phase doi carryover because intervening Phase 46-49 closed
4 other APPEND-D-AC / D-Y / D-L items in cadence (Phase 46
wikilink alias; Phase 47 arxiv alias; Phase 48 doi alias;
Phase 49 doi cross-surface).

**Ninth prep-/APPEND-doc-level deferral closed by a later
phase**: Phase 42 → 38 D-L item 1; Phase 43 → 39 D-Q item 2;
Phase 44 → 41 D-Y item 1; Phase 45 → 41 D-Y item 4; Phase 46
→ 38 D-L item 2; Phase 47 → 41 D-Y item 5; Phase 48 → 45 D-AC
item 2; Phase 49 → 45 D-AC cross-surface item; Phase 50 → 45
D-AC PubMed PMID item. **APPEND-deferral closure cadence
sustained 9 phases**.

**Second non-cross-surface non-alias APPEND-deferral closure**
in the cadence (Phase 45 was first with doi sibling-consumer;
Phase 50 is second with pubmed sibling-consumer). **APPEND-D-AC
second item closed by sibling-consumer introduction** — first
closure for the "additional auto-link consumers" deferral text.

**Seventeenth APPEND on ADR-0018 D-G** — extends the **first-
ADR-D-clause-with-most-APPENDs record** from 16 → 17 (Phase
18 + 27 + 29 + 37 + 38 + 39 + 40 + 41 + 42 + 43 + 44 + 45 +
46 + 47 + 48 + 49 + **50**).

**Eighth two-letter APPEND letter D-AH** (after Phase-43 D-AA
+ Phase-44 D-AB + Phase-45 D-AC + Phase-46 D-AD + Phase-47
D-AE + Phase-48 D-AF + Phase-49 D-AG). Excel-spreadsheet
column convention sustained — D-AI + D-AJ + ... + D-AZ would
carry Phase 51+ at this cadence (after D-AZ rolls to D-BA).

**APPEND-D-AH PubMed PMID consumer shape**:

```ts
const PUBMED_PATTERN = /\b(?:pubmed|pmid):(\d{1,9})\b/gi;
```

- **Prefix alternation** `(?:pubmed|pmid):` handles both
  standard scientific-literature conventions (`pmid:` is more
  common in formal citations; `pubmed:` is more common in
  conversational/blog-style prose). Single regex; single
  plugin emits the same canonical URL form regardless of
  source prefix.
- **Identifier class** `\d{1,9}` matches 1-9-digit PubMed IDs.
  Modern PMIDs are 7-9 digits (as of 2025 the highest assigned
  is ~38 million, 8 digits); historical PMIDs back to PMID 1
  (~1960s MEDLINE indexing) are short. 10+ digits rejected —
  admitting them would risk matching unrelated decimal
  sequences in prose.
- **Word-boundary anchors** `\b...\b` prevent mid-word matches.
  No trailing-lookahead constraint unlike DOI: PubMed IDs are
  pure digits with no embedded punctuation, so `\b` is
  sufficient for trailing termination.
- **Case-insensitive flag** `i` allows mixed-case prefix
  source casing (`PubMed:` / `PMID:` / `Pmid:`) while
  preserving display verbatim.

**Emitted host**: canonical `https://pubmed.ncbi.nlm.nih.gov/<id>/`
with trailing slash (matches official NCBI URL form). Legacy
`https://www.ncbi.nlm.nih.gov/pubmed/<id>` host redirects to
the canonical form and is NOT emitted Phase 50.

**`PubmedExtensionRegistry` class + factory dispatch arm** —
mirrors Phase-41 `ArxivExtensionRegistry` + Phase-45
`DoiExtensionRegistry` shape verbatim. Constructor accepts
`ReadonlySet<MarkdownSurface>`; `getExtensions` returns
`{ remarkPlugins: [remarkLinkPubmedIds] }` for enabled surfaces.
Default-enabled set: `PHASE_50_DEFAULT_ENABLED_SURFACES = Set(["rationale"])`
mirroring Phase-41/Phase-45 first-ship demand-signal-first
precedent.

**`MARKDOWN_EXTENSIONS=pubmed` env-var dispatch arm**: **6th
single-value arm** for `MARKDOWN_EXTENSIONS` (first expansion
of the recognized-arms set since Phase 45's `doi` arm).
Recognized single-value arms now: `default` / `wikilinks` /
`tables` / `arxiv` / `doi` / `pubmed`. Multi-value composition
arms grow accordingly to include 5-way `wikilinks,tables,arxiv,doi,pubmed`
+ permutations.

**Collision-freedom for the 3-consumer same-slot composition**
(arxiv-vs-doi-vs-pubmed all in `remarkPlugins`):

| Pair | Disjointness mechanism |
|---|---|
| arxiv-vs-doi | arxiv `\d{4}\.\d{4,5}` lacks `/`; doi `10.<reg>/<suffix>` requires `/`. Distinct character classes. (Phase 48 established.) |
| arxiv-vs-pubmed | arxiv requires literal `arxiv:` prefix + `\d{4}\.\d{4,5}`; pubmed requires literal `pubmed:` or `pmid:` prefix + `\d{1,9}`. Distinct literal prefixes. |
| doi-vs-pubmed | doi requires literal `doi:` prefix + `10.<reg>/<suffix>`; pubmed requires literal `pubmed:` or `pmid:` prefix + `\d{1,9}`. Distinct literal prefixes. |

All three pairs are collision-free via regex character class
disjointness alone — **no string can match more than one** of
the three regexes. **Plugin invocation order is immaterial**
for this triple. **Regex-disjointness-as-sole-defense
discipline scales from 2 to 3 same-slot consumers without
architectural change**. Sets the precedent for future N-consumer
same-slot compositions (Phase 51+ candidates may add ORCID,
bioRxiv, OSF preprint consumers in the same slot).

**Composition matrix at Phase-50 5-way default** under
`MARKDOWN_EXTENSIONS=wikilinks,tables,arxiv,doi,pubmed`:

| Surface | Composition |
|---|---|
| `bio` | wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — 4 consumers (Phase-49 baseline; pubmed inactive per rationale-only default) |
| `reviewNotes` | wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — 4 consumers |
| `rationale` | wikilinks(rehype) + tables(schema) + [arxiv, doi, pubmed](remark) — **5 consumers** ← maximum cardinality |
| `actionRationale` | wikilinks(rehype) + tables(schema) + [arxiv, doi](remark) — 4 consumers |

**First "5-consumer composition under default dispatch" state
in project history.** Pre-Phase-50 max was 4-consumer (Phase-
49 all-4-surfaces 4-way default). **Maximum-consumer-cardinality
state**. Conflict-free per APPEND-D-R because (a) wikilinks +
tables + {arxiv, doi, pubmed} each occupy distinct slots
cross-pair; (b) within `remarkPlugins` the arxiv-doi-pubmed
triple is collision-free via regex-disjointness alone.

**Phase 51+ deferrals** (Phase-50 pubmed-consumer scope cap):

- **PubMed PMID display-text alias syntax**
  `[[pubmed:NNN|display]]` / `[[pmid:NNN|display]]` — mirrors
  Phase-47 arxiv-alias + Phase-48 doi-alias dual-form regex
  extension; Phase 51+ analogous extension.
- **PubMed PMID cross-surface expansion** to bio + reviewNotes
  + actionRationale — mirrors Phase-44 arxiv + Phase-49 doi
  cross-surface expansion via `PHASE_50_DEFAULT_ENABLED_SURFACES`
  constructor-arg change; Phase ~54 at 4-phase-gap cadence
  (Phase 38→42, Phase 39→43, Phase 41→44, Phase 45→49 each
  established 4-phase gaps).
- **ORCID auto-link consumer** (`orcid:NNNN-NNNN-NNNN-NNNN`) —
  sixth concrete consumer; Phase 51+.
- **bioRxiv preprint consumer** (`biorxiv:` / DOI-overlap with
  doi consumer) — sixth or seventh concrete consumer; Phase
  51+.
- **OSF preprint consumer** (`osf:` / DOI-overlap with doi
  consumer) — sixth or later concrete consumer; Phase 51+.
- **Older-style category-prefixed arxiv IDs** (APPEND-D-Y item
  2 carries) — Phase 51+.
- **Bare arxiv / DOI IDs without prefix** (APPEND-D-Y item 3 +
  APPEND-D-AC carry) — Phase 51+.
- **dx.doi.org legacy host parsing** (APPEND-D-AC carries) —
  Phase 51+.
- **Stricter trailing-lookahead for legitimate trailing-period
  DOIs** (APPEND-D-AC carries) — Phase 51+.
- **Paper-card hover-preview** (APPEND-D-Y item 6 carries) —
  Phase 51+.
- **Cross-entity wikilinks** (APPEND-D-L item 3 carries) —
  Phase 51+.
- **`<a class="wikilink">` styling** (APPEND-D-L item 4
  carries) — Phase 51+.
- **404 handling for unresolved wikilinks** (APPEND-D-L item 5
  carries) — Phase 51+.
- **Plugin parameterization for wikilink-href-builder** (APPEND-
  D-L item 6 carries) — Phase 51+.
- **Auto-trim of alias display whitespace** (Phase-46 deferral
  carries) — Phase 51+.
- **Empty-alias fallback unification** across consumers
  (Phase-46/47/48 deferrals carry) — Phase 51+.
- **Table-specific attributes** (APPEND-D-Q item 3 carries) —
  Phase 51+.
- **`<caption>` element** (APPEND-D-Q item 4 carries) — Phase
  51+.
- **Surface-specific table schemas** (APPEND-D-Q item 6
  carries) — Phase 51+.
- **4th-or-later `remarkPlugins` consumer beyond arxiv + doi +
  pubmed** (e.g., bioRxiv DOI overlap; OSF preprint; ORCID if
  ORCID lives in remarkPlugins) — Phase 51+.
- **2nd `rehypePlugins` consumer beyond wikilinks** — Phase
  51+.
- **2nd `schemaOverrides` consumer beyond tables** — Phase
  51+.

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
