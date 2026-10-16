import { expect, test } from '@playwright/test'

// O carrinho do mock vive na página, então cada teste do Playwright começa
// com o seu próprio, vazio.

test.describe('carrinho', () => {
  test('adiciona do card, muda a quantidade e o total acompanha', async ({ page }) => {
    await page.goto('/')

    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.hover()
    await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()

    const badge = page.getByRole('link', { name: /^Carrinho, 1 item/ })
    await expect(badge).toBeVisible()

    await badge.click()
    await expect(page).toHaveURL(/\/carrinho/)

    const row = page.getByRole('listitem').filter({ hasText: 'Emerald Ape #042' }).first()
    await expect(row).toContainText('1.19 ETH')

    // 1.19 x 3 = 3.57, mais 0.016 de taxa
    await row.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await row.getByRole('button', { name: 'Aumentar quantidade' }).click()

    const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })
    await expect(summary.getByText('3.57 ETH')).toBeVisible()
    await expect(summary.getByText('3.586 ETH')).toBeVisible()
  })

  test('aplica um código promocional e recusa o inválido', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.hover()
    await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()
    // esperar o badge antes de navegar: senão a navegação cancela o POST
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()
    await page.goto('/carrinho')

    const summary = page.getByRole('complementary', { name: 'Resumo da carteira' })

    await summary.getByLabel('Código promocional').fill('NAOEXISTE')
    await summary.getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary.getByRole('alert')).toHaveText(/inválido/i)

    // 1.19 - 10% = 0.119 de desconto
    await summary.getByLabel('Código promocional').fill('KURIO10')
    await summary.getByRole('button', { name: 'Aplicar' }).click()
    await expect(summary.getByText('Código KURIO10 aplicado.')).toBeVisible()
    await expect(summary.getByText('(-) 0.119')).toBeVisible()
  })

  test('remove o item e mostra o estado vazio', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.hover()
    await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()
    // esperar o badge antes de navegar: senão a navegação cancela o POST
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()
    await page.goto('/carrinho')

    await page.getByRole('button', { name: /Remover .* do carrinho/ }).click()

    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
    await expect(page.getByRole('link', { name: /^Carrinho, 0 itens/ })).toBeVisible()
  })

  test('o carrinho vazio começa sem itens', async ({ page }) => {
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })
})
