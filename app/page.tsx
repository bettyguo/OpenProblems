const RATING_DIMENSIONS = [
  { label: "Difficulty", chart: "bg-chart-1" },
  { label: "Saturation", chart: "bg-chart-2" },
  { label: "Urgency", chart: "bg-chart-3" },
  { label: "Value", chart: "bg-chart-4" },
  { label: "Industry Call", chart: "bg-chart-5" },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
        LLM OpenProblems
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Phase 0 scaffold &middot; content arrives in Phase 1.
      </p>
      <p className="mt-2 font-mono text-sm text-muted-foreground">
        See <code>MASTER_PROMPT.md</code> for the project constitution.
      </p>

      <section
        aria-label="Rating dimensions"
        className="mt-10 border-t border-border pt-6"
      >
        <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Rating dimensions
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
          {RATING_DIMENSIONS.map(({ label, chart }) => (
            <li key={label} className="flex items-center gap-2">
              <span
                aria-hidden
                className={`size-3 shrink-0 rounded-full ${chart}`}
              />
              <span className="text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
