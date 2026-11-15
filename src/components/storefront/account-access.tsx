"use client";

import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";

export function AccountAccess() {
    return (
        <SessionProvider>
            <AccountStatus />
        </SessionProvider>
    );
}

function AccountStatus() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <span
                aria-label="Verificando sessão"
                className="flex min-h-11 min-w-20 items-center justify-center rounded-full border border-[#DED8CC] px-3 text-xs font-bold text-[#6B625E]"
            >
                Conta…
            </span>
        );
    }

    const firstName = session?.user?.name?.trim().split(/\s+/)[0];
    const label = session?.user ? firstName || "Minha conta" : "Entrar";

    return (
        <Link
            className="flex min-h-11 max-w-36 items-center gap-2 rounded-full border border-[#241C19] px-3 text-sm font-bold text-[#241C19] transition-colors hover:bg-[#241C19] hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#B63E25]"
            href="/login"
        >
            <AccountIcon />
            <span className="truncate">{label}</span>
        </Link>
    );
}

function AccountIcon() {
    return (
        <svg
            aria-hidden="true"
            className="size-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle cx="12" cy="8" r="3.25" stroke="currentColor" />
            <path
                d="M5.5 19c.7-3.1 3-4.7 6.5-4.7s5.8 1.6 6.5 4.7"
                stroke="currentColor"
                strokeLinecap="round"
            />
        </svg>
    );
}
