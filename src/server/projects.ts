import { prisma } from "@/lib/db";
import { computeReadyIds } from "@/server/readiness";
import { POOLS } from "@/lib/pools";
import type { Pool, ProjectStatus } from "@/generated/prisma/client";

export type ProjectListItem = {
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

// Every project for the directory page, newest first, each tagged with whether it
// currently meets its readiness bars (so QUEUED ones can show ready vs getting-ready).
export async function listProjects(): Promise<ProjectListItem[]> {
  const projects = await prisma.project.findMany({
    select: {
      id: true, slug: true, title: true, city: true, country: true,
      pool: true, status: true, isPeoplesChoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const readySets = await Promise.all(POOLS.map((p) => computeReadyIds(p.pool)));
  const readyIds = new Set<string>();
  for (const set of readySets) for (const id of set) readyIds.add(id);

  return projects.map((p) => ({ ...p, ready: readyIds.has(p.id) }));
}

// Full project view for the detail and manage pages: the project plus its crew,
// tasks, and build log in display order.
export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type ProjectView = NonNullable<Awaited<ReturnType<typeof getProjectBySlug>>>;
