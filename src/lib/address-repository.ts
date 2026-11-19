import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { AddressInput } from "@/lib/address-rules";

const addressSelect = {
    city: true,
    complement: true,
    district: true,
    hasNoNumber: true,
    id: true,
    isDefault: true,
    number: true,
    postalCode: true,
    recipient: true,
    state: true,
    street: true,
} as const;

export type CheckoutAddress = {
    city: string;
    complement: string | null;
    district: string | null;
    hasNoNumber: boolean;
    id: string;
    isDefault: boolean;
    number: string | null;
    postalCode: string;
    recipient: string;
    state: string;
    street: string;
};

export function listAddressesByUserId(prisma: PrismaClient, userId: string) {
    return prisma.address.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }, { id: "asc" }],
        select: addressSelect,
        where: { userId },
    });
}

export async function createAddressByUserId(
    prisma: PrismaClient,
    userId: string,
    data: AddressInput,
) {
    return prisma.$transaction(async (transaction) => {
        const users = await transaction.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "User"
            WHERE "id" = ${userId}::uuid
            FOR UPDATE
        `;

        if (users.length === 0) {
            return null;
        }

        const addressCount = await transaction.address.count({
            where: { userId },
        });

        return transaction.address.create({
            data: {
                ...data,
                isDefault: addressCount === 0,
                userId,
            },
            select: addressSelect,
        });
    });
}

export async function setDefaultAddressByUserId(
    prisma: PrismaClient,
    userId: string,
    addressId: string,
) {
    return prisma.$transaction(async (transaction) => {
        const users = await transaction.$queryRaw<Array<{ id: string }>>`
            SELECT "id" FROM "User"
            WHERE "id" = ${userId}::uuid
            FOR UPDATE
        `;

        if (users.length === 0) {
            return null;
        }

        const address = await transaction.address.findFirst({
            select: { id: true, isDefault: true },
            where: { id: addressId, userId },
        });

        if (!address) {
            return null;
        }

        if (!address.isDefault) {
            await transaction.address.updateMany({
                data: { isDefault: false },
                where: { isDefault: true, userId },
            });
            await transaction.address.update({
                data: { isDefault: true },
                where: { id: address.id },
            });
        }

        return transaction.address.findFirst({
            select: addressSelect,
            where: { id: address.id, userId },
        });
    });
}

export function findAddressByUserId(
    prisma: PrismaClient,
    userId: string,
    addressId: string,
) {
    return prisma.address.findFirst({
        select: addressSelect,
        where: { id: addressId, userId },
    });
}
