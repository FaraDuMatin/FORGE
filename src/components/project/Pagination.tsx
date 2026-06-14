import { useTranslations } from "next-intl";

// Prev/next pager. Presentational: it reports the page it wants via onPage; the
// owner (ProjectsClient) refetches and keeps the URL in sync. Stays in the client
// tree so paging never triggers a route re-render.
export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const t = useTranslations("directory");
  if (totalPages <= 1) return null;

  const base = "rounded-full border px-4 py-1.5 text-sm transition";
  const enabled = "border-neutral-300 hover:border-emerald-500 dark:border-neutral-700";
  const disabled = "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-700";

  return (
    <nav className="mt-8 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className={`${base} ${page <= 1 ? disabled : enabled}`}
      >
        ← {t("prev")}
      </button>
      <span className="text-sm text-neutral-500">{t("pageOf", { page, total: totalPages })}</span>
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className={`${base} ${page >= totalPages ? disabled : enabled}`}
      >
        {t("next")} →
      </button>
    </nav>
  );
}
