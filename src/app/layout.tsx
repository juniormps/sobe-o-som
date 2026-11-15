import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Sobe o Som | Discos de vinil",
        template: "%s | Sobe o Som",
    },
    description:
        "Loja demonstrativa de discos de vinil. Discos para ouvir, capas para guardar.",
};

type RootLayoutProps = Readonly<{
    children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="pt-BR">
            <body className="min-h-screen bg-white text-stone-900 antialiased">
                <a
                    className="fixed top-2 left-2 z-[100] -translate-y-24 rounded-full bg-[#F3C76A] px-4 py-3 text-sm font-black text-[#241C19] transition-transform focus:translate-y-0 focus:outline-3 focus:outline-offset-2 focus:outline-[#B63E25] motion-reduce:transition-none"
                    href="#main-content"
                >
                    Ir para o conteúdo
                </a>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
