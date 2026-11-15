"use client";

/* eslint-disable react-hooks/set-state-in-effect -- Browser storage and session are external systems restored after hydration. */

import { useSession } from "next-auth/react";
import {
    createContext,
    useContext,
    useEffect,
    useReducer,
    useRef,
    useState,
    type ReactNode,
} from "react";

import {
    CART_STORAGE_KEY,
    type CartItem,
    type CartMutation,
    type CartMutationResult,
    type ResolvedCartItem,
    getCartSignature,
    getCartStorageUpdate,
    getCartUnitCount,
    mutateCartItems,
    parseStoredCart,
    reconcileCartOwner,
    reconcileStoredCart,
    shouldAcceptCartResponse,
    shouldDeferOwnedCartSync,
    shouldProcessCartStorageEvent,
} from "@/lib/cart";
import { parseCartResolveResponse } from "@/lib/cart-resolver";

type CartState = {
    hydrated: boolean;
    items: CartItem[];
};

type CartAction =
    | { items: CartItem[]; type: "replace" }
    | { items: CartItem[]; type: "restore" };

type CartResolution =
    | { items: ResolvedCartItem[]; status: "ready" }
    | { items: ResolvedCartItem[]; status: "idle" | "loading" }
    | { items: ResolvedCartItem[]; status: "error" };

type CartContextValue = {
    addItem: (
        productId: string,
        quantity: number,
        stock: number,
    ) => CartMutationResult;
    clearCart: () => CartMutationResult;
    clearForLogout: () => void;
    hydrated: boolean;
    items: CartItem[];
    refreshCart: () => void;
    removeItem: (productId: string) => CartMutationResult;
    resolution: CartResolution;
    setItemQuantity: (
        productId: string,
        quantity: number,
        stock: number | null,
    ) => CartMutationResult;
    unitCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
    if (action.type === "restore") {
        return { hydrated: true, items: action.items };
    }

    return { ...state, items: action.items };
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { data: session, status: sessionStatus } = useSession();
    const [state, dispatch] = useReducer(cartReducer, {
        hydrated: false,
        items: [],
    });
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [pendingSyncVersion, setPendingSyncVersion] = useState(0);
    const [refreshVersion, setRefreshVersion] = useState(0);
    const [resolution, setResolution] = useState<CartResolution>({
        items: [],
        status: "idle",
    });
    const stateRef = useRef(state);
    const ownerIdRef = useRef(ownerId);
    const sessionStatusRef = useRef(sessionStatus);
    const sessionUserIdRef = useRef(session?.user?.id ?? null);
    const activeRequestIdRef = useRef(0);
    const logoutInProgressRef = useRef(false);
    const pendingStoredCartRef = useRef<ReturnType<
        typeof parseStoredCart
    > | null>(null);
    const signature = getCartSignature(state.items);
    const signatureRef = useRef(signature);

    function invalidateCartResolution(items: CartItem[]) {
        activeRequestIdRef.current += 1;
        signatureRef.current = getCartSignature(items);
    }

    useEffect(() => {
        stateRef.current = state;
        ownerIdRef.current = ownerId;
        sessionStatusRef.current = sessionStatus;
        sessionUserIdRef.current = session?.user?.id ?? null;
        signatureRef.current = signature;
    }, [ownerId, session?.user?.id, sessionStatus, signature, state]);

    useEffect(() => {
        let storedCart = null;

        try {
            const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
            storedCart = parseStoredCart(storedValue);

            if (storedValue !== null && storedCart === null) {
                window.localStorage.removeItem(CART_STORAGE_KEY);
            }
        } catch {
            // The in-memory cart remains available when storage is blocked.
        }

        const restoredItems = storedCart?.items ?? [];
        const restoredOwnerId = storedCart?.ownerId ?? null;

        stateRef.current = { hydrated: true, items: restoredItems };
        ownerIdRef.current = restoredOwnerId;
        setOwnerId(restoredOwnerId);
        dispatch({ items: restoredItems, type: "restore" });
    }, []);

    useEffect(() => {
        if (!state.hydrated) {
            return;
        }

        if (logoutInProgressRef.current) {
            return;
        }

        const sessionUserId = session?.user?.id ?? null;
        const pendingStoredCart = pendingStoredCartRef.current;

        if (pendingStoredCart) {
            if (
                sessionStatus === "loading" ||
                sessionStatus === "unauthenticated"
            ) {
                return;
            }

            pendingStoredCartRef.current = null;
            const pendingTransition = reconcileStoredCart(
                pendingStoredCart,
                sessionStatus,
                sessionUserId,
            );
            const nextState = {
                hydrated: true,
                items: pendingTransition.cart.items,
            };

            ownerIdRef.current = pendingTransition.cart.ownerId;
            stateRef.current = nextState;
            invalidateCartResolution(nextState.items);
            setOwnerId(pendingTransition.cart.ownerId);
            dispatch({ items: nextState.items, type: "replace" });

            if (pendingTransition.decision.action !== "clear") {
                return;
            }

            setResolution({ items: [], status: "ready" });

            try {
                window.localStorage.removeItem(CART_STORAGE_KEY);
            } catch {
                // A different account still clears the in-memory cart.
            }

            return;
        }

        const decision = reconcileCartOwner(
            ownerId,
            sessionStatus,
            sessionUserId,
        );

        if (decision.action === "wait" || decision.action === "preserve") {
            return;
        }

        ownerIdRef.current = decision.ownerId;
        setOwnerId(decision.ownerId);

        if (decision.action === "clear") {
            const emptyState = { hydrated: true, items: [] };
            stateRef.current = emptyState;
            invalidateCartResolution(emptyState.items);
            dispatch({ items: [], type: "replace" });
            setResolution({ items: [], status: "ready" });

            try {
                window.localStorage.removeItem(CART_STORAGE_KEY);
            } catch {
                // The session rule still clears the in-memory cart.
            }
        }
    }, [
        ownerId,
        pendingSyncVersion,
        session?.user?.id,
        sessionStatus,
        state.hydrated,
    ]);

    useEffect(() => {
        const update = getCartStorageUpdate(
            state.hydrated,
            state.items,
            ownerId,
        );

        if (update.action === "wait") {
            return;
        }

        try {
            if (update.action === "remove") {
                window.localStorage.removeItem(CART_STORAGE_KEY);
                return;
            }

            window.localStorage.setItem(CART_STORAGE_KEY, update.value);
        } catch {
            // Persistence is best-effort; cart operations continue in memory.
        }
    }, [ownerId, state.hydrated, state.items]);

    useEffect(() => {
        function handleStorage(event: StorageEvent) {
            if (
                event.key !== CART_STORAGE_KEY ||
                !shouldProcessCartStorageEvent(logoutInProgressRef.current)
            ) {
                return;
            }

            const incoming = parseStoredCart(event.newValue);

            if (event.newValue === null || incoming === null) {
                pendingStoredCartRef.current = null;
                const nextOwnerId =
                    sessionStatusRef.current === "authenticated"
                        ? sessionUserIdRef.current
                        : null;
                const emptyState = { hydrated: true, items: [] };
                ownerIdRef.current = nextOwnerId;
                stateRef.current = emptyState;
                invalidateCartResolution(emptyState.items);
                setOwnerId(nextOwnerId);
                dispatch({ items: [], type: "replace" });
                setResolution({ items: [], status: "ready" });
                return;
            }

            if (shouldDeferOwnedCartSync(incoming, sessionStatusRef.current)) {
                pendingStoredCartRef.current = incoming;
                setPendingSyncVersion((current) => current + 1);
                return;
            }

            pendingStoredCartRef.current = null;

            const decision = reconcileCartOwner(
                incoming.ownerId,
                sessionStatusRef.current,
                sessionUserIdRef.current,
            );

            if (decision.action === "clear") {
                ownerIdRef.current = decision.ownerId;
                stateRef.current = { hydrated: true, items: [] };
                invalidateCartResolution([]);
                setOwnerId(decision.ownerId);
                dispatch({ items: [], type: "replace" });
                setResolution({ items: [], status: "ready" });
                return;
            }

            ownerIdRef.current = decision.ownerId;
            stateRef.current = { hydrated: true, items: incoming.items };
            invalidateCartResolution(incoming.items);
            setOwnerId(decision.ownerId);
            dispatch({ items: incoming.items, type: "replace" });
        }

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    useEffect(() => {
        if (!state.hydrated) {
            return;
        }

        const requestId = activeRequestIdRef.current + 1;
        activeRequestIdRef.current = requestId;

        if (state.items.length === 0) {
            setResolution({ items: [], status: "ready" });
            return;
        }

        const controller = new AbortController();
        const requestSignature = signature;
        setResolution((current) => ({
            items: current.items,
            status: "loading",
        }));

        async function resolveCart() {
            try {
                const response = await fetch("/api/cart/resolve", {
                    body: JSON.stringify({ items: state.items }),
                    cache: "no-store",
                    headers: { "Content-Type": "application/json" },
                    method: "POST",
                    signal: controller.signal,
                });
                const body: unknown = await response.json();
                const resolvedItems = response.ok
                    ? parseCartResolveResponse(body)
                    : null;

                if (
                    !shouldAcceptCartResponse(
                        requestId,
                        activeRequestIdRef.current,
                        requestSignature,
                        signatureRef.current,
                    )
                ) {
                    return;
                }

                if (
                    !response.ok ||
                    !resolvedItems ||
                    getCartSignature(resolvedItems) !== requestSignature
                ) {
                    throw new Error("Cart resolution failed");
                }

                setResolution({ items: resolvedItems, status: "ready" });
            } catch {
                if (
                    controller.signal.aborted ||
                    !shouldAcceptCartResponse(
                        requestId,
                        activeRequestIdRef.current,
                        requestSignature,
                        signatureRef.current,
                    )
                ) {
                    return;
                }

                setResolution((current) => ({
                    items: current.items,
                    status: "error",
                }));
            }
        }

        void resolveCart();

        return () => controller.abort();
    }, [refreshVersion, signature, state.hydrated, state.items]);

    function commitMutation(mutation: CartMutation) {
        pendingStoredCartRef.current = null;
        const result = mutateCartItems(stateRef.current.items, mutation);

        if (result.items !== stateRef.current.items) {
            const nextState = { ...stateRef.current, items: result.items };
            stateRef.current = nextState;
            invalidateCartResolution(result.items);
            dispatch({ items: result.items, type: "replace" });
        }

        return result;
    }

    function clearForLogout() {
        logoutInProgressRef.current = true;
        pendingStoredCartRef.current = null;
        ownerIdRef.current = null;
        stateRef.current = { hydrated: true, items: [] };
        invalidateCartResolution([]);
        setOwnerId(null);
        dispatch({ items: [], type: "replace" });
        setResolution({ items: [], status: "ready" });

        try {
            window.localStorage.removeItem(CART_STORAGE_KEY);
        } catch {
            // Logout still clears the in-memory cart.
        }
    }

    return (
        <CartContext.Provider
            value={{
                addItem(productId, quantity, stock) {
                    const resolvedItem = resolution.items.find(
                        (item) => item.productId === productId,
                    );
                    const knownStock = !resolvedItem
                        ? stock
                        : resolvedItem.status === "unavailable"
                          ? 0
                          : Math.min(stock, resolvedItem.product.stock);

                    return commitMutation({
                        productId,
                        quantity,
                        stock: knownStock,
                        type: "add",
                    });
                },
                clearCart() {
                    return commitMutation({ type: "clear" });
                },
                clearForLogout,
                hydrated: state.hydrated,
                items: state.items,
                refreshCart() {
                    setRefreshVersion((current) => current + 1);
                },
                removeItem(productId) {
                    return commitMutation({ productId, type: "remove" });
                },
                resolution,
                setItemQuantity(productId, quantity, stock) {
                    return commitMutation({
                        productId,
                        quantity,
                        stock,
                        type: "set",
                    });
                },
                unitCount: getCartUnitCount(state.items),
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart deve ser usado dentro de CartProvider.");
    }

    return context;
}
