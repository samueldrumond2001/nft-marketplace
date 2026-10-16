# Arquitetura

Contratos, políticas e limites do Kurio. O README cobre como rodar; aqui está
o que o código combina com ele mesmo.

---

## 1. Camadas

```
rota  ──>  feature (api · components · model)  ──>  lib (http, socket, eth)
                                                      │
                                              MSW  <──┘   (a API)
```

- **Rota** compõe e conecta. Não decide regra.
- **Feature** é dona de um assunto: `marketplace`, `cart`, `checkout`, `auth`,
  `favorites`, `realtime`. Cada uma expõe um `index.ts`; o ESLint recusa
  import de caminho interno de outra feature.
- **lib** é transporte e aritmética: cliente HTTP, socket, dinheiro, sessão.
- **mocks** é o servidor. `src/mocks/api/` tem a regra, em funções puras;
  `handlers/` e `plugins/mock-api.ts` são dois transportes sobre a mesma regra.

Features não se importam entre si no nível de componente. O `NftCard` não
conhece o carrinho: recebe `onAddToCart` e `onToggleFavorite` como props, e
quem liga é a rota (ou o `CatalogSection`, que é o ponto de composição do
catálogo).

---

## 2. Contratos REST

Base: `/api`. Corpo JSON. Erro sempre no mesmo envelope:

```json
{ "error": { "code": "PROMO_INVALID", "message": "...", "fields": { "code": "..." } } }
```

`fields` é opcional e mapeia erro para campo de formulário — é o que permite a
mensagem aparecer ao lado do input que a causou, em vez de uma linha solta.

### Sessão e conta

| método | caminho          | resposta                        | observações                                 |
| ------ | ---------------- | ------------------------------- | ------------------------------------------- |
| POST   | `/auth/register` | 201 `{user, accessToken}`       | 409 `EMAIL_TAKEN` · 422 payload inválido    |
| POST   | `/auth/login`    | 200 `{user, accessToken}`       | 401 `INVALID_CREDENTIALS`                   |
| POST   | `/auth/logout`   | 200 `{ok}`                      | encerra a sessão e derruba o socket         |
| POST   | `/auth/refresh`  | 200 `{accessToken}`             | 401 sem sessão                              |
| GET    | `/me`            | 200 `User` · **204 sem sessão** | 401 só em credencial inválida               |
| PATCH  | `/me`            | 200 `User`                      | nome, usuário, e-mail, ENS, apelido, avatar |
| POST   | `/me/password`   | 200 `{ok}`                      | 422 `WRONG_PASSWORD` / `WEAK_PASSWORD`      |

`User`: `{ id, username, email, displayName, ensName, walletNickname, avatar }`.
Senha e listas internas nunca saem do servidor.

### Catálogo

| método | caminho             | resposta                              |
| ------ | ------------------- | ------------------------------------- |
| GET    | `/nfts`             | `{items, page, limit, total, facets}` |
| GET    | `/nfts/:id`         | `NftDetail` · 404 `NFT_NOT_FOUND`     |
| GET    | `/nfts/:id/related` | `NftSummary[]`                        |

Parâmetros de `/nfts`: `page`, `tab`, `sort`, `q`, `collection`, `network`,
`priceMin`, `priceMax`, `ids`. Todos vêm da URL da página — a query string da
aplicação e a da API são a mesma informação.

### Favoritos

| método | caminho          | resposta                              |
| ------ | ---------------- | ------------------------------------- |
| GET    | `/favorites`     | `{nftIds: string[]}` · 401 sem sessão |
| PUT    | `/favorites/:id` | `{nftIds}`                            |
| DELETE | `/favorites/:id` | `{nftIds}`                            |

PUT e DELETE, não um POST de "alternar": o cliente declara o estado final, e
dois cliques rápidos não invertem o resultado. Os dois são idempotentes.

### Carrinho

| método | caminho           | resposta                     |
| ------ | ----------------- | ---------------------------- |
| GET    | `/cart`           | `Cart`                       |
| POST   | `/cart/items`     | `Cart` · 404 · 409 esgotado  |
| PATCH  | `/cart/items/:id` | `Cart`                       |
| DELETE | `/cart/items/:id` | `Cart`                       |
| POST   | `/cart/promo`     | `Cart` · 422 `PROMO_INVALID` |

Toda operação devolve o carrinho inteiro, com `subtotal`, `discount`,
`networkFee` e `total` **calculados no servidor**. O cliente nunca soma.

### Checkout

| método | caminho           | resposta                                                                               |
| ------ | ----------------- | -------------------------------------------------------------------------------------- |
| POST   | `/checkout/quote` | `{quoteId, subtotal, discount, networkFee, total, expiresAt}` · 409 `ITEM_UNAVAILABLE` |
| POST   | `/orders`         | 201 `Order` · 200 `Order` (chave repetida) · 409 · 422                                 |
| GET    | `/orders/:id`     | `Order` · 404                                                                          |

### Carteiras

| método | caminho        | resposta       |
| ------ | -------------- | -------------- |
| GET    | `/wallets`     | `Wallet[]`     |
| POST   | `/wallets`     | 201 `Wallet`   |
| PATCH  | `/wallets/:id` | `Wallet` · 404 |

### Operação do mock

| método | caminho         | resposta |
| ------ | --------------- | -------- |
| POST   | `/__mock/reset` | `{ok}`   |

Devolve contas, carrinhos, pedidos e versões de evento ao estado de fábrica.
Existe para o teste e para a demonstração: sem ele um cenário só é confiável
na primeira execução da aba.

---

## 3. Eventos de tempo real

Socket.IO, dois eventos:

```ts
'nft.updated'   { nftId, version, price?, previousPrice?, editionId?, remaining?, soldOut?, at? }
'order.updated' { orderId, version, status, txHash, reason, at? }
```

O cliente assina com `subscribe:nft` / `subscribe:order` e libera com
`unsubscribe:*` ao desmontar.

### Por que um evento por recurso

Um evento por tipo de mudança (`nft:price`, `nft:supply`, `nft:sold`) obriga a
inventar um nome novo a cada campo que passa a mudar, e o cliente vira uma
lista de `if` por nome. `nft.updated` diz "este recurso mudou, eis o que
mudou", com os campos opcionais.

### Versão

`version` é um inteiro crescente por recurso. O cliente guarda a última versão
aplicada e descarta o que for **menor ou igual** — é assim que duplicata e
evento atrasado não revertem o estado. Sem isso, uma reentrega faria o preço
voltar ao valor antigo, que é pior do que não receber nada.

O mock reenvia de propósito no cenário `price-changed`: o mesmo evento outra
vez e um com versão anterior. O teste
`resilience.spec.ts › evento repetido e evento atrasado` guarda esse
comportamento.

### Reconciliação depois de reconectar

Enquanto o socket esteve fora, eventos aconteceram e ninguém os recebeu.
Ao reconectar, o cliente **zera o histórico de versões** e invalida catálogo,
detalhe, pedidos e carrinho: o REST recompõe o estado. Confiar só no que
chegar depois deixaria a tela parada num estado antigo.

Enquanto a conexão está caída, a página mostra um aviso (`role="status"`) de
que preço e status de pedido podem estar desatualizados. Ela continua
utilizável: o REST responde.

### Isolamento entre sessões

`logout` derruba o socket (`disconnectSocket`). As assinaturas eram da sessão
que acabou, e evento atrasado dela não pode alterar dado de quem entrar
depois. Na volta, uma conexão nova é criada com as assinaturas da tela atual.

---

## 4. Sessão

- **Token de acesso em memória.** Nunca em `localStorage`: qualquer XSS lê
  `localStorage`.
- **Refresh em cookie httpOnly**, fora do alcance do JavaScript.
- **Refresh _single-flight_**: seis queries paralelas com token vencido
  disparam um refresh, não seis. Com rotação de refresh token, as outras cinco
  falhariam e derrubariam a sessão.
- **`_retried` por requisição** evita laço quando o refresh passa mas o
  recurso continua respondendo 401.
- **`GET /me` responde 204 sem sessão.** Visitante anônimo é estado normal do
  site; 401 marcaria toda visita deslogada como erro.
- **Logout** limpa o token, chama `queryClient.resetQueries()` (e não
  `clear()`, que esvazia o cache sem refazer as queries montadas — o header
  continuava mostrando quem acabou de sair) e derruba o socket.

Rotas privadas (`/perfil`, `/favoritos`) verificam a sessão em `beforeLoad`,
então a tela protegida nunca chega a piscar para quem não está logado.

---

## 5. Carrinho

Um carrinho **por dono**: `visitor` enquanto ninguém entrou, e um por conta
depois. Ao entrar ou se cadastrar, o conteúdo do visitante é mesclado no
carrinho da conta — quantidades somam quando o item é o mesmo, e o cupom da
conta tem precedência.

A mesclagem acontece no roteador do mock, não dentro de `login`: é a
composição de dois recursos, e o módulo de contas não precisa conhecer o de
carrinho.

Depois de uma compra, sai do carrinho **só o que foi comprado**. Antes
esvaziava tudo, e quem tinha deixado outro item para depois o perdia sem
aviso.

O carrinho persiste em `sessionStorage` do lado do mock — um backend de
verdade usaria cookie de sessão. No middleware do Vite (Node) não existe
`sessionStorage` e o estado fica em memória, o que basta para o dev.

---

## 6. Estado e cache

### Quem guarda o quê

| estado                             | onde mora          | por quê                                                    |
| ---------------------------------- | ------------------ | ---------------------------------------------------------- |
| filtros, página, busca, aba, login | **URL**            | voltar funciona, link é compartilhável, é a chave de cache |
| tudo que vem do servidor           | **TanStack Query** | uma fonte, com invalidação explícita                       |
| rascunho de formulário             | React Hook Form    | morre com a tela                                           |
| aba selecionada, gaveta aberta     | `useState` local   | não interessa a mais ninguém                               |
| token de acesso                    | módulo em memória  | XSS não lê                                                 |
| chave de idempotência da compra    | `sessionStorage`   | precisa sobreviver a um F5 no meio do POST                 |

Não há store global. O que parecia precisar de um era estado de servidor, e
esse é do Query.

### Tempos de cache

`src/lib/query-client.ts` concentra os tempos em `STALE`:

| grupo       | tempo | raciocínio                                     |
| ----------- | ----- | ---------------------------------------------- |
| `catalog`   | 1 min | lista muda devagar; o socket avisa quando muda |
| `nftDetail` | 1 min | idem                                           |
| `money`     | 0     | carrinho e cotação não podem vir de cache      |
| `session`   | 5 min | `/me` e carteiras mudam por ação explícita     |

### Retries

O padrão do Query é desligado onde não faz sentido: `meQuery` usa
`retry: false`, porque repetir um 401 só gera outro 401. Mutations não são
repetidas automaticamente — exceto a criação de pedido, que é segura por
causa da chave de idempotência e é repetida **pelo usuário**, não pelo cliente.

### Respostas obsoletas

Cada consulta leva o `AbortSignal` do Query para o axios. Ao trocar de filtro,
a requisição anterior é abortada e a resposta atrasada é descartada no
transporte, antes de virar estado. O cache por chave já impediria a
sobrescrita (chaves diferentes, entradas diferentes), mas abortar economiza a
resposta que ninguém vai ler.

### Atualização otimista

Carrinho e favoritos aplicam direto no cache e revertem no erro, sempre com o
mesmo roteiro: cancelar o que está em voo → guardar o anterior → escrever o
previsto → restaurar no erro → invalidar no fim.

Código promocional **não** é otimista: só o servidor sabe se vale e quanto
desconta, e adivinhar mostraria um total que muda logo depois.

---

## 7. Dinheiro

Preço trafega como string decimal e vira `bigint` de wei em `lib/eth.ts`. Em
ponto flutuante `1.19 + 1.39` dá `2.5799999999999996`, e isso apareceria no
total que o comprador paga. Os nove testes unitários reproduzem os valores do
design: 26.83 de subtotal, 26.846 com a taxa de rede.

O cliente nunca soma para exibir: o total vem da API. A aritmética existe para
a previsão otimista e para os testes.

---

## 8. Idempotência da compra

`Idempotency-Key` (UUID) é gerado uma vez por tentativa e guardado no
`sessionStorage`, derivado do `quoteId`. Clique duplo, F5 no meio do POST e
retry depois de um 5xx mandam a mesma chave, e o servidor devolve o pedido
existente em vez de criar outro.

O orçamento é mantido entre tentativas de propósito: pedir um orçamento novo a
cada clique geraria chave nova, e o retry poderia cobrar duas vezes — o que a
chave existe para impedir. Só um 409 descarta o orçamento, porque aí o preço
realmente mudou.

**Reusar a chave com outro conteúdo é 409.** O servidor guarda uma impressão
do conteúdo (itens, quantidades, total, carteira) junto com a chave; se o
conteúdo mudou, a resposta é `IDEMPOTENCY_KEY_REUSED`. Devolver o pedido
antigo faria o cliente acreditar que comprou o que acabou de mandar.

A cotação é o ponto de **revalidação antes de confirmar**: entre montar o
carrinho e clicar em comprar, uma edição pode ter esgotado, e aí a resposta é
409 `ITEM_UNAVAILABLE`.

---

## 9. MSW como backend

Os handlers do MSW e o middleware do Vite chamam as **mesmas funções** em
`src/mocks/api/`, então não existem duas verdades. O service worker é o
caminho normal — é o que roda em produção e nos testes. O middleware do Vite é
fallback para ambientes que não registram service worker; sem ele, `/api`
cairia no fallback da SPA e voltaria HTML.

A casca da aplicação não espera o MSW: `setApiReady()` entrega uma promessa
que o interceptor do axios aguarda antes de cada requisição. A tela pinta
primeiro, as chamadas é que esperam.

### Fixtures

Duas contas, não uma. Com um usuário só não dá para demonstrar isolamento:
favoritos, carteiras e carrinho de um não podem aparecer para o outro, e isso
só se prova trocando de sessão. Credenciais no README.

---

## 10. Limitações conhecidas

- **Não existe servidor.** Tudo que um backend faria — autenticação de
  verdade, concorrência, persistência entre aparelhos — é simulado. O estado
  morre com a aba (`sessionStorage`).
- **Performance mobile em 82**, abaixo da meta de 90. Medido e explicado em
  `docs/lighthouse-resultados.md`: o "backend" é um service worker que precisa
  baixar e iniciar antes da primeira resposta, e o LCP é a primeira arte do
  catálogo, que depende desse dado.
- **O pagamento no mobile usa o formulário do desktop.** O Figma desenha outra
  coisa (escolha de carteira já conectada, sem os 11 campos). Está registrado
  em `design/README.md`.
- **Conexão de carteira é simulada** pela escolha de tipo no checkout; não há
  integração com provedor real.
- **Sem i18n.** A interface é só pt-BR, como o design.
- **`Criadores` e `Aprenda`** existem na navegação do Figma sem tela
  correspondente; as rotas existem e dizem isso, em vez de virarem link morto.

---

## 11. Decisões de UX que não vieram do Figma

O design não cobre estado de erro, vazio, carregamento nem foco. Estas são as
escolhas feitas, e o motivo:

- **Esqueleto com shimmer** em vez de spinner: reserva o espaço final, então
  nada pula quando o dado chega. Desligado em `prefers-reduced-motion`.
- **Grade esmaecida com `aria-busy`** durante refetch: `placeholderData`
  evita a grade piscar vazia, mas deixa dado velho na tela por um instante —
  o esmaecido diz que aquilo ainda vai mudar.
- **Erro é `role="alert"` perto do que falhou**, não um toast no canto.
- **Ações do card aparecem no hover e no foco**, e ficam sempre visíveis em
  tela de toque: lá não existe hover, e sem isso não havia como adicionar ao
  carrinho pelo card.
- **O coração manda quem não entrou para o login**, em vez de deixar o clique
  tomar 401.
- **Alvos de toque de 24px** mesmo onde o design desenha pontos de 10px: o
  ponto é pequeno por estética, o alvo não pode ser.
- **Foco visível em `--color-primary`**, que já é a cor de ação. O design não
  desenha outline, mas navegação por teclado precisa de um.
- **Aviso de conexão caída** como `role="status"`, não `alert`: é condição,
  não erro de uma ação que a pessoa tomou.
