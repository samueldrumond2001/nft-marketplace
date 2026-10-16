# Kurio

Marketplace de NFTs em React, construído a partir do design no Figma.

React 19 · TypeScript · TanStack Router · TanStack Query · Axios · Socket.IO ·
Tailwind 4 · MSW · Playwright · Vitest

---

## Rodando

```bash
npm install
npm run dev          # http://localhost:5174
```

Com Docker:

```bash
docker compose up --build    # http://localhost:8080
```

Não existe backend: a API é o MSW, inclusive em produção. Isso é uma decisão
do desafio, não um resto de desenvolvimento — ver "MSW como backend" abaixo.

### Variáveis de ambiente

Nenhuma é obrigatória. O projeto roda a partir de um checkout limpo, sem
`.env` e sem serviço privado.

| variável      | padrão                  | para quê                                      |
| ------------- | ----------------------- | --------------------------------------------- |
| `LH_BASE_URL` | `http://localhost:4174` | endereço auditado por `npm run lighthouse`    |
| `LH_RUNS`     | `3`                     | medições por página e perfil                  |
| `CI`          | —                       | liga retries e relatório GitHub no Playwright |

### Contas de teste

Fictícias, criadas pelo mock. Estão em `src/mocks/data/accounts.ts`.

| e-mail            | senha       | estado inicial                 |
| ----------------- | ----------- | ------------------------------ |
| `ana@kurio.dev`   | `kurio1234` | 1 favorito, 1 carteira, avatar |
| `bruno@kurio.dev` | `kurio1234` | conta limpa                    |

Duas contas, não uma: isolamento entre usuários só se demonstra trocando de
sessão. Cadastrar com um e-mail já existente responde 409.

### Cenários e reset

O cenário vai na URL e vale para a navegação inteira:

```
http://localhost:4174/?scenario=slow
http://localhost:4174/mercado/emerald-ape-042?scenario=price-changed
```

Para voltar ao estado de fábrica (contas, carrinhos, pedidos e versões de
evento), com o site aberto:

```js
await fetch('/api/__mock/reset', { method: 'POST' })
```

A tabela completa de cenários está em "MSW como backend".

### Comandos

| comando              | o que faz                                                |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | dev server com HMR                                       |
| `npm run build`      | gera as artes, a árvore de rotas, checa tipos e empacota |
| `npm run typecheck`  | só a checagem de tipos                                   |
| `npm run lint`       | ESLint com regras que usam tipos                         |
| `npm test`           | unitários (Vitest)                                       |
| `npm run e2e`        | Playwright: desktop, tablet, mobile e regressão visual   |
| `npm run lighthouse` | 3 medições por página e perfil, reporta a mediana        |
| `npm run art`        | regera os WebP a partir de `design/assets`               |

---

## Estrutura

```
src/
  app/ routes/        # rotas finas: compõem, não decidem
  features/           # marketplace · cart · checkout · auth · realtime
    <feature>/
      api/ components/ hooks/ model/
      index.ts        # a superfície pública da feature
  components/ui/      # o que mais de uma feature usa
  components/layout/  # Header, Footer, Container, BottomNav
  lib/                # http, eth, session, socket, idempotency
  mocks/              # api (regra) · handlers (MSW) · socket · data
plugins/              # middleware do Vite que serve o mock sem service worker
test/                 # unit · e2e · visual
design/               # telas, tokens e medidas extraídas do Figma
```

Organização **por feature**, não por tipo de arquivo. Numa listagem por tipo,
mexer no carrinho espalha por cinco pastas; por feature fica contido em uma.

Uma feature não importa de outra: o ESLint recusa
`@/features/x/components/Y`, só `@/features/x`. Quando duas precisam da mesma
coisa, ela sobe para `components/` ou `lib/`. Foi o que aconteceu com o
`QuantityStepper` (detalhe e carrinho) e com o botão de adicionar ao carrinho,
que o card recebe por prop — quem conecta é a rota.

---

## Decisões

### Dinheiro é inteiro

Preço trafega como string decimal e vira `bigint` de wei em `lib/eth.ts`. Em
ponto flutuante `1.19 + 1.39` dá `2.5799999999999996`, e isso apareceria no
total que o comprador paga. Os testes reproduzem os valores do design: 26.83
de subtotal, 26.846 com a taxa de rede.

### Os filtros vivem na URL

Nada de estado de componente para coleção, rede, faixa, aba, ordenação e
página. "Voltar" devolve a listagem que a pessoa estava vendo, um resultado
filtrado é compartilhável por link, e a URL já é a chave de cache do Query.

### Idempotência no checkout

`Idempotency-Key` (UUID) é gerado uma vez por tentativa de compra e guardado no
`sessionStorage`. Clique duplo, F5 no meio do POST e retry depois de um 5xx
mandam a mesma chave, e o servidor devolve o pedido existente.

O orçamento é mantido entre tentativas de propósito: a chave deriva do
`quoteId`, então pedir um orçamento novo a cada clique geraria chave nova e o
retry poderia cobrar duas vezes — exatamente o que a chave existe para
impedir. Só um 409 descarta o orçamento, porque aí o preço realmente mudou.

### O socket avisa, o REST responde

Evento que só muda exibição (preço numa listagem) é escrito direto no cache.
Evento que mexe no valor a pagar invalida a query e deixa o REST responder.
Calcular um total a partir de websocket é apostar que nenhuma mensagem se
perdeu, e elas se perdem. A tela do pedido também consulta por conta própria
enquanto está `PENDING`, como rede de proteção para o socket cair.

O `socket.io-client` é importado sob demanda: o `engine.io-client` guarda
`globalThis.WebSocket` no momento em que é avaliado, e um import estático
pegaria o nativo antes do MSW trocar o global.

### Sessão

Token de acesso em memória, nunca em `localStorage` — qualquer XSS lê
`localStorage`. O refresh fica em cookie httpOnly. O refresh é _single-flight_:
seis queries paralelas com token vencido disparam um refresh, não seis.

`GET /me` responde 204 quando ninguém está logado. Navegar deslogado é estado
normal do site; 401 fica para credencial de fato inválida.

### Carrinho otimista, promo não

Quantidade e remoção aplicam direto no cache e revertem no erro. Código
promocional não: só o servidor sabe se vale e quanto desconta, e adivinhar
mostraria um total que muda logo depois.

---

## MSW como backend

Os handlers do MSW e o middleware do Vite chamam as **mesmas funções** em
`src/mocks/api`, então não existem duas verdades. O service worker é o caminho
normal, e é o que roda em produção e nos testes. O middleware do Vite é
fallback para ambientes que não registram service worker (navegador embutido,
modo privativo) — sem ele, `/api` cairia no fallback da SPA e voltaria HTML.

### Cenários

Selecionáveis por `?scenario=` na URL:

| cenário           | o que exercita                                |
| ----------------- | --------------------------------------------- |
| `happy`           | padrão                                        |
| `empty`           | catálogo e carrinho vazios                    |
| `slow`            | 3s de latência, para ver os esqueletos        |
| `price-changed`   | preço sobe ao vivo e o pedido volta 409       |
| `sold-out`        | edição esgota durante a sessão                |
| `payment-failed`  | transação recusada                            |
| `network-error`   | 5xx na primeira tentativa, sucesso na segunda |
| `unauthorized`    | 401 em `/me`                                  |
| `promo-invalid`   | 422 no código promocional                     |
| `offline`         | toda chamada falha no transporte, sem status  |
| `socket-down`     | só o tempo real cai; o REST continua de pé    |
| `favorite-error`  | 500 ao favoritar, para ver o rollback         |
| `session-expired` | sessão vence ao confirmar a compra            |
| `wallet-refused`  | a carteira recusa a conexão                   |

Exemplo: `http://localhost:4174/mercado/emerald-ape-042?scenario=sold-out`

A latência não é fixa: varia entre 60 e 320 ms, de propósito. Com um número
fixo, corrida entre respostas nunca acontece e o descarte de resposta obsoleta
passava sem ser exercitado. `slow` é o extremo, para ver os esqueletos.

Dois casos não precisam de cenário porque acontecem no caminho normal:
**conflito de cadastro** (basta usar um e-mail já cadastrado) e **reuso de
chave de idempotência com outro conteúdo** (409 `IDEMPOTENCY_KEY_REUSED`).

---

## Testes

```
unit      9 testes    aritmética de ETH
e2e     118 testes    desktop (1440), tablet (768) e mobile (Pixel 5)
visual    5 baselines início, detalhe, carrinho, pagamento, header/rodapé
```

Os E2E rodam contra o **build de produção**, não contra o dev server, então
exercitam o mesmo bundle e o mesmo service worker que vão para o ar.

Vários deles nasceram de defeitos encontrados durante a implementação, não
depois: o card tinha dois links sobrepostos para o mesmo destino (o de baixo
era inclicável), o logout deixava o header com o usuário anterior, e o retry do
checkout gerava uma chave de idempotência nova.

---

## Lighthouse

`npm run lighthouse` mede **duas páginas em dois perfis, três vezes cada**, e
reporta a mediana. Uma execução só não serve de evidência: a variação entre
rodadas no mesmo computador chega a 10 pontos. A configuração mora em
`scripts/lighthouse.mjs`, versionada — é o que permite comparar medições
separadas por semanas. Resultado completo, com FCP/LCP/TBT/CLS e as três
execuções de cada combinação, em `docs/lighthouse-resultados.md`.

| Página  | Perfil  | Performance | Acessibilidade | Boas práticas | SEO |
| ------- | ------- | ----------- | -------------- | ------------- | --- |
| home    | desktop | 100         | 100            | 100           | 100 |
| home    | mobile  | 82          | 100            | 100           | 100 |
| detalhe | desktop | 100         | 100            | 100           | 100 |
| detalhe | mobile  | 82          | 100            | 100           | 100 |

O que moveu o ponteiro: artes em WebP de três larguras (1374KB → 217KB), a
Roboto Mono auto-hospedada e só no subconjunto latino (pelo Google Fonts
bloqueava o render por ~940ms no celular estrangulado), a casca renderizando
antes de o MSW subir, o MSW em bloco próprio fora do caminho crítico, e uma
casca mínima embutida no HTML — o FCP do desktop caiu de 600ms para ~55ms.

**O mobile fica em 82, abaixo da meta de 90, e vale dizer por quê.** O LCP
medido é a primeira arte do catálogo, que só existe depois do primeiro dado —
e o "backend" aqui é um service worker de 300KB que precisa baixar, instalar e
ativar antes de responder qualquer coisa, competindo por banda com o bundle no
link de 1.6 Mbps que o Lighthouse emula. Não é um gargalo de código da
interface: com um servidor de verdade essa etapa não existe. O que dependia de
mim — imagem, fonte, caminho crítico, trabalho de main thread (TBT ~110ms) —
está medido e atacado.

---

## Arquitetura

Contratos REST e de eventos, política de sessão, estado do carrinho,
estratégia de cache, reconciliação REST × Socket, limitações conhecidas e as
decisões de UX que não vieram do Figma: **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Deploy

**https://nft-marketplace-samueldrumond0501-gmailcoms-projects.vercel.app**

Vercel, a partir da branch `main`. A configuração está em `vercel.json`: o
rewrite roda depois da checagem de sistema de arquivos, então os arquivos
reais — assets, artes e o service worker — são servidos como estão, e só o
que não existe cai no `index.html`. Assets com hash recebem cache de um ano;
`mockServiceWorker.js` recebe `no-cache`, porque ele é a API.

O build na Vercel é o mesmo `npm run build` de sempre, e o service worker é
gerado durante ele (`msw init`), então não há arquivo gerado versionado.

---

## Fidelidade ao design

As telas, os tokens e as medidas estão em `design/`, extraídos do Figma e
registrados em `design/README.md`. Nenhuma cor literal aparece fora de
`src/styles/globals.css`.

Duas coisas do design merecem registro:

**O mobile não é o desktop empilhado.** O pagamento no mobile não tem o
formulário de 11 campos: é escolha de carteira já conectada. Está documentado
em `design/README.md` e ainda não implementado — hoje o mobile usa o formulário
do desktop, que funciona, mas não é o desenho.

**Os três selos do rodapé são letras (W, C, D)** no Figma, placeholders de
ícone que o design não resolveu. Estão reproduzidos como estão.
