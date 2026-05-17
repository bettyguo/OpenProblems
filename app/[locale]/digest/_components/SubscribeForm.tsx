"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

/**
 * Subscribe form (Unit 30.3) per
 * [ADR-0021](../../../../docs/adr/0021-subscriber-list-email.md) D-D
 * verification-flow contract.
 *
 * Client-side form posting to `/api/v1/subscribe` (the POST endpoint).
 * Renders inline status messages via the new `email.*` i18n keys.
 *
 * **`"use client"` boundary justified**: form state (email + selected
 * domains + submission status) is interactive; SSR-only would require
 * a full page reload on submit. The boundary is local to this
 * component — the parent `/digest/page.tsx` remains a server component
 * and the markdown + page-level state stays SSR. **First Load JS
 * shared chunk impact**: minimal (~1-2 kB delta from a focused client
 * component; React + form state are tree-shaken from the existing
 * shared chunk per Next.js' splitting).
 *
 * No client-side dependency on Resend SDK — the form only knows the
 * `/api/v1/subscribe` endpoint contract.
 */

type SubmitStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "verification_sent"; emailUnavailable?: boolean }
  | { kind: "already_subscribed" }
  | { kind: "error"; messageKey: string };

interface SubscribeFormProps {
  domains: readonly { id: string; title: string }[];
}

export function SubscribeForm({ domains }: SubscribeFormProps) {
  const t = useTranslations("email");
  const [email, setEmail] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(
    () => new Set(domains[0] ? [domains[0].id] : []),
  );
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  function toggleDomain(id: string) {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedDomains.size === 0) {
      setStatus({ kind: "error", messageKey: "select_at_least_one_domain" });
      return;
    }
    setStatus({ kind: "submitting" });
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/subscribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, domains: Array.from(selectedDomains) }),
        });
        if (res.status === 400) {
          setStatus({ kind: "error", messageKey: "invalid_input" });
          return;
        }
        if (!res.ok) {
          setStatus({ kind: "error", messageKey: "send_unavailable" });
          return;
        }
        const body: { status?: string; emailUnavailable?: boolean } = await res.json();
        if (body.status === "already_subscribed") {
          setStatus({ kind: "already_subscribed" });
        } else if (body.status === "verification_sent") {
          setStatus(
            body.emailUnavailable
              ? { kind: "verification_sent", emailUnavailable: true }
              : { kind: "verification_sent" },
          );
        } else {
          setStatus({ kind: "error", messageKey: "send_unavailable" });
        }
      } catch {
        setStatus({ kind: "error", messageKey: "send_unavailable" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="border-border mt-8 rounded border p-4">
      <h2 className="font-serif text-lg font-semibold">{t("subscribe_heading")}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{t("subscribe_description")}</p>
      <div className="mt-4">
        <label htmlFor="subscribe-email" className="text-sm font-medium">
          {t("email_label")}
        </label>
        <input
          id="subscribe-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-border mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-medium">{t("domains_label")}</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {domains.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={selectedDomains.has(d.id)}
                onChange={() => toggleDomain(d.id)}
              />
              {d.title}
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="submit"
        disabled={isPending || status.kind === "submitting"}
        className="bg-foreground text-background mt-4 rounded px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {status.kind === "submitting" ? t("submitting") : t("subscribe")}
      </button>
      {status.kind === "verification_sent" ? (
        <p
          role="status"
          className="mt-3 rounded bg-[var(--color-chart-2)]/15 p-3 text-sm text-[var(--color-chart-2)]"
        >
          {status.emailUnavailable ? t("send_unavailable") : t("verify_sent")}
        </p>
      ) : null}
      {status.kind === "already_subscribed" ? (
        <p role="status" className="text-muted-foreground bg-muted mt-3 rounded p-3 text-sm">
          {t("already_subscribed")}
        </p>
      ) : null}
      {status.kind === "error" ? (
        <p
          role="alert"
          className="mt-3 rounded bg-[var(--color-chart-3)]/15 p-3 text-sm text-[var(--color-chart-3)]"
        >
          {status.messageKey === "select_at_least_one_domain"
            ? t("select_at_least_one_domain")
            : status.messageKey === "invalid_input"
              ? t("invalid_input")
              : t("send_unavailable")}
        </p>
      ) : null}
    </form>
  );
}
