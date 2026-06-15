"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { runAllocation } from "@/server/allocate";
import { maintainerProject } from "@/server/auth";
import { field, email, type ActionState } from "./types";

// Requesting to join the crew. Created PENDING — the maintainer approves it in the
// panel before the member is real (can claim tasks, counts toward readiness).
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
    select: { id: true },
  });
  if (!project) return { error: "notfound" };

  try {
    // PENDING by default — does NOT count toward readiness until approved.
    await prisma.member.create({ data: { projectId, name, email: memberEmail, role } });
  } catch {
    // unique(projectId, email) — already requested / on the crew.
    return { error: "crew.already" };
  }

  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}

// Maintainer approves a pending crew request. Approval can cross a readiness bar,
// so we re-run allocation for the pool.
export async function approveMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const memberId = field(fd, "memberId");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };

  await prisma.member.updateMany({
    where: { id: memberId, projectId },
    data: { status: "APPROVED" },
  });

  if (project.status === "QUEUED") await runAllocation(project.pool);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}

// Maintainer removes a crew member (declines a pending request or drops an approved
// one). The maintainer's own membership can't be removed this way in the UI.
export async function removeMember(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const memberId = field(fd, "memberId");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };

  // Never remove the maintainer's own crew row.
  await prisma.member.deleteMany({
    where: { id: memberId, projectId, email: { not: project.maintainerEmail } },
  });

  if (project.status === "QUEUED") await runAllocation(project.pool);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}
