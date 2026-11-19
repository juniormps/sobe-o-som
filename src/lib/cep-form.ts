import { normalizePostalCode } from "@/lib/address-rules";
import type { CepAddress } from "@/lib/cep";

export type CepAutofillField = "street" | "district" | "city" | "state";
export type CepAutofillValues = Record<CepAutofillField, string>;
export type CepFieldRevisions = Record<CepAutofillField, number>;

export function shouldAcceptCepResponse(
    requestId: number,
    activeRequestId: number,
    requestedPostalCode: string,
    currentPostalCode: string,
) {
    return (
        requestId === activeRequestId &&
        normalizePostalCode(currentPostalCode) === requestedPostalCode
    );
}

export function mergeCepAutofill(
    current: CepAutofillValues,
    address: CepAddress,
    revisionsAtRequest: CepFieldRevisions,
    currentRevisions: CepFieldRevisions,
) {
    const next = { ...current };
    const applied: CepAutofillField[] = [];

    for (const field of ["street", "district", "city", "state"] as const) {
        const value = address[field];

        if (value && revisionsAtRequest[field] === currentRevisions[field]) {
            next[field] = value;
            applied.push(field);
        }
    }

    return { applied, values: next };
}
