"use client";

import { useTranslations } from "next-intl";
import { ProjectCard } from "@/components/project/ProjectCard";
import type { View } from "@/components/project/ViewToggle";
import type { DirectoryGroup, Stage } from "@/lib/directory";

// Browse view: one spaced section per stage, each a capped preview with a
// "See all N" that drills into the filtered list. Empty stages are skipped.
export function GroupedProjects({
  groups,
  view,
  onSeeAll,
}: {
  groups: DirectoryGroup[];
  view: View;
  onSeeAll: (stage: Stage) => void;
}) {
  const t = useTranslations("directory");
  const visible = groups.filter((g) => g.items.length > 0);

  if (visible.length === 0) {
    return <p className="mt-8 text-sm text-neutral-500">{t("empty")}</p>;
  }

  const layout = view === "grid" ? "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "mt-5 space-y-3";

  return (
    <div className="mt-8 space-y-14">
      {visible.map((g) => (
        <section key={g.stage}>
          <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-2 dark:border-neutral-800">
            <h2 className="text-lg font-semibold tracking-tight">{t(`stage.${g.stage}`)}</h2>
            {g.total > g.items.length ? (
              <button
                type="button"
                onClick={() => onSeeAll(g.stage)}
                className="shrink-0 text-sm text-emerald-600 hover:underline"
              >
                {t("seeAll", { n: g.total })} →
              </button>
            ) : (
              <span className="shrink-0 text-sm text-neutral-400">{t("results", { n: g.total })}</span>
            )}
          </div>
          <div className={layout}>
            {g.items.map((p) => (
              <ProjectCard key={p.id} project={p} variant={view} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
