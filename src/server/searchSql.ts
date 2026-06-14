import { Prisma } from "@/generated/prisma/client";

// Shared full-text + fuzzy search SQL, used by both the project directory
// (src/server/directory.ts) and the win wall (src/server/wins.ts). Centralised
// here because these expressions MUST stay identical to the GIN index definitions
// in scripts/search-index.ts — drift means the indexes stop being used.

// Weighted full-text vector: title (A) outranks city/country (B) outranks goal
// (C). 'simple' (not 'english') is deliberate — short queries like "so" must
// prefix-match "solar"; 'english' drops "so" as a stop word.
export const TSV = Prisma.sql`(setweight(to_tsvector('simple', p.title), 'A') || setweight(to_tsvector('simple', p.city || ' ' || p.country), 'B') || setweight(to_tsvector('simple', p.goal), 'C'))`;

// Fuzzy/typo doc = title + city + country only (NOT the long goal), so a typo
// matches the name/place and isn't drowned by goal prose.
export const FUZZY = Prisma.sql`(p.title || ' ' || p.city || ' ' || p.country)`;

// Turn raw input into a prefix tsquery: "so panl" -> "so:* & panl:*". Each token
// is stripped to alphanumerics so user input can never break to_tsquery. Empty
// when there's no usable token (then we lean on the trigram clause alone).
export function prefixTsquery(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((t) => `${t}:*`)
    .join(" & ");
}

// The WHERE search predicate: prefix full-text (so -> solar) OR trigram
// word-similarity (sollar -> solar). `q` is the raw text, `pq` its prefixTsquery.
export function searchClause(q: string, pq: string): Prisma.Sql {
  const clauses: Prisma.Sql[] = [];
  if (pq) clauses.push(Prisma.sql`${TSV} @@ to_tsquery('simple', ${pq})`);
  clauses.push(Prisma.sql`word_similarity(${q}, ${FUZZY}) > 0.3`);
  return Prisma.sql`(${Prisma.join(clauses, " OR ")})`;
}

// The relevance ORDER expression for a search: best of prefix rank and fuzzy
// similarity, so exact/prefix hits lead and typos still surface.
export function relevanceOrder(q: string, pq: string): Prisma.Sql {
  return pq
    ? Prisma.sql`GREATEST(ts_rank(${TSV}, to_tsquery('simple', ${pq})), word_similarity(${q}, ${FUZZY}))`
    : Prisma.sql`word_similarity(${q}, ${FUZZY})`;
}
