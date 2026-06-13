import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { StubPage } from "@/components/StubPage";

export default async function NewProject({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NewProjectContent />;
}

function NewProjectContent() {
  const t = useTranslations("new");
  return <StubPage title={t("title")} sub={t("sub")} soon={t("soon")} />;
}
