import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

let prisma = globalForPrisma.prisma;

export function getPrisma() {
    if (prisma) {
        return prisma;
    }

    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL nao esta definida.");
    }

    const adapter = new PrismaPg({
        connectionString,
        connectionTimeoutMillis: 5_000,
    });

    prisma = new PrismaClient({ adapter });

    if (process.env.NODE_ENV !== "production") {
        globalForPrisma.prisma = prisma;
    }

    return prisma;
}
