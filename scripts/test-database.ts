import { spawnSync } from "node:child_process";

import type { Client } from "pg";

export function getIsolatedTestDatabaseUrl() {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
        throw new Error(
            "TEST_DATABASE_URL deve ser definida para a verificacao de credenciais.",
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

export function runTestDatabaseCommand(
    script: string,
    testDatabaseUrl: string,
) {
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

export async function validateIsolatedTestDatabase(client: Client) {
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

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) {
        throw new Error(message);
    }
}
