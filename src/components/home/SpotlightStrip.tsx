import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cardSurface } from "@/lib/cardStyle";
import type { SpotlightCard } from "@/lib/home";

// A short, friendly taste of what's live now — a few spotlight cards with a link
// to the full /spotlight page. Keeps the home page light.
export function SpotlightStrip({ cards }: { cards: SpotlightCard[] }) {
  const t = useTranslations("home");

  return (
    <section className="mt-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{t("spotlightHeading")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("spotlightSub")}</p>
        </div>
        <Link href="/spotlight" className="shrink-0 text-sm text-emerald-600 hover:underline">
          {t("browseSpotlights")} →
        </Link>
      </div>

      {cards.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">{t("spotlightEmpty")}</p>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link key={c.slug} href={`/p/${c.slug}`} className={`flex flex-col ${cardSurface("SPOTLIGHT", c.isPeoplesChoice)}`}>
              <span className="font-medium">{c.title}</span>
              <span className="mt-1 text-sm text-neutral-500">{c.city}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
