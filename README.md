# Sobe o Som

Loja demonstrativa de discos de vinil criada para portfólio. A aplicação será
desenvolvida em etapas, começando por uma base full stack com Next.js e evoluindo
posteriormente para uma API separada.

## Estado atual

Já implementado nesta etapa:

- base da aplicação com Next.js, App Router e TypeScript em modo estrito;
- estrutura em `src/`, alias `@/*` e estilização com Tailwind CSS;
- página inicial mínima em português do Brasil;
- comandos de lint, verificação de tipos e build de produção.

Planejado, mas ainda não implementado:

- catálogo, busca, filtros e detalhes de discos;
- carrinho e checkout demonstrativo;
- autenticação e histórico de pedidos;
- banco de dados, Prisma, testes automatizados e Docker.

O produto completo e seus limites estão descritos no
[escopo do projeto](docs/escopo-projeto-ecommerce.md).

## Requisitos

- Node.js 24.13.0
- npm 11.6.2

Com NVM, use a versão registrada no projeto:

```bash
nvm use
```

## Instalação

```bash
npm ci
```

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

## Qualidade

```bash
npm run lint
npm run typecheck
npm run build
```
