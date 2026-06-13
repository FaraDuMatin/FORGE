"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Copy the public project URL. The link is the whole onboarding flow — no
// accounts, you share a URL and people join from it.
export function ShareLink() {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="text-sm text-neutral-600 underline-offset-2 hover:underline dark:text-neutral-400"
    >
      {copied ? t("copied") : t("copy")}
    </button>
  );
}
