"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { runAllocation } from "@/server/allocate";
import { maintainerProject } from "@/server/auth";
import { field, email, type ActionState } from "./types";

// Maintainer adds an open task. More open tasks can satisfy the readiness bar.
export async function addTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");
  const title = field(fd, "title");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };
  if (!title) return { error: "form.missing" };

  await prisma.task.create({ data: { projectId, title } });

  if (project.status === "QUEUED") await runAllocation(project.pool);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}

// Anyone on the crew can claim an open task. Claiming requires having joined:
// we look the claimer up by email among the project's members.
export async function claimTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const taskId = field(fd, "taskId");
  const slug = field(fd, "slug");
  const locale = field(fd, "locale") || "en";
  const claimerEmail = email(fd, "email");

  if (!taskId || !claimerEmail) return { error: "form.missing" };

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true, status: true } });
  if (!task) return { error: "notfound" };
  if (task.status !== "OPEN") return { error: "task.taken" };

  const member = await prisma.member.findUnique({
    where: { projectId_email: { projectId: task.projectId, email: claimerEmail } },
    select: { name: true },
  });
  if (!member) return { error: "task.joinFirst" };

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "CLAIMED", claimedByName: member.name, claimedByEmail: claimerEmail },
  });

  revalidatePath(`/${locale}/p/${slug}`);
  return { ok: true };
}

// Maintainer marks a task done. Completing work never demotes the project — the
// platform pushes projects toward finishing, it does not punish progress.
export async function markTaskDone(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const taskId = field(fd, "taskId");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };

  await prisma.task.update({ where: { id: taskId }, data: { status: "DONE" } });

  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}
