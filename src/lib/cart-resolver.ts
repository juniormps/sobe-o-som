import {
    MAX_CART_PRODUCTS,
    type CartItem,
    type CartProduct,
    type ResolvedCartItem,
    isUuid,
    isValidCartQuantity,
} from "@/lib/cart";

export type CartResolveInput = {
    items: CartItem[];
};

export function parseCartResolveInput(value: unknown): CartResolveInput | null {
    if (
        !value ||
        typeof value !== "object" ||
        Object.keys(value).length !== 1 ||
        !("items" in value)
    ) {
        return null;
    }

    const items = Reflect.get(value, "items");

    if (!Array.isArray(items) || items.length > MAX_CART_PRODUCTS) {
        return null;
    }

    const seenIds = new Set<string>();
    const parsedItems: CartItem[] = [];

    for (const item of items) {
        if (
            !item ||
            typeof item !== "object" ||
            Object.keys(item).length !== 2 ||
            !("productId" in item) ||
            !("quantity" in item)
        ) {
            return null;
        }

        const productId = Reflect.get(item, "productId");
        const quantity = Reflect.get(item, "quantity");

        if (
            !isUuid(productId) ||
            !isValidCartQuantity(quantity) ||
            seenIds.has(productId)
        ) {
            return null;
        }

        seenIds.add(productId);
        parsedItems.push({ productId, quantity });
    }

    return { items: parsedItems };
}

export function mapResolvedCartItems(
    items: CartItem[],
    products: CartProduct[],
): ResolvedCartItem[] {
    const productsById = new Map(
        products.map((product) => [product.id, product]),
    );

    return items.map((item) => {
        const product = productsById.get(item.productId);

        if (!product) {
            return { ...item, status: "unavailable" };
        }

        return {
            ...item,
            product,
            status: product.stock === 0 ? "out_of_stock" : "available",
        };
    });
}

export async function resolveCartItems(
    items: CartItem[],
    queryProducts: (productIds: string[]) => Promise<CartProduct[]>,
) {
    const products = await queryProducts(
        items.map(({ productId }) => productId),
    );

    return mapResolvedCartItems(items, products);
}

export function parseCartResolveResponse(
    value: unknown,
): ResolvedCartItem[] | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const items = Reflect.get(value, "items");

    if (!Array.isArray(items) || items.length > MAX_CART_PRODUCTS) {
        return null;
    }

    const parsedItems: ResolvedCartItem[] = [];
    const seenIds = new Set<string>();

    for (const item of items) {
        if (!item || typeof item !== "object") {
            return null;
        }

        const productId = Reflect.get(item, "productId");
        const quantity = Reflect.get(item, "quantity");
        const status = Reflect.get(item, "status");

        if (
            !isUuid(productId) ||
            !isValidCartQuantity(quantity) ||
            seenIds.has(productId)
        ) {
            return null;
        }

        seenIds.add(productId);

        if (status === "unavailable") {
            parsedItems.push({ productId, quantity, status });
            continue;
        }

        const product = Reflect.get(item, "product");

        if (
            (status !== "available" && status !== "out_of_stock") ||
            !product ||
            typeof product !== "object" ||
            Reflect.get(product, "id") !== productId ||
            typeof Reflect.get(product, "artist") !== "string" ||
            typeof Reflect.get(product, "coverPath") !== "string" ||
            typeof Reflect.get(product, "name") !== "string" ||
            typeof Reflect.get(product, "slug") !== "string"
        ) {
            return null;
        }

        const priceInCents = Reflect.get(product, "priceInCents");
        const referencePriceInCents = Reflect.get(
            product,
            "referencePriceInCents",
        );
        const stock = Reflect.get(product, "stock");

        if (
            !Number.isInteger(priceInCents) ||
            (priceInCents as number) <= 0 ||
            (referencePriceInCents !== null &&
                (!Number.isInteger(referencePriceInCents) ||
                    (referencePriceInCents as number) <=
                        (priceInCents as number))) ||
            !Number.isInteger(stock) ||
            (stock as number) < 0 ||
            (status === "out_of_stock") !== (stock === 0)
        ) {
            return null;
        }

        parsedItems.push({
            productId,
            quantity,
            status,
            product: {
                artist: Reflect.get(product, "artist") as string,
                coverPath: Reflect.get(product, "coverPath") as string,
                id: productId,
                name: Reflect.get(product, "name") as string,
                priceInCents: priceInCents as number,
                referencePriceInCents: referencePriceInCents as number | null,
                slug: Reflect.get(product, "slug") as string,
                stock: stock as number,
            },
        });
    }

    return parsedItems;
}
