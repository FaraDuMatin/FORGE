import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";
import { PrismaClient } from "@/generated/prisma/client";

// Neon's serverless driver speaks WebSocket. In Node (dev, and Vercel's Node
// runtime) there is no global WebSocket, so hand it `ws`. Prisma 7 has no
// datasource url; the connection string flows through the driver adapter.
neonConfig.webSocketConstructor = ws;

// One client, reused across hot reloads in dev and across warm serverless
// invocations in prod. Stateless: no in-memory app state, all state in Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function makeClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
