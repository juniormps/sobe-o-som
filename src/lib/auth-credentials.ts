import { normalizeEmail } from "@/lib/auth-rules";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const USER_NAME_MAX_LENGTH = 120;

const registrationFields = [
    "name",
    "email",
    "password",
    "passwordConfirmation",
] as const;

export type RegistrationInput = {
    email: string;
    name: string;
    password: string;
    passwordConfirmation: string;
};

export type RegistrationField = keyof RegistrationInput | "form";

type RegistrationValidation =
    | { data: RegistrationInput; success: true }
    | {
          errors: Partial<Record<RegistrationField, string>>;
          success: false;
      };

export function validateRegistrationInput(
    value: unknown,
): RegistrationValidation {
    if (!isRecord(value)) {
        return {
            errors: { form: "Envie os dados do cadastro em formato válido." },
            success: false,
        };
    }

    const keys = Object.keys(value);

    if (
        keys.length !== registrationFields.length ||
        keys.some(
            (key) =>
                !registrationFields.includes(
                    key as (typeof registrationFields)[number],
                ),
        )
    ) {
        return {
            errors: { form: "O cadastro contém campos não permitidos." },
            success: false,
        };
    }

    const errors: Partial<Record<RegistrationField, string>> = {};
    const nameValue = value.name;
    const emailValue = value.email;
    const passwordValue = value.password;
    const confirmationValue = value.passwordConfirmation;

    if (typeof nameValue !== "string") {
        errors.name = "Informe seu nome.";
    } else if (!nameValue.trim()) {
        errors.name = "Informe seu nome.";
    } else if (/[\u0000-\u001F\u007F-\u009F]/.test(nameValue)) {
        errors.name = "O nome contém caracteres não permitidos.";
    } else if (nameValue.length > USER_NAME_MAX_LENGTH) {
        errors.name = `Use no máximo ${USER_NAME_MAX_LENGTH} caracteres no nome.`;
    }

    const normalizedEmail = normalizeEmail(emailValue);

    if (
        typeof emailValue !== "string" ||
        emailValue.length > 320 ||
        normalizedEmail === null
    ) {
        errors.email = "Informe um e-mail válido.";
    }

    if (typeof passwordValue !== "string") {
        errors.password = "Informe uma senha.";
    } else if (
        passwordValue.length < PASSWORD_MIN_LENGTH ||
        passwordValue.length > PASSWORD_MAX_LENGTH
    ) {
        errors.password = `Use uma senha entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;
    }

    if (typeof confirmationValue !== "string") {
        errors.passwordConfirmation = "Confirme sua senha.";
    } else if (confirmationValue.length > PASSWORD_MAX_LENGTH) {
        errors.passwordConfirmation = `A confirmação deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
    } else if (
        typeof passwordValue === "string" &&
        confirmationValue !== passwordValue
    ) {
        errors.passwordConfirmation = "As senhas precisam ser idênticas.";
    }

    if (Object.keys(errors).length > 0) {
        return { errors, success: false };
    }

    return {
        data: {
            email: normalizedEmail!,
            name: (nameValue as string).trim(),
            password: passwordValue as string,
            passwordConfirmation: confirmationValue as string,
        },
        success: true,
    };
}

export function validateLoginCredentials(value: unknown) {
    if (!isRecord(value)) {
        return null;
    }

    const email = normalizeEmail(value.email);
    const password = value.password;

    if (
        email === null ||
        typeof password !== "string" ||
        password.length < PASSWORD_MIN_LENGTH ||
        password.length > PASSWORD_MAX_LENGTH
    ) {
        return null;
    }

    return { email, password };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
