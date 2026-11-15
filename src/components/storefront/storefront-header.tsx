import Link from "next/link";

import { AccountAccess } from "@/components/storefront/account-access";
import {
    MAX_SEARCH_LENGTH,
    buildCatalogHref,
    type CatalogFilters,
} from "@/lib/catalog-params";
import type { CatalogCategory } from "@/lib/catalog-data";

type StorefrontHeaderProps = {
    categories: CatalogCategory[];
    filters?: CatalogFilters;
};

const defaultFilters: CatalogFilters = {
    genre: null,
    page: 1,
    query: "",
    sale: false,
};

export function StorefrontHeader({
    categories,
    filters = defaultFilters,
}: StorefrontHeaderProps) {
    return (
        <>
            <div className="bg-[#241C19] px-4 py-2 text-center text-[0.68rem] font-bold tracking-[0.18em] text-[#FAF7F0] uppercase sm:text-xs">
                Discos para ouvir, capas para guardar
            </div>
            <header className="border-b border-[#DED8CC] bg-white text-[#241C19]">
                <div className="mx-auto grid w-full max-w-[90rem] grid-cols-[1fr_auto] items-center gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[auto_minmax(20rem,1fr)_auto] lg:gap-8 lg:px-10">
                    <Link
                        className="group inline-flex w-fit items-center gap-2 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#B63E25]"
                        href="/"
                    >
                        <span
                            aria-hidden="true"
                            className="relative size-9 rounded-full bg-[#241C19] before:absolute before:inset-[9px] before:rounded-full before:border-2 before:border-[#F3C76A] after:absolute after:inset-[15px] after:rounded-full after:bg-[#B63E25]"
                        />
                        <span className="text-xl font-black tracking-[-0.06em] sm:text-2xl">
                            SOBE O SOM
                        </span>
                    </Link>
                    <div className="justify-self-end lg:order-3">
                        <AccountAccess />
                    </div>
                    <form
                        action="/"
                        className="col-span-2 flex min-w-0 items-stretch lg:order-2 lg:col-span-1"
                        role="search"
                    >
                        <label className="sr-only" htmlFor="catalog-search">
                            Buscar por álbum ou artista
                        </label>
                        <input
                            className="min-h-12 min-w-0 flex-1 rounded-l-full border border-r-0 border-[#9D948E] bg-white px-5 text-base outline-none placeholder:text-[#716864] focus:border-[#241C19] focus:ring-2 focus:ring-[#F3C76A]"
                            defaultValue={filters.query}
                            id="catalog-search"
                            key={filters.query}
                            maxLength={MAX_SEARCH_LENGTH}
                            name="busca"
                            placeholder="Busque por álbum ou artista"
                            type="search"
                        />
                        {filters.genre ? (
                            <input
                                name="genero"
                                type="hidden"
                                value={filters.genre}
                            />
                        ) : null}
                        {filters.sale ? (
                            <input name="sale" type="hidden" value="true" />
                        ) : null}
                        <button
                            className="flex min-h-12 min-w-14 items-center justify-center rounded-r-full border border-[#241C19] bg-[#241C19] px-4 text-white transition-colors hover:bg-[#B63E25] focus-visible:z-10 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25]"
                            type="submit"
                        >
                            <SearchIcon />
                            <span className="sr-only">Buscar</span>
                        </button>
                    </form>
                </div>
                <nav
                    aria-label="Categorias de discos"
                    className="mx-auto flex w-full max-w-[90rem] flex-wrap justify-center gap-x-1 gap-y-1 border-t border-[#EEEAE3] px-3 py-2 sm:px-6 lg:px-10"
                >
                    <CategoryLink
                        current={!filters.genre && !filters.sale}
                        href={buildCatalogHref(filters, {
                            genre: null,
                            page: 1,
                            sale: false,
                        })}
                        label="Todos os discos"
                    />
                    {categories.map((category) => (
                        <CategoryLink
                            current={filters.genre === category.slug}
                            href={buildCatalogHref(filters, {
                                genre: category.slug,
                                page: 1,
                            })}
                            key={category.slug}
                            label={category.name}
                        />
                    ))}
                    <CategoryLink
                        accent
                        current={filters.sale}
                        filter
                        href={buildCatalogHref(filters, {
                            page: 1,
                            sale: !filters.sale,
                        })}
                        label="Sale"
                    />
                </nav>
            </header>
        </>
    );
}

type CategoryLinkProps = {
    accent?: boolean;
    current: boolean;
    filter?: boolean;
    href: string;
    label: string;
};

function CategoryLink({
    accent,
    current,
    filter,
    href,
    label,
}: CategoryLinkProps) {
    return (
        <Link
            aria-current={current && !filter ? "page" : undefined}
            aria-label={
                filter
                    ? current
                        ? `${label}, filtro ativo; selecionar para desativar`
                        : `${label}, ativar filtro`
                    : undefined
            }
            className={`min-h-11 rounded-full px-3 py-3 text-center text-xs font-bold whitespace-nowrap transition-colors focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[#B63E25] sm:text-sm ${
                current
                    ? "bg-[#241C19] text-white underline decoration-[#F3C76A] decoration-2 underline-offset-4"
                    : accent
                      ? "text-[#9F2F1A] underline decoration-2 underline-offset-4 hover:bg-[#FFF3E2]"
                      : "text-[#4B423E] hover:bg-[#F4F0E9]"
            }`}
            href={href}
        >
            {label}
        </Link>
    );
}

function SearchIcon() {
    return (
        <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" />
            <path
                d="m15 15 4.5 4.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
            />
        </svg>
    );
}
