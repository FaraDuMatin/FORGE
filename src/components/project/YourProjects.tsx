"use client";

import { useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  subscribeMyProjects,
  getMyProjectsSnapshot,
  getMyProjectsServerSnapshot,
  forgetMyProject,
} from "@/lib/myProjects";

// The projects this device remembers you maintain. Reads the localStorage store
// via useSyncExternalStore — SSR snapshot is empty so the first client render
// matches the server (no hydration mismatch), then it fills in. Hides itself
// when the list is empty.
export function YourProjects({ heading }: { heading: string }) {
  const locale = useLocale();
  const t = useTranslations("me");
  const items = useSyncExternalStore(subscribeMyProjects, getMyProjectsSnapshot, getMyProjectsServerSnapshot);

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{heading}</h2>
      <ul className="mt-3 space-y-2">
        {items.map((p) => (
          <li
            key={p.slug}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3 transition hover:border-emerald-400 dark:border-neutral-800"
          >
            <a href={`/${locale}/p/${p.slug}/manage?t=${p.token}`} className="min-w-0 flex-1 font-medium hover:underline">
              <span className="block truncate">{p.title}</span>
            </a>
            <button
              type="button"
              onClick={() => forgetMyProject(p.slug)}
              className="shrink-0 text-xs text-neutral-400 hover:text-red-600"
            >
              {t("remove")}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
