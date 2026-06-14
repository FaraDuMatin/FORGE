"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createProject } from "@/server/actions/projects";
import { initialState } from "@/server/actions/types";
import { Field, Input, Textarea, Select } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { FormError } from "@/components/ui/FormError";
import { PoolRequirements } from "./PoolRequirements";
import { POOLS } from "@/lib/pools";
import type { Pool } from "@/generated/prisma/client";

export type ForkPrefill = {
  clonedFrom: string; // source project id
  sourceTitle: string;
  title: string;
  goal: string;
  pool: Pool;
};

export function NewProjectForm({ fork }: { fork?: ForkPrefill }) {
  const t = useTranslations("new");
  const tk = useTranslations();
  const locale = useLocale();
  const [pool, setPool] = useState<Pool>(fork?.pool ?? "WEEK");
  const [state, action] = useActionState(createProject, initialState);

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_18rem]">
      <form action={action} className="space-y-5">
        <input type="hidden" name="locale" value={locale} />
        {fork ? <input type="hidden" name="clonedFrom" value={fork.clonedFrom} /> : null}

        {fork ? (
          <p className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
            {t("forkingFrom", { title: fork.sourceTitle })}
          </p>
        ) : null}

        <Field label={t("fTitle")}>
          <Input name="title" required maxLength={120} defaultValue={fork?.title} />
        </Field>
        <Field label={t("fGoal")} hint={t("fGoalHint")}>
          <Textarea name="goal" required maxLength={600} defaultValue={fork?.goal} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t("fCity")}>
            <Input name="city" required />
          </Field>
          <Field label={t("fCountry")}>
            <Input name="country" required />
          </Field>
        </div>
        <Field label={t("fPool")} hint={t("fPoolHint")}>
          <Select name="pool" value={pool} onChange={(e) => setPool(e.target.value as Pool)}>
            {POOLS.map((p) => (
              <option key={p.pool} value={p.pool}>
                {tk(p.labelKey)}
              </option>
            ))}
          </Select>
        </Field>

        <fieldset className="space-y-5 border-t border-neutral-200 pt-5 dark:border-neutral-800">
          <legend className="px-1 text-sm font-semibold">{t("youLegend")}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("fName")}>
              <Input name="maintainerName" required />
            </Field>
            <Field label={t("fEmail")} hint={t("fEmailHint")}>
              <Input name="maintainerEmail" type="email" required />
            </Field>
          </div>
          <Field label={t("fRole")} hint={t("fRoleHint")}>
            <Input name="maintainerRole" />
          </Field>
        </fieldset>

        <FormError code={state.error} />
        <SubmitButton>{t("submit")}</SubmitButton>
      </form>

      <aside className="md:pt-1">
        <PoolRequirements pool={pool} />
      </aside>
    </div>
  );
}
