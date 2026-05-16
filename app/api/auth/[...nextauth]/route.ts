import { handlers } from "@/lib/auth";

/**
 * Auth.js v5 route handler — re-exports `handlers.GET` + `handlers.POST`
 * from `lib/auth`. Per [ADR-0012](../../../../docs/adr/0012-auth-provider.md)
 * D-D the sign-in flow is full-page redirect (`/api/auth/signin/github` →
 * github.com → callback → DB persist → original page).
 *
 * Next.js App Router route files restrict allowed exports to a fixed set
 * (`GET`, `POST`, `dynamic`, etc.); destructuring + re-exporting `GET` +
 * `POST` is the canonical Auth.js v5 pattern.
 */
export const { GET, POST } = handlers;
