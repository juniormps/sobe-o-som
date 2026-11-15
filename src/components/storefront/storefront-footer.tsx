export function StorefrontFooter() {
    return (
        <footer className="bg-black px-5 py-14 text-[#C9C1B7] sm:px-8 lg:px-10">
            <div className="mx-auto grid w-full max-w-[90rem] gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
                <div>
                    <p className="text-3xl font-black tracking-[-0.055em] text-[#FAF7F0]">
                        SOBE O SOM
                    </p>
                    <p className="mt-3 max-w-sm leading-7">
                        Discos para ouvir, capas para guardar. Uma loja
                        demonstrativa para descobrir música em vinil.
                    </p>
                </div>
                <FooterGroup title="Institucional">
                    <FooterItem label="Sobre a Sobe o Som" />
                    <FooterItem label="Contato" />
                </FooterGroup>
                <FooterGroup title="Ajuda">
                    <FooterItem label="Trocas e devoluções" />
                    <FooterItem label="Política de trocas e devoluções" />
                    <FooterItem label="Política de privacidade" />
                </FooterGroup>
                <FooterGroup title="Formas de pagamento">
                    <p className="text-sm leading-6">
                        Compra simulada. Nenhuma cobrança é realizada e não há
                        meios de pagamento operacionais.
                    </p>
                </FooterGroup>
            </div>
            <div className="mx-auto mt-12 w-full max-w-[90rem] border-t border-white/20 pt-7 text-sm leading-6">
                <p>
                    Projeto demonstrativo: não realiza cobranças, fretes ou
                    entregas reais.
                </p>
                <p className="mt-2 text-[#9D948E]">
                    O carrinho não reserva estoque. Checkout, pedidos e o
                    conteúdo completo de privacidade permanecem pendentes antes
                    da publicação da V1.
                </p>
            </div>
        </footer>
    );
}

function FooterGroup({
    children,
    title,
}: {
    children: React.ReactNode;
    title: string;
}) {
    return (
        <section>
            <h2 className="text-sm font-black tracking-[0.12em] text-[#FAF7F0] uppercase">
                {title}
            </h2>
            <div className="mt-4 space-y-3">{children}</div>
        </section>
    );
}

function FooterItem({ label }: { label: string }) {
    return (
        <p className="text-sm leading-6">
            {label} <span className="text-[#F3C76A]">· Em breve</span>
        </p>
    );
}
