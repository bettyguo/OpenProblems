import { problems, taxonomy } from "#site/content";
import { allRatingActions, diffRatingAction, type RatingAction } from "@/lib/content/load-ratings";
import { loadEntriesForProblem } from "@/lib/content/load-entries";
import {
  TALK_PATHNAME_REGEX,
  tryGetRecentDiscussionActivity,
  type RecentActivityItem,
} from "@/lib/discussions/github-graphql";
import type { LeaderboardEntry } from "@/lib/schemas/entry";

/**
 * Per-domain weekly digest builder (Unit 5.7).
 *
 * Composes recent rating actions + new leaderboard entries for problems in a
 * given domain over a trailing-N-day window. Consumed by:
 *   - Unit 5.8 `app/api/v1/digest/[domain].xml/route.ts` (RSS endpoint)
 *   - Unit 5.9 `/digest` hub page (HTML overview)
 *
 * Window anchor = `now` parameter (default: `new Date()`). DISTINCT from
 * MoversBoard's "most-recent-action-date" anchor (Unit 3.0 D-8): RSS readers
 * expect wall-clock cadence. Empty windows produce valid empty payloads
 * (`items: []`) with descriptive channel metadata.
 *
 * Pure-function — no LLM calls. Async because `loadEntriesForProblem` reads
 * `entries.json` files from disk.
 */

const DEFAULT_WINDOW_DAYS = 7;

export interface DigestItem {
  kind: "rating-action" | "leaderboard-entry" | "discussion";
  title: string;
  link: string;
  date: string;
  description: string;
  guid: string;
  problemSlug: string;
  problemTitle: string;
}

export interface DigestPayload {
  domain: string;
  domainTitle: string;
  windowDays: number;
  generatedAt: string;
  cutoffDate: string;
  items: DigestItem[];
  channelTitle: string;
  channelDescription: string;
}

export interface BuildDigestOptions {
  domain: string;
  windowDays?: number;
  now?: Date;
  /**
   * Override the Discussion-thread activity fetcher (Unit 6.6). Default is
   * `tryGetRecentDiscussionActivity` which gracefully returns `[]` when
   * `GITHUB_TOKEN` is unset or the GraphQL query fails — so builds proceed
   * without discussions. Tests inject fixtures here.
   */
  discussionsLoader?: (since: Date) => Promise<RecentActivityItem[]>;
}

function toIsoDate(d: unknown): string {
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  if (typeof d === "string") return d.slice(0, 10);
  return "";
}

function cutoffIsoDate(now: Date, windowDays: number): string {
  const cutoff = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  return cutoff.toISOString().slice(0, 10);
}

function ratingActionToItem(
  action: RatingAction,
  problemTitle: string,
  prior: RatingAction | undefined,
): DigestItem {
  const diff = diffRatingAction(action, prior);
  const primaryDelta = diff.deltas.find((d) => d.primary);
  const headline = primaryDelta?.summary ?? "initial rating";
  const watchlistNote = diff.watchlistChanged
    ? ` (watchlist ${diff.priorWatchlist} → ${diff.newWatchlist})`
    : "";
  const date = toIsoDate(action.date);
  return {
    kind: "rating-action",
    title: `${problemTitle} — ${headline}`,
    link: `/problems/${action.problem_slug}/ratings#${encodeURIComponent(action.id)}`,
    date,
    description: `Rating action by ${action.curator} on ${date}: ${headline}${watchlistNote}.`,
    guid: action.id,
    problemSlug: action.problem_slug,
    problemTitle,
  };
}

function discussionToItem(
  activity: RecentActivityItem,
  problemSlug: string,
  problemTitle: string,
): DigestItem {
  const date = toIsoDate(activity.updatedAt);
  const commentNoun = activity.commentCount === 1 ? "comment" : "comments";
  return {
    kind: "discussion",
    title: `${problemTitle} — discussion thread (${activity.commentCount} ${commentNoun})`,
    link: `/problems/${problemSlug}/talk`,
    date,
    description: `Discussion thread for ${problemTitle}: ${activity.commentCount} ${commentNoun}; last activity ${date}.`,
    guid: `discussion:${activity.discussionId}`,
    problemSlug,
    problemTitle,
  };
}

function entryToItem(
  entry: LeaderboardEntry,
  problemSlug: string,
  problemTitle: string,
): DigestItem {
  const date = toIsoDate(entry.date);
  const protocolNote = entry.protocol_notes ? ` ${entry.protocol_notes}` : "";
  return {
    kind: "leaderboard-entry",
    title: `${problemTitle} — ${entry.benchmark_id} ${entry.score}`,
    link: `/problems/${problemSlug}`,
    date,
    description: `Leaderboard entry: ${entry.paper_id} reports ${entry.score} on ${entry.benchmark_id} (${date}).${protocolNote}`,
    guid: `entry:${problemSlug}/${entry.paper_id}/${entry.benchmark_id}/${date}`,
    problemSlug,
    problemTitle,
  };
}

export async function buildDigest(options: BuildDigestOptions): Promise<DigestPayload> {
  const domainSlug = options.domain;
  const windowDays = options.windowDays ?? DEFAULT_WINDOW_DAYS;
  const now = options.now ?? new Date();

  const domainNode = taxonomy.domains.find((d) => d.id === domainSlug);
  if (!domainNode) {
    throw new Error(`Domain not found: "${domainSlug}"`);
  }

  const domainProblems = problems.filter((p) => p.domain === domainSlug);
  const domainProblemTitleBySlug = new Map(domainProblems.map((p) => [p.slug, p.title]));
  const domainProblemSlugs = new Set(domainProblems.map((p) => p.slug));

  const cutoffDate = cutoffIsoDate(now, windowDays);
  const cutoffMs = Date.parse(cutoffDate);
  const nowMs = now.getTime();

  const items: DigestItem[] = [];

  // Rating actions: pull all, filter by domain + window. Use diffRatingAction
  // against the immediately-prior action for the same problem (needed for the
  // headline-delta string).
  const allActions = allRatingActions();
  const actionsByProblem = new Map<string, RatingAction[]>();
  for (const a of allActions) {
    if (!domainProblemSlugs.has(a.problem_slug)) continue;
    const arr = actionsByProblem.get(a.problem_slug) ?? [];
    arr.push(a);
    actionsByProblem.set(a.problem_slug, arr);
  }
  for (const [slug, actions] of actionsByProblem) {
    // `actions` are newest-first per allRatingActions(); reverse to walk oldest-first
    // so prior-action lookup is straightforward.
    const chronological = [...actions].reverse();
    for (let i = 0; i < chronological.length; i++) {
      const action = chronological[i]!;
      const actionMs = Date.parse(toIsoDate(action.date));
      if (actionMs < cutoffMs || actionMs > nowMs) continue;
      const prior = i > 0 ? chronological[i - 1] : undefined;
      items.push(ratingActionToItem(action, domainProblemTitleBySlug.get(slug) ?? slug, prior));
    }
  }

  // Leaderboard entries: fan out per-problem.
  for (const problem of domainProblems) {
    const entries = await loadEntriesForProblem(problem.slug);
    for (const entry of entries) {
      const entryMs = Date.parse(toIsoDate(entry.date));
      if (Number.isNaN(entryMs)) continue;
      if (entryMs < cutoffMs || entryMs > nowMs) continue;
      items.push(entryToItem(entry, problem.slug, problem.title));
    }
  }

  // Discussion-thread activity (Unit 6.6). One repo-global fetch; filter by
  // title-regex match against this domain's problem slugs + window. The default
  // loader is the env-safe wrapper, so missing GITHUB_TOKEN simply yields zero
  // discussion items rather than crashing the build.
  const discussionsLoader = options.discussionsLoader ?? tryGetRecentDiscussionActivity;
  const since = new Date(cutoffMs);
  const activity = await discussionsLoader(since);
  for (const a of activity) {
    const m = a.title.match(TALK_PATHNAME_REGEX);
    // Capture group 1 is optional locale; group 2 is the slug (Unit 8.1).
    const slug = m?.[2];
    if (!slug || !domainProblemSlugs.has(slug)) continue;
    const activityMs = Date.parse(toIsoDate(a.updatedAt));
    if (Number.isNaN(activityMs)) continue;
    if (activityMs < cutoffMs || activityMs > nowMs) continue;
    items.push(discussionToItem(a, slug, domainProblemTitleBySlug.get(slug) ?? slug));
  }

  items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const channelTitle = `LLM OpenProblems — ${domainNode.title} digest`;
  const hasDiscussion = items.some((i) => i.kind === "discussion");
  const channelDescription =
    items.length === 0
      ? `No activity in the last ${windowDays} days for problems in the ${domainNode.title} domain.`
      : `${items.length} item${items.length === 1 ? "" : "s"} in the last ${windowDays} days for problems in the ${domainNode.title} domain (rating actions + new leaderboard entries${hasDiscussion ? " + discussion threads" : ""}).`;

  return {
    domain: domainSlug,
    domainTitle: domainNode.title,
    windowDays,
    generatedAt: now.toISOString(),
    cutoffDate,
    items,
    channelTitle,
    channelDescription,
  };
}
