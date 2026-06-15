import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { CrewList, type CrewMember } from "@/components/project/CrewList";
import { JoinForm } from "@/components/project/JoinForm";
import { TaskBoard, type TaskView } from "@/components/project/TaskBoard";
import { BuildLogPreview } from "@/components/project/BuildLogPreview";
import { ReadinessChecklist } from "@/components/project/ReadinessPanel";
import { AdoptForm } from "@/components/project/AdoptForm";
import { ShareLink } from "@/components/project/ShareLink";
import { VotePanel } from "@/components/pc/VotePanel";
import { StatusBadge } from "@/components/project/StatusBadge";
import { getProjectBySlug } from "@/server/projects";
import { getLineage, type Lineage } from "@/server/wins";
import { youtubeEmbedUrl } from "@/lib/videoEmbed";
import { loadProjectReadiness } from "@/server/readiness";
import { votedProjectIds } from "@/server/peopleschoice";
import type { ReadinessBar } from "@/lib/readiness";
import type { Pool, ProjectStatus } from "@/generated/prisma/client";

// Live data: slots and the build log change with every action.
export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  const { bars, ready } = await loadProjectReadiness(project.id);
  const hasVoted = (await votedProjectIds()).has(project.id);
  const lineage = await getLineage(project.id, project.clonedFrom);

  // Public crew list shows approved members only; pending requests live in the panel.
  const members: CrewMember[] = project.members
    .filter((m) => m.status === "APPROVED")
    .map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      isMaintainer: m.email === project.maintainerEmail,
    }));
  const tasks: TaskView[] = project.tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    claimedByName: task.claimedByName,
    report: task.report,
    reportUrl: task.reportUrl,
  }));

  return (
    <ProjectDetail
      id={project.id}
      slug={project.slug}
      title={project.title}
      goal={project.goal}
      city={project.city}
      country={project.country}
      pool={project.pool}
      status={project.status}
      isPeoplesChoice={project.isPeoplesChoice}
      poolLabelKey={poolLabelKey(project.pool)}
      outcome={project.outcome}
      fundingUrl={project.fundingUrl}
      embedUrl={youtubeEmbedUrl(project.videoUrl)}
      ready={ready}
      hasVoted={hasVoted}
      lineage={lineage}
      bars={bars}
      members={members}
      tasks={tasks}
      updates={project.updates}
    />
  );
}

function poolLabelKey(pool: Pool): string {
  return `pool.${{ WEEK: "week", MONTH: "month", HALF_YEAR: "halfYear", YEAR: "year" }[pool]}`;
}

type DetailProps = {
  id: string;
  slug: string;
  title: string;
  goal: string;
  city: string;
  country: string;
  pool: Pool;
  status: ProjectStatus;
  isPeoplesChoice: boolean;
  poolLabelKey: string;
  outcome: string | null;
  fundingUrl: string | null;
  embedUrl: string | null;
  ready: boolean;
  hasVoted: boolean;
  lineage: Lineage;
  bars: ReadinessBar[];
  members: CrewMember[];
  tasks: TaskView[];
  updates: { id: string; authorName: string; text: string; createdAt: Date }[];
};

function ProjectDetail(props: DetailProps) {
  const t = useTranslations("project");
  const tpc = useTranslations("pc");
  const tk = useTranslations();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
          <StatusBadge status={props.status} isPeoplesChoice={props.isPeoplesChoice} />
          <span>{tk(props.poolLabelKey)}</span>
          <span aria-hidden>·</span>
          <span>{props.city}, {props.country}</span>
        </div>

        <h1 className="mt-3 text-3xl font-bold tracking-tight">{props.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{props.goal}</p>

        <div className="mt-4">
          <ShareLink />
        </div>

        {props.embedUrl ? (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            <iframe
              src={props.embedUrl}
              title={props.title}
              loading="lazy"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : null}

        {props.lineage.source || props.lineage.forkCities > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
            {props.lineage.source ? (
              <span>
                {t("forkedFromLabel")}{" "}
                <Link
                  href={`/p/${props.lineage.source.slug}`}
                  className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {props.lineage.source.title}
                </Link>
              </span>
            ) : null}
            {props.lineage.forkCities > 0 ? (
              <span>{t("copiedIn", { n: props.lineage.forkCities })}</span>
            ) : null}
          </div>
        ) : null}

        {props.lineage.forks.length > 0 ? (
          <section className="mt-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-sm font-semibold">
              {t("forkFamilyHeading", { n: props.lineage.forkCities })}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {props.lineage.forks.map((fork) => (
                <Link
                  key={fork.slug}
                  href={`/p/${fork.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-sm transition hover:border-emerald-400 dark:border-neutral-800"
                >
                  <span>{fork.city}</span>
                  <StatusBadge status={fork.status} />
                </Link>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-500">
              {t("forkTogether", {
                tasks: props.lineage.forkTasksDone,
                updates: props.lineage.forkUpdates,
              })}
            </p>
          </section>
        ) : null}

        {props.fundingUrl ? (
          <a
            href={props.fundingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block rounded-full border border-neutral-200 px-3 py-1 text-sm text-neutral-600 hover:border-neutral-400 dark:border-neutral-800 dark:text-neutral-400"
          >
            {t("funding")}
          </a>
        ) : null}

        {props.status === "CLOSED" && props.outcome ? (
          <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
            <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{t("outcomeHeading")}</h2>
            <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">{props.outcome}</p>
          </section>
        ) : null}

        {props.status === "ADOPTABLE" ? (
          <section className="mt-8">
            <AdoptForm projectId={props.id} slug={props.slug} />
          </section>
        ) : null}

        {props.status === "QUEUED" ? (
          <section className="mt-8 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <h2 className="text-sm font-semibold">
              {props.ready ? t("readyHeading") : t("queuedHeading")}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {props.ready ? t("readySub") : t("queuedSub")}
            </p>
            <div className="mt-3">
              <ReadinessChecklist pool={props.pool} bars={props.bars} />
            </div>
          </section>
        ) : null}

        {props.status === "QUEUED" && props.ready ? (
          <section className="mt-8 rounded-lg border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
            <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{tpc("backHeading")}</h2>
            <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">{tpc("backSub")}</p>
            <div className="mt-3">
              <VotePanel projectId={props.id} slug={props.slug} hasVoted={props.hasVoted} />
            </div>
          </section>
        ) : null}

        <div className="mt-10 space-y-10">
          <CrewList members={props.members} />
          <div>
            {props.tasks.length > 0 ? <TaskProgress tasks={props.tasks} /> : null}
            <TaskBoard slug={props.slug} tasks={props.tasks} />
          </div>
          <BuildLogPreview entries={props.updates} />
          {props.status !== "CLOSED" ? <JoinForm projectId={props.id} slug={props.slug} /> : null}
        </div>
      </main>
    </>
  );
}

function TaskProgress({ tasks }: { tasks: TaskView[] }) {
  const t = useTranslations("project");
  const done = tasks.filter((task) => task.status === "DONE").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>{t("taskProgress", { done, total: tasks.length })}</span>
        <span>{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

