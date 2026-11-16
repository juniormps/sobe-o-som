import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { getToken } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { NextRequest } from "next/server";

import {
    canSignInWithGoogle,
    getSafeRedirectUrl,
    mapGoogleProfile,
    toPublicSession,
} from "@/lib/auth-rules";
import { consumeAuthRateLimit } from "@/lib/auth-rate-limit";
import { validateLoginCredentials } from "@/lib/auth-credentials";
import {
    isSupportedPasswordHash,
    REFERENCE_PASSWORD_HASH,
    verifyPassword,
} from "@/lib/password";
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
    request?: NextRequest,
): Promise<NextAuthOptions> {
    validateNextAuthUrl();

    const secret = getNextAuthSecret();
    const hasActiveSession = request
        ? Boolean(await getToken({ req: request, secret }))
        : false;

    return {
        secret,
        adapter: PrismaAdapter(getPrisma()),
        providers: [
            CredentialsProvider({
                name: "E-mail e senha",
                credentials: {
                    email: { label: "E-mail", type: "email" },
                    password: { label: "Senha", type: "password" },
                },
                async authorize(credentials) {
                    const validation = validateLoginCredentials(credentials);
                    const identifier = validation?.email ?? null;
                    let rateLimit;

                    try {
                        rateLimit = await consumeAuthRateLimit(
                            "login",
                            identifier,
                        );
                    } catch {
                        throw new Error("AuthenticationUnavailable");
                    }

                    if (!rateLimit.allowed) {
                        throw new Error("TooManyAttempts");
                    }

                    if (!validation) {
                        return null;
                    }

                    let user;
                    let passwordMatches;

                    try {
                        user = await getPrisma().user.findUnique({
                            select: {
                                email: true,
                                id: true,
                                image: true,
                                name: true,
                                passwordHash: true,
                            },
                            where: { email: validation.email },
                        });
                        const passwordHash = isSupportedPasswordHash(
                            user?.passwordHash,
                        )
                            ? user.passwordHash
                            : REFERENCE_PASSWORD_HASH;
                        passwordMatches = await verifyPassword(
                            validation.password,
                            passwordHash,
                        );
                    } catch {
                        throw new Error("AuthenticationUnavailable");
                    }

                    if (
                        !user ||
                        !isSupportedPasswordHash(user.passwordHash) ||
                        !passwordMatches
                    ) {
                        return null;
                    }

                    return {
                        email: user.email,
                        id: user.id,
                        image: user.image,
                        name: user.name,
                    };
                },
            }),
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
            signIn({ account, profile, user }) {
                if (account?.provider === "google") {
                    return canSignInWithGoogle(
                        profile,
                        account.provider,
                        hasActiveSession,
                    );
                }

                if (account?.provider === "credentials") {
                    return Boolean(
                        !hasActiveSession &&
                        user.id &&
                        user.email &&
                        account.type === "credentials",
                    );
                }

                return false;
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
