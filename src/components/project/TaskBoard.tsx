"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { claimTask, submitTask } from "@/server/actions/tasks";
import { initialState } from "@/server/actions/types";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError, FormSuccess } from "@/components/ui/FormError";
import { renderMarkdown } from "@/lib/markdown";

export type TaskView = {
  id: string;
  title: string;
  status: "OPEN" | "CLAIMED" | "SUBMITTED" | "DONE";
  claimedByName: string | null;
  report: string | null;
  reportUrl: string | null;
};

// The task board. Open tasks are claimable by an approved crew member; the claimer
// then reports their work for the maintainer to review (submit -> SUBMITTED -> done).
export function TaskBoard({ slug, tasks }: { slug: string; tasks: TaskView[] }) {
  const t = useTranslations("task");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, action] = useActionState(claimTask, initialState);

  const open = tasks.filter((x) => x.status === "OPEN");
  const claimed = tasks.filter((x) => x.status === "CLAIMED");
  const submitted = tasks.filter((x) => x.status === "SUBMITTED");
  const done = tasks.filter((x) => x.status === "DONE");

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("heading")}</h2>

      {tasks.length === 0 ? <p className="mt-3 text-sm text-neutral-500">{t("none")}</p> : null}

      {open.length > 0 ? (
        <div className="mt-3 space-y-3">
          <div className="max-w-xs">
            <Input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <ul className="space-y-2">
            {open.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
              >
                <span className="text-sm">{task.title}</span>
                <form action={action}>
                  <input type="hidden" name="taskId" value={task.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="email" value={email} />
                  <SubmitButton variant="secondary">{t("claim")}</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
          <FormError code={state.error} />
        </div>
      ) : null}

      {claimed.length > 0 ? (
        <TaskGroup title={t("claimed")}>
          {claimed.map((task) => (
            <ClaimedRow key={task.id} task={task} slug={slug} locale={locale} />
          ))}
        </TaskGroup>
      ) : null}

      {submitted.length > 0 ? (
        <TaskGroup title={t("inReview")}>
          {submitted.map((task) => (
            <li key={task.id} className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-900/60 dark:bg-amber-950/30">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span>{task.title}</span>
                <span className="text-xs text-neutral-500">{task.claimedByName}</span>
              </div>
              {task.report ? <Report report={task.report} url={task.reportUrl} /> : null}
            </li>
          ))}
        </TaskGroup>
      ) : null}

      {done.length > 0 ? (
        <TaskGroup title={t("done")}>
          {done.map((task) => (
            <li key={task.id} className="py-1 text-sm text-neutral-500 line-through">
              {task.title}
            </li>
          ))}
        </TaskGroup>
      ) : null}
    </section>
  );
}

// A claimed task: shows who claimed it + a collapsible "report your work" form.
// The claimer proves it's them with the email they claimed with.
function ClaimedRow({ task, slug, locale }: { task: TaskView; slug: string; locale: string }) {
  const t = useTranslations("task");
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(submitTask, initialState);

  return (
    <li className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{task.title}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{task.claimedByName}</span>
          {!state.ok ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-700 transition hover:border-emerald-400 dark:border-neutral-700 dark:text-neutral-300"
            >
              {t("reportCta")}
            </button>
          ) : null}
        </div>
      </div>

      {state.ok ? (
        <div className="mt-2"><FormSuccess message={t("reportSubmitted")} /></div>
      ) : open ? (
        <form action={action} className="mt-3 space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <input type="hidden" name="taskId" value={task.id} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="locale" value={locale} />
          <Input name="email" type="email" placeholder={t("emailPlaceholder")} required />
          <textarea
            name="report"
            required
            maxLength={1500}
            rows={3}
            placeholder={t("reportPlaceholder")}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <Input name="reportUrl" type="url" placeholder={t("reportUrlPlaceholder")} />
          <FormError code={state.error} />
          <SubmitButton variant="secondary">{t("reportSubmit")}</SubmitButton>
        </form>
      ) : null}
    </li>
  );
}

function Report({ report, url }: { report: string; url: string | null }) {
  const t = useTranslations("task");
  return (
    <div className="mt-2 border-t border-amber-200/70 pt-2 dark:border-amber-900/50">
      <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }} />
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400">
          {t("reportLink")} →
        </a>
      ) : null}
    </div>
  );
}

function TaskGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h3>
      <ul className="mt-1 space-y-1">{children}</ul>
    </div>
  );
}
