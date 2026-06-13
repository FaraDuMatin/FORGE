import type { Pool } from "@/generated/prisma/client";

// Tiered readiness bars. Fixed bars equalize (any crew that meets them is in the
// running); rankings would stratify, so we never rank. Longer pools demand more
// structure (roles, a named successor, a funding link) because they ask more of a
// community. 3 spotlight slots per pool + 1 People's Choice = 13 slots total.
export const SLOTS_PER_POOL = 3;

export type PoolConfig = {
  pool: Pool;
  labelKey: string; // i18n key
  minCrew: number;
  namedRoles: number; // roles required beyond the maintainer
  needsSuccessor: boolean;
  needsFundingIfCosts: boolean;
};

export const POOLS: PoolConfig[] = [
  { pool: "WEEK", labelKey: "pool.week", minCrew: 5, namedRoles: 0, needsSuccessor: false, needsFundingIfCosts: false },
  { pool: "MONTH", labelKey: "pool.month", minCrew: 8, namedRoles: 2, needsSuccessor: false, needsFundingIfCosts: false },
  { pool: "HALF_YEAR", labelKey: "pool.halfYear", minCrew: 12, namedRoles: 3, needsSuccessor: true, needsFundingIfCosts: false },
  { pool: "YEAR", labelKey: "pool.year", minCrew: 15, namedRoles: 4, needsSuccessor: true, needsFundingIfCosts: true },
];

export function poolConfig(pool: Pool): PoolConfig {
  const cfg = POOLS.find((p) => p.pool === pool);
  if (!cfg) throw new Error(`unknown pool ${pool}`);
  return cfg;
}
