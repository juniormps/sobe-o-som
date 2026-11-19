# Endereços e consulta de CEP

## Estado da M5.1

A rota protegida `/checkout` implementa somente a etapa de endereço. Ela espera
a restauração e a resolução do carrinho, apresenta estado vazio ou conflito
quando necessário e não cria pedido, não limpa itens e não altera estoque.
A M5.1 não cria pedido nem altera estoque. Revisão, criação atômica, baixa
condicional e idempotência permanecem planejadas para a M5.2; confirmação e
histórico de pedidos permanecem planejados para a M5.3.

Visitantes são encaminhados para `/login?callbackUrl=/checkout`. O destino é uma
entrada explícita da lista compartilhada de retornos seguros e é preservado no
cadastro, nas credenciais e no início do Google. Redirecionamentos externos,
query arbitrária e fragmentos continuam recusados.

## Modelo e invariantes

`Address` pertence a `User` e contém destinatário, CEP textual com oito dígitos,
logradouro, número textual ou indicação `sem número`, complemento e bairro
opcionais, cidade, UF, preferência principal e datas. O PostgreSQL complementa
a validação do servidor com restrições para formato do CEP, as 27 UFs e a
coerência entre número e `sem número`.

As regras de principal são:

- o primeiro endereço do usuário torna-se principal;
- cadastros posteriores não substituem o principal;
- somente uma ação explícita troca essa preferência;
- selecionar ou confirmar outro endereço no checkout não altera o principal;
- um novo endereço é selecionado para o checkout atual, mas só é principal se
  for o primeiro.

**Principal** é a preferência persistida do usuário e serve como seleção inicial
do checkout. **Selecionado** é o endereço escolhido temporariamente para o
checkout atual e não altera a preferência principal. **Confirmado** é o endereço
selecionado depois de uma nova validação de propriedade no servidor; essa
confirmação é apenas estado da etapa atual, não cria pedido ou snapshot e não
altera o principal.

Criação e troca bloqueiam a linha do usuário na mesma transação das alterações.
Isso serializa operações concorrentes da mesma conta. Um índice único parcial
em `Address(userId) WHERE isDefault = true` fornece a proteção final contra dois
principais.

## Autorização e privacidade

Toda listagem e mutação usa `getAuthenticatedUserIdentity`. O navegador não
envia `userId` ou `ownerId` como autorização. Consultas por endereço combinam o
ID com o usuário da sessão; um ID inexistente e um ID de outra conta retornam a
mesma resposta de não encontrado.

As mutações JSON exigem origem igual à configurada, conteúdo JSON, corpo de no
máximo 8 KiB, estrutura exata e sessão válida. Respostas privadas usam
`no-store`. Endereços não são persistidos em `localStorage` ou `sessionStorage`.
Ao detectar logout ou troca de UUID, o cliente aborta requisições e limpa somente
da interface a lista carregada, a seleção, a confirmação e o formulário.
Respostas de uma geração ou conta anterior são descartadas. Essa limpeza não
executa exclusão no banco: os endereços persistidos permanecem vinculados ao
usuário e são carregados novamente em outra sessão da mesma conta.

## ViaCEP e preenchimento manual

`GET /api/cep/[cep]` aceita somente oito dígitos ou a máscara `00000-000`,
normaliza sem perder zeros à esquerda e monta internamente o destino fixo
`https://viacep.com.br/ws/{cep}/json/`. Nenhuma sessão, destinatário, número ou
complemento residencial é enviado ao provedor.

A consulta usa timeout de quatro segundos e valida status HTTP, JSON, CEP,
cidade, UF, campos opcionais e o marcador `erro`. A resposta pública contém
somente CEP, logradouro, bairro, cidade e UF. O campo `complemento` do ViaCEP é
ignorado porque não representa apartamento, bloco ou referência residencial.

Somente resultados válidos entram no Data Cache, por CEP normalizado, com
revalidação em 24 horas. A chamada externa usa `no-store`; falha de rede,
timeout, erro HTTP, CEP inexistente e resposta inválida não são gravados como
sucesso. O cache nunca contém sessão ou os demais dados do formulário.

A consulta de CEP é opcional e auxiliar. O preenchimento manual permanece
disponível antes, durante e depois da consulta, inclusive quando o ViaCEP retorna
sucesso parcial ou está indisponível. O formulário consulta apenas pelo botão
`Buscar CEP`, e uma requisição equivalente em andamento não é repetida. IDs de
requisição, cancelamento e revisões por campo impedem que uma resposta antiga,
outro CEP ou preenchimento automático sobrescrevam edições manuais.

## Verificações

`npm run addresses:verify` usa exclusivamente `sobe_o_som_test`, aplica as
migrações e cobre validação, proprietário, sessão ausente, origem, confirmação,
principal e concorrência. As fixtures têm prefixo próprio e são removidas por ID
e e-mail controlados.

`npm run cep:verify` usa respostas externas simuladas. A suíte cobre formatos e
zero inicial, sucesso completo e parcial, inexistente, erro HTTP, JSON inválido,
rede, timeout, reutilização de sucesso, recuperação depois de falha, respostas
fora de ordem e preservação de edição manual. Nenhuma verificação automatizada
depende da disponibilidade real do ViaCEP.

O responsável confirmou no navegador todos os cenários manuais solicitados da
M5.1: autenticação e retorno ao checkout, carrinho preservado, múltiplos
endereços, principal, seleção e confirmação, CEP e preenchimento manual, falhas,
duas contas, logout e responsividade nas larguras de referência. Essas
verificações não são apresentadas como testes com leitores de tela ou outras
tecnologias assistivas dedicadas.
