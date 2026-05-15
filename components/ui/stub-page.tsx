import type { ReactNode } from "react";

interface StubPageProps {
  title: string;
  description?: ReactNode;
}

/**
 * Phase 0 placeholder page chrome. Renders a single landmark `<main>` with
 * one h1 and a short body paragraph. Used by every stubbed route in
 * `app/**` until Phase 1 content lands. Token-aware (consumes design
 * tokens from Unit 0.4); zero client JS.
 */
export function StubPage({ title, description = "Phase 1 content pending." }: StubPageProps) {
  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-foreground font-serif text-4xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-3 text-base">{description}</p>
    </main>
  );
}
