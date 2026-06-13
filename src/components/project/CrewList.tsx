import { useTranslations } from "next-intl";

export type CrewMember = { id: string; name: string; role: string | null; isMaintainer: boolean };

// Every contributor is credited. The maintainer is flagged (computed server-side
// by email so we never render emails). Roles show when declared.
export function CrewList({ members }: { members: CrewMember[] }) {
  const t = useTranslations("crew");
  return (
    <div>
      <h2 className="text-lg font-semibold">{t("heading", { n: members.length })}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {members.map((m) => (
          <li
            key={m.id}
            className="rounded-full border border-neutral-200 px-3 py-1 text-sm dark:border-neutral-800"
          >
            <span className="font-medium">{m.name}</span>
            {m.isMaintainer ? (
              <span className="ml-1.5 text-xs text-neutral-500">{t("maintainer")}</span>
            ) : m.role ? (
              <span className="ml-1.5 text-xs text-neutral-500">{m.role}</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
