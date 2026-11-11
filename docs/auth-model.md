# Modelo inicial de autenticação

## Versões e compatibilidade

A base usa versões exatas e estáveis:

- `next-auth@4.24.15`;
- `@next-auth/prisma-adapter@1.0.7`;
- `@prisma/client@7.10.1`.

O pacote `@next-auth/prisma-adapter` é o adaptador Prisma oficial da linha do
NextAuth 4. Sua versão 1.0.7 declara `next-auth: ^4` e
`@prisma/client: >=2.26.0 || >=3` como peer dependencies. O NextAuth 4.24.15, por
sua vez, aceita as versões de Next.js e React usadas pelo projeto.

O adaptador retorna o tipo `Adapter` de `next-auth/adapters`, o mesmo aceito por
`NextAuthOptions`. A configuração em `src/lib/auth.ts` usa
`satisfies NextAuthOptions`; a geração do Prisma Client 7 e a verificação do
TypeScript confirmam a compatibilidade sem casts. Não são usadas APIs nem nomes de
variáveis do NextAuth 5, e o adaptador `@auth/prisma-adapter` dessa outra linha não
foi misturado à configuração.

As fontes específicas consultadas foram os metadados publicados de
[`next-auth@4.24.15`](https://registry.npmjs.org/next-auth/4.24.15),
[`@next-auth/prisma-adapter@1.0.7`](https://registry.npmjs.org/@next-auth/prisma-adapter/1.0.7)
e [`@prisma/client@7.10.1`](https://registry.npmjs.org/@prisma/client/7.10.1),
além das declarações de tipos distribuídas nesses pacotes e da
[documentação de opções do NextAuth 4](https://next-auth.js.org/configuration/options).

## Estado da implementação

Esta etapa implementa e valida as dependências, os modelos `User` e `Account`, a
migração aditiva, o adaptador Prisma e a configuração server-only com estratégia
JWT. `session.maxAge` e `jwt.maxAge` estão definidos em sete dias. Não há rota de
autenticação, tela ou fluxo de login exposto, por isso a geração do Prisma Client e
o build não importam essa configuração nem exigem credenciais OAuth ou segredos
fictícios no código.

Continuam pendentes a normalização efetiva do e-mail em cada entrada, o cadastro e
login com senha, as rotas e callbacks de integração OAuth, o tratamento dos
conflitos de e-mail e identidade e os testes reais de login com Google, Facebook e
credenciais. As seções seguintes registram a política esperada, não afirmam que
esses fluxos já foram implementados.

## Usuário, credencial e conta social

`User` representa a pessoa que usa a loja. O UUID é o identificador estável e não
depende do e-mail nem de um provedor. O modelo guarda nome, e-mail, data de
verificação do e-mail, imagem de perfil e datas de criação e atualização.

O e-mail é obrigatório e único. Toda entrada futura, inclusive cadastro local e
perfil social, deve remover espaços externos e converter o valor para minúsculas
antes de consultar ou gravar. A restrição única do banco protege os valores já
normalizados. Se um provedor não fornecer e-mail, nenhum usuário incompleto deve
ser criado.

`passwordHash` é opcional. O cadastro com e-mail e senha será implementado pela
aplicação, fora do adaptador: ele validará e normalizará os dados e armazenará
somente um hash de senha adequado. Uma conta exclusivamente social mantém esse
campo nulo. Esta etapa não implementa cadastro, validação de senha ou provider de
credenciais.

`Account` registra o vínculo entre um `User` e uma identidade OAuth. O par
`provider`/`providerAccountId` é único e identifica retornos do Google ou Facebook
sem usar o e-mail como identidade do provedor. Os demais campos são os tokens e
metadados esperados pelo adaptador oficial. A chave estrangeira exige um usuário
existente e remove seus vínculos em cascata se ele for excluído.

O comportamento seguro permanece o padrão do NextAuth 4: igualdade de e-mail não
autoriza vinculação automática entre contas. Se o e-mail normalizado já estiver
associado a outro usuário, o login social deve ser rejeitado e orientar o uso do
método original. Vinculação explícita de métodos fica fora desta etapa.

## Sessão JWT

`session.strategy` é `jwt`, e `session.maxAge` e `jwt.maxAge` são de sete dias. O
NextAuth gerencia o JWT em cookie de sessão HttpOnly; em produção, HTTPS permite o
cookie seguro. Dados de autenticação não devem ser copiados para `localStorage`.

Não existe modelo `Session`, pois sessões JWT não são persistidas individualmente
no PostgreSQL. Também não existe `VerificationToken`, necessário para login por
link enviado por e-mail, que não faz parte do escopo. `User` e `Account` são os
únicos modelos exigidos pelo uso atual do adaptador com Google e Facebook.

Cada JWT emitido recebe validade de sete dias. Quando o NextAuth processa uma
consulta válida de sessão, ele pode reemitir o token e renovar a expiração do
cookie; portanto, a sessão pode continuar ativa com uso recorrente e expira após o
período sem renovação. O logout encerra a sessão no navegador e remove o cookie.
Como não há registro de sessão no banco, não existe revogação individual imediata
de um JWT já emitido em outro dispositivo. Uma revogação ampla exige trocar o
`NEXTAUTH_SECRET`, o que invalida todas as sessões, ou adotar posteriormente um
mecanismo adicional de versão/bloqueio ou sessões persistidas.

## Google e Facebook

Google e Facebook continuam no escopo e já constam na configuração exclusiva do
servidor. Nenhuma rota, tela, callback customizado ou fluxo de login é exposto
nesta etapa.

Para ativar os provedores ainda será necessário:

1. Criar aplicativos separados para os ambientes aplicáveis nos consoles do
   Google e da Meta.
2. Definir `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID` e `FACEBOOK_CLIENT_SECRET` com
   valores reais e secretos no ambiente de execução.
3. Cadastrar `/api/auth/callback/google` e `/api/auth/callback/facebook` sob a
   origem de cada ambiente e revisar domínios, telas de consentimento, permissões
   e requisitos de publicação.
4. Implementar as rotas do NextAuth e o tratamento explícito de e-mail ausente,
   normalização, conflito de conta, cancelamento e falhas de callback.
5. Disponibilizar as páginas e informações externas exigidas pelos provedores,
   incluindo privacidade e exclusão de dados quando aplicável, e validar os fluxos
   com contas que não sejam apenas contas de desenvolvimento.
6. Executar testes reais dos logins por Google e Facebook, além dos testes do login
   por senha quando ele for implementado.
