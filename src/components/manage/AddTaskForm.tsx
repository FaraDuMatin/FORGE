"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { addTask } from "@/server/actions/tasks";
import { initialState } from "@/server/actions/types";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

export function AddTaskForm(ctx: ManageContext) {
  const t = useTranslations("manage");
  const [state, action] = useActionState(addTask, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await action(fd);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <ManageHiddenFields {...ctx} />
      <Field label={t("taskLabel")} hint={t("taskHint")}>
        <Input name="title" required />
      </Field>
      <FormError code={state.error} />
      <SubmitButton variant="secondary">{t("taskAdd")}</SubmitButton>
    </form>
  );
}
