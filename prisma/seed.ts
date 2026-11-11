import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const categoryIds = {
    mpbAndSamba: "00000000-0000-4000-8000-000000000001",
    rock: "00000000-0000-4000-8000-000000000002",
    jazzAndBlues: "00000000-0000-4000-8000-000000000003",
    soulAndFunk: "00000000-0000-4000-8000-000000000004",
    pop: "00000000-0000-4000-8000-000000000005",
    electronic: "00000000-0000-4000-8000-000000000006",
} as const;

const categories = [
    {
        id: categoryIds.mpbAndSamba,
        name: "MPB e Samba",
        slug: "mpb-e-samba",
    },
    {
        id: categoryIds.rock,
        name: "Rock",
        slug: "rock",
    },
    {
        id: categoryIds.jazzAndBlues,
        name: "Jazz e Blues",
        slug: "jazz-e-blues",
    },
    {
        id: categoryIds.soulAndFunk,
        name: "Soul e Funk",
        slug: "soul-e-funk",
    },
    {
        id: categoryIds.pop,
        name: "Pop",
        slug: "pop",
    },
    {
        id: categoryIds.electronic,
        name: "Eletrônica",
        slug: "eletronica",
    },
] as const;

const productSeeds = [
    {
        sequence: 1,
        categoryId: categoryIds.mpbAndSamba,
        name: "Sol de Janeiro",
        slug: "sol-de-janeiro",
        artist: "Clara Vale",
        releaseYear: 1978,
        description:
            "Canções solares, violões suaves e uma seção rítmica inspirada nas tardes cariocas.",
        priceInCents: 8990,
        referencePriceInCents: 10990,
    },
    {
        sequence: 2,
        categoryId: categoryIds.mpbAndSamba,
        name: "Roda da Manhã",
        slug: "roda-da-manha",
        artist: "Trio Cedro",
        releaseYear: 1982,
        description:
            "Samba de roda e harmonias de MPB em um encontro acústico cheio de movimento.",
        priceInCents: 9490,
        referencePriceInCents: null,
    },
    {
        sequence: 3,
        categoryId: categoryIds.mpbAndSamba,
        name: "Mar Aberto",
        slug: "mar-aberto",
        artist: "Bento Luz",
        releaseYear: 1975,
        description:
            "Arranjos de cordas e percussão brasileira acompanham canções sobre estrada e litoral.",
        priceInCents: 11990,
        referencePriceInCents: null,
    },
    {
        sequence: 4,
        categoryId: categoryIds.mpbAndSamba,
        name: "Samba da Esquina",
        slug: "samba-da-esquina",
        artist: "Nara do Cais",
        releaseYear: 1986,
        description:
            "Percussão viva e refrões coletivos registram uma noite imaginária no centro da cidade.",
        priceInCents: 9990,
        referencePriceInCents: null,
    },
    {
        sequence: 5,
        categoryId: categoryIds.rock,
        name: "Cidade Elétrica",
        slug: "cidade-eletrica",
        artist: "Os Faroleiros",
        releaseYear: 1989,
        description:
            "Guitarras diretas e histórias urbanas em um disco de rock feito para tocar alto.",
        priceInCents: 10990,
        referencePriceInCents: 12990,
    },
    {
        sequence: 6,
        categoryId: categoryIds.rock,
        name: "Depois da Meia-Noite",
        slug: "depois-da-meia-noite",
        artist: "Linha de Fuga",
        releaseYear: 1994,
        description:
            "Rock alternativo de atmosfera noturna, baixo marcado e melodias que crescem a cada faixa.",
        priceInCents: 9990,
        referencePriceInCents: null,
    },
    {
        sequence: 7,
        categoryId: categoryIds.rock,
        name: "Concreto e Neon",
        slug: "concreto-e-neon",
        artist: "Banda Prisma",
        releaseYear: 1987,
        description:
            "Riffs angulares e sintetizadores discretos retratam uma metrópole inventada.",
        priceInCents: 12490,
        referencePriceInCents: null,
    },
    {
        sequence: 8,
        categoryId: categoryIds.rock,
        name: "Volume no Máximo",
        slug: "volume-no-maximo",
        artist: "Aurora Cinza",
        releaseYear: 2001,
        description:
            "Um álbum enérgico de refrões grandes, bateria acelerada e espírito de garagem.",
        priceInCents: 11490,
        referencePriceInCents: null,
    },
    {
        sequence: 9,
        categoryId: categoryIds.jazzAndBlues,
        name: "Azul ao Amanhecer",
        slug: "azul-ao-amanhecer",
        artist: "Quarteto Horizonte",
        releaseYear: 1964,
        description:
            "Piano espaçoso e sopros suaves conduzem um jazz contemplativo para as primeiras horas do dia.",
        priceInCents: 11990,
        referencePriceInCents: 13990,
    },
    {
        sequence: 10,
        categoryId: categoryIds.jazzAndBlues,
        name: "Rua sem Pressa",
        slug: "rua-sem-pressa",
        artist: "Lena Prado Ensemble",
        releaseYear: 1968,
        description:
            "Improvisos elegantes avançam como uma caminhada lenta entre cidades imaginárias.",
        priceInCents: 13490,
        referencePriceInCents: null,
    },
    {
        sequence: 11,
        categoryId: categoryIds.jazzAndBlues,
        name: "Último Trem",
        slug: "ultimo-trem",
        artist: "Miles Ventura",
        releaseYear: 1971,
        description:
            "Blues elétrico e metais precisos acompanham histórias de partidas e reencontros.",
        priceInCents: 10990,
        referencePriceInCents: null,
    },
    {
        sequence: 12,
        categoryId: categoryIds.jazzAndBlues,
        name: "Fumaça no Salão",
        slug: "fumaca-no-salao",
        artist: "Orquestra do Norte",
        releaseYear: 1959,
        description:
            "Metais em primeiro plano e contrabaixo pulsante recriam um clube de jazz cinematográfico.",
        priceInCents: 13990,
        referencePriceInCents: null,
    },
    {
        sequence: 13,
        categoryId: categoryIds.soulAndFunk,
        name: "Passos de Veludo",
        slug: "passos-de-veludo",
        artist: "Dora Blackwell",
        releaseYear: 1976,
        description:
            "Soul caloroso, vocais em camadas e linhas de baixo desenhadas para a pista.",
        priceInCents: 9490,
        referencePriceInCents: 11990,
    },
    {
        sequence: 14,
        categoryId: categoryIds.soulAndFunk,
        name: "Frequência Quente",
        slug: "frequencia-quente",
        artist: "Coletivo Magnético",
        releaseYear: 1980,
        description:
            "Funk de metais precisos, guitarras sincopadas e energia contínua do início ao fim.",
        priceInCents: 10990,
        referencePriceInCents: null,
    },
    {
        sequence: 15,
        categoryId: categoryIds.soulAndFunk,
        name: "Coração de Bronze",
        slug: "coracao-de-bronze",
        artist: "Isaac Monte",
        releaseYear: 1973,
        description:
            "Baladas soul e faixas dançantes se alternam em uma produção rica em cordas.",
        priceInCents: 12990,
        referencePriceInCents: null,
    },
    {
        sequence: 16,
        categoryId: categoryIds.soulAndFunk,
        name: "Noite Magnética",
        slug: "noite-magnetica",
        artist: "The Golden Lines",
        releaseYear: 1979,
        description:
            "Grooves longos, palmas e vozes coletivas mantêm a pista acesa até a última faixa.",
        priceInCents: 11490,
        referencePriceInCents: null,
    },
    {
        sequence: 17,
        categoryId: categoryIds.pop,
        name: "Cartas Coloridas",
        slug: "cartas-coloridas",
        artist: "Lia Violeta",
        releaseYear: 2012,
        description:
            "Pop melódico com letras leves, sintetizadores brilhantes e refrões imediatos.",
        priceInCents: 8990,
        referencePriceInCents: 9990,
    },
    {
        sequence: 18,
        categoryId: categoryIds.pop,
        name: "Satélite Particular",
        slug: "satelite-particular",
        artist: "Caio Atlas",
        releaseYear: 2018,
        description:
            "Canções sobre distância e reencontros em uma produção pop de escala cinematográfica.",
        priceInCents: 10490,
        referencePriceInCents: null,
    },
    {
        sequence: 19,
        categoryId: categoryIds.pop,
        name: "Luzes da Varanda",
        slug: "luzes-da-varanda",
        artist: "Maya Flores",
        releaseYear: 2020,
        description:
            "Pop intimista que combina voz próxima, bateria eletrônica e violões delicados.",
        priceInCents: 9990,
        referencePriceInCents: null,
    },
    {
        sequence: 20,
        categoryId: categoryIds.pop,
        name: "Domingo Infinito",
        slug: "domingo-infinito",
        artist: "Duo Alameda",
        releaseYear: 2015,
        description:
            "Duas vozes e arranjos ensolarados transformam cenas cotidianas em canções pop.",
        priceInCents: 9490,
        referencePriceInCents: null,
    },
    {
        sequence: 21,
        categoryId: categoryIds.electronic,
        name: "Pulso Orbital",
        slug: "pulso-orbital",
        artist: "Núcleo 84",
        releaseYear: 2019,
        description:
            "Batidas precisas e texturas espaciais constroem uma viagem eletrônica de pista.",
        priceInCents: 10990,
        referencePriceInCents: 12990,
    },
    {
        sequence: 22,
        categoryId: categoryIds.electronic,
        name: "Circuito das Águas",
        slug: "circuito-das-aguas",
        artist: "Maré Modular",
        releaseYear: 2017,
        description:
            "Camadas ambientes encontram ritmos quebrados em uma paisagem sonora fluida.",
        priceInCents: 9990,
        referencePriceInCents: null,
    },
    {
        sequence: 23,
        categoryId: categoryIds.electronic,
        name: "Eco de Cromo",
        slug: "eco-de-cromo",
        artist: "Lumen Data",
        releaseYear: 2021,
        description:
            "Electro detalhista com graves secos, timbres metálicos e pausas cuidadosamente desenhadas.",
        priceInCents: 12490,
        referencePriceInCents: null,
    },
    {
        sequence: 24,
        categoryId: categoryIds.electronic,
        name: "Horizonte Binário",
        slug: "horizonte-binario",
        artist: "Ana Vetor",
        releaseYear: 2023,
        description:
            "Sintetizadores analógicos e batidas minimalistas formam um álbum de contrastes digitais.",
        priceInCents: 11990,
        referencePriceInCents: null,
    },
] as const;

const products = productSeeds.map(({ sequence, ...product }) => ({
    id: `10000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
    ...product,
    coverPath: "/images/album-placeholder.svg",
    isActive: true,
}));

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL nao esta definida.");
}

const adapter = new PrismaPg({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
});
const prisma = new PrismaClient({ adapter });

async function main() {
    for (const category of categories) {
        const { id, ...data } = category;

        await prisma.category.upsert({
            where: { id },
            create: { id, ...data },
            update: data,
        });
    }

    for (const product of products) {
        const { id, ...data } = product;

        await prisma.product.upsert({
            where: { id },
            create: { id, ...data },
            update: data,
        });
    }

    console.log(
        `Seed concluido: ${categories.length} categorias e ${products.length} produtos processados.`,
    );
}

try {
    await main();
} finally {
    await prisma.$disconnect();
}
