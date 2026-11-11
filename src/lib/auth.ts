import "server-only";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

const sevenDaysInSeconds = 7 * 24 * 60 * 60;

function getRequiredVariable(name: string) {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} nao esta definida.`);
    }

    return value;
}

export const authOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: getRequiredVariable("GOOGLE_CLIENT_ID"),
            clientSecret: getRequiredVariable("GOOGLE_CLIENT_SECRET"),
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: sevenDaysInSeconds,
    },
    jwt: {
        maxAge: sevenDaysInSeconds,
    },
} satisfies NextAuthOptions;
