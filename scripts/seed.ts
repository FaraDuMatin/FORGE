import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

// Demo seed. Seed rows are tagged with the @seed.forge maintainer domain so this
// can wipe and re-create them without touching real data. Run `SEED_RESET=all
// npm run db:seed` to instead wipe EVERY project for a pristine demo.
//
//   3 "filler" WEEK projects fill the pool (respecting the 3-slot cap), 3 ready
//   "candidates" stay queued with primed votes (2, 2, 1 — just under the threshold
//   of 3), and 1 not-ready project shows "getting ready". Cast one more vote on a
//   candidate and it crosses the threshold and claims the People's Choice spot.
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const SEED_DOMAIN = "seed.forge";
const NAMES = ["Maria", "Tom", "Amara", "Liang", "Sofia", "Noah", "Ines", "Kofi", "Yuki", "Diego"];

type Role = "filler" | "candidate" | "notready";
type Seed = {
  slug: string;
  title: string;
  goal: string;
  city: string;
  country: string;
  role: Role;
  crew: number;
  tasks: string[];
  update: string | null;
  votes?: number; // primed People's Choice votes (candidates only)
};

const SEEDS: Seed[] = [
  {
    slug: "canal-bank-cleanup", title: "Canal Bank Cleanup", role: "filler",
    goal: "Clear the litter and invasive weeds along 800m of the canal towpath in one Saturday.",
    city: "Lyon", country: "France", crew: 7,
    tasks: ["Borrow grabbers and bags from the town hall", "Map the worst three stretches", "Post the meeting point and time"],
    update: "Town hall said yes to lending equipment. Meeting point set at the lock gates, 9am Saturday.",
  },
  {
    slug: "pollinator-verges", title: "Pollinator Verges", role: "filler",
    goal: "Sow wildflower strips on four neglected road verges to bring back bees and butterflies.",
    city: "Bristol", country: "United Kingdom", crew: 6,
    tasks: ["Get council sign-off for the four verges", "Buy native seed mix", "Rake and prep the soil"],
    update: "Council approved all four verges. Seed mix ordered from a local supplier.",
  },
  {
    slug: "repair-cafe-saturday", title: "Repair Café Saturday", role: "filler",
    goal: "Run a one-day repair café so neighbours can fix small appliances instead of binning them.",
    city: "Porto", country: "Portugal", crew: 8,
    tasks: ["Find a hall for the day", "Recruit three fixers", "Print flyers for the street"],
    update: "Community hall booked for the 21st. Two fixers signed up, one more to go.",
  },
  {
    slug: "schoolyard-rain-garden", title: "Schoolyard Rain Garden", role: "candidate", votes: 2,
    goal: "Dig a small rain garden in the school yard to soak up runoff and teach the kids about it.",
    city: "Utrecht", country: "Netherlands", crew: 5,
    tasks: ["Mark out the low corner that floods", "Source native wetland plants", "Plan a planting morning with a class"],
    update: "Head teacher is on board. We picked the corner by the bike shed that always puddles.",
  },
  {
    slug: "tool-library-launch", title: "Tool Library Launch", role: "candidate", votes: 2,
    goal: "Open a lending shelf of shared tools so people borrow a drill instead of buying one.",
    city: "Gent", country: "Belgium", crew: 6,
    tasks: ["Collect donated tools from the neighbourhood", "Build a simple borrow log", "Find a dry cupboard to host it"],
    update: "Five neighbours already offered tools. A café offered cupboard space if we keep it tidy.",
  },
  {
    slug: "riverside-tree-planting", title: "Riverside Tree Planting", role: "candidate", votes: 1,
    goal: "Plant 30 native saplings along the riverbank to shade the water and hold the soil.",
    city: "Tours", country: "France", crew: 5,
    tasks: ["Confirm the stretch with the river authority", "Order 30 bare-root saplings", "Organise a Saturday planting"],
    update: "River authority pointed us to a bare stretch that badly needs shade. Saplings priced up.",
  },
  {
    slug: "balcony-compost-network", title: "Balcony Compost Network", role: "notready",
    goal: "Link up balcony composters so food scraps feed local planters instead of landfill.",
    city: "Nantes", country: "France", crew: 2,
    tasks: [],
    update: null,
  },
];

async function main() {
  const resetAll = process.env.SEED_RESET === "all";
  const deleted = resetAll
    ? await prisma.project.deleteMany({})
    : await prisma.project.deleteMany({ where: { maintainerEmail: { endsWith: `@${SEED_DOMAIN}` } } });
  console.log(`Cleared ${deleted.count} ${resetAll ? "(all)" : "seed"} project(s).`);

  // Respect the 3-slot cap: only fill the WEEK spotlights still open.
  const existingSpot = await prisma.project.count({
    where: { pool: "WEEK", status: "SPOTLIGHT", isPeoplesChoice: false },
  });
  let slotsLeft = 3 - existingSpot;

  for (const s of SEEDS) {
    let status: "SPOTLIGHT" | "QUEUED" = "QUEUED";
    if (s.role === "filler" && slotsLeft > 0) {
      status = "SPOTLIGHT";
      slotsLeft--;
    }

    const members = Array.from({ length: s.crew }, (_, i) => ({
      name: NAMES[i % NAMES.length],
      email: `${s.slug}-${i}@${SEED_DOMAIN}`,
    }));

    const project = await prisma.project.create({
      data: {
        slug: s.slug,
        title: s.title,
        goal: s.goal,
        city: s.city,
        country: s.country,
        pool: "WEEK",
        status,
        maintainerName: members[0].name,
        maintainerEmail: members[0].email,
        members: { create: members },
        tasks: { create: s.tasks.map((title) => ({ title })) },
        updates: s.update ? { create: { authorName: members[0].name, text: s.update } } : undefined,
      },
      select: { id: true },
    });

    if (s.votes && s.votes > 0) {
      await prisma.pCVote.createMany({
        data: Array.from({ length: s.votes }, (_, i) => ({
          projectId: project.id,
          name: NAMES[(i + 3) % NAMES.length],
          email: `voter-${s.slug}-${i}@${SEED_DOMAIN}`,
        })),
      });
    }

    console.log(`+ ${status.padEnd(9)} ${s.title}${s.votes ? `  (${s.votes} votes)` : ""}`);
  }

  console.log(
    "\nDone. Spotlights fill the WEEK pool; candidates wait at /pc with primed votes.\n" +
      "Cast one more vote on Schoolyard or Tool Library (2 votes) to cross the threshold and claim the spot.",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
