import { NextResponse } from "next/server";

/**
 * Phase 0 placeholder for read-only JSON API endpoints (MASTER_PROMPT §9
 * `/api/v1/*`). Returns 501 Not Implemented with a small body identifying
 * the endpoint. The canonical Phase 1 response envelope is OPEN_QUESTIONS
 * Q25; until that resolves, do not infer a contract from these stubs.
 */
export function stubJsonResponse(endpoint: string): NextResponse {
  return NextResponse.json(
    {
      endpoint,
      status: "not-implemented",
      phase: 0,
    },
    { status: 501 },
  );
}
