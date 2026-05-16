"use client";

import Fuse from "fuse.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { SearchRecord } from "@/lib/search/build-index";

interface SearchPaletteProps {
  index: SearchRecord[];
  open: boolean;
  onClose: () => void;
}

export function SearchPalette({ index, open, onClose }: SearchPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const fuse = useMemo(
    () =>
      new Fuse(index, {
        keys: [
          { name: "title", weight: 3 },
          { name: "subtitle", weight: 2 },
          { name: "tags", weight: 1.5 },
          { name: "domainTitle", weight: 1 },
          { name: "subdomainTitle", weight: 1 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [index],
  );

  const results = useMemo<SearchRecord[]>(() => {
    if (!query.trim()) return index.slice(0, 8);
    return fuse.search(query, { limit: 20 }).map((r) => r.item);
  }, [fuse, query, index]);

  // Focus input on open, lock body scroll, reset selection.
  useEffect(() => {
    if (!open) return;
    setActive(0);
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Keyboard nav inside the palette.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const target = results[active];
        if (target) {
          onClose();
          router.push(target.href);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, onClose, router]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search palette"
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[15vh]"
    >
      <button
        type="button"
        aria-label="Close search"
        onClick={onClose}
        className="bg-background/70 fixed inset-0 -z-10 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div className="bg-background border-border w-full max-w-xl rounded-lg border shadow-lg">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          placeholder="Search problems, domains, tags…"
          autoComplete="off"
          spellCheck={false}
          className="text-foreground placeholder:text-muted-foreground w-full bg-transparent px-4 py-3 text-sm focus:outline-none"
          aria-label="Search input"
        />
        <ul
          role="listbox"
          aria-label="Search results"
          className="border-border max-h-[60vh] overflow-y-auto border-t"
        >
          {results.length === 0 ? (
            <li className="text-muted-foreground px-4 py-6 text-center text-sm italic">
              No matches for "{query}".
            </li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                className={cn("border-border border-b last:border-0", i === active && "bg-muted")}
              >
                <Link
                  href={r.href}
                  onClick={onClose}
                  className="block cursor-pointer px-4 py-2.5 text-sm no-underline"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
                      {r.kind}
                    </span>
                    <span className="text-foreground font-medium">{r.title}</span>
                  </div>
                  {(r.domainTitle || r.tags.length > 0) && (
                    <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                      {r.domainTitle && (
                        <span>
                          {r.domainTitle}
                          {r.subdomainTitle ? ` / ${r.subdomainTitle}` : ""}
                        </span>
                      )}
                      {r.tags.length > 0 && (
                        <span className="font-mono text-[10px] tracking-wide uppercase">
                          {r.tags.slice(0, 3).join(" · ")}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              </li>
            ))
          )}
        </ul>
        <div className="text-muted-foreground border-border flex items-center justify-between border-t px-3 py-1.5 font-mono text-[10px]">
          <span>↑↓ navigate · ↵ open · esc close</span>
          <span>
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    </div>
  );
}
