import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { graphql } from "@octokit/graphql";

/**
 * First-party GitHub GraphQL read-side client for Phase-6 Discussions
 * integration (ADR-0010 D-B + D-D + D-E).
 *
 * - Reads `GITHUB_TOKEN` from env at call time; throws when unset (D-D, no fallback).
 *   Tests / alternative auth modes can pass a `clientFactory` instead.
 * - Filesystem cache at `.github-cache/<query-hash>.json` (gitignored; D-E).
 * - Per-build TTL — caller invalidates by deleting the cache dir.
 * - Read-only: `public_repo` token scope is the minimum; the client never writes.
 *   Comment writes happen inside the Giscus iframe via GitHub's own OAuth (D-A).
 *
 * Used by Units 6.3-6.6 (talk-page route shell, problem-card activity badge,
 * digest-pipeline extension) at SSG build time.
 */

const DEFAULT_CACHE_DIR = ".github-cache";
const DEFAULT_REPO_OWNER = "bettyguo";
const DEFAULT_REPO_NAME = "OpenProblems";
const RECENT_DISCUSSIONS_PAGE_SIZE = 50;

/**
 * Regex matching the Giscus pathname-mapping convention (ADR-0010 D-C) for
 * problem talk pages. Auto-created discussions have the pathname as their
 * title; this regex extracts the problem slug from such a title. Manually-
 * authored discussions with non-pathname titles will not match (correct —
 * they're out of scope for the per-domain digest).
 *
 * Unit 8.1: optional `(en|fr)/` prefix accepts both pre-migration titles
 * (e.g. `/problems/x/talk`) and post-migration titles (e.g. `/en/problems/
 * x/talk` after middleware 308-redirects under `localePrefix: "always"`).
 * Capture group 1 is the optional locale; capture group 2 is the slug.
 */
export const TALK_PATHNAME_REGEX = /^\/(?:(en|fr)\/)?problems\/([a-z0-9-]+)\/talk$/;

export type GraphqlClient = <T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
) => Promise<T>;

export interface DiscussionMetadata {
  discussionId: string;
  url: string;
  title: string;
  commentCount: number;
  lastActivityAt: string;
  categoryName: string;
}

export interface RecentActivityItem {
  discussionId: string;
  url: string;
  title: string;
  commentCount: number;
  updatedAt: string;
  latestCommentAt: string | null;
}

export interface GraphqlClientOptions {
  noCache?: boolean;
  cacheDir?: string;
  clientFactory?: () => GraphqlClient;
  repoOwner?: string;
  repoName?: string;
}

const SEARCH_BY_PATH_QUERY = `query SearchDiscussionByPath($searchQuery: String!) {
  search(type: DISCUSSION, query: $searchQuery, first: 1) {
    nodes {
      ... on Discussion {
        id
        url
        title
        comments { totalCount }
        updatedAt
        category { name }
      }
    }
  }
}`;

const RECENT_DISCUSSIONS_QUERY = `query RecentDiscussions($owner: String!, $repo: String!, $first: Int!) {
  repository(owner: $owner, name: $repo) {
    discussions(first: $first, orderBy: { field: UPDATED_AT, direction: DESC }) {
      nodes {
        id
        url
        title
        updatedAt
        comments(first: 1, orderBy: { field: CREATED_AT, direction: DESC }) {
          totalCount
          nodes { createdAt }
        }
      }
    }
  }
}`;

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function cacheKeyFor(document: string, variables: Record<string, unknown>): string {
  return sha256(`${document}\n---\n${JSON.stringify(variables)}`);
}

async function readCache<T>(cacheDir: string, key: string): Promise<T | null> {
  try {
    const buf = await readFile(path.join(cacheDir, `${key}.json`), "utf-8");
    return JSON.parse(buf) as T;
  } catch {
    return null;
  }
}

async function writeCache<T>(cacheDir: string, key: string, payload: T): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(path.join(cacheDir, `${key}.json`), JSON.stringify(payload, null, 2), "utf-8");
}

function defaultClientFactory(): GraphqlClient {
  const token = process.env["GITHUB_TOKEN"];
  if (!token) {
    throw new Error(
      "GITHUB_TOKEN is not set. Phase-6 Discussions queries require it (ADR-0010 D-D). " +
        "Pass a clientFactory in options for tests, or set the env var. Aborting.",
    );
  }
  const authed = graphql.defaults({
    headers: { authorization: `bearer ${token}` },
  });
  return (<T>(query: string, variables?: Record<string, unknown>) =>
    authed<T>(query, variables)) as GraphqlClient;
}

export async function queryGitHub<T>(
  document: string,
  variables: Record<string, unknown>,
  options: GraphqlClientOptions = {},
): Promise<T> {
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const key = cacheKeyFor(document, variables);

  if (!options.noCache) {
    const cached = await readCache<T>(cacheDir, key);
    if (cached) return cached;
  }

  const client = options.clientFactory ? options.clientFactory() : defaultClientFactory();
  const data = await client<T>(document, variables);
  await writeCache(cacheDir, key, data);
  return data;
}

interface SearchByPathResponse {
  search: {
    nodes: Array<{
      id?: string;
      url?: string;
      title?: string;
      comments?: { totalCount?: number };
      updatedAt?: string;
      category?: { name?: string };
    }>;
  };
}

/**
 * Env-safe wrapper around `getDiscussionByPath`. Catches errors (missing
 * `GITHUB_TOKEN`, network failures, GraphQL errors) and returns null.
 *
 * Use this from build-time SSG callers (Units 6.5 / 6.6) that need to
 * proceed gracefully when the operational env is missing — the page
 * builds, the badge simply doesn't appear. Distinguishing "no thread
 * yet" from "fetch failed" is intentionally lost here; both surface as
 * "no badge."
 */
export async function tryGetDiscussionByPath(
  pathname: string,
  options: GraphqlClientOptions = {},
): Promise<DiscussionMetadata | null> {
  try {
    return await getDiscussionByPath(pathname, options);
  } catch {
    return null;
  }
}

export async function getDiscussionByPath(
  pathname: string,
  options: GraphqlClientOptions = {},
): Promise<DiscussionMetadata | null> {
  const owner = options.repoOwner ?? DEFAULT_REPO_OWNER;
  const repo = options.repoName ?? DEFAULT_REPO_NAME;
  const searchQuery = `repo:${owner}/${repo} in:title "${pathname}"`;

  const data = await queryGitHub<SearchByPathResponse>(
    SEARCH_BY_PATH_QUERY,
    { searchQuery },
    options,
  );

  const node = data.search.nodes[0];
  if (!node || !node.id || !node.url || !node.title || !node.updatedAt) return null;

  return {
    discussionId: node.id,
    url: node.url,
    title: node.title,
    commentCount: node.comments?.totalCount ?? 0,
    lastActivityAt: node.updatedAt,
    categoryName: node.category?.name ?? "",
  };
}

interface RecentDiscussionsResponse {
  repository: {
    discussions: {
      nodes: Array<{
        id?: string;
        url?: string;
        title?: string;
        updatedAt?: string;
        comments?: {
          totalCount?: number;
          nodes?: Array<{ createdAt?: string }>;
        };
      }>;
    };
  };
}

/**
 * Env-safe wrapper around `getRecentDiscussionActivity`. Catches errors
 * (missing `GITHUB_TOKEN`, network failures, GraphQL errors) and returns
 * an empty array. Same shape as `tryGetDiscussionByPath` — lets build-time
 * SSG callers proceed gracefully when the operational env is missing.
 */
export async function tryGetRecentDiscussionActivity(
  since: Date,
  options: GraphqlClientOptions = {},
): Promise<RecentActivityItem[]> {
  try {
    return await getRecentDiscussionActivity(since, options);
  } catch {
    return [];
  }
}

export async function getRecentDiscussionActivity(
  since: Date,
  options: GraphqlClientOptions = {},
): Promise<RecentActivityItem[]> {
  const owner = options.repoOwner ?? DEFAULT_REPO_OWNER;
  const repo = options.repoName ?? DEFAULT_REPO_NAME;
  const sinceIso = since.toISOString();

  const data = await queryGitHub<RecentDiscussionsResponse>(
    RECENT_DISCUSSIONS_QUERY,
    { owner, repo, first: RECENT_DISCUSSIONS_PAGE_SIZE },
    options,
  );

  const out: RecentActivityItem[] = [];
  for (const node of data.repository.discussions.nodes) {
    if (!node.id || !node.url || !node.title || !node.updatedAt) continue;
    if (node.updatedAt < sinceIso) continue;
    const latest = node.comments?.nodes?.[0]?.createdAt ?? null;
    out.push({
      discussionId: node.id,
      url: node.url,
      title: node.title,
      commentCount: node.comments?.totalCount ?? 0,
      updatedAt: node.updatedAt,
      latestCommentAt: latest,
    });
  }
  return out;
}

export const __testing = {
  sha256,
  cacheKeyFor,
  readCache,
  writeCache,
  defaultClientFactory,
  DEFAULT_CACHE_DIR,
  DEFAULT_REPO_OWNER,
  DEFAULT_REPO_NAME,
  SEARCH_BY_PATH_QUERY,
  RECENT_DISCUSSIONS_QUERY,
};
