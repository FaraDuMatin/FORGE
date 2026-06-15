"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { joinCrew } from "@/server/actions/crew";
import { initialState } from "@/server/actions/types";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError, FormSuccess } from "@/components/ui/FormError";

// Join the crew. Required before claiming a task. Optional role counts toward
// readiness on the longer pools.
export function JoinForm({ projectId, slug }: { projectId: string; slug: string }) {
  const t = useTranslations("crew");
  const locale = useLocale();
  const [state, action] = useActionState(joinCrew, initialState);

  return (
    <form action={action} className="space-y-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold">{t("joinHeading")}</h3>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fName")}>
          <Input name="name" required />
        </Field>
        <Field label={t("fEmail")}>
          <Input name="email" type="email" required />
        </Field>
      </div>
      <Field label={t("fRole")} hint={t("fRoleHint")}>
        <Input name="role" />
      </Field>
      <FormError code={state.error} />
      {state.ok ? <FormSuccess message={t("requested")} /> : null}
      <SubmitButton>{t("joinCta")}</SubmitButton>
    </form>
  );
}
