import "dotenv/config";

import { spawnSync } from "node:child_process";

import { Client, DatabaseError } from "pg";

import { categories, products } from "../prisma/seed";

const fixtureCategoryId = "90000000-0000-4000-8000-000000000001";
const fixtureProductId = "90000000-0000-4000-8000-000000000002";

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}

function getDatabaseDestination(value: string, name: string) {
    let url: URL;

    try {
        url = new URL(value);
    } catch {
        throw new Error(`${name} deve conter uma URL PostgreSQL valida.`);
    }

    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
        throw new Error(`${name} deve usar o protocolo PostgreSQL.`);
    }

    const connectionParameters = [...url.searchParams.keys()];
    const schemas = url.searchParams.getAll("schema");

    if (
        url.hash ||
        connectionParameters.some((parameter) => parameter !== "schema") ||
        schemas.length > 1 ||
        (schemas.length === 1 && schemas[0] !== "public")
    ) {
        throw new Error(
            `${name} aceita somente o parametro schema=public e nenhum fragmento.`,
        );
    }

    const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));
    const normalizedHostname = url.hostname
        .toLowerCase()
        .replace(/^\[(.*)\]$/, "$1");
    const localHostnames = ["127.0.0.1", "localhost", "::1"];

    if (!normalizedHostname || !database || database.includes("/")) {
        throw new Error(`${name} deve identificar host e banco PostgreSQL.`);
    }

    return {
        database,
        destination: `${localHostnames.includes(normalizedHostname) ? "127.0.0.1" : normalizedHostname}:${url.port || "5432"}/${database}`,
        isLocal: localHostnames.includes(normalizedHostname),
    };
}

function getTestDatabaseUrl() {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
        throw new Error(
            "TEST_DATABASE_URL deve ser definida para verificar o estoque.",
        );
    }

    const testDestination = getDatabaseDestination(
        testDatabaseUrl,
        "TEST_DATABASE_URL",
    );

    assert(
        testDestination.isLocal &&
            testDestination.database === "sobe_o_som_test",
        "TEST_DATABASE_URL deve apontar somente para o banco local sobe_o_som_test.",
    );

    for (const name of ["DATABASE_URL", "SHADOW_DATABASE_URL"] as const) {
        const value = process.env[name];

        if (!value) {
            continue;
        }

        const destination = getDatabaseDestination(value, name);

        assert(
            destination.destination !== testDestination.destination,
            `TEST_DATABASE_URL deve ser diferente de ${name}.`,
        );
    }

    return testDatabaseUrl;
}

function runDatabaseCommand(script: string, testDatabaseUrl: string) {
    const environment: NodeJS.ProcessEnv = {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
    };

    delete environment.SHADOW_DATABASE_URL;

    const result = spawnSync("npm", ["run", script], {
        cwd: process.cwd(),
        env: environment,
        stdio: "inherit",
    });

    assert(
        result.status === 0,
        `O comando npm run ${script} falhou no banco de testes.`,
    );
}

async function cleanControlledData(client: Client) {
    await client.query('DELETE FROM "Product" WHERE "id" = $1::uuid', [
        fixtureProductId,
    ]);
    await client.query('DELETE FROM "Category" WHERE "id" = $1::uuid', [
        fixtureCategoryId,
    ]);
    await client.query('DELETE FROM "Product" WHERE "id" = ANY($1::uuid[])', [
        products.map(({ id }) => id),
    ]);
    await client.query('DELETE FROM "Category" WHERE "id" = ANY($1::uuid[])', [
        categories.map(({ id }) => id),
    ]);
}

async function getAuthenticationCounts(client: Client) {
    const result = await client.query<{
        accounts: string;
        users: string;
    }>(
        'SELECT (SELECT COUNT(*) FROM "User") AS users, (SELECT COUNT(*) FROM "Account") AS accounts',
    );

    return result.rows[0];
}

async function validateTestDatabase(client: Client) {
    const databaseResult = await client.query<{
        database: string;
        owner: string;
        serverAddress: string;
        userName: string;
    }>(
        `SELECT current_database() AS database, current_user AS "userName",
            pg_get_userbyid(datdba) AS owner,
            COALESCE(host(inet_server_addr()), '') AS "serverAddress"
        FROM pg_database WHERE datname = current_database()`,
    );
    const database = databaseResult.rows[0];

    assert(
        database.database === "sobe_o_som_test" &&
            database.owner === database.userName &&
            ["127.0.0.1", "::1"].includes(database.serverAddress),
        "O banco de testes deve ser local, existir e pertencer ao usuario da conexao.",
    );
}

async function getSeedState(client: Client) {
    const result = await client.query<{
        createdAt: Date;
        id: string;
        slug: string;
        stock: number;
    }>(
        'SELECT "id", "slug", "stock", "createdAt" FROM "Product" WHERE "id" = ANY($1::uuid[]) ORDER BY "id"',
        [products.map(({ id }) => id)],
    );

    return result.rows;
}

function assertInitialSeedState(
    rows: Awaited<ReturnType<typeof getSeedState>>,
) {
    assert(
        rows.length === products.length,
        "O seed nao criou todos os produtos demonstrativos.",
    );

    const rowsById = new Map(rows.map((row) => [row.id, row]));

    for (const product of products) {
        const row = rowsById.get(product.id);

        assert(row, `Produto demonstrativo ausente: ${product.id}.`);
        assert(
            row.stock === product.stock,
            `Estoque inicial divergente para ${product.id}.`,
        );
        assert(
            row.slug === product.slug,
            `Identidade divergente para ${product.id}.`,
        );
    }
}

function assertSameSeedState(
    before: Awaited<ReturnType<typeof getSeedState>>,
    after: Awaited<ReturnType<typeof getSeedState>>,
) {
    assert(
        after.length === before.length,
        "O seed alterou o total de produtos.",
    );

    for (let index = 0; index < before.length; index += 1) {
        const previous = before[index];
        const current = after[index];

        assert(current.id === previous.id, "O seed alterou IDs de produtos.");
        assert(
            current.slug === previous.slug,
            `O seed alterou a identidade de ${previous.id}.`,
        );
        assert(
            current.createdAt.getTime() === previous.createdAt.getTime(),
            `O seed recriou o produto ${previous.id}.`,
        );
        assert(
            current.stock === previous.stock,
            `O seed redefiniu o estoque de ${previous.id}.`,
        );
    }
}

async function verifyDatabaseConstraint(client: Client) {
    await client.query("BEGIN");

    try {
        await client.query(
            'INSERT INTO "Category" ("id", "name", "slug", "updatedAt") VALUES ($1::uuid, $2, $3, CURRENT_TIMESTAMP)',
            [
                fixtureCategoryId,
                "Categoria de teste de estoque",
                "stock-verify",
            ],
        );
        await client.query(
            `INSERT INTO "Product" (
                "id", "categoryId", "name", "slug", "artist", "releaseYear",
                "description", "coverPath", "priceInCents", "updatedAt"
            ) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
            [
                fixtureProductId,
                fixtureCategoryId,
                "Produto de teste de estoque",
                "produto-stock-verify",
                "Artista de teste",
                2026,
                "Fixture controlada para verificar o estoque no PostgreSQL.",
                "/images/album-placeholder.svg",
                100,
            ],
        );

        const defaultResult = await client.query<{ stock: number }>(
            'SELECT "stock" FROM "Product" WHERE "id" = $1::uuid',
            [fixtureProductId],
        );

        assert(
            defaultResult.rows[0]?.stock === 0,
            "Produto criado sem stock nao recebeu zero.",
        );

        await client.query(
            'UPDATE "Product" SET "stock" = 0 WHERE "id" = $1::uuid',
            [fixtureProductId],
        );
        await client.query(
            'UPDATE "Product" SET "stock" = 7 WHERE "id" = $1::uuid',
            [fixtureProductId],
        );
        await client.query("SAVEPOINT negative_stock");

        let negativeStockRejected = false;

        try {
            await client.query(
                'UPDATE "Product" SET "stock" = -1 WHERE "id" = $1::uuid',
                [fixtureProductId],
            );
        } catch (error) {
            negativeStockRejected =
                error instanceof DatabaseError &&
                error.code === "23514" &&
                error.constraint === "Product_stock_check";
            await client.query("ROLLBACK TO SAVEPOINT negative_stock");
        }

        assert(
            negativeStockRejected,
            "A constraint Product_stock_check nao rejeitou estoque negativo.",
        );
    } finally {
        await client.query("ROLLBACK");
    }
}

async function main() {
    const testDatabaseUrl = getTestDatabaseUrl();
    const client = new Client({
        connectionString: testDatabaseUrl,
        connectionTimeoutMillis: 5_000,
    });

    await client.connect();

    try {
        await validateTestDatabase(client);
    } catch (error) {
        await client.end();
        throw error;
    }

    const errors: unknown[] = [];

    try {
        runDatabaseCommand("prisma:migrate:deploy", testDatabaseUrl);

        const authenticationCountsBefore =
            await getAuthenticationCounts(client);

        await cleanControlledData(client);
        await verifyDatabaseConstraint(client);

        runDatabaseCommand("prisma:seed", testDatabaseUrl);
        const initialState = await getSeedState(client);
        assertInitialSeedState(initialState);

        runDatabaseCommand("prisma:seed", testDatabaseUrl);
        const repeatedState = await getSeedState(client);
        assertSameSeedState(initialState, repeatedState);

        const reducedProduct = products.find(({ stock }) => stock > 1);
        const zeroedProduct = products.find(({ stock }) => stock === 1);

        assert(
            reducedProduct && zeroedProduct,
            "O seed deve conter produtos disponiveis para os cenarios de preservacao.",
        );

        await client.query(
            'UPDATE "Product" SET "stock" = "stock" - 1 WHERE "id" = $1::uuid',
            [reducedProduct.id],
        );
        await client.query(
            'UPDATE "Product" SET "stock" = 0 WHERE "id" = $1::uuid',
            [zeroedProduct.id],
        );

        runDatabaseCommand("prisma:seed", testDatabaseUrl);

        const preservedState = await getSeedState(client);
        const preservedById = new Map(
            preservedState.map((row) => [row.id, row]),
        );

        assert(
            preservedById.get(reducedProduct.id)?.stock ===
                reducedProduct.stock - 1,
            "O seed nao preservou o saldo reduzido.",
        );
        assert(
            preservedById.get(zeroedProduct.id)?.stock === 0,
            "O seed nao preservou o saldo zerado.",
        );

        const authenticationCountsAfter = await getAuthenticationCounts(client);

        assert(
            authenticationCountsAfter.users ===
                authenticationCountsBefore.users &&
                authenticationCountsAfter.accounts ===
                    authenticationCountsBefore.accounts,
            "A verificacao alterou usuarios ou contas.",
        );
    } catch (error) {
        errors.push(error);
    }

    try {
        await cleanControlledData(client);
    } catch (error) {
        errors.push(error);
    }

    try {
        await client.end();
    } catch (error) {
        errors.push(error);
    }

    if (errors.length === 1) {
        throw errors[0];
    }

    if (errors.length > 1) {
        throw new AggregateError(
            errors,
            "A verificacao de estoque falhou em mais de uma etapa.",
        );
    }

    console.log(
        "Estoque verificado no PostgreSQL: default, CHECK, seed inicial e preservacao de saldos e identidades.",
    );
}

await main();
