import NextAuth from "next-auth";
import type { NextRequest } from "next/server";

import { createAuthOptions } from "@/lib/auth";

type AuthRouteContext = {
    params: Promise<{
        nextauth: string[];
    }>;
};

async function handler(request: NextRequest, context: AuthRouteContext) {
    return NextAuth(request, context, await createAuthOptions(request));
}

export { handler as GET, handler as POST };
