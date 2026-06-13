import { allocatePool } from "@/lib/allocation";
import { computeReadyIds } from "@/server/readiness";
import type { Pool } from "@/generated/prisma/client";

// Single entry point for "something changed that could move slots in this pool".
// Called synchronously after any write that affects readiness or frees a slot
// (create, join, add/claim task, post update, close). No cron, no worker.
export async function runAllocation(pool: Pool): Promise<void> {
  const readyIds = await computeReadyIds(pool);
  await allocatePool(pool, readyIds);
}
