import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { readyIdsAmong } from "@/server/readiness";
import { prefixTsquery, searchClause, relevanceOrder } from "@/server/searchSql";
import {
  PAGE_SIZE,
  STAGE_STATUS,
  type DirectoryItem,
  type DirectoryQuery,
  type DirectoryResult,
} from "@/lib/directory";

// The searchable project directory query. Search and filters run in Postgres
// (full-text for relevance + pg_trgm for fuzzy/typo tolerance, both GIN-indexed —
// see scripts/search-index.ts), so this scales to large tables: only one page of
// rows ever leaves the database, and readiness is computed for that page alone.
// The full-text / fuzzy SQL lives in src/server/searchSql.ts (shared with /wins).

function whereSql(query: DirectoryQuery, pq: string): Prisma.Sql {
  const filters: Prisma.Sql[] = [];
  if (query.pool) filters.push(Prisma.sql`p.pool::text = ${query.pool}`);
  if (query.stage) filters.push(Prisma.sql`p.status::text = ${STAGE_STATUS[query.stage]}`);
  if (query.q) filters.push(searchClause(query.q, pq));
  return filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty;
}

function orderSql(query: DirectoryQuery, pq: string): Prisma.Sql {
  if (query.q) {
    // Best of prefix rank and fuzzy similarity, so exact/prefix hits lead and
    // typos still surface; newest breaks ties.
    return Prisma.sql`${relevanceOrder(query.q, pq)} DESC, p."createdAt" DESC`;
  }
  // No query: spotlights first (People's Choice ahead of the rest), then newest.
  return Prisma.sql`
    CASE
      WHEN p."isPeoplesChoice" AND p.status = 'SPOTLIGHT' THEN 0
      WHEN p.status = 'SPOTLIGHT' THEN 1
      WHEN p.status = 'QUEUED' THEN 2
      WHEN p.status = 'ADOPTABLE' THEN 3
      WHEN p.status = 'CLOSED' THEN 4
      ELSE 5
    END,
    p."createdAt" DESC`;
}

type RawRow = Omit<DirectoryItem, "ready">;

export async function searchProjects(query: DirectoryQuery): Promise<DirectoryResult> {
  const pq = query.q ? prefixTsquery(query.q) : "";
  const where = whereSql(query, pq);
  const offset = (query.page - 1) * PAGE_SIZE;

  const [countRows, rows] = await Promise.all([
    prisma.$queryRaw<{ count: number }[]>(
      Prisma.sql`SELECT count(*)::int AS count FROM "Project" p ${where}`,
    ),
    prisma.$queryRaw<RawRow[]>(Prisma.sql`
      SELECT p.id, p.slug, p.title, p.city, p.country,
             p.pool::text AS pool, p.status::text AS status, p."isPeoplesChoice"
      FROM "Project" p
      ${where}
      ORDER BY ${orderSql(query, pq)}
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `),
  ]);

  const total = countRows[0]?.count ?? 0;
  const ready = await readyIdsAmong(rows.map((r) => r.id));
  const items: DirectoryItem[] = rows.map((r) => ({ ...r, ready: ready.has(r.id) }));

  return { items, total, page: query.page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), query };
}
