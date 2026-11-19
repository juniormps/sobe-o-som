export const ADDRESS_FIELD_LIMITS = {
    city: 120,
    complement: 120,
    district: 120,
    number: 30,
    recipient: 120,
    street: 160,
} as const;

export const BRAZILIAN_STATES = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
] as const;

export type AddressField =
    | "recipient"
    | "postalCode"
    | "street"
    | "number"
    | "hasNoNumber"
    | "complement"
    | "district"
    | "city"
    | "state";

export type AddressInput = {
    recipient: string;
    postalCode: string;
    street: string;
    number: string | null;
    hasNoNumber: boolean;
    complement: string | null;
    district: string | null;
    city: string;
    state: string;
};

export type AddressValidationResult =
    | { data: AddressInput; status: "valid" }
    | {
          errors: Partial<Record<AddressField, string>>;
          status: "invalid";
      };

const expectedAddressFields = new Set<AddressField>([
    "recipient",
    "postalCode",
    "street",
    "number",
    "hasNoNumber",
    "complement",
    "district",
    "city",
    "state",
]);
const controlCharacters = /[\u0000-\u001F\u007F-\u009F]/;
const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePostalCode(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    const postalCode = value.trim();
    const match = /^(\d{5})-?(\d{3})$/.exec(postalCode);

    return match ? `${match[1]}${match[2]}` : null;
}

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && uuidPattern.test(value);
}

export function validateAddressInput(value: unknown): AddressValidationResult {
    const errors: Partial<Record<AddressField, string>> = {};

    if (!isPlainObject(value)) {
        return {
            errors: { recipient: "Revise os dados do endereço." },
            status: "invalid",
        };
    }

    const keys = Object.keys(value);

    if (
        keys.length !== expectedAddressFields.size ||
        keys.some((key) => !expectedAddressFields.has(key as AddressField))
    ) {
        return {
            errors: { recipient: "Revise os dados enviados." },
            status: "invalid",
        };
    }

    const recipient = requiredText(
        value.recipient,
        ADDRESS_FIELD_LIMITS.recipient,
        "Informe o destinatário.",
        "O destinatário deve ter no máximo 120 caracteres.",
        errors,
        "recipient",
    );
    const street = requiredText(
        value.street,
        ADDRESS_FIELD_LIMITS.street,
        "Informe o logradouro.",
        "O logradouro deve ter no máximo 160 caracteres.",
        errors,
        "street",
    );
    const city = requiredText(
        value.city,
        ADDRESS_FIELD_LIMITS.city,
        "Informe a cidade.",
        "A cidade deve ter no máximo 120 caracteres.",
        errors,
        "city",
    );
    const complement = optionalText(
        value.complement,
        ADDRESS_FIELD_LIMITS.complement,
        "O complemento deve ter no máximo 120 caracteres.",
        errors,
        "complement",
    );
    const district = optionalText(
        value.district,
        ADDRESS_FIELD_LIMITS.district,
        "O bairro deve ter no máximo 120 caracteres.",
        errors,
        "district",
    );
    const postalCode = normalizePostalCode(value.postalCode);

    if (!postalCode) {
        errors.postalCode = "Informe um CEP com oito dígitos.";
    }

    const state =
        typeof value.state === "string" ? value.state.trim().toUpperCase() : "";

    if (
        controlCharacters.test(state) ||
        !BRAZILIAN_STATES.includes(state as (typeof BRAZILIAN_STATES)[number])
    ) {
        errors.state = "Selecione uma UF válida.";
    }

    const hasNoNumber = value.hasNoNumber;

    if (typeof hasNoNumber !== "boolean") {
        errors.hasNoNumber = "Informe se o endereço não possui número.";
    }

    const number = optionalText(
        value.number,
        ADDRESS_FIELD_LIMITS.number,
        "O número deve ter no máximo 30 caracteres.",
        errors,
        "number",
    );

    if (hasNoNumber === true && number !== null) {
        errors.number = "Remova o número ao marcar sem número.";
    } else if (hasNoNumber === false && number === null) {
        errors.number = "Informe o número ou marque sem número.";
    }

    if (Object.keys(errors).length > 0) {
        return { errors, status: "invalid" };
    }

    return {
        data: {
            city: city!,
            complement,
            district,
            hasNoNumber: hasNoNumber as boolean,
            number,
            postalCode: postalCode!,
            recipient: recipient!,
            state,
            street: street!,
        },
        status: "valid",
    };
}

function requiredText(
    value: unknown,
    maximumLength: number,
    requiredMessage: string,
    lengthMessage: string,
    errors: Partial<Record<AddressField, string>>,
    field: AddressField,
) {
    const normalized = normalizeText(value);

    if (normalized === null) {
        errors[field] = requiredMessage;
        return null;
    }

    if (normalized.length > maximumLength) {
        errors[field] = lengthMessage;
        return null;
    }

    return normalized;
}

function optionalText(
    value: unknown,
    maximumLength: number,
    lengthMessage: string,
    errors: Partial<Record<AddressField, string>>,
    field: AddressField,
) {
    if (value === null || value === "") {
        return null;
    }

    const normalized = normalizeText(value);

    if (normalized === null) {
        if (
            typeof value !== "string" ||
            controlCharacters.test(String(value))
        ) {
            errors[field] = "Use um texto válido.";
        }
        return null;
    }

    if (normalized.length > maximumLength) {
        errors[field] = lengthMessage;
        return null;
    }

    return normalized;
}

function normalizeText(value: unknown) {
    if (typeof value !== "string" || controlCharacters.test(value)) {
        return null;
    }

    const normalized = value.trim();

    return normalized || null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        (Object.getPrototypeOf(value) === Object.prototype ||
            Object.getPrototypeOf(value) === null)
    );
}
