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

Esta etapa implementa a rota do NextAuth 4 para App Router, o login e logout com
Google e a página `/login`. O adaptador Prisma usa os modelos `User` e `Account`, e
a estratégia JWT mantém `session.maxAge` e `jwt.maxAge` em sete dias. O e-mail do
perfil Google é normalizado antes do adaptador, e perfis sem e-mail utilizável ou
sem `email_verified: true` são recusados antes da criação de usuário ou vínculo.

Prisma Client, adaptador e opções do NextAuth são inicializados durante a
requisição. `prisma generate`, `postinstall` e o build continuam sem conexão com o
banco e sem exigir segredos reais; a aplicação, ao atender autenticação, rejeita
variáveis ausentes e o placeholder de `NEXTAUTH_SECRET`, sem usar credenciais
fictícias como fallback. Cadastro e login com senha, vinculação explícita de
métodos e recuperação de senha continuam pendentes.

O Route Handler usa o runtime Node.js padrão do App Router, necessário para Prisma
e NextAuth. Com `cacheComponents` habilitado no Next.js 16, o runtime padrão não é
redeclarado no segmento porque essa opção rejeita configurações locais de runtime;
nenhuma parte da autenticação é executada no Edge Runtime.

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
campo nulo. A implementação atual não inclui cadastro, validação de senha ou
provider de credenciais.

`Account` registra o vínculo entre um `User` e uma identidade OAuth. O par
`provider`/`providerAccountId` é único e identifica retornos do Google sem usar o
e-mail como identidade do provedor. Os demais campos são os tokens e metadados
esperados pelo adaptador oficial. A chave estrangeira exige um usuário existente e
remove seus vínculos em cascata se ele for excluído.

O comportamento seguro permanece o padrão do NextAuth 4: igualdade de e-mail não
autoriza vinculação automática entre contas. Se o e-mail normalizado já estiver
associado a outro usuário, o login social deve ser rejeitado e orientar o uso do
método original. `allowDangerousEmailAccountLinking` não é habilitado. Uma nova
entrada Google também é recusada quando já existe uma sessão autenticada, evitando
que outra identidade seja vinculada silenciosamente. Vinculação explícita de
métodos fica fora desta etapa.

## Sessão JWT

`session.strategy` é `jwt`, e `session.maxAge` e `jwt.maxAge` são de sete dias. O
NextAuth gerencia o JWT em cookie de sessão HttpOnly; em produção, HTTPS permite o
cookie seguro. Dados de autenticação não devem ser copiados para `localStorage`.

Não existe modelo `Session`, pois sessões JWT não são persistidas individualmente
no PostgreSQL. Também não existe `VerificationToken`, necessário para login por
link enviado por e-mail, que não faz parte do escopo. `User` e `Account` são os
únicos modelos exigidos pelo uso atual do adaptador com Google.

Cada JWT emitido recebe validade de sete dias. Quando o NextAuth processa uma
consulta válida de sessão, ele pode reemitir o token e renovar a expiração do
cookie; portanto, a sessão pode continuar ativa com uso recorrente e expira após o
período sem renovação. O logout encerra a sessão no navegador e remove o cookie.
Como não há registro de sessão no banco, não existe revogação individual imediata
de um JWT já emitido em outro dispositivo. Uma revogação ampla exige trocar o
`NEXTAUTH_SECRET`, o que invalida todas as sessões, ou adotar posteriormente um
mecanismo adicional de versão/bloqueio ou sessões persistidas.

## Google

Google é o único provedor social no escopo. A rota
`/api/auth/[...nextauth]`, o callback `/api/auth/callback/google`, a página
`/login` e os estados de entrada, saída e erro estão implementados. O callback usa
as verificações `state` e PKCE do provider oficial; não há OAuth manual.

O perfil válido usa `sub` como `providerAccountId`, preserva pontos e sufixos com
`+` no e-mail e aplica somente `trim` e lowercase. O primeiro acesso pode criar
`User` e `Account`; retornos posteriores procuram primeiro o vínculo estável. A
sessão enviada à interface contém apenas expiração e `user.id`, `name`, `email` e
`image`, sem hashes, tokens OAuth ou registros completos do banco. O logger da
integração registra somente códigos de erro da biblioteca e descarta metadados que
possam conter perfil, tokens ou segredos.

Em execução, as requisições de autenticação exigem `DATABASE_URL`, `NEXTAUTH_URL`,
`NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. O callback de cada
ambiente precisa estar cadastrado no Google. O ambiente local usa
`http://localhost:3000/api/auth/callback/google`.

## Verificações e pendências

O script `npm run auth:verify` verifica normalização sem remover pontos ou `+`,
recusa de e-mail ausente ou não verificado, fallback de destinos externos ou
malformados e ausência de dados sensíveis na sessão pública. Lint, tipos, build e
verificações HTTP locais complementam essa checagem.

Em 12/11/2026, foram executados com sucesso `npm run auth:verify`,
`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run build` e
`git diff --check`. Um segundo build passou com as variáveis de banco e
autenticação vazias no processo, sem mover ou alterar o `.env`. Com o servidor de
produção local, `/login`, `/api/auth/providers` e `/api/auth/session` responderam
com status 200 sem autenticação; a lista de providers continha somente Google, e a
sessão anônima não expôs dados.

O primeiro login real com Google foi concluído em 12/11/2026, exibindo nome e
e-mail. A sessão permaneceu ativa após F5 e ao abrir `/login` em outra aba. O
cancelamento da autorização retornou a `/login?error=Callback` em estado
desconectado. O Prisma Studio mostrou um `User` e um `Account` após esses testes.

Não foram testados nesta revisão o botão de logout nem um novo login posterior com
a mesma conta. Também continuam pendentes a configuração dos ambientes de
publicação e os testes do futuro login por e-mail/senha.
