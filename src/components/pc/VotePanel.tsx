"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { castVote } from "@/server/actions/peopleschoice";
import { initialState } from "@/server/actions/types";
import { Field, Input } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError, FormSuccess } from "@/components/ui/FormError";

// One free vote per week, final once cast. When the cycle lock is set (hasVoted)
// we render the locked state instead of the form. The server enforces the real
// one-vote rule; this just keeps the UI honest without a round-trip.
export function VotePanel({
  projectId,
  slug,
  hasVoted,
}: {
  projectId: string;
  slug: string;
  hasVoted: boolean;
}) {
  const t = useTranslations("pc");
  const locale = useLocale();
  const [state, action] = useActionState(castVote, initialState);

  if (hasVoted && !state.ok) {
    return <p className="text-sm text-neutral-500">{t("votedThisWeek")}</p>;
  }
  if (state.ok) {
    return <FormSuccess message={t("votedThanks")} />;
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("voteName")}>
          <Input name="name" required />
        </Field>
        <Field label={t("voteEmail")}>
          <Input name="email" type="email" required />
        </Field>
      </div>
      <FormError code={state.error} />
      <SubmitButton>{t("voteSubmit")}</SubmitButton>
    </form>
  );
}
