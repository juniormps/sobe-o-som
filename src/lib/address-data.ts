import "server-only";

import { connection } from "next/server";

import { listAddressesByUserId } from "@/lib/address-repository";
import { getPrisma } from "@/lib/prisma";

export type { CheckoutAddress } from "@/lib/address-repository";

export async function getOwnAddresses(userId: string) {
    await connection();

    return listAddressesByUserId(getPrisma(), userId);
}
