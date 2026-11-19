import { NextResponse } from "next/server";

import { setOwnDefaultAddress } from "@/lib/address-service";
import { getAuthenticatedUserIdentity } from "@/lib/authenticated-user";
import { getPrisma } from "@/lib/prisma";
import {
    privateJsonError,
    privateResponseHeaders,
    readPrivateJsonRequest,
} from "@/lib/private-json-route";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    const parsedRequest = await readPrivateJsonRequest(request);

    if (parsedRequest.status === "error") {
        return parsedRequest.response;
    }

    if (
        typeof parsedRequest.body !== "object" ||
        parsedRequest.body === null ||
        Array.isArray(parsedRequest.body) ||
        Object.getPrototypeOf(parsedRequest.body) !== Object.prototype ||
        Object.keys(parsedRequest.body).length !== 0
    ) {
        return privateJsonError("A solicitação contém dados inválidos.", 400);
    }

    try {
        const [{ id }, identity] = await Promise.all([
            context.params,
            getAuthenticatedUserIdentity(),
        ]);
        const result = await setOwnDefaultAddress(getPrisma(), identity, id);

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
            "Não foi possível alterar o endereço principal agora.",
            500,
        );
    }
}
