"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setSuccessor } from "@/server/actions/succession";
import { initialState } from "@/server/actions/types";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError, FormSuccess } from "@/components/ui/FormError";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

// Name who takes over if you step away. On 6-month and 1-year pools this is a
// readiness bar; on shorter pools it's optional but still enables a clean handoff.
export function SetSuccessorForm({
  ctx,
  successorName,
  successorEmail,
}: {
  ctx: ManageContext;
  successorName: string | null;
  successorEmail: string | null;
}) {
  const t = useTranslations("succession");
  const [state, action] = useActionState(setSuccessor, initialState);

  return (
    <form action={action} className="space-y-3">
      <ManageHiddenFields {...ctx} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("successorName")}>
          <Input name="successorName" defaultValue={successorName ?? ""} />
        </Field>
        <Field label={t("successorEmail")}>
          <Input name="successorEmail" type="email" defaultValue={successorEmail ?? ""} />
        </Field>
      </div>
      <FormError code={state.error} />
      {state.ok ? <FormSuccess message={t("successorSaved")} /> : null}
      <SubmitButton variant="secondary">{t("successorSave")}</SubmitButton>
    </form>
  );
}
