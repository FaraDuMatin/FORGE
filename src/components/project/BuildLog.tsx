import { useTranslations } from "next-intl";

type LogEntry = { id: string; authorName: string; text: string; createdAt: Date };

// The public build log: what the crew did and why, newest first. Open by default,
// the way an open-source project's commit history is.
export function BuildLog({ entries }: { entries: LogEntry[] }) {
  const t = useTranslations("log");
  return (
    <section>
      <h2 className="text-lg font-semibold">{t("heading")}</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">{t("empty")}</p>
      ) : (
        <ol className="mt-3 space-y-4">
          {entries.map((e) => (
            <li key={e.id} className="border-l-2 border-neutral-200 pl-4 dark:border-neutral-800">
              <div className="flex items-baseline gap-2 text-xs text-neutral-500">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{e.authorName}</span>
                <time dateTime={e.createdAt.toISOString()}>{e.createdAt.toISOString().slice(0, 10)}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800 dark:text-neutral-200">{e.text}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
