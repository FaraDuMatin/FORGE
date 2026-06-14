import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { Link } from "@/i18n/navigation";
import { VotePanel } from "@/components/pc/VotePanel";
import { loadPeoplesChoice, votedProjectIds, type PCCandidate } from "@/server/peopleschoice";

// Live: the holder and counts change with every vote.
export const dynamic = "force-dynamic";

export default async function PeoplesChoicePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { holder, candidates, threshold } = await loadPeoplesChoice();
  const voted = await votedProjectIds();

  return (
    <PeoplesChoiceView holder={holder} candidates={candidates} threshold={threshold} votedIds={[...voted]} />
  );
}

function PeoplesChoiceView({
  holder,
  candidates,
  threshold,
  votedIds,
}: {
  holder: PCCandidate | null;
  candidates: PCCandidate[];
  threshold: number;
  votedIds: string[];
}) {
  const t = useTranslations("pc");
  const voted = new Set(votedIds);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">{t("eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-3 max-w-2xl text-neutral-600 dark:text-neutral-400">{t("lead")}</p>

        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-600">{t("holderHeading")}</h2>
          {holder ? (
            <div className="mt-3">
              <CandidateCard candidate={holder} hasVoted={false} votable={false} highlight />
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
              {t("noHolder", { n: threshold })}
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{t("eligibleHeading")}</h2>
          {candidates.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-500">{t("noneEligible")}</p>
          ) : (
            <div className="mt-3 space-y-4">
              {candidates.map((c) => (
                <CandidateCard key={c.id} candidate={c} hasVoted={voted.has(c.id)} votable />
              ))}
            </div>
          )}
        </section>

        <section className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">{t("explainerHeading")}</h2>
          <p className="mt-2 text-sm text-neutral-500">{t("explainer", { n: threshold })}</p>
        </section>
      </main>
    </>
  );
}

function CandidateCard({
  candidate,
  hasVoted,
  votable,
  highlight = false,
}: {
  candidate: PCCandidate;
  hasVoted: boolean;
  votable: boolean;
  highlight?: boolean;
}) {
  const t = useTranslations("pc");
  const extra = candidate.votes - candidate.voterNames.length;

  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950"
          : "border-neutral-200 dark:border-neutral-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/p/${candidate.slug}`} className="font-medium hover:underline">
            {candidate.title}
          </Link>
          <p className="mt-0.5 text-sm text-neutral-500">{candidate.city}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          {t("votes", { n: candidate.votes })}
        </span>
      </div>

      {candidate.voterNames.length > 0 ? (
        <p className="mt-2 text-xs text-neutral-500">
          {extra > 0
            ? t("votersMore", { names: candidate.voterNames.join(", "), n: extra })
            : t("votersLine", { names: candidate.voterNames.join(", ") })}
        </p>
      ) : null}

      {votable ? (
        <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <VotePanel projectId={candidate.id} slug={candidate.slug} hasVoted={hasVoted} />
        </div>
      ) : null}
    </div>
  );
}
