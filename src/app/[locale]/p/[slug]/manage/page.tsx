import { notFound } from "next/navigation";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { AddTaskForm } from "@/components/manage/AddTaskForm";
import { PostUpdateForm } from "@/components/manage/PostUpdateForm";
import { ManageTaskList } from "@/components/manage/ManageTaskList";
import { CloseProjectForm } from "@/components/manage/CloseProjectForm";
import { TokenReveal } from "@/components/manage/TokenReveal";
import type { ManageContext } from "@/components/manage/ManageHiddenFields";
import { getProjectBySlug } from "@/server/projects";

export const dynamic = "force-dynamic";

export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ t?: string; created?: string }>;
}) {
  const { locale, slug } = await params;
  const { t: token, created } = await searchParams;
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
  }));

  return (
    <Dashboard
      ctx={ctx}
      slug={slug}
      title={project.title}
      closed={project.status === "CLOSED"}
      justCreated={created === "1"}
      tasks={tasks}
    />
  );
}

function Dashboard({
  ctx,
  slug,
  title,
  closed,
  justCreated,
  tasks,
}: {
  ctx: ManageContext;
  slug: string;
  title: string;
  closed: boolean;
  justCreated: boolean;
  tasks: { id: string; title: string; status: "OPEN" | "CLAIMED" | "DONE"; claimedByName: string | null }[];
}) {
  const t = useTranslations("manage");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-10 px-6 py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t("eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
          <Link href={`/p/${slug}`} className="mt-1 inline-block text-sm text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400">
            {t("viewPublic")}
          </Link>
        </div>

        {justCreated ? <TokenReveal /> : null}

        {closed ? (
          <p className="rounded-lg border border-neutral-200 p-4 text-sm text-neutral-500 dark:border-neutral-800">
            {t("closedNotice")}
          </p>
        ) : (
          <>
            <Section title={t("tasksHeading")}>
              <AddTaskForm {...ctx} />
              <div className="mt-5">
                <ManageTaskList ctx={ctx} tasks={tasks} />
              </div>
            </Section>

            <Section title={t("logHeading")}>
              <PostUpdateForm {...ctx} />
            </Section>

            <Section title={t("closeHeading")}>
              <CloseProjectForm {...ctx} />
            </Section>
          </>
        )}
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
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
