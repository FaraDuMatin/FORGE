import { useTranslations } from "next-intl";

// Numbered pager: ← Prev  1 … 4 [5] 6 … 10  Next →. Presentational — reports the
// page it wants via onPage; the owner (ProjectsClient / WinsClient) refetches and
// keeps the URL in sync, so paging never triggers a route re-render. Shared by the
// directory and the win wall.
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

  const arrow = "rounded-full border px-3 py-1.5 text-sm transition";
  const enabled = "border-neutral-300 hover:border-emerald-500 dark:border-neutral-700";
  const disabled = "cursor-not-allowed border-neutral-200 text-neutral-300 dark:border-neutral-800 dark:text-neutral-700";

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label={t("pageOf", { page, total: totalPages })}>
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label={t("prev")}
        className={`${arrow} ${page <= 1 ? disabled : enabled}`}
      >
        ←
      </button>

      {pageWindow(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={t("gotoPage", { page: p })}
            className={`min-w-9 rounded-full border px-3 py-1.5 text-sm transition ${
              p === page
                ? "border-emerald-600 bg-emerald-600 font-semibold text-white"
                : "border-neutral-300 hover:border-emerald-500 dark:border-neutral-700"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        aria-label={t("next")}
        className={`${arrow} ${page >= totalPages ? disabled : enabled}`}
      >
        →
      </button>
    </nav>
  );
}

// Windowed page list: always first + last, a window around the current page, and
// "…" for the gaps. e.g. (5, 10) -> [1, …, 4, 5, 6, …, 10].
function pageWindow(page: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}
