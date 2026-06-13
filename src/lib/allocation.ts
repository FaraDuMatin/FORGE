import { prisma } from "@/lib/db";
import { SLOTS_PER_POOL } from "@/lib/pools";
import type { Pool } from "@/generated/prisma/client";

// The allocation engine. Runs synchronously, triggered on writes (a project turns
// READY, or a spotlight closes/cancels). No cron, no background worker.
//
//   Fill-on-ready: a READY project takes a free slot in its pool immediately.
//   Lottery: only when READY projects outnumber open slots. Anti-starvation first
//   (anyone who missed 3 draws is guaranteed in), then random among the rest;
//   losers get missedDraws + 1.
//
// `readyIds` is the set of QUEUED projects currently meeting their readiness bars,
// computed by the caller (readiness is data-dependent, not a stored flag).
export async function allocatePool(pool: Pool, readyIds: Set<string>): Promise<void> {
  const spotlighted = await prisma.project.count({
    where: { pool, status: "SPOTLIGHT", isPeoplesChoice: false },
  });
  const openSlots = SLOTS_PER_POOL - spotlighted;
  if (openSlots <= 0) return;

  const queued = await prisma.project.findMany({
    where: { pool, status: "QUEUED", isPeoplesChoice: false },
    orderBy: { createdAt: "asc" },
  });
  const ready = queued.filter((p) => readyIds.has(p.id));
  if (ready.length === 0) return;

  // Fill-on-ready: not contested, everyone ready gets in.
  if (ready.length <= openSlots) {
    await promote(ready.map((p) => p.id));
    return;
  }

  // Contested: lottery. Anti-starvation guarantees first.
  const guaranteed = ready.filter((p) => p.missedDraws >= 3);
  const winners = guaranteed.slice(0, openSlots).map((p) => p.id);
  const remainingSlots = openSlots - winners.length;

  if (remainingSlots > 0) {
    const pool2 = ready.filter((p) => !winners.includes(p.id));
    for (let i = pool2.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool2[i], pool2[j]] = [pool2[j], pool2[i]];
    }
    winners.push(...pool2.slice(0, remainingSlots).map((p) => p.id));
  }

  const winnerSet = new Set(winners);
  const losers = ready.filter((p) => !winnerSet.has(p.id)).map((p) => p.id);

  await promote(winners);
  if (losers.length > 0) {
    await prisma.project.updateMany({
      where: { id: { in: losers } },
      data: { missedDraws: { increment: 1 } },
    });
  }
}

async function promote(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.project.updateMany({
    where: { id: { in: ids } },
    data: { status: "SPOTLIGHT", missedDraws: 0 },
  });
}
