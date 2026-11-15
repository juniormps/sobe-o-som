"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useEffectEvent, useState, type KeyboardEvent } from "react";

import { useCart } from "@/components/cart/cart-provider";
import {
    MAX_CART_QUANTITY,
    calculateCartTotal,
    type CartItem,
    type CartMutationCode,
    type ResolvedCartItem,
} from "@/lib/cart";
import { formatPrice, getSafeCoverPath } from "@/lib/format";

const quantityFeedback: Partial<Record<CartMutationCode, string>> = {
    invalid_quantity: "Informe uma quantidade inteira entre 1 e 99.",
    stock_limit: "Não é possível aumentar além do estoque conhecido.",
    updated: "Quantidade atualizada.",
};

export function CartPageClient() {
    const {
        hydrated,
        items,
        refreshCart,
        removeItem,
        resolution,
        setItemQuantity,
        unitCount,
    } = useCart();
    const [feedback, setFeedback] = useState("");
    const refreshOnOpen = useEffectEvent(refreshCart);

    useEffect(() => {
        refreshOnOpen();
    }, []);

    if (!hydrated) {
        return <ClientLoading />;
    }

    if (items.length === 0) {
        return <EmptyCart />;
    }

    const resolvedById = new Map(
        resolution.items.map((item) => [item.productId, item]),
    );
    const total =
        resolution.status === "ready"
            ? calculateCartTotal(items, resolution.items)
            : null;
    const unavailablePrice = resolution.status === "ready" && total === null;

    function handleRemove(productId: string, productName: string) {
        const result = removeItem(productId);

        if (result.code === "removed") {
            setFeedback(`${productName} foi removido do carrinho.`);
        }
    }

    return (
        <main
            className="bg-white px-4 py-10 text-[#241C19] sm:px-6 sm:py-14 lg:px-10 lg:py-18"
            id="main-content"
        >
            <div className="mx-auto w-full max-w-[90rem]">
                <div className="border-b border-[#DED8CC] pb-7">
                    <p className="text-xs font-black tracking-[0.2em] text-[#9F2F1A] uppercase">
                        Sua seleção
                    </p>
                    <h1 className="mt-2 text-4xl leading-none font-black tracking-[-0.055em] sm:text-6xl">
                        Carrinho
                    </h1>
                    <p className="mt-4 text-sm leading-6 text-[#6B625E]">
                        {unitCount} {unitCount === 1 ? "unidade" : "unidades"}{" "}
                        em {items.length}{" "}
                        {items.length === 1 ? "disco" : "discos"}.
                    </p>
                </div>

                {resolution.status === "error" ? (
                    <div
                        className="mt-6 flex flex-col gap-4 border-l-4 border-[#B63E25] bg-[#FFF3E2] p-5 sm:flex-row sm:items-center sm:justify-between"
                        role="alert"
                    >
                        <div>
                            <p className="font-black">
                                Não foi possível atualizar preços e
                                disponibilidade.
                            </p>
                            <p className="mt-1 text-sm leading-6 text-[#514844]">
                                Seus itens continuam no carrinho. Verifique a
                                conexão e tente novamente.
                            </p>
                        </div>
                        <button
                            className="min-h-11 shrink-0 rounded-full bg-[#241C19] px-5 py-2 text-sm font-black text-white hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                            onClick={refreshCart}
                            type="button"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : null}

                {resolution.status === "loading" ? (
                    <p
                        aria-live="polite"
                        className="mt-6 text-sm font-bold text-[#6B625E]"
                    >
                        Atualizando preços e disponibilidade…
                    </p>
                ) : null}

                <p aria-live="polite" className="sr-only" role="status">
                    {feedback}
                </p>

                <div className="mt-7 grid gap-9 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
                    <div className="min-w-0 divide-y divide-[#DED8CC] border-y border-[#DED8CC]">
                        {items.map((item) => (
                            <CartRow
                                item={item}
                                key={item.productId}
                                onFeedback={setFeedback}
                                onRemove={handleRemove}
                                resolved={resolvedById.get(item.productId)}
                                setItemQuantity={setItemQuantity}
                            />
                        ))}
                    </div>

                    <aside className="rounded-sm bg-[#F4F0E9] p-5 sm:p-7 xl:sticky xl:top-5">
                        <h2 className="text-xl font-black">Resumo</h2>
                        <div className="mt-5 flex items-start justify-between gap-4 border-t border-[#C9C1B7] pt-5">
                            <span className="font-bold">Total estimado</span>
                            {total !== null ? (
                                <strong className="text-right text-2xl">
                                    {formatPrice(total)}
                                </strong>
                            ) : (
                                <strong className="max-w-44 text-right text-sm leading-5">
                                    {unavailablePrice
                                        ? "Indisponível enquanto houver item sem preço"
                                        : "Aguardando atualização completa"}
                                </strong>
                            )}
                        </div>
                        <p className="mt-5 border-t border-[#C9C1B7] pt-5 text-sm leading-6 text-[#514844]">
                            O carrinho não reserva estoque. Preços e
                            disponibilidade serão conferidos novamente na
                            finalização.
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[#514844]">
                            Checkout, frete e pedido ainda não fazem parte desta
                            etapa.
                        </p>
                        <Link
                            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#241C19] px-5 py-3 text-center text-sm font-black hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                            href="/#catalogo"
                        >
                            Continuar explorando
                        </Link>
                    </aside>
                </div>
            </div>
        </main>
    );
}

type CartRowProps = {
    item: CartItem;
    onFeedback: (message: string) => void;
    onRemove: (productId: string, productName: string) => void;
    resolved: ResolvedCartItem | undefined;
    setItemQuantity: ReturnType<typeof useCart>["setItemQuantity"];
};

function CartRow({
    item,
    onFeedback,
    onRemove,
    resolved,
    setItemQuantity,
}: CartRowProps) {
    if (!resolved) {
        return (
            <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <div className="aspect-square animate-pulse rounded-sm bg-[#EEEAE3] motion-reduce:animate-none" />
                <div className="min-w-0">
                    <p className="font-black">Atualizando item…</p>
                    <p className="mt-2 text-sm text-[#6B625E]">
                        Quantidade: {item.quantity}
                    </p>
                    <button
                        className="mt-4 min-h-11 text-sm font-black underline decoration-[#B63E25] decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25]"
                        onClick={() => onRemove(item.productId, "O item")}
                        type="button"
                    >
                        Remover
                    </button>
                </div>
            </div>
        );
    }

    if (resolved.status === "unavailable") {
        return (
            <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[7rem_minmax(0,1fr)]">
                <div
                    aria-hidden="true"
                    className="flex aspect-square items-center justify-center rounded-sm bg-[#241C19] text-3xl text-[#F3C76A]"
                >
                    ×
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-black tracking-[0.14em] text-[#9F2F1A] uppercase">
                        Indisponível
                    </p>
                    <h2 className="mt-2 text-lg font-black">
                        Produto não disponível no catálogo
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[#6B625E]">
                        O produto pode ter sido removido ou desativado. O preço
                        não foi incluído no total.
                    </p>
                    <p className="mt-2 text-sm font-bold">
                        Quantidade preservada: {item.quantity}
                    </p>
                    <button
                        className="mt-4 min-h-11 text-sm font-black underline decoration-[#B63E25] decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25]"
                        onClick={() =>
                            onRemove(item.productId, "O produto indisponível")
                        }
                        type="button"
                    >
                        Remover do carrinho
                    </button>
                </div>
            </div>
        );
    }

    const { product } = resolved;
    const onSale =
        product.referencePriceInCents !== null &&
        product.referencePriceInCents > product.priceInCents;
    const hasStockConflict = item.quantity > product.stock;
    const itemSubtotal = product.priceInCents * item.quantity;

    return (
        <article className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[8rem_minmax(0,1fr)_auto]">
            <div className="relative aspect-square overflow-hidden rounded-sm border border-[#DED8CC] bg-[#F4F0E9]">
                <Image
                    alt={`Capa do disco ${product.name}, de ${product.artist}`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 1024px) 8rem, (min-width: 640px) 7rem, 5rem"
                    src={getSafeCoverPath(product.coverPath)}
                />
            </div>
            <div className="min-w-0">
                <p className="text-xs font-black tracking-[0.14em] text-[#9F2F1A] uppercase">
                    {resolved.status === "out_of_stock"
                        ? "Esgotado"
                        : "No carrinho"}
                </p>
                {resolved.status === "available" ? (
                    <Link
                        className="mt-2 inline-block rounded-sm text-lg leading-tight font-black hover:underline hover:decoration-[#B63E25] hover:decoration-2 hover:underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                        href={`/produtos/${product.slug}`}
                    >
                        {product.name}
                    </Link>
                ) : (
                    <h2 className="mt-2 text-lg leading-tight font-black">
                        {product.name}
                    </h2>
                )}
                <p className="mt-1 text-sm text-[#6B625E]">{product.artist}</p>
                <div className="mt-3">
                    {onSale ? (
                        <p className="text-xs text-[#716864] line-through">
                            De {formatPrice(product.referencePriceInCents!)}
                        </p>
                    ) : null}
                    <p className="font-black">
                        {formatPrice(product.priceInCents)} por unidade
                    </p>
                </div>
                {hasStockConflict ? (
                    <p
                        className="mt-3 rounded-sm bg-[#FFF3E2] px-3 py-2 text-sm font-bold leading-5 text-[#70210F]"
                        role="alert"
                    >
                        Estoque atual: {product.stock}. Reduza a quantidade ou
                        remova o item.
                    </p>
                ) : null}
                <QuantityControl
                    item={item}
                    key={`${item.productId}:${item.quantity}`}
                    onFeedback={onFeedback}
                    setItemQuantity={setItemQuantity}
                    stock={product.stock}
                />
                <button
                    className="mt-3 min-h-11 text-sm font-black underline decoration-[#B63E25] decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25]"
                    onClick={() => onRemove(item.productId, product.name)}
                    type="button"
                >
                    Remover
                </button>
            </div>
            <div className="col-span-2 border-t border-[#EEEAE3] pt-4 text-left lg:col-span-1 lg:border-0 lg:pt-0 lg:text-right">
                <p className="text-xs font-bold tracking-[0.12em] text-[#6B625E] uppercase">
                    Subtotal
                </p>
                <p className="mt-1 text-xl font-black">
                    {formatPrice(itemSubtotal)}
                </p>
            </div>
        </article>
    );
}

type QuantityControlProps = {
    item: CartItem;
    onFeedback: (message: string) => void;
    setItemQuantity: ReturnType<typeof useCart>["setItemQuantity"];
    stock: number;
};

function QuantityControl({
    item,
    onFeedback,
    setItemQuantity,
    stock,
}: QuantityControlProps) {
    const [draft, setDraft] = useState(String(item.quantity));

    function commit(quantity: number) {
        const result = setItemQuantity(item.productId, quantity, stock);
        const message = quantityFeedback[result.code];

        if (message) {
            onFeedback(message);
        }

        if (result.code !== "updated" && result.code !== "unchanged") {
            setDraft(String(item.quantity));
        }
    }

    function commitDraft() {
        const quantity = Number(draft);

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
            onFeedback("Informe uma quantidade inteira entre 1 e 99.");
            setDraft(String(item.quantity));
            return;
        }

        commit(quantity);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (event.key === "Enter") {
            event.currentTarget.blur();
        }
    }

    const cannotIncrease =
        item.quantity >= MAX_CART_QUANTITY || item.quantity >= stock;

    return (
        <div className="mt-4">
            <label
                className="block text-xs font-bold tracking-[0.1em] text-[#6B625E] uppercase"
                htmlFor={`quantity-${item.productId}`}
            >
                Quantidade
            </label>
            <div className="mt-2 grid w-fit grid-cols-[2.75rem_4rem_2.75rem]">
                <button
                    aria-label="Diminuir quantidade"
                    className="min-h-11 rounded-l-full border border-[#9D948E] bg-white text-xl font-black focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[#B63E25] disabled:text-[#A39A95]"
                    disabled={item.quantity <= 1}
                    onClick={() => commit(item.quantity - 1)}
                    type="button"
                >
                    −
                </button>
                <input
                    aria-describedby={
                        item.quantity > stock
                            ? `stock-conflict-${item.productId}`
                            : undefined
                    }
                    className="min-h-11 min-w-0 border-y border-[#9D948E] bg-white text-center font-black outline-none focus:z-10 focus:ring-3 focus:ring-[#B63E25]"
                    id={`quantity-${item.productId}`}
                    inputMode="numeric"
                    max={MAX_CART_QUANTITY}
                    min="1"
                    onBlur={commitDraft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    type="number"
                    value={draft}
                />
                <button
                    aria-label="Aumentar quantidade"
                    className="min-h-11 rounded-r-full border border-[#9D948E] bg-white text-xl font-black focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[#B63E25] disabled:text-[#A39A95]"
                    disabled={cannotIncrease}
                    onClick={() => commit(item.quantity + 1)}
                    type="button"
                >
                    +
                </button>
            </div>
            {item.quantity > stock ? (
                <span
                    className="sr-only"
                    id={`stock-conflict-${item.productId}`}
                >
                    Quantidade acima do estoque atual de {stock}.
                </span>
            ) : null}
        </div>
    );
}

function ClientLoading() {
    return (
        <main
            aria-busy="true"
            className="min-h-[32rem] bg-white px-4 py-14 text-[#241C19] sm:px-6 lg:px-10"
            id="main-content"
        >
            <div className="mx-auto w-full max-w-[90rem]">
                <p className="text-sm font-bold" role="status">
                    Restaurando seu carrinho…
                </p>
                <div className="mt-6 h-52 animate-pulse rounded-sm bg-[#EEEAE3] motion-reduce:animate-none" />
            </div>
        </main>
    );
}

function EmptyCart() {
    return (
        <main
            className="flex min-h-[35rem] items-center bg-[#F4F0E9] px-4 py-16 text-[#241C19] sm:px-6 lg:px-10"
            id="main-content"
        >
            <section className="mx-auto w-full max-w-xl bg-white p-7 shadow-[10px_10px_0_#241C19] sm:p-10">
                <div
                    aria-hidden="true"
                    className="size-20 rounded-full border-[1.2rem] border-[#241C19] bg-[#F3C76A]"
                />
                <p className="mt-7 text-xs font-black tracking-[0.2em] text-[#9F2F1A] uppercase">
                    Lado A vazio
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
                    Seu carrinho está vazio.
                </h1>
                <p className="mt-4 leading-7 text-[#6B625E]">
                    Explore o catálogo e adicione os discos que quer ouvir e
                    guardar.
                </p>
                <Link
                    className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#241C19] px-6 py-3 text-sm font-black text-white hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                    href="/#catalogo"
                >
                    Explorar discos
                </Link>
            </section>
        </main>
    );
}
