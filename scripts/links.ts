import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

// Prints the maintainer (manage) link for every project. The token lives in the DB
// (Project.maintainerToken) — there are no accounts, so this is how you recover it.
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const BASE = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const projects = await prisma.project.findMany({
    select: { title: true, slug: true, status: true, isPeoplesChoice: true, maintainerToken: true },
    orderBy: { createdAt: "desc" },
  });

  if (projects.length === 0) {
    console.log("No projects.");
    return;
  }

  // Tokens rotate: every reseed recreates rows with new tokens, and handoff/adopt
  // rotate them too. Any link copied before that dies — re-run this AFTER seeding.
  console.log("Tokens rotate on every reseed/handoff. Re-run `npm run db:links` after seeding.");

  for (const p of projects) {
    const tag = p.isPeoplesChoice ? "PEOPLES_CHOICE" : p.status;
    console.log(`\n${p.title}  [${tag}]`);
    console.log(`  ${BASE}/en/p/${p.slug}/manage?t=${p.maintainerToken}`);
    console.log(`  token: ${p.maintainerToken}`); // paste into the in-app /me resume field
  }
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
