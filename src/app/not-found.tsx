import Link from "next/link";

export default function NotFound() {
    return (
        <main
            className="flex min-h-screen items-center justify-center overflow-hidden bg-[#452327] px-5 py-16 text-[#FAF7F0]"
            id="main-content"
        >
            <section className="relative z-10 max-w-2xl text-center">
                <div
                    aria-hidden="true"
                    className="mx-auto size-36 rounded-full border-[2.5rem] border-[#171313] bg-[#F3C76A] shadow-2xl"
                />
                <p className="mt-8 text-xs font-black tracking-[0.25em] text-[#F3C76A] uppercase">
                    Erro 404
                </p>
                <h1 className="mt-3 text-5xl leading-none font-black tracking-[-0.06em] sm:text-7xl">
                    Esse disco não está na estante.
                </h1>
                <p className="mx-auto mt-5 max-w-lg leading-7 text-[#DED8CC]">
                    O endereço pode estar incorreto, ou o produto não está
                    disponível no catálogo ativo.
                </p>
                <Link
                    className="mt-8 inline-flex min-h-12 items-center rounded-full bg-[#F3C76A] px-6 py-3 text-sm font-black text-[#241C19] hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#F3C76A]"
                    href="/#catalogo"
                >
                    Voltar ao catálogo
                </Link>
            </section>
        </main>
    );
}
