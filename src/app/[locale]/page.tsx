import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { POOLS, SLOTS_PER_POOL } from "@/lib/pools";
import { getSpotlights, type SpotlightCard } from "@/lib/home";

// Spotlights are live data; render fresh, never statically cache the slot state.
export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { byPool, peoplesChoice } = await getSpotlights();

  return (
    <>
      <Header />
      <Hero />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-20">
        <SpotlightHeading />
        <div className="space-y-10">
          {POOLS.map((p) => (
            <PoolSection key={p.pool} labelKey={p.labelKey} cards={byPool[p.pool]} />
          ))}
          <PeoplesChoiceSection card={peoplesChoice} />
        </div>
        <WinWallTeaser />
      </main>
    </>
  );
}

function Hero() {
  const t = useTranslations("home");
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-16 pb-12">
      <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
        {t("tagline")}
      </p>
      <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
        {t("lead")}
      </h1>
      <Link
        href="/new"
        className="mt-8 inline-block rounded-full bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
      >
        {t("startCta")}
      </Link>
    </section>
  );
}

function SpotlightHeading() {
  const t = useTranslations("home");
  return (
    <div className="mb-8 border-t border-neutral-200 pt-10 dark:border-neutral-800">
      <h2 className="text-2xl font-semibold">{t("spotlightHeading")}</h2>
      <p className="mt-1 text-neutral-500">{t("spotlightSub")}</p>
    </div>
  );
}

function PoolSection({ labelKey, cards }: { labelKey: string; cards: SpotlightCard[] }) {
  const t = useTranslations();
  const slots = Array.from({ length: SLOTS_PER_POOL });
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t(labelKey)}
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {slots.map((_, i) =>
          cards[i] ? <FilledSlot key={i} card={cards[i]} /> : <OpenSlot key={i} />
        )}
      </div>
    </section>
  );
}

function FilledSlot({ card }: { card: SpotlightCard }) {
  return (
    <Link
      href={`/p/${card.slug}`}
      className="flex flex-col rounded-xl border border-neutral-200 p-4 transition hover:border-emerald-500 dark:border-neutral-800"
    >
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

function PeoplesChoiceSection({ card }: { card: SpotlightCard | null }) {
  const t = useTranslations("home");
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-600">
        {t("peoplesChoice")}
      </h3>
      <div className="grid gap-4 sm:grid-cols-3">
        {card ? <FilledSlot card={card} /> : <OpenSlot />}
        <p className="text-sm text-neutral-500 sm:col-span-2 self-center">
          {t("peoplesChoiceHint")}
        </p>
      </div>
    </section>
  );
}

function WinWallTeaser() {
  const t = useTranslations("home");
  return (
    <div className="mt-16 border-t border-neutral-200 pt-10 dark:border-neutral-800">
      <Link href="/wins" className="text-emerald-600 hover:underline">
        {t("winWallTeaser")} →
      </Link>
    </div>
  );
}
