"use client";

import Link from "next/link";
import { SessionProvider, signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

type LoginClientProps = {
    callbackUrl: "/" | "/login";
    initialError: string | null;
};

export function LoginClient(props: LoginClientProps) {
    return (
        <SessionProvider>
            <LoginPanel {...props} />
        </SessionProvider>
    );
}

function LoginPanel({ callbackUrl, initialError }: LoginClientProps) {
    const { data: session, status } = useSession();
    const [pendingAction, setPendingAction] = useState<"in" | "out" | null>(
        null,
    );
    const [actionError, setActionError] = useState<string | null>(null);
    const errorMessage = actionError ?? initialError;

    async function handleSignIn() {
        setPendingAction("in");
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
            await signOut({ callbackUrl: "/login" });
        } catch {
            setActionError(
                "Não foi possível sair agora. Atualize a página e tente novamente.",
            );
            setPendingAction(null);
        }
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-stone-100 px-5 py-12 text-stone-950 sm:px-8">
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
                        : "Entre com o Google para acessar sua conta."}
                </p>

                {errorMessage ? (
                    <div
                        className="mt-6 border-l-4 border-red-700 bg-red-50 px-4 py-3 text-sm leading-6 text-red-950"
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
                                {session.user.name ?? "Conta Google"}
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
                        <button
                            className="flex w-full items-center justify-center gap-3 border-2 border-stone-950 bg-white px-5 py-3.5 text-sm font-bold transition hover:bg-stone-950 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600 disabled:cursor-wait disabled:opacity-60"
                            disabled={pendingAction !== null}
                            onClick={handleSignIn}
                            type="button"
                        >
                            <GoogleMark />
                            {pendingAction === "in"
                                ? "Abrindo o Google..."
                                : "Continuar com Google"}
                        </button>
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

function GoogleMark() {
    return (
        <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
            <path
                d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z"
                fill="#4285F4"
            />
            <path
                d="M12 22c2.7 0 4.97-.9 6.62-2.35l-3.24-2.55c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z"
                fill="#34A853"
            />
            <path
                d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.44H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.56l3.35-2.63Z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.44l3.35 2.63C7.18 7.7 9.39 5.94 12 5.94Z"
                fill="#EA4335"
            />
        </svg>
    );
}
