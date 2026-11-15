const currencyFormatter = new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
});

export function formatPrice(priceInCents: number) {
    return currencyFormatter.format(priceInCents / 100);
}

export function getSafeCoverPath(coverPath: string) {
    return /^\/images\/[a-zA-Z0-9/_-]+\.(?:avif|jpe?g|png|svg|webp)$/.test(
        coverPath,
    )
        ? coverPath
        : "/images/album-placeholder.svg";
}
