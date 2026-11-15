import "server-only";

import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { CartProduct } from "@/lib/cart";

const cartProductSelect = {
    artist: true,
    coverPath: true,
    id: true,
    name: true,
    priceInCents: true,
    referencePriceInCents: true,
    slug: true,
    stock: true,
} satisfies Prisma.ProductSelect;

export async function queryCartProducts(
    prisma: PrismaClient,
    productIds: string[],
): Promise<CartProduct[]> {
    if (productIds.length === 0) {
        return [];
    }

    return prisma.product.findMany({
        select: cartProductSelect,
        where: {
            id: { in: productIds },
            isActive: true,
        },
    });
}
