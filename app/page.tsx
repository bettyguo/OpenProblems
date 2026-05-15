import Link from "next/link";

const RATING_DIMENSIONS = [
  { label: "Difficulty", chart: "bg-chart-1" },
  { label: "Saturation", chart: "bg-chart-2" },
  { label: "Urgency", chart: "bg-chart-3" },
  { label: "Value", chart: "bg-chart-4" },
  { label: "Industry Call", chart: "bg-chart-5" },
] as const;

const STUB_ROUTES = [
  { href: "/domains", label: "Domains" },
  { href: "/problems", label: "Problems" },
  { href: "/papers", label: "Papers" },
  { href: "/trending", label: "Trending" },
  { href: "/ratings", label: "Rating actions" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
  { href: "/contributing", label: "Contributing" },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-foreground font-serif text-4xl font-semibold tracking-tight">
        LLM OpenProblems
      </h1>
      <p className="text-muted-foreground mt-3 text-base">
        Phase 0 scaffold &middot; content arrives in Phase 1.
      </p>
      <p className="text-muted-foreground mt-2 font-mono text-sm">
        See <code>MASTER_PROMPT.md</code> for the project constitution.
      </p>

      <section aria-label="Rating dimensions" className="border-border mt-10 border-t pt-6">
        <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Rating dimensions
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
          {RATING_DIMENSIONS.map(({ label, chart }) => (
            <li key={label} className="flex items-center gap-2">
              <span aria-hidden className={`size-3 shrink-0 rounded-full ${chart}`} />
              <span className="text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Phase 0 stub routes" className="border-border mt-10 border-t pt-6">
        <h2 className="text-muted-foreground text-xs font-medium tracking-widest uppercase">
          Routes
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
          {STUB_ROUTES.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-foreground hover:text-accent text-sm underline-offset-2 hover:underline"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
