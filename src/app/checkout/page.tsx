import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { CheckoutClient } from "@/app/checkout/checkout-client";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { getOwnAddresses } from "@/lib/address-data";
import { getAuthenticatedUserIdentity } from "@/lib/authenticated-user";
import { getCatalogCategories } from "@/lib/catalog-data";

export const metadata: Metadata = {
    title: "Checkout",
    description: "Escolha e confirme o endereço da compra demonstrativa.",
};

export default function CheckoutPage() {
    return (
        <Suspense fallback={<CheckoutLoading />}>
            <CheckoutPageContent />
        </Suspense>
    );
}

async function CheckoutPageContent() {
    await connection();
    const identity = await getAuthenticatedUserIdentity();

    if (!identity) {
        redirect("/login?callbackUrl=/checkout");
    }

    const [addresses, categories] = await Promise.all([
        getOwnAddresses(identity.id),
        getCatalogCategories(),
    ]);

    return (
        <div className="min-h-screen bg-white">
            <StorefrontHeader categories={categories} />
            <CheckoutClient
                initialAddresses={addresses}
                sessionUserId={identity.id}
            />
            <StorefrontFooter />
        </div>
    );
}

function CheckoutLoading() {
    return (
        <main
            aria-busy="true"
            className="min-h-screen bg-white px-4 py-14 text-[#241C19] sm:px-6 lg:px-10"
            id="main-content"
        >
            <div className="mx-auto w-full max-w-[90rem]">
                <p className="text-sm font-bold" role="status">
                    Preparando o checkout…
                </p>
                <div className="mt-6 h-72 animate-pulse rounded-sm bg-[#EEEAE3] motion-reduce:animate-none" />
            </div>
        </main>
    );
}
