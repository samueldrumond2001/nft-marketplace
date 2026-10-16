import { expect, test, type Page } from '@playwright/test'

async function fillCheckout(page: Page) {
  const form = page.getByRole('form', { name: 'Perfil do colecionador' })
  await form.getByLabel('Nome de exibição').fill('Samuel D.')
  await form.getByLabel('Nome de usuário').fill('samueld')
  await form.getByLabel('Rede').selectOption('ethereum')
  await form.getByLabel('Nome do perfil').fill('Kurio Collector')
  await form.getByLabel('Endereço da carteira').fill('0x1234567890abcdef1234567890ABCDEF12345678')
  await form.getByLabel('Tipo de carteira').selectOption('metamask')
  await form.getByLabel('Código de indicação').fill('KURIO-2026')
  await form.getByLabel('E-mail').fill('samuel@example.com')
  await form.getByLabel('Nome ENS').fill('samueld')
}

test.describe('fluxo de compra', () => {
  test('início → detalhe → carrinho → pagamento → confirmação', async ({ page }) => {
    await page.goto('/')

    // detalhe a partir do card
    await page
      .getByRole('region', { name: 'Catálogo de NFTs' })
      .getByRole('link', { name: 'Emerald Ape #042' })
      .click()
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()

    // duas edições e comprar
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await page.getByRole('button', { name: 'COMPRAR' }).click()

    // carrinho
    await expect(page).toHaveURL(/\/carrinho/)
    const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })
    // 1.19 x 2 = 2.38, mais 0.016 de taxa
    await expect(summary.getByText('2.38 ETH')).toBeVisible()
    await expect(summary.getByText('2.396 ETH')).toBeVisible()

    // pagamento
    await summary.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/pagamento/)
    await expect(page.getByRole('complementary', { name: 'Seus NFTs' })).toContainText('(x 2)')

    await fillCheckout(page)
    await page.getByRole('radio', { name: 'MetaMask' }).check()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // confirmação
    await expect(page).toHaveURL(/\/pedido\//)
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('2.396 ETH').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver no Etherscan' })).toBeVisible()

    // a compra esvazia o carrinho
    await expect(page.getByRole('link', { name: /^Carrinho, 0 itens/ })).toBeVisible()
  })

  test('o formulário barra o envio com dados inválidos', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.hover()
    await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()

    await page.goto('/pagamento')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()

    // continua no pagamento, com os erros à vista
    await expect(page).toHaveURL(/\/pagamento/)
    await expect(page.getByText('Informe ao menos 2 caracteres').first()).toBeVisible()

    // endereço de carteira malformado é recusado antes de sair do navegador
    await fillCheckout(page)
    await page
      .getByRole('form', { name: 'Perfil do colecionador' })
      .getByLabel('Endereço da carteira')
      .fill('0xabc')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(page.getByText(/Endereço deve começar com 0x/)).toBeVisible()
    await expect(page).toHaveURL(/\/pagamento/)
  })
})
