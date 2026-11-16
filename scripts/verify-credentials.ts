import "dotenv/config";

import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { rm } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";

import { Client } from "pg";

import {
    getIsolatedTestDatabaseUrl,
    runTestDatabaseCommand,
    validateIsolatedTestDatabase,
} from "./test-database";

const fixturePrefix = "m4-verify-";
const fixturePassword = " frase-senha válida 2026 ";
const appOrigin = "http://127.0.0.1:3214";
const testSecret = "m4-verify-secret-with-at-least-thirty-two-characters";
const verificationDistDir = ".next-credentials-verify";
const controlledRateLimitKeys = new Set<string>();
let serverOutput = "";

type JsonRecord = Record<string, unknown>;

class CookieJar {
    private readonly cookies = new Map<string, string>();

    add(response: Response) {
        for (const header of response.headers.getSetCookie()) {
            const pair = header.split(";", 1)[0];
            const separator = pair.indexOf("=");

            if (separator > 0) {
                this.cookies.set(
                    pair.slice(0, separator),
                    pair.slice(separator + 1),
                );
            }
        }
    }

    header() {
        return [...this.cookies]
            .map(([name, value]) => `${name}=${value}`)
            .join("; ");
    }
}

async function main() {
    const testDatabaseUrl = getIsolatedTestDatabaseUrl();
    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.NEXTAUTH_URL = appOrigin;
    process.env.NEXTAUTH_SECRET = testSecret;
    process.env.GOOGLE_CLIENT_ID = "credentials-verify-google-client";
    process.env.GOOGLE_CLIENT_SECRET = "credentials-verify-google-secret";

    const client = new Client({
        connectionString: testDatabaseUrl,
        connectionTimeoutMillis: 5_000,
    });
    await client.connect();
    await validateIsolatedTestDatabase(client);
    runTestDatabaseCommand("prisma:migrate:deploy", testDatabaseUrl);
    registerControlledRateLimitKeys();
    await cleanControlledRateLimits(client);
    await cleanControlledData(client);

    let server: ChildProcess | null = null;

    try {
        await verifyValidationRules();
        await verifyPasswordHashing();
        await verifyRateLimits();

        server = await startApplication(testDatabaseUrl);
        await waitForApplication(server);
        await verifyRegistrationAndOrigin(client);
        await verifyNextAuthCredentials(client);
        await verifyDirectCredentialRateLimit(client);
    } finally {
        await stopApplication(server);
        await rm(verificationDistDir, { force: true, recursive: true });
        await cleanControlledRateLimits(client);
        await cleanControlledData(client);
        await client.end();
    }

    console.log(
        "Credenciais verificadas: validacao, scrypt, cadastro, limites concorrentes, origem e fluxo NextAuth com CSRF, cookies e sessao.",
    );
}

async function verifyValidationRules() {
    const {
        PASSWORD_MAX_LENGTH,
        PASSWORD_MIN_LENGTH,
        validateLoginCredentials,
        validateRegistrationInput,
    } = await import("../src/lib/auth-credentials");
    const { getSafeRedirectUrl, getSafeReturnPath, toPublicSession } =
        await import("../src/lib/auth-rules");
    const { isTrustedRequestOrigin } = await import("../src/lib/auth-http");

    const validBase = {
        email: "  Pessoa.Colecionadora+M4@Example.com  ",
        name: "Pessoa Colecionadora",
        password: "x".repeat(PASSWORD_MIN_LENGTH),
        passwordConfirmation: "x".repeat(PASSWORD_MIN_LENGTH),
    };
    assert.equal(PASSWORD_MIN_LENGTH, 8);
    assert.equal(PASSWORD_MAX_LENGTH, 128);
    const minimum = validateRegistrationInput(validBase);

    assert.equal(minimum.success, true);
    assert.equal(
        minimum.success ? minimum.data.email : null,
        "pessoa.colecionadora+m4@example.com",
    );
    assert.equal(
        validateRegistrationInput({
            ...validBase,
            password: "x".repeat(7),
            passwordConfirmation: "x".repeat(7),
        }).success,
        false,
    );
    assert.equal(
        validateRegistrationInput({
            ...validBase,
            password: "x".repeat(PASSWORD_MAX_LENGTH),
            passwordConfirmation: "x".repeat(PASSWORD_MAX_LENGTH),
        }).success,
        true,
    );
    assert.equal(
        validateRegistrationInput({
            ...validBase,
            password: "x".repeat(PASSWORD_MAX_LENGTH + 1),
            passwordConfirmation: "x".repeat(PASSWORD_MAX_LENGTH + 1),
        }).success,
        false,
    );
    assert.equal(
        validateRegistrationInput({
            ...validBase,
            passwordConfirmation: "outra senha",
        }).success,
        false,
    );

    const spacedUnicodePassword = "  música sem cortes 🔊  ";
    const unicodeResult = validateRegistrationInput({
        ...validBase,
        password: spacedUnicodePassword,
        passwordConfirmation: spacedUnicodePassword,
    });
    assert.equal(unicodeResult.success, true);
    assert.equal(
        unicodeResult.success ? unicodeResult.data.password : null,
        spacedUnicodePassword,
    );
    assert.equal(
        validateRegistrationInput({ ...validBase, passwordHash: "proibido" })
            .success,
        false,
    );
    assert.equal(
        validateRegistrationInput({ ...validBase, name: "Nome\u0000inválido" })
            .success,
        false,
    );
    assert.equal(
        validateRegistrationInput({
            ...validBase,
            email: "pessoa\u0000@example.com",
        }).success,
        false,
    );
    assert.deepEqual(
        validateLoginCredentials({
            email: " LOGIN@Example.com ",
            password: spacedUnicodePassword,
        }),
        { email: "login@example.com", password: spacedUnicodePassword },
    );

    assert.equal(getSafeReturnPath("/"), "/");
    assert.equal(getSafeReturnPath("/login"), "/login");
    assert.equal(getSafeReturnPath("/carrinho"), "/carrinho");
    assert.equal(getSafeReturnPath("//example.com"), "/login");
    assert.equal(getSafeReturnPath("/carrinho?item=1"), "/login");
    assert.equal(
        getSafeRedirectUrl("/carrinho", appOrigin),
        `${appOrigin}/carrinho`,
    );
    assert.equal(isTrustedRequestOrigin(appOrigin, appOrigin), true);
    assert.equal(
        isTrustedRequestOrigin("https://example.com", appOrigin),
        false,
    );
    assert.equal(isTrustedRequestOrigin(null, appOrigin), false);

    const publicSession = toPublicSession(
        {
            expires: "2026-11-23T00:00:00.000Z",
            user: {
                email: "m4@example.test",
                name: "M4",
                password: "nao-deve-sair",
                passwordHash: "nao-deve-sair",
            },
        } as never,
        "90000000-0000-4000-8000-000000000004",
    );
    assert.equal(
        JSON.stringify(publicSession).includes("nao-deve-sair"),
        false,
    );
}

async function verifyPasswordHashing() {
    const { hashPassword, isSupportedPasswordHash, verifyPassword } =
        await import("../src/lib/password");
    const password = "  frase Unicode: música e café ☕  ";
    const firstHash = await hashPassword(password);
    const secondHash = await hashPassword(password);

    assert.notEqual(firstHash, secondHash);
    assert.equal(isSupportedPasswordHash(firstHash), true);
    assert.equal(await verifyPassword(password, firstHash), true);
    assert.equal(await verifyPassword(password.trim(), firstHash), false);
    assert.equal(await verifyPassword("senha incorreta", firstHash), false);
    assert.equal(await verifyPassword(password, "scrypt$invalido"), false);
}

async function verifyRateLimits() {
    const { AUTH_RATE_LIMITS, consumeAuthRateLimit } =
        await import("../src/lib/auth-rate-limit");
    assert.deepEqual(AUTH_RATE_LIMITS, {
        login: {
            aggregate: { maxAttempts: 100, windowMs: 600_000 },
            identifier: { maxAttempts: 5, windowMs: 900_000 },
        },
        register: {
            aggregate: { maxAttempts: 30, windowMs: 600_000 },
            identifier: { maxAttempts: 3, windowMs: 3_600_000 },
        },
    });
    const now = new Date();
    const policies = {
        aggregate: { maxAttempts: 100, windowMs: 1_000 },
        identifier: { maxAttempts: 2, windowMs: 1_000 },
    };
    const identifier = `${fixturePrefix}concurrent-limit@example.test`;
    trackRateLimit("login", identifier);
    const results = await Promise.all(
        Array.from({ length: 4 }, () =>
            consumeAuthRateLimit("login", identifier, { now, policies }),
        ),
    );

    assert.equal(
        results.filter((result) => result.allowed).length,
        2,
        "O limite concorrente deveria aceitar exatamente duas tentativas.",
    );
    assert.equal(
        results.filter((result) => !result.allowed).length,
        2,
        "O limite concorrente deveria recusar exatamente duas tentativas.",
    );

    const afterExpiration = await consumeAuthRateLimit("login", identifier, {
        now: new Date(now.getTime() + 1_001),
        policies,
    });
    assert.equal(afterExpiration.allowed, true);

    const aggregateNow = new Date(now.getTime() + 2_002);
    const aggregatePolicies = {
        aggregate: { maxAttempts: 2, windowMs: 1_000 },
        identifier: { maxAttempts: 100, windowMs: 1_000 },
    };
    const aggregateResults = [];

    for (let attempt = 0; attempt < 3; attempt += 1) {
        const aggregateIdentifier = `${fixturePrefix}aggregate-${attempt}@example.test`;
        trackRateLimit("register", aggregateIdentifier);
        aggregateResults.push(
            await consumeAuthRateLimit("register", aggregateIdentifier, {
                now: aggregateNow,
                policies: aggregatePolicies,
            }),
        );
    }

    assert.deepEqual(
        aggregateResults.map(({ allowed }) => allowed),
        [true, true, false],
    );
    trackRateLimit("login", `${fixturePrefix}aggregate-2@example.test`);
    const separateLoginCounter = await consumeAuthRateLimit(
        "login",
        `${fixturePrefix}aggregate-2@example.test`,
        { now: aggregateNow, policies },
    );
    assert.equal(separateLoginCounter.allowed, true);
}

async function verifyRegistrationAndOrigin(client: Client) {
    const invalidOrigin = await fetch(`${appOrigin}/api/auth/register`, {
        body: JSON.stringify({}),
        headers: {
            "Content-Type": "application/json",
            Origin: "https://example.com",
        },
        method: "POST",
    });
    assert.equal(invalidOrigin.status, 403);
    assert.match(invalidOrigin.headers.get("cache-control") ?? "", /no-store/);

    const oversizedBody = await fetch(`${appOrigin}/api/auth/register`, {
        body: JSON.stringify({ value: "x".repeat(8_192) }),
        headers: {
            "Content-Type": "application/json",
            Origin: appOrigin,
        },
        method: "POST",
    });
    assert.equal(oversizedBody.status, 413);

    const email = `${fixturePrefix}concurrent@example.test`;
    const body = {
        email: `  ${email.toUpperCase()}  `,
        name: "Cadastro Concorrente",
        password: fixturePassword,
        passwordConfirmation: fixturePassword,
    };
    const responses = await Promise.all([
        postRegistration(body),
        postRegistration(body),
    ]);
    assert.deepEqual(responses.map(({ status }) => status).sort(), [201, 409]);

    const users = await client.query<{
        accounts: string;
        emailVerified: Date | null;
        passwordHash: string | null;
    }>(
        `SELECT u."emailVerified", u."passwordHash",
            (SELECT COUNT(*) FROM "Account" a WHERE a."userId" = u."id") AS accounts
        FROM "User" u WHERE u."email" = $1`,
        [email],
    );
    assert.equal(users.rowCount, 1);
    assert.equal(users.rows[0].emailVerified, null);
    assert.equal(users.rows[0].accounts, "0");
    assert.match(users.rows[0].passwordHash ?? "", /^scrypt\$1\$/);

    const googleEmail = `${fixturePrefix}google@example.test`;
    const googleId = "90000000-0000-4000-8000-000000000041";
    await client.query(
        `INSERT INTO "User" ("id", "name", "email", "updatedAt")
        VALUES ($1::uuid, $2, $3, CURRENT_TIMESTAMP)`,
        [googleId, "Conta Google", googleEmail],
    );
    await client.query(
        `INSERT INTO "Account" (
            "id", "userId", "type", "provider", "providerAccountId", "updatedAt"
        ) VALUES ($1::uuid, $2::uuid, 'oauth', 'google', $3, CURRENT_TIMESTAMP)`,
        [
            "90000000-0000-4000-8000-000000000042",
            googleId,
            `${fixturePrefix}google-provider-id`,
        ],
    );
    const googleConflict = await postRegistration({
        ...body,
        email: googleEmail,
    });
    assert.equal(googleConflict.status, 409);
    const googleAfter = await client.query<{ passwordHash: string | null }>(
        'SELECT "passwordHash" FROM "User" WHERE "id" = $1::uuid',
        [googleId],
    );
    assert.equal(googleAfter.rows[0].passwordHash, null);

    const limitedEmail = `${fixturePrefix}register-limited@example.test`;
    const limitedResponses = [];

    for (let attempt = 0; attempt < 4; attempt += 1) {
        limitedResponses.push(
            await postRegistration({
                ...body,
                email: limitedEmail,
                password: "curta",
                passwordConfirmation: "curta",
            }),
        );
    }

    assert.deepEqual(
        limitedResponses.map(({ status }) => status),
        [400, 400, 400, 429],
    );
    assert.match(limitedResponses[3].retryAfter ?? "", /^\d+$/);
}

async function verifyNextAuthCredentials(client: Client) {
    const email = `${fixturePrefix}concurrent@example.test`;
    const jar = new CookieJar();
    const validLogin = await credentialSignIn(jar, email, fixturePassword);
    assert.equal(validLogin.error, null);
    assert.equal(validLogin.url, `${appOrigin}/`);

    const sessionResponse = await fetch(`${appOrigin}/api/auth/session`, {
        headers: { Cookie: jar.header() },
    });
    jar.add(sessionResponse);
    const session = (await sessionResponse.json()) as JsonRecord;
    const serializedSession = JSON.stringify(session);
    assert.equal(sessionResponse.status, 200);
    assert.equal((session.user as JsonRecord).email, email);
    assert.equal(serializedSession.includes("password"), false);
    assert.equal(serializedSession.includes("Hash"), false);

    const secondEmail = `${fixturePrefix}second@example.test`;
    const { hashPassword } = await import("../src/lib/password");
    const secondHash = await hashPassword("segunda senha válida");
    await client.query(
        `INSERT INTO "User" ("id", "name", "email", "passwordHash", "updatedAt")
        VALUES ($1::uuid, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
            "90000000-0000-4000-8000-000000000043",
            "Segunda Conta",
            secondEmail,
            secondHash,
        ],
    );
    const replacement = await credentialSignIn(
        jar,
        secondEmail,
        "segunda senha válida",
    );
    assert.equal(replacement.error, "AccessDenied");
    const preservedSessionResponse = await fetch(
        `${appOrigin}/api/auth/session`,
        { headers: { Cookie: jar.header() } },
    );
    const preservedSession =
        (await preservedSessionResponse.json()) as JsonRecord;
    assert.equal((preservedSession.user as JsonRecord).email, email);

    const googleOnly = new CookieJar();
    const googleResult = await credentialSignIn(
        googleOnly,
        `${fixturePrefix}google@example.test`,
        fixturePassword,
    );
    const unknown = new CookieJar();
    const unknownResult = await credentialSignIn(
        unknown,
        `${fixturePrefix}unknown@example.test`,
        fixturePassword,
    );
    assert.equal(googleResult.error, "CredentialsSignin");
    assert.equal(unknownResult.error, "CredentialsSignin");
}

async function verifyDirectCredentialRateLimit(client: Client) {
    const { hashPassword } = await import("../src/lib/password");
    const jar = new CookieJar();
    const email = `${fixturePrefix}login-limited@example.test`;
    const errors = [];
    const passwordHash = await hashPassword(fixturePassword);
    await client.query(
        `INSERT INTO "User" ("id", "name", "email", "passwordHash", "updatedAt")
        VALUES ($1::uuid, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [
            "90000000-0000-4000-8000-000000000044",
            "Conta com limite",
            email,
            passwordHash,
        ],
    );

    for (let attempt = 0; attempt < 5; attempt += 1) {
        const result = await credentialSignIn(
            jar,
            email,
            "senha incorreta válida",
        );
        errors.push(result.error);
    }

    assert.deepEqual(errors, Array(5).fill("CredentialsSignin"));

    const blockedWithCorrectPassword = await credentialSignIn(
        jar,
        email,
        fixturePassword,
    );
    assert.equal(blockedWithCorrectPassword.status, 401);
    assert.equal(blockedWithCorrectPassword.error, "TooManyAttempts");
    assert.deepEqual(await getSession(jar), {});

    const repeatedWhileBlocked = await credentialSignIn(
        jar,
        email,
        fixturePassword,
    );
    assert.equal(repeatedWhileBlocked.error, "TooManyAttempts");

    const otherTabJar = new CookieJar();
    const blockedInOtherTab = await credentialSignIn(
        otherTabJar,
        email,
        fixturePassword,
    );
    assert.equal(blockedInOtherTab.error, "TooManyAttempts");
    assert.deepEqual(await getSession(otherTabJar), {});

    const identifierKey = getRateLimitKeyHash("login", email);
    await client.query(
        `UPDATE "AuthRateLimit"
        SET "expiresAt" = CURRENT_TIMESTAMP - INTERVAL '1 second'
        WHERE "action" = 'login:identifier' AND "keyHash" = $1`,
        [identifierKey],
    );

    const resumed = await credentialSignIn(
        otherTabJar,
        email,
        fixturePassword,
        "/carrinho",
    );
    assert.equal(resumed.error, null);
    assert.equal(resumed.url, `${appOrigin}/carrinho`);
    const resumedSession = await getSession(otherTabJar);
    assert.equal((resumedSession.user as JsonRecord).email, email);
}

async function postRegistration(body: JsonRecord) {
    const email = body.email;

    if (typeof email === "string") {
        trackRateLimit("register", email.trim().toLowerCase());
    }

    const response = await fetch(`${appOrigin}/api/auth/register`, {
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
            Origin: appOrigin,
        },
        method: "POST",
    });

    return {
        body: (await response.json()) as JsonRecord,
        retryAfter: response.headers.get("retry-after"),
        status: response.status,
    };
}

async function credentialSignIn(
    jar: CookieJar,
    email: string,
    password: string,
    callbackPath = "/",
) {
    trackRateLimit("login", email.trim().toLowerCase());
    const csrfResponse = await fetch(`${appOrigin}/api/auth/csrf`, {
        headers: { Cookie: jar.header() },
    });
    jar.add(csrfResponse);
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };
    const response = await fetch(`${appOrigin}/api/auth/callback/credentials`, {
        body: new URLSearchParams({
            callbackUrl: `${appOrigin}${callbackPath}`,
            csrfToken,
            email,
            json: "true",
            password,
        }),
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Cookie: jar.header(),
        },
        method: "POST",
        redirect: "manual",
    });
    jar.add(response);
    const body = (await response.json()) as { url: string };
    const url = new URL(body.url);

    return {
        error: url.searchParams.get("error"),
        status: response.status,
        url: body.url,
    };
}

async function getSession(jar: CookieJar) {
    const response = await fetch(`${appOrigin}/api/auth/session`, {
        headers: { Cookie: jar.header() },
    });
    jar.add(response);

    return (await response.json()) as JsonRecord;
}

async function startApplication(testDatabaseUrl: string) {
    await rm(verificationDistDir, { force: true, recursive: true });
    const server = spawn(
        "npm",
        ["run", "dev", "--", "--hostname", "127.0.0.1", "--port", "3214"],
        {
            cwd: process.cwd(),
            env: {
                ...process.env,
                DATABASE_URL: testDatabaseUrl,
                GOOGLE_CLIENT_ID: "credentials-verify-google-client",
                GOOGLE_CLIENT_SECRET: "credentials-verify-google-secret",
                NEXTAUTH_SECRET: testSecret,
                NEXTAUTH_URL: appOrigin,
                SOBE_O_SOM_NEXT_DIST_DIR: verificationDistDir,
            },
            detached: true,
            stdio: ["ignore", "pipe", "pipe"],
        },
    );

    for (const stream of [server.stdout, server.stderr]) {
        stream?.on("data", (chunk: Buffer) => {
            serverOutput = `${serverOutput}${chunk.toString("utf8")}`.slice(
                -8_000,
            );
        });
    }

    return server;
}

async function waitForApplication(server: ChildProcess) {
    for (let attempt = 0; attempt < 60; attempt += 1) {
        if (server.exitCode !== null) {
            throw new Error(
                `A aplicacao encerrou antes da verificacao HTTP.\n${serverOutput}`,
            );
        }

        try {
            const response = await fetch(`${appOrigin}/api/auth/providers`);

            if (response.ok) {
                return;
            }
        } catch {
            // The development server is still starting.
        }

        await delay(500);
    }

    throw new Error("A aplicacao nao iniciou dentro do tempo esperado.");
}

async function stopApplication(server: ChildProcess | null) {
    if (!server || server.exitCode !== null) {
        return;
    }

    if (server.pid) {
        process.kill(-server.pid, "SIGTERM");
    }

    await Promise.race([
        new Promise<void>((resolve) => server.once("exit", () => resolve())),
        delay(5_000).then(() => undefined),
    ]);

    if (server.exitCode === null) {
        if (server.pid) {
            process.kill(-server.pid, "SIGKILL");
        }
    }
}

function registerControlledRateLimitKeys() {
    for (const operation of ["login", "register"] as const) {
        trackRateLimit(operation, null);
    }

    for (const identifier of [
        `${fixturePrefix}aggregate-2@example.test`,
        `${fixturePrefix}concurrent-limit@example.test`,
        `${fixturePrefix}concurrent@example.test`,
        `${fixturePrefix}google@example.test`,
        `${fixturePrefix}login-limited@example.test`,
        `${fixturePrefix}second@example.test`,
        `${fixturePrefix}unknown@example.test`,
    ]) {
        trackRateLimit("login", identifier);
    }

    for (const identifier of [
        `${fixturePrefix}aggregate-0@example.test`,
        `${fixturePrefix}aggregate-1@example.test`,
        `${fixturePrefix}aggregate-2@example.test`,
        `${fixturePrefix}concurrent@example.test`,
        `${fixturePrefix}google@example.test`,
        `${fixturePrefix}register-limited@example.test`,
    ]) {
        trackRateLimit("register", identifier);
    }
}

function trackRateLimit(
    operation: "login" | "register",
    identifier: string | null,
) {
    controlledRateLimitKeys.add(getRateLimitKeyHash(operation, "aggregate"));

    if (identifier !== null) {
        controlledRateLimitKeys.add(getRateLimitKeyHash(operation, identifier));
    }
}

function getRateLimitKeyHash(
    operation: "login" | "register",
    identifier: string,
) {
    return createHmac("sha256", testSecret)
        .update(`${operation}\0${identifier}`)
        .digest("hex");
}

async function cleanControlledRateLimits(client: Client) {
    await client.query(
        `DELETE FROM "AuthRateLimit"
        WHERE TRIM("keyHash") = ANY($1::text[])`,
        [[...controlledRateLimitKeys]],
    );
}

async function cleanControlledData(client: Client) {
    await client.query(`DELETE FROM "User" WHERE "email" LIKE $1 ESCAPE '\\'`, [
        `${fixturePrefix.replaceAll("_", "\\_")}%@example.test`,
    ]);
}

await main();
