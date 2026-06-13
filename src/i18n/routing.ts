import { defineRouting } from "next-intl/routing";

// EN + FR from day one (Universality demo: a live language switch in front of
// judges). Adding a locale later = one entry here plus a messages file.
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
});
