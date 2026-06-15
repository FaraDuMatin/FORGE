"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { markTaskDone, rejectTask } from "@/server/actions/tasks";
import { initialState } from "@/server/actions/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { renderMarkdown } from "@/lib/markdown";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

type Task = {
  id: string;
  title: string;
  status: "OPEN" | "CLAIMED" | "SUBMITTED" | "DONE";
  claimedByName: string | null;
  report: string | null;
  reportUrl: string | null;
};

// Maintainer-side task list, grouped by status. Submitted tasks are reviewed like a
// pull request: read the report, then accept (-> done) or send back (-> open).
export function ManageTaskList({ ctx, tasks }: { ctx: ManageContext; tasks: Task[] }) {
  const t = useTranslations("manage");
  const tk = useTranslations("task");

  if (tasks.length === 0) return <p className="text-sm text-neutral-500">{t("noTasks")}</p>;

  const submitted = tasks.filter((x) => x.status === "SUBMITTED");
  const claimed = tasks.filter((x) => x.status === "CLAIMED");
  const open = tasks.filter((x) => x.status === "OPEN");
  const done = tasks.filter((x) => x.status === "DONE");

  return (
    <div className="space-y-6">
      {submitted.length > 0 ? (
        <Group title={tk("inReview")} count={submitted.length}>
          <ul className="space-y-3">
            {submitted.map((task) => (
              <li key={task.id} className="rounded-lg border border-amber-300 bg-amber-50/60 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{task.title}</span>
                  <span className="text-xs text-neutral-500">{task.claimedByName}</span>
                </div>
                {task.report ? (
                  <div className="mt-2 border-t border-amber-200/70 pt-2 dark:border-amber-900/50">
                    <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(task.report) }} />
                    {task.reportUrl ? (
                      <a href={task.reportUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                        {tk("reportLink")} →
                      </a>
                    ) : null}
                  </div>
                ) : null}
                <div className="mt-3 flex gap-2">
                  <TaskAction ctx={ctx} taskId={task.id} kind="accept" />
                  <TaskAction ctx={ctx} taskId={task.id} kind="reject" />
                </div>
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      {claimed.length > 0 ? (
        <Group title={tk("claimed")} count={claimed.length}>
          <ul className="space-y-2">
            {claimed.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                <span className="text-sm">
                  {task.title}
                  <span className="ml-2 text-xs text-neutral-500">{task.claimedByName}</span>
                </span>
                <TaskAction ctx={ctx} taskId={task.id} kind="accept" />
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      {open.length > 0 ? (
        <Group title={tk("open")} count={open.length}>
          <ul className="space-y-2">
            {open.map((task) => (
              <li key={task.id} className="rounded-md border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800">
                {task.title}
              </li>
            ))}
          </ul>
        </Group>
      ) : null}

      {done.length > 0 ? (
        <Group title={tk("done")} count={done.length}>
          <ul className="space-y-1">
            {done.map((task) => (
              <li key={task.id} className="px-3 py-1 text-sm text-neutral-400 line-through">
                {task.title}
              </li>
            ))}
          </ul>
        </Group>
      ) : null}
    </div>
  );
}

function Group({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title} ({count})
      </h3>
      {children}
    </div>
  );
}

function TaskAction({ ctx, taskId, kind }: { ctx: ManageContext; taskId: string; kind: "accept" | "reject" }) {
  const t = useTranslations("manage");
  const [, action] = useActionState(kind === "accept" ? markTaskDone : rejectTask, initialState);
  return (
    <form action={action}>
      <ManageHiddenFields {...ctx} />
      <input type="hidden" name="taskId" value={taskId} />
      <SubmitButton variant={kind === "accept" ? "primary" : "secondary"}>
        {t(kind === "accept" ? "taskAccept" : "taskReject")}
      </SubmitButton>
    </form>
  );
}
