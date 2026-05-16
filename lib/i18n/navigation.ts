import { createSharedPathnamesNavigation } from "next-intl/navigation";

import { locales } from "./routing";

export const { Link, useRouter, usePathname, redirect } = createSharedPathnamesNavigation({
  locales,
  localePrefix: "always",
});
