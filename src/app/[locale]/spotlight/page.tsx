import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { POOLS, SLOTS_PER_POOL } from "@/lib/pools";
import { getSpotlights, type SpotlightCard } from "@/lib/home";
import { loadPeoplesChoice, type PCCandidate } from "@/server/peopleschoice";
import { cardSurface } from "@/lib/cardStyle";
import type { Pool } from "@/generated/prisma/client";

// Live slot state; never statically cached.
export const dynamic = "force-dynamic";

export default async function SpotlightPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { byPool } = await getSpotlights();
  const { holder } = await loadPeoplesChoice();
  return <SpotlightContent byPool={byPool} holder={holder} />;
}

function SpotlightContent({
  byPool,
  holder,
}: {
  byPool: Record<Pool, SpotlightCard[]>;
  holder: PCCandidate | null;
}) {
  const t = useTranslations("spotlight");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 max-w-2xl text-neutral-600 dark:text-neutral-400">{t("sub")}</p>

        <div className="mt-10 space-y-10">
          {POOLS.map((p) => (
            <PoolSection key={p.pool} labelKey={p.labelKey} cards={byPool[p.pool] ?? []} />
          ))}
          <PeoplesChoiceSlot holder={holder} />
        </div>
      </main>
    </>
  );
}

function PoolSection({ labelKey, cards }: { labelKey: string; cards: SpotlightCard[] }) {
  const t = useTranslations();
  const slots = Array.from({ length: SLOTS_PER_POOL });
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{t(labelKey)}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {slots.map((_, i) => (cards[i] ? <FilledSlot key={i} card={cards[i]} /> : <OpenSlot key={i} />))}
      </div>
    </section>
  );
}

function FilledSlot({ card }: { card: SpotlightCard }) {
  return (
    <Link href={`/p/${card.slug}`} className={`flex flex-col ${cardSurface("SPOTLIGHT", card.isPeoplesChoice)}`}>
      <span className="font-medium">{card.title}</span>
      <span className="mt-1 text-sm text-neutral-500">{card.city}</span>
    </Link>
  );
}

function OpenSlot() {
  const t = useTranslations("home");
  return (
    <div className="flex flex-col rounded-xl border border-dashed border-neutral-300 p-4 text-neutral-400 dark:border-neutral-700">
      <span className="font-medium">{t("openSlot")}</span>
      <span className="mt-1 text-sm">{t("openSlotHint")}</span>
    </div>
  );
}

function PeoplesChoiceSlot({ holder }: { holder: PCCandidate | null }) {
  const t = useTranslations("home");
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-600">{t("peoplesChoice")}</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {holder ? (
          <Link href={`/p/${holder.slug}`} className={`flex flex-col ${cardSurface("SPOTLIGHT", true)}`}>
            <span className="font-medium">{holder.title}</span>
            <span className="mt-1 text-sm text-neutral-500">{holder.city}</span>
            <span className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {t("pcVotes", { n: holder.votes })}
            </span>
          </Link>
        ) : (
          <Link
            href="/pc"
            className="flex flex-col rounded-xl border border-dashed border-emerald-400 p-4 text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
          >
            <span className="font-medium">{t("peoplesChoice")}</span>
            <span className="mt-1 text-sm">{t("pcVoteNow")}</span>
          </Link>
        )}
        <div className="self-center text-sm text-neutral-500 sm:col-span-2">
          <p>{t("peoplesChoiceHint")}</p>
          <Link href="/pc" className="mt-1 inline-block text-emerald-600 hover:underline">
            {t("pcSeeAll")} →
          </Link>
        </div>
      </div>
    </section>
  );
}
