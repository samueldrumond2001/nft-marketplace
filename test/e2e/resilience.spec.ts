import { expect, test } from '@playwright/test'

test.describe('resiliência', () => {
  test('NFT inexistente mostra a tela do recurso, não erro do app', async ({ page }) => {
    await page.goto('/mercado/nao-existe-123')

    await expect(page.getByRole('heading', { name: 'NFT não encontrado' })).toBeVisible()
    await expect(page.getByText('nao-existe-123')).toBeVisible()

    await page.getByRole('link', { name: 'VER O CATÁLOGO' }).click()
    await expect(page).toHaveURL(/\/mercado/)
  })

  test('rota inexistente cai no 404 do app', async ({ page }) => {
    await page.goto('/rota-que-nao-existe')
    await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  })

  test('evento repetido e evento atrasado não revertem o preço', async ({ page }) => {
    // o mock reenvia o mesmo evento e depois um com versão menor; se o
    // cliente aceitasse qualquer um, o preço voltaria para 1.19
    await page.goto('/mercado/emerald-ape-042?scenario=price-changed')

    const panel = page.getByRole('region', { name: 'Compra' })
    await expect(panel.getByText('1.69 ETH')).toBeVisible({ timeout: 10_000 })

    // tempo suficiente para a reentrega e o evento velho chegarem
    await page.waitForTimeout(1500)
    await expect(panel.getByText('1.69 ETH')).toBeVisible()
    await expect(panel.getByText('1.19 ETH')).toBeHidden()
  })

  test('sem conexão em tempo real a página avisa e continua utilizável', async ({ page }) => {
    // `socket-down` derruba só o tempo real; o REST continua respondendo
    await page.goto('/?scenario=socket-down')

    await expect(page.getByRole('status').filter({ hasText: 'Sem conexão' })).toBeVisible({
      timeout: 15_000,
    })
    // o REST continua respondendo: o catálogo está lá
    await expect(
      page.getByRole('region', { name: 'Catálogo de NFTs' }).getByRole('article').first(),
    ).toBeVisible()
  })

  test('o reset do mock devolve o estado de fábrica', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.getByRole('button', { name: /Adicionar/ }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()

    await page.evaluate(() => fetch('/api/__mock/reset', { method: 'POST' }))
    await page.reload()

    await expect(page.getByRole('link', { name: /^Carrinho, 0 itens/ })).toBeVisible()
  })
})
