"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { stepBack } from "@/server/actions/succession";
import { initialState } from "@/server/actions/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

// Step away from the project. The outcome depends on whether a successor is named:
// with one, it hands over and keeps its place; without, it goes up for adoption.
// We tell the maintainer which, so stepping back is never a surprise.
export function StepBackForm({
  ctx,
  hasSuccessor,
  successorName,
}: {
  ctx: ManageContext;
  hasSuccessor: boolean;
  successorName: string | null;
}) {
  const t = useTranslations("succession");
  const [state, action] = useActionState(stepBack, initialState);

  return (
    <form action={action} className="space-y-3">
      <ManageHiddenFields {...ctx} />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">
        {hasSuccessor
          ? t("stepBackWithSuccessor", { name: successorName ?? "" })
          : t("stepBackWithoutSuccessor")}
      </p>
      <FormError code={state.error} />
      <SubmitButton variant="secondary">{t("stepBackCta")}</SubmitButton>
    </form>
  );
}
