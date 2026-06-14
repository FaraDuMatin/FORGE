import { prisma } from "@/lib/db";
import type { Pool } from "@/generated/prisma/client";

export type SpotlightCard = {
  slug: string;
  title: string;
  city: string;
  pool: Pool;
  isPeoplesChoice: boolean;
};

// Spotlighted projects grouped by pool (the 12 normal slots). The People's Choice
// holder is computed separately from votes — see src/server/peopleschoice.ts.
// Degrades to empty when no database is connected yet, so the skeleton renders
// and `next build` succeeds before Neon is wired.
export async function getSpotlights(): Promise<{ byPool: Record<Pool, SpotlightCard[]> }> {
  const empty: Record<Pool, SpotlightCard[]> = {
    WEEK: [],
    MONTH: [],
    HALF_YEAR: [],
    YEAR: [],
  };

  try {
    const rows = await prisma.project.findMany({
      // The People's Choice holder is also SPOTLIGHT but lives in its own slot,
      // so it must not appear in the normal pool grid.
      where: { status: "SPOTLIGHT", isPeoplesChoice: false },
      select: { slug: true, title: true, city: true, pool: true, isPeoplesChoice: true },
      orderBy: { updatedAt: "desc" },
    });

    const byPool = { WEEK: [], MONTH: [], HALF_YEAR: [], YEAR: [] } as Record<Pool, SpotlightCard[]>;
    for (const r of rows) byPool[r.pool].push(r);
    return { byPool };
  } catch {
    // No DB yet (or unreachable): show the empty structure.
    return { byPool: empty };
  }
}
