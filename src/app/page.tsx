import { redirect } from "next/navigation";
import { Suspense } from "react";

import { CatalogSection } from "@/components/storefront/catalog-section";
import { HeroCarousel } from "@/components/storefront/hero-carousel";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { getCatalog } from "@/lib/catalog-data";
import type { RawCatalogParams } from "@/lib/catalog-params";

type HomeProps = {
    searchParams: Promise<RawCatalogParams>;
};

export default function Home({ searchParams }: HomeProps) {
    return (
        <Suspense fallback={<StorefrontLoading />}>
            <HomeContent searchParams={searchParams} />
        </Suspense>
    );
}

async function HomeContent({ searchParams }: HomeProps) {
    const catalog = await getCatalog(await searchParams);

    if (catalog.shouldRedirect) {
        redirect(catalog.canonicalHref);
    }

    return (
        <div className="min-h-screen bg-white">
            <StorefrontHeader
                categories={catalog.categories}
                filters={catalog.filters}
            />
            <HeroCarousel />
            <CatalogSection catalog={catalog} />
            <StorefrontFooter />
        </div>
    );
}

function StorefrontLoading() {
    return (
        <main
            aria-busy="true"
            className="min-h-screen bg-white text-[#241C19]"
            id="main-content"
        >
            <div className="h-8 animate-pulse bg-[#241C19] motion-reduce:animate-none" />
            <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 lg:px-10">
                <div className="h-12 w-56 animate-pulse rounded-full bg-[#EEEAE3] motion-reduce:animate-none" />
                <div className="mt-5 h-12 animate-pulse rounded-full bg-[#EEEAE3] motion-reduce:animate-none" />
            </div>
            <div className="h-[28rem] animate-pulse bg-[#452327] motion-reduce:animate-none" />
            <div className="mx-auto max-w-[90rem] px-4 py-14 sm:px-6 lg:px-10">
                <p className="text-sm font-bold" role="status">
                    Carregando o catálogo…
                </p>
                <div className="mt-8 grid grid-cols-1 gap-6 min-[360px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }, (_, index) => (
                        <div
                            className="aspect-square animate-pulse bg-[#EEEAE3] motion-reduce:animate-none"
                            key={index}
                        />
                    ))}
                </div>
            </div>
        </main>
    );
}
