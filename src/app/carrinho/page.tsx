import type { Metadata } from "next";
import { Suspense } from "react";

import { CartPageClient } from "@/components/cart/cart-page-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { getCatalogCategories } from "@/lib/catalog-data";

export const metadata: Metadata = {
    title: "Carrinho",
    description: "Revise os discos e as quantidades do seu carrinho.",
};

export default function CartPage() {
    return (
        <Suspense fallback={<CartPageLoading />}>
            <CartPageContent />
        </Suspense>
    );
}

async function CartPageContent() {
    const categories = await getCatalogCategories();

    return (
        <div className="min-h-screen bg-white">
            <StorefrontHeader categories={categories} />
            <CartPageClient />
            <StorefrontFooter />
        </div>
    );
}

function CartPageLoading() {
    return (
        <main
            aria-busy="true"
            className="min-h-screen bg-white px-4 py-14 text-[#241C19] sm:px-6 lg:px-10"
            id="main-content"
        >
            <div className="mx-auto w-full max-w-[90rem]">
                <p className="text-sm font-bold" role="status">
                    Carregando o carrinho…
                </p>
                <div className="mt-6 h-20 animate-pulse rounded-sm bg-[#EEEAE3] motion-reduce:animate-none" />
                <div className="mt-6 h-56 animate-pulse rounded-sm bg-[#EEEAE3] motion-reduce:animate-none" />
            </div>
        </main>
    );
}
