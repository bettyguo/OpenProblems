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
