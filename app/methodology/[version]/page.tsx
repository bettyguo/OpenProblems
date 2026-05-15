import { notFound } from "next/navigation";
import { methodology } from "#site/content";
import { MDXContent } from "@/lib/mdx/mdx-content";

interface MethodologyVersionPageProps {
  params: Promise<{ version: string }>;
}

export default async function MethodologyVersionPage({ params }: MethodologyVersionPageProps) {
  const { version } = await params;
  const requested = version.startsWith("v") ? version.slice(1) : version;
  const doc = methodology.find((m) => m.version === requested);
  if (!doc) notFound();

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <span>Methodology</span>
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
  return methodology.map((m) => ({ version: `v${m.version}` }));
}
