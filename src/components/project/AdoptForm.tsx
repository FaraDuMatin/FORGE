"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { adopt } from "@/server/actions/succession";
import { initialState } from "@/server/actions/types";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";

// Shown on an ADOPTABLE project. Anyone can take it on: you become the maintainer
// and the project re-enters the running for a spotlight. Mirrors the join form.
export function AdoptForm({ projectId, slug }: { projectId: string; slug: string }) {
  const t = useTranslations("succession");
  const locale = useLocale();
  const [state, action] = useActionState(adopt, initialState);

  return (
    <form
      action={action}
      className="space-y-4 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950"
    >
      <div>
        <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t("adoptHeading")}</h3>
        <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{t("adoptableSub")}</p>
      </div>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("adoptName")}>
          <Input name="name" required />
        </Field>
        <Field label={t("adoptEmail")}>
          <Input name="email" type="email" required />
        </Field>
      </div>
      <Field label={t("adoptRole")}>
        <Input name="role" />
      </Field>
      <FormError code={state.error} />
      <SubmitButton>{t("adoptCta")}</SubmitButton>
    </form>
  );
}
