"use client";

import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState, type FormEvent } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { GoogleMark } from "@/components/auth/google-mark";
import { getAuthErrorMessage, type SafeReturnPath } from "@/lib/auth-rules";

type LoginClientProps = {
    callbackUrl: SafeReturnPath;
    initialError: string | null;
};

type PendingAction = "credentials" | "google" | "out" | null;

export function LoginClient({ callbackUrl, initialError }: LoginClientProps) {
    const { data: session, status } = useSession();
    const { clearForLogout } = useCart();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const errorMessage = actionError ?? initialError;
    const errorId = errorMessage ? "login-error" : undefined;

    async function handleCredentialsSignIn(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPendingAction("credentials");
        setActionError(null);

        try {
            const result = await signIn("credentials", {
                callbackUrl,
                email,
                password,
                redirect: false,
            });

            if (!result?.ok) {
                setPassword("");
                setActionError(
                    getAuthErrorMessage(result?.error) ??
                        "Não foi possível entrar. Tente novamente.",
                );
                setPendingAction(null);
                return;
            }

            window.location.assign(result.url ?? callbackUrl);
        } catch {
            setPassword("");
            setActionError(
                "Não foi possível entrar agora. Verifique sua conexão e tente novamente.",
            );
            setPendingAction(null);
        }
    }

    async function handleGoogleSignIn() {
        setPendingAction("google");
        setActionError(null);

        try {
            await signIn("google", { callbackUrl });
        } catch {
            setActionError(
                "Não foi possível iniciar o login. Verifique sua conexão e tente novamente.",
            );
            setPendingAction(null);
        }
    }

    async function handleSignOut() {
        setPendingAction("out");
        setActionError(null);

        try {
            const result = await signOut({
                callbackUrl: "/login",
                redirect: false,
            });
            clearForLogout();
            window.location.assign(result.url);
        } catch {
            setActionError(
                "Não foi possível sair agora. Atualize a página e tente novamente.",
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
                className="absolute -top-28 -right-28 size-80 rounded-full border-[52px] border-stone-950 bg-orange-600 sm:size-96"
            />
            <div
                aria-hidden="true"
                className="absolute -bottom-48 -left-36 size-96 rounded-full border-[70px] border-orange-700 bg-amber-300 opacity-90"
            />

            <section className="relative w-full max-w-lg border border-stone-300 bg-white p-7 shadow-[10px_10px_0_#1c1917] sm:p-10">
                <p className="text-xs font-bold tracking-[0.28em] text-orange-700 uppercase">
                    Sobe o Som
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                    Sua conta, no ritmo certo.
                </h1>
                <p className="mt-4 max-w-md text-base leading-7 text-stone-600">
                    {status === "authenticated"
                        ? "Você já está conectado."
                        : "Entre com e-mail e senha ou continue com o Google."}
                </p>

                {errorMessage ? (
                    <div
                        className="mt-6 border-l-4 border-red-700 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950"
                        id="login-error"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                ) : null}

                <div className="mt-8 border-t border-stone-200 pt-7">
                    {status === "loading" ? (
                        <p
                            aria-live="polite"
                            className="text-sm font-semibold text-stone-600"
                        >
                            Verificando sua sessão...
                        </p>
                    ) : session?.user ? (
                        <div>
                            <p className="text-sm font-bold text-stone-500 uppercase">
                                Conta conectada
                            </p>
                            <p className="mt-3 text-xl font-bold">
                                {session.user.name ?? "Sua conta"}
                            </p>
                            {session.user.email ? (
                                <p className="mt-1 break-all text-sm text-stone-600">
                                    {session.user.email}
                                </p>
                            ) : null}
                            <button
                                className="mt-6 w-full border-2 border-stone-950 bg-stone-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                                disabled={pendingAction !== null}
                                onClick={handleSignOut}
                                type="button"
                            >
                                {pendingAction === "out" ? "Saindo..." : "Sair"}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <form
                                aria-describedby={errorId}
                                className="space-y-5"
                                onSubmit={handleCredentialsSignIn}
                            >
                                <div>
                                    <label
                                        className="text-sm font-bold text-stone-800"
                                        htmlFor="login-email"
                                    >
                                        E-mail
                                    </label>
                                    <input
                                        aria-invalid={Boolean(errorMessage)}
                                        autoComplete="email"
                                        className="mt-2 w-full border-2 border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-950 focus-visible:ring-3 focus-visible:ring-orange-500/40"
                                        id="login-email"
                                        maxLength={320}
                                        name="email"
                                        onChange={(event) =>
                                            setEmail(event.target.value)
                                        }
                                        required
                                        type="email"
                                        value={email}
                                    />
                                </div>
                                <div>
                                    <label
                                        className="text-sm font-bold text-stone-800"
                                        htmlFor="login-password"
                                    >
                                        Senha
                                    </label>
                                    <p
                                        className="mt-1 text-xs leading-5 text-stone-600"
                                        id="login-password-hint"
                                    >
                                        Use de 8 a 128 caracteres.
                                    </p>
                                    <input
                                        aria-describedby={
                                            errorId
                                                ? `login-password-hint ${errorId}`
                                                : "login-password-hint"
                                        }
                                        aria-invalid={Boolean(errorMessage)}
                                        autoComplete="current-password"
                                        className="mt-2 w-full border-2 border-stone-300 bg-white px-4 py-3 text-base outline-none transition focus:border-stone-950 focus-visible:ring-3 focus-visible:ring-orange-500/40"
                                        id="login-password"
                                        maxLength={128}
                                        minLength={8}
                                        name="password"
                                        onChange={(event) =>
                                            setPassword(event.target.value)
                                        }
                                        required
                                        type="password"
                                        value={password}
                                    />
                                </div>
                                <button
                                    className="w-full border-2 border-stone-950 bg-stone-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                                    disabled={pendingAction !== null}
                                    type="submit"
                                >
                                    {pendingAction === "credentials"
                                        ? "Entrando..."
                                        : "Entrar"}
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
                                Ainda não tem uma conta?{" "}
                                <Link
                                    className="font-bold text-stone-950 underline decoration-orange-600 decoration-2 underline-offset-4 hover:text-orange-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                                    href={{
                                        pathname: "/cadastro",
                                        query: { callbackUrl },
                                    }}
                                >
                                    Cadastre-se
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
