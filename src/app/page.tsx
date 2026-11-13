import Link from "next/link";

export default function Home() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-16">
            <div className="w-full max-w-3xl border-y border-stone-300 py-16 text-center sm:py-24">
                <h1 className="text-5xl font-black tracking-tight text-stone-950 sm:text-7xl">
                    Sobe o Som
                </h1>
                <p className="mt-6 text-lg text-stone-600 sm:text-xl">
                    Discos para ouvir, capas para guardar
                </p>
                <Link
                    className="mt-10 inline-block border-2 border-stone-950 px-6 py-3 text-sm font-bold text-stone-950 transition hover:bg-stone-950 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-orange-600"
                    href="/login"
                >
                    Entrar
                </Link>
            </div>
        </main>
    );
}
