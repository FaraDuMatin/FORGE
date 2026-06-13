"use client";

import { useTranslations } from "next-intl";
import { poolConfig } from "@/lib/pools";
import type { Pool } from "@/generated/prisma/client";

// The live readiness checklist: what a project in the chosen pool must reach to
// be eligible for a spotlight slot. Pure display from poolConfig, so it updates
// instantly as the pool select changes — no server round-trip.
export function PoolRequirements({ pool }: { pool: Pool }) {
  const t = useTranslations("readiness");
  const cfg = poolConfig(pool);

  const items: string[] = [
    t("goal"),
    t("city"),
    t("tasks"),
    t("log"),
    t("crew", { n: cfg.minCrew }),
  ];
  if (cfg.namedRoles > 0) items.push(t("roles", { n: cfg.namedRoles }));
  if (cfg.needsSuccessor) items.push(t("successor"));
  if (cfg.needsFundingIfCosts) items.push(t("funding"));

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <p className="mt-1 text-xs text-neutral-500">{t("sub")}</p>
      <ul className="mt-3 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
            <span aria-hidden className="mt-0.5 text-neutral-400">○</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
