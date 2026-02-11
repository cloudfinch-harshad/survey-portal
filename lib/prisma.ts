import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let failedToInitialize = false;

export function getPrismaClient() {
  if (!process.env.DATABASE_URL || failedToInitialize) {
    return null;
  }

  if (!globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma = new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    } catch (error) {
      failedToInitialize = true;
      console.error("Unable to initialize Prisma client:", error);
      return null;
    }
  }

  return globalForPrisma.prisma;
}
