"use client";

import { useTranslations } from "next-intl";

export type View = "grid" | "list";

// Small grid/list switch. Presentational — the owner holds the view state.
export function ViewToggle({ view, onView }: { view: View; onView: (v: View) => void }) {
  const t = useTranslations("directory");

  const btn = (v: View, label: string) => (
    <button
      type="button"
      onClick={() => onView(v)}
      aria-pressed={view === v}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        view === v
          ? "bg-emerald-600 text-white"
          : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-neutral-300 p-0.5 dark:border-neutral-700">
      {btn("grid", t("viewGrid"))}
      {btn("list", t("viewList"))}
    </div>
  );
}
