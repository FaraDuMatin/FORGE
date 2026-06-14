import type { Pool } from "@/generated/prisma/client";

// Pure, client-safe win-wall types + URL helpers. NO Prisma runtime here, so the
// client controls / pager / orchestrator can import it. The DB query lives in
// src/server/wins.ts.

export const WINS_PAGE_SIZE = 12;

export type WinsSort = "recent" | "oldest";

export type WinsQuery = {
  q?: string;
  sort: WinsSort;
  page: number;
};

export type WinItem = {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  pool: Pool;
  outcome: string | null;
  forkCities: number; // distinct cities among all descendants
};

export type WinsResult = {
  items: WinItem[];
  total: number;
  page: number;
  totalPages: number;
  query: WinsQuery;
};

const SORTS = new Set<WinsSort>(["recent", "oldest"]);

export function parseWinsQuery(sp: Record<string, string | string[] | undefined>): WinsQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = one(sp.q)?.trim();
  const sortRaw = one(sp.sort);
  const pageNum = Number.parseInt(one(sp.page) ?? "1", 10);
  return {
    q: q || undefined,
    sort: sortRaw && SORTS.has(sortRaw as WinsSort) ? (sortRaw as WinsSort) : "recent",
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
  };
}

// Serialize to `?q=&sort=oldest&page=2`, dropping defaults (sort=recent, page=1).
export function toWinsQueryString(query: WinsQuery, overrides: Partial<WinsQuery> = {}): string {
  const merged = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.sort && merged.sort !== "recent") params.set("sort", merged.sort);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}
