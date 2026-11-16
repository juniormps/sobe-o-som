# Modelo de autenticação

## Versões e compatibilidade

A autenticação usa as versões instaladas `next-auth@4.24.15`,
`@next-auth/prisma-adapter@1.0.7` e `@prisma/client@7.10.1`. A configuração em
`src/lib/auth.ts` continua tipada com `NextAuthOptions` e não usa APIs do
NextAuth 5. Google e Credentials Provider compartilham a mesma sessão; não há
sessão paralela nem autenticação própria fora do NextAuth.

O Prisma Client, o adaptador e as opções são inicializados somente quando uma
requisição de autenticação precisa deles. `prisma generate`, `postinstall` e o
build não abrem conexão com o PostgreSQL nem exigem segredos utilizáveis. O
runtime é Node.js, necessário para Prisma, NextAuth e `node:crypto`.

## Estado implementado

A M4 oferece:

- cadastro por nome, e-mail, senha e confirmação em `/cadastro`;
- login por e-mail/senha ou Google em `/login`;
- uma sessão JWT com validade de sete dias;
- logout com limpeza intencional do carrinho local;
- retorno validado para `/`, `/login` ou `/carrinho`;
- limitação persistente de cadastro e login no PostgreSQL;
- operação de cadastro com limite de corpo, tipo JSON e origem obrigatória;
- helper exclusivo do servidor para obter a identidade autenticada.

Recuperação de senha, envio de verificação de e-mail, vinculação explícita de
métodos, definição de senha para conta Google e gerenciamento de perfil
continuam fora do escopo. Endereços, checkout e pedidos usarão o helper de
identidade quando forem implementados; não existem rotas fictícias para esses
módulos.

## Usuário e métodos de entrada

`User` é a identidade interna. Seu UUID não depende do e-mail nem do provedor.
O e-mail é obrigatório, normalizado com `trim` e lowercase e protegido pela
restrição única do banco. O nome tem até 120 caracteres, compatível com
`VARCHAR(120)`. Uma conta local é somente um `User` com `passwordHash`; o
cadastro não cria um `Account` OAuth e mantém `emailVerified` nulo.

`Account` representa somente vínculos OAuth. O Google usa o `sub` como
`providerAccountId`, com unicidade por provedor e identidade. O perfil precisa
ter e-mail utilizável e `email_verified: true`. Pontos e sufixos com `+` não são
removidos. `allowDangerousEmailAccountLinking` não é habilitado.

Se um e-mail já pertencer a qualquer usuário, inclusive uma conta somente
Google, o cadastro local responde com uma orientação controlada, sem informar o
método existente. O usuário não é atualizado, não recebe senha e métodos não
são vinculados automaticamente. Da mesma forma, igualdade de e-mail não permite
que o callback Google assuma uma conta local.

O callback `signIn` trata os provedores separadamente. Google preserva as
validações de perfil, identidade por `sub` e ausência de vinculação automática.
Credentials aceita somente o usuário público retornado por `authorize`. Uma
requisição de entrada iniciada com sessão já autenticada é recusada, evitando
substituição silenciosa da conta.

## Política e hash de senha

A política confirmada é de 8 a 128 caracteres. Cliente, servidor e testes usam
o comprimento da string JavaScript, sem `trim`, truncamento ou normalização da
senha. Frases-senha, espaços e Unicode são aceitos. Não há obrigação de letra
maiúscula, número ou símbolo.

O hash usa `scrypt` assíncrono de `node:crypto` exclusivamente no servidor:

- `N = 131072`;
- `r = 8`;
- `p = 1`;
- `maxmem = 256 MiB`;
- salt aleatório de 16 bytes por senha;
- chave derivada de 64 bytes.

O valor persistido é versionado como
`scrypt$1$N$r$p$salt-base64url$hash-base64url`. A leitura exige versão,
algoritmo, parâmetros, codificação canônica, salt mínimo e tamanho exato do
hash. A comparação usa `timingSafeEqual` somente depois de conferir os
comprimentos. Formatos ou parâmetros desconhecidos são recusados.

O `authorize` normaliza a entrada, aplica o limite antes do scrypt, consulta
somente os campos necessários e devolve `id`, `name`, `email` e `image`. Usuário
inexistente, senha incorreta, conta somente Google e hash inválido produzem a
mesma resposta de credenciais inválidas. Nos casos sem credencial local, uma
derivação equivalente é executada com um hash de referência válido para reduzir
diferenças óbvias de tempo.

Cada processo aceita no máximo duas derivações scrypt simultâneas, limitando a
pressão de memória do parâmetro escolhido; excesso momentâneo falha fechado como
indisponibilidade, sem enfileirar senhas indefinidamente. O limite PostgreSQL
continua sendo a proteção persistente e compartilhada entre processos.

Senha e hash não entram em URL, armazenamento do navegador, logs, props,
respostas, JWT ou sessão pública.

## Limitação de tentativas

`AuthRateLimit` mantém ação, chave HMAC-SHA-256, contador, início e expiração da
janela. A chave usa `NEXTAUTH_SECRET` e não armazena e-mail ou IP em texto puro.
O `INSERT ... ON CONFLICT DO UPDATE` incrementa ou reinicia cada contador de
forma atômica sob concorrência. Cada consumo também remove no máximo 50 linhas
expiradas. Falha no mecanismo fecha o fluxo com indisponibilidade; nunca libera
tentativas ilimitadas.

Os limites de janela fixa são:

| Operação | Chave | Limite | Janela |
| --- | --- | ---: | ---: |
| Login | E-mail normalizado | 5 | 15 minutos |
| Login | Global | 100 | 10 minutos |
| Cadastro | E-mail normalizado | 3 | 60 minutos |
| Cadastro | Global | 30 | 10 minutos |

O limite está dentro de `authorize`, portanto chamadas diretas ao callback de
credenciais também são contadas. No cadastro, o limite agregado é aplicado até
a payloads estruturalmente inválidos, depois da proteção HTTP e antes da
validação completa ou do hash. As janelas expiram e não bloqueiam contas
permanentemente.

O formulário não precisa bloquear visualmente o campo depois de receber
`TooManyAttempts`. Digitar a senha apenas atualiza o estado React local; uma nova
requisição ocorre somente ao enviar novamente. Cada envio chega ao callback do
NextAuth e recebe uma resposta, mas resposta HTTP não significa autenticação
aceita: durante a janela, `authorize` encerra o fluxo logo após consumir o
contador, antes da consulta do usuário e do scrypt, e nenhum cookie de sessão é
emitido. Como o contador está no PostgreSQL, recarregar ou abrir outra aba não o
contorna. Depois de `expiresAt`, o próximo `upsert` reinicia a janela e permite
retomar as tentativas.

O ambiente atual não define uma cadeia de proxy confiável. Por isso a aplicação
não aceita indiscriminadamente `X-Forwarded-For` nem usa IP como chave; o limite
global fornece proteção agregada mínima. Antes da publicação, a topologia e os
proxies confiáveis devem ser definidos. Só então um IP obtido dessa fronteira
poderá gerar outra chave HMAC, sem ser registrado em claro.

## Cadastro HTTP e CSRF

`POST /api/auth/register` aceita somente `application/json`, lê no máximo 8 KiB
e rejeita campos além de `name`, `email`, `password` e
`passwordConfirmation`. Campos como `passwordHash`, `userId`, `emailVerified`
ou privilégios não são aceitos. A origem é obrigatória e precisa coincidir com
a origem de `NEXTAUTH_URL`; não há CORS amplo. Respostas de autenticação usam
`Cache-Control: no-store`.

A restrição única de `User.email` é a proteção final contra concorrência. O
serviço trata `P2002`, portanto duas tentativas simultâneas criam somente um
usuário. O conflito não modifica a conta vencedora ou uma conta preexistente.

O fluxo de Credentials usa o endpoint, o token CSRF, os cookies HttpOnly e os
callbacks do próprio NextAuth. A rota de cadastro é da aplicação e aplica sua
proteção de origem própria; ela não presume que o CSRF do NextAuth cubra outra
rota.

## Sessão e autorização futura

`session.strategy` permanece `jwt`; `session.maxAge` e `jwt.maxAge` são sete
dias. O NextAuth mantém o JWT em cookie HttpOnly e usa cookie seguro sob HTTPS.
Não há tabela `Session`, revogação individual imediata em outro dispositivo nem
autenticação em `localStorage`.

A sessão pública contém apenas expiração e `user.id`, `name`, `email` e `image`.
O logger registra códigos do NextAuth e descarta metadados que possam conter
perfil, token ou segredo.

`getAuthenticatedUserIdentity` valida a sessão no servidor, confere o formato do
UUID e confirma que o usuário ainda existe, retornando somente seu ID. Operações
futuras de endereço e pedido deverão usar essa identidade, sem confiar em
`userId`, `ownerId` ou dados do carrinho enviados pelo cliente.

O carrinho continua local e não é uma credencial. A entrada por Google ou
credenciais produz a mesma transição de sessão, preservando o carrinho visitante.
Logout e troca de UUID mantêm as regras da M3: limpeza, isolamento entre contas,
sincronização entre abas e proteção contra reaplicação de itens antigos.

## Verificações e pendências

`npm run credentials:verify` usa exclusivamente o PostgreSQL local
`sobe_o_som_test`, valida o destino antes de aplicar migrações e limpa apenas
fixtures e chaves HMAC controladas. A suíte cobre limites 7/8/128/129,
confirmação, Unicode e espaços, salts, hash inválido, cadastro concorrente,
conflito Google, limites documentados, concorrência e expiração, origem, retornos
e sessão pública. Ela inicia a aplicação com diretório de build isolado e
percorre o callback real de Credentials com CSRF, cookies e consulta de sessão.
O teste de bloqueio usa uma conta válida: confirma cinco falhas, senha correta
recusada durante a janela, novo envio e nova aba ainda recusados, ausência de
sessão e retomada bem-sucedida após expiração controlada no banco de testes.

`npm run auth:verify` continua cobrindo perfil Google, normalização, retornos e
minimização da sessão. As verificações de carrinho, formatação, lint, tipos e
build complementam a entrega.

O responsável confirmou no navegador cadastro, erros, credenciais, Google, F5,
duas abas, logout, responsividade e integração com o carrinho. Também confirmou a
mensagem ao atingir o limite de login; o campo editável não substitui a recusa do
servidor descrita acima. O OAuth real do Google não é automatizado por esta suíte.
Testes com tecnologias assistivas dedicadas, configuração final do ambiente de
publicação, proxy confiável para eventual limite por IP e os módulos posteriores
da V1 continuam pendentes.
