import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { getCatalogCategories, getProductBySlug } from "@/lib/catalog-data";
import { formatPrice, getSafeCoverPath } from "@/lib/format";

type ProductPageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({
    params,
}: ProductPageProps): Promise<Metadata> {
    const product = await getProductBySlug((await params).slug);

    if (!product) {
        return {
            title: "Disco não encontrado",
            robots: { follow: false, index: false },
        };
    }

    return {
        title: `${product.name}, de ${product.artist}`,
        description: `${product.name}, de ${product.artist}. Disco de ${product.category.name} lançado em ${product.releaseYear}.`,
        openGraph: {
            description: `${product.name}, de ${product.artist}. Disco de ${product.category.name} lançado em ${product.releaseYear}.`,
            title: `${product.name}, de ${product.artist}`,
            type: "website",
        },
    };
}

export default function ProductPage({ params }: ProductPageProps) {
    return (
        <Suspense fallback={<ProductLoading />}>
            <ProductContent params={params} />
        </Suspense>
    );
}

async function ProductContent({ params }: ProductPageProps) {
    const { slug } = await params;
    const [product, categories] = await Promise.all([
        getProductBySlug(slug),
        getCatalogCategories(),
    ]);

    if (!product) {
        notFound();
    }

    const onSale =
        product.referencePriceInCents !== null &&
        product.referencePriceInCents > product.priceInCents;
    const soldOut = product.stock === 0;

    return (
        <div className="min-h-screen bg-white">
            <StorefrontHeader categories={categories} />
            <main
                className="bg-white px-4 py-10 text-[#241C19] sm:px-6 sm:py-14 lg:px-10 lg:py-20"
                id="main-content"
            >
                <div className="mx-auto w-full max-w-6xl">
                    <Link
                        className="inline-flex min-h-11 items-center gap-2 rounded-full text-sm font-black underline decoration-[#B63E25] decoration-2 underline-offset-4 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                        href="/#catalogo"
                    >
                        <span aria-hidden="true">←</span> Voltar ao catálogo
                    </Link>
                    <div className="mt-8 grid gap-9 md:grid-cols-2 md:items-start lg:gap-16">
                        <div className="relative aspect-square overflow-hidden rounded-sm border border-[#DED8CC] bg-[#F4F0E9]">
                            <Image
                                alt={`Capa do disco ${product.name}, de ${product.artist}`}
                                className="object-cover"
                                fill
                                priority
                                sizes="(min-width: 768px) 50vw, 100vw"
                                src={getSafeCoverPath(product.coverPath)}
                            />
                        </div>
                        <div className="md:pt-3">
                            <p className="text-xs font-black tracking-[0.18em] text-[#9F2F1A] uppercase">
                                {product.category.name} · {product.releaseYear}
                            </p>
                            <h1 className="mt-4 text-[clamp(2.7rem,8vw,5.5rem)] leading-[0.9] font-black tracking-[-0.065em] text-balance">
                                {product.name}
                            </h1>
                            <p className="mt-4 text-xl text-[#6B625E] sm:text-2xl">
                                {product.artist}
                            </p>
                            <div className="mt-8 border-y border-[#DED8CC] py-6">
                                {onSale ? (
                                    <p className="text-sm text-[#716864] line-through">
                                        De{" "}
                                        {formatPrice(
                                            product.referencePriceInCents!,
                                        )}
                                    </p>
                                ) : null}
                                <p className="mt-1 text-3xl font-black">
                                    {formatPrice(product.priceInCents)}
                                </p>
                                <p
                                    className={`mt-4 inline-flex min-h-9 items-center rounded-full px-4 py-2 text-sm font-black ${soldOut ? "bg-[#241C19] text-white" : "bg-[#E6F1D8] text-[#284619]"}`}
                                >
                                    {soldOut
                                        ? "Esgotado"
                                        : `Disponível · ${product.stock} ${product.stock === 1 ? "unidade" : "unidades"}`}
                                </p>
                                <p className="mt-3 text-sm leading-6 text-[#6B625E]">
                                    {soldOut
                                        ? "Este disco continua no catálogo, mas não está disponível para compra."
                                        : "Saldo demonstrativo consultado no catálogo. Não há reserva nesta etapa."}
                                </p>
                            </div>
                            <section
                                className="pt-7"
                                aria-labelledby="description-title"
                            >
                                <h2
                                    className="text-lg font-black"
                                    id="description-title"
                                >
                                    Sobre o disco
                                </h2>
                                <p className="mt-3 max-w-2xl text-base leading-7 text-[#514844]">
                                    {product.description}
                                </p>
                            </section>
                            <div className="mt-8 rounded-sm bg-[#F4F0E9] p-5 text-sm leading-6 text-[#514844]">
                                <p className="font-black text-[#241C19]">
                                    Compra na próxima faixa
                                </p>
                                <p className="mt-1">
                                    Carrinho, quantidade e ação de adicionar
                                    serão integrados na M3. Nesta etapa, o
                                    catálogo é somente para descoberta e
                                    consulta.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <StorefrontFooter />
        </div>
    );
}

function ProductLoading() {
    return (
        <main
            aria-busy="true"
            className="min-h-screen bg-white px-4 py-14 text-[#241C19] sm:px-6 lg:px-10"
            id="main-content"
        >
            <div className="mx-auto grid max-w-6xl gap-9 md:grid-cols-2">
                <div className="aspect-square animate-pulse bg-[#EEEAE3] motion-reduce:animate-none" />
                <div className="py-6">
                    <p className="text-sm font-bold" role="status">
                        Carregando o disco…
                    </p>
                    <div className="mt-6 h-20 animate-pulse bg-[#EEEAE3] motion-reduce:animate-none" />
                    <div className="mt-5 h-40 animate-pulse bg-[#EEEAE3] motion-reduce:animate-none" />
                </div>
            </div>
        </main>
    );
}
