import "dotenv/config";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

// One-time search setup for the directory. pg_trgm powers fuzzy/typo-tolerant
// matching (word_similarity); the GIN indexes keep both full-text and trigram
// search sub-millisecond as the table grows. Idempotent — safe to re-run (e.g.
// after SEED_RESET=all, though indexes/extension survive a row wipe).
//
// The index expressions MUST stay identical to TSV and FUZZY in
// src/server/directory.ts, or Postgres won't use the indexes:
//   • FTS  = weighted 'simple' tsvector, title (A) > city/country (B) > goal (C).
//   • trgm = title + city + country only (the fuzzy doc; goal excluded as noise).
// `||`, setweight, and to_tsvector with an explicit config are IMMUTABLE, so both
// are valid expression indexes. Expressions changed, so we DROP then CREATE
// (CREATE INDEX IF NOT EXISTS only checks the name, not the definition).
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });

const DDL = [
  `CREATE EXTENSION IF NOT EXISTS pg_trgm`,
  `DROP INDEX IF EXISTS project_trgm_idx`,
  `CREATE INDEX project_trgm_idx ON "Project"
     USING gin ((title || ' ' || city || ' ' || country) gin_trgm_ops)`,
  `DROP INDEX IF EXISTS project_fts_idx`,
  `CREATE INDEX project_fts_idx ON "Project"
     USING gin ((setweight(to_tsvector('simple', title), 'A') || setweight(to_tsvector('simple', city || ' ' || country), 'B') || setweight(to_tsvector('simple', goal), 'C')))`,
];

async function main() {
  for (const stmt of DDL) {
    await prisma.$executeRawUnsafe(stmt);
    console.log("✓ " + stmt.split("\n")[0].trim());
  }
  console.log("\nSearch index ready (pg_trgm + GIN full-text + trigram).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
