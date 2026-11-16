import type { NextConfig } from "next";

const verificationDistDir =
    process.env.SOBE_O_SOM_NEXT_DIST_DIR === ".next-credentials-verify"
        ? process.env.SOBE_O_SOM_NEXT_DIST_DIR
        : undefined;

const nextConfig: NextConfig = {
    cacheComponents: true,
    ...(verificationDistDir ? { distDir: verificationDistDir } : {}),
    partialPrefetching: true,
    turbopack: {
        rules: {
            "*.css": {
                loaders: ["@tailwindcss/turbopack"],
                as: "*.css",
            },
        },
    },
};

export default nextConfig;
