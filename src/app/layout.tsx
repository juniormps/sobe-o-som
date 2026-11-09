import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
    title: "Sobe o Som",
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
                {children}
            </body>
        </html>
    );
}
