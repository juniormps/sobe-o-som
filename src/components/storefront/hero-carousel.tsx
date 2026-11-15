"use client";

import Link from "next/link";
import { useState } from "react";

const slides = [
    {
        eyebrow: "A vitrola pede",
        title: "Seu próximo disco favorito",
        description:
            "Histórias prensadas em vinil, escolhidas para virar o lado e ouvir de novo.",
        href: "/#catalogo",
        linkLabel: "Explorar o catálogo",
        theme: "wine",
    },
    {
        eyebrow: "Ritmos do Brasil",
        title: "O Brasil gira por aqui",
        description:
            "Samba, balanço e canção em discos que atravessam manhãs e madrugadas.",
        href: "/?genero=mpb-e-samba#catalogo",
        linkLabel: "Ouvir a seleção brasileira",
        theme: "orange",
    },
    {
        eyebrow: "Agulha na faixa",
        title: "Um lado jazz. Outro universo.",
        description:
            "Improviso, silêncio e metais: encontre espaço para uma escuta sem pressa.",
        href: "/?genero=jazz-e-blues#catalogo",
        linkLabel: "Descobrir Jazz e Blues",
        theme: "blue",
    },
] as const;

export function HeroCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeSlide = slides[activeIndex];

    function showPrevious() {
        setActiveIndex((current) =>
            current === 0 ? slides.length - 1 : current - 1,
        );
    }

    function showNext() {
        setActiveIndex((current) => (current + 1) % slides.length);
    }

    return (
        <section
            aria-label="Destaques da loja"
            aria-roledescription="carrossel"
            className={`relative isolate overflow-hidden ${getThemeClasses(activeSlide.theme)}`}
        >
            <div className="mx-auto grid min-h-[32rem] w-full max-w-[90rem] items-center gap-8 px-5 py-12 sm:px-10 md:min-h-[30rem] md:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)] md:py-16 lg:px-16">
                <div
                    aria-atomic="true"
                    aria-live="polite"
                    className="relative z-10 max-w-2xl"
                >
                    <p className="text-xs font-black tracking-[0.25em] uppercase">
                        {activeSlide.eyebrow}
                    </p>
                    <h1 className="mt-4 text-[clamp(2.7rem,10vw,6.6rem)] leading-[0.88] font-black tracking-[-0.065em] text-balance">
                        {activeSlide.title}
                    </h1>
                    <p className="mt-6 max-w-xl text-base leading-7 text-pretty opacity-90 sm:text-lg">
                        {activeSlide.description}
                    </p>
                    <Link
                        className="mt-8 inline-flex min-h-12 items-center rounded-full border-2 border-current px-6 py-3 text-sm font-black transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-current motion-reduce:transform-none"
                        href={activeSlide.href}
                    >
                        {activeSlide.linkLabel}
                    </Link>
                </div>
                <VinylArtwork theme={activeSlide.theme} />
            </div>
            <div className="absolute right-4 bottom-4 left-4 z-20 flex items-center justify-between gap-4 sm:right-8 sm:bottom-6 sm:left-8">
                <button
                    aria-label="Exibir banner anterior"
                    className="flex size-12 items-center justify-center rounded-full border border-current bg-black/10 text-xl font-bold backdrop-blur-sm transition-colors hover:bg-black/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-current"
                    onClick={showPrevious}
                    type="button"
                >
                    <span aria-hidden="true">←</span>
                </button>
                <div className="flex gap-2" role="group" aria-label="Banners">
                    {slides.map((slide, index) => (
                        <button
                            aria-label={`Exibir banner ${index + 1}: ${slide.title}`}
                            aria-pressed={index === activeIndex}
                            className={`min-h-11 min-w-11 rounded-full border-2 p-3 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-current before:block before:size-2 before:rounded-full before:bg-current ${index === activeIndex ? "bg-black/20" : "bg-transparent"}`}
                            key={slide.title}
                            onClick={() => setActiveIndex(index)}
                            type="button"
                        />
                    ))}
                </div>
                <button
                    aria-label="Exibir próximo banner"
                    className="flex size-12 items-center justify-center rounded-full border border-current bg-black/10 text-xl font-bold backdrop-blur-sm transition-colors hover:bg-black/20 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-current"
                    onClick={showNext}
                    type="button"
                >
                    <span aria-hidden="true">→</span>
                </button>
            </div>
        </section>
    );
}

function getThemeClasses(theme: (typeof slides)[number]["theme"]) {
    if (theme === "orange") {
        return "bg-[#B63E25] text-[#FFF8E8]";
    }

    if (theme === "blue") {
        return "bg-[#1C3F4A] text-[#F7EBC8]";
    }

    return "bg-[#452327] text-[#F3C76A]";
}

function VinylArtwork({ theme }: { theme: (typeof slides)[number]["theme"] }) {
    const labelColor =
        theme === "orange"
            ? "bg-[#F3C76A]"
            : theme === "blue"
              ? "bg-[#B63E25]"
              : "bg-[#F3C76A]";

    return (
        <div
            aria-hidden="true"
            className="relative mx-auto aspect-square w-[min(78vw,25rem)] md:w-full md:max-w-[27rem]"
        >
            <div className="absolute inset-[4%] rounded-full bg-[#151313] shadow-[0_1.5rem_3rem_rgba(0,0,0,0.3)] before:absolute before:inset-[9%] before:rounded-full before:border before:border-white/10 after:absolute after:inset-[18%] after:rounded-full after:border after:border-white/10" />
            <div className="absolute inset-[31%] rounded-full border-[0.55rem] border-[#F7E6C4]/70 bg-white/10" />
            <div
                className={`absolute inset-[39%] rounded-full ${labelColor}`}
            />
            <div className="absolute inset-[48%] rounded-full bg-[#241C19]" />
            <div className="absolute top-[3%] right-[3%] h-[94%] w-[12%] origin-top -rotate-12 rounded-full bg-[#F1E8D5] shadow-lg before:absolute before:right-[-20%] before:bottom-0 before:size-10 before:rounded-md before:bg-[#241C19]" />
        </div>
    );
}
