import { NextResponse } from "next/server";

import {
    AUTH_JSON_BODY_LIMIT,
    AuthBodyError,
    isTrustedRequestOrigin,
    readLimitedJson,
} from "@/lib/auth-http";

export const privateResponseHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
};

export async function readPrivateJsonRequest(request: Request) {
    if (
        !isTrustedRequestOrigin(
            request.headers.get("origin"),
            process.env.NEXTAUTH_URL,
        )
    ) {
        return {
            response: privateJsonError(
                "Origem da requisição não permitida.",
                403,
            ),
            status: "error",
        } as const;
    }

    const contentType = request.headers.get("content-type");

    if (
        contentType?.split(";", 1)[0].trim().toLowerCase() !==
        "application/json"
    ) {
        return {
            response: privateJsonError("Envie os dados como JSON.", 415),
            status: "error",
        } as const;
    }

    try {
        return {
            body: await readLimitedJson(request, AUTH_JSON_BODY_LIMIT),
            status: "ok",
        } as const;
    } catch (error) {
        if (error instanceof AuthBodyError) {
            return {
                response: privateJsonError(
                    error.reason === "too_large"
                        ? "Os dados excedem o limite permitido."
                        : "Os dados não formam um JSON válido.",
                    error.reason === "too_large" ? 413 : 400,
                ),
                status: "error",
            } as const;
        }

        return {
            response: privateJsonError("Não foi possível ler os dados.", 400),
            status: "error",
        } as const;
    }
}

export function privateJsonError(error: string, status: number) {
    return NextResponse.json(
        { error, ok: false },
        { headers: privateResponseHeaders, status },
    );
}

export function parseAddressIdBody(value: unknown) {
    if (
        typeof value !== "object" ||
        value === null ||
        Array.isArray(value) ||
        Object.getPrototypeOf(value) !== Object.prototype ||
        Object.keys(value).length !== 1 ||
        !("addressId" in value)
    ) {
        return null;
    }

    return (value as { addressId?: unknown }).addressId;
}
