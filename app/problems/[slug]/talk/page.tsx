import Link from "next/link";
import { notFound } from "next/navigation";
import { allProblemSlugs, loadProblem } from "@/lib/content/load-problem";

interface TalkPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allProblemSlugs().map((slug) => ({ slug }));
}

const DISCUSSIONS_INDEX_URL = "https://github.com/bettyguo/OpenProblems/discussions";

export default async function TalkPage({ params }: TalkPageProps) {
  const { slug } = await params;
  const loaded = loadProblem(slug);
  if (!loaded) notFound();

  const { problem } = loaded;
  const pathname = `/problems/${slug}/talk`;

  return (
    <main className="mx-auto max-w-prose px-6 py-12">
      <nav aria-label="Breadcrumb" className="text-muted-foreground mb-3 text-xs">
        <Link href="/problems" className="hover:text-foreground underline-offset-2 hover:underline">
          Problems
        </Link>
        <span aria-hidden> / </span>
        <Link
          href={`/problems/${slug}`}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          {problem.title}
        </Link>
        <span aria-hidden> / </span>
        <span>Discussion</span>
      </nav>

      <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Discussion</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Community talk thread for{" "}
        <Link
          href={`/problems/${slug}`}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          {problem.title}
        </Link>
        . Comments are hosted on GitHub Discussions and authored via your GitHub account.
      </p>

      <section
        id="discussions"
        aria-label="Discussion thread"
        className="border-border mt-10 border-t pt-8"
      >
        <p className="text-muted-foreground text-sm italic">Discussion thread loading…</p>
      </section>

      <noscript>
        <section
          aria-label="No-JavaScript fallback"
          className="border-border mt-6 rounded border p-4 text-sm"
        >
          <p>
            Comments require JavaScript to load. View the discussion directly on{" "}
            <a
              href={DISCUSSIONS_INDEX_URL}
              className="text-accent underline-offset-2 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Discussions
            </a>
            ; search for the thread titled <code className="font-mono text-xs">{pathname}</code>.
          </p>
        </section>
      </noscript>

      <p className="text-muted-foreground mt-10 text-xs">
        <Link
          href={`/problems/${slug}`}
          className="hover:text-foreground underline-offset-2 hover:underline"
        >
          ← Back to {problem.title}
        </Link>
      </p>
    </main>
  );
}
