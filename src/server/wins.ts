import { prisma } from "@/lib/db";
import type { Pool } from "@/generated/prisma/client";

// The win wall ("Grow"): finished projects become playbooks any city can copy.
// Fork credit = how far each playbook travelled, counted in distinct cities.

export type WinItem = {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  pool: Pool;
  outcome: string | null;
  forkCities: number; // distinct cities among all descendants (any status)
};

// Normalize a city so "Lisbon" and " lisbon " count once.
function cityKey(city: string): string {
  return city.trim().toLowerCase();
}

// Count distinct descendant cities for each of the given source ids in one query.
async function forkCitiesBySource(sourceIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (sourceIds.length === 0) return out;
  const forks = await prisma.project.findMany({
    where: { clonedFrom: { in: sourceIds } },
    select: { clonedFrom: true, city: true },
  });
  const sets = new Map<string, Set<string>>();
  for (const f of forks) {
    if (!f.clonedFrom) continue;
    const set = sets.get(f.clonedFrom) ?? new Set<string>();
    set.add(cityKey(f.city));
    sets.set(f.clonedFrom, set);
  }
  for (const [id, set] of sets) out.set(id, set.size);
  return out;
}

// Every finished project, newest-closed first, with its fork-credit count.
export async function listWins(): Promise<WinItem[]> {
  const wins = await prisma.project.findMany({
    where: { status: "CLOSED" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, slug: true, title: true, city: true, country: true, pool: true, outcome: true,
    },
  });
  const credit = await forkCitiesBySource(wins.map((w) => w.id));
  return wins.map((w) => ({ ...w, forkCities: credit.get(w.id) ?? 0 }));
}

export type Lineage = {
  source: { slug: string; title: string } | null; // the playbook this was forked from
  forkCities: number; // distinct cities this project has been forked into
};

// Lineage for one project's detail page: where it came from, how far it spread.
export async function getLineage(projectId: string, clonedFrom: string | null): Promise<Lineage> {
  const [source, credit] = await Promise.all([
    clonedFrom
      ? prisma.project.findUnique({ where: { id: clonedFrom }, select: { slug: true, title: true } })
      : Promise.resolve(null),
    forkCitiesBySource([projectId]),
  ]);
  return { source: source ?? null, forkCities: credit.get(projectId) ?? 0 };
}

// Source data to prefill the new-project form when forking a playbook.
export async function getForkSource(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    select: { id: true, title: true, goal: true, pool: true, status: true },
  });
}
