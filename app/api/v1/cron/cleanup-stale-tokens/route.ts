import { and, eq, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { checkCronAuth } from "@/lib/cron/digest-send";
import {
  runCleanupStaleTokens,
  type CleanupStaleTokensDeps,
} from "@/lib/cron/cleanup-stale-tokens";

/**
 * Stale verification-token cleanup cron endpoint per
 * [Phase-32 prep doc](../../../../../docs/thinking/32.0-phase-32-prep.md)
 * D-3 (direct instantiation of
 * [ADR-0022](../../../../../docs/adr/0022-weekly-digest-scheduler.md)
 * D-A/D-D/D-F — no new ADR Phase 32).
 *
 * Triggered by Vercel Cron per `vercel.json` `crons` config (Tuesday
 * 00:00 UTC weekly per Phase-32 prep D-9 lean — offset from Monday
 * digest send). Authenticated via the same belt-and-suspenders
 * `CRON_SECRET` bearer-token + `vercel-cron` header as the digest-send
 * cron — single shared secret across both endpoints (per Phase-32 prep
 * D-5; reuses `checkCronAuth` helper Phase 31 extracted exactly for
 * this multi-cron reuse case).
 *
 * Thin route shim — all logic lives in
 * [`lib/cron/cleanup-stale-tokens.ts`](../../../../../lib/cron/cleanup-stale-tokens.ts).
 * The route's job is to (a) check auth + return 401 on failure, (b)
 * adapt the production Drizzle DELETE into the
 * `CleanupStaleTokensDeps` shape, (c) return the structured
 * `CleanupStaleTokensResult` JSON for Vercel dashboard observability.
 *
 * **POST only** (per Vercel Cron's HTTP method default). GET returns
 * 405.
 */

export async function POST(req: Request): Promise<Response> {
  const auth = checkCronAuth(
    {
      authorizationHeader: req.headers.get("authorization"),
      vercelCronHeader: req.headers.get("vercel-cron"),
    },
    process.env["CRON_SECRET"],
  );
  if (!auth.ok) {
    return Response.json({ error: "unauthorized", reason: auth.reason }, { status: 401 });
  }

  const deps: CleanupStaleTokensDeps = {
    deleteStalePendingTokens: async (cutoff) => {
      const deleted = await db
        .delete(subscribers)
        .where(
          and(
            eq(subscribers.status, "pending_verification"),
            lt(subscribers.verificationTokenExpiresAt, cutoff),
          ),
        )
        .returning({ id: subscribers.id });
      return deleted.length;
    },
    logError: (msg, ctx) => {
      // Vercel dashboard captures stderr; structured-log shape per ADR-0022 D-F.

      console.error(`[cleanup-stale-tokens] ${msg}`, ctx);
    },
    now: () => new Date(),
  };

  const result = await runCleanupStaleTokens(deps);
  return Response.json(result, { status: 200 });
}

export async function GET(): Promise<Response> {
  return Response.json({ error: "method_not_allowed" }, { status: 405 });
}
