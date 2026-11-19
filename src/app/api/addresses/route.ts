import { NextResponse } from "next/server";

import { createOwnAddress } from "@/lib/address-service";
import { getAuthenticatedUserIdentity } from "@/lib/authenticated-user";
import { getPrisma } from "@/lib/prisma";
import {
    privateJsonError,
    privateResponseHeaders,
    readPrivateJsonRequest,
} from "@/lib/private-json-route";

export async function POST(request: Request) {
    const parsedRequest = await readPrivateJsonRequest(request);

    if (parsedRequest.status === "error") {
        return parsedRequest.response;
    }

    try {
        const identity = await getAuthenticatedUserIdentity();
        const result = await createOwnAddress(
            getPrisma(),
            identity,
            parsedRequest.body,
        );

        if (result.status === "unauthenticated") {
            return privateJsonError(
                "Sua sessão expirou. Entre novamente para continuar.",
                401,
            );
        }

        if (result.status === "invalid") {
            return NextResponse.json(
                {
                    error: "Revise os campos indicados.",
                    fieldErrors: result.errors,
                    ok: false,
                },
                { headers: privateResponseHeaders, status: 400 },
            );
        }

        return NextResponse.json(
            { address: result.address, ok: true },
            { headers: privateResponseHeaders, status: 201 },
        );
    } catch {
        return privateJsonError(
            "Não foi possível salvar o endereço agora. Tente novamente.",
            500,
        );
    }
}
