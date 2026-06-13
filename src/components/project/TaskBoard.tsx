"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { claimTask } from "@/server/actions/tasks";
import { initialState } from "@/server/actions/types";
import { Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";

export type TaskView = {
  id: string;
  title: string;
  status: "OPEN" | "CLAIMED" | "DONE";
  claimedByName: string | null;
};

// The task board. Open tasks are claimable by anyone on the crew: enter the email
// you joined with, then claim. Claimed/done tasks credit the claimer.
export function TaskBoard({ slug, tasks }: { slug: string; tasks: TaskView[] }) {
  const t = useTranslations("task");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, action] = useActionState(claimTask, initialState);

  const open = tasks.filter((x) => x.status === "OPEN");
  const claimed = tasks.filter((x) => x.status === "CLAIMED");
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
            <li key={task.id} className="flex justify-between gap-3 py-1 text-sm">
              <span>{task.title}</span>
              <span className="text-neutral-500">{task.claimedByName}</span>
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

function TaskGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{title}</h3>
      <ul className="mt-1">{children}</ul>
    </div>
  );
}
