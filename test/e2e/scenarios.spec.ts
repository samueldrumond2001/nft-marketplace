import { expect, test, type Page } from '@playwright/test'

async function addToCart(page: Page, scenario: string) {
  await page.goto(`/?scenario=${scenario}`)
  const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
  await card.hover()
  await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()
  await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()
}

async function fillCheckout(page: Page) {
  const form = page.getByRole('form', { name: 'Perfil do colecionador' })
  await form.getByLabel('Nome de exibição').fill('Samuel D.')
  await form.getByLabel('Nome de usuário').fill('samueld')
  await form.getByLabel('Rede').selectOption('ethereum')
  await form.getByLabel('Nome do perfil').fill('Kurio')
  await form.getByLabel('Endereço da carteira').fill('0x1234567890abcdef1234567890ABCDEF12345678')
  await form.getByLabel('Tipo de carteira').selectOption('metamask')
  await form.getByLabel('Código de indicação').fill('KURIO-2026')
  await form.getByLabel('E-mail').fill('samuel@example.com')
  await form.getByLabel('Nome ENS').fill('samueld')
}

test.describe('cenários de falha', () => {
  test('empty: catálogo e carrinho vazios', async ({ page }) => {
    await page.goto('/?scenario=empty')

    await expect(page.getByText('Nenhum NFT corresponde a esses filtros.')).toBeVisible()

    await page.goto('/carrinho?scenario=empty')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('slow: mostra esqueleto, não tela em branco', async ({ page }) => {
    await page.goto('/?scenario=slow', { waitUntil: 'commit' })

    // os esqueletos são aria-hidden; a grade ainda não tem artigos
    await expect(page.getByRole('region', { name: 'Catálogo de NFTs' })).toBeVisible()
    await expect(page.locator('[data-slot="skeleton"]').first()).toBeVisible()

    await expect(page.getByRole('article').first()).toBeVisible({ timeout: 15_000 })
  })

  test('promo-invalid: 422 vira mensagem no campo', async ({ page }) => {
    await addToCart(page, 'promo-invalid')
    await page.goto('/carrinho?scenario=promo-invalid')

    const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })
    await summary.getByLabel('Código promocional').fill('KURIO10')
    await summary.getByRole('button', { name: 'Aplicar' }).click()

    await expect(summary.getByRole('alert')).toBeVisible()
    await expect(summary.getByLabel('Código promocional')).toHaveAttribute('aria-invalid', 'true')
  })

  test('price-changed: 409 no pedido e o preço pede revisão', async ({ page }) => {
    await addToCart(page, 'price-changed')
    await page.goto('/pagamento?scenario=price-changed')

    await fillCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page.getByRole('alert')).toContainText(/preço de um dos itens mudou/i)
    await expect(page).toHaveURL(/\/pagamento/)
  })

  test('network-error: o retry reaproveita a chave e não cria outro pedido', async ({ page }) => {
    const orderPosts: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/orders') && request.method() === 'POST') {
        orderPosts.push(request.headers()['idempotency-key'] ?? 'sem-chave')
      }
    })

    await addToCart(page, 'network-error')
    await page.goto('/pagamento?scenario=network-error')

    await fillCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByRole('alert')).toContainText(/Falha ao contactar a rede/i)

    // mesma tentativa, mesma chave
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page).toHaveURL(/\/pedido\//, { timeout: 15_000 })

    expect(orderPosts).toHaveLength(2)
    expect(orderPosts[0]).toBe(orderPosts[1])
    expect(orderPosts[0]).not.toBe('sem-chave')
  })

  test('payment-failed: a transação recusada explica o motivo', async ({ page }) => {
    await addToCart(page, 'payment-failed')
    await page.goto('/pagamento?scenario=payment-failed')

    await fillCheckout(page)
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    await expect(page).toHaveURL(/\/pedido\//)
    await expect(page.getByRole('heading', { name: 'A transação não foi concluída' })).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('alert')).toContainText('A carteira recusou a transação.')
    await expect(page.getByRole('link', { name: 'Voltar ao carrinho' })).toBeVisible()
  })

  test('unauthorized: 401 em /me mantém a sessão deslogada', async ({ page, isMobile }) => {
    await page.goto('/?scenario=unauthorized')
    // o botão Entrar fica no header, que o celular não tem
    if (!isMobile) {
      await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
    }

    await page.goto('/perfil?scenario=unauthorized')
    await expect(page).toHaveURL(/auth=login/)
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
  })
})
