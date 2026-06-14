import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PCCandidate } from "@/server/peopleschoice";

// The People's Choice band, featured high on the home page (was buried before).
// One loud card for the current holder, or an invitation to vote when the slot
// is open.
export function PeoplesChoiceFeature({ holder }: { holder: PCCandidate | null }) {
  const t = useTranslations("home");

  return (
    <section className="mt-10">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{t("peoplesChoice")}</h2>

      {holder ? (
        <Link
          href={`/p/${holder.slug}`}
          className="mt-3 block rounded-2xl border border-neutral-200 bg-white bg-[radial-gradient(ellipse_45%_60%_at_100%_0%,rgba(16,185,129,0.14),transparent)] p-6 shadow-sm ring-1 ring-emerald-500/15 transition hover:ring-emerald-400/40 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <span className="inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
            {t("pcBadge")}
          </span>
          <p className="mt-3 text-2xl font-bold tracking-tight">{holder.title}</p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-300">{holder.city}</p>
          <p className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            {t("pcVotes", { n: holder.votes })}
          </p>
        </Link>
      ) : (
        <Link
          href="/pc"
          className="mt-3 block rounded-2xl border border-dashed border-emerald-400 p-6 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          <p className="text-lg font-semibold">{t("pcEmptyTitle")}</p>
          <p className="mt-1 text-sm">{t("pcVoteNow")}</p>
        </Link>
      )}

      <Link href="/pc" className="mt-2 inline-block text-sm text-emerald-600 hover:underline">
        {t("pcSeeAll")} →
      </Link>
    </section>
  );
}
