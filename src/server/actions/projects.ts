"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { runAllocation } from "@/server/allocate";
import { maintainPeoplesChoice } from "@/server/peopleschoice";
import { maintainerProject } from "@/server/auth";
import { youtubeEmbedUrl } from "@/lib/videoEmbed";
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
  const clonedFromRaw = field(fd, "clonedFrom");

  if (!title || !goal || !city || !country || !maintainerName || !maintainerEmail) {
    return { error: "form.missing" };
  }
  if (!VALID_POOLS.has(pool)) return { error: "form.pool" };

  // Forked from a playbook? Only keep the lineage if the source really exists.
  let clonedFrom: string | null = null;
  if (clonedFromRaw) {
    const source = await prisma.project.findUnique({ where: { id: clonedFromRaw }, select: { id: true } });
    clonedFrom = source?.id ?? null;
  }

  const project = await prisma.project.create({
    data: {
      slug: slugify(title),
      title,
      goal,
      city,
      country,
      pool,
      clonedFrom,
      maintainerName,
      maintainerEmail,
      members: { create: { name: maintainerName, email: maintainerEmail, role, status: "APPROVED" } },
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
  // If this was the People's Choice holder, the spot is now free — refill it.
  await maintainPeoplesChoice();
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}

// Attach (or clear) a YouTube link. Stored raw; parsed to a nocookie embed at
// render. A non-empty link that doesn't parse as YouTube is rejected.
export async function setVideoUrl(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");
  const raw = field(fd, "videoUrl");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };
  if (raw && !youtubeEmbedUrl(raw)) return { error: "form.video" };

  await prisma.project.update({
    where: { id: projectId },
    data: { videoUrl: raw || null },
  });

  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}

// Re-enter a project you maintain from the "/me" page: paste the secret token or
// the full manage URL. We pull the token out, look it up (it's unique), and send
// you to the canonical manage URL — so a link pasted in the wrong locale/slug
// still lands correctly. Reveals nothing without the secret token.
export async function resumeProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const locale = field(fd, "locale") || "en";
  const input = field(fd, "key");
  if (!input) return { error: "form.missing" };

  // Accept a pasted URL (?t=…) or a bare token.
  let token = input;
  const match = input.match(/[?&]t=([^&\s]+)/);
  if (match) token = decodeURIComponent(match[1]);

  const project = await prisma.project.findUnique({
    where: { maintainerToken: token },
    select: { slug: true },
  });
  if (!project) return { error: "resume.notfound" };

  redirect(`/${locale}/p/${project.slug}/manage?t=${token}`);
}
