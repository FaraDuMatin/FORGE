import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ListChecks, MapPin, PencilLine, Timer, Users, Wrench } from "lucide-react";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/project/StatusBadge";
import { BuildLog } from "@/components/project/BuildLog";
import { AddTaskForm } from "@/components/manage/AddTaskForm";
import { PostUpdateForm } from "@/components/manage/PostUpdateForm";
import { ManageTaskList } from "@/components/manage/ManageTaskList";
import { ManageCrew, type CrewRow } from "@/components/manage/ManageCrew";
import { CloseProjectForm } from "@/components/manage/CloseProjectForm";
import { SetSuccessorForm } from "@/components/manage/SetSuccessorForm";
import { StepBackForm } from "@/components/manage/StepBackForm";
import { UpdateVideoForm } from "@/components/manage/UpdateVideoForm";
import { TokenReveal } from "@/components/manage/TokenReveal";
import { RememberProject } from "@/components/manage/RememberProject";
import type { ManageContext } from "@/components/manage/ManageHiddenFields";
import { getProjectBySlug } from "@/server/projects";
import type { Pool, ProjectStatus } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

const POOL_KEY: Record<Pool, "week" | "month" | "halfYear" | "year"> = {
  WEEK: "week",
  MONTH: "month",
  HALF_YEAR: "halfYear",
  YEAR: "year",
};

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ t?: string; created?: string; handoff?: string; adopted?: string }>;
}) {
  const { locale, slug } = await params;
  const { t: token, created, handoff, adopted } = await searchParams;
  setRequestLocale(locale);

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  if (!token || project.maintainerToken !== token) {
    return <Denied />;
  }

  const ctx: ManageContext = { projectId: project.id, token, slug, locale };
  const tasks = project.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    claimedByName: task.claimedByName,
    report: task.report,
    reportUrl: task.reportUrl,
  }));
  const members: CrewRow[] = project.members.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    status: m.status,
    isMaintainer: m.email === project.maintainerEmail,
  }));

  const notice = created === "1" ? "created" : handoff === "1" ? "handoff" : adopted === "1" ? "adopted" : null;

  const stats: Stats = {
    crew: members.filter((m) => m.status === "APPROVED").length,
    pending: members.filter((m) => m.status === "PENDING").length,
    tasksDone: project.tasks.filter((task) => task.status === "DONE").length,
    tasksTotal: project.tasks.length,
    updates: project.updates.length,
  };

  return (
    <Dashboard
      ctx={ctx}
      slug={slug}
      title={project.title}
      status={project.status}
      pool={project.pool}
      city={project.city}
      country={project.country}
      notice={notice}
      successorName={project.successorName}
      successorEmail={project.successorEmail}
      videoUrl={project.videoUrl}
      stats={stats}
      tasks={tasks}
      members={members}
      updates={project.updates}
    />
  );
}

type Stats = { crew: number; pending: number; tasksDone: number; tasksTotal: number; updates: number };

function Dashboard({
  ctx,
  slug,
  title,
  status,
  pool,
  city,
  country,
  notice,
  successorName,
  successorEmail,
  videoUrl,
  stats,
  tasks,
  members,
  updates,
}: {
  ctx: ManageContext;
  slug: string;
  title: string;
  status: ProjectStatus;
  pool: Pool;
  city: string;
  country: string;
  notice: "created" | "handoff" | "adopted" | null;
  successorName: string | null;
  successorEmail: string | null;
  videoUrl: string | null;
  stats: Stats;
  tasks: { id: string; title: string; status: "OPEN" | "CLAIMED" | "SUBMITTED" | "DONE"; claimedByName: string | null; report: string | null; reportUrl: string | null }[];
  members: CrewRow[];
  updates: { id: string; authorName: string; text: string; createdAt: Date }[];
}) {
  const t = useTranslations("manage");
  const ts = useTranslations("succession");
  const tp = useTranslations("pool");
  const closed = status === "CLOSED";
  const hasSuccessor = Boolean(successorName && successorEmail);

  return (
    <>
      <Header />
      <RememberProject slug={slug} title={title} token={ctx.token} />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-6 py-10">
        {/* Header card */}
        <div className="rounded-xl border border-neutral-200 bg-white bg-[radial-gradient(ellipse_42%_55%_at_100%_0%,rgba(16,185,129,0.10),transparent)] p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            <Wrench size={14} />
            {t("eyebrow")}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <Timer size={12} />
              {tp(POOL_KEY[pool])}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <MapPin size={12} />
              {city}, {country}
            </span>
          </div>
          <Link href={`/p/${slug}`} className="mt-3 inline-block text-sm text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400">
            {t("viewPublic")}
          </Link>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <Stat icon={<Users size={16} />} label={t("statCrew")} value={stats.crew} />
            <Stat icon={<ListChecks size={16} />} label={t("statTasks")} value={`${stats.tasksDone} / ${stats.tasksTotal}`} />
            <Stat icon={<PencilLine size={16} />} label={t("statUpdates")} value={stats.updates} />
          </div>
        </div>

        {notice ? <TokenReveal variant={notice} /> : null}

        {closed ? (
          <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
            {t("closedNotice")}
          </p>
        ) : (
          <>
            <Section title={t("crewHeading")} badge={stats.pending > 0 ? stats.pending : undefined}>
              <ManageCrew ctx={ctx} members={members} />
            </Section>

            <Section title={t("tasksHeading")}>
              <AddTaskForm {...ctx} />
              <div className="mt-5">
                <ManageTaskList ctx={ctx} tasks={tasks} />
              </div>
            </Section>

            <Section title={t("logHeading")}>
              <PostUpdateForm {...ctx} />
              {updates.length > 0 ? (
                <div className="mt-6">
                  <BuildLog entries={updates} />
                </div>
              ) : null}
            </Section>

            <Section title={t("videoHeading")}>
              <UpdateVideoForm ctx={ctx} videoUrl={videoUrl} />
            </Section>

            <Section title={ts("successorHeading")}>
              <p className="mb-3 text-sm text-neutral-500">{ts("successorSub")}</p>
              <SetSuccessorForm ctx={ctx} successorName={successorName} successorEmail={successorEmail} />
            </Section>

            {status !== "ADOPTABLE" ? (
              <Section title={ts("stepBackHeading")}>
                <StepBackForm ctx={ctx} hasSuccessor={hasSuccessor} successorName={successorName} />
              </Section>
            ) : null}

            <Section title={t("closeHeading")}>
              <CloseProjectForm {...ctx} />
            </Section>
          </>
        )}
      </main>
    </>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300">
      <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
      <span className="font-semibold">{value}</span>
      <span className="text-neutral-500">{label}</span>
    </span>
  );
}

function Section({ title, badge, children }: { title: string; badge?: number; children: React.ReactNode }) {
  return (
    <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        {title}
        {badge ? (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </h2>
      {children}
    </section>
  );
}

function Denied() {
  const t = useTranslations("manage");
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-20">
        <h1 className="text-2xl font-bold tracking-tight">{t("deniedHeading")}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">{t("deniedBody")}</p>
      </main>
    </>
  );
}
