import type { ProjectStatus } from "@/generated/prisma/client";

// One source of truth for project-card surfaces, so home, /spotlight and the
// directory all signal "spotlight" the same way. Pure (type-only import) — safe
// in server or client components.
//
// Spotlight = a normal card (white / near-black) with a SLIGHT emerald glow in the
// bottom-left corner — not a fill. Two knobs to tune the glow:
//   • intensity  = the rgba alpha (last number, e.g. 0.10). Lower = fainter.
//   • size/reach = the ellipse "45% 55%" + "at 0% 100%". Smaller % = tighter corner.
// Border is intentionally faint neutral (the glow carries the colour, not the edge).
const BASE = "rounded-xl border p-4 transition";
const GLOW = "bg-[radial-gradient(ellipse_42%_55%_at_0%_100%,rgba(16,185,129,0.10),transparent)]";
const GLOW_STRONG = "bg-[radial-gradient(ellipse_48%_60%_at_0%_100%,rgba(16,185,129,0.15),transparent)]";

export function cardSurface(status: ProjectStatus, isPeoplesChoice = false): string {
  // People's Choice: slightly stronger glow + a faint ring.
  if (isPeoplesChoice && status === "SPOTLIGHT") {
    return `${BASE} ${GLOW_STRONG} border-neutral-200 bg-white shadow-sm ring-1 ring-emerald-500/15 hover:ring-emerald-400/40 dark:border-neutral-800 dark:bg-neutral-950`;
  }
  // Spotlight: faint corner glow, faint neutral border.
  if (status === "SPOTLIGHT") {
    return `${BASE} ${GLOW} border-neutral-200 bg-white shadow-sm hover:border-emerald-400 dark:border-neutral-800 dark:bg-neutral-950`;
  }
  // Everything else: plain neutral card, emerald border on hover.
  return `${BASE} border-neutral-200 hover:border-emerald-500 dark:border-neutral-800`;
}
