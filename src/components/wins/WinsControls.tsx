"use client";

import { useTranslations } from "next-intl";
import type { WinsSort } from "@/lib/wins";

// Presentational search + sort row for the win wall. Reports changes through
// callbacks; WinsClient debounces, fetches and keeps the URL in sync.
export function WinsControls({
  text,
  sort,
  onText,
  onSort,
}: {
  text: string;
  sort: WinsSort;
  onText: (value: string) => void;
  onSort: (value: WinsSort) => void;
}) {
  const t = useTranslations("wins");

  const inputBase =
    "rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-100";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        type="search"
        value={text}
        onChange={(e) => onText(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        className={`w-full flex-1 px-4 ${inputBase}`}
      />
      <select
        value={sort}
        onChange={(e) => onSort(e.target.value as WinsSort)}
        aria-label={t("sortLabel")}
        className={inputBase}
      >
        <option value="recent">{t("sortRecent")}</option>
        <option value="oldest">{t("sortOldest")}</option>
      </select>
    </div>
  );
}
