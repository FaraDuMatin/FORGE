import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { ProjectsClient } from "@/components/project/ProjectsClient";
import { searchProjects } from "@/server/directory";
import { parseDirectoryQuery, type DirectoryQuery, type DirectoryResult } from "@/lib/directory";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);

  const query = parseDirectoryQuery(sp);
  // One flat, paginated list for every state. With no search/filter the default
  // order surfaces spotlights first and finished projects last (see orderSql).
  const result = await searchProjects(query);

  return <Directory result={result} query={query} />;
}

function Directory({
  result,
  query,
}: {
  result: DirectoryResult;
  query: DirectoryQuery;
}) {
  const t = useTranslations("directory");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>
        <ProjectsClient initial={result} initialQuery={query} />
      </main>
    </>
  );
}
