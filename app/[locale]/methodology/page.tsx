import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { methodology } from "#site/content";
import { resolveLocalized } from "@/lib/i18n/load-localized";
import { isLocale } from "@/lib/i18n/routing";
import { MDXContent } from "@/lib/mdx/mdx-content";

interface LocaleMethodologyPageProps {
  params: Promise<{ locale: string }>;
}

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

export default async function LocaleMethodologyPage({ params }: LocaleMethodologyPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  // Pick the latest version (sort EN canonicals; FR mirrors versioning).
  const latestVersion = [...methodology]
    .filter((m) => m.lang === "en")
    .sort((a, b) => compareVersions(b.version, a.version))[0]?.version;
  if (!latestVersion) notFound();

  const resolved = resolveLocalized(methodology, locale, (m) => m.version === latestVersion);
  if (!resolved) notFound();
  const doc = resolved.record;

  const distinctVersions = [
    ...new Set(methodology.filter((m) => m.lang === "en").map((m) => m.version)),
  ].sort((a, b) => compareVersions(b, a));

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <span>Methodology</span>
        <span aria-hidden>·</span>
        <span className="font-mono">v{doc.version}</span>
        <span aria-hidden>·</span>
        <time dateTime={doc.date}>{doc.date}</time>
      </div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{doc.title}</h1>
      <p className="text-muted-foreground mt-3 text-base">{doc.summary}</p>
      <nav aria-label="Methodology versions" className="border-border mt-6 border-t pt-4">
        <span className="text-muted-foreground text-xs">Other versions: </span>
        {distinctVersions.map((version, i) => (
          <Link
            key={version}
            href={`/${locale}/methodology/v${version}`}
            className="text-foreground hover:text-accent ml-1 text-xs underline-offset-2 hover:underline"
          >
            v{version}
            {i < distinctVersions.length - 1 ? "," : ""}
          </Link>
        ))}
      </nav>
      <article className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
        <MDXContent code={doc.body} />
      </article>
    </main>
  );
}
