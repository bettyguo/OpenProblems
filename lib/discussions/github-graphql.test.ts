import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  __testing,
  getDiscussionByPath,
  getRecentDiscussionActivity,
  queryGitHub,
  type GraphqlClient,
} from "@/lib/discussions/github-graphql";

const { sha256, cacheKeyFor, readCache, writeCache, defaultClientFactory } = __testing;

let tmpDir: string;
let originalToken: string | undefined;

beforeEach(async () => {
  tmpDir = await mkdtemp(path.join(os.tmpdir(), "github-graphql-test-"));
  originalToken = process.env["GITHUB_TOKEN"];
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
  if (originalToken === undefined) {
    delete process.env["GITHUB_TOKEN"];
  } else {
    process.env["GITHUB_TOKEN"] = originalToken;
  }
});

describe("sha256", () => {
  it("produces a stable 64-char hex digest", () => {
    const a = sha256("hello");
    expect(a).toHaveLength(64);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(sha256("hello")).toBe(a);
  });

  it("differs for different inputs", () => {
    expect(sha256("a")).not.toBe(sha256("b"));
  });
});

describe("cacheKeyFor", () => {
  it("is stable for identical (document, variables)", () => {
    const a = cacheKeyFor("query Q { x }", { foo: "bar" });
    const b = cacheKeyFor("query Q { x }", { foo: "bar" });
    expect(a).toBe(b);
  });

  it("differs when variables differ", () => {
    const a = cacheKeyFor("query Q { x }", { foo: "bar" });
    const b = cacheKeyFor("query Q { x }", { foo: "baz" });
    expect(a).not.toBe(b);
  });

  it("differs when document differs", () => {
    const a = cacheKeyFor("query A { x }", { foo: "bar" });
    const b = cacheKeyFor("query B { x }", { foo: "bar" });
    expect(a).not.toBe(b);
  });
});

describe("readCache / writeCache", () => {
  it("round-trips a JSON payload", async () => {
    await writeCache(tmpDir, "abc", { hello: "world" });
    const got = await readCache<{ hello: string }>(tmpDir, "abc");
    expect(got).toEqual({ hello: "world" });
  });

  it("returns null when the cache file is missing", async () => {
    const got = await readCache<unknown>(tmpDir, "missing-key");
    expect(got).toBeNull();
  });

  it("returns null when the cache file is malformed JSON", async () => {
    await mkdir(tmpDir, { recursive: true });
    await writeFile(path.join(tmpDir, "bad.json"), "not json", "utf-8");
    const got = await readCache<unknown>(tmpDir, "bad");
    expect(got).toBeNull();
  });
});

describe("queryGitHub", () => {
  it("returns cached payload on cache hit without invoking the client", async () => {
    const key = cacheKeyFor("query X", { v: 1 });
    await writeCache(tmpDir, key, { cached: true });

    let invoked = 0;
    const client: GraphqlClient = async () => {
      invoked += 1;
      return { cached: false } as never;
    };

    const got = await queryGitHub<{ cached: boolean }>(
      "query X",
      { v: 1 },
      { cacheDir: tmpDir, clientFactory: () => client },
    );

    expect(got).toEqual({ cached: true });
    expect(invoked).toBe(0);
  });

  it("calls the client + writes cache on cache miss", async () => {
    let invoked = 0;
    const client: GraphqlClient = async () => {
      invoked += 1;
      return { from: "network" } as never;
    };

    const got = await queryGitHub<{ from: string }>(
      "query X",
      { v: 2 },
      { cacheDir: tmpDir, clientFactory: () => client },
    );

    expect(got).toEqual({ from: "network" });
    expect(invoked).toBe(1);

    // Second call: served from cache without re-invoking.
    const again = await queryGitHub<{ from: string }>(
      "query X",
      { v: 2 },
      { cacheDir: tmpDir, clientFactory: () => client },
    );
    expect(again).toEqual({ from: "network" });
    expect(invoked).toBe(1);
  });

  it("skips cache read but still writes when noCache is true", async () => {
    const key = cacheKeyFor("query X", { v: 3 });
    await writeCache(tmpDir, key, { stale: true });

    const client: GraphqlClient = async () => ({ fresh: true }) as never;
    const got = await queryGitHub<{ fresh: boolean }>(
      "query X",
      { v: 3 },
      { cacheDir: tmpDir, clientFactory: () => client, noCache: true },
    );
    expect(got).toEqual({ fresh: true });

    // The cache file was overwritten with the fresh payload.
    const cached = await readFile(path.join(tmpDir, `${key}.json`), "utf-8");
    expect(JSON.parse(cached)).toEqual({ fresh: true });
  });
});

describe("defaultClientFactory", () => {
  it("throws a clear ADR-0010-citing error when GITHUB_TOKEN is unset", () => {
    delete process.env["GITHUB_TOKEN"];
    expect(() => defaultClientFactory()).toThrow(/GITHUB_TOKEN is not set/);
    expect(() => defaultClientFactory()).toThrow(/ADR-0010 D-D/);
  });

  it("returns a callable client when GITHUB_TOKEN is set", () => {
    process.env["GITHUB_TOKEN"] = "test-token-xxx";
    const client = defaultClientFactory();
    expect(typeof client).toBe("function");
  });
});

describe("getDiscussionByPath", () => {
  it("returns the discussion metadata when search returns a node", async () => {
    const client: GraphqlClient = async () =>
      ({
        search: {
          nodes: [
            {
              id: "D_kwDOABC",
              url: "https://github.com/bettyguo/OpenProblems/discussions/42",
              title: "/problems/hallucination-reduction/talk",
              comments: { totalCount: 5 },
              updatedAt: "2026-05-16T12:00:00Z",
              category: { name: "talk" },
            },
          ],
        },
      }) as never;

    const got = await getDiscussionByPath("/problems/hallucination-reduction/talk", {
      cacheDir: tmpDir,
      clientFactory: () => client,
    });

    expect(got).toEqual({
      discussionId: "D_kwDOABC",
      url: "https://github.com/bettyguo/OpenProblems/discussions/42",
      title: "/problems/hallucination-reduction/talk",
      commentCount: 5,
      lastActivityAt: "2026-05-16T12:00:00Z",
      categoryName: "talk",
    });
  });

  it("returns null when search returns 0 nodes (no discussion yet)", async () => {
    const client: GraphqlClient = async () => ({ search: { nodes: [] } }) as never;

    const got = await getDiscussionByPath("/problems/unstarted/talk", {
      cacheDir: tmpDir,
      clientFactory: () => client,
    });

    expect(got).toBeNull();
  });

  it("passes a repo-scoped pathname search query to the client", async () => {
    let capturedVariables: Record<string, unknown> | undefined;
    const client: GraphqlClient = async (_query, vars) => {
      capturedVariables = vars;
      return { search: { nodes: [] } } as never;
    };

    await getDiscussionByPath("/problems/x/talk", {
      cacheDir: tmpDir,
      clientFactory: () => client,
      repoOwner: "owner-x",
      repoName: "repo-y",
    });

    expect(capturedVariables).toEqual({
      searchQuery: 'repo:owner-x/repo-y in:title "/problems/x/talk"',
    });
  });
});

describe("getRecentDiscussionActivity", () => {
  it("filters out discussions older than `since`", async () => {
    const client: GraphqlClient = async () =>
      ({
        repository: {
          discussions: {
            nodes: [
              {
                id: "D_new",
                url: "https://x/1",
                title: "new",
                updatedAt: "2026-05-16T10:00:00Z",
                comments: { totalCount: 1, nodes: [{ createdAt: "2026-05-16T09:00:00Z" }] },
              },
              {
                id: "D_old",
                url: "https://x/2",
                title: "old",
                updatedAt: "2026-05-08T10:00:00Z",
                comments: { totalCount: 0, nodes: [] },
              },
            ],
          },
        },
      }) as never;

    const got = await getRecentDiscussionActivity(new Date("2026-05-10T00:00:00Z"), {
      cacheDir: tmpDir,
      clientFactory: () => client,
    });

    expect(got).toHaveLength(1);
    expect(got[0]?.discussionId).toBe("D_new");
    expect(got[0]?.latestCommentAt).toBe("2026-05-16T09:00:00Z");
  });

  it("returns latestCommentAt as null when a discussion has 0 comments", async () => {
    const client: GraphqlClient = async () =>
      ({
        repository: {
          discussions: {
            nodes: [
              {
                id: "D_empty",
                url: "https://x/3",
                title: "empty",
                updatedAt: "2026-05-16T10:00:00Z",
                comments: { totalCount: 0, nodes: [] },
              },
            ],
          },
        },
      }) as never;

    const got = await getRecentDiscussionActivity(new Date("2026-05-10T00:00:00Z"), {
      cacheDir: tmpDir,
      clientFactory: () => client,
    });

    expect(got).toHaveLength(1);
    expect(got[0]?.latestCommentAt).toBeNull();
    expect(got[0]?.commentCount).toBe(0);
  });
});
