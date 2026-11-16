import "server-only";

import { createHmac } from "node:crypto";

import { getPrisma } from "@/lib/prisma";

export type AuthRateLimitOperation = "login" | "register";

export const AUTH_RATE_LIMITS = {
    login: {
        aggregate: { maxAttempts: 100, windowMs: 10 * 60 * 1_000 },
        identifier: { maxAttempts: 5, windowMs: 15 * 60 * 1_000 },
    },
    register: {
        aggregate: { maxAttempts: 30, windowMs: 10 * 60 * 1_000 },
        identifier: { maxAttempts: 3, windowMs: 60 * 60 * 1_000 },
    },
} as const;

type RateLimitPolicy = {
    maxAttempts: number;
    windowMs: number;
};

type RateLimitOptions = {
    now?: Date;
    policies?: {
        aggregate: RateLimitPolicy;
        identifier: RateLimitPolicy;
    };
};

type CounterRow = {
    attemptCount: number;
    expiresAt: Date;
};

export type AuthRateLimitResult =
    { allowed: true } | { allowed: false; retryAfterSeconds: number };

export async function consumeAuthRateLimit(
    operation: AuthRateLimitOperation,
    identifier: string | null,
    options: RateLimitOptions = {},
): Promise<AuthRateLimitResult> {
    const now = options.now ?? new Date();
    const policies = options.policies ?? AUTH_RATE_LIMITS[operation];
    const secret = getRateLimitSecret();
    const counters = [
        {
            action: `${operation}:aggregate`,
            keyHash: deriveCounterKey(secret, operation, "aggregate"),
            policy: policies.aggregate,
        },
    ];

    if (identifier !== null) {
        counters.push({
            action: `${operation}:identifier`,
            keyHash: deriveCounterKey(secret, operation, identifier),
            policy: policies.identifier,
        });
    }

    return getPrisma().$transaction(async (transaction) => {
        await transaction.$executeRaw`
            DELETE FROM "AuthRateLimit"
            WHERE ctid IN (
                SELECT ctid FROM "AuthRateLimit"
                WHERE "expiresAt" <= ${now}
                ORDER BY "expiresAt" ASC
                LIMIT 50
            )
        `;

        const consumed = [];

        for (const counter of counters) {
            const expiresAt = new Date(now.getTime() + counter.policy.windowMs);
            const rows = await transaction.$queryRaw<CounterRow[]>`
                INSERT INTO "AuthRateLimit" (
                    "action", "keyHash", "attemptCount", "windowStartedAt",
                    "expiresAt", "updatedAt"
                )
                VALUES (
                    ${counter.action}, ${counter.keyHash}, 1, ${now},
                    ${expiresAt}, ${now}
                )
                ON CONFLICT ("action", "keyHash") DO UPDATE SET
                    "attemptCount" = CASE
                        WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN 1
                        ELSE "AuthRateLimit"."attemptCount" + 1
                    END,
                    "windowStartedAt" = CASE
                        WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN ${now}
                        ELSE "AuthRateLimit"."windowStartedAt"
                    END,
                    "expiresAt" = CASE
                        WHEN "AuthRateLimit"."expiresAt" <= ${now} THEN ${expiresAt}
                        ELSE "AuthRateLimit"."expiresAt"
                    END,
                    "updatedAt" = ${now}
                RETURNING "attemptCount", "expiresAt"
            `;
            const row = rows[0];

            if (!row) {
                throw new Error(
                    "O contador de autenticacao nao foi atualizado.",
                );
            }

            consumed.push({ policy: counter.policy, row });
        }

        const denied = consumed.filter(
            ({ policy, row }) => row.attemptCount > policy.maxAttempts,
        );

        if (denied.length === 0) {
            return { allowed: true };
        }

        return {
            allowed: false,
            retryAfterSeconds: Math.max(
                1,
                ...denied.map(({ row }) =>
                    Math.ceil(
                        (row.expiresAt.getTime() - now.getTime()) / 1_000,
                    ),
                ),
            ),
        };
    });
}

function deriveCounterKey(
    secret: string,
    operation: AuthRateLimitOperation,
    identifier: string,
) {
    return createHmac("sha256", secret)
        .update(`${operation}\0${identifier}`)
        .digest("hex");
}

function getRateLimitSecret() {
    const secret = process.env.NEXTAUTH_SECRET;

    if (
        !secret?.trim() ||
        secret === "segredo_ficticio_substitua_por_um_valor_aleatorio"
    ) {
        throw new Error("NEXTAUTH_SECRET nao esta definida.");
    }

    return secret;
}
