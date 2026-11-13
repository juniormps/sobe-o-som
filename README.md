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
- base de autenticação com NextAuth 4, adaptador Prisma, modelos `User` e
  `Account` e sessão JWT de sete dias;
- rota do NextAuth para App Router, login e logout com Google e página `/login`;
- normalização do e-mail social, exigência de e-mail verificado e sessão pública
  com o UUID interno do usuário;
- comandos de lint, verificação de tipos e build de produção.

Planejado, mas ainda não implementado:

- telas de catálogo, busca, filtros e detalhes de discos;
- carrinho e checkout demonstrativo;
- cadastro e login com e-mail/senha e histórico de pedidos;
- modelos de pedidos;
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

Antes de ativar a autenticação, substitua também os valores fictícios de
`NEXTAUTH_SECRET` e Google. A configuração usa os nomes de variáveis do NextAuth
4, não os nomes `AUTH_*` da versão 5. O arquivo `.env` local permanece ignorado
pelo Git.

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

Os modelos de autenticação e a estratégia de sessão estão detalhados em
[docs/auth-model.md](docs/auth-model.md). O fluxo social com Google está publicado
pela rota `/api/auth/[...nextauth]` e pode ser exercitado em `/login`. O cadastro e
o login com e-mail/senha permanecem planejados, sem provider de credenciais
configurado nesta etapa.

Variáveis exigidas por operação:

- `prisma:generate`, `postinstall`, `prisma:validate` e `build`: nenhuma conexão e
  nenhuma variável de autenticação obrigatória;
- aplicação, `prisma:seed`, `prisma:studio` e `prisma:migrate:status`:
  `DATABASE_URL` quando acessarem o banco;
- requisições às rotas de autenticação: `DATABASE_URL`, `NEXTAUTH_URL`,
  `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`;
- `prisma:migrate`: `DATABASE_URL` e `SHADOW_DATABASE_URL`, obrigatoriamente para
  bancos distintos;
- futuras migrações de produção: somente `DATABASE_URL`, sem banco shadow.

Variáveis de autenticação previstas:

- `NEXTAUTH_URL`: origem pública da aplicação, como `http://localhost:3000` em
  desenvolvimento;
- `NEXTAUTH_SECRET`: segredo aleatório e exclusivo de cada ambiente para assinar e
  criptografar os tokens;
- `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: credenciais do cliente OAuth do
  Google.

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
exigir conexão. A configuração do Prisma e do NextAuth é inicializada somente
durante as requisições que precisam dela, portanto o build também funciona sem
segredos reais. Variáveis ausentes e o placeholder de `NEXTAUTH_SECRET` são
rejeitados em execução, sem fallback para credenciais fictícias. Build e
postinstall não executam migrações nem seed automaticamente. O seed usa upsert com
UUIDs estáveis, pode ser reaplicado e não remove registros. As capas atuais
reutilizam `public/images/album-placeholder.svg`; as artes são provisórias e serão
trocadas por imagens próprias ou licenciadas quando a interface do catálogo for
criada.

## Autenticação com Google

Inicie a aplicação e abra [http://localhost:3000/login](http://localhost:3000/login).
O primeiro acesso com um perfil Google que forneça e-mail verificado cria `User` e
`Account`; acessos seguintes reutilizam o vínculo pelo identificador estável do
Google. Contas não são vinculadas automaticamente apenas porque compartilham o
mesmo e-mail.

O primeiro login real com Google foi validado no navegador, com nome e e-mail na
interface e um `User` e um `Account` observados no Prisma Studio. A sessão foi
preservada após recarregar a página e ao abrir `/login` em outra aba. O cancelamento
da autorização retornou a `/login?error=Callback` em estado desconectado. Logout e
um novo login posterior não foram testados nesta revisão.

As verificações automatizadas cobrem normalização, rejeição de perfil inválido,
destinos de retorno e conteúdo público da sessão, mas não substituem os cenários
manuais ainda pendentes.

## Qualidade

O projeto usa quatro espaços para indentação, sem caracteres de tabulação.

Formate os arquivos de código e configuração ou apenas verifique a formatação:

```bash
npm run format
npm run format:check
```

Execute as demais verificações de qualidade:

```bash
npm run auth:verify
npm run lint
npm run typecheck
npm run build
```
