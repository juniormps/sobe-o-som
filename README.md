<h1 align="center">🎶 Sobe o Som</h1>

<p align="center">
    <strong>Discos para ouvir, capas para guardar.</strong>
</p>

<p align="center">
    E-commerce demonstrativo de discos de vinil, desenvolvido como projeto independente de estudo e portfólio.
</p>

<p align="center">
    <img src="https://img.shields.io/badge/status-em_desenvolvimento-F3C76A?style=for-the-badge&amp;labelColor=241C19" alt="Status: em desenvolvimento" />
    <img src="https://img.shields.io/badge/projeto-full_stack-B63E25?style=for-the-badge&amp;labelColor=241C19" alt="Projeto full stack" />
    <img src="https://img.shields.io/badge/compras-simuladas-452327?style=for-the-badge&amp;labelColor=241C19" alt="Compras simuladas" />
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Next.js-16-000000?style=flat-square&amp;logo=nextdotjs&amp;logoColor=white" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-149ECA?style=flat-square&amp;logo=react&amp;logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&amp;logo=typescript&amp;logoColor=white" alt="TypeScript em modo estrito" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&amp;logo=tailwindcss&amp;logoColor=white" alt="Tailwind CSS 4" />
    <img src="https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&amp;logo=prisma&amp;logoColor=white" alt="Prisma 7" />
    <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&amp;logo=postgresql&amp;logoColor=white" alt="PostgreSQL 16" />
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Node.js-24-5FA04E?style=flat-square&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js 24" />
    <img src="https://img.shields.io/badge/NextAuth-4-7C3AED?style=flat-square" alt="NextAuth 4" />
    <img src="https://img.shields.io/badge/ESLint-9-4B32C3?style=flat-square&amp;logo=eslint&amp;logoColor=white" alt="ESLint 9" />
    <img src="https://img.shields.io/badge/Prettier-3-F7B93E?style=flat-square&amp;logo=prettier&amp;logoColor=black" alt="Prettier 3" />
</p>

<p align="center">
    <a href="#sobre">Sobre</a> ·
    <a href="#funcionalidades">Funcionalidades</a> ·
    <a href="#tecnologias">Tecnologias</a> ·
    <a href="#execucao">Executar localmente</a> ·
    <a href="#roadmap">Roadmap</a>
</p>

> 🚧 **Projeto em desenvolvimento.** A base full stack, o banco de dados, o estoque persistido, o cadastro, os logins com credenciais e Google, a vitrine pública e o carrinho persistente já estão implementados. Checkout e pedidos serão entregues nas próximas etapas. Este README diferencia os recursos disponíveis dos planejados.

---

## 📋 Índice

- [Sobre o projeto](#sobre)
- [Estado atual](#estado-atual)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura e organização](#arquitetura)
- [Banco de dados](#banco-de-dados)
- [Autenticação e segurança](#autenticacao)
- [Mobile First e acessibilidade](#experiencia)
- [Execução local](#execucao)
- [Qualidade e testes](#qualidade)
- [Scripts disponíveis](#scripts)
- [Roadmap](#roadmap)
- [Documentação](#documentacao)
- [Autor](#autor)

---

<a id="sobre"></a>

## 💡 Sobre o projeto

O **Sobe o Som** está sendo desenvolvido para oferecer uma experiência de loja de discos: descobrir álbuns, explorar gêneros musicais, montar um carrinho e registrar pedidos demonstrativos.

A primeira versão utiliza **Next.js como aplicação full stack**, com React, TypeScript, Tailwind CSS, Prisma e PostgreSQL. O desenvolvimento segue uma abordagem **Mobile First**, com responsividade e acessibilidade como requisitos para a construção das telas.

O projeto reúne desafios de uma aplicação de comércio eletrônico:

- modelagem relacional e evolução do banco com migrações;
- autenticação social e gerenciamento de sessão;
- catálogo com busca, filtros, promoções e paginação;
- persistência do carrinho no navegador;
- validação de dados e cálculo de valores no servidor;
- criação consistente de pedidos, baixa transacional de estoque e autorização por usuário;
- múltiplos endereços por cliente e preenchimento assistido por CEP;
- testes de comportamento, documentação e integração contínua.

Esses recursos serão implementados de forma incremental, conforme o [roadmap](#roadmap).

**Limites da demonstração:** a loja será apresentada em português do Brasil, com valores em reais. A V1 incluirá múltiplos endereços por cliente, consulta de CEP e controle de estoque demonstrativo, com baixa transacional na confirmação do pedido. As compras serão simuladas, sem cobrança, integração de pagamento, cálculo de frete ou entrega real. O checkout solicitará endereço, mas não cartão ou CPF. Não haverá reserva de estoque nem cancelamento de pedidos na V1.

---

<a id="estado-atual"></a>

## 📌 Estado atual

| Área                            | Situação                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Base da aplicação               | ✅ Next.js, App Router, TypeScript estrito e Tailwind configurados              |
| Persistência                    | ✅ Prisma, PostgreSQL, migrações e seed com 6 gêneros e 24 discos fictícios     |
| Base de estoque                 | ✅ Saldo não negativo no PostgreSQL e seed sem reposição de estoques existentes |
| Autenticação                    | ✅ Cadastro, e-mail/senha, Google, logout, limites persistentes e sessão JWT    |
| Verificações de desenvolvimento | ✅ Carrinho, catálogo, autenticação, estoque, formatação, lint, tipos e build   |
| Interface da loja               | ✅ Home, navegação, busca, filtros, paginação, detalhes e estados responsivos   |
| Estados de disponibilidade      | ✅ Disponível, esgotado, conflito de saldo e produto indisponível no carrinho   |
| Carrinho                        | ✅ Context + reducer, persistência local, revalidação em lote e sincronização   |
| Fluxo de compra                 | ⏳ Endereços, CEP, checkout simulado e pedidos planejados                       |
| Proteção de operações           | ✅ Origem do cadastro, CSRF do NextAuth e helper de identidade autenticada      |
| Testes da loja, CI e publicação | ⏳ Previstos para a primeira versão completa                                    |
| API Nest.js e Docker            | 🔜 Evolução posterior à entrega da V1                                           |

A página inicial é a vitrine Mobile First em português do Brasil. A publicação da demonstração, os previews e a validação visual final em navegadores reais fazem parte da entrega da V1.

---

<a id="funcionalidades"></a>

## ✨ Funcionalidades

### ✅ Disponíveis nesta etapa

- Cadastro em `/cadastro` e login por e-mail/senha ou Google em `/login`.
- Senhas de 8 a 128 caracteres, incluindo frases-senha, espaços e Unicode, armazenadas somente como hash scrypt versionado.
- Limitação persistente e concorrente de cadastro e login no PostgreSQL.
- Criação de usuário e vínculo social no primeiro acesso válido.
- Reutilização da identidade do provedor em acessos posteriores.
- Sessão JWT gerenciada pelo NextAuth, com identificação do usuário na interface.
- Tratamento de cancelamento e falhas de autenticação.
- Base de catálogo persistida, com categorias, produtos, preços e dados de promoção.
- Saldo inteiro não negativo por produto, com default zero e `CHECK` no PostgreSQL.
- Seed reproduzível que define o estoque somente na criação e não repõe saldos existentes.
- Home com header, busca, categorias, Sale, carrossel manual, catálogo paginado e footer.
- Busca por álbum ou artista, filtros combináveis e estado preservado na URL.
- Cards e detalhes de discos com preço promocional válido e disponibilidade consultada no servidor.
- Produtos ativos esgotados visíveis e produtos inativos ou inexistentes tratados como não encontrados.
- Estados responsivos de carregamento, vazio, erro recuperável e página não encontrada.
- Carrinho público com uma linha por produto, quantidades de 1 a 99 e até 50 produtos distintos.
- Persistência versionada no navegador, preservação no login e limpeza no logout ou troca de conta.
- Sincronização do carrinho entre abas e indicador no header pela soma das unidades.
- Revalidação em lote de preços, atividade e estoque por `POST /api/cart/resolve`, sem reserva ou escrita no banco.
- Página `/carrinho` com subtotais em centavos, total estimado, edição, remoção, conflitos de estoque e falha recuperável.

A vitrine e o carrinho apenas consultam o estoque persistido. A baixa condicional, a transação do pedido e os testes de concorrência pertencem à M5.2.

### 🛍️ Catálogo e descoberta — disponíveis

- Vitrine com capas, títulos, artistas e preços.
- Busca por álbum ou artista.
- Filtros por gênero e seleção **Sale**, combináveis com a busca.
- Filtros preservados na URL e listagem paginada.
- Página de produto com descrição, ano de lançamento, gênero e disponibilidade.
- Produtos ativos esgotados ainda visíveis, identificados como **Esgotado** e sem novas adições.
- Cabeçalho com busca e categorias, carrossel editorial e rodapé institucional.
- Estados de carregamento, erro, catálogo vazio e produto não encontrado.

### 🛒 Carrinho — disponível

- Adicionar e remover discos, alterar quantidades e visualizar subtotal.
- Persistir o carrinho no mesmo navegador, inclusive para visitantes.
- Preservar os itens ao entrar na conta e limpar o carrinho ao sair.
- Revalidar produtos, disponibilidade e preços no servidor.
- Preservar itens em conflito quando o estoque diminuir, permitindo reduzir ou remover.
- Tratar itens inativos ou inexistentes sem expor dados internos e sem apresentar total parcial como completo.
- Continuar em memória quando o armazenamento falhar e permitir repetir consultas temporariamente indisponíveis.

### 🧾 Checkout — planejado

- Exigir autenticação para concluir a compra simulada.
- Informar mudanças de preço antes da confirmação.
- Solicitar endereço brasileiro, selecionar o principal por padrão e permitir escolher ou cadastrar outro no checkout.
- Preencher dados disponíveis por CEP via servidor, sem impedir preenchimento manual quando a consulta falhar.
- Não reservar estoque; confirmar a disponibilidade somente ao registrar o pedido.
- Prevenir pedidos duplicados por clique duplo ou repetição da mesma tentativa.

### 📦 Conta e pedidos

- Cadastro e login com e-mail e senha, além do Google, estão disponíveis.
- Vinculação de métodos, recuperação de senha e gerenciamento de perfil permanecem fora da V1.
- Múltiplos endereços vinculados ao cliente, inicialmente cadastrados e selecionados dentro do checkout.
- Criação do pedido, dos itens, da cópia do endereço confirmado e da baixa condicional de estoque em uma única transação.
- Confirmação com identificador, data, itens e total.
- Histórico paginado e detalhes acessíveis somente ao dono do pedido.
- Preservação do título, artista e preço de cada item no momento da compra.

---

<a id="tecnologias"></a>

## 🛠️ Tecnologias

### Em uso

| Tecnologia                      | Aplicação no projeto                             |
| ------------------------------- | ------------------------------------------------ |
| **Next.js 16 + App Router**     | Estrutura full stack, páginas e Route Handlers   |
| **React 19**                    | Interface e componentes interativos              |
| **TypeScript**                  | Tipagem estática em modo estrito                 |
| **Tailwind CSS 4**              | Estilização da interface                         |
| **Node.js 24**                  | Ambiente de execução                             |
| **Prisma 7**                    | Modelagem, migrações e acesso tipado aos dados   |
| **PostgreSQL 16**               | Persistência relacional                          |
| **`@prisma/adapter-pg` + `pg`** | Conexão do Prisma com PostgreSQL                 |
| **NextAuth 4 + Prisma Adapter** | Login com Google, vínculo de contas e sessão JWT |
| **ESLint + Prettier**           | Análise estática e padronização do código        |

As versões instaladas e os scripts estão registrados em [`package.json`](package.json) e [`package-lock.json`](package-lock.json).

### Planejadas

| Tecnologia                  | Finalidade                                         | Etapa |
| --------------------------- | -------------------------------------------------- | ----- |
| **Vitest**                  | Testes de regras de negócio                        | V1    |
| **React Testing Library**   | Testes de comportamento dos componentes            | V1    |
| **Playwright**              | Testes do fluxo completo no navegador              | V1    |
| **GitHub Actions**          | Integração contínua com verificações automatizadas | V1    |
| **Nest.js**                 | API separada para regras de negócio e persistência | V2    |
| **Docker + Docker Compose** | Ambiente reproduzível para aplicação e banco       | V2    |

---

<a id="arquitetura"></a>

## 🏗️ Arquitetura e organização

Na V1, interface e backend pertencem à mesma aplicação Next.js. O Prisma é utilizado exclusivamente no servidor, e o NextAuth atende as rotas de autenticação.

O diagrama representa a base de autenticação já implementada:

```mermaid
flowchart TD
Browser["Navegador"] --> Pages["Páginas Next.js / React"]
    Pages --> Cart["Context + reducer / localStorage"]
    Cart --> CartResolve["POST /api/cart/resolve"]
    CartResolve --> Prisma
    Pages --> Auth["NextAuth / Route Handler"]
    Pages --> Register["POST /api/auth/register"]
    Auth <--> Google["Google OAuth"]
    Register --> Prisma
    Auth --> Prisma["Prisma Adapter / Prisma Client"]
    Prisma --> Database[(PostgreSQL)]
```

Para os próximos módulos, a organização prevista separa apresentação, regras de negócio e acesso aos dados. Server Components serão usados nas páginas de dados; Client Components, nas interações. As operações da loja utilizarão Server Actions quando apropriado, mantendo validação e autorização no servidor. A consulta planejada de CEP será a exceção HTTP explícita: `GET /api/cep/[cep]` consultará o ViaCEP pelo servidor e enviará ao provedor somente os oito dígitos necessários.

### Estrutura atual

| Caminho                      | Responsabilidade                                           |
| ---------------------------- | ---------------------------------------------------------- |
| `src/app/`                   | Páginas, layout, estilos globais e rotas do App Router     |
| `src/app/login/`             | Entrada por e-mail/senha ou Google e logout                |
| `src/app/cadastro/`          | Cadastro por credenciais ou acesso pelo Google             |
| `src/app/produtos/`          | Detalhes públicos dos discos                               |
| `src/app/carrinho/`          | Página pública do carrinho                                 |
| `src/app/api/cart/resolve/`  | Revalidação pública, em lote e somente leitura             |
| `src/app/api/auth/`          | NextAuth e operação protegida de cadastro                  |
| `src/components/cart/`       | Provider, ações e interface do carrinho                    |
| `src/components/storefront/` | Componentes compartilhados da vitrine                      |
| `src/lib/auth.ts`            | Configuração da autenticação                               |
| `src/lib/auth-rules.ts`      | Regras auxiliares de autenticação                          |
| `src/lib/catalog-*.ts`       | Normalização, consultas e fronteira de dados do catálogo   |
| `src/lib/prisma.ts`          | Acesso ao Prisma no servidor                               |
| `src/types/`                 | Tipos complementares, incluindo a sessão                   |
| `prisma/`                    | Schema, migrações e seed                                   |
| `prisma.config.ts`           | Configuração de URLs, migrações e seed                     |
| `scripts/`                   | Verificações de catálogo, estoque, autenticação e ambiente |
| `public/images/`             | Recursos visuais locais                                    |
| `docs/`                      | Escopo e documentação técnica                              |

O código utiliza o alias `@/*` para importações a partir de `src/`. As páginas consultam módulos exclusivos do servidor diretamente, sem HTTP interno. `catalog-repository.ts` concentra os predicados Prisma e retornos explícitos; `catalog-data.ts` adiciona a fronteira de requisição do Next e preserva a inicialização tardia de `getPrisma()`.

O layout raiz continua como Server Component e delega os providers a um componente cliente único. O carrinho usa Context API e reducer, persiste somente versão, UUID mínimo do proprietário e pares de produto/quantidade. Preços, disponibilidade e estoque são resolvidos no servidor em uma consulta em lote. O identificador local evita transferência entre contas no mesmo navegador, mas não comprova autenticação nem substitui a sessão HttpOnly. Sincronizações de carrinho atribuído aguardam a sessão da outra aba para não apagar os itens durante o retorno do Google; o logout, por decisão de privacidade, descarta itens locais e sincronizações pendentes.

Busca, gênero, Sale e página usam `busca`, `genero`, `sale=true` e `pagina` na URL. Parâmetros repetidos ou inválidos são removidos; espaços da busca são normalizados e a entrada é limitada a 80 caracteres; páginas fora do intervalo são ajustadas depois da contagem e antes do cálculo do `offset`. A URL canônica resultante substitui a entrada inválida. Alterar busca ou filtros reinicia a página, enquanto a troca de gênero preserva busca e Sale. “Todos os discos” preserva a busca e limpa gênero e Sale.

### Evolução para a V2

Após a conclusão da V1, o backend será migrado para uma API **Nest.js**, preservando o frontend em Next.js e os dados do produto. A API assumirá também endereços, consulta de CEP e regras de estoque e pedidos. Essa etapa acrescentará Docker, documentação HTTP, testes de integração mais abrangentes e a apresentação e o registro versionado do aviso de privacidade.

A migração será uma evolução do mesmo projeto; a primeira versão terá sua própria entrega funcional.

---

<a id="banco-de-dados"></a>

## 🗄️ Banco de dados

### Modelos implementados

| Modelo          | Responsabilidade                                                     |
| --------------- | -------------------------------------------------------------------- |
| `Category`      | Gênero musical, com nome e slug únicos                               |
| `Product`       | Álbum, artista, descrição, capa, preços, estoque, status e categoria |
| `User`          | Identidade interna, e-mail único e credencial local opcional         |
| `Account`       | Vínculo entre usuário e identidade OAuth do provedor                 |
| `AuthRateLimit` | Janelas e contadores técnicos de tentativas de autenticação          |

Uma categoria possui vários produtos; um usuário pode possuir vínculos de autenticação. A combinação `provider` + `providerAccountId` é única.

Os modelos `Address`, `Order` e `OrderItem` e o registro versionado de ciência/aceite de privacidade são planejados, não implementados. Não há tabela `Session`, pois a estratégia atual utiliza JWT.

### Decisões de modelagem

- **Valores monetários em centavos inteiros**, com restrições de integridade para os preços.
- **ID e slug únicos por produto**, permitindo álbuns com títulos iguais de artistas ou edições diferentes.
- **Sale derivada dos preços:** o preço de referência representa o valor anterior e deve ser maior que o preço atual. A promoção preserva o gênero do disco.
- **Migrações versionadas**, mantendo o histórico de evolução do banco.
- **Seed idempotente**, com `upsert` e UUIDs estáveis, sem remoção de registros.

`Product.stock` é um inteiro não negativo com default zero, protegido também por `CHECK (stock >= 0)` no PostgreSQL. A migração inicializa uma única vez somente os UUIDs demonstrativos conhecidos; outros produtos preexistentes permanecem com zero. O seed aplica estoques pequenos apenas ao criar produtos e não repõe saldos consumidos nem apaga usuários, contas ou outros registros quando é reexecutado.

O seed disponibiliza **6 gêneros e 24 discos fictícios**. As capas usam temporariamente [`album-placeholder.svg`](public/images/album-placeholder.svg) e serão substituídas por imagens próprias ou licenciadas.

O projeto utiliza Prisma **7.10.1**, gerador `prisma-client` com saída explícita e adaptador `@prisma/adapter-pg`. O cliente gerado fica em `src/generated/prisma`.

---

<a id="autenticacao"></a>

## 🔐 Autenticação e segurança

### Implementação atual

- **Credentials Provider e Google**, integrados à mesma sessão do NextAuth 4.
- Cadastro com nome, e-mail normalizado e senha de 8 a 128 caracteres, sem regras artificiais de composição.
- Hash scrypt assíncrono versionado com `N=131072`, `r=8`, `p=1`, salt aleatório e comparação segura.
- Até duas derivações scrypt simultâneas por processo, evitando pressão de memória sem fila ilimitada.
- Contadores persistentes com janelas fixas e operações atômicas antes do scrypt: login por identificador, 5 tentativas em 15 minutos; cadastro por identificador, 3 em 60 minutos; limites globais de 100 logins e 30 cadastros em 10 minutos.
- Criação de `User` e `Account` no primeiro login Google válido; credenciais criam somente `User` no cadastro.
- Identificação de retornos pelo identificador estável do Google.
- Normalização de e-mail com remoção de espaços externos e conversão para minúsculas.
- Rejeição de perfis sem e-mail utilizável ou sem confirmação de e-mail pelo provedor.
- Ausência de vinculação automática de contas apenas por igualdade de e-mail.
- Sessão JWT gerenciada em **cookie HttpOnly**, sem armazenamento de autenticação em `localStorage`.
- Sessão pública limitada à expiração e aos dados necessários de identificação, incluindo o UUID interno do usuário.
- Validação dos destinos de retorno, evitando redirecionamentos externos indevidos.
- Retornos aceitos somente para `/`, `/login` e `/carrinho`, preservados entre login e cadastro.
- Cadastro JSON limitado a 8 KiB, mesma origem obrigatória e respostas sem cache; o NextAuth mantém CSRF e cookies do login.
- Segredos restritos ao servidor e configuração validada quando a autenticação é utilizada.

`session.maxAge` e `jwt.maxAge` estão configurados para **sete dias**. O NextAuth pode renovar a validade durante o uso da sessão. O logout remove o cookie do navegador; a estratégia atual não mantém registros de sessão no banco para revogação individual em outros dispositivos.

O fluxo real com Google já foi validado para primeiro acesso, persistência após atualização, cancelamento, logout seguido de atualização e novo login com a mesma conta. Este último manteve somente um `User` e um `Account`.

### Limites e próximas etapas

O helper exclusivo do servidor obtém a identidade da sessão e confirma a existência do usuário; endereços, checkout e pedidos deverão usá-lo nos respectivos marcos, sem confiar em `userId` ou proprietário de carrinho enviado pelo navegador. Recuperação e verificação de e-mail, vinculação de métodos e definição de senha para conta Google permanecem fora desta entrega.

Como a aplicação local atual não está atrás de um proxy confiável, cabeçalhos como `X-Forwarded-For` não são usados para identificar IP. O limite agregado global complementa o limite por identificador. Na publicação, a cadeia de proxies deverá ser definida e validada antes de acrescentar uma chave derivada de IP confiável; nunca se deve aceitar indiscriminadamente um valor enviado pelo cliente.

Detalhes da estratégia e das verificações estão em [`docs/auth-model.md`](docs/auth-model.md).

---

<a id="experiencia"></a>

## 📱 Mobile First e acessibilidade

**Mobile First e responsividade são requisitos de toda a interface.** A vitrine e o login partem de telas móveis e se adaptam progressivamente para tablets, notebooks e desktops.

A interface comercial implementada contempla:

- layouts flexíveis e leitura confortável em diferentes larguras;
- busca, categorias e ações acessíveis em telas pequenas;
- áreas de toque adequadas e ações que não dependam apenas de hover;
- navegação por teclado e foco visível;
- rótulos de formulário e mensagens de erro associadas aos campos;
- textos alternativos, contraste e estrutura semântica;
- carrossel com controles acessíveis;
- respeito à preferência de redução de movimento.

A identidade visual terá **cabeçalho e catálogo brancos**, faixa com o slogan da marca e **rodapé preto**, valorizando as capas dos discos.

O carrossel é manual, sem autoplay, e renderiza somente o conteúdo do slide ativo. O responsável confirmou a revisão manual nas larguras de referência da M2; validações adicionais com tecnologias assistivas e a revisão completa da V1 permanecem necessárias antes da publicação.

---

<a id="execucao"></a>

## 💻 Execução local

### Pré-requisitos

| Ferramenta | Versão de referência |
| ---------- | -------------------- |
| Node.js    | `24.13.0`            |
| npm        | `11.6.2`             |
| PostgreSQL | `16`                 |

### 1. Clone e instale

```bash
git clone https://github.com/juniormps/sobe-o-som.git
cd sobe-o-som
nvm use
npm ci
```

O comando `nvm use` utiliza a versão registrada em `.nvmrc`. Se você não usa NVM, configure a versão indicada do Node.js pelo seu gerenciador de preferência.

O `postinstall` gera o Prisma Client sem abrir conexão com o banco e sem exigir credenciais reais.

### 2. Configure os bancos e as variáveis

Crie três bancos PostgreSQL distintos, com acesso pelo usuário configurado no ambiente:

| Banco sugerido      | Uso                                   |
| ------------------- | ------------------------------------- |
| `sobe_o_som_dev`    | Dados da aplicação em desenvolvimento |
| `sobe_o_som_shadow` | Banco auxiliar do Prisma Migrate      |
| `sobe_o_som_test`   | Verificações isoladas com PostgreSQL  |

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Preencha o `.env` com os valores do seu ambiente:

| Variável               | Finalidade                                               |
| ---------------------- | -------------------------------------------------------- |
| `DATABASE_URL`         | Conexão com o banco principal                            |
| `SHADOW_DATABASE_URL`  | Conexão com o banco auxiliar de migrações                |
| `TEST_DATABASE_URL`    | Conexão local exclusiva com `sobe_o_som_test`            |
| `NEXTAUTH_URL`         | Origem da aplicação; localmente, `http://localhost:3000` |
| `NEXTAUTH_SECRET`      | Segredo aleatório e exclusivo do ambiente                |
| `GOOGLE_CLIENT_ID`     | Identificador do cliente OAuth do Google                 |
| `GOOGLE_CLIENT_SECRET` | Segredo do cliente OAuth do Google                       |

Os valores de `.env.example` são fictícios e devem ser substituídos. O `.env` permanece ignorado pelo Git. A configuração utiliza os nomes do **NextAuth 4**, como `NEXTAUTH_SECRET`.

Para usar o login com Google, configure um cliente OAuth para aplicação web e cadastre o callback local:

```text
http://localhost:3000/api/auth/callback/google
```

O banco shadow é usado exclusivamente por `migrate dev` para reaplicar o histórico e detectar divergências. Ele pode ser limpo pelo Prisma e não deve conter dados da aplicação. O script do projeto verifica as URLs e impede que banco principal e shadow apontem para o mesmo destino.

`stock:verify` exige `TEST_DATABASE_URL`, aceita somente o banco local `sobe_o_som_test` e recusa os destinos principal e shadow. O comando não usa fallback para `DATABASE_URL`, aplica as migrações com `migrate deploy` e restringe as escritas e a limpeza aos dados controlados nesse banco.

### 3. Prepare o banco

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate
npm run prisma:seed
```

Com um banco shadow dedicado previamente criado, o usuário local não precisa da permissão `CREATEDB` para esse fluxo.

### 4. Inicie a aplicação

```bash
npm run dev
```

- Aplicação: [http://localhost:3000](http://localhost:3000)
- Autenticação: [http://localhost:3000/login](http://localhost:3000/login)
- Carrinho: [http://localhost:3000/carrinho](http://localhost:3000/carrinho)

### Build de produção

```bash
npm run build
npm start
```

O build gera o Prisma Client e compila a aplicação. A configuração de banco e autenticação é inicializada somente nas requisições que precisam dela, permitindo gerar o build sem conexão com o banco ou segredos reais.

**Build e `postinstall` não executam migrações nem seed.** O ambiente em execução precisa das variáveis correspondentes aos recursos utilizados. Variáveis obrigatórias ausentes e o placeholder de `NEXTAUTH_SECRET` são rejeitados, sem fallback para credenciais fictícias.

<details>
<summary><strong>Variáveis exigidas por operação</strong></summary>

| Operação                                                                                 | Variáveis necessárias                                                                          |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `prisma:generate`, `prisma:validate`, `postinstall` e `build`                            | Não exigem conexão com o banco nem segredos reais de autenticação                              |
| Acesso ao banco pela aplicação, `prisma:seed`, `prisma:studio` e `prisma:migrate:status` | `DATABASE_URL`                                                                                 |
| Requisições de autenticação                                                              | `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` |
| `prisma:migrate` em desenvolvimento                                                      | `DATABASE_URL` e `SHADOW_DATABASE_URL`, apontando para bancos distintos                        |
| Migrações no futuro ambiente de produção                                                 | `DATABASE_URL`, sem banco shadow                                                               |
| `stock:verify`                                                                           | `TEST_DATABASE_URL` local apontando exclusivamente para `sobe_o_som_test`                      |
| `catalog:verify`                                                                         | `TEST_DATABASE_URL` local apontando exclusivamente para `sobe_o_som_test`                      |
| `cart:verify`                                                                            | Não exige banco; usa consulta controlada em memória                                            |
| `credentials:verify`                                                                     | `TEST_DATABASE_URL` local apontando exclusivamente para `sobe_o_som_test`                      |

</details>

---

<a id="qualidade"></a>

## 🧪 Qualidade e testes

### Verificações disponíveis

```bash
npm run auth:verify
npm run credentials:verify
npm run cart:verify
npm run catalog:verify
npm run stock:verify
npm run format:check
npm run lint
npm run typecheck
npm run build
```

O script `auth:verify` verifica regras de autenticação, incluindo normalização de e-mail, rejeição de perfis inválidos, destinos de retorno e conteúdo público da sessão. Ele complementa a validação manual do OAuth real com Google.

`credentials:verify` aplica as migrações no PostgreSQL local isolado, usa somente fixtures controladas e cobre validação, scrypt, conflitos e concorrência de cadastro, conta Google sem senha, origem, limites e expiração. Também inicia a aplicação com saída de build isolada e percorre o callback real do Credentials Provider com CSRF, cookies e sessão pública; não automatiza nem declara o OAuth real do Google.

`cart:verify` verifica consolidação, edição, remoção, limites, estoque conhecido, centavos, preço promocional atual, persistência inválida, ciclo de sessão, consulta em lote, indisponibilidade, falha recuperável e descarte de respostas antigas. A suíte usa regras e fronteiras reais com uma consulta controlada em memória; não cria fixtures nem escreve em nenhum banco.

`catalog:verify` usa os módulos reais de consulta e o PostgreSQL local isolado `sobe_o_som_test`. Ele verifica busca por título e artista, filtros combinados, Sale com esgotado, paginação e ordenação, parâmetros inválidos, vazio, exclusão de inativos e detalhes inexistentes. O script aplica migrações e seed no banco de teste e cria apenas uma fixture inativa controlada, removida ao final.

`stock:verify` usa PostgreSQL real no banco isolado: confere o default, a restrição para negativos, os saldos de criação e a preservação de quantidades e identidades após reexecutar o seed. O seed não é um comando de reposição. A baixa transacional e os cenários concorrentes de pedidos permanecem para a M5.2.

### Validações manuais

O responsável pelo projeto confirmou no navegador:

- busca por álbum e artista e combinação com gênero e Sale;
- paginação, atualização da página e restauração do estado ao voltar ou avançar no navegador;
- detalhes de produto disponível, esgotado e inexistente;
- home e detalhe nas larguras de 320, 390, 768 e 1440 px;
- carrossel, navegação por teclado e header conectado e desconectado.

Durante essa validação, um aviso de hidratação indicava o atributo `data-dashlane-rid`. O aviso desapareceu após desativar a extensão Dashlane, confirmando a injeção pelo navegador; nenhuma alteração ou supressão de hidratação foi adicionada ao código.

Na M3, o responsável também confirmou manualmente:

- adição pelos cards e pelo detalhe, consolidação e alteração de quantidades;
- restauração após recarregar, remoção, estados vazio, esgotado e indisponível;
- preservação exata do carrinho visitante ao entrar com Google;
- limpeza intencional no logout e isolamento na troca de conta;
- sincronização entre duas abas, inclusive após corrigir a corrida entre sessões temporariamente diferentes durante o login;
- home, detalhe e carrinho nas larguras de 320, 390, 768 e 1440 px, além de navegação por teclado e foco visível.

Na M4, o responsável confirmou manualmente:

- cadastro, validações de nome, e-mail, senha e confirmação, conflito de e-mail e condução ao login;
- login por credenciais, mensagens para dados inválidos e limitação de tentativas;
- login Google, sessão após F5 e em duas abas, atualização do header e logout;
- preservação do carrinho visitante nos dois métodos, limpeza no logout e isolamento entre contas;
- login e cadastro nas larguras de 320, 390, 768 e 1440 px, com teclado e foco visível.

Ao atingir o limite de login, o campo de senha permanece editável por decisão de escopo. Digitar nele altera somente o estado local do formulário e não envia requisição. Cada novo envio chama novamente o callback de credenciais, mas o servidor recusa a tentativa pelo contador persistente antes do scrypt e não cria sessão. Recarregar ou usar outra aba não remove o bloqueio; a janela expira conforme a política documentada.

Essas verificações foram realizadas e confirmadas pelo responsável, não pelo agente de implementação. Checkout, endereços, CEP, pedidos, baixa transacional, configuração final de publicação, validações com tecnologias assistivas dedicadas e demais funcionalidades de marcos posteriores continuam pendentes. As verificações automatizadas não são apresentadas como validação visual ou como repetição do OAuth real.

O código utiliza **quatro espaços de indentação**, sem tabulações. Para aplicar a formatação:

```bash
npm run format
```

### Cobertura planejada para a V1

| Nível             | Principais comportamentos a verificar                                        |
| ----------------- | ---------------------------------------------------------------------------- |
| Regras de negócio | Valores em centavos, quantidades, produtos inativos e validação das entradas |
| Componentes       | Interações do catálogo, carrinho, formulários e estados de interface         |
| Integração        | Endereços, CEP controlado, estoque, transações, autorização e idempotência   |
| End-to-end        | Catálogo, carrinho, autenticação, endereço, revisão, pedido e histórico      |

Vitest, React Testing Library, Playwright e o pipeline do GitHub Actions ainda serão incorporados. As verificações atuais de autenticação, carrinho, catálogo e estoque não representam a suíte completa de testes da loja.

Os testes planejados cobrirão disputa concorrente pela última unidade, reversão integral de pedidos com vários itens, repetição da confirmação, isolamento dos endereços por usuário e imutabilidade do endereço histórico do pedido. A preservação do estoque ao reexecutar o seed já é verificada em PostgreSQL real isolado. Também serão cobertas consultas de CEP com sucesso, entrada inválida, CEP não encontrado, falha, tempo limite, preenchimento manual e descarte de respostas atrasadas. Concorrência e transações usarão o banco de testes, sem consumir o banco demonstrativo; a API externa será simulada ou controlada nos testes automatizados.

---

<a id="scripts"></a>

## 📜 Scripts disponíveis

| Comando                         | Descrição                                                 |
| ------------------------------- | --------------------------------------------------------- |
| `npm run dev`                   | Inicia o ambiente de desenvolvimento                      |
| `npm run build`                 | Gera o Prisma Client e o build de produção                |
| `npm start`                     | Executa a aplicação compilada                             |
| `npm run format`                | Aplica a formatação com Prettier                          |
| `npm run format:check`          | Verifica a formatação                                     |
| `npm run lint`                  | Executa o ESLint                                          |
| `npm run typecheck`             | Gera os tipos do Next.js e verifica o TypeScript          |
| `npm run auth:verify`           | Verifica regras auxiliares de autenticação                |
| `npm run credentials:verify`    | Verifica cadastro e credenciais com PostgreSQL e NextAuth |
| `npm run cart:verify`           | Verifica regras, persistência e resolução do carrinho     |
| `npm run catalog:verify`        | Verifica consultas e normalização do catálogo isolado     |
| `npm run stock:verify`          | Verifica estoque e seed no banco local isolado            |
| `npm run prisma:format`         | Formata o schema Prisma                                   |
| `npm run prisma:generate`       | Gera o Prisma Client                                      |
| `npm run prisma:validate`       | Valida o schema Prisma                                    |
| `npm run prisma:migrate`        | Valida as URLs e executa as migrações de desenvolvimento  |
| `npm run prisma:migrate:deploy` | Aplica migrações versionadas sem usar banco shadow        |
| `npm run prisma:migrate:status` | Consulta o estado das migrações                           |
| `npm run prisma:seed`           | Cria ou atualiza o catálogo demonstrativo                 |
| `npm run prisma:studio`         | Abre a interface de inspeção do banco                     |

---

<a id="roadmap"></a>

## 🗺️ Roadmap

### V1 — E-commerce full stack com Next.js

- [x] Configurar Next.js, TypeScript, Tailwind e ferramentas de qualidade.
- [x] Integrar PostgreSQL e Prisma, com migrações versionadas.
- [x] Modelar categorias e produtos e preparar o seed.
- [x] Implementar a base de autenticação e o login com Google.
- [x] Revisar documentalmente o escopo de endereços, CEP, estoque e privacidade.
- [x] Preparar a base de estoque antes da M2, com migração e seed sem reposição de saldo.
- [x] Construir a interface Mobile First, responsiva e acessível da vitrine.
- [x] Implementar a M2 com catálogo, busca, gêneros, Sale, paginação, detalhes e estado esgotado.
- [x] Implementar a M3 com carrinho persistente atento à disponibilidade, sem reserva.
- [x] Adicionar cadastro e login com e-mail e senha.
- [ ] Integrar múltiplos endereços e consulta de CEP na etapa de checkout.
- [ ] Implementar pedidos com baixa transacional, idempotência e testes de concorrência.
- [ ] Implementar confirmação e histórico de pedidos com cópias dos dados históricos.
- [ ] Ampliar testes e configurar integração contínua.
- [ ] Validar a experiência completa, publicar a demonstração e adicionar previews.

### V2 — API dedicada e ambiente com Docker

- [ ] Migrar o backend para Nest.js, preservando o frontend e os dados.
- [ ] Centralizar autenticação, endereços, CEP, estoque, pedidos e persistência na API.
- [ ] Apresentar aviso de privacidade versionado e registrar a manifestação explícita do usuário.
- [ ] Documentar o contrato HTTP com OpenAPI/Swagger.
- [ ] Configurar Docker e Docker Compose para o ambiente local.
- [ ] Ampliar testes de integração e repetir os fluxos end-to-end.
- [ ] Documentar e publicar a evolução da arquitetura.

O escopo detalhado e os critérios de aceite estão em [`docs/escopo-projeto-ecommerce.md`](docs/escopo-projeto-ecommerce.md).

---

<a id="documentacao"></a>

## 📚 Documentação

| Documento                                             | Conteúdo                                                                  |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| [Escopo do projeto](docs/escopo-projeto-ecommerce.md) | Funcionalidades, regras de negócio, identidade visual e plano de evolução |
| [Modelo de autenticação](docs/auth-model.md)          | Identidades, contas sociais, sessão, decisões e verificações              |
| [Schema Prisma](prisma/schema.prisma)                 | Modelos e relacionamentos implementados                                   |
| [Migrações](prisma/migrations/)                       | Histórico de alterações no banco                                          |
| [Variáveis de exemplo](.env.example)                  | Referência para configurar o ambiente local                               |

---

<a id="autor"></a>

## 👨‍💻 Autor

Desenvolvido por **Márcio Junior** como projeto independente de estudo e portfólio em desenvolvimento de software.

[![GitHub](https://img.shields.io/badge/GitHub-juniormps-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/juniormps)

Conheça também o [Clarity](https://github.com/juniormps/clarity), aplicação full stack de gerenciamento de tarefas.

---

<p align="center">
    <strong>🎶 Sobe o Som — Discos para ouvir, capas para guardar.</strong>
</p>
