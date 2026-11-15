"use client";

import { useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import type { CartMutationCode } from "@/lib/cart";

type AddToCartButtonProps = {
    className?: string;
    disabled?: boolean;
    productId: string;
    productName: string;
    quantity?: number;
    stock: number;
};

const feedbackByCode: Record<CartMutationCode, string> = {
    added: "Adicionado ao carrinho.",
    cleared: "Carrinho limpo.",
    invalid_quantity: "Escolha uma quantidade inteira entre 1 e 99.",
    product_limit: "O carrinho aceita no máximo 50 produtos diferentes.",
    quantity_limit: "O limite é de 99 unidades por produto.",
    removed: "Produto removido.",
    stock_limit: "A quantidade solicitada supera o estoque disponível.",
    unchanged: "O carrinho já está com essa quantidade.",
    updated: "Quantidade atualizada no carrinho.",
};

export function AddToCartButton({
    className,
    disabled = false,
    productId,
    productName,
    quantity = 1,
    stock,
}: AddToCartButtonProps) {
    const { addItem, hydrated } = useCart();
    const [feedback, setFeedback] = useState("");

    function handleAdd() {
        const result = addItem(productId, quantity, stock);
        setFeedback(`${productName}: ${feedbackByCode[result.code]}`);
    }

    return (
        <div className={className}>
            <button
                className="flex min-h-11 w-full items-center justify-center rounded-full bg-[#241C19] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25] disabled:cursor-not-allowed disabled:bg-[#C9C1B7] disabled:text-[#514844]"
                disabled={disabled || !hydrated}
                onClick={handleAdd}
                type="button"
            >
                {hydrated ? "Adicionar ao carrinho" : "Carregando carrinho…"}
            </button>
            <p className="sr-only" role="status">
                {feedback}
            </p>
        </div>
    );
}
