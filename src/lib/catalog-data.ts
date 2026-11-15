import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import type { RawCatalogParams } from "@/lib/catalog-params";
import {
    queryCatalog,
    queryCatalogCategories,
    queryProductBySlug,
} from "@/lib/catalog-repository";
import { getPrisma } from "@/lib/prisma";

export type {
    CatalogCategory,
    CatalogProduct,
    CatalogResult,
    ProductDetail,
} from "@/lib/catalog-repository";

export const getCatalogCategories = cache(async () => {
    await connection();

    return queryCatalogCategories(getPrisma());
});

export async function getCatalog(rawParams: RawCatalogParams) {
    await connection();

    return queryCatalog(getPrisma(), rawParams);
}

export const getProductBySlug = cache(async (slug: string) => {
    await connection();

    return queryProductBySlug(getPrisma(), slug);
});
