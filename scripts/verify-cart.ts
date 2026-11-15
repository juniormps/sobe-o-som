import {
    CART_STORAGE_VERSION,
    MAX_CART_PRODUCTS,
    calculateCartTotal,
    getCartSignature,
    getCartStorageUpdate,
    mutateCartItems,
    parseStoredCart,
    reconcileCartOwner,
    reconcileStoredCart,
    shouldAcceptCartResponse,
    shouldDeferOwnedCartSync,
    shouldProcessCartStorageEvent,
    type CartItem,
    type CartProduct,
} from "../src/lib/cart";
import {
    parseCartResolveInput,
    resolveCartItems,
} from "../src/lib/cart-resolver";

const ids = Array.from(
    { length: MAX_CART_PRODUCTS + 2 },
    (_, index) =>
        `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
);

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

function verifyMutations() {
    let items: CartItem[] = [];
    let result = mutateCartItems(items, {
        productId: ids[0],
        quantity: 2,
        stock: 5,
        type: "add",
    });
    items = result.items;

    assert(
        result.code === "added" && items[0]?.quantity === 2,
        "A primeira adicao nao criou uma linha.",
    );

    result = mutateCartItems(items, {
        productId: ids[0],
        quantity: 2,
        stock: 5,
        type: "add",
    });
    items = result.items;

    assert(
        result.code === "updated" &&
            items.length === 1 &&
            items[0]?.quantity === 4,
        "Adicoes do mesmo produto nao foram consolidadas.",
    );

    assert(
        mutateCartItems(items, {
            productId: ids[0],
            quantity: 2,
            stock: 5,
            type: "add",
        }).code === "stock_limit",
        "A quantidade existente nao foi considerada no limite de estoque.",
    );
    assert(
        mutateCartItems(items, {
            productId: ids[0],
            quantity: 96,
            stock: 200,
            type: "add",
        }).code === "quantity_limit",
        "O limite de 99 unidades nao foi aplicado.",
    );

    items = [{ productId: ids[0], quantity: 8 }];
    result = mutateCartItems(items, {
        productId: ids[0],
        quantity: 7,
        stock: 3,
        type: "set",
    });
    assert(
        result.code === "updated" && result.items[0]?.quantity === 7,
        "Um conflito de estoque nao permitiu reduzir a escolha.",
    );
    assert(
        mutateCartItems(result.items, {
            productId: ids[0],
            quantity: 8,
            stock: 3,
            type: "set",
        }).code === "stock_limit",
        "Um conflito de estoque permitiu aumentar a escolha.",
    );

    result = mutateCartItems(result.items, {
        productId: ids[0],
        type: "remove",
    });
    assert(
        result.code === "removed" && result.items.length === 0,
        "A remocao individual falhou.",
    );

    const fullCart = ids.slice(0, MAX_CART_PRODUCTS).map((productId) => ({
        productId,
        quantity: 1,
    }));
    assert(
        mutateCartItems(fullCart, {
            productId: ids[MAX_CART_PRODUCTS],
            quantity: 1,
            stock: 1,
            type: "add",
        }).code === "product_limit",
        "O limite de produtos distintos nao foi aplicado.",
    );
}

function verifyPersistence() {
    const parsed = parseStoredCart(
        JSON.stringify({
            items: [
                { productId: ids[0], quantity: 2 },
                { productId: ids[0], quantity: 3 },
                { productId: ids[1], quantity: 0 },
                { productId: "invalido", quantity: 1 },
            ],
            ownerId: null,
            version: CART_STORAGE_VERSION,
        }),
    );

    assert(
        parsed?.items.length === 1 && parsed.items[0]?.quantity === 5,
        "Duplicados ou quantidades persistidas invalidas nao foram tratados.",
    );
    assert(parseStoredCart("{") === null, "JSON invalido foi aceito.");
    assert(
        parseStoredCart(JSON.stringify({ items: [], version: 999 })) === null,
        "Formato persistido incompativel foi aceito.",
    );
    assert(
        parseStoredCart(
            JSON.stringify({
                items: [],
                ownerId: "email@exemplo.com",
                version: CART_STORAGE_VERSION,
            }),
        ) === null,
        "Um proprietario local nao minimo ou invalido foi aceito.",
    );
}

function verifySessionLifecycle() {
    const userA = ids[0];
    const userB = ids[1];

    assert(
        reconcileCartOwner(null, "loading", null).action === "wait",
        "O carregamento inicial da sessao alterou o carrinho.",
    );
    assert(
        reconcileCartOwner(null, "authenticated", userA).action === "claim",
        "O login nao preservou e vinculou o carrinho visitante.",
    );
    assert(
        reconcileCartOwner(userA, "unauthenticated", null).action === "clear",
        "O logout nao limpou o carrinho identificado.",
    );
    assert(
        reconcileCartOwner(userA, "authenticated", userB).action === "clear",
        "A troca de conta transferiu o carrinho anterior.",
    );
    assert(
        reconcileCartOwner(userA, "authenticated", userA).action === "preserve",
        "A mesma conta nao preservou seu carrinho local.",
    );
}

function verifyPersistedVisitorLoginRegression() {
    const visitorItems = [
        { productId: ids[0], quantity: 2 },
        { productId: ids[1], quantity: 4 },
    ];
    const restoredVisitor = parseStoredCart(
        JSON.stringify({
            items: visitorItems,
            ownerId: null,
            version: CART_STORAGE_VERSION,
        }),
    );

    assert(
        restoredVisitor,
        "O carrinho visitante persistido nao foi restaurado.",
    );

    const whileLoading = reconcileStoredCart(restoredVisitor, "loading", null);
    assert(
        whileLoading.decision.action === "wait" &&
            getCartSignature(whileLoading.cart.items) ===
                getCartSignature(visitorItems),
        "A sessao em loading descartou ou alterou o carrinho visitante.",
    );
    assert(
        getCartStorageUpdate(false, [], null).action === "wait",
        "Um estado vazio poderia ser gravado antes da restauracao.",
    );

    const afterLogin = reconcileStoredCart(
        whileLoading.cart,
        "authenticated",
        ids[2],
    );
    assert(
        afterLogin.decision.action === "claim" &&
            afterLogin.cart.ownerId === ids[2] &&
            getCartSignature(afterLogin.cart.items) ===
                getCartSignature(visitorItems),
        "O login nao preservou exatamente os IDs e quantidades do visitante.",
    );
    const authenticatedUpdate = getCartStorageUpdate(
        true,
        afterLogin.cart.items,
        afterLogin.cart.ownerId,
    );
    const persistedAfterLogin =
        authenticatedUpdate.action === "write"
            ? parseStoredCart(authenticatedUpdate.value)
            : null;
    assert(
        persistedAfterLogin?.ownerId === ids[2] &&
            getCartSignature(persistedAfterLogin.items) ===
                getCartSignature(visitorItems),
        "A persistencia apos o login nao manteve exatamente o carrinho atribuido.",
    );

    const sameUserReload = reconcileStoredCart(
        afterLogin.cart,
        "authenticated",
        ids[2],
    );
    assert(
        sameUserReload.decision.action === "preserve" &&
            getCartSignature(sameUserReload.cart.items) ===
                getCartSignature(visitorItems),
        "O carrinho do mesmo usuario nao sobreviveu a restauracao.",
    );
    assert(
        shouldDeferOwnedCartSync(afterLogin.cart, "unauthenticated"),
        "Uma aba com sessao defasada poderia apagar a atribuicao do visitante.",
    );
    assert(
        !shouldProcessCartStorageEvent(true),
        "Um evento pendente poderia restaurar o carrinho depois do logout.",
    );

    const afterLogout = reconcileStoredCart(
        afterLogin.cart,
        "unauthenticated",
        null,
    );
    assert(
        afterLogout.decision.action === "clear" &&
            afterLogout.cart.items.length === 0,
        "O logout deixou de limpar o carrinho.",
    );

    const otherAccount = reconcileStoredCart(
        afterLogin.cart,
        "authenticated",
        ids[3],
    );
    assert(
        otherAccount.decision.action === "clear" &&
            otherAccount.cart.items.length === 0,
        "A troca de conta transferiu o carrinho anterior.",
    );
}

async function verifyResolutionAndMoney() {
    const products: CartProduct[] = [
        {
            artist: "Artista A",
            coverPath: "/images/album-placeholder.svg",
            id: ids[0],
            name: "Disco em Sale",
            priceInCents: 7599,
            referencePriceInCents: 9999,
            slug: "disco-em-sale",
            stock: 3,
        },
        {
            artist: "Artista B",
            coverPath: "/images/album-placeholder.svg",
            id: ids[1],
            name: "Disco Esgotado",
            priceInCents: 12345,
            referencePriceInCents: null,
            slug: "disco-esgotado",
            stock: 0,
        },
    ];
    const items = [
        { productId: ids[0], quantity: 2 },
        { productId: ids[1], quantity: 1 },
        { productId: ids[2], quantity: 1 },
    ];
    let queryCount = 0;
    const resolved = await resolveCartItems(items, async (productIds) => {
        queryCount += 1;
        assert(
            productIds.join(",") ===
                items.map(({ productId }) => productId).join(","),
            "A consulta em lote recebeu dados alem dos IDs necessarios.",
        );
        return products;
    });

    assert(
        queryCount === 1,
        "Os produtos nao foram consultados em um unico lote.",
    );
    assert(
        resolved[0]?.status === "available" &&
            resolved[1]?.status === "out_of_stock" &&
            resolved[2]?.status === "unavailable",
        "Disponivel, esgotado e indisponivel nao foram diferenciados.",
    );
    assert(
        calculateCartTotal(items, resolved) === null,
        "Um total parcial foi apresentado como completo.",
    );
    assert(
        calculateCartTotal(items.slice(0, 2), resolved.slice(0, 2)) ===
            7599 * 2 + 12345,
        "O total em centavos ou o preco promocional atual foi calculado incorretamente.",
    );

    const stockSnapshot = products.map(({ stock }) => stock).join(",");
    await resolveCartItems(items, async () => products);
    assert(
        products.map(({ stock }) => stock).join(",") === stockSnapshot,
        "A resolucao do carrinho alterou o estoque.",
    );

    let failed = false;

    try {
        await resolveCartItems(items, async () => {
            throw new Error("Falha controlada");
        });
    } catch {
        failed = true;
    }

    assert(
        failed && items.length === 3,
        "A falha de consulta apagou o carrinho.",
    );
}

function verifyServerInputAndStaleResponses() {
    assert(
        parseCartResolveInput({
            items: [{ productId: ids[0], quantity: 1 }],
        })?.items.length === 1,
        "Uma entrada valida do resolvedor foi rejeitada.",
    );
    assert(
        parseCartResolveInput({
            items: [
                { productId: ids[0], quantity: 1 },
                { productId: ids[0], quantity: 1 },
            ],
        }) === null,
        "IDs duplicados foram aceitos pelo servidor.",
    );
    assert(
        parseCartResolveInput({
            items: [{ productId: ids[0], quantity: 100 }],
        }) === null,
        "Quantidade fora do limite foi aceita pelo servidor.",
    );
    assert(
        parseCartResolveInput({
            items: [
                {
                    priceInCents: 1,
                    productId: ids[0],
                    quantity: 1,
                },
            ],
        }) === null,
        "Um preco enviado pelo navegador foi aceito na entrada do servidor.",
    );
    assert(
        parseCartResolveInput({
            items: ids.map((productId) => ({ productId, quantity: 1 })),
        }) === null,
        "Mais de 50 produtos foram aceitos pelo servidor.",
    );

    const oldItems = [{ productId: ids[0], quantity: 2 }];
    const currentItems: CartItem[] = [];
    assert(
        !shouldAcceptCartResponse(
            1,
            2,
            getCartSignature(oldItems),
            getCartSignature(currentItems),
        ),
        "Uma resposta antiga poderia restaurar um item removido ou limpo.",
    );
}

verifyMutations();
verifyPersistence();
verifySessionLifecycle();
verifyPersistedVisitorLoginRegression();
await verifyResolutionAndMoney();
verifyServerInputAndStaleResponses();

console.log(
    "Carrinho verificado: regras, persistencia, sessao, lote, indisponibilidade, centavos, falhas e respostas antigas.",
);
