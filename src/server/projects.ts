import { prisma } from "@/lib/db";

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
