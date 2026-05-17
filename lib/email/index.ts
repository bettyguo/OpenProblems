import { Resend } from "resend";

/**
 * Server-side email-sending helper per [ADR-0021](../../docs/adr/0021-subscriber-list-email.md).
 *
 * Wraps the Resend SDK behind a provider-isolated helper:
 *   - Switching providers Phase 31+ requires rewriting this file
 *     (single helper) not a multi-file rip-up. The `sendEmail`
 *     signature is provider-agnostic.
 *   - All Resend SDK imports stay inside this module.
 *   - Phase 30 ships verification + welcome emails only; digest-send
 *     template + scheduler deferred Phase 31+ per ADR-0021 D-F + D-H.
 *
 * Module-level state:
 *   - `resendClient` is lazily initialized on first call to avoid
 *     module-load failure when `RESEND_API_KEY` is unset (graceful
 *     degradation per ADR-0021 D-G; mirrors `safeAuth()` Phase-9
 *     pattern for OAuth-config-error tolerance). When the env var
 *     is missing, `sendEmail` returns a structured failure result
 *     so callers (subscribe form server action) can render an i18n
 *     `email.send_unavailable` error without crashing.
 *
 * Server-only: this module imports `resend` which is server-side
 * only. Never include in a `"use client"` boundary. Preserves the
 * Phase 9-29 First Load JS 103 kB invariant.
 */

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) return null;
  resendClient = new Resend(apiKey);
  return resendClient;
}

export interface SendEmailOptions {
  /**
   * Override the default `from` address. Defaults to `EMAIL_FROM`
   * env var (canonical RFC 5322 format with display name + address,
   * e.g. `"LLM OpenProblems <digest@example.com>"`).
   */
  from?: string;
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: "missing_api_key" | "missing_from" | "provider_error"; message?: string };

/**
 * Send a transactional email via Resend.
 *
 * @param to Recipient email address (canonical lowercase form;
 *   caller normalizes).
 * @param subject Email subject line.
 * @param html Rendered HTML email body (sanitized by the template
 *   author; no user-input echo per ADR-0021 §15.5 reviewer-mode
 *   mindset (f) email-content XSS guard).
 * @param options Optional sender override.
 * @returns Structured result. On success, includes the Resend
 *   message id for log / audit purposes. On failure, includes a
 *   structured error code suitable for i18n key lookup.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options: SendEmailOptions = {},
): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    return { ok: false, error: "missing_api_key" };
  }
  const from = options.from ?? process.env["EMAIL_FROM"];
  if (!from) {
    return { ok: false, error: "missing_from" };
  }
  try {
    const result = await client.emails.send({ from, to, subject, html });
    if (result.error) {
      return { ok: false, error: "provider_error", message: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? "" };
  } catch (err) {
    return {
      ok: false,
      error: "provider_error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Test-only reset hook for the lazily-initialized Resend client.
 *
 * Vitest tests stub `RESEND_API_KEY` per-suite; this helper clears
 * the cached client so subsequent calls re-read the env var.
 *
 * Not exported via a "test-only" runtime convention because Phase
 * 30 has no test/index runtime split; callers in production code
 * should not invoke this.
 */
export function __resetResendClientForTests(): void {
  resendClient = null;
}
