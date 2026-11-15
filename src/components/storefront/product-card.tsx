import Image from "next/image";
import Link from "next/link";

import type { CatalogProduct } from "@/lib/catalog-data";
import { formatPrice, getSafeCoverPath } from "@/lib/format";

export function ProductCard({ product }: { product: CatalogProduct }) {
    const onSale =
        product.referencePriceInCents !== null &&
        product.referencePriceInCents > product.priceInCents;
    const soldOut = product.stock === 0;

    return (
        <article className="group h-full min-w-0 bg-white">
            <Link
                aria-label={`Ver detalhes de ${product.name}, de ${product.artist}`}
                className="flex h-full flex-col rounded-sm focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#B63E25]"
                href={`/produtos/${product.slug}`}
            >
                <div className="relative block aspect-square overflow-hidden rounded-sm border border-[#DED8CC] bg-[#F4F0E9]">
                    <Image
                        alt={`Capa do disco ${product.name}, de ${product.artist}`}
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none"
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, (min-width: 360px) 50vw, 100vw"
                        src={getSafeCoverPath(product.coverPath)}
                    />
                    {soldOut ? (
                        <span className="absolute top-3 left-3 rounded-full bg-[#241C19] px-3 py-1.5 text-xs font-black text-white uppercase">
                            Esgotado
                        </span>
                    ) : onSale ? (
                        <span className="absolute top-3 left-3 rounded-full bg-[#F3C76A] px-3 py-1.5 text-xs font-black text-[#241C19] uppercase">
                            Sale
                        </span>
                    ) : null}
                </div>
                <div className="flex flex-1 flex-col pt-4">
                    <p className="text-[0.68rem] font-black tracking-[0.14em] text-[#9F2F1A] uppercase">
                        {product.category.name}
                    </p>
                    <h2 className="mt-2 text-lg leading-tight font-black tracking-[-0.025em] text-[#241C19] group-hover:underline group-hover:decoration-[#B63E25] group-hover:decoration-2 group-hover:underline-offset-4">
                        {product.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#6B625E]">
                        {product.artist}
                    </p>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                        <div>
                            {onSale ? (
                                <p className="text-xs text-[#716864] line-through">
                                    {formatPrice(
                                        product.referencePriceInCents!,
                                    )}
                                </p>
                            ) : null}
                            <p className="text-lg font-black text-[#241C19]">
                                {formatPrice(product.priceInCents)}
                            </p>
                        </div>
                        <span className="inline-flex min-h-11 items-center rounded-full border border-[#241C19] px-4 py-2 text-xs font-black text-[#241C19] transition-colors group-hover:bg-[#241C19] group-hover:text-white">
                            Ver detalhes
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}
