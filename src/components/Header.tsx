"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitch } from "./LocaleSwitch";
import { StartProjectCta } from "@/components/cta/StartProjectCta";

const LINKS = [
  { href: "/projects", key: "projects" },
  { href: "/spotlight", key: "spotlight" },
  { href: "/pc", key: "pc" },
  { href: "/wins", key: "wins" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="relative flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6 sm:py-4 dark:border-neutral-800">
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 text-lg font-bold tracking-tight"
      >
        <Image
          src="/newLogo.png"
          alt=""
          width={48}
          height={48}
          className="h-9 w-9 object-contain sm:h-11 sm:w-11"
          priority
        />
        FORGE
      </Link>

      {/* Desktop nav */}
      <nav className="hidden items-center gap-4 md:flex">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {t(l.key)}
          </Link>
        ))}
        <StartProjectCta label={t("start")} size="sm" />
        <LocaleSwitch />
      </nav>

      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100 md:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile panel */}
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-neutral-200 bg-white shadow-lg md:hidden dark:border-neutral-800 dark:bg-neutral-950">
          <nav className="flex flex-col px-4 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="border-b border-neutral-100 py-3 text-base text-neutral-700 dark:border-neutral-800/60 dark:text-neutral-300"
              >
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-3">
              <StartProjectCta label={t("start")} size="sm" block onClick={() => setOpen(false)} />
            </div>
            <div className="mt-3 pb-1">
              <LocaleSwitch />
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
