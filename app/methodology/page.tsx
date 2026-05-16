import Link from "next/link";
import { notFound } from "next/navigation";
import { methodology } from "#site/content";
import { MDXContent } from "@/lib/mdx/mdx-content";

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

export default function MethodologyPage() {
  // Bare route serves EN-only. Locale-aware FR variants live under
  // /[locale]/methodology/ (Unit 7.5). Filter prevents the methodology
  // collection's FR records from sorting first and rendering FR at /methodology.
  const enMethodology = methodology.filter((m) => m.lang === "en");
  const latest = [...enMethodology].sort((a, b) => compareVersions(b.version, a.version))[0];
  if (!latest) notFound();

  return (
    <main className="mx-auto max-w-prose px-6 py-16">
      <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
        <span>Methodology</span>
        <span aria-hidden>·</span>
        <span className="font-mono">v{latest.version}</span>
        <span aria-hidden>·</span>
        <time dateTime={latest.date}>{latest.date}</time>
      </div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight">{latest.title}</h1>
      <p className="text-muted-foreground mt-3 text-base">{latest.summary}</p>
      <nav aria-label="Methodology versions" className="border-border mt-6 border-t pt-4">
        <span className="text-muted-foreground text-xs">Other versions: </span>
        {enMethodology
          .slice()
          .sort((a, b) => compareVersions(b.version, a.version))
          .map((m, i) => (
            <Link
              key={m.version}
              href={`/methodology/v${m.version}`}
              className="text-foreground hover:text-accent ml-1 text-xs underline-offset-2 hover:underline"
            >
              v{m.version}
              {i < enMethodology.length - 1 ? "," : ""}
            </Link>
          ))}
      </nav>
      <article className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
        <MDXContent code={latest.body} />
      </article>
    </main>
  );
}
