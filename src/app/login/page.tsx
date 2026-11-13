import { Suspense } from "react";

import { LoginClient } from "@/app/login/login-client";
import { getAuthErrorMessage, getSafeReturnPath } from "@/lib/auth-rules";

type LoginPageProps = {
    searchParams: Promise<{
        callbackUrl?: string | string[];
        error?: string | string[];
    }>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
    return (
        <Suspense fallback={<LoginFallback />}>
            <LoginPageContent searchParams={searchParams} />
        </Suspense>
    );
}

async function LoginPageContent({ searchParams }: LoginPageProps) {
    const params = await searchParams;
    const callbackUrl = getSafeReturnPath(getFirstValue(params.callbackUrl));
    const initialError = getAuthErrorMessage(getFirstValue(params.error));

    return (
        <LoginClient callbackUrl={callbackUrl} initialError={initialError} />
    );
}

function getFirstValue(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function LoginFallback() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6">
            <p className="text-sm font-bold text-stone-600">
                Preparando o acesso...
            </p>
        </main>
    );
}
