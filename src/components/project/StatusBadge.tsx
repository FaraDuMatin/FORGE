import { useTranslations } from "next-intl";
import type { ProjectStatus } from "@/generated/prisma/client";

const STYLES: Record<ProjectStatus, string> = {
  QUEUED: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  SPOTLIGHT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  CLOSED: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  ADOPTABLE: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({
  status,
  isPeoplesChoice = false,
}: {
  status: ProjectStatus;
  isPeoplesChoice?: boolean;
}) {
  const t = useTranslations("project.status");
  // The People's Choice holder is stored as SPOTLIGHT but shown as its own thing.
  if (isPeoplesChoice && status === "SPOTLIGHT") {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
        {t("PEOPLES_CHOICE")}
      </span>
    );
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {t(status)}
    </span>
  );
}
