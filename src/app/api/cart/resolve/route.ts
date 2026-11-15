import { NextResponse } from "next/server";

import { queryCartProducts } from "@/lib/cart-repository";
import { parseCartResolveInput, resolveCartItems } from "@/lib/cart-resolver";
import { getPrisma } from "@/lib/prisma";

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
};

export async function POST(request: Request) {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Entrada inválida." },
            { headers: noStoreHeaders, status: 400 },
        );
    }

    const input = parseCartResolveInput(body);

    if (!input) {
        return NextResponse.json(
            { error: "Entrada inválida." },
            { headers: noStoreHeaders, status: 400 },
        );
    }

    try {
        const items = await resolveCartItems(input.items, (productIds) =>
            queryCartProducts(getPrisma(), productIds),
        );

        return NextResponse.json({ items }, { headers: noStoreHeaders });
    } catch {
        return NextResponse.json(
            { error: "Não foi possível atualizar o carrinho agora." },
            { headers: noStoreHeaders, status: 503 },
        );
    }
}
