import type { Session } from "next-auth";
import { getTranslations } from "next-intl/server";

import { signIn, signOut } from "@/lib/auth";
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
 * Sign-in / sign-out control for the site header. Per [ADR-0012 D-D] the
 * sign-in flow is full-page redirect (no modal); the `<form>` server-
 * action wrappers post to `/api/auth/signin/github` (signed-out branch)
 * or `/api/auth/signout` (signed-in branch).
 *
 * Renders a tiny 9-tall button that mirrors `ThemeToggle` + `LocaleToggle`
 * sizing. Signed-out state: outlined "Sign in" link. Signed-in state:
 * subtle pill showing the display name + a "Sign out" submit button.
 *
 * Display-name fallback chain per ADR-0016 D-E (extends Phase-10's
 * original `name → email` chain):
 * `displayName → session.user.name → session.user.email → translated fallback`.
 * Email surfaces only in the user's own pill (not public; ADR-0015 D-A
 * invariant preserved — email never reaches `/u/{handle}`).
 *
 * Per [Q54], the GitHub OAuth app may be unregistered in dev / CI; in
 * that case the sign-in flow surfaces an Auth.js configuration error
 * page. SiteHeader's `safeAuth()` catches any DB-read failure and
 * passes `session = null` here, so the signed-out branch always renders
 * (degraded but functional).
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
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/" });
      }}
      className={cn("inline-flex", className)}
    >
      <button
        type="submit"
        className={cn(
          "border-border bg-background text-foreground inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium",
          "hover:bg-muted focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
          "transition-colors",
        )}
      >
        {t("sign_in")}
      </button>
    </form>
  );
}
