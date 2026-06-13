import { prisma } from "@/lib/db";
import type { Pool } from "@/generated/prisma/client";

export type SpotlightCard = {
  slug: string;
  title: string;
  city: string;
  pool: Pool;
  isPeoplesChoice: boolean;
};

// Spotlighted projects grouped by pool, plus the People's Choice holder.
// Degrades to empty when no database is connected yet, so the skeleton renders
// and `next build` succeeds before Neon is wired.
export async function getSpotlights(): Promise<{
  byPool: Record<Pool, SpotlightCard[]>;
  peoplesChoice: SpotlightCard | null;
}> {
  const empty: Record<Pool, SpotlightCard[]> = {
    WEEK: [],
    MONTH: [],
    HALF_YEAR: [],
    YEAR: [],
  };

  try {
    const rows = await prisma.project.findMany({
      where: { status: "SPOTLIGHT" },
      select: { slug: true, title: true, city: true, pool: true, isPeoplesChoice: true },
      orderBy: { updatedAt: "desc" },
    });

    const byPool = { ...empty, WEEK: [], MONTH: [], HALF_YEAR: [], YEAR: [] } as Record<Pool, SpotlightCard[]>;
    let peoplesChoice: SpotlightCard | null = null;
    for (const r of rows) {
      if (r.isPeoplesChoice) peoplesChoice = r;
      else byPool[r.pool].push(r);
    }
    return { byPool, peoplesChoice };
  } catch {
    // No DB yet (or unreachable): show the empty structure.
    return { byPool: empty, peoplesChoice: null };
  }
}
