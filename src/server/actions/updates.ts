"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { runAllocation } from "@/server/allocate";
import { maintainerProject } from "@/server/auth";
import { field, type ActionState } from "./types";

// The public build log. The maintainer posts updates; the first entry is a
// readiness bar (a project should be able to say what it is doing and why).
export async function postUpdate(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");
  const text = field(fd, "text");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };
  if (!text) return { error: "form.missing" };

  await prisma.update.create({
    data: { projectId, authorName: project.maintainerName, text },
  });

  // The first log entry can complete readiness.
  if (project.status === "QUEUED") await runAllocation(project.pool);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}
