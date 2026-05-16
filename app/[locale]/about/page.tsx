import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/routing";

interface AboutPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("about");

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-4 text-base">{t("description")}</p>
    </main>
  );
}
