import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { NewProjectForm } from "@/components/project/NewProjectForm";

export default async function NewProject({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NewProjectContent />;
}

function NewProjectContent() {
  const t = useTranslations("new");
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>
        <div className="mt-8">
          <NewProjectForm />
        </div>
      </main>
    </>
  );
}
