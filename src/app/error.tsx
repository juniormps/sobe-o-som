"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { reset: () => void }) {
    return (
        <main
            className="flex min-h-screen items-center justify-center bg-[#F4F0E9] px-5 py-16 text-[#241C19]"
            id="main-content"
        >
            <section className="w-full max-w-xl border border-[#DED8CC] bg-white p-7 shadow-[10px_10px_0_#241C19] sm:p-10">
                <p className="text-xs font-black tracking-[0.2em] text-[#9F2F1A] uppercase">
                    A agulha saiu da faixa
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-5xl">
                    Não foi possível carregar agora.
                </h1>
                <p className="mt-4 leading-7 text-[#6B625E]">
                    Houve uma falha temporária ao consultar a loja. Nenhum
                    detalhe interno foi exposto.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <button
                        className="min-h-12 rounded-full bg-[#241C19] px-6 py-3 text-sm font-black text-white hover:bg-[#B63E25] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                        onClick={reset}
                        type="button"
                    >
                        Tentar novamente
                    </button>
                    <Link
                        className="inline-flex min-h-12 items-center rounded-full border border-[#241C19] px-6 py-3 text-sm font-black focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#B63E25]"
                        href="/"
                    >
                        Ir para o início
                    </Link>
                </div>
            </section>
        </main>
    );
}
