"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { closeProject } from "@/server/actions/projects";
import { initialState } from "@/server/actions/types";
import { Field, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError, FormSuccess } from "@/components/ui/FormError";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

// Close with an outcome. This frees the slot and turns the project into a
// playbook on the win wall. We push projects toward finishing, so this is the
// celebrated end state, not an abandonment.
export function CloseProjectForm(ctx: ManageContext) {
  const t = useTranslations("manage");
  const [state, action] = useActionState(closeProject, initialState);

  return (
    <form action={action} className="space-y-3">
      <ManageHiddenFields {...ctx} />
      <Field label={t("closeLabel")} hint={t("closeHint")}>
        <Textarea name="outcome" required maxLength={600} />
      </Field>
      <FormError code={state.error} />
      {state.ok ? <FormSuccess message={t("closed")} /> : null}
      <SubmitButton>{t("closeCta")}</SubmitButton>
    </form>
  );
}
