import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { ProjectsClient } from "@/components/project/ProjectsClient";
import { searchProjects, getDirectoryGroups } from "@/server/directory";
import { parseDirectoryQuery, type DirectoryGroup, type DirectoryQuery, type DirectoryResult } from "@/lib/directory";

export const dynamic = "force-dynamic";

function isBrowse(q: DirectoryQuery): boolean {
  return !q.q && !q.pool && !q.stage;
}

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
  // Always load the grouped previews (so clearing a search returns instantly) and,
  // when a search/filter is active, the flat results for that query.
  const [groups, result] = await Promise.all([
    getDirectoryGroups(),
    isBrowse(query) ? Promise.resolve(null) : searchProjects(query),
  ]);

  return <Directory groups={groups} result={result} query={query} />;
}

function Directory({
  groups,
  result,
  query,
}: {
  groups: DirectoryGroup[];
  result: DirectoryResult | null;
  query: DirectoryQuery;
}) {
  const t = useTranslations("directory");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>
        <ProjectsClient groups={groups} initial={result} initialQuery={query} />
      </main>
    </>
  );
}
