"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { setVideoUrl } from "@/server/actions/projects";
import { initialState } from "@/server/actions/types";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError, FormSuccess } from "@/components/ui/FormError";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

// Attach an optional YouTube link to the project — shown as an embed on the
// public page. Prefilled with the current value so it can be edited or cleared.
export function UpdateVideoForm({ ctx, videoUrl }: { ctx: ManageContext; videoUrl: string | null }) {
  const t = useTranslations("manage");
  const [state, action] = useActionState(setVideoUrl, initialState);

  return (
    <form action={action} className="space-y-3">
      <ManageHiddenFields {...ctx} />
      <Field label={t("videoLabel")} hint={t("videoHint")}>
        <Input name="videoUrl" type="url" defaultValue={videoUrl ?? ""} placeholder="https://youtu.be/…" />
      </Field>
      <FormError code={state.error} />
      {state.ok ? <FormSuccess message={t("videoSaved")} /> : null}
      <SubmitButton variant="secondary">{t("videoSave")}</SubmitButton>
    </form>
  );
}
