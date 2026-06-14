import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { isoWeek } from "@/lib/week";
import { computeReadyIds } from "@/server/readiness";
import { POOLS } from "@/lib/pools";
import type { Pool } from "@/generated/prisma/client";

// People's Choice = the one wildcard slot, decided by the community's free vote.
// The holder is COMPUTED at read time from this cycle's votes (not stored as a
// spotlight row), so it resets cleanly each weekly cycle with no cron and no
// demote/promote writes. Eligible = READY and still QUEUED (not already in a slot).

export type PCCandidate = {
  id: string;
  slug: string;
  title: string;
  city: string;
  pool: Pool;
  votes: number;
  voterNames: string[]; // up to 3 recent first names, for the social-proof row
};

export type PeoplesChoice = {
  cycle: string;
  holder: PCCandidate | null;
  candidates: PCCandidate[];
};

// All READY + QUEUED projects across pools, ranked by this cycle's votes. The top
// one with any votes holds the slot; ties break by earliest created (cheap, stable).
export async function loadPeoplesChoice(): Promise<PeoplesChoice> {
  const cycle = isoWeek();

  const readySets = await Promise.all(POOLS.map((p) => computeReadyIds(p.pool)));
  const readyIds = new Set<string>();
  for (const set of readySets) for (const id of set) readyIds.add(id);
  if (readyIds.size === 0) return { cycle, holder: null, candidates: [] };

  const projects = await prisma.project.findMany({
    where: { id: { in: [...readyIds] }, status: "QUEUED" },
    select: { id: true, slug: true, title: true, city: true, pool: true, createdAt: true },
  });
  if (projects.length === 0) return { cycle, holder: null, candidates: [] };

  const votes = await prisma.pCVote.findMany({
    where: { projectId: { in: projects.map((p) => p.id) }, cycle },
    select: { projectId: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  const tally = new Map<string, { count: number; names: string[] }>();
  for (const v of votes) {
    const e = tally.get(v.projectId) ?? { count: 0, names: [] };
    e.count++;
    if (e.names.length < 3) e.names.push(v.name);
    tally.set(v.projectId, e);
  }

  const candidates: PCCandidate[] = projects
    .map((p) => {
      const t = tally.get(p.id);
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        city: p.city,
        pool: p.pool,
        votes: t?.count ?? 0,
        voterNames: t?.names ?? [],
        _createdAt: p.createdAt,
      };
    })
    // Most votes first; ties go to the earliest-created project.
    .sort((a, b) => b.votes - a.votes || a._createdAt.getTime() - b._createdAt.getTime())
    .map(({ _createdAt, ...c }) => c);

  const holder = candidates.length > 0 && candidates[0].votes > 0 ? candidates[0] : null;
  return { cycle, holder, candidates };
}

// Server-side read of the cycle lock cookie, for rendering the voted/locked state.
export async function hasVotedThisCycle(): Promise<boolean> {
  const jar = await cookies();
  return jar.get("pc_voted")?.value === isoWeek();
}
