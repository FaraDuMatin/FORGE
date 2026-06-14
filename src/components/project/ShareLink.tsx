"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, QrCode } from "lucide-react";

// Copy or QR the public project URL. The link is the whole onboarding flow — no
// accounts, you share a URL and people join from it. The QR is great in person:
// print it, stick it on a community board, scan to join. Hidden until asked, so
// reading the URL lazily (client-only) can't cause a hydration mismatch.
export function ShareLink() {
  const t = useTranslations("share");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [url] = useState(() => (typeof window !== "undefined" ? window.location.href : ""));

  async function copy() {
    if (typeof window === "undefined") return;
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 font-medium text-neutral-800 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
        >
          {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
          {copied ? t("copied") : t("copy")}
        </button>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-300 px-3 py-1.5 font-medium text-neutral-800 transition hover:border-emerald-500 hover:text-emerald-700 dark:border-neutral-700 dark:text-neutral-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
        >
          <QrCode size={16} />
          {showQr ? t("hideQr") : t("qr")}
        </button>
      </div>
      {showQr && url ? (
        <div className="mt-3 inline-block rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800">
          <QRCodeSVG value={url} size={160} />
        </div>
      ) : null}
    </div>
  );
}
