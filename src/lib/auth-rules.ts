import type { DefaultSession, Session } from "next-auth";
import type { GoogleProfile } from "next-auth/providers/google";

const allowedReturnPaths = new Set(["/", "/login"]);
const defaultReturnPath = "/login";

const authErrorMessages: Record<string, string> = {
    AccessDenied:
        "O acesso foi recusado. Confirme que sua conta Google possui um e-mail verificado e tente novamente.",
    OAuthAccountNotLinked:
        "Já existe uma conta com este e-mail, mas ela não está vinculada a esta identidade Google.",
    OAuthCallback:
        "O login foi cancelado ou não foi autorizado pelo Google. Você pode tentar novamente.",
    OAuthSignin:
        "Não foi possível iniciar o login com o Google. Tente novamente em instantes.",
    OAuthCreateAccount:
        "Não foi possível criar sua conta com o Google. Tente novamente em instantes.",
    Callback: "O login não foi concluído. Você pode tentar entrar novamente.",
    Configuration:
        "A autenticação está temporariamente indisponível. Tente novamente mais tarde.",
    configuration:
        "A autenticação está temporariamente indisponível. Tente novamente mais tarde.",
    Signin: "Não foi possível entrar. Tente novamente em instantes.",
};

export function normalizeEmail(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    const email = value.trim().toLowerCase();

    if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+$/.test(email)) {
        return null;
    }

    return email;
}

export function isVerifiedGoogleProfile(
    profile: unknown,
): profile is GoogleProfile {
    if (!profile || typeof profile !== "object") {
        return false;
    }

    const googleProfile = profile as Partial<GoogleProfile>;

    return (
        typeof googleProfile.sub === "string" &&
        googleProfile.sub.trim().length > 0 &&
        googleProfile.email_verified === true &&
        normalizeEmail(googleProfile.email) !== null
    );
}

export function canSignInWithGoogle(
    profile: unknown,
    provider: string | undefined,
    hasActiveSession: boolean,
) {
    return (
        !hasActiveSession &&
        provider === "google" &&
        isVerifiedGoogleProfile(profile)
    );
}

export function mapGoogleProfile(profile: GoogleProfile) {
    return {
        id:
            typeof profile.sub === "string" && profile.sub.trim()
                ? profile.sub
                : "invalid-google-profile",
        name: typeof profile.name === "string" ? profile.name : null,
        email: normalizeEmail(profile.email),
        image: typeof profile.picture === "string" ? profile.picture : null,
    };
}

export function getSafeReturnPath(value: unknown): "/" | "/login" {
    if (typeof value !== "string") {
        return defaultReturnPath;
    }

    try {
        if (!value.startsWith("/") || value.startsWith("//")) {
            return defaultReturnPath;
        }

        const baseUrl = new URL("http://internal");
        const destination = new URL(value, baseUrl);

        if (
            destination.origin !== baseUrl.origin ||
            destination.search ||
            destination.hash ||
            destination.pathname !== value ||
            !allowedReturnPaths.has(destination.pathname)
        ) {
            return defaultReturnPath;
        }

        return destination.pathname as "/" | "/login";
    } catch {
        return defaultReturnPath;
    }
}

export function getSafeRedirectUrl(value: string, baseUrl: string) {
    try {
        const base = new URL(baseUrl);
        const destination = new URL(value, base);
        const fallback = new URL(defaultReturnPath, base).toString();

        if (
            !["http:", "https:"].includes(base.protocol) ||
            destination.origin !== base.origin ||
            destination.username ||
            destination.password ||
            destination.search ||
            destination.hash ||
            !allowedReturnPaths.has(destination.pathname)
        ) {
            return fallback;
        }

        return new URL(destination.pathname, base).toString();
    } catch {
        return defaultReturnPath;
    }
}

export function getAuthErrorMessage(value: unknown) {
    if (typeof value !== "string") {
        return null;
    }

    return (
        authErrorMessages[value] ??
        "Não foi possível autenticar sua conta. Tente novamente em instantes."
    );
}

export function toPublicSession(
    session: DefaultSession,
    userId: string,
): Session {
    return {
        expires: session.expires,
        user: {
            id: userId,
            name: session.user?.name ?? null,
            email: session.user?.email ?? null,
            image: session.user?.image ?? null,
        },
    };
}
