import { expect, test } from '@playwright/test'

// O cenário vai na URL; o mock de socket lê dele para decidir o que empurrar.

test.describe('tempo real', () => {
  test('o preço muda na tela sem recarregar', async ({ page }) => {
    await page.goto('/mercado/emerald-ape-042?scenario=price-changed')

    const panel = page.getByRole('region', { name: 'Compra' })
    await expect(panel.getByText('1.19 ETH')).toBeVisible()

    // o servidor empurra 1.69 pouco depois da assinatura, sem reload
    await expect(panel.getByText('1.69 ETH')).toBeVisible({ timeout: 10_000 })
    await expect(panel.getByText('1.19 ETH')).toBeHidden()
  })

  test('a edição esgotada desabilita a compra sem recarregar', async ({ page }) => {
    await page.goto('/mercado/emerald-ape-042?scenario=sold-out')

    await expect(page.getByRole('button', { name: 'COMPRAR' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'ESGOTADO' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'ESGOTADO' })).toBeDisabled()
  })
})
