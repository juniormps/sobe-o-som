import { NextResponse } from "next/server";

import { normalizePostalCode } from "@/lib/address-rules";
import { CepLookupError, lookupCep } from "@/lib/cep";

const publicResponseHeaders = {
    "Cache-Control": "public, max-age=0, s-maxage=86400",
};
const errorResponseHeaders = {
    "Cache-Control": "no-store, max-age=0",
};

type RouteContext = {
    params: Promise<{ cep: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
    const { cep } = await context.params;
    const postalCode = normalizePostalCode(cep);

    if (!postalCode) {
        return jsonError("Informe um CEP válido com oito dígitos.", 400);
    }

    try {
        const address = await lookupCep(postalCode);

        return NextResponse.json(
            { address, ok: true },
            { headers: publicResponseHeaders },
        );
    } catch (error) {
        if (error instanceof CepLookupError) {
            if (error.reason === "not_found") {
                return jsonError("CEP não encontrado.", 404);
            }

            if (error.reason === "timeout") {
                return jsonError(
                    "A consulta de CEP demorou mais que o esperado. Preencha manualmente ou tente novamente.",
                    504,
                );
            }
        }

        return jsonError(
            "Não foi possível consultar o CEP agora. Preencha manualmente ou tente novamente.",
            502,
        );
    }
}

function jsonError(error: string, status: number) {
    return NextResponse.json(
        { error, ok: false },
        { headers: errorResponseHeaders, status },
    );
}
