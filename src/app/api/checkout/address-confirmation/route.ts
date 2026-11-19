import { NextResponse } from "next/server";

import { confirmOwnAddress } from "@/lib/address-service";
import { getAuthenticatedUserIdentity } from "@/lib/authenticated-user";
import { getPrisma } from "@/lib/prisma";
import {
    parseAddressIdBody,
    privateJsonError,
    privateResponseHeaders,
    readPrivateJsonRequest,
} from "@/lib/private-json-route";

export async function POST(request: Request) {
    const parsedRequest = await readPrivateJsonRequest(request);

    if (parsedRequest.status === "error") {
        return parsedRequest.response;
    }

    const addressId = parseAddressIdBody(parsedRequest.body);

    if (addressId === null) {
        return privateJsonError("A solicitação contém dados inválidos.", 400);
    }

    try {
        const identity = await getAuthenticatedUserIdentity();
        const result = await confirmOwnAddress(
            getPrisma(),
            identity,
            addressId,
        );

        if (result.status === "unauthenticated") {
            return privateJsonError(
                "Sua sessão expirou. Entre novamente para continuar.",
                401,
            );
        }

        if (result.status === "not_found") {
            return privateJsonError("Endereço não encontrado.", 404);
        }

        return NextResponse.json(
            { address: result.address, ok: true },
            { headers: privateResponseHeaders },
        );
    } catch {
        return privateJsonError(
            "Não foi possível confirmar o endereço agora. Tente novamente.",
            500,
        );
    }
}
