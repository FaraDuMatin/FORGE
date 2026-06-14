"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { loadProjectReadiness } from "@/server/readiness";
import { maintainPeoplesChoice } from "@/server/peopleschoice";
import { field, email, type ActionState } from "./types";

// One vote per email per project, cumulative (no reset). After the vote we re-run
// the People's Choice selection: if this pushes a project past the threshold and
// the spot is free, it claims it. unique(email, projectId) is the real guard.
export async function castVote(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const slug = field(fd, "slug");
  const locale = field(fd, "locale") || "en";
  const name = field(fd, "name");
  const voterEmail = email(fd, "email");

  if (!projectId || !name || !voterEmail) return { error: "form.missing" };

  // Eligibility: you can only back a project that is READY and still queued (not
  // already in a normal slot, not the current People's Choice holder).
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true, isPeoplesChoice: true },
  });
  if (!project) return { error: "notfound" };
  if (project.status !== "QUEUED" || project.isPeoplesChoice) return { error: "pc.ineligible" };
  const { ready } = await loadProjectReadiness(projectId);
  if (!ready) return { error: "pc.ineligible" };

  try {
    await prisma.pCVote.create({ data: { projectId, email: voterEmail, name } });
  } catch (e) {
    // Only a unique-constraint hit (P2002) means "already backed this project".
    // Anything else is a real failure — surface it instead of hiding it.
    if (e && typeof e === "object" && "code" in e && (e as { code?: string }).code === "P2002") {
      return { error: "pc.voted" };
    }
    console.error("castVote: pCVote.create failed", e);
    return { error: "pc.failed" };
  }

  await maintainPeoplesChoice();

  // Remember this project on this browser so the button locks without a round-trip.
  const jar = await cookies();
  const current = (jar.get("pc_voted")?.value ?? "").split(",").filter(Boolean);
  if (!current.includes(projectId)) current.push(projectId);
  jar.set("pc_voted", current.join(","), { path: "/", maxAge: 60 * 60 * 24 * 90, sameSite: "lax" });

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/pc`);
  revalidatePath(`/${locale}/p/${slug}`);
  return { ok: true };
}
