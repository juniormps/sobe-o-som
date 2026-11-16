import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const SCRYPT_VERSION = "1";
const SCRYPT_COST = 131_072;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const SCRYPT_MAX_MEMORY = 256 * 1024 * 1024;
const SCRYPT_SALT_BYTES = 16;
const SCRYPT_HASH_BYTES = 64;
const MAX_CONCURRENT_DERIVATIONS = 2;

const globalPasswordWork = globalThis as unknown as {
    passwordDerivationsInProgress?: number;
};

export const REFERENCE_PASSWORD_HASH =
    "scrypt$1$131072$8$1$MDEyMzQ1Njc4OWFiY2RlZg$ry8CUa1dinn0qrVhOpUor3qq-eq2G0t25vVXZdqrDL-8aRtTvJRnbtm3Yb1FQsmOE7uIjFCTBZw1wxsTQeB6Zw";

type ParsedPasswordHash = {
    hash: Buffer;
    salt: Buffer;
};

export async function hashPassword(password: string) {
    const salt = randomBytes(SCRYPT_SALT_BYTES);
    const hash = await derivePassword(password, salt);

    return [
        "scrypt",
        SCRYPT_VERSION,
        String(SCRYPT_COST),
        String(SCRYPT_BLOCK_SIZE),
        String(SCRYPT_PARALLELIZATION),
        salt.toString("base64url"),
        hash.toString("base64url"),
    ].join("$");
}

export async function verifyPassword(password: string, storedHash: string) {
    const parsed = parsePasswordHash(storedHash);

    if (!parsed) {
        return false;
    }

    const actualHash = await derivePassword(password, parsed.salt);

    return (
        actualHash.length === parsed.hash.length &&
        timingSafeEqual(actualHash, parsed.hash)
    );
}

export function isSupportedPasswordHash(value: unknown): value is string {
    return typeof value === "string" && parsePasswordHash(value) !== null;
}

function parsePasswordHash(value: string): ParsedPasswordHash | null {
    const parts = value.split("$");

    if (
        parts.length !== 7 ||
        parts[0] !== "scrypt" ||
        parts[1] !== SCRYPT_VERSION ||
        parts[2] !== String(SCRYPT_COST) ||
        parts[3] !== String(SCRYPT_BLOCK_SIZE) ||
        parts[4] !== String(SCRYPT_PARALLELIZATION)
    ) {
        return null;
    }

    const salt = decodeBase64Url(parts[5]);
    const hash = decodeBase64Url(parts[6]);

    if (
        !salt ||
        salt.length < SCRYPT_SALT_BYTES ||
        !hash ||
        hash.length !== SCRYPT_HASH_BYTES
    ) {
        return null;
    }

    return { hash, salt };
}

function decodeBase64Url(value: string) {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
        return null;
    }

    const decoded = Buffer.from(value, "base64url");

    return decoded.toString("base64url") === value ? decoded : null;
}

function derivePassword(password: string, salt: Buffer) {
    const activeDerivations =
        globalPasswordWork.passwordDerivationsInProgress ?? 0;

    if (activeDerivations >= MAX_CONCURRENT_DERIVATIONS) {
        return Promise.reject(
            new Error("A verificacao de senha esta temporariamente ocupada."),
        );
    }

    globalPasswordWork.passwordDerivationsInProgress = activeDerivations + 1;

    return new Promise<Buffer>((resolve, reject) => {
        try {
            scrypt(
                password,
                salt,
                SCRYPT_HASH_BYTES,
                {
                    N: SCRYPT_COST,
                    maxmem: SCRYPT_MAX_MEMORY,
                    p: SCRYPT_PARALLELIZATION,
                    r: SCRYPT_BLOCK_SIZE,
                },
                (error, derivedKey) => {
                    globalPasswordWork.passwordDerivationsInProgress = Math.max(
                        0,
                        (globalPasswordWork.passwordDerivationsInProgress ??
                            1) - 1,
                    );

                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve(derivedKey);
                },
            );
        } catch (error) {
            globalPasswordWork.passwordDerivationsInProgress = Math.max(
                0,
                (globalPasswordWork.passwordDerivationsInProgress ?? 1) - 1,
            );
            reject(error);
        }
    });
}
