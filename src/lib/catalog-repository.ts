import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { Prisma } from "@/generated/prisma/client";
import {
    CATALOG_PAGE_SIZE,
    buildCatalogHref,
    parseCatalogParams,
    type CatalogFilters,
    type RawCatalogParams,
} from "@/lib/catalog-params";

export type CatalogCategory = {
    name: string;
    slug: string;
};

export type CatalogProduct = {
    artist: string;
    category: CatalogCategory;
    coverPath: string;
    id: string;
    name: string;
    priceInCents: number;
    referencePriceInCents: number | null;
    slug: string;
    stock: number;
};

export type ProductDetail = CatalogProduct & {
    description: string;
    releaseYear: number;
};

export type CatalogResult = {
    categories: CatalogCategory[];
    filters: CatalogFilters;
    canonicalHref: string;
    pageCount: number;
    products: CatalogProduct[];
    shouldRedirect: boolean;
    total: number;
};

const categorySelect = {
    name: true,
    slug: true,
} satisfies Prisma.CategorySelect;

const productSelect = {
    artist: true,
    category: { select: categorySelect },
    coverPath: true,
    id: true,
    name: true,
    priceInCents: true,
    referencePriceInCents: true,
    slug: true,
    stock: true,
} satisfies Prisma.ProductSelect;

const categoryOrder = [
    "mpb-e-samba",
    "rock",
    "jazz-e-blues",
    "soul-e-funk",
    "pop",
    "eletronica",
];

export async function queryCatalogCategories(
    prisma: PrismaClient,
): Promise<CatalogCategory[]> {
    const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
        select: categorySelect,
    });

    return categories.sort((left, right) => {
        const leftIndex = categoryOrder.indexOf(left.slug);
        const rightIndex = categoryOrder.indexOf(right.slug);

        if (leftIndex === -1 && rightIndex === -1) {
            return left.name.localeCompare(right.name, "pt-BR");
        }

        if (leftIndex === -1) {
            return 1;
        }

        if (rightIndex === -1) {
            return -1;
        }

        return leftIndex - rightIndex;
    });
}

function escapeLikePattern(value: string) {
    return value.replace(/[\\%_]/g, "\\$&");
}

export async function queryCatalog(
    prisma: PrismaClient,
    rawParams: RawCatalogParams,
): Promise<CatalogResult> {
    const parsed = parseCatalogParams(rawParams);
    const categories = await queryCatalogCategories(prisma);
    const searchPattern = escapeLikePattern(parsed.query);
    const validGenre = categories.some(
        (category) => category.slug === parsed.genre,
    )
        ? parsed.genre
        : null;
    const filtersWithoutPage: CatalogFilters = {
        genre: validGenre,
        page: parsed.page,
        query: parsed.query,
        sale: parsed.sale,
    };
    const where: Prisma.ProductWhereInput = {
        isActive: true,
        ...(validGenre ? { category: { slug: validGenre } } : {}),
        ...(parsed.query
            ? {
                  OR: [
                      {
                          name: {
                              contains: searchPattern,
                              mode: "insensitive" as const,
                          },
                      },
                      {
                          artist: {
                              contains: searchPattern,
                              mode: "insensitive" as const,
                          },
                      },
                  ],
              }
            : {}),
        ...(parsed.sale
            ? {
                  referencePriceInCents: {
                      gt: prisma.product.fields.priceInCents,
                  },
              }
            : {}),
    };
    const total = await prisma.product.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));
    const page = Math.min(parsed.page, pageCount);
    const filters = { ...filtersWithoutPage, page };
    const products = await prisma.product.findMany({
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: productSelect,
        skip: (page - 1) * CATALOG_PAGE_SIZE,
        take: CATALOG_PAGE_SIZE,
        where,
    });
    const canonicalHref = buildCatalogHref(filters);

    return {
        categories,
        filters,
        canonicalHref,
        pageCount,
        products,
        shouldRedirect:
            parsed.hasInvalidParams ||
            parsed.genre !== validGenre ||
            parsed.page !== page,
        total,
    };
}

export async function queryProductBySlug(
    prisma: PrismaClient,
    slug: string,
): Promise<ProductDetail | null> {
    if (!/^[a-z0-9-]{1,180}$/.test(slug)) {
        return null;
    }

    return prisma.product.findFirst({
        select: {
            ...productSelect,
            description: true,
            releaseYear: true,
        },
        where: {
            isActive: true,
            slug,
        },
    });
}
