"use client";

import { useActionState, useRef } from "react";
import { useTranslations } from "next-intl";
import { postUpdate } from "@/server/actions/updates";
import { initialState } from "@/server/actions/types";
import { Field, Textarea } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

export function PostUpdateForm(ctx: ManageContext) {
  const t = useTranslations("manage");
  const [state, action] = useActionState(postUpdate, initialState);
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
      <Field label={t("logLabel")} hint={t("logHint")}>
        <Textarea name="text" required maxLength={1000} />
      </Field>
      <FormError code={state.error} />
      <SubmitButton variant="secondary">{t("logPost")}</SubmitButton>
    </form>
  );
}
