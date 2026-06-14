import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitch } from "./LocaleSwitch";

export function Header() {
  const t = useTranslations("nav");
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
        <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" priority />
        FORGE
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/projects" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          {t("projects")}
        </Link>
        <Link href="/pc" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          {t("pc")}
        </Link>
        <Link href="/wins" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white">
          {t("wins")}
        </Link>
        <Link
          href="/new"
          className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {t("start")}
        </Link>
        <LocaleSwitch />
      </nav>
    </header>
  );
}
