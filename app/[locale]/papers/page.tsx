import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PapersIndex } from "@/components/papers-index";
import { getIndexedPapers } from "@/lib/content/load-papers-index";
import { isLocale } from "@/lib/i18n/routing";

interface PapersPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PapersPage({ params }: PapersPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const initial = getIndexedPapers();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Papers</h1>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          Seed papers covering the SOTA history of each curated open problem. Filter by problem,
          year, or venue; sort by year, title, or contribution count. Papers exist only as they
          relate to problems (MASTER_PROMPT §2 &quot;not a general paper search&quot;).
        </p>
      </header>
      <PapersIndex initial={initial} />
    </main>
  );
}
