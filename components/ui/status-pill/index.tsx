import { cn } from "@/lib/utils";

type Status = "open" | "partially-solved" | "converging" | "solved" | "retired";

const STYLES: Record<Status, { label: string; ring: string; text: string }> = {
  open: {
    label: "Open",
    ring: "ring-1 ring-foreground/40",
    text: "text-foreground",
  },
  "partially-solved": {
    label: "Partially solved",
    ring: "ring-1 ring-[var(--color-chart-3)]/60",
    text: "text-[var(--color-chart-3)]",
  },
  converging: {
    label: "Converging",
    ring: "ring-1 ring-[var(--color-chart-4)]/60",
    text: "text-[var(--color-chart-4)]",
  },
  solved: {
    label: "Solved",
    ring: "ring-1 ring-[var(--color-chart-2)]/60",
    text: "text-[var(--color-chart-2)]",
  },
  retired: {
    label: "Retired",
    ring: "ring-1 ring-muted-foreground/40",
    text: "text-muted-foreground",
  },
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 font-mono text-xs tracking-wide",
        s.ring,
        s.text,
        className,
      )}
    >
      {s.label}
    </span>
  );
}
