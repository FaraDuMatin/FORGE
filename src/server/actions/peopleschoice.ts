"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isoWeek } from "@/lib/week";
import { loadProjectReadiness } from "@/server/readiness";
import { field, email, type ActionState } from "./types";

// One free People's Choice vote per email per weekly cycle — and, once cast, it's
// final for the week (no moving it). The unique(email, cycle) constraint is the
// real guard; the cookie just lets the UI lock instantly without a round-trip.
export async function castVote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const slug = field(fd, "slug");
  const locale = field(fd, "locale") || "en";
  const name = field(fd, "name");
  const voterEmail = email(fd, "email");

  if (!projectId || !name || !voterEmail) return { error: "form.missing" };

  // Eligibility is rechecked server-side: you can only back a project that is
  // READY and still queued (not already in a spotlight slot).
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  });
  if (!project) return { error: "notfound" };
  if (project.status !== "QUEUED") return { error: "pc.ineligible" };
  const { ready } = await loadProjectReadiness(projectId);
  if (!ready) return { error: "pc.ineligible" };

  const cycle = isoWeek();
  try {
    await prisma.pCVote.create({ data: { projectId, email: voterEmail, name, cycle } });
  } catch {
    // unique(email, cycle) — already voted this week, anywhere.
    return { error: "pc.voted" };
  }

  // Lock this browser for the cycle (UX only; the DB constraint is the real lock).
  const jar = await cookies();
  jar.set("pc_voted", cycle, { path: "/", maxAge: 60 * 60 * 24 * 8, sameSite: "lax" });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/pc`);
  revalidatePath(`/${locale}/p/${slug}`);
  return { ok: true };
}
