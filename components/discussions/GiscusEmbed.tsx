"use client";

import Giscus from "@giscus/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const GISCUS_REPO = "bettyguo/OpenProblems" as const;

/**
 * Map next-themes' `resolvedTheme` (string | undefined) to Giscus's binary
 * theme prop. Anything other than "dark" maps to "light"; pre-resolve
 * (undefined) defaults to "light" to match the project's default-light layout.
 */
export function mapResolvedThemeToGiscus(resolvedTheme: string | undefined): "dark" | "light" {
  return resolvedTheme === "dark" ? "dark" : "light";
}

/**
 * Client-only Giscus iframe wrapper for Phase-6 Discussions integration
 * (ADR-0010 D-A). The iframe loads lazily; auth-via-GitHub happens inside
 * the iframe (we never see the visitor's token, D-D).
 *
 * - Hydration-safe placeholder pre-mount (mirrors `components/theme-toggle`).
 * - Theme synced via `useTheme()` (D-11) — binary map: dark → "dark", else "light".
 * - `repoId` read from `NEXT_PUBLIC_GISCUS_REPO_ID` env (Next.js convention for
 *   build-time-baked client env vars). When unset, renders a curator-facing
 *   "embed unavailable" message that names the env var and links to giscus.app.
 *   The unset case is the HEAD state until Q47 (repo Discussions enablement)
 *   resolves.
 */
export function GiscusEmbed() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <p className="text-muted-foreground text-sm italic">Loading discussion…</p>;
  }

  const repoId = process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? "";
  if (!repoId) {
    return (
      <p className="text-muted-foreground text-sm italic">
        Discussion embed unavailable:{" "}
        <code className="font-mono text-xs">NEXT_PUBLIC_GISCUS_REPO_ID</code> is unset. See{" "}
        <a
          href="https://giscus.app"
          className="text-accent underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          giscus.app
        </a>{" "}
        to generate the repo ID for <code className="font-mono text-xs">{GISCUS_REPO}</code> after
        enabling Discussions, then set the env var at build time.
      </p>
    );
  }

  const giscusTheme = mapResolvedThemeToGiscus(resolvedTheme);

  return (
    <Giscus
      repo={GISCUS_REPO}
      repoId={repoId}
      mapping="pathname"
      strict="1"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="bottom"
      theme={giscusTheme}
      lang="en"
      loading="lazy"
    />
  );
}
