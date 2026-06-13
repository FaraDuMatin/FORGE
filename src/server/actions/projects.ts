"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { runAllocation } from "@/server/allocate";
import { maintainerProject } from "@/server/auth";
import { field, email, type ActionState } from "./types";
import type { Pool } from "@/generated/prisma/client";

const VALID_POOLS = new Set<Pool>(["WEEK", "MONTH", "HALF_YEAR", "YEAR"]);

// Create a project. The creator becomes the maintainer AND crew member #1.
// On success we redirect to the manage page with the secret token revealed once.
export async function createProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = field(fd, "locale") || "en";
  const title = field(fd, "title");
  const goal = field(fd, "goal");
  const city = field(fd, "city");
  const country = field(fd, "country");
  const pool = field(fd, "pool") as Pool;
  const maintainerName = field(fd, "maintainerName");
  const maintainerEmail = email(fd, "maintainerEmail");
  const role = field(fd, "maintainerRole") || null;

  if (!title || !goal || !city || !country || !maintainerName || !maintainerEmail) {
    return { error: "form.missing" };
  }
  if (!VALID_POOLS.has(pool)) return { error: "form.pool" };

  const project = await prisma.project.create({
    data: {
      slug: slugify(title),
      title,
      goal,
      city,
      country,
      pool,
      maintainerName,
      maintainerEmail,
      members: { create: { name: maintainerName, email: maintainerEmail, role } },
    },
    select: { slug: true, maintainerToken: true, pool: true },
  });

  await runAllocation(project.pool);
  revalidatePath(`/${locale}`);
  redirect(`/${locale}/p/${project.slug}/manage?t=${project.maintainerToken}&created=1`);
}

// Close with an outcome. Frees the slot, so we re-run allocation for the pool to
// fill it. Closed projects become playbooks on the win wall (next pass).
export async function closeProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");
  const outcome = field(fd, "outcome");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };
  if (!outcome) return { error: "form.missing" };

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "CLOSED", outcome },
  });

  await runAllocation(project.pool);
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}
