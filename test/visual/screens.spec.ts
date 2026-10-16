import { expect, test, type Page } from '@playwright/test'

// Baselines ficam em test/visual/screens.spec.ts-snapshots/ e são regeradas
// com `npx playwright test --project=visual --update-snapshots`.

async function settle(page: Page) {
  // espera as artes carregarem: imagem a meio caminho vira diferença falsa
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0),
  )
}

test.describe('regressão visual', () => {
  test('início', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Catálogo de NFTs' })).toBeVisible()
    await settle(page)

    await expect(page).toHaveScreenshot('inicio.png', { fullPage: true })
  })

  test('detalhe do NFT', async ({ page }) => {
    await page.goto('/mercado/emerald-ape-042')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)

    await expect(page).toHaveScreenshot('detalhe.png', { fullPage: true })
  })

  test('carrinho com itens', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.hover()
    await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()

    await page.goto('/carrinho')
    await expect(page.getByRole('complementary', { name: 'Resumo da carteira' })).toBeVisible()
    await settle(page)

    await expect(page).toHaveScreenshot('carrinho.png', { fullPage: true })
  })

  test('pagamento', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.hover()
    await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()

    await page.goto('/pagamento')
    await expect(page.getByRole('form', { name: 'Perfil do colecionador' })).toBeVisible()
    await settle(page)

    await expect(page).toHaveScreenshot('pagamento.png', { fullPage: true })
  })

  test('cabeçalho e rodapé', async ({ page }) => {
    await page.goto('/')
    await settle(page)

    await expect(page.getByRole('banner')).toHaveScreenshot('header.png')
    await expect(page.getByRole('contentinfo')).toHaveScreenshot('footer.png')
  })
})
