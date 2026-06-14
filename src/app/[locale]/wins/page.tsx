import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { listWins, type WinItem } from "@/server/wins";
import type { Pool } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

function poolLabelKey(pool: Pool): string {
  return `pool.${{ WEEK: "week", MONTH: "month", HALF_YEAR: "halfYear", YEAR: "year" }[pool]}`;
}

export default async function Wins({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const wins = await listWins();
  return <WinsContent wins={wins} />;
}

function WinsContent({ wins }: { wins: WinItem[] }) {
  const t = useTranslations("wins");
  const tk = useTranslations();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>

        {wins.length === 0 ? (
          <p className="mt-10 text-sm text-neutral-500">{t("empty")}</p>
        ) : (
          <ul className="mt-10 space-y-5">
            {wins.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {t("finished")}
                  </span>
                  <span>{tk(poolLabelKey(w.pool))}</span>
                  <span aria-hidden>·</span>
                  <span>{w.city}, {w.country}</span>
                </div>

                <Link href={`/p/${w.slug}`} className="mt-2 block">
                  <h2 className="text-lg font-semibold tracking-tight hover:text-emerald-700 dark:hover:text-emerald-400">
                    {w.title}
                  </h2>
                </Link>

                {w.outcome ? (
                  <p className="mt-2 line-clamp-3 text-sm text-neutral-700 dark:text-neutral-300">
                    {w.outcome}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-neutral-500">
                    {w.forkCities > 0 ? t("copiedIn", { n: w.forkCities }) : t("notYetCopied")}
                  </span>
                  <Link
                    href={`/new?from=${w.slug}`}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    {t("forkCta")}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
