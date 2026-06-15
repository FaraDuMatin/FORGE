import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Pool, ProjectStatus } from "../src/generated/prisma/client";

// Demo seed. Seed rows are tagged with the @seed.forge maintainer domain so this
// can wipe and re-create them without touching real data. Run `SEED_RESET=all
// npm run db:seed` to instead wipe EVERY project for a pristine demo.
//
// What it builds (≈16 projects across all four pools):
//   • WEEK spotlights fill the pool; WEEK "candidates" stay queued with primed
//     votes (2, 2, 1 — just under the threshold of 3). Cast one more vote on a
//     candidate at /pc and it crosses the threshold and claims People's Choice.
//   • One spotlight in each of MONTH / HALF_YEAR / YEAR so the home grid is alive.
//   • 3 CLOSED wins (with outcomes) for the win wall, two of them already FORKED
//     into other cities — so "Copied in N cities" shows real lineage.
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const SEED_DOMAIN = "seed.forge";
const SLOTS_PER_POOL = 3; // mirror lib/pools.ts; status is set directly here, so caps are enforced manually
const POOLS: Pool[] = ["WEEK", "MONTH", "HALF_YEAR", "YEAR"];
const NAMES = ["Maria", "Tom", "Amara", "Liang", "Sofia", "Noah", "Ines", "Kofi", "Yuki", "Diego", "Priya", "Mateo", "Fatou", "Hana", "Bruno"];
const ROLES = ["organizer", "logistics", "outreach", "treasurer", "documentation", "facilitator"];

// kind drives status: spotlight → takes a slot if free; candidate → QUEUED + votes;
// notready → QUEUED (thin); win → CLOSED + outcome; fork → QUEUED clone of a win
// (or a slot if `spotlight` is set). forkOf references a win's slug created earlier.
type Kind = "spotlight" | "candidate" | "notready" | "win" | "fork";
type Seed = {
  slug: string;
  title: string;
  goal: string;
  city: string;
  country: string;
  pool: Pool;
  kind: Kind;
  crew: number;
  roles?: number; // how many crew carry a named role
  tasks: string[];
  update?: string | null;
  votes?: number; // primed People's Choice votes (candidates only)
  outcome?: string; // wins only
  forkOf?: string; // forks only — source win slug
  spotlight?: boolean; // a fork that should also take a slot
  successor?: boolean; // name a successor (longer pools need one to be "ready")
  fundingUrl?: string;
};

const SEEDS: Seed[] = [
  // ── WEEK spotlights (fill the pool) ───────────────────────────────────────
  {
    slug: "canal-bank-cleanup", title: "Canal Bank Cleanup", pool: "WEEK", kind: "spotlight",
    goal: "Clear the litter and invasive weeds along 800m of the canal towpath in one Saturday.",
    city: "Lyon", country: "France", crew: 7,
    tasks: ["Borrow grabbers and bags from the town hall", "Map the worst three stretches", "Post the meeting point and time"],
    update: "Town hall said yes to lending equipment. Meeting point set at the lock gates, 9am Saturday.",
  },
  {
    slug: "pollinator-verges", title: "Pollinator Verges", pool: "WEEK", kind: "spotlight",
    goal: "Sow wildflower strips on four neglected road verges to bring back bees and butterflies.",
    city: "Bristol", country: "United Kingdom", crew: 6,
    tasks: ["Get council sign-off for the four verges", "Buy native seed mix", "Rake and prep the soil"],
    update: "Council approved all four verges. Seed mix ordered from a local supplier.",
  },
  {
    slug: "repair-cafe-saturday", title: "Repair Café Saturday", pool: "WEEK", kind: "spotlight",
    goal: "Run a one-day repair café so neighbours can fix small appliances instead of binning them.",
    city: "Porto", country: "Portugal", crew: 8,
    tasks: ["Find a hall for the day", "Recruit three fixers", "Print flyers for the street"],
    update: "Community hall booked for the 21st. Two fixers signed up, one more to go.",
  },

  // ── WEEK People's Choice candidates (primed votes 2 / 2 / 1) ───────────────
  {
    slug: "schoolyard-rain-garden", title: "Schoolyard Rain Garden", pool: "WEEK", kind: "candidate", votes: 2,
    goal: "Dig a small rain garden in the school yard to soak up runoff and teach the kids about it.",
    city: "Utrecht", country: "Netherlands", crew: 5,
    tasks: ["Mark out the low corner that floods", "Source native wetland plants", "Plan a planting morning with a class"],
    update: "Head teacher is on board. We picked the corner by the bike shed that always puddles.",
  },
  {
    slug: "tool-library-launch", title: "Tool Library Launch", pool: "WEEK", kind: "candidate", votes: 2,
    goal: "Open a lending shelf of shared tools so people borrow a drill instead of buying one.",
    city: "Gent", country: "Belgium", crew: 6,
    tasks: ["Collect donated tools from the neighbourhood", "Build a simple borrow log", "Find a dry cupboard to host it"],
    update: "Five neighbours already offered tools. A café offered cupboard space if we keep it tidy.",
  },
  {
    slug: "riverside-tree-planting", title: "Riverside Tree Planting", pool: "WEEK", kind: "candidate", votes: 1,
    goal: "Plant 30 native saplings along the riverbank to shade the water and hold the soil.",
    city: "Tours", country: "France", crew: 5,
    tasks: ["Confirm the stretch with the river authority", "Order 30 bare-root saplings", "Organise a Saturday planting"],
    update: "River authority pointed us to a bare stretch that badly needs shade. Saplings priced up.",
  },

  // ── WEEK getting-ready ─────────────────────────────────────────────────────
  {
    slug: "balcony-compost-network", title: "Balcony Compost Network", pool: "WEEK", kind: "notready",
    goal: "Link up balcony composters so food scraps feed local planters instead of landfill.",
    city: "Nantes", country: "France", crew: 2,
    tasks: [],
    update: null,
  },

  // ── Longer-pool spotlights (one each, so the home grid is alive worldwide) ──
  {
    slug: "rooftop-garden-network", title: "Rooftop Garden Network", pool: "MONTH", kind: "spotlight", roles: 2,
    goal: "Turn five flat rooftops into shared veg gardens and connect the growers into one crew.",
    city: "Barcelona", country: "Spain", crew: 9,
    tasks: ["Survey the five rooftops for load and access", "Match each roof with a lead grower", "Bulk-order soil and planters"],
    update: "Three building councils said yes. Load survey booked for two of the roofs next week.",
  },
  {
    slug: "neighbourhood-microgrid", title: "Neighbourhood Microgrid Study", pool: "HALF_YEAR", kind: "spotlight", roles: 3, successor: true,
    goal: "Map whether our block could share a solar-plus-battery microgrid and what it would take.",
    city: "Cape Town", country: "South Africa", crew: 13,
    tasks: ["Collect a year of bills from volunteer households", "Find an engineer to sanity-check the model", "Draft the shared-ownership options"],
    update: "Eleven households shared bills. A retired grid engineer offered to review our load model.",
  },
  {
    slug: "urban-food-forest", title: "Urban Food Forest", pool: "YEAR", kind: "spotlight", roles: 4, successor: true,
    goal: "Plant a self-sustaining food forest on a disused lot — fruit, nuts and herbs anyone can pick.",
    city: "Bengaluru", country: "India", crew: 16,
    tasks: ["Secure a multi-year lease on the lot", "Design the guild planting layout", "Run a soil-building working day"],
    update: "City parks dept agreed to a five-year lease. Permaculture designer drafted the first layout.",
    fundingUrl: "https://opencollective.com/urban-food-forest",
  },

  // ── Win wall: finished projects → playbooks ───────────────────────────────
  {
    slug: "solar-school-win", title: "Solar on the Primary School", pool: "MONTH", kind: "win", roles: 2,
    goal: "Crowd-fund and install a rooftop solar array on the local primary school.",
    city: "Medellín", country: "Colombia", crew: 11,
    tasks: ["Get the engineering quote", "Run the parent crowdfunder", "Schedule the install in the holidays"],
    update: "Panels are up and feeding the grid. The first sunny-day meter reading made the kids cheer.",
    outcome: "6 kW installed over the summer holidays for $4,800, all parent-crowdfunded. Cuts the school's bill by ~40% and now powers a live energy dashboard in the science class. Full parts list, supplier and crowdfunder template are in the build log.",
  },
  {
    slug: "seed-library-win", title: "Library Seed Swap", pool: "WEEK", kind: "win",
    goal: "Set up a free seed-swap shelf inside the public library so anyone can take and return seeds.",
    city: "Dublin", country: "Ireland", crew: 6,
    tasks: ["Get the librarian's blessing and a shelf", "Print envelopes and a simple sign-out card", "Seed the shelf with donated packets"],
    update: "Opening day cleared 400 packets. The librarian wants to make it permanent.",
    outcome: "400+ seed packets swapped in the first month from a single repurposed library shelf. Zero budget — donated seeds, printed envelopes, one volunteer hour a week. The one-page setup sheet is the whole playbook.",
  },
  {
    slug: "bike-kitchen-win", title: "Community Bike Kitchen", pool: "HALF_YEAR", kind: "win", roles: 3, successor: true,
    goal: "Open a volunteer-run workshop where people fix their own bikes with shared tools and mentors.",
    city: "Montréal", country: "Canada", crew: 14,
    tasks: ["Find a garage or unused unit", "Gather tools and a stock of used parts", "Train the first mentors"],
    update: "Six months in, we've run every Saturday and trained four new mentors who now run sessions.",
    outcome: "120 bikes back on the road in six months from a donated garage unit. Runs entirely on volunteer mentors and salvaged parts; succession handled (two leads trained). Tool list, waiver template and the mentor rota are in the build log.",
  },

  // ── Forks of the wins → light up "Copied in N cities" ─────────────────────
  {
    slug: "solar-school-rio", title: "Solar on the Primary School", pool: "MONTH", kind: "fork", forkOf: "solar-school-win", roles: 2,
    goal: "Crowd-fund and install a rooftop solar array on our neighbourhood primary school.",
    city: "Rio de Janeiro", country: "Brazil", crew: 7,
    tasks: ["Adapt the crowdfunder copy for our school", "Get three local installer quotes", "Hold a parents' info evening"],
    update: "Copied the Medellín playbook. Two installer quotes in, parents' evening set for next Thursday.",
  },
  {
    slug: "solar-school-nairobi", title: "Solar on the Primary School", pool: "MONTH", kind: "fork", forkOf: "solar-school-win", spotlight: true, roles: 2,
    goal: "Put solar on the school roof to cut bills and keep the lights on through outages.",
    city: "Nairobi", country: "Kenya", crew: 10,
    tasks: ["Confirm roof condition with a local engineer", "Run the crowdfunder with M-Pesa", "Line up an accredited installer"],
    update: "Following the Medellín build step by step. Crowdfunder live, already a third of the way there.",
  },
  {
    slug: "seed-library-lisbon", title: "Library Seed Swap", pool: "WEEK", kind: "fork", forkOf: "seed-library-win",
    goal: "Copy Dublin's free seed-swap shelf into our own neighbourhood library.",
    city: "Lisbon", country: "Portugal", crew: 4,
    tasks: ["Ask our librarian for a shelf", "Print the envelopes from the Dublin sheet", "Collect donated seeds at the next market"],
    update: "Librarian loved it. Printing the same sign-out cards Dublin used.",
  },
];

function makeMembers(slug: string, crew: number, roleCount: number) {
  // Seed crew is approved — they count toward readiness. (Real joins start PENDING.)
  return Array.from({ length: crew }, (_, i) => ({
    name: NAMES[i % NAMES.length],
    email: `${slug}-${i}@${SEED_DOMAIN}`,
    role: i < roleCount ? ROLES[i % ROLES.length] : null,
    status: "APPROVED" as const,
  }));
}

async function main() {
  const resetAll = process.env.SEED_RESET === "all";
  const deleted = resetAll
    ? await prisma.project.deleteMany({})
    : await prisma.project.deleteMany({ where: { maintainerEmail: { endsWith: `@${SEED_DOMAIN}` } } });
  console.log(`Cleared ${deleted.count} ${resetAll ? "(all)" : "seed"} project(s).`);

  // Respect the 3-slot cap per pool: only fill spotlights still open.
  const slotsLeft: Record<Pool, number> = { WEEK: 0, MONTH: 0, HALF_YEAR: 0, YEAR: 0 };
  for (const p of POOLS) {
    const taken = await prisma.project.count({ where: { pool: p, status: "SPOTLIGHT", isPeoplesChoice: false } });
    slotsLeft[p] = Math.max(0, SLOTS_PER_POOL - taken);
  }

  const idBySlug = new Map<string, string>();

  for (const s of SEEDS) {
    const wantsSlot = s.kind === "spotlight" || s.spotlight === true;
    let status: ProjectStatus = "QUEUED";
    if (s.kind === "win") {
      status = "CLOSED";
    } else if (wantsSlot && slotsLeft[s.pool] > 0) {
      status = "SPOTLIGHT";
      slotsLeft[s.pool]--;
    }

    const members = makeMembers(s.slug, s.crew, s.roles ?? 0);
    const clonedFrom = s.forkOf ? idBySlug.get(s.forkOf) ?? null : null;

    const project = await prisma.project.create({
      data: {
        slug: s.slug,
        title: s.title,
        goal: s.goal,
        city: s.city,
        country: s.country,
        pool: s.pool,
        status,
        outcome: s.outcome ?? null,
        clonedFrom,
        fundingUrl: s.fundingUrl ?? null,
        successorName: s.successor ? NAMES[(s.crew + 1) % NAMES.length] : null,
        successorEmail: s.successor ? `${s.slug}-successor@${SEED_DOMAIN}` : null,
        maintainerName: members[0].name,
        maintainerEmail: members[0].email,
        members: { create: members },
        tasks: { create: s.tasks.map((title) => ({ title })) },
        updates: s.update ? { create: { authorName: members[0].name, text: s.update } } : undefined,
      },
      select: { id: true },
    });
    idBySlug.set(s.slug, project.id);

    if (s.votes && s.votes > 0) {
      await prisma.pCVote.createMany({
        data: Array.from({ length: s.votes }, (_, i) => ({
          projectId: project.id,
          name: NAMES[(i + 3) % NAMES.length],
          email: `voter-${s.slug}-${i}@${SEED_DOMAIN}`,
        })),
      });
    }

    const tag = s.forkOf ? `${status} ← ${s.forkOf}` : status;
    const extra = s.votes ? `  (${s.votes} votes)` : s.kind === "win" ? "  (win)" : "";
    console.log(`+ ${tag.padEnd(22)} ${s.title}${extra}`);
  }

  console.log(
    "\nDone." +
      "\n  • /pc: cast one more vote on Schoolyard or Tool Library (2 votes) to cross the threshold and claim the spot." +
      "\n  • /wins: Solar on the Primary School is copied in 2 cities (Rio, Nairobi); Library Seed Swap in 1 (Lisbon).",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
