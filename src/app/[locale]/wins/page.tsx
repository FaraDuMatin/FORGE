import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { StubPage } from "@/components/StubPage";

export default async function Wins({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WinsContent />;
}

function WinsContent() {
  const t = useTranslations("wins");
  return <StubPage title={t("title")} sub={t("sub")} soon={t("soon")} />;
}
