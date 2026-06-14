import type { Pool, ProjectStatus } from "@/generated/prisma/client";

// Pure, client-safe directory types + URL helpers. NO Prisma runtime here, so this
// can be imported by client components (the search/filter controls, the pager).
// The actual DB query lives in src/server/directory.ts.

export const PAGE_SIZE = 12;

// Stage = the slice of a project's life people filter by. Maps 1:1 to stored
// status (plus People's Choice), so every filter is an indexed WHERE — no scans.
export const STAGES = ["spotlight", "queued", "adoptable", "closed"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_STATUS: Record<Stage, ProjectStatus> = {
  spotlight: "SPOTLIGHT",
  queued: "QUEUED",
  adoptable: "ADOPTABLE",
  closed: "CLOSED",
};

export type DirectoryQuery = {
  q?: string;
  pool?: Pool;
  stage?: Stage;
  page: number;
};

export type DirectoryItem = {
  id: string;
  slug: string;
  title: string;
  city: string;
  country: string;
  pool: Pool;
  status: ProjectStatus;
  isPeoplesChoice: boolean;
  ready: boolean; // computed; only meaningful while QUEUED
};

export type DirectoryResult = {
  items: DirectoryItem[];
  total: number;
  page: number;
  totalPages: number;
  query: DirectoryQuery;
};

// A capped preview of one stage for the browse (grouped) view of the directory.
export type DirectoryGroup = {
  stage: Stage;
  items: DirectoryItem[];
  total: number; // full count for the stage, drives the "See all N" link
};

// ── URL <-> query helpers (the query string is the single source of truth) ──

const POOL_SET = new Set<Pool>(["WEEK", "MONTH", "HALF_YEAR", "YEAR"]);
const STAGE_SET = new Set<string>(STAGES);

export function parseDirectoryQuery(sp: Record<string, string | string[] | undefined>): DirectoryQuery {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const q = one(sp.q)?.trim();
  const poolRaw = one(sp.pool);
  const stageRaw = one(sp.stage);
  const pageNum = Number.parseInt(one(sp.page) ?? "1", 10);
  return {
    q: q || undefined,
    pool: poolRaw && POOL_SET.has(poolRaw as Pool) ? (poolRaw as Pool) : undefined,
    stage: stageRaw && STAGE_SET.has(stageRaw) ? (stageRaw as Stage) : undefined,
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1,
  };
}

// Serialize a query (with optional overrides) to a `?a=b&...` string, dropping
// empties and a page of 1. Used by the pager and the client controls.
export function toQueryString(query: DirectoryQuery, overrides: Partial<DirectoryQuery> = {}): string {
  const merged = { ...query, ...overrides };
  const params = new URLSearchParams();
  if (merged.q) params.set("q", merged.q);
  if (merged.pool) params.set("pool", merged.pool);
  if (merged.stage) params.set("stage", merged.stage);
  if (merged.page && merged.page > 1) params.set("page", String(merged.page));
  const s = params.toString();
  return s ? `?${s}` : "";
}
