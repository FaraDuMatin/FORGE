import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { WinsClient } from "@/components/wins/WinsClient";
import { searchWins } from "@/server/wins";
import { parseWinsQuery, type WinsQuery, type WinsResult } from "@/lib/wins";

export const dynamic = "force-dynamic";

export default async function Wins({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = parseWinsQuery(await searchParams);
  const result = await searchWins(query);
  return <WinsContent query={query} result={result} />;
}

function WinsContent({ query, result }: { query: WinsQuery; result: WinsResult }) {
  const t = useTranslations("wins");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>
        <WinsClient initial={result} initialQuery={query} />
      </main>
    </>
  );
}
