# Kurio — extração do Figma

Arquivo: `t7YGbSWoRJdQt7T0ctJwy0`, página `0:1`.
Extraído em 2026-10-15. **A partir daqui trabalhar só com estes arquivos locais.**

## Inventário de frames

| arquivo                                        | node              | tamanho   | estado                                |
| ---------------------------------------------- | ----------------- | --------- | ------------------------------------- |
| `screenshots/desktop-01-inicio.png`            | 2:2               | 1440×3668 | ok                                    |
| `screenshots/desktop-02-detalhes-nft.png`      | 10:244            | 1440×2246 | ok                                    |
| `screenshots/desktop-03-carrinho.png`          | 11:1278           | 1440×1754 | ok                                    |
| `screenshots/desktop-04-pagamento.png`         | 11:2862           | 1440×1657 | ok                                    |
| `screenshots/desktop-05-confirmacao.png`       | 11:4385           | 1440×1657 | ok (modal centralizado)               |
| `screenshots/desktop-06-login.png`             | 9:115             | 1440×1981 | ok (modal sobre a home)               |
| `screenshots/desktop-07-cadastro.png`          | 9:1022            | 1440×1981 | ok (modal sobre a home)               |
| `screenshots/desktop-08-perfil.png`            | 9:1238            | 1440×1080 | ok                                    |
| `screenshots/desktop-09-carteiras.png`         | 9:1670            | 1440×1080 | ok                                    |
| `screenshots/mobile-01-inicio.png`             | 14:5226           | 414×896   | ok                                    |
| `screenshots/mobile-02-detalhes-nft.png`       | 15:5536           | 414×896   | ok                                    |
| `screenshots/mobile-03-carrinho.png`           | 16:360            | 414×896   | ok                                    |
| `screenshots/mobile-04-login-cadastro.png`     | 16:1022 / 16:1228 | print     | ok (login + cadastro lado a lado)     |
| `screenshots/mobile-05-carrinho-pagamento.png` | 16:360 / 16:748   | print     | ok (carrinho + pagamento lado a lado) |

Os três últimos vieram por captura de tela, não por export: resolução menor,
suficiente para conferir layout e espaçamento.

## Divergências mobile x desktop (não é o desktop empilhado)

**Pagamento.** O desktop tem o formulário de perfil do colecionador com 11 campos
(8 obrigatórios) à esquerda e o resumo à direita. **O mobile não tem formulário
nenhum.** É "Pagamento com carteira": carteira conectada (cartões _Reserva_ e
_Principal_, cada um com apelido, ENS/endereço e rede, radio de seleção e menu de
três pontos), link "Trocar carteira", bloco "Carteira e rede" com WalletConnect /
MetaMask / Coinbase Wallet em radio, Total e "Confirmar compra".

Consequência: o mobile **pressupõe perfil e carteiras já cadastrados**. Quem não tem
carteira salva precisa ser mandado para Perfil → Carteiras antes. Isso vira uma
regra de rota, não um `hidden md:block`.

**Login e cadastro.** Desktop é modal centralizado sobre a home. Mobile é **tela
cheia**, com o logo KURIO grande no topo e link de troca no rodapé ("Novo na Kurio?
Crie uma conta" / "Já tem uma conta? Entre"). O cadastro mobile também muda o texto:
título "Criar perfil de colecionador" e botão "Criar perfil" (desktop: "Criar conta").

**Carrinho.** Mobile mostra "Edição: 1/50" em cada linha, que o desktop põe numa
coluna própria. A lixeira só aparece na linha em foco, substituindo o "+".

## Tokens

`tokens/figma-variables.json` — paleta completa, família (Roboto Mono) e as 26 escalas
tipográficas, saída crua de `get_variable_defs`.

## Medidas de layout (lidas dos PNGs a 1440)

- **Container:** conteúdo de x=120 a x=1320 → `max-width: 1200px`, centrado, gutter 120.
- **Header:** altura ~75px, borda inferior 1px `border` (#3F2319). Logo à esquerda em 120,
  nav centrada, cluster à direita (busca · carrinho com badge · botão Entrar).
- **Nav ativa:** texto `text-accent` (#E89B55) + barra 3px `primary` logo abaixo, da
  largura da palavra.
- **Botão primário:** fundo `primary` (#D28A4C), texto escuro, raio ~6px, altura ~44px.
- **Botão secundário/outline:** fundo transparente, borda 1px `primary`, texto `primary`.
- **Card de NFT:** fundo `surface-card` (#241612), raio ~8px, imagem quadrada no topo,
  título 15/bold + preço `text-accent` bold embaixo. Overlay de ações (carrinho, favoritar,
  zoom) aparece no hover, centralizado sobre a imagem.
- **Badge "RARO":** fundo `primary`, texto escuro, canto superior esquerdo do card.
- **Linha do carrinho:** altura ~66px, thumb 64×64 raio 6, gap 16, fundo `surface-card`.
- **Stepper:** botões redondos ~22px `primary` com − / +, número entre eles.
- **Coluna de resumo (carrinho/pagamento):** largura ~334px (x=986→1320).
- **Inputs:** fundo transparente, borda 1px `border`, raio ~4px, altura ~40px,
  placeholder em `text-secondary`.
- **Asterisco de obrigatório:** vermelho/laranja, colado no label.
- **Modal (login/cadastro/confirmação):** largura ~500px (confirmação ~578px), fundo
  `ink` levemente mais claro, **barra `primary` de 6px na base** — detalhe característico.
- **Rodapé:** 3 blocos com selo circular `primary` + newsletter; faixa escura
  (`surface-dark`) com contatos; 4 colunas de links; linha de copyright.

## Telas e comportamento observado

- **Início:** hero com carrossel (3 dots) · sidebar de filtros (coleções com contagem,
  range de preço duplo, rede com contagem) · abas Todos/Novos lançamentos/Em alta ·
  ordenação · grid 3 colunas · paginação numerada · banner "NFT em destaque / oferta
  limitada" ocupando a célula da esquerda · 2 cards promocionais · blog "Diário da Cunhagem".
- **Detalhe:** 4 thumbs verticais + imagem principal com lupa · preço · estrelas +
  nº de avaliações · seletor de edição (1/1, 1/10, 1/50, ABERTA) · stepper · COMPRAR +
  Favoritar · metadados · compartilhar · abas Detalhes/Avaliações · carrossel relacionado.
- **Carrinho:** tabela NFTs/Preço/Edições/Total com stepper e lixeira · resumo com
  código promocional, subtotal, desconto, taxa de rede ("Taxa estimada"), total ·
  "Conectar e finalizar" · "Continuar explorando".
- **Pagamento:** formulário de perfil do colecionador à esquerda (11 campos, 8
  obrigatórios) · resumo com itens (× qtd) à direita · escolha de carteira em radio ·
  "Confirmar compra".
- **Confirmação:** modal com ID da transação, data, total, carteira · detalhamento por
  item · taxa e total · texto de confirmação na rede · "Ver no Etherscan".
- **Login/Cadastro:** mesmo modal, duas abas. Login: e-mail, senha com olho, esqueceu a
  senha, Entrar, Google, Facebook. Cadastro: usuário, e-mail, senha, confirmar senha.
- **Perfil:** sidebar de 8 itens (item ativo com barra `primary` à esquerda) · dados do
  perfil · avatar com Alterar/Remover · alterar senha.
- **Carteiras:** carteira principal (mesmo formulário do pagamento) + carteira secundária.
- **Mobile:** busca + botão de filtro no topo · hero compacto · abas · grid 2 colunas
  **escalonado** (coluna direita deslocada para baixo) · FAB central · bottom nav de 4
  ícones + FAB. Carrinho mobile é tela cheia com header de voltar e resumo fixo no rodapé.

## Assets

As artes em `assets/` são a origem dos WebP servidos pelo site. O recorte e a
conversão são feitos por `scripts/optimize-art.mjs`.
