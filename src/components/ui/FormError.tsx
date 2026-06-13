"use client";

import { useTranslations } from "next-intl";

// Renders an action's error code (e.g. "task.joinFirst") through the i18n
// "errors" namespace. Dotted codes resolve into nested message keys.
export function FormError({ code }: { code?: string }) {
  const t = useTranslations("errors");
  if (!code) return null;
  return <p className="text-sm text-red-600 dark:text-red-400">{t(code)}</p>;
}

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>;
}
