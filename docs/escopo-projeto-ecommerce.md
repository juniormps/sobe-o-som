# Sobe o Som — escopo e plano de evolução

Versão deste documento: 0.11 · Data: 14/11/2026 · Responsável pelo projeto: Márcio Junior.

Este documento registra o escopo a partir da conversa inicial e do planejamento de 03/11/2026. Foram confirmados pelo responsável: nome Sobe o Som, loja de discos de vinil, estilização com Tailwind do início ao fim, NextAuth para autenticação social, Google como único provedor social e os métodos e-mail/senha na V1, preservados na V2. Também estão confirmados: header com categorias abaixo da busca, incluindo Sale; carrossel imediatamente após o header completo; fundo branco ou quase branco no catálogo; frase “Discos para ouvir, capas para guardar”; e rodapé com opções institucionais e de atendimento. A seção 17 detalha a direção visual; cores de apoio e tipografia continuam como proposta.

## 1. Objetivo e limites

Construir uma loja demonstrativa de discos de vinil para praticar Next.js e apresentar no portfólio, com um fluxo completo de catálogo musical, carrinho, autenticação por e-mail/senha ou Google, endereços brasileiros, consulta assistida de CEP, estoque demonstrativo e pedido simulado. Toda a estilização será feita com Tailwind. Posteriormente, manter o mesmo produto e transferir o backend para Nest.js, acrescentando Docker, registro versionado do aviso de privacidade e aprofundamento dos testes.

A aplicação terá uma única loja, um idioma (português do Brasil), uma moeda (BRL) e um único perfil de usuário (cliente). Todos os pedidos serão simulações: haverá baixa de estoque demonstrativo, mas não haverá cobrança, integração de pagamento, cálculo de frete, entrega real, reserva ou cancelamento de pedidos na V1. O checkout solicitará endereço, mas não cartão nem CPF.

O valor técnico será demonstrado pelas regras de negócio, segurança, experiência de uso, testes e documentação das decisões. A entrega da primeira versão é independente da segunda.

| Entrega | Resultado esperado |
| --- | --- |
| V1 — agora | Aplicação full stack com Next.js, TypeScript, Prisma e PostgreSQL, incluindo endereços, CEP, estoque demonstrativo e pedidos simulados |
| V2 — depois | Mesmo frontend integrado a uma API Nest.js, com as funcionalidades da V1 preservadas, acesso ao banco centralizado, aceite versionado, Docker, testes de integração e documentação HTTP |
| Backlog | Ideias sem compromisso de implementação e sem bloquear as duas versões |

## 2. Produto e catálogo demonstrativo

Segmento confirmado: loja de discos de vinil, organizada por gêneros musicais. O catálogo terá título do álbum, artista/banda, ano de lançamento, descrição, capa, gênero principal e preço. Artista será inicialmente um campo textual, sem gestão própria de artistas ou discografias.

Base de conteúdo proposta: 24 produtos demonstrativos, distribuídos em 6 categorias musicais. Categorias sugeridas: MPB e Samba; Rock; Jazz e Blues; Soul e Funk; Pop; Eletrônica. Cada produto pertence a um gênero principal nesta primeira modelagem. Artistas, álbuns, preços e estoques podem ser fictícios; não existe venda real. Os saldos serão pequenos e coerentes, incluindo pelo menos um disco com estoque zero para demonstrar “Esgotado” e outro com uma unidade para o cenário de concorrência pela última unidade.

O menu também terá **Sale**, uma seleção de discos com preço reduzido que preserva o gênero original de cada álbum. A implementação mínima usa preço atual e preço de referência opcionais no catálogo, configurados pelo seed, sem motor de campanhas ou cupons. Sale não é um sétimo gênero musical.

Para manter o escopo simples, a proposta inicial é trabalhar com LPs novos, sem classificação de conservação de usados. Edições diferentes do mesmo álbum serão produtos independentes, identificadas no título/descrição, sem seletor de variantes. Condição, raridade, prensagem e estado de capa/mídia de usados ficam fora desta base.

Nome definitivo do projeto: **Sobe o Som**, confirmado pelo responsável em 03/11/2026. Descritor proposto: “Discos de vinil”. Direção visual inicial: retrô contemporâneo, com vitrine clara e banners expressivos, detalhada na seção 17.

Imagens devem ser próprias ou ter uso permitido, com créditos quando exigidos. A apresentação visual pode explorar capas quadradas, o formato do disco e referências a lojas de música, usando Tailwind em toda a interface.

## 3. Funcionalidades da V1

Esta seção descreve o objetivo da V1. A base persistente de estoque está implementada; seus estados visuais permanecem para M2/M3, e a baixa transacional e a concorrência de pedidos permanecem para M5.2. Endereços, consulta de CEP e pedidos ainda não estão disponíveis.

| ID | Funcionalidade | Escopo e critério de aceite |
| --- | --- | --- |
| RF01 | Vitrine e catálogo | Página inicial enxuta; exibir capa, título do álbum, artista/banda, preço e acesso ao produto |
| RF02 | Busca e categoria | Buscar por título do álbum ou artista/banda, sem diferenciar maiúsculas/minúsculas; filtrar gênero ou seleção Sale pelo menu do header; preservar filtros na URL e combinar com a busca |
| RF03 | Paginação | 12 produtos por página, ordenação estável por nome e ID; alterar busca/categoria reinicia na página 1; tratar parâmetros inválidos e resultados vazios |
| RF04 | Detalhe do produto | Exibir capa, título, artista/banda, ano de lançamento, descrição, gênero, preço, disponibilidade e seletor de quantidade; produto inexistente, inativo ou esgotado apresenta estado adequado |
| RF05 | Carrinho | Adicionar, remover, alterar quantidade e visualizar subtotal; consolidar o mesmo produto em uma linha; impedir novas adições esgotadas e permitir remover itens que se tornaram indisponíveis |
| RF06 | Persistência do carrinho | Manter itens no mesmo navegador após recarregar, inclusive como visitante; preservar na entrada da conta; não sincronizar entre dispositivos |
| RF07 | Cadastro | Nome, e-mail, senha e confirmação; validação no servidor, e-mail único normalizado e senha armazenada como hash |
| RF08 | Sessão | Login com e-mail/senha ou Google; primeiro acesso social pode criar a conta; logout, identificação no cabeçalho e expiração da sessão |
| RF09 | Revisão da compra | Exigir autenticação; mostrar itens, disponibilidade e valores atuais obtidos no servidor, endereço confirmado, aviso de simulação e ação de confirmar |
| RF10 | Criar pedido | Revalidar produtos ativos, preços, quantidades e endereço do próprio usuário; baixar estoque condicionalmente e gravar pedido, cópia do endereço e itens na mesma transação; não solicitar CPF ou cartão |
| RF11 | Confirmação | Exibir identificador, data, itens e total do pedido registrado; limpar carrinho após confirmação bem-sucedida |
| RF12 | Meus pedidos | Listagem paginada do cliente, do mais recente para o mais antigo, com identificação, data e total; estado vazio |
| RF13 | Detalhe do pedido | Exibir apenas pedido pertencente ao usuário autenticado, com nome e preço históricos dos itens |
| RF14 | Estados de interface | Carregamento, envio, erro, vazio, sessão expirada e página não encontrada; possibilidade de recuperação quando aplicável |
| RF15 | Login social | Integração real com Google, cancelamento/erro tratados e retorno ao checkout preservando o carrinho; nenhum botão apenas decorativo |
| RF16 | Carrossel principal | Na página inicial, imediatamente abaixo do header; 3 banners editoriais com imagem/arte, título, texto curto e link para catálogo ou gênero; setas, indicadores e uso por teclado; conteúdo estático, sem painel administrativo |
| RF17 | Navegação por categorias | Preservar marca, busca, conta e carrinho do header proposto; adicionar linha abaixo da busca com Todos os discos, os seis gêneros e Sale; remover o menu de categorias que ficava abaixo do carrossel |
| RF18 | Rodapé | Exibir Sobre, Contato, Trocas e devoluções, Política de trocas e devoluções, Política de privacidade e Formas de pagamento; páginas completas podem ser entregues depois, com alternativas informativas para itens ainda indisponíveis |
| RF19 | Seleção Sale | Listar discos ativos cujo preço de referência é maior que o preço atual; mostrar preço anterior e atual, sem aplicar um segundo desconto no pedido |
| RF20 | Endereços no checkout | Permitir vários endereços brasileiros por cliente; selecionar o principal automaticamente, sujeito à confirmação; permitir escolher outro ou cadastrar um novo sem alterar silenciosamente o principal; apresentar o formulário quando não houver endereço |
| RF21 | Consulta de CEP | Normalizar e validar CEP no cliente e no servidor; consultar o ViaCEP por `GET /api/cep/[cep]`; preencher dados disponíveis sem bloquear edição ou cadastro manual em caso de ausência ou falha |
| RF22 | Estoque simples | Manter saldo inteiro não negativo por produto; deixar produtos ativos esgotados visíveis como “Esgotado”; não reservar itens no carrinho; confirmar e baixar o saldo somente ao criar o pedido |

Ao fazer logout, limpar o carrinho local para evitar que outra conta herde itens naquele navegador. Na V1, o carrinho não pertence a uma conta no banco. O armazenamento local contém somente dados de conveniência; os valores nele não autorizam uma compra.

## 4. Telas e navegação

| Rota proposta | Acesso | Conteúdo |
| --- | --- | --- |
| `/` | Público | Header com busca e categorias em segunda linha, carrossel, catálogo branco com paginação e rodapé institucional |
| `/produtos/[slug]` | Público | Detalhes e adição ao carrinho |
| `/carrinho` | Público | Itens, quantidades e subtotal estimado |
| `/cadastro` | Público | Criação de conta |
| `/login` | Público | Entrada por e-mail/senha e botão “Continuar com Google” |
| `/checkout` | Autenticado | Cadastro/seleção e confirmação do endereço, revisão e confirmação da compra simulada |
| `/api/cep/[cep]` | Público com entrada limitada | Route Handler que valida o CEP e consulta o destino fixo do ViaCEP pelo servidor |
| `/pedidos` | Autenticado | Histórico paginado do cliente |
| `/pedidos/[id]` | Dono do pedido | Detalhe e confirmação do pedido; evita uma página extra de sucesso |
| Página não encontrada | Público | Recuperação para navegação válida |

O login iniciado no checkout retorna para ele, preservando o carrinho. Qualquer parâmetro de retorno deve aceitar apenas rotas internas permitidas.

O cadastro também oferece o acesso social pelo Google. Rotas técnicas de autenticação/callback serão fornecidas pela biblioteca escolhida. Páginas enxutas de privacidade e instruções de exclusão de dados serão acrescentadas quando exigidas na configuração do provedor; não constituem uma área de gestão de perfil. Na V1, cadastro e seleção de endereços ficam dentro do checkout, sem uma área completa de gerenciamento de perfil.

As demais páginas institucionais do footer não são requisito de implementação completa nesta primeira etapa. Itens ainda não implementados devem ser identificados como “Em breve” ou abrir uma informação breve, sem links que levem a páginas inexistentes. As informações necessárias à publicação do Google continuam seguindo o requisito de autenticação acima.

## 5. Regras de negócio obrigatórias

### 5.1. Catálogo e carrinho

- Produtos têm preço positivo em centavos, slug único e indicador de ativo. Inativos não aceitam novas compras.
- Sale utiliza preço de referência opcional, também em centavos, maior que o preço atual. A condição de Sale é calculada a partir desses preços; os produtos continuam pertencendo ao gênero musical original. O seed inclui exemplos e o filtro é aplicado no servidor antes da paginação, podendo ser combinado com busca e gênero.
- A quantidade deve ser inteira, de 1 a 99 por produto; o carrinho aceita no máximo 50 produtos distintos. Esses limites também são validados no servidor e não substituem a disponibilidade de estoque.
- Produtos ativos com saldo zero continuam visíveis no catálogo e no detalhe, com o estado “Esgotado”, e não aceitam novas adições. O carrinho permite remover itens que ficaram indisponíveis.
- O carrinho não reserva estoque. Quantidades respeitam os limites gerais e a disponibilidade validada no servidor; o saldo mostrado na interface não garante disponibilidade até a confirmação.
- Carrinho vazio não pode gerar pedido. Produtos inexistentes, inativos, esgotados ou quantidades inválidas impedem a operação com mensagem compreensível.
- Dados locais inválidos ou antigos não derrubam a interface. O servidor revalida tudo antes de registrar o pedido.
- Busca, paginação e tamanho de entrada têm limites; tamanho de página é controlado pelo servidor.

### 5.2. Preços e pedidos

- O navegador informa produtos e quantidades; preços e totais enviados pelo cliente nunca são a fonte de verdade.
- Dinheiro é representado em centavos inteiros, evitando cálculos monetários com ponto flutuante. Exibição em reais com formatação pt-BR.
- Total da linha = preço unitário atual × quantidade. Total do pedido = soma das linhas. Produtos de Sale já têm seu preço reduzido no catálogo; não aplicar desconto novamente. Não há cupom, frete, taxa ou cobrança adicional no modelo demonstrativo.
- A revisão consulta produtos ativos, preços, quantidades, disponibilidade e o endereço pertencente ao usuário atual no servidor. Se preço, disponibilidade, itens, quantidades ou endereço confirmado mudar entre a revisão e a confirmação, não registrar silenciosamente outro conteúdo: informar a mudança e exigir uma nova revisão coerente com a regra de idempotência.
- A baixa condicional de estoque, a criação do pedido, a cópia do endereço confirmado e a criação de todos os itens são executadas na mesma transação. Cada baixa exige saldo suficiente em uma operação protegida; é inseguro apenas consultar o saldo e depois salvar, fora dessa proteção, um valor calculado pela aplicação.
- Se qualquer item ou etapa falhar, toda a operação é revertida. Estoque insuficiente gera mensagem compreensível e preserva o carrinho, sem baixa ou pedido parcial.
- Cada item guarda uma cópia do título do álbum, artista e preço unitário no momento da compra. Alterações futuras no catálogo não alteram pedidos antigos.
- O pedido guarda uma cópia do endereço confirmado. Alterações futuras no cadastro de endereços não modificam pedidos existentes.
- O vínculo ao cliente é obtido da sessão validada, nunca de um `userId` enviado pelo formulário.
- O pedido representa uma compra simulada registrada, sem estado financeiro ou logístico. A interface não deve chamá-lo de pagamento aprovado, compra paga ou produto enviado.
- Depois de criado, o pedido não pode ser editado, excluído ou cancelado pelo cliente nestas versões.
- Prevenir duplicação por clique duplo e repetição da mesma tentativa: usar identificador de confirmação único por cliente, persistido com o pedido. Reenvio com a mesma chave e conteúdo retorna o pedido já criado; conteúdo diferente exige nova revisão. A interface também bloqueia o botão durante o envio.

### 5.3. Endereços e consulta de CEP

- `Address` pertence a `User`, que pode possuir vários endereços. Toda consulta, alteração e utilização em pedido verifica no servidor a sessão e a propriedade do endereço; um `userId` enviado pelo navegador nunca é fonte de autorização.
- O checkout seleciona inicialmente o endereço principal, sempre sujeito à confirmação do cliente. É possível escolher outro endereço ou cadastrar um novo; essa escolha para um pedido não muda silenciosamente qual endereço é o principal. Na ausência de endereço, o formulário é apresentado diretamente.
- Campos do endereço: destinatário, CEP, logradouro, número ou indicação explícita “sem número”, complemento opcional, bairro quando aplicável, cidade e UF. Endereços ficam limitados ao Brasil nesta versão.
- Cadastro e seleção ocorrem inicialmente no checkout. Uma área completa de perfil e gerenciamento de endereços não integra a V1.
- CEP é armazenado como texto com exatamente oito dígitos, preservando zeros à esquerda. Cliente e servidor removem formatação aceita, normalizam e validam antes da consulta ou persistência.
- O Route Handler `GET /api/cep/[cep]` consulta pelo servidor somente o destino fixo `https://viacep.com.br/ws/{cep}/json/`. Apenas o CEP necessário é enviado ao provedor, sem identificação do usuário ou endereço residencial completo.
- Quando disponíveis, logradouro, bairro, cidade e UF são preenchidos. Número e complemento residencial são informados pelo cliente. Todos os campos permanecem editáveis, e o preenchimento manual fica sempre disponível.
- A consulta externa não é condição obrigatória para cadastrar o endereço. Formato válido não comprova existência do CEP nem residência da pessoa.
- Tratar formato inválido, CEP não encontrado inclusive quando o ViaCEP retornar `erro`, resposta incompleta ou inválida, indisponibilidade, falha de rede e tempo limite. A interface deve orientar preenchimento ou correção sem perder os dados já digitados.
- Respostas atrasadas não podem sobrescrever um CEP mais recente nem alterações manuais feitas depois do início da consulta. A implementação deverá controlar a requisição vigente e a origem dos valores do formulário.
- Consultas bem-sucedidas terão cache com revalidação de referência em 24 horas. Falhas temporárias não permanecem nesse cache pelo mesmo período. Isso é uma estratégia de desempenho, não uma afirmação de que CEPs ou dados associados sejam imutáveis.
- A implementação do cache deve respeitar a versão instalada do Next.js e `cacheComponents: true`; não impor um trecho incompatível apenas para reproduzir `fetch` com `revalidate`.
- A V1 terá somente ViaCEP e fallback manual. Múltiplos provedores, filas e infraestrutura paga não serão adicionados sem necessidade demonstrada.

### 5.4. Autenticação e acesso

- Cadastro por credenciais exige nome, e-mail válido, senha e confirmação iguais. Base proposta: senha entre 12 e 128 caracteres, sem corte silencioso. Cadastro social não exige criar senha local.
- Normalizar e-mail com remoção de espaços externos e conversão para minúsculas; unicidade protegida no banco.
- Senha recebe hash com algoritmo apropriado suportado pela biblioteca, como Argon2id ou scrypt; nunca armazenar texto puro nem criar algoritmo próprio. Contas exclusivamente sociais não têm senha local.
- Biblioteca confirmada: NextAuth (Auth.js, pacote `next-auth`) para o login social com Google. A rota, a página mínima e os fluxos de login e logout com Google estão implementados. O primeiro login real, a persistência da sessão após F5 e em outra aba e o retorno desconectado após cancelamento foram validados em 12/11/2026. Em 13/11/2026, o responsável confirmou que logout seguido de atualização manteve o usuário desconectado e que um novo login com a mesma conta manteve somente um `User` e um `Account`. O login por e-mail/senha permanece no escopo e será integrado à autenticação da aplicação, mas o provider de credenciais ainda não foi implementado. A configuração inclui Google, Prisma e sessão JWT de sete dias. A futura integração com Nest deve preservar essas decisões; não implementar OAuth manualmente. O NextGram usa Auth.js com Google e sessão JWT, servindo como referência funcional.
- Sessão em cookie HttpOnly, Secure em produção, SameSite apropriado e validade explícita; duração definida em 7 dias. A forma de persistência e revogação seguirá a estratégia JWT do NextAuth, compatível com os dois métodos de entrada. A proposta anterior de token opaco com hash no banco não é uma exigência fechada. Logout invalida a sessão conforme o mecanismo adotado e limpa o cookie.
- Google entra na V1 e continua disponível na V2 como único provedor social. O primeiro acesso social cria usuário e vínculo com o provedor quando ainda não existem. Retornos posteriores usam a identidade estável do provedor, não o e-mail como identificador OAuth.
- O vínculo social tem unicidade por provedor e identificador da conta. Não juntar automaticamente contas apenas por igualdade de e-mail. Se o e-mail já pertencer a outra conta, informar o conflito e orientar o uso do método original; vinculação explícita de múltiplos métodos e definição posterior de senha ficam no backlog.
- Se o provedor não retornar o e-mail necessário ao cadastro, tratar a situação com mensagem e orientar outro método de entrada; não inventar e-mail nem criar usuário incompleto.
- Tratar autorização cancelada, falha no callback e indisponibilidade do provedor sem perder carrinho ou expor tokens. A senha do Google é digitada somente no próprio provedor.
- Configurar aplicações de desenvolvimento e produção, client IDs, segredos e URLs de retorno no Google. Segredos ficam no servidor. Solicitar apenas os dados necessários à autenticação e documentar os requisitos de publicação vigentes; testar com contas além das contas de desenvolvimento antes de considerar o provedor liberado para o público.
- Dados de autenticação não ficam em localStorage. Acesso a páginas protegidas e operações sensíveis verifica a sessão no servidor.
- Requisições de alteração precisam de proteção contra CSRF e validação de origem conforme o mecanismo utilizado. Cookies, sozinhos, não substituem essa proteção.
- Tentativas de login/cadastro devem ter limitação compatível com o ambiente de implantação; login inválido apresenta mensagem genérica.
- Consultas de pedido filtram por pedido e cliente. Pedido de outra pessoa recebe resposta equivalente a não encontrado, sem expor seu conteúdo.
- Dados de sessão e pedidos não entram em cache público compartilhado; falhas não expõem stack, hash, token ou credenciais.
- Envio próprio de verificação de e-mail, recuperação de senha e administração de perfil não fazem parte das duas versões. A validação dos dados e tokens retornados pelos provedores faz parte do login social.

### 5.5. Privacidade e transparência

- Privacidade, transparência, minimização de dados e controle de acesso aplicam-se desde a V1, independentemente da funcionalidade de aceite planejada para a V2.
- Antes da publicação da V1, definir e documentar as finalidades, bases legais e informações de privacidade aplicáveis. Não presumir que um pedido demonstrativo constitui uma venda real nem apresentar a demonstração como operação comercial efetiva.
- Coletar somente os dados necessários aos fluxos descritos. A consulta de CEP envia ao provedor apenas o CEP, e dados pessoais não entram em logs ou caches públicos compartilhados.
- A V2 acrescentará a apresentação do aviso e o registro versionado da manifestação do usuário; isso não significa que todos os cuidados de proteção de dados estejam adiados para a V2.

## 6. Modelo conceitual de dados

| Entidade | Estado | Dados centrais e relações |
| --- | --- | --- |
| User | Implementada | ID, nome, e-mail único e datas; possui identidades de autenticação; credencial local opcional para usuários sociais; passará a possuir endereços, pedidos e manifestações de privacidade |
| Account | Implementada | Usuário, provedor e identificador estável da conta, com unicidade do par; campos de credencial/token seguem a biblioteca e só são persistidos quando necessários |
| Session | Não aplicável agora | A estratégia JWT implementada não usa tabela de sessão; reavaliar apenas se a estratégia mudar |
| Category | Implementada | ID, nome do gênero e slug único; possui produtos |
| Product | Implementada, com evolução na V1 | Campos de catálogo, preço, Sale, ativo e `stock Int @default(0)`; a interface e a baixa em pedidos serão acrescentadas nos marcos próprios |
| Address | Planejada para a V1 | Usuário proprietário, destinatário, CEP textual de oito dígitos, logradouro, número ou “sem número”, complemento opcional, bairro quando aplicável, cidade, UF, indicação de principal e datas |
| Order | Planejada para a V1 | ID, usuário, total em centavos, data, chave de confirmação, identificação do conteúdo da tentativa e cópia imutável do endereço confirmado; unicidade por usuário e chave |
| OrderItem | Planejada para a V1 | Pedido, produto, título e artista históricos, preço unitário histórico e quantidade; subtotal derivado |
| PrivacyNotice | Planejada para a V2 | Documento identificável e versionado apresentado ao usuário, com conteúdo ou referência preservada e datas de vigência |
| PrivacyAcknowledgement | Planejada para a V2 | Usuário, documento e versão apresentados, tipo de manifestação e data/hora; preserva o histórico |

Não haverá tabela de carrinho, pagamento, frete, entrega, reserva ou movimentações de estoque. O estoque simples ficará no próprio `Product`, sem tabela de movimentos nem painel administrativo. Produtos já usados em pedidos serão desativados, sem exclusão física destrutiva. Pedidos e usuários não devem ser apagados por reaplicação do seed.

Este modelo é conceitual: credenciais podem ficar em User ou Account conforme o adaptador de autenticação. Não forçar o schema do NextGram nem o desenho anterior de sessão contra os requisitos da biblioteca escolhida.

Migrações versionadas, índices para filtros e histórico, restrições de integridade e seed reproduzível fazem parte da entrega. Além de `@default(0)`, o PostgreSQL possui a constraint nomeada `CHECK (stock >= 0)`; nenhum índice adicional foi criado para o saldo sem necessidade demonstrada.

A migração da M1.2 inicializa uma única vez e por UUID somente os produtos demonstrativos conhecidos; outros produtos existentes mantêm o default zero, e um banco vazio recebe os mesmos valores quando o seed cria o catálogo. Depois disso, o seed aplica o estoque inicial somente na criação: reexecutá-lo não repõe estoque consumido, não sobrescreve zero existente nem apaga usuários, contas ou outros registros.

As verificações de estoque usam exclusivamente o banco local `sobe_o_som_test`, configurado por `TEST_DATABASE_URL`, e são executadas por `npm run stock:verify`. O comando recusa o banco principal e o shadow, aplica as migrações versionadas com `migrate deploy`, exercita o seed real e a constraint real e limpa somente fixtures controladas. A variável não é necessária para generate, validate, build ou para a aplicação fora dessa verificação.

## 7. Stack e arquitetura da V1

| Responsabilidade | Base proposta |
| --- | --- |
| Aplicação | Next.js com App Router, React e TypeScript em modo estrito |
| Renderização | Server Components para catálogo e páginas de dados; Client Components nas partes interativas |
| Mutações | Server Actions nas operações da loja; autenticação usa os handlers/actions fornecidos pela biblioteca, sem duplicar os fluxos OAuth |
| Dados | Prisma e PostgreSQL desde o início |
| Autenticação | NextAuth (Auth.js / `next-auth`) com rota e interface mínima para Google e sessão JWT de sete dias; primeiro login, persistência, cancelamento, logout e novo login validados; login por e-mail/senha ainda não implementado |
| Validação | Schemas de entrada no servidor, com Zod como opção inicial |
| Carrinho | Context + reducer e persistência local; sem necessidade inicial de Redux |
| Estilos | Tailwind CSS do início ao fim, em todas as telas e estados, preservado na V2; sem CSS Modules como estratégia paralela |
| Qualidade | ESLint, verificação de tipos, testes e build no CI |
| Testes | Vitest para regras e React Testing Library quando útil; Playwright para o fluxo principal |

As versões exatas de Node, Next, React, Prisma e demais dependências serão verificadas por compatibilidade no início da implementação e fixadas no projeto. O código do NextGram é referência de aprendizado; não é o ponto de partida obrigatório nem define as versões desta loja.

Organização simples: páginas/componentes → entrada da operação → serviço de negócio → acesso ao banco. Não adicionar camadas genéricas, microserviços ou interfaces para cada arquivo sem necessidade concreta.

Consultas de Server Components chamam funções do servidor diretamente. Não criar uma chamada HTTP à própria aplicação apenas para consultar o banco. Prisma fica restrito à camada de dados no servidor, sem espalhar consultas pelo JSX.

Operações de dados usadas pelas páginas ficam em poucos módulos com formatos de retorno explícitos, separados dos detalhes de Prisma. Na V2, esses módulos passarão a chamar a API Nest.js. Isso reduz mudanças, mas autenticação, cookies, erros e atualização da interface ainda exigirão adaptação.

Route Handlers serão usados quando existir necessidade HTTP concreta, incluindo os endpoints da biblioteca de autenticação, os callbacks sociais e `GET /api/cep/[cep]`; não duplicar todas as mutações como Actions e endpoints na V1 apenas para antecipar a V2. CSS global fica limitado à entrada do Tailwind e a configurações de tema/base quando necessárias.

### 7.1. Integração externa de CEP

O navegador chama apenas o Route Handler da aplicação. O servidor valida o parâmetro, consulta o destino fixo do ViaCEP com tempo limite e valida a resposta antes de devolver somente os campos necessários. Nenhuma identificação de usuário acompanha a chamada ao provedor.

Resultados válidos podem ser reutilizados com revalidação de referência em 24 horas; erros de formato, não encontrado, respostas inválidas e falhas temporárias não devem ser tratados como sucesso duradouro. O mecanismo concreto será definido conforme as APIs compatíveis com Next.js 16.4.5 e `cacheComponents: true`, sem copiar uma configuração incompatível de `fetch` apenas para obter `revalidate`.

A interface aceita edição e preenchimento manual durante todo o fluxo. A coordenação no cliente descarta respostas obsoletas para preservar o CEP atual e alterações manuais feitas enquanto uma consulta estava em andamento.

## 8. Qualidade e critérios de conclusão da V1

- Experiência Mobile First e responsiva em celular e desktop, com navegação por teclado, rótulos de formulário, foco visível, textos alternativos e erros associados aos campos.
- Carrossel abaixo do header, controles acessíveis e vitrine com fundo claro em desktop e celular; comportamento detalhado na seção 17. Não esconder ações dos cards apenas no hover.
- Categorias e Sale no header abaixo da pesquisa; catálogo branco; frase da marca preservada; footer com todas as opções pedidas. Verificar Sale e o preço efetivo do pedido, sem desconto em duplicidade.
- Metadados básicos e páginas de produto com título adequado; sem campanha de SEO ou metas arbitrárias de pontuação.
- Testes focados em comportamento: cálculo monetário, quantidades inválidas, preço adulterado, produto inativo ou esgotado, acesso ao pedido de outra conta e repetição de confirmação.
- Duas compras distintas e concorrentes da última unidade resultam em somente uma conclusão, um pedido e estoque final zero.
- Pedido com vários itens e saldo insuficiente em um deles não deixa baixa parcial nem pedido parcial.
- Repetir a mesma confirmação resulta em um único pedido e uma única baixa; alterar itens, quantidades ou endereço exige nova revisão e nova chave coerente.
- Reexecutar o seed preserva saldos já consumidos e não remove pedidos ou usuários.
- Endereço de outro usuário não pode ser consultado, alterado nem usado no pedido. Alterar o endereço cadastrado não modifica o snapshot dos pedidos antigos.
- Consulta de CEP cobre sucesso, formato inválido, CEP não encontrado inclusive com `erro`, resposta incompleta ou inválida, falha de rede e tempo limite. O preenchimento manual funciona sem o provedor, e uma resposta atrasada não sobrescreve o formulário atual.
- Teste do fluxo principal: catálogo → carrinho → login/cadastro → endereço → revisão → pedido → histórico. Falha na criação não limpa o carrinho.
- Testar os dois métodos de entrada, criação e retorno de usuário social, conflito de identidade/e-mail, cancelamento e falha no callback. Automação usa fronteiras simuladas/controladas para o provedor; validação manual confirma o fluxo OAuth real sem automatizar a tela de senha do Google.
- CI no GitHub Actions executa instalação reproduzível, lint, tipos, testes e build. Testes de concorrência e transações usam PostgreSQL real em ambiente isolado, sem consumir o estoque do banco de demonstração. Testes automatizados de CEP controlam ou simulam a API externa.
- Teste manual do layout, persistência do carrinho, expiração de sessão e ausência de compartilhamento de dados entre contas.
- Publicação funcional com PostgreSQL persistente, HTTPS e variáveis seguras. Provedor e eventual custo serão definidos na implantação, sem depender de plano gratuito presumido.
- Google configurado e validado em produção, com a situação de liberação pública documentada. Eventuais pendências externas não devem ser apresentadas como funcionalidade concluída nem removidas silenciosamente do escopo.
- README com objetivo, demonstração, imagens, stack, instalação, variáveis, migrações, seed, testes, limites da simulação e decisões de arquitetura.
- Finalidades, bases legais e informações de privacidade necessárias à publicação da V1 definidas, sem alegar venda real ou consentimento genérico.
- Tag `v1.0.0` identifica a primeira entrega completa. A V2 só começa depois que a V1 estiver publicada, validada e documentada.

## 9. Escopo da V2 — Nest.js, Docker, privacidade e aprofundamento de testes

A V2 preserva as funcionalidades e os dados da V1 e acrescenta uma mudança funcional: apresentação de aviso de privacidade acessível e versionado, com registro da manifestação explícita do usuário. A segunda versão não exige painel administrativo, pagamento, frete, entrega, reserva ou cancelamento para ser considerada concluída.

| Entrega | O que muda |
| --- | --- |
| API Nest.js | Módulos de autenticação por credenciais/Google, catálogo, endereços, CEP, estoque, pedidos e privacidade; integra biblioteca de autenticação, aplica regras e acessa PostgreSQL com Prisma |
| Frontend Next.js | Mantém páginas, componentes, estilização Tailwind, navegação e carrinho; adapta a camada de dados e as operações de formulário |
| Validação e acesso | DTOs/schemas validados no servidor, guards de sessão e verificação de propriedade de endereços e pedidos |
| Banco | Preserva usuários, vínculos Google, produtos, estoques, endereços, pedidos, snapshots, hashes de senha, idempotência e migrações; Nest torna-se o proprietário do acesso aos dados, inclusive autenticação |
| Contrato HTTP | Rotas, entradas, respostas e erros documentados; Swagger/OpenAPI na API |
| Docker | Imagens para web e API; Compose para web, API e PostgreSQL em ambiente local, com rede, volume e verificações de saúde |
| Testes | Regras portadas/reutilizadas, integração da API com PostgreSQL real isolado e repetição dos fluxos de navegador contra a nova arquitetura |
| Operação | Configuração validada, logs úteis sem segredos, endpoint de saúde, migrações controladas e implantação documentada |
| Privacidade | Aviso acessível e versionado, ação explícita sem opção pré-marcada e histórico da manifestação vinculado ao usuário, à versão apresentada e à data/hora |

Ciência do aviso de privacidade e consentimento para uma finalidade específica são manifestações diferentes. A interface não apresentará “aceito a LGPD” como autorização genérica nem como garantia automática de conformidade. Se alguma finalidade usar consentimento como base legal adequada, ela deverá ser clara e específica, com manifestação própria e possibilidade de revogação. Marketing, newsletter, rastreamento e banner de cookies não serão acrescentados sem necessidade real.

### Contrato HTTP proposto

Prefixo público lógico: `/api`. O Nest poderá usar o mesmo prefixo internamente; o roteamento final será documentado na migração.

Rotas de autenticação abaixo expressam operações previstas; nomes e métodos finais seguirão a biblioteca escolhida. Não criar uma API concorrente ao adaptador apenas para reproduzir estes exemplos.

| Método e caminho | Operação e acesso |
| --- | --- |
| `GET /api/categories` | Listar categorias públicas |
| `GET /api/products` | Catálogo público com busca, categoria, filtro `sale=true` e paginação |
| `GET /api/products/:slug` | Detalhe público de produto |
| `GET /api/cep/:cep` | Consultar o ViaCEP pelo servidor com validação, cache e fallback manual no frontend |
| `POST /api/auth/register` | Criar conta |
| `POST /api/auth/login` | Autenticar e emitir sessão |
| `POST /api/auth/logout` | Revogar sessão e limpar cookie |
| `GET /api/auth/me` | Consultar usuário da sessão |
| `GET /api/auth/:provider` | Iniciar login com Google; formato final depende da biblioteca |
| `GET /api/auth/callback/:provider` | Processar retorno do provedor e estabelecer sessão após validação |
| `GET /api/addresses` | Listar endereços do cliente autenticado |
| `POST /api/addresses` | Cadastrar endereço brasileiro para o cliente autenticado |
| `PATCH /api/addresses/:id` | Alterar endereço pertencente ao cliente autenticado |
| `POST /api/checkout/preview` | Revalidar carrinho e produzir revisão; autenticado |
| `POST /api/orders` | Confirmar pedido da revisão com prevenção de duplicação; autenticado |
| `GET /api/orders` | Histórico paginado do cliente autenticado |
| `GET /api/orders/:id` | Detalhe de pedido do próprio cliente |
| `GET /api/privacy/notices/current` | Consultar a versão vigente do aviso de privacidade |
| `POST /api/privacy/acknowledgements` | Registrar manifestação explícita do usuário para a versão apresentada |
| `GET /api/health` | Saúde da API, sem dados sensíveis |

A forma exata do snapshot de revisão e da chave de confirmação será fechada na implementação, preservando as regras da seção 5. A API deve comprovar a revisão no servidor; não basta confiar em totais enviados pelo navegador.

### Integração, sessão e acesso ao banco

Manter um único domínio/origem para a interface e suas chamadas de navegador, encaminhando `/api` à API por proxy ou por uma camada fina no Next. O Next pode continuar renderizando no servidor e recebendo Server Actions que chamam a API; o backend de negócio estará no Nest.

O Nest valida sessões e decide permissões, mesmo quando a chamada veio do Next. No Next ficam apenas encaminhamento, apresentação e adaptações de interface, sem um segundo cálculo de pedido, estoque, propriedade de endereço ou acesso direto ao Prisma. Cookies recebidos e respostas de login/logout precisam ser encaminhados explicitamente quando houver uma camada intermediária.

A estratégia de sessão escolhida na V1 será preservada quando compatível; adotar Nest não exige trocar entre token opaco e JWT. Credenciais, início e retorno OAuth e validação da sessão devem migrar de maneira coerente para o backend Nest, sem manter um segundo serviço de autenticação no Next. A configuração de callback do Google deve ser revisada na mudança de roteamento. Manter a origem reduz problemas de cookies entre sites, mas não elimina validação de origem/CSRF. Se a hospedagem exigir outra topologia, revisar cookies, CORS, credenciais e proteção contra CSRF antes de publicar.

### Ordem da migração

1. Concluir V1, registrar tag e manter a aplicação publicada funcionando.
2. Criar branch `feat/nest-migration` e reorganizar o mesmo repositório para `apps/web` e `apps/api`, usando workspaces simples.
3. Configurar Nest, PostgreSQL local com Docker e base de testes.
4. Portar catálogo e estoque e integrar suas consultas no Next, validando o contrato.
5. Portar autenticação por e-mail/senha e Google junto da sessão, dos endereços, da consulta de CEP e dos pedidos, preservando vínculos, saldos, snapshots, idempotência e regras; testar callbacks e acesso em ambiente isolado, sem dois backends de produção gravando sem coordenação.
6. Retirar Prisma e regras de negócio do Next; conferir que apenas a API acessa os dados de negócio.
7. Completar Compose da aplicação, testes, CI e documentação; validar a migração em ambiente de teste com cópia segura dos dados quando necessário.
8. Publicar V2, verificar os fluxos, integrar a branch e marcar `v2.0.0`.

Preservar o formato de hashes e sessões quando compatível. Se uma mudança exigir novo login, documentar a invalidação planejada; usuários e pedidos não devem ser perdidos. Uma tag preserva o código da V1, mas rollback após mudança no banco exige estratégia de compatibilidade e backup.

Docker na V2 serve primeiro para ambiente reproduzível de desenvolvimento/testes. A hospedagem pode usar serviços gerenciados; não é obrigatório rodar o banco de produção em container. Docker apenas para PostgreSQL pode ser antecipado na V1 se facilitar o ambiente, sem virar requisito para iniciar.

## 10. Critérios de conclusão da V2

- Todos os fluxos e regras da V1 continuam funcionando; a aparência não precisa ser redesenhada.
- Tailwind permanece como base de toda a estilização; os dois métodos de entrada continuam operacionais e os usuários sociais mantêm seus pedidos.
- API Nest responsável por autenticação, autorização, endereços, CEP, preços, estoque, pedidos, privacidade e persistência; Next sem conexão de negócio com o banco.
- Contrato HTTP documentado com exemplos e erros previsíveis; dados pessoais permanecem privados.
- Testes de integração preservam os cenários da V1 e cobrem sessão, isolamento de endereços e pedidos, validação dos valores, baixa condicional, persistência atômica, prevenção de duplicação e histórico das manifestações de privacidade.
- Testes de navegador exercitam o fluxo completo na arquitetura com a API.
- Compose sobe o ambiente local documentado; dados do PostgreSQL persistem após reiniciar containers sem remover o volume.
- CI verifica web e API; banco de testes isolado e configuração reproduzível.
- Aviso de privacidade acessível e versionado apresentado sem opção pré-marcada; registro identifica usuário, documento, versão e data/hora, distinguindo ciência de eventual consentimento específico e permitindo revogação quando aplicável.
- V2 publicada, dados preservados e README explica o antes/depois, responsabilidades e motivos das escolhas.

## 11. Fora das duas entregas

Os itens abaixo são backlog, sem compromisso ou data: painel administrativo e perfil de administrador; área completa de perfil e gerenciamento de endereços; upload de imagens; tabela de movimentações, reserva de estoque e infraestrutura de inventário além do saldo simples no produto; seletor de variantes e prensagens; gestão de discos usados e classificação de conservação; faixas completas e reprodução de áudio; integração de pagamento e webhooks; cálculo e integração de frete ou entrega; cupons e motor de campanhas promocionais (a seleção simples Sale entra na V1); favoritos; avaliações; notificações e e-mails transacionais; recuperação de senha; envio próprio de confirmação de e-mail; provedores sociais além do Google, inclusive Facebook; vinculação/desvinculação explícita de métodos de entrada e criação posterior de senha para conta social; carrinho sincronizado no banco; compra sem conta; cancelamento, devolução e reembolso operacionais; estorno de estoque por cancelamento; páginas institucionais completas não exigidas na publicação da autenticação; dashboards de vendas; múltiplos vendedores; múltiplas moedas/idiomas; aplicativo mobile.

Cancelamento e estorno podem ser reavaliados em uma evolução posterior, mas não são entregas obrigatórias da V2 neste momento.

Também ficam fora: microserviços, filas, Redis, Kubernetes, Elasticsearch, GraphQL e arquitetura distribuída. Só reconsiderar uma tecnologia com necessidade demonstrada.

## 12. Plano de execução e controle de escopo

| Marco | Entregável verificável |
| --- | --- |
| M0 | Definir direção visual da Sobe o Som; criar repositório próprio e levar este escopo para `docs/escopo-projeto-ecommerce.md` |
| M1 | Configurar projeto com Tailwind, PostgreSQL, Prisma, migrações e seed; configurar NextAuth, definir sessão e validar cedo a configuração do Google |
| M1.1 | Concluir a revisão documental atual de endereços, CEP, estoque, privacidade e testes, sem iniciar a M2 |
| M1.2 | Concluída: base de estoque antes da M2 com campo, restrição, inicialização única, teste isolado e seed que não repõe saldo existente |
| M2 | Header com categorias/Sale, carrossel, catálogo branco, busca por álbum/artista, filtro Sale, paginação, detalhe, estado esgotado e footer responsivos |
| M3 | Carrinho, quantidades, persistência, estados vazios e indisponibilidade, sem reserva de estoque |
| M4 | Cadastro, login por e-mail/senha e Google, sessão, logout, callbacks e proteção das operações |
| M5 | Implementar o checkout com endereço, revisão, criação atômica do pedido, confirmação e histórico |
| M5.1 | Integrar múltiplos endereços e consulta de CEP no checkout, com autorização por proprietário e fallback manual |
| M5.2 | Implementar revisão e pedido com baixa condicional na mesma transação, snapshots, idempotência e testes de concorrência |
| M5.3 | Concluir confirmação e histórico de pedidos preservando dados históricos |
| M6 | Concluir testes prioritários, revisão de acessibilidade, CI, documentação, publicação e tag da V1 |
| M7 | Após estudo de Nest/Docker/testes, migrar também endereços, CEP, estoque e pedidos, acrescentar o aceite versionado e concluir V2 |

Testes relevantes acompanham os módulos; M6 fecha a entrega e não é o primeiro contato com testes. A V1 pode ter testes mais focados, e a V2 amplia especialmente a integração com banco e API. Não há meta de cobertura arbitrária nem necessidade de testar cada componente visual isoladamente.

Não fixar prazo sem conhecer as horas semanais disponíveis. Cada marco deve gerar algo que possa ser executado e demonstrado antes do próximo.

Recursos novos entram no backlog. Para incluí-los numa entrega, registrar o benefício, o custo e o que será removido ou postergado; não ampliar a V1 por padrão. Alterações de autenticação, dados ou arquitetura devem atualizar o escopo e a decisão correspondente.

## 13. GitHub e apresentação no portfólio

Repositório próprio para o produto, separado de `estudos-nextjs`; a implementação começa limpa. Manter V1 e V2 no mesmo repositório, com branches curtas para recursos, branch de migração e tags de entrega. Não é necessário fazer fork.

Depois de existir o repositório, manter o documento em `docs/escopo-projeto-ecommerce.md`, linkado no README, e um registro curto das decisões relevantes (autenticação, checkout e migração). Criar tarefas conforme os marcos sem transformar o planejamento numa lista excessiva de tickets.

Apresentação proposta: “Sobe o Som: loja demonstrativa de discos de vinil com Next.js, Tailwind, Prisma e PostgreSQL; catálogo por gênero, busca por álbum/artista, login por e-mail/senha e login social com NextAuth (Google), múltiplos endereços, consulta de CEP, estoque demonstrativo e pedidos confirmados transacionalmente no servidor; evolução posterior para API Nest.js com Docker, aceite versionado e testes de integração.” Documentar claramente que não há pagamento, frete, entrega ou operação comercial real.

Na execução deste planejamento foram consultados, em modo de leitura, `6_nextgram/package.json`, `6_nextgram/prisma/schema.prisma` e `6_nextgram/auth.ts` no repositório de estudos. A configuração de autenticação consultada usa Google com Auth.js e sessão JWT; o login por e-mail/senha é requisito desta loja, sem atribuí-lo à configuração atual do NextGram. A loja não herdará automaticamente versões ou modelo de dados.

## 14. Decisões confirmadas e abertas

| Decisão | Base para seguir | Momento de fechar |
| --- | --- | --- |
| Segmento | Confirmado: discos de vinil com categorias musicais | Fechado em 03/11/2026 |
| Nome comercial | Confirmado: Sobe o Som | Fechado em 03/11/2026 |
| Requisitos visuais | Confirmado: header e catálogo branco puro, faixa superior da frase preservada, categorias/Sale abaixo da busca, carrossel após o header e footer preto puro `#000000` | Fechado em 03/11/2026 |
| Frase da marca | Confirmado: “Discos para ouvir, capas para guardar” | Fechado em 03/11/2026 |
| Footer | Confirmadas opções Sobre, Contato, Trocas e devoluções, respectivas políticas e Formas de pagamento; páginas completas podem vir depois | Estrutura na V1 |
| Estilo, cores e fontes | Header e catálogo brancos, footer preto puro; proposta de apoio: vinho, laranja queimado, amarelo, Bricolage Grotesque e DM Sans | Avaliar refinamentos da seção 17 antes das telas |
| Biblioteca de estilos | Confirmado: Tailwind do início ao fim, V1 e V2 | Fechado em 03/11/2026 |
| Métodos de autenticação | Confirmado: e-mail/senha e Google desde V1; Google é o único provedor social | Revisado em 11/11/2026 |
| Biblioteca de autenticação | Confirmado: NextAuth (Auth.js / `next-auth`) para login social | Fechado em 03/11/2026 |
| Estratégia de sessão e integração de credenciais | NextAuth implementado com Google, Prisma e sessão JWT de sete dias; primeiro login, persistência, cancelamento, logout e novo login validados; integrar e-mail/senha e preparar futura migração para Nest | Validações Google concluídas em 13/11/2026; credenciais em M4 |
| Catálogo inicial | Proposta: 24 LPs novos, 6 gêneros, sem variantes | Antes do seed e das telas |
| Estoque simples | Confirmado: saldo em `Product`, restrição de não negativo, sem movimentos ou reserva; seed não repõe consumo | Base em M1.2; interface em M2/M3; baixa em M5.2 |
| Endereços | Confirmado: múltiplos endereços brasileiros, propriedade verificada no servidor e snapshot no pedido; gestão inicial no checkout | M5.1 e M5.2 |
| Consulta de CEP | Confirmado: ViaCEP pelo servidor, cache de sucessos por referência de 24 horas e fallback manual | M5.1 |
| Privacidade | Cuidados aplicáveis desde a V1; aviso acessível e registro versionado da manifestação entram como funcionalidade na V2 | Informações de publicação antes da V1; funcionalidade em M7 |
| Versões e dependências | Releases estáveis e compatíveis, verificadas no início | M1 |
| Provedores de hospedagem e banco | Next com runtime servidor e PostgreSQL persistente | Antes da publicação da V1 |
| Infraestrutura de limitação de tentativas | Persistente e compatível com a hospedagem | Implementação da autenticação |
| Horas semanais e previsão | Ainda não informadas | Antes de estimar calendário |

## 15. Referências técnicas

As escolhas de escopo e arquitetura são recomendações para este projeto. As referências abaixo fundamentam capacidades dos frameworks; não constituem promessa de migração automática.

- Next.js — backend para frontend, limites e consulta de Server Components: https://nextjs.org/docs/app/guides/backend-for-frontend
- Next.js — Server e Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- NestJS — OpenAPI/Swagger: https://docs.nestjs.com/openapi/introduction
- Docker — Compose: https://docs.docker.com/compose/
- Referência do curso, dependências: https://github.com/juniormps/estudos-nextjs/blob/main/6_nextgram/package.json
- Referência do curso, schema: https://github.com/juniormps/estudos-nextjs/blob/main/6_nextgram/prisma/schema.prisma
- Referência do curso, autenticação atual: https://github.com/juniormps/estudos-nextjs/blob/main/6_nextgram/auth.ts
- Auth.js — Google: https://authjs.dev/getting-started/providers/google
- Google — OpenID Connect e identidade estável: https://developers.google.com/identity/openid-connect/openid-connect
- ViaCEP — serviço de consulta: https://viacep.com.br/
- Next.js — Cache Components: https://nextjs.org/docs/app/getting-started/cache-components

## 16. Histórico de revisões

| Versão | Data | Alteração |
| --- | --- | --- |
| 0.1 | 03/11/2026 | Proposta inicial de escopo em duas entregas |
| 0.2 | 03/11/2026 | Tailwind confirmado para todo o projeto; e-mail/senha, Google e Facebook desde V1; segmento de vinil e categorias musicais; atualização de dados, testes e migração da autenticação; nomes ainda em discussão |
| 0.3 | 03/11/2026 | Nome Sobe o Som e biblioteca NextAuth confirmados; Google, Facebook e e-mail/senha preservados no escopo; identidade visual e detalhes da sessão seguem para configuração inicial |
| 0.4 | 03/11/2026 | Referências visuais registradas; carrossel abaixo do header e catálogo com fundo claro confirmados; proposta de identidade retrô contemporânea, paleta, tipografia, cards e comportamento do carrossel |
| 0.5 | 03/11/2026 | Referência Redley; vitrine branca; gêneros e Sale no header abaixo da busca; frase da marca preservada; footer com opções institucionais e páginas completas adiáveis; Sale simples com preços de catálogo |
| 0.6 | 03/11/2026 | Header alterado para branco puro como o catálogo; faixa superior da frase preservada; footer escuro com textos claros |
| 0.7 | 03/11/2026 | Fundo do footer definido como preto puro `#000000` |
| 0.8 | 11/11/2026 | Facebook retirado da V1 e da V2 para simplificar a integração e a publicação; Google mantido como único provedor social e e-mail/senha preservado no escopo |
| 0.9 | 12/11/2026 | Rota e interface mínima do login Google implementadas; primeiro login, persistência da sessão e cancelamento validados no navegador; logout e novo login pendentes; e-mail/senha permanece planejado |
| 0.10 | 13/11/2026 | Revisão aprovada inclui múltiplos endereços, ViaCEP e estoque simples na V1; baixa transacional, idempotência e testes de concorrência detalhados; aceite de privacidade versionado acrescentado à V2; logout e novo login Google confirmados no estado atual |
| 0.11 | 14/11/2026 | Base de estoque implementada com restrição no PostgreSQL, inicialização única dos produtos demonstrativos, seed sem reposição de saldos e verificação isolada em banco local de testes |

## 17. Identidade visual e composição da página inicial

### Referências fornecidas pelo responsável

- E-commerce Website Template (Freebie): https://www.figma.com/community/file/1273571982885059508/e-commerce-website-template-freebie
- Modern Retro Beverage Brand: https://www.figma.com/community/file/1498075881439321552/modern-retro-beverage-brand
- Cloth Store / Fashion Store / E-commerce UI Kit: https://www.figma.com/community/file/1365263619600313207/cloth-store-fashion-store-e-commerce-ui-kit
- Redley: https://www.redley.com.br/ — nova referência para vitrine branca, categorias no cabeçalho, Sale e organização das opções do footer, preservando a identidade já proposta para a Sobe o Som.

O responsável autorizou uma interpretação criativa, sem reprodução exata dos modelos. As publicações completas do Figma Community não puderam ser abertas nesta etapa; a consulta pública recuperou referências e a apresentação da proposta retrô no próprio site do Figma. Portanto, esta direção é autoral, sem alegar inspeção completa dos três arquivos nem extração de seus tokens, componentes ou medidas.

Referência pública complementar consultada: https://www.figma.com/resource-library/landing-page-examples/ (exemplo “Beverage brand landing page”).

O site público da Redley foi consultado para sua navegação e rodapé. O branco `#FFFFFF` abaixo é a escolha desta proposta para atender ao pedido, sem alegar extração exata da cor do CSS da Redley.

### Definições confirmadas e proposta criativa

Obrigatório: preservar o desenho do header proposto com fundo branco puro `#FFFFFF`, incluindo a linha de categorias abaixo da busca, e posicionar o carrossel imediatamente após esse header completo. A vitrine também terá fundo branco puro, inclusive com busca/filtros e no celular, sem mudança automática para tema escuro. A faixa superior com “Discos para ouvir, capas para guardar” mantém o fundo escuro e as cores anteriores. O footer terá fundo escuro e textos claros.

Proposta criativa: **retrô contemporâneo de loja de discos**, com tipografia expressiva em títulos, formas circulares que lembram o vinil e um catálogo organizado que valoriza as capas. Usar a identidade forte no logotipo, nos banners e em pequenos detalhes; preservar leitura clara de álbum, artista, preço e ações.

| Papel | Cor proposta | Aplicação |
| --- | --- | --- |
| Fundo do header e catálogo | Branco `#FFFFFF` | Header com busca/categorias, vitrine, cards e resultados de busca/Sale |
| Fundo do footer | Preto puro `#000000` | Fundo de todo o footer; a faixa superior mantém suas cores anteriores |
| Texto sobre fundo escuro | Creme `#FAF7F0` e bege claro `#C9C1B7` | Títulos, links e informações do footer; faixa superior preservada |
| Superfície de formulários | Branco `#FFFFFF` | Busca e formulários |
| Texto principal | Preto quente `#241C19` | Textos, preços e ícones |
| Marca | Laranja queimado `#B63E25` | Logotipo, destaques e estados selecionados quando houver contraste |
| Banner principal | Vinho `#452327` | Primeiro slide e detalhes da marca |
| Acento | Amarelo `#F3C76A` | Ações e elementos gráficos sobre fundos escuros |
| Divisórias | Areia `#DED8CC` | Bordas leves e separação de controles |

Header e catálogo branco puro e footer preto puro são requisitos confirmados. A composição aplica `#FFFFFF` e `#000000`, respectivamente. As demais cores de apoio continuam como proposta. Usos de texto e controles devem passar por verificação de contraste na implementação; não aplicar uma cor de marca indistintamente a todos os papéis.

Tipografia proposta: Bricolage Grotesque nos títulos e na marca tipográfica; DM Sans para navegação, formulários, álbum, artista e preços. Pesos fortes e espaçamento compacto ficam nos títulos; textos de compra mantêm leitura confortável. O logotipo começa tipográfico, com referência discreta ao disco, sem exigir uma etapa separada de ilustração complexa.

### Ordem e organização da home

1. Faixa com “Discos para ouvir, capas para guardar”, seguida do header com marca, busca por álbum/artista, conta e carrinho; abaixo da busca, dentro do header, a linha de categorias.
2. Carrossel principal de três banners.
3. Identificação do catálogo e quantidade de resultados, sem repetir o menu de gêneros abaixo do carrossel.
4. Grade de discos sobre fundo branco, seguida de paginação.
5. Footer com marca, opções institucionais, atendimento, políticas, informação de pagamento e aviso de demonstração.

Uma pequena faixa gráfica entre banner e catálogo pode reforçar a marca, sem empurrar a vitrine para baixo com conteúdo adicional. Não acrescentar newsletter, avaliações, contadores promocionais ou outras funcionalidades fora do escopo apenas para preencher a página.

### Header, categorias e Sale

- Manter o desenho da marca, busca arredondada, acesso à conta e carrinho da proposta anterior, com fundo branco puro no header inteiro, incluindo as categorias; preservar a faixa escura superior da frase.
- Segunda linha: Todos os discos; MPB e Samba; Rock; Jazz e Blues; Soul e Funk; Pop; Eletrônica; Sale.
- Destacar Sale com a cor de marca e indicar o item selecionado também por sublinhado/estado acessível, sem depender apenas da cor.
- A seleção altera a listagem do catálogo e preserva a pesquisa. Na implementação completa, parâmetros ficam na URL; mudar a seleção reinicia a paginação.
- No celular, a busca pode ocupar uma linha inteira, seguida das categorias em disposição que caiba na tela; garantir alvos de toque e acesso por teclado.
- Sale mantém o gênero original do disco. Exibir preço anterior riscado e preço atual somente quando houver redução válida. O checkout utiliza o preço atual registrado no servidor.

### Carrossel

- Banners estáticos definidos no projeto, sem cadastro no banco ou painel de gestão.
- Cada slide tem um título curto, texto complementar, arte relacionada a vinil e uma ação clara.
- Sugestões: “Seu próximo disco favorito” → catálogo; “O Brasil gira por aqui” → MPB e Samba; “Um lado jazz. Outro universo.” → Jazz e Blues.
- Setas anterior/próximo e indicadores com nomes acessíveis; selecionar um slide não desloca o foco do teclado.
- Base proposta: navegação manual, sem troca automática. Se autoplay vier a ser solicitado, acrescentar pausa e tratamento de foco, interação e preferência de movimento reduzido.
- Conteúdo textual permanece em HTML, permitindo leitura, adaptação de tamanho e acessibilidade; não compor os textos essenciais dentro de uma única imagem.
- Celular recebe composição própria, sem cortar títulos ou ações. Artes podem ser simplificadas para dar espaço à mensagem.
- Movimentos discretos e respeito a `prefers-reduced-motion`; sem áudio automático ou disco girando continuamente.

### Cards e responsividade

- Capas quadradas, sem distorção e sem cortar informação importante da arte.
- Gênero, título do álbum, artista/banda, preço e ação de adicionar visíveis. Produto ativo sem saldo exibe “Esgotado” e não oferece adição.
- Fundo branco puro na vitrine e nos cards, igual ao header; superfícies de apoio podem usar cinza muito claro quando necessário, com bordas leves e cantos discretamente arredondados.
- Base proposta: quatro colunas no desktop, três no tablet quando houver espaço e duas no celular; uma coluna em larguras que não comportem duas com leitura confortável.
- Espaçamento consistente, título com altura previsível e preço/ação alinhados. Capas coloridas não devem competir com excesso de elementos no entorno.
- Controles acessíveis por toque e teclado, foco visível e nenhuma ação essencial dependente apenas de hover.

### Footer e páginas de apoio

- Fundo preto puro `#000000`; títulos em creme e textos secundários em bege claro. Links recebem destaque amarelo na interação, com contraste sobre o fundo preto.
- Preservar a marca e a frase “Discos para ouvir, capas para guardar”.
- Organizar visualmente as opções em Institucional e Ajuda/Atendimento, com informação de pagamento em coluna ou bloco próprio.
- Incluir Sobre a Sobe o Som, Contato, Trocas e devoluções, Política de trocas e devoluções, Política de privacidade e Formas de pagamento.
- “Trocas e devoluções” representa o futuro acesso ao atendimento/solicitação; a política explica as condições. Exibir ambas as opções não obriga a implementar agora um sistema de trocas.
- As informações de privacidade necessárias à publicação da V1 devem ser acessíveis e transparentes. A funcionalidade de apresentação do aviso e registro versionado da manifestação do usuário será acrescentada na V2, sem usar aceite genérico da LGPD.
- As páginas completas podem ser construídas depois. Até lá, usar estado “Em breve” ou informação breve acessível, sem links quebrados ou falsas políticas prontas.
- Formas de pagamento deve informar que a compra é simulada, sem cobrança; não anunciar aceitação real de bandeiras, Pix ou parcelamento sem integração correspondente.
- Não inventar telefone, e-mail de atendimento, CNPJ, endereço comercial ou perfis sociais. Definir contatos antes de publicar informações de atendimento.
- A postergação das páginas institucionais não elimina conteúdos que se tornem necessários para disponibilizar o Google; esse requisito permanece ligado à publicação da autenticação.

### Implementação e avaliação

Toda a interface de produção continua sendo implementada com Tailwind, utilizando uma paleta e escalas consistentes. A revisão atual preserva NextAuth, a seleção simples Sale e a evolução para Nest.js; passa a incluir na V1 os estados de estoque, os endereços e a consulta de CEP descritos nas seções anteriores. Integrações de pagamento, frete, entrega, reserva, cancelamento e operações de troca continuam fora desta entrega.

A proposta pode ser avaliada em uma composição demonstrativa da home antes da implementação. Álbuns, capas geométricas e preços usados nessa composição são ilustrativos e não estabelecem o catálogo definitivo.
