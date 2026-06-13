import { poolConfig } from "@/lib/pools";
import type { Pool } from "@/generated/prisma/client";

// Inputs the readiness check needs. Kept as a plain shape so it can be computed
// from a DB row + counts without dragging Prisma types through the UI.
export type ReadinessInput = {
  pool: Pool;
  goal: string;
  city: string;
  openTaskCount: number;
  hasBuildLogEntry: boolean;
  crewCount: number;
  namedRoleCount: number;
  hasSuccessor: boolean;
  fundingUrl?: string | null;
};

export type ReadinessBar = { key: string; met: boolean };

// Universal bars + tiered bars. Returns each bar so /new can render a live
// checklist. READY = every bar met.
export function readiness(input: ReadinessInput): { bars: ReadinessBar[]; ready: boolean } {
  const cfg = poolConfig(input.pool);
  const bars: ReadinessBar[] = [
    { key: "ready.goal", met: input.goal.trim().length > 0 },
    { key: "ready.city", met: input.city.trim().length > 0 },
    { key: "ready.tasks", met: input.openTaskCount >= 3 },
    { key: "ready.log", met: input.hasBuildLogEntry },
    { key: "ready.crew", met: input.crewCount >= cfg.minCrew },
  ];
  if (cfg.namedRoles > 0) {
    bars.push({ key: "ready.roles", met: input.namedRoleCount >= cfg.namedRoles });
  }
  if (cfg.needsSuccessor) {
    bars.push({ key: "ready.successor", met: input.hasSuccessor });
  }
  // Funding bar only applies when the project declares costs (has a funding URL field
  // in play). For the longest pool it is required if costs exist.
  if (cfg.needsFundingIfCosts && input.fundingUrl !== undefined) {
    bars.push({ key: "ready.funding", met: !input.fundingUrl || input.fundingUrl.trim().length > 0 });
  }
  return { bars, ready: bars.every((b) => b.met) };
}
