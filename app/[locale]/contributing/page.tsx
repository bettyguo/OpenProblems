import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { contributing } from "#site/content";
import { MDXContent } from "@/lib/mdx/mdx-content";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";

function parseVersion(v: string): [number, number, number] {
  const m = v.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/);
  if (!m) return [0, 0, 0];
  const [, major = "0", minor = "0", patch = "0"] = m;
  return [Number(major), Number(minor), Number(patch)];
}

function compareVersions(a: string, b: string): number {
  const [aM, am, ap] = parseVersion(a);
  const [bM, bm, bp] = parseVersion(b);
  return aM - bM || am - bm || ap - bp;
}

interface ContributingPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ContributingPage({ params }: ContributingPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const enContributing = contributing.filter((m) => m.lang === "en");
  const latest = [...enContributing].sort((a, b) => compareVersions(b.version, a.version))[0];
  if (!latest) notFound();

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <span>Contributing</span>
        <span aria-hidden>·</span>
        <span className="font-mono">v{latest.version}</span>
        <span aria-hidden>·</span>
        <time dateTime={latest.date}>{latest.date}</time>
      </div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{latest.title}</h1>
      <p className="text-muted-foreground mt-3 text-base">{latest.summary}</p>
      <nav aria-label="Contributing versions" className="border-border mt-6 border-t pt-4">
        <span className="text-muted-foreground text-xs">Other versions: </span>
        {enContributing
          .slice()
          .sort((a, b) => compareVersions(b.version, a.version))
          .map((m, i) => (
            <Link
              key={m.version}
              href={`/contributing/v${m.version}`}
              className="text-foreground hover:text-accent ml-1 text-xs underline-offset-2 hover:underline"
            >
              v{m.version}
              {i < enContributing.length - 1 ? "," : ""}
            </Link>
          ))}
      </nav>
      <article className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
        <MDXContent code={latest.body} />
      </article>
    </main>
  );
}
