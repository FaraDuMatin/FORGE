"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { renderMarkdown } from "@/lib/markdown";

type LogEntry = { id: string; authorName: string; text: string; createdAt: Date };

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function Entry({ e }: { e: LogEntry }) {
  return (
    <li className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-baseline gap-2 text-xs text-neutral-500">
        <span className="font-semibold text-neutral-800 dark:text-neutral-200">{e.authorName}</span>
        <time dateTime={e.createdAt.toISOString()}>{fmtDate(e.createdAt)}</time>
      </div>
      <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(e.text) }} />
    </li>
  );
}

export function BuildLogPreview({ entries }: { entries: LogEntry[] }) {
  const t = useTranslations("log");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section>
      <h2 className="text-lg font-semibold">{t("heading")}</h2>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">{t("empty")}</p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group mt-4 block w-full rounded-xl border border-neutral-200 p-1 text-left transition hover:border-emerald-400 dark:border-neutral-800 dark:hover:border-emerald-700"
        >
          {/* Latest entry, capped with a fade */}
          <div className="relative max-h-44 overflow-hidden rounded-lg p-3">
            <div className="mb-2 flex items-baseline gap-2 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">{entries[0].authorName}</span>
              <time dateTime={entries[0].createdAt.toISOString()}>{fmtDate(entries[0].createdAt)}</time>
            </div>
            <div className="md-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(entries[0].text) }} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-b from-transparent to-white dark:to-neutral-950" />
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-neutral-500">{t("seeAll", { n: entries.length })}</span>
            <span className="font-medium text-emerald-700 transition group-hover:translate-x-0.5 dark:text-emerald-400">
              {t("open")} →
            </span>
          </div>
        </button>
      )}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-950 sm:rounded-2xl"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
              <h3 className="text-base font-semibold">{t("heading")}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("close")}
                className="rounded-md px-2 py-1 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                ✕
              </button>
            </div>
            <ol className="space-y-4 overflow-y-auto p-5">
              {entries.map((e) => (
                <Entry key={e.id} e={e} />
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </section>
  );
}
