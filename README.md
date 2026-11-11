# Sobe o Som

Loja demonstrativa de discos de vinil criada para portfólio. A aplicação será
desenvolvida em etapas, começando por uma base full stack com Next.js e evoluindo
posteriormente para uma API separada.

## Estado atual

Já implementado nesta etapa:

- base da aplicação com Next.js, App Router e TypeScript em modo estrito;
- estrutura em `src/`, alias `@/*` e estilização com Tailwind CSS;
- página inicial mínima em português do Brasil;
- Prisma 7 estável com PostgreSQL, adaptador `pg` e cliente exclusivo do servidor;
- modelos `Category` e `Product`, migração versionada e restrições de preço;
- seed idempotente com seis gêneros e 24 discos fictícios;
- comandos de lint, verificação de tipos e build de produção.

Planejado, mas ainda não implementado:

- telas de catálogo, busca, filtros e detalhes de discos;
- carrinho e checkout demonstrativo;
- autenticação e histórico de pedidos;
- modelos de autenticação e pedidos;
- testes automatizados e Docker.

O produto completo e seus limites estão descritos no
[escopo do projeto](docs/escopo-projeto-ecommerce.md).

## Requisitos

- Node.js 24.13.0
- npm 11.6.2
- PostgreSQL 16

Com NVM, use a versão registrada no projeto:

```bash
nvm use
```

## Instalação

```bash
npm ci
```

O `postinstall` gera o Prisma Client sem abrir conexão e não exige variáveis de
banco. Crie os bancos principal e shadow e copie os valores fictícios de
`.env.example` para um arquivo `.env`, substituindo usuário e senha pelos dados do
ambiente local. Os dois endereços nunca devem apontar para o mesmo banco.

Prepare o banco de desenvolvimento e carregue o catálogo demonstrativo:

```bash
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate
npm run prisma:seed
```

O Prisma Migrate usa `SHADOW_DATABASE_URL` exclusivamente no fluxo local de
`migrate dev`, para reaplicar o histórico e detectar drift ou perda de dados antes
de gerar migrações. Como o usuário local não precisa de `CREATEDB`, o projeto usa
o banco dedicado `sobe_o_som_shadow`. Esse banco pode ser limpo pelo Prisma e não
deve conter dados da aplicação. O script valida a presença das duas URLs e impede
que banco principal e shadow apontem para o mesmo destino.

## Execução

Inicie o ambiente de desenvolvimento:

```bash
npm run dev
```

A aplicação ficará disponível em [http://localhost:3000](http://localhost:3000).

Para gerar e executar a versão de produção:

```bash
npm run build
npm start
```

## Banco de dados

O projeto fixou Prisma `7.10.1`, versão estável da linha 7 no momento desta
implementação. Prisma 8 e versões preliminares não são usados. A configuração
segue o formato do Prisma 7: `prisma.config.ts` concentra URLs, migrações e seed;
o schema usa o gerador `prisma-client` com saída explícita; a aplicação acessa o
PostgreSQL por `@prisma/adapter-pg`.

Categorias mantêm nomes e slugs únicos. Produtos podem compartilhar o título do
álbum em `name`, permitindo edições ou artistas distintos, mas cada produto mantém
`id` e `slug` únicos.

Variáveis exigidas por operação:

- `prisma:generate`, `postinstall`, `prisma:validate` e `build`: nenhuma conexão;
- aplicação, `prisma:seed`, `prisma:studio` e `prisma:migrate:status`:
  `DATABASE_URL` quando acessarem o banco;
- `prisma:migrate`: `DATABASE_URL` e `SHADOW_DATABASE_URL`, obrigatoriamente para
  bancos distintos;
- futuras migrações de produção: somente `DATABASE_URL`, sem banco shadow.

Comandos disponíveis:

```bash
npm run prisma:format
npm run prisma:generate
npm run prisma:validate
npm run prisma:migrate
npm run prisma:migrate:status
npm run prisma:seed
npm run prisma:studio
```

`postinstall` e `build` geram o cliente para evitar artefatos desatualizados sem
exigir conexão. Eles não executam migrações nem seed automaticamente. O seed usa
upsert com UUIDs estáveis, pode ser reaplicado e não remove registros. As capas
atuais reutilizam `public/images/album-placeholder.svg`; as artes são provisórias
e serão trocadas por imagens próprias ou licenciadas quando a interface do
catálogo for criada.

## Qualidade

O projeto usa quatro espaços para indentação, sem caracteres de tabulação.

Formate os arquivos de código e configuração ou apenas verifique a formatação:

```bash
npm run format
npm run format:check
```

Execute as demais verificações de qualidade:

```bash
npm run lint
npm run typecheck
npm run build
```
