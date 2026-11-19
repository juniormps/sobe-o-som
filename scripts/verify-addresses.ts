import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { Client } from "pg";

import { isTrustedRequestOrigin } from "../src/lib/auth-http";
import { shouldAcceptPrivateCheckoutResponse } from "../src/lib/checkout-session";
import {
    BRAZILIAN_STATES,
    normalizePostalCode,
    validateAddressInput,
} from "../src/lib/address-rules";
import {
    getIsolatedTestDatabaseUrl,
    runTestDatabaseCommand,
    validateIsolatedTestDatabase,
} from "./test-database";

const fixturePrefix = "m5-address-verify-";

async function main() {
    verifyAddressRules();
    verifyRequestAndSessionRules();

    const testDatabaseUrl = getIsolatedTestDatabaseUrl();
    process.env.DATABASE_URL = testDatabaseUrl;
    const client = new Client({
        connectionString: testDatabaseUrl,
        connectionTimeoutMillis: 5_000,
    });
    await client.connect();
    await validateIsolatedTestDatabase(client);
    runTestDatabaseCommand("prisma:migrate:deploy", testDatabaseUrl);

    const { getPrisma } = await import("../src/lib/prisma");
    const { confirmOwnAddress, createOwnAddress, setOwnDefaultAddress } =
        await import("../src/lib/address-service");
    const { listAddressesByUserId } =
        await import("../src/lib/address-repository");
    const prisma = getPrisma();
    const userIds: string[] = [];

    try {
        await cleanControlledData(client);
        const userA = await createFixtureUser(client, "a");
        const userB = await createFixtureUser(client, "b");
        const concurrentUser = await createFixtureUser(client, "concurrent");
        userIds.push(userA, userB, concurrentUser);

        const firstA = await createOwnAddress(
            prisma,
            { id: userA },
            addressInput("A", "01001-000"),
        );
        assert.equal(firstA.status, "created");
        assert.equal(firstA.address.isDefault, true);

        const secondA = await createOwnAddress(
            prisma,
            { id: userA },
            addressInput("B", "20040-020"),
        );
        assert.equal(secondA.status, "created");
        assert.equal(secondA.address.isDefault, false);

        let addressesA = await listAddressesByUserId(prisma, userA);
        assert.equal(
            addressesA.filter((address) => address.isDefault).length,
            1,
        );
        assert.equal(
            addressesA.find((address) => address.isDefault)?.id,
            firstA.address.id,
        );

        const firstB = await createOwnAddress(
            prisma,
            { id: userB },
            addressInput("Conta B", "30130-010"),
        );
        assert.equal(firstB.status, "created");

        const crossConfirmation = await confirmOwnAddress(
            prisma,
            { id: userA },
            firstB.address.id,
        );
        const missingConfirmation = await confirmOwnAddress(
            prisma,
            { id: userA },
            randomUUID(),
        );
        assert.deepEqual(crossConfirmation, missingConfirmation);
        assert.equal(crossConfirmation.status, "not_found");
        assert.equal(
            (
                await setOwnDefaultAddress(
                    prisma,
                    { id: userA },
                    firstB.address.id,
                )
            ).status,
            "not_found",
        );
        assert.equal(
            (await confirmOwnAddress(prisma, null, firstA.address.id)).status,
            "unauthenticated",
        );

        const confirmedA = await confirmOwnAddress(
            prisma,
            { id: userA },
            secondA.address.id,
        );
        assert.equal(confirmedA.status, "confirmed");
        assert.equal(confirmedA.address.id, secondA.address.id);

        const changedDefault = await setOwnDefaultAddress(
            prisma,
            { id: userA },
            secondA.address.id,
        );
        assert.equal(changedDefault.status, "updated");
        addressesA = await listAddressesByUserId(prisma, userA);
        assert.equal(
            addressesA.filter((address) => address.isDefault).length,
            1,
        );
        assert.equal(
            addressesA.find((address) => address.isDefault)?.id,
            secondA.address.id,
        );

        const concurrentCreates = await Promise.all([
            createOwnAddress(
                prisma,
                { id: concurrentUser },
                addressInput("Concorrente 1", "80010-000"),
            ),
            createOwnAddress(
                prisma,
                { id: concurrentUser },
                addressInput("Concorrente 2", "70040-010"),
            ),
        ]);
        assert(
            concurrentCreates.every((result) => result.status === "created"),
        );
        let concurrentAddresses = await listAddressesByUserId(
            prisma,
            concurrentUser,
        );
        assert.equal(concurrentAddresses.length, 2);
        assert.equal(
            concurrentAddresses.filter((address) => address.isDefault).length,
            1,
        );

        await Promise.all(
            concurrentAddresses.map((address) =>
                setOwnDefaultAddress(
                    prisma,
                    { id: concurrentUser },
                    address.id,
                ),
            ),
        );
        concurrentAddresses = await listAddressesByUserId(
            prisma,
            concurrentUser,
        );
        assert.equal(
            concurrentAddresses.filter((address) => address.isDefault).length,
            1,
        );

        const databaseInvariant = await client.query<{
            defaultCount: string;
            totalCount: string;
        }>(
            `SELECT count(*)::text AS "totalCount",
                count(*) FILTER (WHERE "isDefault")::text AS "defaultCount"
            FROM "Address" WHERE "userId" = $1`,
            [concurrentUser],
        );
        assert.deepEqual(databaseInvariant.rows[0], {
            defaultCount: "1",
            totalCount: "2",
        });
    } finally {
        if (userIds.length > 0) {
            await client.query(
                `DELETE FROM "User" WHERE "id" = ANY($1::uuid[])
                    AND "email" LIKE $2`,
                [userIds, `${fixturePrefix}%`],
            );
        }
        await client.end();
    }

    console.log(
        "Endereços verificados: validação, autorização, principal, confirmação e concorrência no PostgreSQL isolado.",
    );
}

function verifyAddressRules() {
    assert.equal(normalizePostalCode("01001-000"), "01001000");
    assert.equal(normalizePostalCode("01001000"), "01001000");
    assert.equal(normalizePostalCode("A01001000"), null);
    assert.equal(normalizePostalCode("01001 000"), null);
    assert.equal(BRAZILIAN_STATES.length, 27);

    const valid = validateAddressInput(addressInput("Válido", "01001-000"));
    assert.equal(valid.status, "valid");
    assert.equal(valid.status === "valid" && valid.data.postalCode, "01001000");
    assert.equal(valid.status === "valid" && valid.data.state, "SP");

    assert.equal(
        validateAddressInput({
            ...addressInput("Extra", "01001000"),
            userId: randomUUID(),
        }).status,
        "invalid",
    );
    assert.equal(
        validateAddressInput({
            ...addressInput("Controle\u0000", "01001000"),
        }).status,
        "invalid",
    );
    assert.equal(
        validateAddressInput({
            ...addressInput("UF", "01001000"),
            state: "XX",
        }).status,
        "invalid",
    );
    assert.equal(
        validateAddressInput({
            ...addressInput("Sem número", "01001000"),
            hasNoNumber: true,
            number: "12A",
        }).status,
        "invalid",
    );
    const noNumber = validateAddressInput({
        ...addressInput("Sem número", "01001000"),
        hasNoNumber: true,
        number: "",
    });
    assert.equal(noNumber.status, "valid");
    assert.equal(noNumber.status === "valid" && noNumber.data.number, null);
    assert.equal(
        validateAddressInput({
            ...addressInput("Número ausente", "01001000"),
            number: "",
        }).status,
        "invalid",
    );
}

function verifyRequestAndSessionRules() {
    assert.equal(
        isTrustedRequestOrigin(
            "http://localhost:3000",
            "http://localhost:3000",
        ),
        true,
    );
    assert.equal(
        isTrustedRequestOrigin(
            "https://externo.example",
            "http://localhost:3000",
        ),
        false,
    );
    assert.equal(
        shouldAcceptPrivateCheckoutResponse(2, 2, "user-a", "user-a"),
        true,
    );
    assert.equal(
        shouldAcceptPrivateCheckoutResponse(1, 2, "user-a", "user-a"),
        false,
    );
    assert.equal(
        shouldAcceptPrivateCheckoutResponse(2, 2, "user-a", "user-b"),
        false,
    );
    assert.equal(
        shouldAcceptPrivateCheckoutResponse(2, 2, "user-a", null),
        false,
    );
}

function addressInput(label: string, postalCode: string) {
    return {
        city: "São Paulo",
        complement: "Apto 12",
        district: "Sé",
        hasNoNumber: false,
        number: "12A",
        postalCode,
        recipient: `Pessoa ${label}`,
        state: "sp",
        street: `Rua ${label}`,
    };
}

async function createFixtureUser(client: Client, suffix: string) {
    const id = randomUUID();

    await client.query(
        `INSERT INTO "User" (
            "id", "name", "email", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, `Fixture ${suffix}`, `${fixturePrefix}${suffix}@example.test`],
    );

    return id;
}

async function cleanControlledData(client: Client) {
    await client.query(`DELETE FROM "User" WHERE "email" LIKE $1`, [
        `${fixturePrefix}%`,
    ]);
}

await main();
