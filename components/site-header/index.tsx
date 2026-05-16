import { LocaleToggle } from "@/components/locale-toggle";
import { SearchTrigger } from "@/components/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link } from "@/lib/i18n/navigation";
import { getSearchIndex } from "@/lib/search/build-index";

export function SiteHeader() {
  const index = getSearchIndex();
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <Link
          href="/"
          className="text-foreground hover:text-accent font-serif text-base font-semibold tracking-tight"
        >
          LLM OpenProblems
        </Link>
        <nav
          aria-label="Primary"
          className="text-muted-foreground ml-4 hidden gap-4 text-xs sm:flex"
        >
          <Link
            href="/domains"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Domains
          </Link>
          <Link
            href="/problems"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Problems
          </Link>
          <Link
            href="/methodology"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Methodology
          </Link>
          <Link
            href="/trending"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Trending
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SearchTrigger index={index} />
          <LocaleToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
