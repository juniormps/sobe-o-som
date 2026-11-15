import "dotenv/config";

import { spawnSync } from "node:child_process";

import { PrismaPg } from "@prisma/adapter-pg";
import { Client } from "pg";

import { categoryIds } from "../prisma/seed";
import { PrismaClient } from "../src/generated/prisma/client";
import {
    queryCatalog,
    queryProductBySlug,
} from "../src/lib/catalog-repository";

const inactiveProductId = "91000000-0000-4000-8000-000000000001";
const inactiveProductSlug = "produto-inativo-catalog-verify";

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
            "TEST_DATABASE_URL deve ser definida para verificar o catalogo.",
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

async function validateTestDatabase(testDatabaseUrl: string) {
    const client = new Client({
        connectionString: testDatabaseUrl,
        connectionTimeoutMillis: 5_000,
    });

    await client.connect();

    try {
        const result = await client.query<{
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
        const database = result.rows[0];

        assert(
            database.database === "sobe_o_som_test" &&
                database.owner === database.userName &&
                ["127.0.0.1", "::1"].includes(database.serverAddress),
            "O banco de testes deve ser local, existir e pertencer ao usuario da conexao.",
        );
    } finally {
        await client.end();
    }
}

async function createInactiveFixture(prisma: PrismaClient) {
    await prisma.product.upsert({
        where: { id: inactiveProductId },
        create: {
            artist: "Artista Invisível",
            categoryId: categoryIds.rock,
            coverPath: "/images/album-placeholder.svg",
            description: "Fixture inativa da verificação de catálogo.",
            id: inactiveProductId,
            isActive: false,
            name: "Produto Inativo Catalog Verify",
            priceInCents: 5000,
            referencePriceInCents: 7000,
            releaseYear: 2026,
            slug: inactiveProductSlug,
            stock: 3,
        },
        update: {
            isActive: false,
        },
    });
}

async function verifySearch(prisma: PrismaClient) {
    const byTitle = await queryCatalog(prisma, { busca: "sol de janeiro" });
    const byArtist = await queryCatalog(prisma, { busca: "CLARA VALE" });
    const percentLiteral = await queryCatalog(prisma, { busca: "%" });
    const underscoreLiteral = await queryCatalog(prisma, { busca: "_" });
    const controlCharacter = await queryCatalog(prisma, {
        busca: "sol\u0000de janeiro",
    });

    assert(
        byTitle.total === 1 && byTitle.products[0]?.slug === "sol-de-janeiro",
        "A busca por titulo nao retornou o disco esperado.",
    );
    assert(
        byArtist.total === 1 && byArtist.products[0]?.slug === "sol-de-janeiro",
        "A busca por artista nao foi aplicada sem diferenciar maiusculas.",
    );
    assert(
        percentLiteral.total === 0 && underscoreLiteral.total === 0,
        "Caracteres especiais da busca foram tratados como curingas.",
    );
    assert(
        controlCharacter.shouldRedirect &&
            controlCharacter.products[0]?.slug === "sol-de-janeiro",
        "Caracteres de controle da busca nao foram normalizados com seguranca.",
    );
}

async function verifyCombinedFilters(prisma: PrismaClient) {
    const result = await queryCatalog(prisma, {
        busca: "sol",
        genero: "mpb-e-samba",
        sale: "true",
    });

    assert(
        result.total === 1 && result.products[0]?.slug === "sol-de-janeiro",
        "Busca, genero e Sale nao foram combinados corretamente.",
    );
    assert(
        result.products[0]?.stock === 0,
        "A selecao Sale excluiu o produto esgotado.",
    );
}

async function verifyPagination(prisma: PrismaClient) {
    const firstPage = await queryCatalog(prisma, {});
    const secondPage = await queryCatalog(prisma, { pagina: "2" });
    const expected = await prisma.product.findMany({
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: { id: true },
        where: { isActive: true },
    });
    const receivedIds = [...firstPage.products, ...secondPage.products].map(
        ({ id }) => id,
    );

    assert(
        firstPage.products.length === 12 && secondPage.products.length === 12,
        "A paginacao nao retornou 12 produtos por pagina.",
    );
    assert(
        receivedIds.join(",") === expected.map(({ id }) => id).join(","),
        "A ordenacao por nome e ID nao permaneceu estavel entre paginas.",
    );
}

async function verifyNormalizationAndEmptyState(prisma: PrismaClient) {
    const repeated = await queryCatalog(prisma, {
        busca: ["sol", "mar"],
        genero: ["rock", "pop"],
        pagina: ["1", "2"],
        sale: ["true", "false"],
    });
    const invalid = await queryCatalog(prisma, {
        genero: "genero-inexistente",
        pagina: "-2",
        sale: "yes",
    });
    const excessivePage = await queryCatalog(prisma, { pagina: "999999" });
    const empty = await queryCatalog(prisma, {
        busca: "album que certamente nao existe",
    });
    const normalizedUrl = await queryCatalog(prisma, {
        busca: "  sol   de janeiro  ",
        pagina: "1",
        parametroDesconhecido: "valor",
    });
    const emptySearch = await queryCatalog(prisma, { busca: "" });

    assert(
        repeated.shouldRedirect && repeated.canonicalHref === "/",
        "Parametros repetidos nao foram normalizados.",
    );
    assert(
        invalid.shouldRedirect &&
            invalid.filters.page === 1 &&
            invalid.filters.genre === null &&
            !invalid.filters.sale,
        "Parametros invalidos nao foram removidos com pagina reiniciada.",
    );
    assert(
        excessivePage.shouldRedirect &&
            excessivePage.filters.page === excessivePage.pageCount,
        "Pagina fora do intervalo nao foi limitada antes do offset.",
    );
    assert(
        empty.total === 0 && empty.products.length === 0,
        "A consulta sem resultado nao retornou o estado vazio.",
    );
    assert(
        normalizedUrl.shouldRedirect &&
            normalizedUrl.canonicalHref === "/?busca=sol+de+janeiro",
        "A URL nao foi canonicalizada apos normalizacao da entrada.",
    );
    assert(
        emptySearch.shouldRedirect && emptySearch.canonicalHref === "/",
        "A busca vazia nao foi removida da URL canonica.",
    );
}

async function verifyActivityAndAvailability(prisma: PrismaClient) {
    const catalog = await queryCatalog(prisma, {});
    const soldOutResult = await queryCatalog(prisma, {
        busca: "sol-de-janeiro".replaceAll("-", " "),
    });
    const soldOut = soldOutResult.products[0];
    const soldOutDetail = await queryProductBySlug(prisma, "sol-de-janeiro");
    const inactiveDetail = await queryProductBySlug(
        prisma,
        inactiveProductSlug,
    );
    const missingDetail = await queryProductBySlug(
        prisma,
        "produto-que-nao-existe",
    );

    assert(
        catalog.total === 24 &&
            !catalog.products.some(({ id }) => id === inactiveProductId),
        "Produto inativo apareceu na contagem ou listagem.",
    );
    assert(
        soldOut?.stock === 0 && soldOutDetail?.stock === 0,
        "Produto ativo esgotado nao permaneceu no catalogo e no detalhe.",
    );
    assert(
        inactiveDetail === null && missingDetail === null,
        "Detalhe inexistente ou inativo foi exposto.",
    );
}

async function main() {
    const testDatabaseUrl = getTestDatabaseUrl();

    await validateTestDatabase(testDatabaseUrl);
    runDatabaseCommand("prisma:migrate:deploy", testDatabaseUrl);
    runDatabaseCommand("prisma:seed", testDatabaseUrl);

    const adapter = new PrismaPg({
        connectionString: testDatabaseUrl,
        connectionTimeoutMillis: 5_000,
    });
    const prisma = new PrismaClient({ adapter });
    const errors: unknown[] = [];

    try {
        await prisma.product.deleteMany({ where: { id: inactiveProductId } });
        await createInactiveFixture(prisma);
        await verifySearch(prisma);
        await verifyCombinedFilters(prisma);
        await verifyPagination(prisma);
        await verifyNormalizationAndEmptyState(prisma);
        await verifyActivityAndAvailability(prisma);
    } catch (error) {
        errors.push(error);
    }

    try {
        await prisma.product.deleteMany({ where: { id: inactiveProductId } });
    } catch (error) {
        errors.push(error);
    }

    try {
        await prisma.$disconnect();
    } catch (error) {
        errors.push(error);
    }

    if (errors.length === 1) {
        throw errors[0];
    }

    if (errors.length > 1) {
        throw new AggregateError(
            errors,
            "A verificacao do catalogo falhou em mais de uma etapa.",
        );
    }

    console.log(
        "Catalogo verificado: busca, filtros, Sale, paginacao, normalizacao, ativos, esgotados e detalhes.",
    );
}

await main();
