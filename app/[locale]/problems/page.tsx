import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { taxonomy } from "#site/content";
import { ProblemsIndex } from "@/components/problems-index";
import { getIndexedProblemsWithDiscussions } from "@/lib/content/load-problems-index";
import { isLocale } from "@/lib/i18n/routing";

interface ProblemsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProblemsPage({ params }: ProblemsPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const initial = await getIndexedProblemsWithDiscussions();
  const domains = taxonomy.domains.map((d) => ({ id: d.id, title: d.title }));

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Problems</h1>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          Every curated open problem. Filter by domain, status, or tag; sort by title, last-curated
          date, or §8.3 composite score. The composite is advisory only — the dimension breakdown
          below each row never disappears.
        </p>
      </header>
      <ProblemsIndex initial={initial} domains={domains} />
    </main>
  );
}
