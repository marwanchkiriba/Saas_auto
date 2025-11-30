import { PrismaClient } from "../generated/prisma";

const logLevels: ("query" | "info" | "warn" | "error")[] =
  process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"];

// Re-use client in dev to avoid exhausting DB connections on hot reload.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logLevels,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
