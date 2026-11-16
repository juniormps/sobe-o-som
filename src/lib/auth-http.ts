export const AUTH_JSON_BODY_LIMIT = 8 * 1024;

export function isTrustedRequestOrigin(
    requestOrigin: string | null,
    configuredUrl: string | undefined,
) {
    if (!requestOrigin || !configuredUrl) {
        return false;
    }

    try {
        const origin = new URL(requestOrigin);
        const configuredOrigin = new URL(configuredUrl);

        return (
            ["http:", "https:"].includes(origin.protocol) &&
            ["http:", "https:"].includes(configuredOrigin.protocol) &&
            origin.username === "" &&
            origin.password === "" &&
            origin.pathname === "/" &&
            origin.search === "" &&
            origin.hash === "" &&
            origin.origin === configuredOrigin.origin
        );
    } catch {
        return false;
    }
}

export async function readLimitedJson(request: Request, maximumBytes: number) {
    const contentLength = request.headers.get("content-length");

    if (
        contentLength !== null &&
        (!/^\d+$/.test(contentLength) || Number(contentLength) > maximumBytes)
    ) {
        throw new AuthBodyError("too_large");
    }

    if (!request.body) {
        throw new AuthBodyError("invalid_json");
    }

    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;

    while (true) {
        const { done, value } = await reader.read();

        if (done) {
            break;
        }

        size += value.byteLength;

        if (size > maximumBytes) {
            await reader.cancel();
            throw new AuthBodyError("too_large");
        }

        chunks.push(value);
    }

    const bytes = new Uint8Array(size);
    let offset = 0;

    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }

    try {
        return JSON.parse(
            new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        );
    } catch {
        throw new AuthBodyError("invalid_json");
    }
}

export class AuthBodyError extends Error {
    constructor(public readonly reason: "invalid_json" | "too_large") {
        super(reason);
    }
}
