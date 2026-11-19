import { unstable_cache } from "next/cache";

import {
    ADDRESS_FIELD_LIMITS,
    BRAZILIAN_STATES,
    normalizePostalCode,
} from "@/lib/address-rules";

export const CEP_CACHE_SECONDS = 24 * 60 * 60;
export const CEP_REQUEST_TIMEOUT_MS = 4_000;

export type CepAddress = {
    city: string;
    district: string;
    postalCode: string;
    state: string;
    street: string;
};

export type CepLookupFailure =
    "not_found" | "timeout" | "upstream_http" | "invalid_response" | "network";

export class CepLookupError extends Error {
    constructor(public readonly reason: CepLookupFailure) {
        super(reason);
    }
}

export type CepCacheAdapter = (
    postalCode: string,
    load: () => Promise<CepAddress>,
) => Promise<CepAddress>;

export function createCepLookup(
    load: (postalCode: string) => Promise<CepAddress>,
    cache: CepCacheAdapter,
) {
    return (postalCode: string) => cache(postalCode, () => load(postalCode));
}

export async function fetchCepFromViaCep(
    postalCode: string,
    fetchImplementation: typeof fetch = fetch,
    timeoutMilliseconds = CEP_REQUEST_TIMEOUT_MS,
) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMilliseconds);

    try {
        let response: Response;

        try {
            response = await fetchImplementation(
                `https://viacep.com.br/ws/${postalCode}/json/`,
                {
                    cache: "no-store",
                    signal: controller.signal,
                },
            );
        } catch (error) {
            if (controller.signal.aborted) {
                throw new CepLookupError("timeout");
            }

            if (error instanceof CepLookupError) {
                throw error;
            }

            throw new CepLookupError("network");
        }

        if (!response.ok) {
            throw new CepLookupError("upstream_http");
        }

        let payload: unknown;

        try {
            payload = await response.json();
        } catch {
            throw new CepLookupError("invalid_response");
        }

        return parseViaCepResponse(payload, postalCode);
    } finally {
        clearTimeout(timeout);
    }
}

export function parseViaCepResponse(
    value: unknown,
    expectedPostalCode: string,
): CepAddress {
    if (!isPlainObject(value)) {
        throw new CepLookupError("invalid_response");
    }

    if (value.erro === true || value.erro === "true") {
        throw new CepLookupError("not_found");
    }

    const city = readRequiredText(value.localidade, ADDRESS_FIELD_LIMITS.city);
    const state = readRequiredText(value.uf).toUpperCase();
    const street = readOptionalText(
        value.logradouro,
        ADDRESS_FIELD_LIMITS.street,
    );
    const district = readOptionalText(
        value.bairro,
        ADDRESS_FIELD_LIMITS.district,
    );
    const returnedPostalCode = normalizePostalCode(value.cep);

    if (
        !city ||
        !returnedPostalCode ||
        returnedPostalCode !== expectedPostalCode ||
        !BRAZILIAN_STATES.includes(state as (typeof BRAZILIAN_STATES)[number])
    ) {
        throw new CepLookupError("invalid_response");
    }

    return {
        city,
        district,
        postalCode: returnedPostalCode,
        state,
        street,
    };
}

const getCachedCep = unstable_cache(
    async (postalCode: string) => fetchCepFromViaCep(postalCode),
    ["viacep-public-result-v1"],
    { revalidate: CEP_CACHE_SECONDS },
);

export const lookupCep = createCepLookup(fetchCepFromViaCep, (postalCode) =>
    getCachedCep(postalCode),
);

function readRequiredText(value: unknown, maximumLength = 2) {
    if (
        typeof value !== "string" ||
        hasControlCharacters(value) ||
        value.trim().length > maximumLength
    ) {
        return "";
    }

    return value.trim();
}

function readOptionalText(value: unknown, maximumLength: number) {
    if (value === undefined || value === null) {
        return "";
    }

    if (
        typeof value !== "string" ||
        hasControlCharacters(value) ||
        value.trim().length > maximumLength
    ) {
        throw new CepLookupError("invalid_response");
    }

    return value.trim();
}

function hasControlCharacters(value: string) {
    return /[\u0000-\u001F\u007F-\u009F]/.test(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        (Object.getPrototypeOf(value) === Object.prototype ||
            Object.getPrototypeOf(value) === null)
    );
}
