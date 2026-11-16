import { NextResponse } from "next/server";

import {
    AUTH_JSON_BODY_LIMIT,
    AuthBodyError,
    isTrustedRequestOrigin,
    readLimitedJson,
} from "@/lib/auth-http";
import { registerUser } from "@/lib/register-user";

const responseHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
};

export async function POST(request: Request) {
    if (
        !isTrustedRequestOrigin(
            request.headers.get("origin"),
            process.env.NEXTAUTH_URL,
        )
    ) {
        return jsonError("Origem da requisição não permitida.", 403);
    }

    const contentType = request.headers.get("content-type");

    if (
        contentType?.split(";", 1)[0].trim().toLowerCase() !==
        "application/json"
    ) {
        return jsonError("Envie o cadastro como JSON.", 415);
    }

    let body: unknown;

    try {
        body = await readLimitedJson(request, AUTH_JSON_BODY_LIMIT);
    } catch (error) {
        if (error instanceof AuthBodyError) {
            return jsonError(
                error.reason === "too_large"
                    ? "Os dados do cadastro excedem o limite permitido."
                    : "Os dados do cadastro não formam um JSON válido.",
                error.reason === "too_large" ? 413 : 400,
            );
        }

        return jsonError("Não foi possível ler os dados do cadastro.", 400);
    }

    try {
        const result = await registerUser(body);

        if (result.status === "created") {
            return NextResponse.json(
                {
                    message:
                        "Cadastro concluído. Agora você pode entrar com seu e-mail e senha.",
                    ok: true,
                },
                { headers: responseHeaders, status: 201 },
            );
        }

        if (result.status === "invalid") {
            return NextResponse.json(
                {
                    error: "Revise os campos indicados.",
                    fieldErrors: result.errors,
                    ok: false,
                },
                { headers: responseHeaders, status: 400 },
            );
        }

        if (result.status === "conflict") {
            return jsonError(
                "Já existe um acesso para este e-mail. Use a opção de entrada já cadastrada.",
                409,
            );
        }

        if (result.status === "limited") {
            return NextResponse.json(
                {
                    error: "Muitas tentativas de cadastro. Aguarde e tente novamente.",
                    ok: false,
                    retryAfterSeconds: result.retryAfterSeconds,
                },
                {
                    headers: {
                        ...responseHeaders,
                        "Retry-After": String(result.retryAfterSeconds),
                    },
                    status: 429,
                },
            );
        }

        return jsonError(
            "O cadastro está temporariamente indisponível. Tente novamente mais tarde.",
            503,
        );
    } catch {
        return jsonError(
            "Não foi possível concluir o cadastro agora. Tente novamente mais tarde.",
            500,
        );
    }
}

function jsonError(error: string, status: number) {
    return NextResponse.json(
        { error, ok: false },
        { headers: responseHeaders, status },
    );
}
