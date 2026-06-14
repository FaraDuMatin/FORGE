"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

// Shown once after creation, succession handoff, or adoption. The manage URL (this
// page's URL, token included) is the only key to manage the project — there are no
// accounts to recover it. The variant picks the wording; the copy action is the same.
type Variant = "created" | "handoff" | "adopted";

const KEYS: Record<Variant, { heading: string; body: string }> = {
  created: { heading: "tokenHeading", body: "tokenBody" },
  handoff: { heading: "handoffHeading", body: "handoffBody" },
  adopted: { heading: "adoptedHeading", body: "adoptedBody" },
};

export function TokenReveal({ variant = "created" }: { variant?: Variant }) {
  const t = useTranslations("manage");
  const [copied, setCopied] = useState(false);
  const keys = KEYS[variant];

  async function copy() {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t(keys.heading)}</h2>
      <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">{t(keys.body)}</p>
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
