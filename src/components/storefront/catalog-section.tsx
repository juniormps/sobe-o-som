import Link from "next/link";

import { ProductCard } from "@/components/storefront/product-card";
import { buildCatalogHref } from "@/lib/catalog-params";
import type { CatalogResult } from "@/lib/catalog-data";

export function CatalogSection({ catalog }: { catalog: CatalogResult }) {
    const { filters, pageCount, products, total } = catalog;
    const hasFilters = Boolean(filters.query || filters.genre || filters.sale);
    const resultLabel = `${total} ${total === 1 ? "disco encontrado" : "discos encontrados"}`;

    return (
        <main
            className="scroll-mt-6 bg-white px-4 py-14 text-[#241C19] sm:px-6 sm:py-18 lg:px-10"
            id="main-content"
        >
            <div className="mx-auto w-full max-w-[90rem]" id="catalogo">
                <div className="flex flex-col gap-4 border-b border-[#DED8CC] pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-black tracking-[0.2em] text-[#9F2F1A] uppercase">
                            Catálogo
                        </p>
                        <h2 className="mt-2 text-4xl leading-none font-black tracking-[-0.05em] sm:text-5xl">
                            Discos em rotação
                        </h2>
                    </div>
                    <p aria-live="polite" className="text-sm text-[#6B625E]">
                        {resultLabel}
                        {pageCount > 1
                            ? ` · página ${filters.page} de ${pageCount}`
                            : ""}
                    </p>
                </div>

                {products.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 gap-x-4 gap-y-12 pt-9 min-[360px]:grid-cols-2 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4 xl:gap-x-8">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>
                        <Pagination catalog={catalog} />
                    </>
                ) : (
                    <div className="mx-auto max-w-xl py-20 text-center">
                        <div
                            aria-hidden="true"
                            className="mx-auto size-24 rounded-full border-[1.5rem] border-[#241C19] bg-[#F3C76A]"
                        />
                        <h3 className="mt-7 text-3xl font-black tracking-[-0.04em]">
                            {hasFilters
                                ? "Nenhum disco nessa faixa"
                                : "O catálogo está vazio"}
                        </h3>
                        <p className="mt-3 leading-7 text-[#6B625E]">
                            {hasFilters
                                ? "Tente outra busca ou limpe os filtros para voltar a explorar todos os discos."
                                : "Ainda não há discos ativos para exibir. Tente novamente mais tarde."}
                        </p>
                        {hasFilters ? (
                            <Link
                                className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#241C19] px-6 py-3 text-sm font-black text-white hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                                href="/#catalogo"
                            >
                                Limpar busca e filtros
                            </Link>
                        ) : null}
                    </div>
                )}
            </div>
        </main>
    );
}

function Pagination({ catalog }: { catalog: CatalogResult }) {
    const { filters, pageCount } = catalog;

    if (pageCount <= 1) {
        return null;
    }

    const visiblePages = Array.from(
        new Set(
            [
                1,
                filters.page - 1,
                filters.page,
                filters.page + 1,
                pageCount,
            ].filter((page) => page >= 1 && page <= pageCount),
        ),
    ).sort((left, right) => left - right);

    return (
        <nav
            aria-label="Paginação do catálogo"
            className="mt-16 flex flex-wrap items-center justify-center gap-2 border-t border-[#DED8CC] pt-8"
        >
            {filters.page > 1 ? (
                <PageLink
                    href={buildCatalogHref(filters, {
                        page: filters.page - 1,
                    })}
                    label="Anterior"
                />
            ) : (
                <span className="min-h-11 rounded-full border border-[#DED8CC] px-4 py-3 text-sm text-[#A39A95]">
                    Anterior
                </span>
            )}
            {visiblePages.map((page, index) => {
                const previous = visiblePages[index - 1];

                return (
                    <span className="contents" key={page}>
                        {previous && page - previous > 1 ? (
                            <span aria-hidden="true" className="px-1">
                                …
                            </span>
                        ) : null}
                        <PageLink
                            current={page === filters.page}
                            href={buildCatalogHref(filters, { page })}
                            label={String(page)}
                        />
                    </span>
                );
            })}
            {filters.page < pageCount ? (
                <PageLink
                    href={buildCatalogHref(filters, {
                        page: filters.page + 1,
                    })}
                    label="Próxima"
                />
            ) : (
                <span className="min-h-11 rounded-full border border-[#DED8CC] px-4 py-3 text-sm text-[#A39A95]">
                    Próxima
                </span>
            )}
        </nav>
    );
}

function PageLink({
    current = false,
    href,
    label,
}: {
    current?: boolean;
    href: string;
    label: string;
}) {
    return (
        <Link
            aria-current={current ? "page" : undefined}
            aria-label={/^\d+$/.test(label) ? `Página ${label}` : label}
            className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-black transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25] ${current ? "border-[#241C19] bg-[#241C19] text-white" : "border-[#9D948E] text-[#241C19] hover:bg-[#F4F0E9]"}`}
            href={`${href}#catalogo`}
        >
            {label}
        </Link>
    );
}
