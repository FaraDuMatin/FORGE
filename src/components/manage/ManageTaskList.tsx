"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { markTaskDone } from "@/server/actions/tasks";
import { initialState } from "@/server/actions/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

type Task = { id: string; title: string; status: "OPEN" | "CLAIMED" | "DONE"; claimedByName: string | null };

// Maintainer-side task list: mark open or claimed tasks done. Done tasks stay
// listed (struck through) as a record of progress.
export function ManageTaskList({ ctx, tasks }: { ctx: ManageContext; tasks: Task[] }) {
  const t = useTranslations("manage");
  const [, action] = useActionState(markTaskDone, initialState);

  if (tasks.length === 0) return <p className="text-sm text-neutral-500">{t("noTasks")}</p>;

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
        >
          <span className={`text-sm ${task.status === "DONE" ? "text-neutral-400 line-through" : ""}`}>
            {task.title}
            {task.claimedByName ? <span className="ml-2 text-xs text-neutral-500">{task.claimedByName}</span> : null}
          </span>
          {task.status !== "DONE" ? (
            <form action={action}>
              <ManageHiddenFields {...ctx} />
              <input type="hidden" name="taskId" value={task.id} />
              <SubmitButton variant="secondary">{t("markDone")}</SubmitButton>
            </form>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
