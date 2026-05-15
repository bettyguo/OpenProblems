"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const NEXT_STATE: Record<Theme, Theme> = {
  light: "dark",
  dark: "system",
  system: "light",
};

const LABEL: Record<Theme, string> = {
  light: "Switch to dark mode",
  dark: "Switch to system theme",
  system: "Switch to light mode",
};

/**
 * Three-state cycle button: light → dark → system → light. The visible
 * icon represents the *current* theme; the aria-label says what the
 * next click will do. Renders a stable placeholder before hydration so
 * the layout doesn't shift when next-themes resolves the active theme.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Pre-hydration: render a transparent placeholder of the same size.
    return (
      <span
        aria-hidden
        className={cn("inline-flex size-9 items-center justify-center rounded-md", className)}
      />
    );
  }

  const current: Theme = (theme === "dark" || theme === "system" ? theme : "light") as Theme;
  const Icon = current === "light" ? Sun : current === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => setTheme(NEXT_STATE[current])}
      aria-label={LABEL[current]}
      title={LABEL[current]}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md",
        "border-border bg-background text-foreground border",
        "hover:bg-muted",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        "transition-colors",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
