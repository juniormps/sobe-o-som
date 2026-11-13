import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getToken } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";
import type { NextRequest } from "next/server";

import {
    canSignInWithGoogle,
    getSafeRedirectUrl,
    mapGoogleProfile,
    toPublicSession,
} from "@/lib/auth-rules";
import { getPrisma } from "@/lib/prisma";

const sevenDaysInSeconds = 7 * 24 * 60 * 60;
const nextAuthSecretPlaceholder =
    "segredo_ficticio_substitua_por_um_valor_aleatorio";

function getRequiredVariable(name: string) {
    const value = process.env[name];

    if (!value?.trim()) {
        throw new Error(`${name} nao esta definida.`);
    }

    return value;
}

function getNextAuthSecret() {
    const secret = getRequiredVariable("NEXTAUTH_SECRET");

    if (secret === nextAuthSecretPlaceholder) {
        throw new Error("NEXTAUTH_SECRET ainda usa o valor de exemplo.");
    }

    return secret;
}

function validateNextAuthUrl() {
    const value = getRequiredVariable("NEXTAUTH_URL");

    try {
        const url = new URL(value);

        if (!["http:", "https:"].includes(url.protocol)) {
            throw new Error();
        }
    } catch {
        throw new Error("NEXTAUTH_URL nao e uma URL HTTP valida.");
    }
}

export async function createAuthOptions(
    request: NextRequest,
): Promise<NextAuthOptions> {
    validateNextAuthUrl();

    const secret = getNextAuthSecret();
    const hasActiveSession = Boolean(await getToken({ req: request, secret }));

    return {
        secret,
        adapter: PrismaAdapter(getPrisma()),
        providers: [
            GoogleProvider({
                clientId: getRequiredVariable("GOOGLE_CLIENT_ID"),
                clientSecret: getRequiredVariable("GOOGLE_CLIENT_SECRET"),
                profile: mapGoogleProfile,
            }),
        ],
        pages: {
            signIn: "/login",
            error: "/login",
        },
        logger: {
            error(code) {
                console.error(`[next-auth][error] ${code}`);
            },
            warn(code) {
                console.warn(`[next-auth][warn] ${code}`);
            },
            debug() {},
        },
        callbacks: {
            signIn({ account, profile }) {
                return canSignInWithGoogle(
                    profile,
                    account?.provider,
                    hasActiveSession,
                );
            },
            redirect({ url, baseUrl }) {
                return getSafeRedirectUrl(url, baseUrl);
            },
            session({ session, token }) {
                if (typeof token.sub !== "string" || !token.sub) {
                    throw new Error("Sessao sem identificador de usuario.");
                }

                return toPublicSession(session, token.sub);
            },
        },
        session: {
            strategy: "jwt",
            maxAge: sevenDaysInSeconds,
        },
        jwt: {
            maxAge: sevenDaysInSeconds,
        },
    } satisfies NextAuthOptions;
}
