import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import type { Plugin } from "unified";

import { bioSchema } from "./sanitize-schema";

/**
 * Server-side markdown rendering pipeline for `users.bio` per
 * [ADR-0018](../../docs/adr/0018-markdown-sanitization.md).
 *
 * Pipeline (D-A):
 *   1. `remark-parse` — markdown source → MDAST.
 *   2. `remark-gfm` — GitHub Flavored Markdown extensions
 *      (strikethrough, autolinks, task lists). Tables + footnotes
 *      ARE parsed here but stripped at the sanitization stage
 *      (their tag names are NOT in `bioSchema.tagNames`).
 *   3. `remark-rehype` with `allowDangerousHtml: false` — MDAST →
 *      HAST; raw HTML in markdown source is stripped at this
 *      boundary (first line of defense).
 *   4. **Heading demotion** (D-C) — `<h1>` → `<h3>`, `<h2>` →
 *      `<h4>`, `<h3>` → `<h5>`, `<h4>`/`<h5>`/`<h6>` → `<h6>`
 *      (page outline preservation; user display name is page-level
 *      `<h1>` on `/u/{handle}` + `/profile`).
 *   5. `rehype-sanitize` with `bioSchema` — defense-in-depth re-
 *      validation against the explicit tag + attribute + URL-
 *      protocol allow-list.
 *   6. `rehype-stringify` — HAST → HTML string.
 *
 * Render path is **server-side only** (D-F): the pipeline runs in
 * async server components at request time; rendered HTML is
 * inlined via `dangerouslySetInnerHTML` in the consumer page.
 * No client-side markdown processing; First Load JS shared chunk
 * UNCHANGED at 103 kB.
 *
 * @param text The raw markdown source string from `users.bio`, or
 *   null when the user has never set a bio (or after explicit
 *   clear per ADR-0016 D-B).
 * @returns Sanitized HTML string, or null when input is null /
 *   whitespace-only. The caller (server component) renders the
 *   HTML via `dangerouslySetInnerHTML`; null caller omits the bio
 *   section entirely per Phase-15 D-F empty-state behavior.
 */
export function renderBioMarkdown(text: string | null): string | null {
  if (text === null) return null;
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;

  const file = processor.processSync(trimmed);
  const html = String(file).trim();
  return html.length === 0 ? null : html;
}

/**
 * Heading demotion plugin per ADR-0018 D-C. Demotes any heading
 * (`<h1>` through `<h6>`) by **2 levels**, clamping at `<h6>`.
 *
 * `<h1>` → `<h3>`
 * `<h2>` → `<h4>`
 * `<h3>` → `<h5>`
 * `<h4>`/`<h5>`/`<h6>` → `<h6>`
 *
 * Page outline (preserved): page-level `<h1>` is user display
 * name on `/u/{handle}` + `/profile`; page-level `<h2>` is section
 * heading ("Edit profile", "Activity"); bio headings nest within.
 */
const rehypeDemoteHeadings: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    const tag = node.tagName;
    switch (tag) {
      case "h1":
        node.tagName = "h3";
        break;
      case "h2":
        node.tagName = "h4";
        break;
      case "h3":
        node.tagName = "h5";
        break;
      case "h4":
      case "h5":
      case "h6":
        node.tagName = "h6";
        break;
    }
  });
};

/**
 * Strip `<a href>` attributes that don't match the ADR-0018 D-D
 * URL allow-list (`https:` + `mailto:` ONLY). Defense-in-depth
 * BEYOND rehype-sanitize's `protocols.href` filter — the
 * `protocols` filter only inspects URLs WITH a scheme; schemeless
 * relative URLs (`/path`, `path`, `#anchor`) pass through it. This
 * plugin rejects those explicitly per ADR-0018 D-D's "relative
 * URLs DENIED" clause.
 *
 * Runs AFTER rehype-sanitize in the pipeline so the sanitized tree
 * shape is stable when this plugin walks it.
 */
const ABSOLUTE_HTTPS_OR_MAILTO = /^(https:\/\/|mailto:)/i;

const rehypeStripUnsafeHrefs: Plugin<[], Root> = () => (tree) => {
  visit(tree, "element", (node: Element) => {
    if (node.tagName !== "a") return;
    const href = node.properties?.href;
    if (typeof href !== "string" || !ABSOLUTE_HTTPS_OR_MAILTO.test(href)) {
      if (node.properties) delete node.properties.href;
    }
  });
};

/**
 * Singleton `unified` processor instance for `renderBioMarkdown`.
 * Build cost is amortized across requests (server-side cache
 * across the module's lifetime).
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeDemoteHeadings)
  .use(rehypeSanitize, bioSchema)
  .use(rehypeStripUnsafeHrefs)
  .use(rehypeStringify);
