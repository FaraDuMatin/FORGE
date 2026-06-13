import { prisma } from "@/lib/db";
import type { Project } from "@/generated/prisma/client";

// Maintainer access is a secret token in the manage URL — no accounts, no login.
// Returns the project only if the token matches, otherwise null (treated as 403).
export async function maintainerProject(projectId: string, token: string): Promise<Project | null> {
  if (!projectId || !token) return null;
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.maintainerToken !== token) return null;
  return project;
}
