import assert from "node:assert/strict";

import { normalizePostalCode } from "../src/lib/address-rules";
import {
    CepLookupError,
    createCepLookup,
    fetchCepFromViaCep,
    parseViaCepResponse,
    type CepAddress,
    type CepCacheAdapter,
} from "../src/lib/cep";
import {
    mergeCepAutofill,
    shouldAcceptCepResponse,
    type CepFieldRevisions,
} from "../src/lib/cep-form";

async function main() {
    verifyFormatsAndPayloads();
    await verifyExternalFailures();
    await verifySuccessCacheAndFailureRecovery();
    verifyFormCoordination();

    console.log(
        "CEP verificado: formatos, respostas controladas, timeout, cache de sucesso, recuperação e coordenação do formulário.",
    );
}

function verifyFormatsAndPayloads() {
    assert.equal(normalizePostalCode("01234-567"), "01234567");
    assert.equal(normalizePostalCode("01234567"), "01234567");
    assert.equal(normalizePostalCode("1234567"), null);
    assert.equal(normalizePostalCode("01234.567"), null);
    assert.equal(normalizePostalCode("CEP 01234567"), null);
    assert.equal(normalizePostalCode("https://example.test"), null);

    assert.deepEqual(
        parseViaCepResponse(
            {
                bairro: "Sé",
                cep: "01001-000",
                complemento: "lado ímpar",
                localidade: "São Paulo",
                logradouro: "Praça da Sé",
                uf: "SP",
            },
            "01001000",
        ),
        {
            city: "São Paulo",
            district: "Sé",
            postalCode: "01001000",
            state: "SP",
            street: "Praça da Sé",
        },
    );
    assert.deepEqual(
        parseViaCepResponse(
            {
                bairro: "",
                cep: "70040901",
                localidade: "Brasília",
                logradouro: "",
                uf: "DF",
            },
            "70040901",
        ),
        {
            city: "Brasília",
            district: "",
            postalCode: "70040901",
            state: "DF",
            street: "",
        },
    );
    assertCepError(
        () => parseViaCepResponse({ erro: true }, "01001000"),
        "not_found",
    );
    assertCepError(
        () =>
            parseViaCepResponse(
                { bairro: "Sé", localidade: "São Paulo", uf: "XX" },
                "01001000",
            ),
        "invalid_response",
    );
    assertCepError(
        () => parseViaCepResponse([], "01001000"),
        "invalid_response",
    );
    assertCepError(
        () =>
            parseViaCepResponse(
                {
                    bairro: "Sé",
                    localidade: "São Paulo",
                    logradouro: "Praça da Sé",
                    uf: "SP",
                },
                "01001000",
            ),
        "invalid_response",
    );
    assertCepError(
        () =>
            parseViaCepResponse(
                {
                    bairro: "Sé",
                    cep: "01001-000",
                    localidade: "C".repeat(121),
                    logradouro: "Praça da Sé",
                    uf: "SP",
                },
                "01001000",
            ),
        "invalid_response",
    );
}

async function verifyExternalFailures() {
    let requestedUrl = "";
    const success = await fetchCepFromViaCep("01234567", (async (input) => {
        requestedUrl = String(input);
        return Response.json({
            bairro: "Centro",
            cep: "01234-567",
            localidade: "São Paulo",
            logradouro: "Rua Controlada",
            uf: "SP",
        });
    }) as typeof fetch);
    assert.equal(requestedUrl, "https://viacep.com.br/ws/01234567/json/");
    assert.equal(success.postalCode, "01234567");

    await assertRejectsCep(
        () =>
            fetchCepFromViaCep(
                "01001000",
                (async () =>
                    new Response("erro", { status: 503 })) as typeof fetch,
            ),
        "upstream_http",
    );
    await assertRejectsCep(
        () =>
            fetchCepFromViaCep(
                "01001000",
                (async () =>
                    new Response("{", {
                        headers: { "Content-Type": "application/json" },
                        status: 200,
                    })) as typeof fetch,
            ),
        "invalid_response",
    );
    await assertRejectsCep(
        () =>
            fetchCepFromViaCep("01001000", (async () => {
                throw new Error("falha controlada");
            }) as typeof fetch),
        "network",
    );
    await assertRejectsCep(
        () =>
            fetchCepFromViaCep(
                "01001000",
                ((_input, init) =>
                    new Promise((_resolve, reject) => {
                        init?.signal?.addEventListener("abort", () =>
                            reject(new Error("abortada")),
                        );
                    })) as typeof fetch,
                10,
            ),
        "timeout",
    );
}

async function verifySuccessCacheAndFailureRecovery() {
    const successfulResults = new Map<string, CepAddress>();
    const successOnlyCache: CepCacheAdapter = async (postalCode, load) => {
        const cached = successfulResults.get(postalCode);

        if (cached) {
            return cached;
        }

        const result = await load();
        successfulResults.set(postalCode, result);
        return result;
    };
    let successCalls = 0;
    const cachedLookup = createCepLookup(async (postalCode) => {
        successCalls += 1;
        return {
            city: "Cidade Cache",
            district: "Centro",
            postalCode,
            state: "SP",
            street: "Rua Cache",
        };
    }, successOnlyCache);
    const first = await cachedLookup("01234567");
    const second = await cachedLookup("01234567");
    assert.deepEqual(second, first);
    assert.equal(successCalls, 1);

    let recoveryCalls = 0;
    const recoveringLookup = createCepLookup(async (postalCode) => {
        recoveryCalls += 1;

        if (recoveryCalls === 1) {
            throw new CepLookupError("network");
        }

        return {
            city: "Cidade Recuperada",
            district: "",
            postalCode,
            state: "RJ",
            street: "",
        };
    }, successOnlyCache);

    await assertRejectsCep(() => recoveringLookup("07654321"), "network");
    const recovered = await recoveringLookup("07654321");
    assert.equal(recovered.city, "Cidade Recuperada");
    assert.equal(recoveryCalls, 2);
}

function verifyFormCoordination() {
    assert.equal(shouldAcceptCepResponse(1, 2, "01001000", "01001-000"), false);
    assert.equal(shouldAcceptCepResponse(2, 2, "01001000", "20040-020"), false);
    assert.equal(shouldAcceptCepResponse(2, 2, "01001000", "01001-000"), true);

    const revisionsAtRequest: CepFieldRevisions = {
        city: 1,
        district: 1,
        state: 1,
        street: 1,
    };
    const currentRevisions: CepFieldRevisions = {
        ...revisionsAtRequest,
        street: 2,
    };
    const merged = mergeCepAutofill(
        {
            city: "",
            district: "",
            state: "",
            street: "Rua digitada durante a consulta",
        },
        {
            city: "São Paulo",
            district: "Sé",
            postalCode: "01001000",
            state: "SP",
            street: "Praça da Sé",
        },
        revisionsAtRequest,
        currentRevisions,
    );
    assert.equal(merged.values.street, "Rua digitada durante a consulta");
    assert.equal(merged.values.city, "São Paulo");
    assert.equal(merged.applied.includes("street"), false);
}

function assertCepError(operation: () => unknown, reason: string) {
    assert.throws(operation, (error) => {
        return error instanceof CepLookupError && error.reason === reason;
    });
}

async function assertRejectsCep(
    operation: () => Promise<unknown>,
    reason: string,
) {
    await assert.rejects(operation, (error) => {
        return error instanceof CepLookupError && error.reason === reason;
    });
}

await main();
