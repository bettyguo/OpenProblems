import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

/**
 * Drizzle DB client — single source of truth for the project's USER-STATE
 * data layer ([ADR-0013](../../docs/adr/0013-db-choice.md)).
 *
 * Connection precedence:
 *   1. `TURSO_DATABASE_URL` (production / preview) — Turso edge replica.
 *   2. Fallback `file:./local.db` — local dev SQLite file (gitignored).
 *
 * The auth token is only required for `libsql://` connections (Turso);
 * `file:` connections need none.
 *
 * Per ADR-0004: this DB stores USER-STATE only (sessions, users, watchlist,
 * future preferences). Content stays file-first under `content/`.
 */

const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient(authToken ? { url, authToken } : { url });

export const db = drizzle(client, { schema });
export { schema };
