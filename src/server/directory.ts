import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { readyIdsAmong } from "@/server/readiness";
import {
  PAGE_SIZE,
  STAGE_STATUS,
  type DirectoryGroup,
  type DirectoryItem,
  type DirectoryQuery,
  type DirectoryResult,
  type Stage,
} from "@/lib/directory";

// The searchable project directory query. Search and filters run in Postgres
// (full-text for relevance + pg_trgm for fuzzy/typo tolerance, both GIN-indexed —
// see scripts/search-index.ts), so this scales to large tables: only one page of
// rows ever leaves the database, and readiness is computed for that page alone.

// Weighted full-text vector: title (A) outranks city/country (B) outranks goal
// (C). Using 'simple' (not 'english') is deliberate — short queries like "so"
// must prefix-match "solar"; 'english' drops "so" as a stop word. Weighting then
// keeps a real title hit above the stop word buried in some goal text.
// MUST stay identical to the project_fts_idx expression in scripts/search-index.ts.
const TSV = Prisma.sql`(setweight(to_tsvector('simple', p.title), 'A') || setweight(to_tsvector('simple', p.city || ' ' || p.country), 'B') || setweight(to_tsvector('simple', p.goal), 'C'))`;

// Fuzzy/typo doc = title + city + country only (NOT the long goal), so a typo
// matches the name/place and isn't drowned by goal prose.
// MUST stay identical to the project_trgm_idx expression in scripts/search-index.ts.
const FUZZY = Prisma.sql`(p.title || ' ' || p.city || ' ' || p.country)`;

// Turn raw input into a prefix tsquery: "so panl" -> "so:* & panl:*". Each token
// is stripped to alphanumerics so user input can never break to_tsquery. The :*
// makes it prefix-aware, so typing "so" matches the lexeme "solar". Empty when the
// input has no usable tokens (then we lean on the trigram clause alone).
function prefixTsquery(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(" & ");
}

function whereSql(query: DirectoryQuery, pq: string): Prisma.Sql {
  const filters: Prisma.Sql[] = [];
  if (query.pool) filters.push(Prisma.sql`p.pool::text = ${query.pool}`);
  if (query.stage) filters.push(Prisma.sql`p.status::text = ${STAGE_STATUS[query.stage]}`);
  if (query.q) {
    // Prefix full-text (so -> solar) OR trigram word-similarity (sollar -> solar,
    // matched against title/place, not the whole long document).
    const clauses: Prisma.Sql[] = [];
    if (pq) clauses.push(Prisma.sql`${TSV} @@ to_tsquery('simple', ${pq})`);
    clauses.push(Prisma.sql`word_similarity(${query.q}, ${FUZZY}) > 0.3`);
    filters.push(Prisma.sql`(${Prisma.join(clauses, " OR ")})`);
  }
  return filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty;
}

function orderSql(query: DirectoryQuery, pq: string): Prisma.Sql {
  if (query.q) {
    // Best of prefix rank and fuzzy similarity, so exact/prefix hits lead and
    // typos still surface; newest breaks ties.
    const rank = pq
      ? Prisma.sql`GREATEST(ts_rank(${TSV}, to_tsquery('simple', ${pq})), word_similarity(${query.q}, ${FUZZY}))`
      : Prisma.sql`word_similarity(${query.q}, ${FUZZY})`;
    return Prisma.sql`${rank} DESC, p."createdAt" DESC`;
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

// Browse view: a capped preview of each stage, so /projects opens as spaced
// sections you explore (with "See all N"), not one long list. Reuses searchProjects
// per stage — each query is indexed and bounded, so it scales with the page, not
// the table.
const BROWSE_STAGES: Stage[] = ["spotlight", "queued", "adoptable", "closed"];
const GROUP_PREVIEW = 6;

export async function getDirectoryGroups(): Promise<DirectoryGroup[]> {
  const results = await Promise.all(BROWSE_STAGES.map((stage) => searchProjects({ stage, page: 1 })));
  return BROWSE_STAGES.map((stage, i) => ({
    stage,
    items: results[i].items.slice(0, GROUP_PREVIEW),
    total: results[i].total,
  }));
}
