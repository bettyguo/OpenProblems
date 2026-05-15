"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import type { IndexedProblem } from "@/lib/content/load-problems-index";
import {
  composite,
  isValidCompositeWeights,
  DEFAULT_COMPOSITE_WEIGHTS,
} from "@/lib/ratings/normalize";
import { Recompose, useUrlWeights } from "./recompose";

type SortKey = "title" | "lastCurated" | "composite";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "lastCurated", label: "Last curated" },
  { key: "composite", label: "Composite" },
];

const STATUS_OPTIONS = ["open", "partially-solved", "converging", "solved", "retired"] as const;

export function ProblemsIndex({
  initial,
  domains,
}: {
  initial: IndexedProblem[];
  domains: { id: string; title: string }[];
}) {
  const [domain, setDomain] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("composite");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [weights, setWeights] = useUrlWeights();

  // When the user types an invalid weight set (sum ≠ 1 or any < 0), silently
  // fall back to §8.3 defaults for the composite computation. The UI still
  // shows the user's typed values + a "must be 1.00" hint, but the sort uses
  // the defaults so the page remains usable.
  const effectiveWeights = isValidCompositeWeights(weights) ? weights : DEFAULT_COMPOSITE_WEIGHTS;

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const p of initial) for (const t of p.tags) set.add(t);
    return [...set].sort();
  }, [initial]);

  // Recompose-aware: when weights are non-default, recompute composite per row
  // from `p.points`. When defaults, use the server-precomputed `p.composite`.
  const recomposed = useMemo(() => {
    const isDefault =
      effectiveWeights.difficulty === DEFAULT_COMPOSITE_WEIGHTS.difficulty &&
      effectiveWeights.value === DEFAULT_COMPOSITE_WEIGHTS.value &&
      effectiveWeights.urgency === DEFAULT_COMPOSITE_WEIGHTS.urgency &&
      effectiveWeights.industry_call === DEFAULT_COMPOSITE_WEIGHTS.industry_call &&
      effectiveWeights.saturation === DEFAULT_COMPOSITE_WEIGHTS.saturation;
    if (isDefault) return initial;
    return initial.map((p) => {
      if (!p.points) return p;
      return { ...p, composite: composite(p.points, effectiveWeights) };
    });
  }, [initial, effectiveWeights]);

  const filtered = useMemo(() => {
    let rows = recomposed;
    if (domain) rows = rows.filter((p) => p.domainId === domain);
    if (status) rows = rows.filter((p) => p.status === status);
    if (tag) rows = rows.filter((p) => p.tags.includes(tag));
    rows = [...rows].sort((a, b) => {
      const dir = order === "asc" ? 1 : -1;
      if (sort === "title") return dir * a.title.localeCompare(b.title);
      if (sort === "lastCurated")
        return dir * (a.lastCurated < b.lastCurated ? -1 : a.lastCurated > b.lastCurated ? 1 : 0);
      // composite — nullables sort last
      const av = a.composite ?? -Infinity;
      const bv = b.composite ?? -Infinity;
      return dir * (av < bv ? -1 : av > bv ? 1 : 0);
    });
    return rows;
  }, [recomposed, domain, status, tag, sort, order]);

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <Select label="Domain" value={domain} onChange={setDomain}>
          <option value="">All domains</option>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </Select>
        <Select label="Status" value={status} onChange={setStatus}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("-", " ")}
            </option>
          ))}
        </Select>
        <Select label="Tag" value={tag} onChange={setTag}>
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <button
          type="button"
          onClick={() => {
            setDomain("");
            setStatus("");
            setTag("");
          }}
          className="border-border hover:border-accent text-muted-foreground hover:text-foreground rounded border px-3 py-1.5 text-xs"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>

      <Recompose weights={weights} onChange={setWeights} />

      <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
        <span>
          {filtered.length} problem{filtered.length === 1 ? "" : "s"}
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
          <li key={p.slug} className="py-4">
            <div className="flex items-baseline gap-3">
              <Link
                href={`/problems/${p.slug}`}
                className="text-foreground hover:text-accent text-base font-medium underline-offset-2 hover:underline"
              >
                {p.title}
              </Link>
              <StatusPill status={p.status} className="ml-auto shrink-0" />
            </div>
            <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <Link
                href={`/domains/${p.domainId}/${p.subdomainId}`}
                className="hover:text-foreground underline-offset-2 hover:underline"
              >
                {p.domainTitle} / {p.subdomainTitle}
              </Link>
              <span aria-hidden>·</span>
              <time dateTime={p.lastCurated} className="font-mono">
                {p.lastCurated}
              </time>
              {p.composite !== undefined && (
                <>
                  <span aria-hidden>·</span>
                  <span className="font-mono">
                    composite {p.composite.toFixed(2)}
                    {p.confidence !== undefined && (
                      <span className="text-muted-foreground/70 ml-1">
                        ({(p.confidence * 100).toFixed(0)}%)
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
            {p.points && (
              <div className="mt-2 flex gap-1" aria-label="Dimension breakdown">
                {p.points.map((pt, i) => (
                  <div
                    key={pt.dimension}
                    title={`${pt.dimension.replace("_", " ")}: ${pt.rawDisplay}`}
                    className="h-1 flex-1 overflow-hidden rounded-sm bg-current/10"
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${(pt.normalized / 5) * 100}%`,
                        background: `var(--color-chart-${i + 1})`,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {p.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(tag === t ? "" : t)}
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase",
                      tag === t
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent/20",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="text-muted-foreground mt-10 text-center text-sm italic">
          No problems match the current filters.
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
