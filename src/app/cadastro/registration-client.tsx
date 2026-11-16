"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useState, type FormEvent } from "react";

import { GoogleMark } from "@/components/auth/google-mark";
import type { RegistrationField } from "@/lib/auth-credentials";
import type { SafeReturnPath } from "@/lib/auth-rules";

type RegistrationClientProps = {
    callbackUrl: SafeReturnPath;
};

type RegistrationResponse = {
    error?: string;
    fieldErrors?: Partial<Record<RegistrationField, string>>;
    message?: string;
    ok?: boolean;
};

export function RegistrationClient({ callbackUrl }: RegistrationClientProps) {
    const { status } = useSession();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [pendingAction, setPendingAction] = useState<
        "register" | "google" | null
    >(null);
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<RegistrationField, string>>
    >({});
    const [message, setMessage] = useState<string | null>(null);
    const [registered, setRegistered] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPendingAction("register");
        setFieldErrors({});
        setMessage(null);

        try {
            const response = await fetch("/api/auth/register", {
                body: JSON.stringify({
                    email,
                    name,
                    password,
                    passwordConfirmation,
                }),
                headers: { "Content-Type": "application/json" },
                method: "POST",
            });
            const result = (await response.json()) as RegistrationResponse;

            if (!response.ok || !result.ok) {
                setPassword("");
                setPasswordConfirmation("");
                setFieldErrors(result.fieldErrors ?? {});
                setMessage(
                    result.error ??
                        "Não foi possível concluir o cadastro. Tente novamente.",
                );
                setPendingAction(null);
                return;
            }

            setPassword("");
            setPasswordConfirmation("");
            setMessage(
                result.message ?? "Cadastro concluído. Agora você pode entrar.",
            );
            setRegistered(true);
            setPendingAction(null);
        } catch {
            setPassword("");
            setPasswordConfirmation("");
            setMessage(
                "Não foi possível concluir o cadastro agora. Verifique sua conexão e tente novamente.",
            );
            setPendingAction(null);
        }
    }

    async function handleGoogleSignIn() {
        setPendingAction("google");
        setMessage(null);

        try {
            await signIn("google", { callbackUrl });
        } catch {
            setMessage(
                "Não foi possível iniciar o login. Verifique sua conexão e tente novamente.",
            );
            setPendingAction(null);
        }
    }

    return (
        <main
            className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-100 px-5 py-12 text-stone-950 sm:px-8"
            id="main-content"
        >
            <div
                aria-hidden="true"
                className="absolute -top-36 -left-24 size-80 rounded-full border-[52px] border-stone-950 bg-amber-300 sm:size-96"
            />
            <div
                aria-hidden="true"
                className="absolute -right-44 -bottom-40 size-96 rounded-full border-[68px] border-orange-700 bg-stone-950 opacity-95"
            />

            <section className="relative w-full max-w-xl border border-stone-300 bg-white p-7 shadow-[10px_10px_0_#1c1917] sm:p-10">
                <p className="text-xs font-bold tracking-[0.28em] text-orange-700 uppercase">
                    Sobe o Som
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                    Comece sua coleção.
                </h1>
                <p className="mt-4 text-base leading-7 text-stone-600">
                    Crie seu acesso com e-mail e senha ou continue com o Google.
                </p>

                {message ? (
                    <div
                        className={`mt-6 border-l-4 px-4 py-3 text-sm leading-6 ${
                            registered
                                ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                                : "border-red-700 bg-red-50 text-red-950"
                        }`}
                        id="registration-message"
                        role={registered ? "status" : "alert"}
                    >
                        {message}
                    </div>
                ) : null}

                <div className="mt-8 border-t border-stone-200 pt-7">
                    {status === "loading" ? (
                        <p className="text-sm font-semibold text-stone-600">
                            Verificando sua sessão...
                        </p>
                    ) : status === "authenticated" ? (
                        <div>
                            <p className="font-bold">Você já está conectado.</p>
                            <Link
                                className="mt-5 inline-flex border-2 border-stone-950 bg-stone-950 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                                href={callbackUrl}
                            >
                                Continuar
                            </Link>
                        </div>
                    ) : registered ? (
                        <Link
                            className="flex w-full justify-center border-2 border-stone-950 bg-stone-950 px-5 py-3.5 text-sm font-bold text-white hover:bg-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                            href={{
                                pathname: "/login",
                                query: { callbackUrl },
                            }}
                        >
                            Ir para o login
                        </Link>
                    ) : (
                        <div>
                            <form
                                aria-describedby={
                                    message ? "registration-message" : undefined
                                }
                                className="space-y-5"
                                onSubmit={handleSubmit}
                            >
                                <RegistrationFieldInput
                                    autoComplete="name"
                                    error={fieldErrors.name}
                                    id="registration-name"
                                    label="Nome"
                                    maxLength={120}
                                    name="name"
                                    onChange={setName}
                                    value={name}
                                />
                                <RegistrationFieldInput
                                    autoComplete="email"
                                    error={fieldErrors.email}
                                    id="registration-email"
                                    label="E-mail"
                                    maxLength={320}
                                    name="email"
                                    onChange={setEmail}
                                    type="email"
                                    value={email}
                                />
                                <RegistrationFieldInput
                                    autoComplete="new-password"
                                    error={fieldErrors.password}
                                    hint="Use de 8 a 128 caracteres. Frases-senha, espaços e Unicode são permitidos."
                                    id="registration-password"
                                    label="Senha"
                                    maxLength={128}
                                    minLength={8}
                                    name="password"
                                    onChange={setPassword}
                                    type="password"
                                    value={password}
                                />
                                <RegistrationFieldInput
                                    autoComplete="new-password"
                                    error={fieldErrors.passwordConfirmation}
                                    id="registration-password-confirmation"
                                    label="Confirme a senha"
                                    maxLength={128}
                                    minLength={8}
                                    name="passwordConfirmation"
                                    onChange={setPasswordConfirmation}
                                    type="password"
                                    value={passwordConfirmation}
                                />
                                <button
                                    className="w-full border-2 border-stone-950 bg-stone-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                                    disabled={pendingAction !== null}
                                    type="submit"
                                >
                                    {pendingAction === "register"
                                        ? "Criando conta..."
                                        : "Criar conta"}
                                </button>
                            </form>

                            <p className="my-6 flex items-center gap-3 text-xs font-bold tracking-widest text-stone-500 uppercase before:h-px before:flex-1 before:bg-stone-300 after:h-px after:flex-1 after:bg-stone-300">
                                ou
                            </p>
                            <button
                                className="flex w-full items-center justify-center gap-3 border-2 border-stone-950 bg-white px-5 py-3.5 text-sm font-bold transition hover:bg-stone-950 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                                disabled={pendingAction !== null}
                                onClick={handleGoogleSignIn}
                                type="button"
                            >
                                <GoogleMark />
                                {pendingAction === "google"
                                    ? "Abrindo o Google..."
                                    : "Continuar com Google"}
                            </button>
                            <p className="mt-6 text-center text-sm text-stone-600">
                                Já possui acesso?{" "}
                                <Link
                                    className="font-bold text-stone-950 underline decoration-orange-600 decoration-2 underline-offset-4 hover:text-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                                    href={{
                                        pathname: "/login",
                                        query: { callbackUrl },
                                    }}
                                >
                                    Entre na sua conta
                                </Link>
                            </p>
                        </div>
                    )}
                </div>

                <Link
                    className="mt-8 inline-block text-sm font-bold text-stone-700 underline decoration-orange-600 decoration-2 underline-offset-4 hover:text-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                    href="/"
                >
                    Voltar ao início
                </Link>
            </section>
        </main>
    );
}

type RegistrationFieldInputProps = {
    autoComplete: string;
    error?: string;
    hint?: string;
    id: string;
    label: string;
    maxLength: number;
    minLength?: number;
    name: string;
    onChange: (value: string) => void;
    type?: "email" | "password" | "text";
    value: string;
};

function RegistrationFieldInput({
    autoComplete,
    error,
    hint,
    id,
    label,
    maxLength,
    minLength,
    name,
    onChange,
    type = "text",
    value,
}: RegistrationFieldInputProps) {
    const descriptionIds = [
        hint ? `${id}-hint` : null,
        error ? `${id}-error` : null,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <div>
            <label className="text-sm font-bold text-stone-800" htmlFor={id}>
                {label}
            </label>
            {hint ? (
                <p
                    className="mt-1 text-xs leading-5 text-stone-600"
                    id={`${id}-hint`}
                >
                    {hint}
                </p>
            ) : null}
            <input
                aria-describedby={descriptionIds || undefined}
                aria-invalid={Boolean(error)}
                autoComplete={autoComplete}
                className="mt-2 w-full border-2 border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-950 focus-visible:ring-3 focus-visible:ring-orange-500/40"
                id={id}
                maxLength={maxLength}
                minLength={minLength}
                name={name}
                onChange={(event) => onChange(event.target.value)}
                required
                type={type}
                value={value}
            />
            {error ? (
                <p
                    className="mt-2 text-sm font-semibold text-red-800"
                    id={`${id}-error`}
                >
                    {error}
                </p>
            ) : null}
        </div>
    );
}
