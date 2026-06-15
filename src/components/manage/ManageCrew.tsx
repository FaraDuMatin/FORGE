"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { approveMember, removeMember } from "@/server/actions/crew";
import { initialState } from "@/server/actions/types";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ManageHiddenFields, type ManageContext } from "./ManageHiddenFields";

export type CrewRow = {
  id: string;
  name: string;
  role: string | null;
  status: "PENDING" | "APPROVED";
  isMaintainer: boolean;
};

// Maintainer-side crew management: approve or decline pending join requests, and
// see the approved crew. Pending members can't claim tasks or count to readiness.
export function ManageCrew({ ctx, members }: { ctx: ManageContext; members: CrewRow[] }) {
  const t = useTranslations("crew");
  const pending = members.filter((m) => m.status === "PENDING");
  const approved = members.filter((m) => m.status === "APPROVED");

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold">{t("pendingHeading", { n: pending.length })}</h3>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">{t("noPending")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {pending.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800"
              >
                <span className="text-sm">
                  <span className="font-medium">{m.name}</span>
                  {m.role ? <span className="ml-2 text-xs text-neutral-500">{m.role}</span> : null}
                </span>
                <div className="flex gap-2">
                  <MemberAction ctx={ctx} memberId={m.id} kind="approve" />
                  <MemberAction ctx={ctx} memberId={m.id} kind="remove" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold">{t("approvedHeading", { n: approved.length })}</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {approved.map((m) => (
            <li key={m.id} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-sm dark:border-neutral-800">
              <span className="font-medium">{m.name}</span>
              {m.isMaintainer ? (
                <span className="text-xs text-neutral-500">{t("maintainer")}</span>
              ) : (
                <>
                  {m.role ? <span className="text-xs text-neutral-500">{m.role}</span> : null}
                  <RemoveX ctx={ctx} memberId={m.id} />
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MemberAction({ ctx, memberId, kind }: { ctx: ManageContext; memberId: string; kind: "approve" | "remove" }) {
  const t = useTranslations("crew");
  const [, action] = useActionState(kind === "approve" ? approveMember : removeMember, initialState);
  return (
    <form action={action}>
      <ManageHiddenFields {...ctx} />
      <input type="hidden" name="memberId" value={memberId} />
      <SubmitButton variant={kind === "approve" ? "primary" : "secondary"}>
        {t(kind === "approve" ? "approve" : "decline")}
      </SubmitButton>
    </form>
  );
}

function RemoveX({ ctx, memberId }: { ctx: ManageContext; memberId: string }) {
  const t = useTranslations("crew");
  const [, action] = useActionState(removeMember, initialState);
  return (
    <form action={action}>
      <ManageHiddenFields {...ctx} />
      <input type="hidden" name="memberId" value={memberId} />
      <button type="submit" aria-label={t("remove")} className="text-neutral-400 transition hover:text-red-500">
        ✕
      </button>
    </form>
  );
}
