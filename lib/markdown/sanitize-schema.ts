import type { Options as Schema } from "rehype-sanitize";

/**
 * rehype-sanitize schema for `users.bio` markdown rendering per
 * [ADR-0018](../../docs/adr/0018-markdown-sanitization.md) D-B + D-D.
 *
 * Phase-17 scope: bold / italic / inline-code / fenced-code-blocks /
 * links / autolinks / unordered + ordered + task lists / headings
 * (demoted per D-C in `lib/markdown/index.ts`) / blockquotes /
 * horizontal-rules / GFM strikethrough / paragraphs.
 *
 * Explicitly excluded (Phase 18+ candidates per D-H): tables /
 * footnotes / images / raw HTML / `class` / inline `style` / event
 * handlers / `<iframe>` / `<object>` / `<embed>` / `<script>` /
 * `<style>` / `<base>` / `<a target>` / `<a rel>` / `<a title>`.
 *
 * URL scheme allow-list per D-D: `https:` + `mailto:` ONLY.
 * Bare-URL GFM autolinks pass through this same filter as
 * defense-in-depth.
 *
 * Phase-18+ markdown surfaces (curator review notes per Phase-15
 * Class B B.2 item 5; possibly rating-action `rationale`) inherit
 * via sibling schemas (`reviewNotesSchema`, etc.) — each with its
 * own customization per ADR-0018 D-G. This schema is named
 * `bioSchema` (NOT `defaultSchema`) to signal Phase-17 scope.
 */
export const bioSchema: Schema = {
  tagNames: [
    "p",
    "strong",
    "em",
    "code",
    "pre",
    "a",
    "ul",
    "ol",
    "li",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "hr",
    "del",
    "br",
    "input",
  ],
  attributes: {
    a: ["href"],
    // GFM task lists render as `<input type="checkbox" disabled>` —
    // narrowly allow these attributes to render correctly while
    // staying read-only. `type` is value-restricted to `"checkbox"`
    // via the `[attr, ...allowedValues]` tuple form.
    input: [["type", "checkbox"], "checked", "disabled"],
    "*": [],
  },
  protocols: {
    href: ["https", "mailto"],
  },
  // Disallow all comments + doctypes (XSS surface; conditional
  // comments etc.).
  allowComments: false,
  allowDoctypes: false,
};
