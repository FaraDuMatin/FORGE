"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { runAllocation } from "@/server/allocate";
import { field, email, type ActionState } from "./types";

// Joining the crew is required before claiming a task. Name + email + an optional
// self-declared role (roles count toward readiness for the longer pools).
export async function joinCrew(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const slug = field(fd, "slug");
  const locale = field(fd, "locale") || "en";
  const name = field(fd, "name");
  const memberEmail = email(fd, "email");
  const role = field(fd, "role") || null;

  if (!projectId || !name || !memberEmail) return { error: "form.missing" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { pool: true, status: true },
  });
  if (!project) return { error: "notfound" };

  try {
    await prisma.member.create({ data: { projectId, name, email: memberEmail, role } });
  } catch {
    // unique(projectId, email) — already on the crew.
    return { error: "crew.already" };
  }

  // A new crew member can push the project over its readiness bar.
  if (project.status === "QUEUED") await runAllocation(project.pool);
  revalidatePath(`/${locale}/p/${slug}`);
  return { ok: true };
}
