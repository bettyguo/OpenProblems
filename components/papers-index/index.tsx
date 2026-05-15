"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { IndexedPaper } from "@/lib/content/load-papers-index";

type SortKey = "year" | "title" | "contributions";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "year", label: "Year" },
  { key: "title", label: "Title" },
  { key: "contributions", label: "Contributions" },
];

export function PapersIndex({ initial }: { initial: IndexedPaper[] }) {
  const [problem, setProblem] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [venue, setVenue] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("year");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const allProblems = useMemo(() => {
    const set = new Set<string>();
    for (const p of initial) for (const s of p.problemSlugs) set.add(s);
    return [...set].sort();
  }, [initial]);

  const allYears = useMemo(() => {
    const set = new Set<number>();
    for (const p of initial) set.add(p.year);
    return [...set].sort((a, b) => b - a);
  }, [initial]);

  const allVenues = useMemo(() => {
    const set = new Set<string>();
    for (const p of initial) if (p.venue) set.add(p.venue);
    return [...set].sort();
  }, [initial]);

  const filtered = useMemo(() => {
    let rows = initial;
    if (problem) rows = rows.filter((p) => p.problemSlugs.includes(problem));
    if (year) rows = rows.filter((p) => String(p.year) === year);
    if (venue) rows = rows.filter((p) => p.venue === venue);
    rows = [...rows].sort((a, b) => {
      const dir = order === "asc" ? 1 : -1;
      if (sort === "year") return dir * (a.year - b.year);
      if (sort === "title") return dir * a.title.localeCompare(b.title);
      // contributions
      return dir * (a.contributionCount - b.contributionCount);
    });
    return rows;
  }, [initial, problem, year, venue, sort, order]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Select label="Problem" value={problem} onChange={setProblem}>
          <option value="">All problems</option>
          {allProblems.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select label="Year" value={year} onChange={setYear}>
          <option value="">All years</option>
          {allYears.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </Select>
        <Select label="Venue" value={venue} onChange={setVenue}>
          <option value="">All venues</option>
          {allVenues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={() => {
            setProblem("");
            setYear("");
            setVenue("");
          }}
          className="border-border hover:border-accent text-muted-foreground hover:text-foreground rounded border px-3 py-1.5 text-xs"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>

      <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
        <span>
          {filtered.length} paper{filtered.length === 1 ? "" : "s"}
        </span>
        <span aria-hidden>·</span>
        <span>Sort:</span>
        {SORT_OPTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() =>
              s.key === sort ? setOrder(order === "asc" ? "desc" : "asc") : setSort(s.key)
            }
            className={cn(
              "hover:text-foreground underline-offset-2 hover:underline",
              s.key === sort && "text-foreground font-medium",
            )}
            aria-pressed={s.key === sort}
          >
            {s.label}
            {s.key === sort && <span aria-hidden> {order === "asc" ? "↑" : "↓"}</span>}
          </button>
        ))}
      </div>

      <ul className="border-border mt-6 divide-y divide-current/10 border-t border-b">
        {filtered.map((p) => (
          <li key={p.id} className="py-4">
            <div className="flex items-baseline gap-3">
              <Link
                href={`/papers/${p.id}`}
                className="text-foreground hover:text-accent text-base font-medium underline-offset-2 hover:underline"
              >
                {p.title}
              </Link>
              <span className="text-muted-foreground ml-auto shrink-0 font-mono text-xs">
                {p.year}
              </span>
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {p.venue && <span>{p.venue}</span>}
              {p.arxivId && (
                <>
                  {p.venue && <span aria-hidden>·</span>}
                  <span className="font-mono">arXiv:{p.arxivId}</span>
                </>
              )}
              <span aria-hidden>·</span>
              <span>
                {p.contributionCount} contribution{p.contributionCount === 1 ? "" : "s"}
              </span>
              {(p.authorCount > 0 || p.institutionCount > 0) && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    {p.authorCount} author{p.authorCount === 1 ? "" : "s"} · {p.institutionCount}{" "}
                    institution{p.institutionCount === 1 ? "" : "s"}
                  </span>
                </>
              )}
            </div>
            {p.problemSlugs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.problemSlugs.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setProblem(problem === s ? "" : s)}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide",
                      problem === s
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent/20",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="text-muted-foreground mt-10 text-center text-sm italic">
          No papers match the current filters.
        </p>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-xs">
      <span className="text-muted-foreground mb-1 block font-mono tracking-wide uppercase">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border bg-background text-foreground focus-visible:ring-ring w-full rounded border px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        {children}
      </select>
    </label>
  );
}
