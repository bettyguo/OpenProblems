import type { Session } from "next-auth";
import { getTranslations } from "next-intl/server";

import { signIn, signOut } from "@/lib/auth";
import { PROVIDER_IDS, type ProviderId } from "@/lib/auth/link-account";
import { cn } from "@/lib/utils";

interface AuthControlProps {
  session: Session | null;
  /**
   * User-controlled display-name override per
   * [ADR-0016](../../docs/adr/0016-user-editable-profile-fields.md) D-E.
   * Takes precedence over `session.user.name` (GitHub-derived) on the
   * signed-in pill. Null when the user has not set one (or on Phase-9
   * retrofit edge). Caller (SiteHeader) fetches via `getUserMetadataById`.
   */
  displayName?: string | null;
  className?: string;
}

/**
 * Sign-in / sign-out control for the site header. Per
 * [ADR-0012 D-D + ADR-0020 D-F](../../docs/adr/0020-multi-provider-oauth.md)
 * the sign-in flow is full-page redirect (no modal) **per provider**;
 * each `<form>` server-action wrapper posts to `/api/auth/signin/<provider>`
 * (signed-out branch) or `/api/auth/signout` (signed-in branch).
 *
 * Phase 28 extends Phase-9's single-button "Sign in" into per-provider
 * buttons (one per entry in {@link PROVIDER_IDS}). Stacked vertically
 * on mobile; side-by-side at `sm:` breakpoint. The signed-out flex
 * container keeps the row compact in the header on `sm:`+ while
 * preserving a tap-friendly stack on phones.
 *
 * Signed-in state UNCHANGED Phase 28: shows the display name pill +
 * single sign-out button. Multi-provider does NOT change sign-out
 * (Auth.js's `signOut` is provider-agnostic).
 *
 * Display-name fallback chain per ADR-0016 D-E (extends Phase-10's
 * original `name → email` chain):
 * `displayName → session.user.name → session.user.email → translated fallback`.
 * Email surfaces only in the user's own pill (not public; ADR-0015 D-A
 * invariant preserved — email never reaches `/u/{handle}`).
 *
 * Per Q54 + Q73 operational gates: each provider's OAuth app may be
 * unregistered in dev / CI; in that case the sign-in flow surfaces an
 * Auth.js configuration error page for the affected provider. SiteHeader's
 * `safeAuth()` catches any DB-read failure and passes `session = null`
 * here, so the signed-out branch always renders (degraded but functional;
 * the other provider's button still works if its env is set).
 */
export async function AuthControl({ session, displayName, className }: AuthControlProps) {
  const t = await getTranslations("auth");

  if (session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
        className={cn("inline-flex items-center gap-2", className)}
      >
        <span
          aria-hidden
          className="text-muted-foreground bg-muted hidden rounded-full px-2 py-0.5 font-mono text-xs sm:inline"
        >
          {displayName ?? session.user.name ?? session.user.email ?? t("signed_in_fallback")}
        </span>
        <button
          type="submit"
          className={cn(
            "border-border bg-background text-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
            "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            "transition-colors",
          )}
        >
          {t("sign_out")}
        </button>
      </form>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("sign_in")}
      className={cn("inline-flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2", className)}
    >
      {PROVIDER_IDS.map((provider) => (
        <ProviderSignInForm key={provider} provider={provider} label={providerLabel(t, provider)} />
      ))}
    </div>
  );
}

function providerLabel(
  t: Awaited<ReturnType<typeof getTranslations<"auth">>>,
  provider: ProviderId,
): string {
  switch (provider) {
    case "github":
      return t("sign_in_with_github");
    case "google":
      return t("sign_in_with_google");
  }
}

interface ProviderSignInFormProps {
  provider: ProviderId;
  label: string;
}

/**
 * Per-provider sign-in form. Wraps `signIn(provider, { redirectTo: "/" })`
 * in a server action that POSTs to NextAuth's `/api/auth/signin/<provider>`
 * route per ADR-0012 D-D + ADR-0020 D-F redirect-to-provider flow.
 */
function ProviderSignInForm({ provider, label }: ProviderSignInFormProps) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn(provider, { redirectTo: "/" });
      }}
      className="inline-flex"
    >
      <button
        type="submit"
        className={cn(
          "border-border bg-background text-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
          "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "transition-colors",
        )}
      >
        {label}
      </button>
    </form>
  );
}
