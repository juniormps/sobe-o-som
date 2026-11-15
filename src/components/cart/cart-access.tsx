"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/cart-provider";

export function CartAccess() {
    const { hydrated, unitCount } = useCart();
    const countLabel = unitCount === 1 ? "1 unidade" : `${unitCount} unidades`;

    return (
        <Link
            aria-label={
                hydrated
                    ? `Carrinho, ${countLabel}`
                    : "Carrinho, carregando itens"
            }
            className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-[#241C19] text-[#241C19] transition-colors hover:bg-[#241C19] hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25]"
            href="/carrinho"
        >
            <CartIcon />
            {hydrated && unitCount > 0 ? (
                <span className="absolute -top-2 -right-2 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-[#B63E25] px-1 text-[0.68rem] leading-none font-black text-white ring-2 ring-white">
                    {unitCount > 999 ? "999+" : unitCount}
                </span>
            ) : null}
        </Link>
    );
}

function CartIcon() {
    return (
        <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
        >
            <path
                d="M3.5 5h2l1.5 9.5h10.5l2-7H6"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
            />
            <circle cx="9" cy="18.5" fill="currentColor" r="1.25" />
            <circle cx="17" cy="18.5" fill="currentColor" r="1.25" />
        </svg>
    );
}
