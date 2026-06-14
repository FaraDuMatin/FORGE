import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/Header";
import { YourProjects } from "@/components/project/YourProjects";
import { ResumeForm } from "@/components/project/ResumeForm";

export default async function MePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <MeContent />;
}

function MeContent() {
  const t = useTranslations("me");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-6 py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t("sub")}</p>
        </div>
        <YourProjects heading={t("yourProjectsHeading")} />
        <ResumeForm />
      </main>
    </>
  );
}
