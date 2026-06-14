"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { resumeProject } from "@/server/actions/projects";
import { initialState } from "@/server/actions/types";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";

// Fallback re-entry for a new device or cleared storage: paste your secret token
// or the full manage link. The action resolves it to the right manage page.
export function ResumeForm() {
  const t = useTranslations("me");
  const locale = useLocale();
  const [state, action] = useActionState(resumeProject, initialState);

  return (
    <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="text-sm font-semibold">{t("resumeHeading")}</h2>
      <p className="mt-1 text-sm text-neutral-500">{t("resumeHint")}</p>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="locale" value={locale} />
        <Field label={t("resumeLabel")}>
          <Input name="key" required placeholder="cmqd… or https://…/manage?t=…" />
        </Field>
        <FormError code={state.error} />
        <SubmitButton variant="secondary">{t("resumeCta")}</SubmitButton>
      </form>
    </section>
  );
}
