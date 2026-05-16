import type { ReactNode } from "react";
import { Link } from "@/lib/i18n/navigation";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface RoutePlaceholderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  note?: string;
  children?: ReactNode;
}

/**
 * Phase 0 route stub — shared across every page in `app/` until Phase 1 fills
 * in the content. Renders breadcrumb nav + heading + a "content pending"
 * paragraph. Replace with the real route content per MASTER_PROMPT §9.
 *
 * Keep the shape minimal — every Phase 1 unit will delete this import.
 */
export function RoutePlaceholder({ title, breadcrumbs, note, children }: RoutePlaceholderProps) {
  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          className="text-muted-foreground mb-6 text-xs tracking-widest uppercase"
        >
          <ol className="flex flex-wrap items-center gap-1">
            {breadcrumbs.map((crumb, i) => (
              <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground focus-visible:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span aria-hidden>/</span>}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <h1 className="text-foreground font-serif text-4xl font-semibold tracking-tight">{title}</h1>

      <p className="text-muted-foreground mt-4 text-base">
        Phase 1 content pending — see{" "}
        <Link href="/" className="hover:text-foreground underline">
          MASTER_PROMPT.md §9
        </Link>{" "}
        for the planned shape of this route.
      </p>

      {note && <p className="text-muted-foreground mt-2 font-mono text-xs">{note}</p>}

      {children}
    </main>
  );
}
