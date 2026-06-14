"use client";

import { useTranslations } from "next-intl";
import { STAGES, type DirectoryQuery } from "@/lib/directory";
import { POOLS } from "@/lib/pools";

// Presentational search + filter row. Reports changes through callbacks; the
// owner (ProjectsClient) debounces, fetches, and keeps the URL in sync. Holding
// no state of its own means nothing here can drift out of sync.
export function DirectoryControls({
  text,
  pool,
  stage,
  onText,
  onPool,
  onStage,
}: {
  text: string;
  pool: DirectoryQuery["pool"];
  stage: DirectoryQuery["stage"];
  onText: (value: string) => void;
  onPool: (value: DirectoryQuery["pool"]) => void;
  onStage: (value: DirectoryQuery["stage"]) => void;
}) {
  const t = useTranslations("directory");
  const tk = useTranslations();

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
      <div className="flex gap-3">
        <select
          value={pool ?? ""}
          onChange={(e) => onPool((e.target.value || undefined) as DirectoryQuery["pool"])}
          aria-label={t("allDurations")}
          className={inputBase}
        >
          <option value="">{t("allDurations")}</option>
          {POOLS.map((p) => (
            <option key={p.pool} value={p.pool}>
              {tk(p.labelKey)}
            </option>
          ))}
        </select>
        <select
          value={stage ?? ""}
          onChange={(e) => onStage((e.target.value || undefined) as DirectoryQuery["stage"])}
          aria-label={t("allStages")}
          className={inputBase}
        >
          <option value="">{t("allStages")}</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {t(`stage.${s}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
