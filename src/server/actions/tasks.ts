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

// An APPROVED crew member claims an open task. Claiming requires having joined AND
// been approved: we look the claimer up by email among the project's members.
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
    select: { name: true, status: true },
  });
  if (!member) return { error: "task.joinFirst" };
  if (member.status !== "APPROVED") return { error: "task.notApproved" };

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "CLAIMED", claimedByName: member.name, claimedByEmail: claimerEmail },
  });

  revalidatePath(`/${locale}/p/${slug}`);
  return { ok: true };
}

// The claimer reports their work and submits it for review. Verified by the email
// they claimed with. Moves CLAIMED -> SUBMITTED with a note + optional link.
export async function submitTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const taskId = field(fd, "taskId");
  const slug = field(fd, "slug");
  const locale = field(fd, "locale") || "en";
  const submitterEmail = email(fd, "email");
  const report = field(fd, "report");
  const reportUrl = field(fd, "reportUrl") || null;

  if (!taskId || !submitterEmail || !report) return { error: "form.missing" };

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { status: true, claimedByEmail: true },
  });
  if (!task) return { error: "notfound" };
  if (task.status !== "CLAIMED") return { error: "task.notClaimed" };
  if (task.claimedByEmail !== submitterEmail) return { error: "task.notClaimer" };

  await prisma.task.update({
    where: { id: taskId },
    data: { status: "SUBMITTED", report, reportUrl },
  });

  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}

// Maintainer reviews a submitted task and accepts it: SUBMITTED -> DONE. Completing
// work never demotes the project — the platform pushes toward finishing.
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

// Maintainer rejects a submitted task (like requesting changes on a PR): it goes
// back to OPEN, the claim + report are cleared, and anyone can pick it up again.
export async function rejectTask(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const taskId = field(fd, "taskId");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };

  // Returning a task to OPEN can drop the open-task count back below the bar, so
  // re-run allocation. (markTaskDone never needs this — DONE keeps the project.)
  await prisma.task.update({
    where: { id: taskId },
    data: { status: "OPEN", claimedByName: null, claimedByEmail: null, report: null, reportUrl: null },
  });

  if (project.status === "QUEUED") await runAllocation(project.pool);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}
