import Link from "next/link";
import { taxonomy } from "#site/content";
import { buildDigest, type DigestPayload } from "@/lib/digest/build-digest";

/**
 * Unit 5.9 — `/digest` HTML hub.
 *
 * One section per taxonomy domain, each showing item count + a 3-item preview
 * + a link to the per-domain RSS feed. `<link rel="alternate">` tags in the
 * page `<head>` declare each feed for RSS-reader auto-discovery.
 *
 * Server component. Async because `buildDigest` reads `entries.json` from
 * disk per domain. All domains build in parallel via `Promise.all`.
 */

const PREVIEW_ITEMS_PER_DOMAIN = 3;

export const metadata = {
  title: "Digest",
  description:
    "Per-domain weekly summary of rating actions and new leaderboard entries across LLM OpenProblems. Subscribe via RSS for any domain.",
  alternates: {
    types: {
      "application/rss+xml": taxonomy.domains.map((d) => ({
        url: `/api/v1/digest/${d.id}`,
        title: `LLM OpenProblems — ${d.title} digest`,
      })),
    },
  },
};

function PerDomainSection({ payload }: { payload: DigestPayload }) {
  const preview = payload.items.slice(0, PREVIEW_ITEMS_PER_DOMAIN);
  const remaining = payload.items.length - preview.length;
  const isEmpty = payload.items.length === 0;
  return (
    <section
      aria-labelledby={`domain-${payload.domain}-heading`}
      className="border-border border-t py-6"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <h2
          id={`domain-${payload.domain}-heading`}
          className="font-serif text-xl font-semibold tracking-tight"
        >
          <Link
            href={`/domains/${payload.domain}`}
            className="hover:text-accent underline-offset-2 hover:underline"
          >
            {payload.domainTitle}
          </Link>
        </h2>
        <p className="text-muted-foreground font-mono text-xs">
          {isEmpty ? (
            <span>no activity</span>
          ) : (
            <span>
              {payload.items.length} item{payload.items.length === 1 ? "" : "s"}
            </span>
          )}{" "}
          ·{" "}
          <Link
            href={`/api/v1/digest/${payload.domain}`}
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            RSS feed
          </Link>
        </p>
      </header>

      {isEmpty ? (
        <p className="text-muted-foreground mt-3 text-sm italic">{payload.channelDescription}</p>
      ) : (
        <>
          <ol className="mt-4 divide-y divide-[var(--border)]">
            {preview.map((item) => (
              <li key={item.guid} className="py-3">
                <article>
                  <p className="text-muted-foreground font-mono text-xs">
                    <time dateTime={item.date}>{item.date}</time> <span aria-hidden>·</span>{" "}
                    <span className="text-muted-foreground">
                      {item.kind === "rating-action" ? "rating action" : "leaderboard entry"}
                    </span>
                  </p>
                  <h3 className="mt-1 font-serif text-base font-medium">
                    <Link
                      href={item.link}
                      className="hover:text-accent underline-offset-2 hover:underline"
                    >
                      {item.title}
                    </Link>
                  </h3>
                  <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
                </article>
              </li>
            ))}
          </ol>
          {remaining > 0 ? (
            <p className="mt-3 text-xs">
              <Link
                href={`/api/v1/digest/${payload.domain}`}
                className="text-muted-foreground hover:text-foreground font-mono underline-offset-2 hover:underline"
              >
                View {remaining} more in the RSS feed →
              </Link>
            </p>
          ) : null}
        </>
      )}

      <p className="text-muted-foreground mt-4 font-mono text-[10px]">
        window: {payload.windowDays}d · cutoff: {payload.cutoffDate} · built:{" "}
        {payload.generatedAt.slice(0, 19).replace("T", " ")}Z
      </p>
    </section>
  );
}

export default async function DigestPage() {
  const payloads = await Promise.all(taxonomy.domains.map((d) => buildDigest({ domain: d.id })));

  const totalItems = payloads.reduce((sum, p) => sum + p.items.length, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">Digest</h1>
        <p className="text-muted-foreground mt-3 max-w-prose text-sm">
          Per-domain weekly summary of rating actions and new leaderboard entries across LLM
          OpenProblems. Each domain has its own RSS feed; subscribe to one or many.
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          {payloads.length} domains ·{" "}
          {totalItems === 0
            ? "no activity in any feed this week"
            : `${totalItems} item${totalItems === 1 ? "" : "s"} this week across all feeds`}
        </p>
      </header>

      <div className="mt-8">
        {payloads.map((payload) => (
          <PerDomainSection key={payload.domain} payload={payload} />
        ))}
      </div>
    </main>
  );
}
