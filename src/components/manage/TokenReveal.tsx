"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Shown once after creation. The manage URL (this page's URL, token included) is
// the only key to manage the project — there are no accounts to recover it. Tell
// the maintainer to save it.
export function TokenReveal() {
  const t = useTranslations("manage");
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t("tokenHeading")}</h2>
      <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{t("tokenBody")}</p>
      <button
        type="button"
        onClick={copy}
        className="mt-3 rounded-md bg-amber-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
      >
        {copied ? t("tokenCopied") : t("tokenCopy")}
      </button>
    </div>
  );
}
