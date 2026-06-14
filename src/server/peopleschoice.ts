import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { computeReadyIds } from "@/server/readiness";
import { POOLS } from "@/lib/pools";
import type { Pool } from "@/generated/prisma/client";

// People's Choice = the one wildcard slot, decided by cumulative community votes.
//   - Votes never reset. One vote per email per project.
//   - The holder is a REAL, stored spotlight (status SPOTLIGHT + isPeoplesChoice):
//     it leaves the queue and keeps the slot until it FINISHES. It can't be
//     overtaken mid-flight.
//   - When the spot is free, the eligible (READY + still QUEUED) project with the
//     most votes takes it — but only once it clears the threshold. A tie at the top
//     waits for more votes to break it.

export const PC_THRESHOLD = 3;

export type PCCandidate = {
  id: string;
  slug: string;
  title: string;
  city: string;
  pool: Pool;
  votes: number;
  voterNames: string[]; // up to 3 recent first names for the social-proof row
};

export type PeoplesChoice = {
  holder: PCCandidate | null;
  candidates: PCCandidate[];
  threshold: number;
};

async function readyQueuedIds(): Promise<string[]> {
  const sets = await Promise.all(POOLS.map((p) => computeReadyIds(p.pool)));
  const ids = new Set<string>();
  for (const s of sets) for (const id of s) ids.add(id);
  return [...ids];
}

// The current holder (stored) plus the contenders ranked by cumulative votes.
export async function loadPeoplesChoice(): Promise<PeoplesChoice> {
  const holderRow = await prisma.project.findFirst({
    where: { isPeoplesChoice: true, status: "SPOTLIGHT" },
    select: { id: true, slug: true, title: true, city: true, pool: true },
  });

  const readyIds = await readyQueuedIds();
  const contenders = readyIds.length
    ? await prisma.project.findMany({
        where: { id: { in: readyIds }, status: "QUEUED", isPeoplesChoice: false },
        select: { id: true, slug: true, title: true, city: true, pool: true, createdAt: true },
      })
    : [];

  const allIds = [...contenders.map((c) => c.id), ...(holderRow ? [holderRow.id] : [])];
  const votes = allIds.length
    ? await prisma.pCVote.findMany({
        where: { projectId: { in: allIds } },
        select: { projectId: true, name: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const tally = new Map<string, { count: number; names: string[] }>();
  for (const v of votes) {
    const e = tally.get(v.projectId) ?? { count: 0, names: [] };
    e.count++;
    if (e.names.length < 3) e.names.push(v.name);
    tally.set(v.projectId, e);
  }

  const candidates: PCCandidate[] = contenders
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      city: p.city,
      pool: p.pool,
      votes: tally.get(p.id)?.count ?? 0,
      voterNames: tally.get(p.id)?.names ?? [],
      _createdAt: p.createdAt,
    }))
    .sort((a, b) => b.votes - a.votes || a._createdAt.getTime() - b._createdAt.getTime())
    .map(({ _createdAt, ...c }) => c);

  const holder: PCCandidate | null = holderRow
    ? {
        ...holderRow,
        votes: tally.get(holderRow.id)?.count ?? 0,
        voterNames: tally.get(holderRow.id)?.names ?? [],
      }
    : null;

  return { holder, candidates, threshold: PC_THRESHOLD };
}

// Keep the People's Choice slot correct. Sticky: an existing holder is left alone
// until it leaves SPOTLIGHT (finishes, steps back, etc.). When the spot is free,
// promote the top eligible project — if it clears the threshold and isn't tied.
// Called after any vote, and after a project closes or steps back.
export async function maintainPeoplesChoice(): Promise<void> {
  // Drop a stale flag from a project that is no longer spotlighted.
  await prisma.project.updateMany({
    where: { isPeoplesChoice: true, status: { not: "SPOTLIGHT" } },
    data: { isPeoplesChoice: false },
  });

  const holder = await prisma.project.findFirst({
    where: { isPeoplesChoice: true, status: "SPOTLIGHT" },
    select: { id: true },
  });
  if (holder) return; // sticky — the spot is taken until this one finishes

  const readyIds = await readyQueuedIds();
  if (readyIds.length === 0) return;

  const contenders = await prisma.project.findMany({
    where: { id: { in: readyIds }, status: "QUEUED", isPeoplesChoice: false },
    select: { id: true, createdAt: true },
  });
  if (contenders.length === 0) return;

  const counts = await prisma.pCVote.groupBy({
    by: ["projectId"],
    where: { projectId: { in: contenders.map((c) => c.id) } },
    _count: { _all: true },
  });
  const countOf = new Map(counts.map((c) => [c.projectId, c._count._all]));

  const ranked = contenders
    .map((c) => ({ id: c.id, createdAt: c.createdAt, votes: countOf.get(c.id) ?? 0 }))
    .filter((c) => c.votes >= PC_THRESHOLD)
    .sort((a, b) => b.votes - a.votes || a.createdAt.getTime() - b.createdAt.getTime());

  if (ranked.length === 0) return; // nobody has cleared the threshold yet
  if (ranked.length > 1 && ranked[1].votes === ranked[0].votes) return; // tie at the top — wait

  await prisma.project.update({
    where: { id: ranked[0].id },
    data: { status: "SPOTLIGHT", isPeoplesChoice: true },
  });
}

// Which projects this browser has already backed (cookie-based, UX only — the real
// guard is unique(email, projectId) in the database).
export async function votedProjectIds(): Promise<Set<string>> {
  const jar = await cookies();
  const raw = jar.get("pc_voted")?.value ?? "";
  return new Set(raw ? raw.split(",").filter(Boolean) : []);
}
