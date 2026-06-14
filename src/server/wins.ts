import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import type { ProjectStatus } from "@/generated/prisma/client";
import { prefixTsquery, searchClause, relevanceOrder } from "@/server/searchSql";
import {
  WINS_PAGE_SIZE,
  type WinItem,
  type WinsQuery,
  type WinsResult,
} from "@/lib/wins";

// The win wall ("Grow"): finished projects become playbooks any city can copy.
// Fork credit = how far each playbook travelled, counted in distinct cities.

export type { WinItem } from "@/lib/wins";

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

type WinRow = Omit<WinItem, "forkCities">;

// Searchable, sortable, paginated win wall. Same indexed full-text + fuzzy search
// as the directory (see searchSql.ts), scoped to CLOSED projects. Only one page of
// rows leaves the DB; fork credit is computed for that page alone — so it scales.
export async function searchWins(query: WinsQuery): Promise<WinsResult> {
  const pq = query.q ? prefixTsquery(query.q) : "";
  const where = query.q
    ? Prisma.sql`WHERE p.status = 'CLOSED' AND ${searchClause(query.q, pq)}`
    : Prisma.sql`WHERE p.status = 'CLOSED'`;
  const order = query.q
    ? Prisma.sql`${relevanceOrder(query.q, pq)} DESC, p."updatedAt" DESC`
    : query.sort === "oldest"
      ? Prisma.sql`p."updatedAt" ASC`
      : Prisma.sql`p."updatedAt" DESC`;
  const offset = (query.page - 1) * WINS_PAGE_SIZE;

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`SELECT count(*)::int AS count FROM "Project" p ${where}`,
    ),
    prisma.$queryRaw<WinRow[]>(Prisma.sql`
      SELECT p.id, p.slug, p.title, p.city, p.country, p.pool::text AS pool, p.outcome
      FROM "Project" p
      ${where}
      ORDER BY ${order}
      LIMIT ${WINS_PAGE_SIZE} OFFSET ${offset}
    `),
  ]);

  const total = countRows[0]?.count ?? 0;
  const credit = await forkCitiesBySource(rows.map((r) => r.id));
  const items: WinItem[] = rows.map((r) => ({ ...r, forkCities: credit.get(r.id) ?? 0 }));

  return { items, total, page: query.page, totalPages: Math.max(1, Math.ceil(total / WINS_PAGE_SIZE)), query };
}

export type ForkChild = { slug: string; title: string; city: string; status: ProjectStatus };

export type Lineage = {
  source: { slug: string; title: string } | null; // the playbook this was forked from
  forkCities: number; // distinct cities this project has been forked into
  forks: ForkChild[]; // the direct forks themselves
  forkTasksDone: number; // total DONE tasks across all direct forks
  forkUpdates: number; // total build-log entries across all direct forks
};

// Lineage for one project's detail page: where it came from, and the live state
// of every city that forked it — distinct cities, combined tasks done, combined
// build-log entries. One query over direct forks does both the count and the roll-up.
export async function getLineage(projectId: string, clonedFrom: string | null): Promise<Lineage> {
  const [source, forkRows] = await Promise.all([
    clonedFrom
      ? prisma.project.findUnique({ where: { id: clonedFrom }, select: { slug: true, title: true } })
      : Promise.resolve(null),
    prisma.project.findMany({
      where: { clonedFrom: projectId },
      orderBy: { createdAt: "asc" },
      select: {
        slug: true,
        title: true,
        city: true,
        status: true,
        tasks: { where: { status: "DONE" }, select: { id: true } },
        updates: { select: { id: true } },
      },
    }),
  ]);

  const forks: ForkChild[] = forkRows.map((f) => ({
    slug: f.slug,
    title: f.title,
    city: f.city,
    status: f.status,
  }));
  const forkTasksDone = forkRows.reduce((n, f) => n + f.tasks.length, 0);
  const forkUpdates = forkRows.reduce((n, f) => n + f.updates.length, 0);
  const forkCities = new Set(forkRows.map((f) => cityKey(f.city))).size;

  return { source: source ?? null, forkCities, forks, forkTasksDone, forkUpdates };
}

// Source data to prefill the new-project form when forking a playbook.
export async function getForkSource(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    select: { id: true, title: true, goal: true, pool: true, status: true },
  });
}
