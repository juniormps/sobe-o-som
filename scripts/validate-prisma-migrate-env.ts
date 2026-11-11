import "dotenv/config";

function getRequiredVariable(name: "DATABASE_URL" | "SHADOW_DATABASE_URL") {
    const value = process.env[name];

    if (!value) {
        throw new Error(`${name} deve ser definida para prisma migrate dev.`);
    }

    return value;
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

    const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

    if (!url.hostname || !database) {
        throw new Error(`${name} deve identificar host e banco PostgreSQL.`);
    }

    const normalizedHostname = url.hostname
        .toLowerCase()
        .replace(/^\[(.*)\]$/, "$1");
    const hostname = ["localhost", "::1"].includes(normalizedHostname)
        ? "127.0.0.1"
        : normalizedHostname;
    const port = url.port || "5432";

    return `${hostname}:${port}/${database}`;
}

const databaseUrl = getRequiredVariable("DATABASE_URL");
const shadowDatabaseUrl = getRequiredVariable("SHADOW_DATABASE_URL");
const databaseDestination = getDatabaseDestination(databaseUrl, "DATABASE_URL");
const shadowDestination = getDatabaseDestination(
    shadowDatabaseUrl,
    "SHADOW_DATABASE_URL",
);

if (databaseDestination === shadowDestination) {
    throw new Error(
        "DATABASE_URL e SHADOW_DATABASE_URL devem apontar para bancos distintos.",
    );
}

console.log("Ambiente de migrate dev validado com bancos distintos.");
