import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const createClient = () => {
  const rawUrl = process.env.DATABASE_URL;

  // Support Prisma Accelerate/Data Proxy style URLs by stripping the prisma+ prefix and using the pg adapter.
  if (rawUrl && rawUrl.startsWith("prisma+")) {
    const connectionString = rawUrl.replace(/^prisma\+/, "");
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
