import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <p className="text-muted-foreground text-xs tracking-widest uppercase">404</p>
      <h1 className="text-foreground mt-2 font-serif text-4xl font-semibold tracking-tight">
        Not found
      </h1>
      <p className="text-muted-foreground mt-4 text-base">
        That route doesn&apos;t exist yet. Phase 0 stubs are limited to the IA listed in
        MASTER_PROMPT.md §9.
      </p>
      <p className="mt-6">
        <Link href="/" className="hover:text-foreground underline">
          Back to the landing
        </Link>
      </p>
    </main>
  );
}
