import { useTranslations } from "next-intl";
import { poolConfig } from "@/lib/pools";
import type { ReadinessBar } from "@/lib/readiness";
import type { Pool } from "@/generated/prisma/client";

// Labels a readiness bar, injecting the pool's numeric targets for crew/roles.
function useBarLabel(pool: Pool) {
  const t = useTranslations("readiness");
  const cfg = poolConfig(pool);
  return (key: string): string => {
    switch (key) {
      case "ready.goal": return t("goal");
      case "ready.city": return t("city");
      case "ready.tasks": return t("tasks");
      case "ready.log": return t("log");
      case "ready.crew": return t("crew", { n: cfg.minCrew });
      case "ready.roles": return t("roles", { n: cfg.namedRoles });
      case "ready.successor": return t("successor");
      case "ready.funding": return t("funding");
      default: return key;
    }
  };
}

// The readiness checklist with met/unmet marks. Shown on a queued project so the
// crew can see exactly what is left before it can take a spotlight slot.
export function ReadinessChecklist({ pool, bars }: { pool: Pool; bars: ReadinessBar[] }) {
  const label = useBarLabel(pool);
  return (
    <ul className="space-y-1.5">
      {bars.map((bar) => (
        <li key={bar.key} className="flex items-start gap-2 text-sm">
          <span aria-hidden className={bar.met ? "text-emerald-600" : "text-neutral-400"}>
            {bar.met ? "●" : "○"}
          </span>
          <span className={bar.met ? "text-neutral-500 line-through" : "text-neutral-800 dark:text-neutral-200"}>
            {label(bar.key)}
          </span>
        </li>
      ))}
    </ul>
  );
}
