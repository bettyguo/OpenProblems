import { AuthControl } from "@/components/auth-control";
import { LocaleToggle } from "@/components/locale-toggle";
import { SearchTrigger } from "@/components/search-trigger";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth";
import { getUserMetadataById } from "@/lib/auth/login";
import { Link } from "@/lib/i18n/navigation";
import { getSearchIndex } from "@/lib/search/build-index";
import { getTranslations } from "next-intl/server";

const PROFILE_LINK_LOGIN_TRUNCATE = 12;

/**
 * Defensive `auth()` caller — swallows any DB-read failure (e.g., when
 * `local.db` is unmigrated in CI / on a fresh clone) so SSG builds + tests
 * don't crash on missing auth infrastructure. Treats every failure as
 * "no session" (signed-out branch renders).
 *
 * Production runtime: `auth()` returns a valid `Session | null` from the
 * Drizzle-adapter session table; this wrapper is a no-op around success.
 */
async function safeAuth() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

/**
 * Defensive `getUserMetadataById` wrapper paralleling {@link safeAuth}
 * — guards against DB-read failure when looking up the signed-in
 * user's `githubLogin` + `displayName` for the Phase-14 "Your
 * profile" link (Unit 14.5 per
 * [ADR-0015](../../docs/adr/0015-per-user-privacy-model.md) D-F) +
 * the Phase-15 AuthControl pill display-name fallback chain
 * (Unit 15.5 per
 * [ADR-0016](../../docs/adr/0016-user-editable-profile-fields.md) D-E).
 *
 * Returns `null` on any failure OR when the user row is missing
 * (Phase-9 retrofit edge — users who signed in before Unit 9.6's
 * `events.linkAccount` callback). The SiteHeader hides the profile
 * link when `githubLogin` is null; AuthControl falls back through
 * the chain when `displayName` is null.
 */
async function safeUserMetadata(
  userId: string,
): Promise<{ githubLogin: string | null; displayName: string | null } | null> {
  try {
    return await getUserMetadataById(userId);
  } catch {
    return null;
  }
}

export async function SiteHeader() {
  const index = getSearchIndex();
  const session = await safeAuth();
  const meta = session?.user?.id ? await safeUserMetadata(session.user.id) : null;
  const githubLogin = meta?.githubLogin ?? null;
  const displayName = meta?.displayName ?? null;
  const tPP = await getTranslations("public_profile");
  return (
    <header className="border-border bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
        <Link
          href="/"
          className="text-foreground hover:text-accent font-serif text-base font-semibold tracking-tight"
        >
          LLM OpenProblems
        </Link>
        <nav
          aria-label="Primary"
          className="text-muted-foreground ml-4 hidden gap-4 text-xs sm:flex"
        >
          <Link
            href="/domains"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Domains
          </Link>
          <Link
            href="/problems"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Problems
          </Link>
          <Link
            href="/methodology"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Methodology
          </Link>
          <Link
            href="/trending"
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            Trending
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {githubLogin && (
            <Link
              href={`/u/${githubLogin}`}
              aria-label={tPP("aria_label", { login: githubLogin })}
              title={tPP("aria_label", { login: githubLogin })}
              className="text-muted-foreground hover:text-foreground hidden items-center gap-1.5 font-mono text-xs underline-offset-2 hover:underline sm:inline-flex"
            >
              {session?.user?.image && (
                <img
                  src={session.user.image}
                  alt=""
                  width={16}
                  height={16}
                  className="size-4 shrink-0 rounded-full"
                  loading="lazy"
                />
              )}
              <span>
                @
                {githubLogin.length > PROFILE_LINK_LOGIN_TRUNCATE
                  ? `${githubLogin.slice(0, PROFILE_LINK_LOGIN_TRUNCATE)}…`
                  : githubLogin}
              </span>
            </Link>
          )}
          <SearchTrigger index={index} />
          <LocaleToggle />
          <ThemeToggle />
          <AuthControl session={session} displayName={displayName} />
        </div>
      </div>
    </header>
  );
}
