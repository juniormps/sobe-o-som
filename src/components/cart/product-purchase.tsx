"use client";

import { useState } from "react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";

type ProductPurchaseProps = {
    productId: string;
    productName: string;
    stock: number;
};

export function ProductPurchase({
    productId,
    productName,
    stock,
}: ProductPurchaseProps) {
    const maxQuantity = Math.min(stock, 99);
    const [quantity, setQuantity] = useState(1);

    if (stock === 0) {
        return null;
    }

    return (
        <section
            aria-labelledby="purchase-title"
            className="mt-7 rounded-sm bg-[#F4F0E9] p-5 sm:p-6"
        >
            <h2 className="text-lg font-black" id="purchase-title">
                Levar este disco
            </h2>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
                <div>
                    <label
                        className="block text-sm font-bold"
                        htmlFor="product-quantity"
                    >
                        Quantidade
                    </label>
                    <div className="mt-2 grid grid-cols-[2.75rem_4rem_2.75rem]">
                        <button
                            aria-label="Diminuir quantidade"
                            className="min-h-11 rounded-l-full border border-[#9D948E] bg-white text-xl font-black focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[#B63E25] disabled:text-[#A39A95]"
                            disabled={quantity <= 1}
                            onClick={() =>
                                setQuantity((current) => current - 1)
                            }
                            type="button"
                        >
                            −
                        </button>
                        <input
                            className="min-h-11 min-w-0 border-y border-[#9D948E] bg-white text-center font-black outline-none focus:z-10 focus:ring-3 focus:ring-[#B63E25]"
                            id="product-quantity"
                            inputMode="numeric"
                            max={maxQuantity}
                            min="1"
                            onChange={(event) => {
                                const nextQuantity = Number(event.target.value);

                                if (
                                    Number.isInteger(nextQuantity) &&
                                    nextQuantity >= 1 &&
                                    nextQuantity <= maxQuantity
                                ) {
                                    setQuantity(nextQuantity);
                                }
                            }}
                            type="number"
                            value={quantity}
                        />
                        <button
                            aria-label="Aumentar quantidade"
                            className="min-h-11 rounded-r-full border border-[#9D948E] bg-white text-xl font-black focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-[#B63E25] disabled:text-[#A39A95]"
                            disabled={quantity >= maxQuantity}
                            onClick={() =>
                                setQuantity((current) => current + 1)
                            }
                            type="button"
                        >
                            +
                        </button>
                    </div>
                </div>
                <AddToCartButton
                    className="w-full sm:max-w-xs sm:flex-1"
                    productId={productId}
                    productName={productName}
                    quantity={quantity}
                    stock={stock}
                />
            </div>
            <p className="mt-4 text-sm leading-6 text-[#6B625E]">
                Máximo disponível agora: {maxQuantity}. O carrinho não reserva
                estoque.
            </p>
        </section>
    );
}
