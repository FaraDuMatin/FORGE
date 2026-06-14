"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { newMaintainerToken } from "@/lib/token";
import { runAllocation } from "@/server/allocate";
import { maintainPeoplesChoice } from "@/server/peopleschoice";
import { maintainerProject } from "@/server/auth";
import { field, email, type ActionState } from "./types";

// Succession = "Relay". A project should outlive its founder. Three actions:
//   setSuccessor — maintainer names who takes over (also a readiness bar on long pools)
//   stepBack     — maintainer leaves: hands to the successor if named, else ADOPTABLE
//   adopt        — anyone takes on an ADOPTABLE project and becomes its maintainer

// Name (or clear) the successor. Maintainer-only. A named successor satisfies the
// readiness bar for 6-month / 1-year pools, so this can move the project's slot.
export async function setSuccessor(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");
  const successorName = field(fd, "successorName");
  const successorEmail = email(fd, "successorEmail");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };
  // Both or neither — a half-named successor doesn't count.
  if ((successorName && !successorEmail) || (!successorName && successorEmail)) {
    return { error: "form.missing" };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      successorName: successorName || null,
      successorEmail: successorEmail || null,
    },
  });

  // Naming a successor can complete readiness on the longer pools.
  if (project.status === "QUEUED") await runAllocation(project.pool);
  revalidatePath(`/${locale}/p/${slug}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  return { ok: true };
}

// Maintainer steps back. With a successor: hand the project over, it keeps its
// place, the token rotates and we send the old maintainer a handoff link to pass
// on. Without one: the project goes ADOPTABLE and releases any spotlight slot
// (re-run allocation so an active project can take it).
export async function stepBack(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const token = field(fd, "token");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");

  const project = await maintainerProject(projectId, token);
  if (!project) return { error: "auth" };
  if (project.status === "CLOSED" || project.status === "CANCELLED") {
    return { error: "form.missing" };
  }

  const hasSuccessor = Boolean(project.successorName && project.successorEmail);

  if (hasSuccessor) {
    const nextToken = newMaintainerToken();
    await prisma.project.update({
      where: { id: projectId },
      data: {
        maintainerName: project.successorName!,
        maintainerEmail: project.successorEmail!,
        maintainerToken: nextToken,
        // The successor is now the maintainer; clear the slot for the next one.
        successorName: null,
        successorEmail: null,
      },
    });
    // Make sure the new maintainer is on the crew (ignore if already a member).
    await prisma.member
      .create({ data: { projectId, name: project.successorName!, email: project.successorEmail! } })
      .catch(() => {});

    revalidatePath(`/${locale}/p/${slug}`);
    redirect(`/${locale}/p/${slug}/manage?t=${nextToken}&handoff=1`);
  }

  // No successor: open it for adoption and release the spotlight slot.
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ADOPTABLE" },
  });
  await runAllocation(project.pool);
  // If this was the People's Choice holder, the spot is now free — refill it.
  await maintainPeoplesChoice();

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/p/${slug}/manage`);
  redirect(`/${locale}/p/${slug}`);
}

// Adopt an ADOPTABLE project. Open to anyone — the adopter becomes the new
// maintainer (fresh token), joins the crew, and the project re-enters the running
// (QUEUED → fill-on-ready or the lottery). Redirects the adopter to their panel.
export async function adopt(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const projectId = field(fd, "projectId");
  const locale = field(fd, "locale") || "en";
  const slug = field(fd, "slug");
  const name = field(fd, "name");
  const adopterEmail = email(fd, "email");
  const role = field(fd, "role") || null;

  if (!projectId || !name || !adopterEmail) return { error: "form.missing" };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { pool: true, status: true },
  });
  if (!project) return { error: "notfound" };
  if (project.status !== "ADOPTABLE") return { error: "adopt.notAdoptable" };

  const nextToken = newMaintainerToken();
  await prisma.project.update({
    where: { id: projectId },
    data: {
      maintainerName: name,
      maintainerEmail: adopterEmail,
      maintainerToken: nextToken,
      status: "QUEUED",
    },
  });
  await prisma.member
    .create({ data: { projectId, name, email: adopterEmail, role } })
    .catch(() => {});

  // Back in the running: fill-on-ready may re-spotlight it, else it waits its turn.
  await runAllocation(project.pool);

  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/p/${slug}`);
  redirect(`/${locale}/p/${slug}/manage?t=${nextToken}&adopted=1`);
}
