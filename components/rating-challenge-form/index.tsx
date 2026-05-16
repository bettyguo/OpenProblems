import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { problems } from "#site/content";

import { auth } from "@/lib/auth";
import {
  DIMENSIONS,
  RATIONALE_MAX,
  RATIONALE_MIN,
  isValidDimension,
  submitChallenge,
  validateProposedValue,
  validateRationale,
} from "@/lib/rating-challenges";
import { cn } from "@/lib/utils";

/**
 * Inline rating-challenge submission form (Unit 11.3). Lives on the
 * problem detail page (`/[locale]/problems/[slug]`) as a `<details>`
 * collapsible (default-closed; opens automatically when an error
 * round-trip lands the user back on the page with `?challenge_error=...`).
 *
 * Pure server-rendered: zero client JS. HTML5 `required` + `minLength`
 * + `maxLength` cover the obvious validation cases browser-side; the
 * server action calls into the same `validate*` helpers the API route
 * uses. On validation failure the action `redirect()`s back to the
 * problem page with `?challenge_error_field=...&challenge_error_message=...`
 * so the form re-renders with the error visible. Form state is LOST on
 * the redirect — accepted MVP tradeoff per Unit 11.0 D-8 to keep First
 * Load JS at 103 kB UNCHANGED.
 *
 * Signed-out users see a sign-in CTA instead of the form. Signed-in
 * users see the `<details>` summary; expanding reveals the form.
 */

export interface ChallengeError {
  field: string;
  message: string;
}

interface RatingChallengeFormProps {
  slug: string;
  locale: string;
  /** Set when the user just came back from a server-action redirect after a successful submission. */
  submitted?: boolean;
  /** Set when the user just came back from a server-action redirect after a validation failure. */
  error?: ChallengeError;
  className?: string;
}

function knownSlug(slug: string): boolean {
  return problems.some((p) => p.slug === slug);
}

async function safeAuth() {
  try {
    return await auth();
  } catch {
    return null;
  }
}

async function submitAction(formData: FormData): Promise<void> {
  "use server";
  const slug = String(formData.get("slug") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const dimension = String(formData.get("dimension") ?? "");
  const proposedValue = String(formData.get("proposedValue") ?? "");
  const rationale = String(formData.get("rationale") ?? "");

  const failHref = (field: string, message: string): string => {
    const params = new URLSearchParams({
      challenge_error_field: field,
      challenge_error_message: message,
    });
    return `/${locale}/problems/${slug}?${params.toString()}#rating-challenge`;
  };

  if (!slug || !knownSlug(slug)) {
    return;
  }
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/api/auth/signin/github?callbackUrl=/${locale}/problems/${slug}`);
  }
  if (!isValidDimension(dimension)) {
    redirect(failHref("dimension", "Pick a dimension to challenge."));
  }
  const pvError = validateProposedValue(dimension, proposedValue);
  if (pvError) {
    redirect(failHref("proposedValue", pvError));
  }
  const ratError = validateRationale(rationale);
  if (ratError) {
    redirect(failHref("rationale", ratError));
  }

  await submitChallenge({
    userId: session.user.id,
    problemSlug: slug,
    dimension,
    proposedValue,
    rationale,
  });
  revalidatePath("/[locale]/problems/[slug]", "page");
  redirect(`/${locale}/problems/${slug}?challenge_submitted=1#rating-challenge`);
}

const fieldBase =
  "bg-background border-border rounded border px-2 py-1.5 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none";

export async function RatingChallengeForm({
  slug,
  locale,
  submitted,
  error,
  className,
}: RatingChallengeFormProps) {
  const t = await getTranslations("rating_challenge");
  const session = await safeAuth();

  return (
    <section
      id="rating-challenge"
      aria-labelledby="rating-challenge-heading"
      className={cn("mt-12", className)}
    >
      <h2 id="rating-challenge-heading" className="font-serif text-xl font-semibold tracking-tight">
        {t("heading")}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">{t("description")}</p>

      {submitted && (
        <p
          role="status"
          className="border-accent bg-accent/10 text-accent mt-4 rounded border px-3 py-2 text-sm"
        >
          {t("submitted_banner")}
        </p>
      )}

      {!session?.user?.id ? (
        <p className="mt-4 text-sm">
          <a
            href={`/api/auth/signin/github?callbackUrl=/${locale}/problems/${slug}`}
            className="text-accent underline-offset-2 hover:underline"
          >
            {t("sign_in_prompt")}
          </a>
        </p>
      ) : (
        <details open={Boolean(error)} className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">{t("open_form")}</summary>
          <form action={submitAction} className="border-border mt-4 grid gap-4 rounded border p-4">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="locale" value={locale} />

            {error && (
              <p
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive rounded border px-3 py-2 text-sm"
              >
                <strong className="font-medium">{t(`field_${error.field}`)}:</strong>{" "}
                {error.message}
              </p>
            )}

            <label className="grid gap-1 text-sm">
              <span className="font-medium">{t("dimension_label")}</span>
              <select name="dimension" required className={fieldBase}>
                <option value="">{t("dimension_placeholder")}</option>
                {DIMENSIONS.map((d) => (
                  <option key={d} value={d}>
                    {t(`dim_${d}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">{t("proposed_value_label")}</span>
              <input
                type="text"
                name="proposedValue"
                required
                placeholder={t("proposed_value_placeholder")}
                className={fieldBase}
              />
              <span className="text-muted-foreground text-xs">{t("proposed_value_hint")}</span>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">{t("rationale_label")}</span>
              <textarea
                name="rationale"
                required
                minLength={RATIONALE_MIN}
                maxLength={RATIONALE_MAX}
                rows={5}
                placeholder={t("rationale_placeholder")}
                className={cn(fieldBase, "font-sans")}
              />
              <span className="text-muted-foreground text-xs">
                {t("rationale_hint", { min: RATIONALE_MIN, max: RATIONALE_MAX })}
              </span>
            </label>

            <button
              type="submit"
              className="border-accent bg-accent text-accent-foreground hover:bg-accent/90 inline-flex h-9 items-center justify-center self-start rounded-md border px-3 text-xs font-medium transition-colors"
            >
              {t("submit")}
            </button>
          </form>
        </details>
      )}
    </section>
  );
}
