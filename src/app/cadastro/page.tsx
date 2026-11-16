import { Suspense } from "react";

import { RegistrationClient } from "@/app/cadastro/registration-client";
import { getSafeReturnPath } from "@/lib/auth-rules";

type RegistrationPageProps = {
    searchParams: Promise<{
        callbackUrl?: string | string[];
    }>;
};

export default function RegistrationPage({
    searchParams,
}: RegistrationPageProps) {
    return (
        <Suspense fallback={<RegistrationFallback />}>
            <RegistrationPageContent searchParams={searchParams} />
        </Suspense>
    );
}

async function RegistrationPageContent({
    searchParams,
}: RegistrationPageProps) {
    const params = await searchParams;
    const callbackValue = Array.isArray(params.callbackUrl)
        ? params.callbackUrl[0]
        : params.callbackUrl;

    return (
        <RegistrationClient callbackUrl={getSafeReturnPath(callbackValue)} />
    );
}

function RegistrationFallback() {
    return (
        <main
            className="flex min-h-screen items-center justify-center bg-stone-100 px-6"
            id="main-content"
        >
            <p className="text-sm font-bold text-stone-600">
                Preparando o cadastro...
            </p>
        </main>
    );
}
