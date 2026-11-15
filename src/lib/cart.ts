export const CART_STORAGE_KEY = "sobe-o-som:cart";
export const CART_STORAGE_VERSION = 1;
export const MAX_CART_PRODUCTS = 50;
export const MAX_CART_QUANTITY = 99;

const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CartItem = {
    productId: string;
    quantity: number;
};

export type StoredCart = {
    items: CartItem[];
    ownerId: string | null;
    version: typeof CART_STORAGE_VERSION;
};

export type CartProduct = {
    artist: string;
    coverPath: string;
    id: string;
    name: string;
    priceInCents: number;
    referencePriceInCents: number | null;
    slug: string;
    stock: number;
};

export type ResolvedCartItem = CartItem &
    (
        | {
              product: CartProduct;
              status: "available" | "out_of_stock";
          }
        | {
              status: "unavailable";
          }
    );

export type CartMutation =
    | {
          productId: string;
          quantity: number;
          stock: number;
          type: "add";
      }
    | {
          productId: string;
          quantity: number;
          stock: number | null;
          type: "set";
      }
    | { productId: string; type: "remove" }
    | { type: "clear" };

export type CartMutationCode =
    | "added"
    | "cleared"
    | "invalid_quantity"
    | "product_limit"
    | "quantity_limit"
    | "removed"
    | "stock_limit"
    | "unchanged"
    | "updated";

export type CartMutationResult = {
    code: CartMutationCode;
    items: CartItem[];
};

export type CartOwnerDecision =
    | { action: "claim"; ownerId: string }
    | { action: "clear"; ownerId: string | null }
    | { action: "preserve"; ownerId: string | null }
    | { action: "wait"; ownerId: string | null };

export type CartSessionStatus = "authenticated" | "loading" | "unauthenticated";

export type CartStorageUpdate =
    | { action: "remove" }
    | { action: "wait" }
    | { action: "write"; value: string };

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && uuidPattern.test(value);
}

export function isValidCartQuantity(value: unknown): value is number {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= MAX_CART_QUANTITY
    );
}

export function normalizeCartItems(value: unknown): CartItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const quantities = new Map<string, number>();

    for (const candidate of value) {
        if (
            !candidate ||
            typeof candidate !== "object" ||
            !isUuid(Reflect.get(candidate, "productId")) ||
            !isValidCartQuantity(Reflect.get(candidate, "quantity"))
        ) {
            continue;
        }

        const productId = Reflect.get(candidate, "productId") as string;
        const quantity = Reflect.get(candidate, "quantity") as number;
        const currentQuantity = quantities.get(productId);

        if (currentQuantity !== undefined) {
            quantities.set(
                productId,
                Math.min(MAX_CART_QUANTITY, currentQuantity + quantity),
            );
            continue;
        }

        if (quantities.size < MAX_CART_PRODUCTS) {
            quantities.set(productId, quantity);
        }
    }

    return Array.from(quantities, ([productId, quantity]) => ({
        productId,
        quantity,
    }));
}

export function parseStoredCart(value: string | null): StoredCart | null {
    if (value === null) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(value);

        if (
            !parsed ||
            typeof parsed !== "object" ||
            Reflect.get(parsed, "version") !== CART_STORAGE_VERSION
        ) {
            return null;
        }

        const ownerId = Reflect.get(parsed, "ownerId");

        if (ownerId !== null && !isUuid(ownerId)) {
            return null;
        }

        return {
            items: normalizeCartItems(Reflect.get(parsed, "items")),
            ownerId,
            version: CART_STORAGE_VERSION,
        };
    } catch {
        return null;
    }
}

export function mutateCartItems(
    items: CartItem[],
    mutation: CartMutation,
): CartMutationResult {
    if (mutation.type === "clear") {
        return {
            code: items.length > 0 ? "cleared" : "unchanged",
            items: [],
        };
    }

    const itemIndex = items.findIndex(
        ({ productId }) => productId === mutation.productId,
    );

    if (mutation.type === "remove") {
        if (itemIndex === -1) {
            return { code: "unchanged", items };
        }

        return {
            code: "removed",
            items: items.filter((_, index) => index !== itemIndex),
        };
    }

    if (!isValidCartQuantity(mutation.quantity)) {
        return { code: "invalid_quantity", items };
    }

    if (mutation.type === "add") {
        if (!Number.isInteger(mutation.stock) || mutation.stock < 0) {
            return { code: "stock_limit", items };
        }

        if (itemIndex === -1) {
            if (items.length >= MAX_CART_PRODUCTS) {
                return { code: "product_limit", items };
            }

            if (mutation.quantity > mutation.stock) {
                return { code: "stock_limit", items };
            }

            return {
                code: "added",
                items: [
                    ...items,
                    {
                        productId: mutation.productId,
                        quantity: mutation.quantity,
                    },
                ],
            };
        }

        const current = items[itemIndex];
        const nextQuantity = current.quantity + mutation.quantity;

        if (nextQuantity > MAX_CART_QUANTITY) {
            return { code: "quantity_limit", items };
        }

        if (nextQuantity > mutation.stock) {
            return { code: "stock_limit", items };
        }

        return {
            code: "updated",
            items: items.map((item, index) =>
                index === itemIndex
                    ? { ...item, quantity: nextQuantity }
                    : item,
            ),
        };
    }

    if (itemIndex === -1) {
        return { code: "unchanged", items };
    }

    const current = items[itemIndex];

    if (mutation.quantity === current.quantity) {
        return { code: "unchanged", items };
    }

    if (
        mutation.quantity > current.quantity &&
        (mutation.stock === null || mutation.quantity > mutation.stock)
    ) {
        return { code: "stock_limit", items };
    }

    return {
        code: "updated",
        items: items.map((item, index) =>
            index === itemIndex
                ? { ...item, quantity: mutation.quantity }
                : item,
        ),
    };
}

export function reconcileCartOwner(
    ownerId: string | null,
    sessionStatus: CartSessionStatus,
    sessionUserId: string | null,
): CartOwnerDecision {
    if (sessionStatus === "loading") {
        return { action: "wait", ownerId };
    }

    if (sessionStatus === "unauthenticated" || !sessionUserId) {
        return ownerId === null
            ? { action: "preserve", ownerId }
            : { action: "clear", ownerId: null };
    }

    if (ownerId === null) {
        return { action: "claim", ownerId: sessionUserId };
    }

    return ownerId === sessionUserId
        ? { action: "preserve", ownerId }
        : { action: "clear", ownerId: sessionUserId };
}

export function reconcileStoredCart(
    storedCart: StoredCart,
    sessionStatus: CartSessionStatus,
    sessionUserId: string | null,
) {
    const decision = reconcileCartOwner(
        storedCart.ownerId,
        sessionStatus,
        sessionUserId,
    );

    return {
        cart: {
            items: decision.action === "clear" ? [] : storedCart.items,
            ownerId: decision.ownerId,
            version: CART_STORAGE_VERSION,
        } satisfies StoredCart,
        decision,
    };
}

export function getCartStorageUpdate(
    hydrated: boolean,
    items: CartItem[],
    ownerId: string | null,
): CartStorageUpdate {
    if (!hydrated) {
        return { action: "wait" };
    }

    if (items.length === 0) {
        return { action: "remove" };
    }

    return {
        action: "write",
        value: JSON.stringify({
            items,
            ownerId,
            version: CART_STORAGE_VERSION,
        } satisfies StoredCart),
    };
}

export function shouldDeferOwnedCartSync(
    storedCart: StoredCart,
    sessionStatus: CartSessionStatus,
) {
    return storedCart.ownerId !== null && sessionStatus !== "authenticated";
}

export function shouldProcessCartStorageEvent(logoutInProgress: boolean) {
    return !logoutInProgress;
}

export function getCartSignature(items: CartItem[]) {
    return items
        .map(({ productId, quantity }) => `${productId}:${quantity}`)
        .join("|");
}

export function shouldAcceptCartResponse(
    requestId: number,
    activeRequestId: number,
    requestSignature: string,
    currentSignature: string,
) {
    return (
        requestId === activeRequestId && requestSignature === currentSignature
    );
}

export function getCartUnitCount(items: CartItem[]) {
    return items.reduce((total, item) => total + item.quantity, 0);
}

export function calculateCartTotal(
    items: CartItem[],
    resolvedItems: ResolvedCartItem[],
): number | null {
    if (items.length !== resolvedItems.length) {
        return null;
    }

    const resolvedById = new Map(
        resolvedItems.map((item) => [item.productId, item]),
    );
    let total = 0;

    for (const item of items) {
        const resolved = resolvedById.get(item.productId);

        if (!resolved || resolved.status === "unavailable") {
            return null;
        }

        total += resolved.product.priceInCents * item.quantity;
    }

    return total;
}
