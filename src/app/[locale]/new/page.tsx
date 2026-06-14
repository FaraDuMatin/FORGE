import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { NewProjectForm, type ForkPrefill } from "@/components/project/NewProjectForm";
import { getForkSource } from "@/server/wins";

export default async function NewProject({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { locale } = await params;
  const { from } = await searchParams;
  setRequestLocale(locale);

  // Forking a playbook: prefill from the source if the slug resolves.
  let fork: ForkPrefill | undefined;
  if (from) {
    const source = await getForkSource(from);
    if (source) {
      fork = {
        clonedFrom: source.id,
        sourceTitle: source.title,
        title: source.title,
        goal: source.goal,
        pool: source.pool,
      };
    }
  }

  return <NewProjectContent fork={fork} />;
}

function NewProjectContent({ fork }: { fork?: ForkPrefill }) {
  const t = useTranslations("new");
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>
        <div className="mt-8">
          <NewProjectForm fork={fork} />
        </div>
      </main>
    </>
  );
}
