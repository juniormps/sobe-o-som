import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import {
    createAddressByUserId,
    findAddressByUserId,
    setDefaultAddressByUserId,
} from "@/lib/address-repository";
import { isUuid, validateAddressInput } from "@/lib/address-rules";

type Identity = { id: string } | null;

export async function createOwnAddress(
    prisma: PrismaClient,
    identity: Identity,
    input: unknown,
) {
    if (!identity) {
        return { status: "unauthenticated" } as const;
    }

    const validation = validateAddressInput(input);

    if (validation.status === "invalid") {
        return {
            errors: validation.errors,
            status: "invalid",
        } as const;
    }

    const address = await createAddressByUserId(
        prisma,
        identity.id,
        validation.data,
    );

    return address
        ? ({ address, status: "created" } as const)
        : ({ status: "unauthenticated" } as const);
}

export async function setOwnDefaultAddress(
    prisma: PrismaClient,
    identity: Identity,
    addressId: unknown,
) {
    if (!identity) {
        return { status: "unauthenticated" } as const;
    }

    if (!isUuid(addressId)) {
        return { status: "not_found" } as const;
    }

    const address = await setDefaultAddressByUserId(
        prisma,
        identity.id,
        addressId,
    );

    return address
        ? ({ address, status: "updated" } as const)
        : ({ status: "not_found" } as const);
}

export async function confirmOwnAddress(
    prisma: PrismaClient,
    identity: Identity,
    addressId: unknown,
) {
    if (!identity) {
        return { status: "unauthenticated" } as const;
    }

    if (!isUuid(addressId)) {
        return { status: "not_found" } as const;
    }

    const address = await findAddressByUserId(prisma, identity.id, addressId);

    return address
        ? ({ address, status: "confirmed" } as const)
        : ({ status: "not_found" } as const);
}
