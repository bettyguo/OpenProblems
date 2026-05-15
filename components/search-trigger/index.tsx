"use client";

import { Search } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { SearchRecord } from "@/lib/search/build-index";

const SearchPalette = dynamic(
  () => import("@/components/search-palette").then((m) => m.SearchPalette),
  { ssr: false },
);

export function SearchTrigger({ index, className }: { index: SearchRecord[]; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    function onKey(e: KeyboardEvent) {
      const cmdOrCtrl = e.metaKey || e.ctrlKey;
      if (cmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted]);

  if (!mounted) {
    return <span aria-hidden className={cn("inline-flex h-9 w-32 rounded-md", className)} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open search palette"
        aria-keyshortcuts="Control+K Meta+K"
        title="Search (⌘K)"
        className={cn(
          "border-border bg-background text-muted-foreground hover:text-foreground",
          "inline-flex h-9 items-center gap-2 rounded-md border px-2.5",
          "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "transition-colors",
          className,
        )}
      >
        <Search aria-hidden className="size-3.5" />
        <span className="text-xs">Search</span>
        <kbd className="border-border ml-2 rounded border px-1 py-0.5 font-mono text-[10px] leading-none">
          ⌘K
        </kbd>
      </button>
      <SearchPalette index={index} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
