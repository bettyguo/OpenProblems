import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { taxonomy } from "#site/content";
import { RecentlyRated } from "@/components/recently-rated";
import { ChartTableSwitch } from "@/components/viz/_shared/chart-table-switch";
import { DomainMap } from "@/components/viz/DomainMap";
import { DomainMapTable } from "@/components/viz/DomainMap/table";
import { Link } from "@/lib/i18n/navigation";
import { isLocale } from "@/lib/i18n/routing";
import { buildDomainMap } from "@/lib/content/build-domain-map";

interface HomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const { nodes, links } = buildDomainMap();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <section aria-labelledby="hero-heading" className="max-w-prose">
        <h1
          id="hero-heading"
          className="text-foreground font-serif text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          {t("hero_heading")}
        </h1>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg">{t("hero_description")}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/problems"
            className="bg-foreground text-background hover:bg-accent inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            {t("cta_browse_problems")}
          </Link>
          <Link
            href="/methodology"
            className="border-border hover:border-accent/60 hover:text-accent inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            {t("cta_read_methodology")}
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="recently-rated-heading"
        className="border-border mt-16 border-t pt-8"
      >
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2
            id="recently-rated-heading"
            className="font-serif text-2xl font-semibold tracking-tight"
          >
            {t("recently_rated_heading")}
          </h2>
          <Link
            href="/ratings"
            className="text-muted-foreground hover:text-accent font-mono text-xs underline-offset-2 hover:underline"
          >
            {t("recently_rated_all_link")}
          </Link>
        </div>
        <RecentlyRated />
      </section>

      <section aria-labelledby="by-domain-heading" className="border-border mt-16 border-t pt-8">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="by-domain-heading" className="font-serif text-2xl font-semibold tracking-tight">
            {t("by_domain_heading")}
          </h2>
          <Link
            href="/domains"
            className="text-muted-foreground hover:text-accent font-mono text-xs underline-offset-2 hover:underline"
          >
            {t("by_domain_all_link")}
          </Link>
        </div>
        <nav aria-label={t("by_domain_nav_aria")} className="mb-4 flex flex-wrap gap-2">
          {taxonomy.domains.map((d) => (
            <Link
              key={d.id}
              href={`/domains/${d.id}`}
              className="border-border hover:border-accent/60 hover:bg-muted/40 hover:text-accent rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            >
              {d.title}
            </Link>
          ))}
        </nav>
        <ChartTableSwitch
          ariaLabel={t("domain_map_switch_aria")}
          chart={<DomainMap nodes={nodes} links={links} ariaLabel={t("domain_map_aria")} />}
          table={<DomainMapTable nodes={nodes} />}
          label={t("domain_map_table_label")}
        />
      </section>

      <section aria-labelledby="methodology-heading" className="border-border mt-16 border-t pt-8">
        <h2 id="methodology-heading" className="font-serif text-2xl font-semibold tracking-tight">
          {t("methodology_heading")}
        </h2>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm">
          {t("methodology_description")}
        </p>
        <div className="mt-4">
          <Link
            href="/methodology"
            className="text-foreground hover:text-accent text-sm underline underline-offset-2"
          >
            {t("methodology_cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
