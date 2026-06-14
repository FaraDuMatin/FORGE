import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cardSurface } from "@/lib/cardStyle";
import type { WinItem } from "@/lib/wins";
import type { Pool } from "@/generated/prisma/client";

function poolLabelKey(pool: Pool): string {
  return `pool.${{ WEEK: "week", MONTH: "month", HALF_YEAR: "halfYear", YEAR: "year" }[pool]}`;
}

// One finished playbook.
// - "featured" (the top recent, shown in a narrow grid): spotlight glow, larger
//   title, footer always stacked with a small auto-width button (the column is
//   too narrow for a side-by-side row).
// - "list" (the wide single-column archive): footer is a row on desktop (status
//   left, button bottom-right) and stacks full-width on mobile.
export function WinCard({ win, variant = "list" }: { win: WinItem; variant?: "featured" | "list" }) {
  const t = useTranslations("wins");
  const tk = useTranslations();
  const featured = variant === "featured";

  const surface = featured
    ? cardSurface("SPOTLIGHT")
    : "rounded-xl border border-neutral-200 p-5 transition hover:border-emerald-400 dark:border-neutral-800";

  const button = (
    <Link
      href={`/new?from=${win.slug}`}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 ${
        featured ? "" : "w-full sm:w-auto"
      }`}
    >
      {t("forkCta")}
    </Link>
  );

  return (
    <div className={`flex h-full flex-col ${surface}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {t("finished")}
        </span>
        <span>{tk(poolLabelKey(win.pool))}</span>
        <span aria-hidden>·</span>
        <span>{win.city}, {win.country}</span>
      </div>

      <Link href={`/p/${win.slug}`} className="mt-2 block">
        <h2 className={`font-semibold tracking-tight hover:text-emerald-700 dark:hover:text-emerald-400 ${featured ? "text-xl" : "text-lg"}`}>
          {win.title}
        </h2>
      </Link>

      {win.outcome ? (
        <p className="mt-2 line-clamp-3 text-sm text-neutral-700 dark:text-neutral-300">{win.outcome}</p>
      ) : null}

      {featured ? (
        <div className="mt-auto flex flex-col items-start gap-2 pt-4">
          <span className="text-xs text-neutral-500">
            {win.forkCities > 0 ? t("copiedIn", { n: win.forkCities }) : t("notYetCopied")}
          </span>
          {button}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-neutral-500">
            {win.forkCities > 0 ? t("copiedIn", { n: win.forkCities }) : t("notYetCopied")}
          </span>
          {button}
        </div>
      )}
    </div>
  );
}
