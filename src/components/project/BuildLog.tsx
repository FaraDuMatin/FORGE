import { useTranslations } from "next-intl";
import { renderMarkdown } from "@/lib/markdown";

type LogEntry = { id: string; authorName: string; text: string; createdAt: Date };

export function BuildLog({ entries }: { entries: LogEntry[] }) {
  const t = useTranslations("log");
  return (
    <section>
      <h2 className="text-lg font-semibold">{t("heading")}</h2>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">{t("empty")}</p>
      ) : (
        <ol className="mt-4 space-y-5">
          {entries.map((e) => (
            <li key={e.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-2 flex items-baseline gap-2 text-xs text-neutral-500">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{e.authorName}</span>
                <time dateTime={e.createdAt.toISOString()}>
                  {e.createdAt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                </time>
              </div>
              <div
                className="md-body"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(e.text) }}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
