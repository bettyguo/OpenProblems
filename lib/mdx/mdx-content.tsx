import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

/**
 * Render Velite-compiled MDX. Velite emits an ESM string that exports a
 * default React component when invoked with the runtime helpers. This
 * happens at request/build time on the server only; never expose to
 * user input.
 *
 * Usage:
 *
 *   import { MDXContent } from "@/lib/mdx/mdx-content";
 *   <MDXContent code={methodology.body} />
 */
export function MDXContent({ code }: { code: string }) {
  const fn = new Function(code);
  const { default: Component } = fn({ ...runtime }) as { default: ComponentType };
  return <Component />;
}
