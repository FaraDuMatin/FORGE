import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/Header";
import { StartProjectCta } from "@/components/cta/StartProjectCta";
import { PeoplesChoiceFeature } from "@/components/home/PeoplesChoiceFeature";
import { SpotlightStrip } from "@/components/home/SpotlightStrip";
import { YourProjects } from "@/components/project/YourProjects";
import { POOLS } from "@/lib/pools";
import { getSpotlights, type SpotlightCard } from "@/lib/home";
import { loadPeoplesChoice } from "@/server/peopleschoice";
import { listWins } from "@/server/wins";

// Spotlights + votes are live; render fresh, never statically cache slot state.
export const dynamic = "force-dynamic";

const HOME_SPOTLIGHTS = 4;

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { byPool } = await getSpotlights();
  const { holder } = await loadPeoplesChoice();
  const wins = await listWins();

  const spotlights: SpotlightCard[] = POOLS.flatMap((p) => byPool[p.pool]).slice(0, HOME_SPOTLIGHTS);
  const finished = wins.length;
  const copies = wins.reduce((sum, w) => sum + w.forkCities, 0);

  return (
    <>
      <Header />
      <Hero />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pb-20">
        <WelcomeBack />
        <PeoplesChoiceFeature holder={holder} />
        <SpotlightStrip cards={spotlights} />
        <WinWallTeaser finished={finished} copies={copies} />
      </main>
    </>
  );
}

function Hero() {
  const t = useTranslations("home");
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-14 pb-6">
      <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">{t("tagline")}</p>
      <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{t("heroHeadline")}</h1>
      <p className="mt-4 max-w-xl text-base text-neutral-600 dark:text-neutral-400">{t("heroSub")}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <StartProjectCta label={t("startCta")} />
        <Link
          href="/projects"
          className="inline-block rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          {t("joinCta")}
        </Link>
      </div>
      <Link href="/me" className="mt-4 inline-block text-sm text-neutral-500 underline-offset-2 hover:text-emerald-600 hover:underline">
        {t("manageLink")} →
      </Link>
    </section>
  );
}

function WelcomeBack() {
  const t = useTranslations("home");
  // Renders nothing when this device remembers no projects.
  return (
    <div className="mt-6 empty:mt-0">
      <YourProjects heading={t("welcomeBack")} />
    </div>
  );
}

function WinWallTeaser({ finished, copies }: { finished: number; copies: number }) {
  const t = useTranslations("home");
  return (
    <div className="mt-16 border-t border-neutral-200 pt-10 dark:border-neutral-800">
      <Link href="/wins" className="text-emerald-600 hover:underline">
        {t("winsTeaser", { finished, copies })} →
      </Link>
    </div>
  );
}
