import "server-only";

import { Prisma } from "@/generated/prisma/client";
import {
    consumeAuthRateLimit,
    type AuthRateLimitResult,
} from "@/lib/auth-rate-limit";
import {
    validateRegistrationInput,
    type RegistrationField,
} from "@/lib/auth-credentials";
import { normalizeEmail } from "@/lib/auth-rules";
import { hashPassword } from "@/lib/password";
import { getPrisma } from "@/lib/prisma";

export type RegistrationResult =
    | {
          errors: Partial<Record<RegistrationField, string>>;
          status: "invalid";
      }
    | { status: "created" }
    | { status: "conflict" }
    | { retryAfterSeconds: number; status: "limited" }
    | { status: "unavailable" };

export async function registerUser(
    value: unknown,
): Promise<RegistrationResult> {
    let rateLimit: AuthRateLimitResult;
    const identifier =
        value && typeof value === "object" && !Array.isArray(value)
            ? normalizeEmail((value as Record<string, unknown>).email)
            : null;

    try {
        rateLimit = await consumeAuthRateLimit("register", identifier);
    } catch {
        return { status: "unavailable" };
    }

    if (!rateLimit.allowed) {
        return {
            retryAfterSeconds: rateLimit.retryAfterSeconds,
            status: "limited",
        };
    }

    const validation = validateRegistrationInput(value);

    if (!validation.success) {
        return { errors: validation.errors, status: "invalid" };
    }

    const prisma = getPrisma();
    const existingUser = await prisma.user.findUnique({
        select: { id: true },
        where: { email: validation.data.email },
    });

    if (existingUser) {
        return { status: "conflict" };
    }

    let passwordHash: string;

    try {
        passwordHash = await hashPassword(validation.data.password);
    } catch {
        return { status: "unavailable" };
    }

    try {
        await prisma.user.create({
            data: {
                email: validation.data.email,
                name: validation.data.name,
                passwordHash,
            },
            select: { id: true },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return { status: "conflict" };
        }

        throw error;
    }

    return { status: "created" };
}
