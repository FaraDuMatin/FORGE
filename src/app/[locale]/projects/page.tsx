import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/project/StatusBadge";
import { listProjects, type ProjectListItem } from "@/server/projects";
import type { Pool } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

// Sort: spotlights first, then ready-and-waiting, then getting-ready, then
// adoptable, then finished/cancelled. Within a rank, newest order is preserved.
const RANK: Record<string, number> = {
  PEOPLES_CHOICE: 0,
  SPOTLIGHT: 1,
  QUEUED_READY: 2,
  QUEUED: 3,
  ADOPTABLE: 4,
  CLOSED: 5,
  CANCELLED: 6,
};

function rankOf(p: ProjectListItem): number {
  if (p.isPeoplesChoice && p.status === "SPOTLIGHT") return RANK.PEOPLES_CHOICE;
  if (p.status === "QUEUED") return p.ready ? RANK.QUEUED_READY : RANK.QUEUED;
  return RANK[p.status] ?? 9;
}

function poolLabelKey(pool: Pool): string {
  return `pool.${{ WEEK: "week", MONTH: "month", HALF_YEAR: "halfYear", YEAR: "year" }[pool]}`;
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const projects = (await listProjects()).sort((a, b) => rankOf(a) - rankOf(b));
  return <Directory projects={projects} />;
}

function Directory({ projects }: { projects: ProjectListItem[] }) {
  const t = useTranslations("directory");
  const tk = useTranslations();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>

        {projects.length === 0 ? (
          <p className="mt-8 text-sm text-neutral-500">{t("empty")}</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/p/${p.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-4 transition hover:border-emerald-500 dark:border-neutral-800"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.title}</p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {p.city}, {p.country} · {tk(poolLabelKey(p.pool))}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={p.status} isPeoplesChoice={p.isPeoplesChoice} />
                    {p.status === "QUEUED" ? (
                      <span className={`text-xs ${p.ready ? "text-emerald-600" : "text-neutral-400"}`}>
                        {p.ready ? t("ready") : t("gettingReady")}
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
