# ADR-0011 — i18n strategy: next-intl + sub-path routing + sibling-file content storage

- **Status:** accepted
- **Date authored:** 2026-05-16
- **Date accepted:** 2026-05-16
- **Deciders:** Author / primary curator (TBD GitHub handle — see [OPEN_QUESTIONS Q7](../../OPEN_QUESTIONS.md#q7-editorial-governance))
- **Supersedes:** —
- **Superseded by:** —

## Context and Problem Statement

`MASTER_PROMPT.md` §13 names "Bilingual rendering (FR primary candidate, given Montréal location)" as one of three open-ended Phase 6+ threads. Phase 6 closed the Discussions thread (Unit 6.10, [ADR-0010](./0010-discussions-backend.md)). Phase 7 (per [docs/thinking/7.0-phase-7-prep.md](../thinking/7.0-phase-7-prep.md) D-1) leads with the Bilingual thread.

Bilingual rendering is the **first content-pluralism surface** in the project. Before any code lands, this ADR pins:

1. **Which i18n runtime?** `next-intl` (App Router canonical), Paraglide.js (TypeScript-first, smaller bundle), native Next.js i18n + custom translation lookup, or no-i18n (defer Bilingual to Phase 8+).
2. **What's the URL routing convention?** Sub-path (`/en/...`, `/fr/...`), cookie-based (locale toggle persists; URL unchanged), or domain-based (`en.openproblems` vs `fr.openproblems`).
3. **What's the content-storage shape?** Sibling files (`problem.fr.yaml` alongside `problem.yaml`), sub-tree mirror (`content/fr/problems/...` mirroring `content/problems/...`), or a `lang:` frontmatter discriminator.
4. **What's the slug strategy for translated content?** English-canonical slugs across all locales, or per-locale slugs (`/fr/problemes/reduction-hallucinations`).
5. **What's the locale fallback chain?** `fr` falls back to `en` (untranslated pages render the EN content with a switch hint), or hard-404 on missing locales.
6. **Where does the locale-toggle UI live?** Site-header (next to `ThemeToggle`), per-page footer, or first-visit modal.
7. **How is translation provenance tracked?** Frontmatter field, separate audit log, or untracked.

[OPEN_QUESTIONS Q50](../../OPEN_QUESTIONS.md#q50-i18n-runtime-choice) (decided-as-lean in Unit 7.0) frames the runtime + routing choice. [Q51](../../OPEN_QUESTIONS.md#q51-bilingual-content-backfill-cadence) / [Q52](../../OPEN_QUESTIONS.md#q52-translation-provenance-schema) / [Q53](../../OPEN_QUESTIONS.md#q53-curator-authorship-attribution-per-locale) (decided-as-lean) frame the surrounding workflow questions. This ADR closes Q50 and confirms the working positions for Q51-Q53 at the ADR level (per-unit implementation details land in Units 7.2 / 7.5).

## Decision Drivers

- **§13 — bilingual rendering bullet.** FR primary, given Montréal location. EN is the project's canonical content language; FR is the first translation target.
- **§5.5 — perf budget.** First Load JS shared chunk held at 103 kB through every phase. i18n runtime bundle weight is the primary cost; pick the option that's compatible with the budget.
- **§3 — brand and operator familiarity.** App Router-canonical surfaces preferred over bespoke layers.
- **§15.6 — primary-source rule.** Translated content is still editorial; primary-source verification applies per-translation.
- **ADR-0001** (App Router) + **ADR-0002** (Velite) frame what we're plugging into.
- **ADR-0010** (Discussions backend) sets the precedent for "use the canonical third-party runtime + thin first-party wrapper" — same shape here.
- **Reversibility.** `lib/i18n/` will abstract the runtime calls behind a thin wrapper; switching runtimes later should be one-file edits, not a refactor.
- **SSG-first posture.** Every prior phase ships SSG-rendered pages (333 routes at HEAD). i18n must work with SSG.
- **Auditability.** Curator-of-record + translation provenance must be traceable per ADR-0005 / ADR-0008 / ADR-0009 precedent.

## Considered Options

1. **`next-intl` + sub-path routing + sibling-file content storage** (chosen).
2. **Paraglide.js** + sub-path routing + sibling-file content storage.
3. **Native Next.js i18n** (`next.config.ts` `i18n` field) + custom translation lookup library.
4. **No i18n** — defer Bilingual to Phase 8+, do other threads first.
5. **next-intl + cookie-based locale routing** (same URL, content swap).
6. **next-intl + sub-tree content mirror** (`content/fr/problems/...`).
7. **next-intl + `lang:` frontmatter discriminator on single-file-per-(slug, locale)**.

Options 5-7 are variations on option 1 — different routing / content-storage axes against the same runtime. The decision outcome below addresses each axis.

## Decision Outcome

**Chosen: Option 1 — `next-intl` + sub-path routing + sibling-file content storage.**

The decision pins seven concrete contracts:

### D-A. Runtime = `next-intl`

[`next-intl`](https://next-intl-docs.vercel.app) is the only i18n dependency in `package.json` (`dependencies`, not `devDependencies` — runtime import). Other i18n runtimes' SDKs are **forbidden** from landing in `dependencies` or `devDependencies` until a follow-on ADR explicitly authorises multi-runtime work. Pin via `^3.x` (matching the App Router-compatible major); `pnpm-workspace.yaml` `allowBuilds` not required (pure JS, no postinstall).

Translation lookup format = **JSON-per-locale** at `messages/<locale>.json` (next-intl's default). Two files at acceptance: `messages/en.json` + `messages/fr.json`. ICU MessageFormat for plurals and interpolation; ASCII-only keys.

### D-B. URL routing = sub-path

Locale lives in the URL path: `/en/...` and `/fr/...`. The `app/[locale]/` segment owns every route; middleware at `middleware.ts` detects browser `Accept-Language` and redirects bare paths to a defaulted locale.

Default locale = `en`. The bare path (e.g. `/problems/x`) redirects to `/en/problems/x` rather than rendering at the bare path. Trade-off: every URL gets a locale prefix; no "language-neutral" canonical URL. Acceptable — the URL prefix is the SEO + bookmarkability signal.

Sub-path is the App Router-canonical pattern + the only one compatible with SSG-first rendering (cookie-based requires SSR or client-side routing).

### D-C. Content-storage shape = sibling files

Translated content lives in a sibling file with a `.<locale>` infix:

```
content/problems/hallucination-reduction/problem.yaml         # EN canonical
content/problems/hallucination-reduction/problem.fr.yaml      # FR translation
content/problems/hallucination-reduction/background.mdx       # EN canonical
content/problems/hallucination-reduction/background.fr.mdx    # FR translation
```

EN files take **no infix** (preserves git history of every existing file at HEAD). FR files carry `.fr` before the extension. Future locales (e.g. `zh-CN`) extend the same pattern.

Velite collection globs extend in Unit 7.5 to include `*.fr.{yaml,mdx}`; loader filters by locale at SSG time. The loader's per-locale path resolution is what `[locale]/...` routes consume.

### D-D. Locale fallback chain

When a route renders for locale `L` and the requested content has no `<file>.<L>.yaml` sibling, the loader falls back to the EN-canonical file and surfaces a **locale-switch hint** in the page header (e.g. "This page is not yet translated to French; reading the English original. Help translate it via [link]"). No partial-translation rendering — a page either fully uses its locale's content or fully uses the EN fallback.

Hard-404 on missing locales is rejected (would break the FR experience for any unfinished page; the Q51 "infrastructure ships in Phase 7; backfill is curator-track" decision-as-lean depends on graceful fallback).

### D-E. Slug strategy = English-canonical

URL slugs do **not** translate. `/fr/problems/hallucination-reduction` is the correct French URL for the problem; the slug `hallucination-reduction` matches the English filename. The slug is a stable technical identifier (akin to ROR / ORCID IDs); the page title + body + tldr translate.

Per-locale slugs are rejected for v1: would require a slug-alias table + 301-redirect map + ADR-grade migration when slugs change; complexity dominates the FR-speaker-friendliness benefit at the project's current size (10 problems / 30 papers).

A future ADR could authorize per-locale slug aliases (e.g., `/fr/problemes/...` → `/fr/problems/...` redirect) when the FR audience grows and URL legibility becomes load-bearing. Out of scope for ADR-0011.

### D-F. Locale-toggle UI placement = site-header

The locale-toggle component lands next to `ThemeToggle` in `components/site-header/` (Unit 7.6). Mirrors `ThemeToggle`'s pattern:

- `"use client"` directive (the toggle reads + writes locale state).
- Stable placeholder pre-hydration (no layout shift).
- Three icons: EN, FR (and a third for future locales) — initially just two.
- Click cycles to the next locale; `aria-label` describes the next action.

Persistent across navigation via the URL (sub-path routing means the locale is in the URL — no cookie needed). The middleware sets a `NEXT_LOCALE` cookie as a "preferred locale" hint for first-visit redirects from bare URLs.

### D-G. Translation provenance = `translation_source` frontmatter

Every translated content file (`*.<locale>.{yaml,mdx}`) carries a `translation_source` field:

```yaml
translation_source: "human"          # default; curator-authored translation
# or
translation_source: "machine-assisted"  # curator-reviewed LLM-drafted translation
```

The field is **required on translated files**; absent on EN-canonical files (where it would be tautological — the EN content IS the source).

Schema lands in Unit 7.5 (Velite collection extensions) as a `s.enum(["human", "machine-assisted"])` field on the new sibling-file pattern. A future translation-CLI (Phase 7+ enhancement) would draft FR content with `translation_source: "machine-assisted"` per the ADR-0009 D-F precedent (`verified: false` enforcement on LLM drafts).

`editorial.primary_curator` remains **global** (not per-locale per Q53 lean). The curator chain answers "who is responsible for the editorial decision"; `translation_source` answers "how did the rendered language come into being." Two separate concerns.

### Consequences

- **Positive.** Single i18n runtime → predictable SDK ergonomics, App Router-canonical surface, mature stable release cadence. Operator familiarity (next-intl is the App Router default in nearly every tutorial).
- **Positive.** Sub-path routing is crawler-friendly + bookmarkable + SSG-compatible.
- **Positive.** Sibling-file storage preserves directory layout (curator workflow unchanged); makes missing translations explicit at the file-system level; Velite glob extension is one-line.
- **Positive.** English-canonical slugs avoid the slug-alias-table complexity; titles + body still translate (the part FR speakers actually read).
- **Positive.** `fr → en` fallback means infrastructure can ship Phase 7 without 100% translation coverage (Q51 lean depends on this).
- **Positive.** `translation_source` provenance is auditable; matches the ADR-0008 + ADR-0009 pattern.
- **Positive.** Reversible — `lib/i18n/` (Unit 7.2) abstracts the runtime call surface; a future ADR could swap runtimes via one-file edits.
- **Positive.** Site-header locale-toggle mirrors `ThemeToggle` UX pattern.
- **Negative.** Bundle weight. `next-intl` adds ~30 KB to client bundle when used on a page. Mitigated by the existing 103 kB First Load JS budget headroom; if the FR pilot pushes the shared chunk above 103 kB, escalate to a runtime swap or static-only message loading.
- **Negative.** Every URL now has a locale prefix; no "language-neutral" canonical URL. Existing inbound links to `/problems/x` get a 308 redirect to `/en/problems/x` (acceptable but adds one hop).
- **Negative.** Sibling-file pattern is curator-side awkward when one problem has many MDX surfaces — e.g. hallucination-reduction has background.mdx + definition.mdx + history.mdx, each needing a FR sibling. Tradeoff with sub-tree mirror (which would put all FR files together but break the "all artifacts for this problem in one directory" curator workflow). Sibling-file wins here.
- **Negative.** Slugs being English-canonical means a French speaker types `/fr/problems/hallucination-reduction` instead of `/fr/problemes/reduction-hallucinations`. Editorial cost.

## Pros and Cons of the Options

### Option 1 — `next-intl` + sub-path routing + sibling-file content storage (chosen)

- Good — App Router-canonical recommendation; mature SDK; stable release cadence.
- Good — sub-path routing is SSG-compatible + crawler-friendly.
- Good — sibling-file storage preserves directory layout; missing translations are explicit.
- Good — JSON-per-locale message files are static + tree-shakable per route.
- Bad — bundle weight (~30 KB) larger than Paraglide.js (~5 KB).
- Bad — slug strategy is English-canonical; FR speakers see English slugs.

### Option 2 — Paraglide.js + sub-path routing + sibling-file content storage

- Good — TypeScript-first; tree-shakable per-message; smaller bundle (~5 KB).
- Good — same content-storage advantages as option 1.
- Bad — newer; smaller ecosystem; fewer tutorials.
- Bad — App Router integration requires more glue (vs. next-intl's built-in support).
- Bad — limited operator familiarity in this project's command palette.

### Option 3 — Native Next.js i18n + custom translation lookup

- Good — no third-party runtime dependency.
- Good — full control over the lookup format + fallback semantics.
- Bad — builds a translation runtime in-house (~200-500 lines of indirection for a feature `next-intl` ships for free).
- Bad — ICU MessageFormat is non-trivial to re-implement correctly (plurals, gender, dates).
- Bad — diverges from operator familiarity / community tutorials.

### Option 4 — No i18n (defer to Phase 8+)

- Good — zero bundle weight; no migration cost.
- Good — preserves the Phase 0-6 architectural simplicity.
- Bad — drops the §13 Bilingual deliverable from Phase 7.
- Bad — defers a deliverable that has minimum-viable scope (FR pilot = 1 page); the cost is low.

### Option 5 — `next-intl` + cookie-based locale routing

- Good — same URL across locales; no redirect overhead.
- Bad — incompatible with SSG (cookies are request-time; SSG renders at build-time). Would force every locale-aware route to SSR.
- Bad — bookmarking shares a locale-coupled URL.
- Bad — crawler indexes one URL per locale-content combination is harder.

### Option 6 — `next-intl` + sub-tree content mirror

- Good — all FR files in one directory tree; easier bulk operations on translations.
- Bad — doubles the directory tree at HEAD (every problem has a mirror in `content/fr/`).
- Bad — curator workflow breaks ("all artifacts for hallucination-reduction in one place" becomes "all artifacts for hallucination-reduction across two trees").
- Bad — git mv on slug rename now touches two trees.

### Option 7 — `next-intl` + `lang:` frontmatter discriminator

- Good — single Velite collection scans all locales at once.
- Good — no glob extension needed.
- Bad — file proliferation: `hallucination-reduction.en.yaml` + `hallucination-reduction.fr.yaml` (no canonical-vs-translation distinction; both files are equal-class).
- Bad — `git log` on a problem fragments across N files even when only one locale was edited.
- Bad — loader complexity increases (filter by `lang` field at the collection level + per-route).

## Links

- MASTER_PROMPT.md §3 (brand), §5.5 (perf budget), §12 (phase cadence), §13 (Phase 6+ deliverables verbatim — Bilingual bullet), §14 (testing + commit conventions), §15.6 (primary-source rule).
- [OPEN_QUESTIONS Q50](../../OPEN_QUESTIONS.md#q50-i18n-runtime-choice) — **closed by this ADR** (decided-as-lean → decided).
- [OPEN_QUESTIONS Q51](../../OPEN_QUESTIONS.md#q51-bilingual-content-backfill-cadence) — informs D-D fallback chain decision; stays decided-as-lean (the cadence itself is curator-track, not an ADR-grade decision).
- [OPEN_QUESTIONS Q52](../../OPEN_QUESTIONS.md#q52-translation-provenance-schema) — informs D-G provenance frontmatter; stays decided-as-lean (the schema lands in Unit 7.5 Velite extensions).
- [OPEN_QUESTIONS Q53](../../OPEN_QUESTIONS.md#q53-curator-authorship-attribution-per-locale) — informs D-G "primary_curator stays global"; stays decided-as-lean.
- Related ADRs:
  - [ADR-0001](./0001-nextjs-app-router.md) — the App Router framework next-intl plugs into.
  - [ADR-0002](./0002-velite-for-mdx.md) — the Velite content pipeline that gets the sibling-file glob extension (Unit 7.5).
  - [ADR-0010](./0010-discussions-backend.md) — the most recent ADR; structural precedent (third-party runtime + thin first-party wrapper + operational gate).
- Phase-7 prep: [docs/thinking/7.0-phase-7-prep.md](../thinking/7.0-phase-7-prep.md) — D-3 / D-4 / D-5 / D-6 leans.
- Implementation: arrives in Unit 7.2 (`lib/i18n/` runtime + `next.config.ts` locale list + `middleware.ts` locale detection); Unit 7.3 (`app/[locale]/` route restructure); Unit 7.4 (`/methodology` FR pilot); Unit 7.5 (Velite collection extensions for sibling-file pattern + `translation_source` field); Unit 7.6 (`components/locale-toggle/` site-header UI); Unit 7.8 (sitemap with locale variants).
