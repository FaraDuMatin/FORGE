import { prisma } from "@/lib/db";
import { readiness, type ReadinessResult } from "@/lib/readiness";
import type { Pool, Prisma } from "@/generated/prisma/client";

// Bridges stored rows + counts to the pure readiness() check. Readiness is never
// a stored flag: it is recomputed from current data so it can never drift.

const baseSelect = {
  id: true,
  pool: true,
  goal: true,
  city: true,
  successorName: true,
  successorEmail: true,
  fundingUrl: true,
} as const;

type BaseRow = {
  id: string;
  pool: Pool;
  goal: string;
  city: string;
  successorName: string | null;
  successorEmail: string | null;
  fundingUrl: string | null;
};

function toInput(row: BaseRow, openTaskCount: number, crewCount: number, namedRoleCount: number, hasBuildLogEntry: boolean) {
  return {
    pool: row.pool,
    goal: row.goal,
    city: row.city,
    openTaskCount,
    hasBuildLogEntry,
    crewCount,
    namedRoleCount,
    hasSuccessor: Boolean(row.successorName && row.successorEmail),
    // undefined (not null) signals "no costs declared" so the funding bar is skipped.
    fundingUrl: row.fundingUrl ?? undefined,
  };
}

// One project, for the detail/create pages. Returns the per-bar checklist too.
export async function loadProjectReadiness(projectId: string): Promise<ReadinessResult> {
  const row = await prisma.project.findUnique({ where: { id: projectId }, select: baseSelect });
  if (!row) return { bars: [], ready: false };
  const [openTaskCount, crewCount, namedRoleCount, updateCount] = await Promise.all([
    prisma.task.count({ where: { projectId, status: "OPEN" } }),
    prisma.member.count({ where: { projectId } }),
    prisma.member.count({ where: { projectId, role: { not: null } } }),
    prisma.update.count({ where: { projectId } }),
  ]);
  return readiness(toInput(row, openTaskCount, crewCount, namedRoleCount, updateCount > 0));
}

// Core: the subset of QUEUED projects matching `where` that meet their bars.
// Batched (no N+1) so it scales with the matched set, not the whole table.
async function readyIdsWhere(where: Prisma.ProjectWhereInput): Promise<Set<string>> {
  const rows = await prisma.project.findMany({
    where: { ...where, status: "QUEUED", isPeoplesChoice: false },
    select: { ...baseSelect, _count: { select: { members: true, updates: true } } },
  });
  if (rows.length === 0) return new Set();

  const ids = rows.map((r) => r.id);
  const [openTasks, namedRoles] = await Promise.all([
    prisma.task.groupBy({ by: ["projectId"], where: { projectId: { in: ids }, status: "OPEN" }, _count: { _all: true } }),
    prisma.member.groupBy({ by: ["projectId"], where: { projectId: { in: ids }, role: { not: null } }, _count: { _all: true } }),
  ]);
  const openByProject = new Map(openTasks.map((g) => [g.projectId, g._count._all]));
  const rolesByProject = new Map(namedRoles.map((g) => [g.projectId, g._count._all]));

  const ready = new Set<string>();
  for (const r of rows) {
    const result = readiness(
      toInput(r, openByProject.get(r.id) ?? 0, r._count.members, rolesByProject.get(r.id) ?? 0, r._count.updates > 0),
    );
    if (result.ready) ready.add(r.id);
  }
  return ready;
}

// All ready-and-waiting QUEUED projects in a pool. Feeds the allocation engine.
export function computeReadyIds(pool: Pool): Promise<Set<string>> {
  return readyIdsWhere({ pool });
}

// Which of these specific projects are ready. Used by the paginated directory so
// readiness is computed only for the rows on the current page, never the whole table.
export function readyIdsAmong(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return Promise.resolve(new Set());
  return readyIdsWhere({ id: { in: ids } });
}
