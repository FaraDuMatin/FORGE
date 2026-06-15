"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { newMaintainerToken } from "@/lib/token";
import { field } from "./types";
import type { ProjectStatus } from "@/generated/prisma/client";

// The /admin route is a private escape hatch (password in ADMIN_PASSWORD). These
// actions re-check the password on every call — the page gate alone isn't enough,
// since a server action can be invoked directly. No i18n: admin-only, English.

const VALID_STATUS = new Set<ProjectStatus>([
  "QUEUED",
  "SPOTLIGHT",
  "CLOSED",
  "ADOPTABLE",
  "CANCELLED",
]);

function authed(fd: FormData): boolean {
  const pw = process.env.ADMIN_PASSWORD;
  return Boolean(pw) && field(fd, "p") === pw;
}

// Delete a project outright (cascades to members, tasks, updates, votes).
export async function adminDeleteProject(fd: FormData): Promise<void> {
  if (!authed(fd)) return;
  const id = field(fd, "projectId");
  if (!id) return;
  await prisma.project.delete({ where: { id } });
  revalidatePath("/en/admin");
}

// Regenerate the maintainer token — the old manage link dies, a new one is issued.
export async function adminResetToken(fd: FormData): Promise<void> {
  if (!authed(fd)) return;
  const id = field(fd, "projectId");
  if (!id) return;
  await prisma.project.update({
    where: { id },
    data: { maintainerToken: newMaintainerToken() },
  });
  revalidatePath("/en/admin");
}

// Force a project's status. Raw override — does not re-run allocation or touch
// People's Choice; it's a manual lever, use with care.
export async function adminSetStatus(fd: FormData): Promise<void> {
  if (!authed(fd)) return;
  const id = field(fd, "projectId");
  const status = field(fd, "status") as ProjectStatus;
  if (!id || !VALID_STATUS.has(status)) return;
  await prisma.project.update({ where: { id }, data: { status } });
  revalidatePath("/en/admin");
}
