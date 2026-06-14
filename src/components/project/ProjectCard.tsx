import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/project/StatusBadge";
import { cardSurface } from "@/lib/cardStyle";
import type { DirectoryItem } from "@/lib/directory";
import type { Pool } from "@/generated/prisma/client";

function poolLabelKey(pool: Pool): string {
  return `pool.${{ WEEK: "week", MONTH: "month", HALF_YEAR: "halfYear", YEAR: "year" }[pool]}`;
}

// One card, two shapes. `list` = compact row; `grid` = taller tile. Spotlight /
// People's Choice styling comes from cardSurface so it matches the rest of the app.
export function ProjectCard({
  project,
  variant = "list",
}: {
  project: DirectoryItem;
  variant?: "list" | "grid";
}) {
  const t = useTranslations("directory");
  const tk = useTranslations();
  const surface = cardSurface(project.status, project.isPeoplesChoice);

  const readyHint =
    project.status === "QUEUED" ? (
      <span className={`text-xs ${project.ready ? "text-emerald-600" : "text-neutral-400"}`}>
        {project.ready ? t("ready") : t("gettingReady")}
      </span>
    ) : null;

  if (variant === "grid") {
    return (
      <Link href={`/p/${project.slug}`} className={`flex h-full flex-col ${surface}`}>
        <div className="flex items-start justify-between gap-2">
          <StatusBadge status={project.status} isPeoplesChoice={project.isPeoplesChoice} />
          {readyHint}
        </div>
        <p className="mt-3 font-medium leading-snug">{project.title}</p>
        <p className="mt-1 text-sm text-neutral-500">{project.city}, {project.country}</p>
        <p className="mt-3 text-xs text-neutral-400">{tk(poolLabelKey(project.pool))}</p>
      </Link>
    );
  }

  return (
    <Link href={`/p/${project.slug}`} className={`flex items-center justify-between gap-3 ${surface}`}>
      <div className="min-w-0">
        <p className="truncate font-medium">{project.title}</p>
        <p className="mt-0.5 text-sm text-neutral-500">
          {project.city}, {project.country} · {tk(poolLabelKey(project.pool))}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <StatusBadge status={project.status} isPeoplesChoice={project.isPeoplesChoice} />
        {readyHint}
      </div>
    </Link>
  );
}
