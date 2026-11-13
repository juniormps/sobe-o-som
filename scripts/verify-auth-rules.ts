import assert from "node:assert/strict";

import {
    canSignInWithGoogle,
    getAuthErrorMessage,
    getSafeRedirectUrl,
    getSafeReturnPath,
    isVerifiedGoogleProfile,
    mapGoogleProfile,
    normalizeEmail,
    toPublicSession,
} from "../src/lib/auth-rules";

assert.equal(
    normalizeEmail("  Disco.Favorito+loja@GMAIL.com  "),
    "disco.favorito+loja@gmail.com",
);
assert.equal(normalizeEmail("   "), null);
assert.equal(normalizeEmail(undefined), null);

const validProfile = {
    sub: "google-stable-id",
    email: "  Pessoa@Example.com ",
    email_verified: true,
};

assert.equal(isVerifiedGoogleProfile(validProfile), true);
assert.equal(
    isVerifiedGoogleProfile({ ...validProfile, email: undefined }),
    false,
);
assert.equal(
    isVerifiedGoogleProfile({ ...validProfile, email_verified: false }),
    false,
);
assert.equal(canSignInWithGoogle(validProfile, "google", false), true);
assert.equal(canSignInWithGoogle(validProfile, "google", true), false);
assert.equal(canSignInWithGoogle(validProfile, "outro", false), false);

const mappedProfile = mapGoogleProfile(validProfile as never);
assert.equal(mappedProfile.id, "google-stable-id");
assert.equal(mappedProfile.email, "pessoa@example.com");
assert.equal(
    mapGoogleProfile({ ...validProfile, sub: undefined } as never).id,
    "invalid-google-profile",
);

assert.equal(getSafeReturnPath("/"), "/");
assert.equal(getSafeReturnPath("/login"), "/login");
assert.equal(getSafeReturnPath("https://example.com"), "/login");
assert.equal(getSafeReturnPath("//example.com"), "/login");
assert.equal(getSafeReturnPath("/login?next=/"), "/login");
assert.equal(getSafeReturnPath("/%"), "/login");

assert.equal(
    getSafeRedirectUrl("/", "http://localhost:3000"),
    "http://localhost:3000/",
);
assert.equal(
    getSafeRedirectUrl("https://example.com", "http://localhost:3000"),
    "http://localhost:3000/login",
);

const publicSession = toPublicSession(
    {
        expires: "2026-11-18T00:00:00.000Z",
        user: {
            name: "Pessoa",
            email: "pessoa@example.com",
            image: null,
            passwordHash: "nao-deve-sair",
            accessToken: "nao-deve-sair",
        },
        secret: "nao-deve-sair",
    } as never,
    "00000000-0000-0000-0000-000000000000",
);

assert.deepEqual(Object.keys(publicSession).sort(), ["expires", "user"]);
assert.deepEqual(Object.keys(publicSession.user).sort(), [
    "email",
    "id",
    "image",
    "name",
]);
assert.equal(JSON.stringify(publicSession).includes("nao-deve-sair"), false);
assert.match(getAuthErrorMessage("AccessDenied") ?? "", /acesso foi recusado/i);
assert.doesNotMatch(
    getAuthErrorMessage("mensagem-controlada-pelo-cliente") ?? "",
    /mensagem-controlada-pelo-cliente/,
);

console.log("Regras de autenticacao verificadas com sucesso.");
