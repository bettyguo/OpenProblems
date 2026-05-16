import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { contributing } from "#site/content";
import { MDXContent } from "@/lib/mdx/mdx-content";
import { isLocale, locales } from "@/lib/i18n/routing";

interface ContributingVersionPageProps {
  params: Promise<{ locale: string; version: string }>;
}

export default async function ContributingVersionPage({ params }: ContributingVersionPageProps) {
  const { locale, version } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const requested = version.startsWith("v") ? version.slice(1) : version;
  const doc = contributing.filter((m) => m.lang === "en").find((m) => m.version === requested);
  if (!doc) notFound();

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <span>Contributing</span>
        <span aria-hidden>·</span>
        <span className="font-mono">v{doc.version}</span>
        <span aria-hidden>·</span>
        <time dateTime={doc.date}>{doc.date}</time>
        <span aria-hidden>·</span>
        <span>versioned snapshot</span>
      </div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{doc.title}</h1>
      <p className="text-muted-foreground mt-3 text-base">{doc.summary}</p>
      <article className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
        <MDXContent code={doc.body} />
      </article>
    </main>
  );
}

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    contributing.filter((m) => m.lang === "en").map((m) => ({ locale, version: `v${m.version}` })),
  );
}
