import "server-only";

import { getServerSession } from "next-auth";

import { createAuthOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function getAuthenticatedUserIdentity() {
    const session = await getServerSession(await createAuthOptions());
    const userId = session?.user?.id;

    if (typeof userId !== "string" || !isUuid(userId)) {
        return null;
    }

    return getPrisma().user.findUnique({
        select: { id: true },
        where: { id: userId },
    });
}

function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value,
    );
}
