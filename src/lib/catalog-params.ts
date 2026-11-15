export const CATALOG_PAGE_SIZE = 12;
export const MAX_SEARCH_LENGTH = 80;

export type RawCatalogParams = Record<string, string | string[] | undefined>;

export type CatalogFilters = {
    genre: string | null;
    page: number;
    query: string;
    sale: boolean;
};

export type ParsedCatalogParams = CatalogFilters & {
    hasInvalidParams: boolean;
};

function getSingleValue(value: string | string[] | undefined) {
    if (Array.isArray(value)) {
        return { invalid: true, value: undefined };
    }

    return { invalid: false, value };
}

export function parseCatalogParams(
    params: RawCatalogParams,
): ParsedCatalogParams {
    const rawQuery = getSingleValue(params.busca);
    const rawGenre = getSingleValue(params.genero);
    const rawSale = getSingleValue(params.sale);
    const rawPage = getSingleValue(params.pagina);
    const sanitizedQuery = Array.from(rawQuery.value ?? "", (character) => {
        const code = character.charCodeAt(0);

        return code <= 31 || (code >= 127 && code <= 159) ? " " : character;
    }).join("");
    const compactQuery = sanitizedQuery.trim().replace(/\s+/g, " ");
    const query = compactQuery.slice(0, MAX_SEARCH_LENGTH);
    const genreCandidate = rawGenre.value?.trim() ?? "";
    const genre = /^[a-z0-9-]{1,80}$/.test(genreCandidate)
        ? genreCandidate
        : null;
    const sale = rawSale.value === "true";
    const page =
        rawPage.value && /^[1-9]\d{0,5}$/.test(rawPage.value)
            ? Number(rawPage.value)
            : 1;

    return {
        genre,
        page,
        query,
        sale,
        hasInvalidParams:
            Object.keys(params).some(
                (key) => !["busca", "genero", "pagina", "sale"].includes(key),
            ) ||
            rawQuery.invalid ||
            rawGenre.invalid ||
            rawSale.invalid ||
            rawPage.invalid ||
            (rawQuery.value !== undefined &&
                (!query || rawQuery.value !== query)) ||
            compactQuery.length > MAX_SEARCH_LENGTH ||
            (rawGenre.value !== undefined && rawGenre.value !== genre) ||
            (rawSale.value !== undefined && rawSale.value !== "true") ||
            (rawPage.value !== undefined &&
                (page === 1 || rawPage.value !== String(page))),
    };
}

export function buildCatalogHref(
    filters: CatalogFilters,
    changes: Partial<CatalogFilters> = {},
) {
    const next = { ...filters, ...changes };
    const params = new URLSearchParams();

    if (next.query) {
        params.set("busca", next.query);
    }

    if (next.genre) {
        params.set("genero", next.genre);
    }

    if (next.sale) {
        params.set("sale", "true");
    }

    if (next.page > 1) {
        params.set("pagina", String(next.page));
    }

    const queryString = params.toString();

    return queryString ? `/?${queryString}` : "/";
}
