import { expect, test } from '@playwright/test'

/*
 * Roda nos três projetos (1440, 768 e 393). O que vale é a regra, não o
 * número: em qualquer largura a página não rola na horizontal, existe uma
 * navegação alcançável e o catálogo aparece.
 */
test.describe('layout responsivo', () => {
  const paths = ['/', '/mercado', '/mercado/emerald-ape-042', '/carrinho']

  for (const path of paths) {
    test(`sem rolagem horizontal em ${path}`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole('contentinfo')).toBeVisible()

      // comparar com innerWidth, não com clientWidth: sob emulação os dois
      // diferem por alguns pixels e a comparação errada acusa falso positivo
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }

  test('existe exatamente uma navegação principal visível', async ({ page }) => {
    await page.goto('/')
    // espera a página montar: medir visibilidade antes disso lê as duas como
    // ausentes e o teste vira moeda
    await expect(page.getByRole('contentinfo')).toBeVisible()

    const header = page.getByRole('banner')
    const bottom = page.getByRole('navigation', { name: 'Navegação do rodapé' })

    // uma das duas, nunca as duas: o link duplicado para o carrinho era um
    // defeito real no mobile antes de o header ser escondido
    await expect
      .poll(async () => (await header.isVisible()) !== (await bottom.isVisible()))
      .toBe(true)
  })

  test('os filtros são alcançáveis na largura atual', async ({ page }) => {
    await page.goto('/mercado')
    await expect(page.getByRole('region', { name: 'Catálogo de NFTs' })).toBeVisible()

    const drawerButton = page.getByRole('button', { name: 'Abrir filtros' })
    if (await drawerButton.isVisible()) {
      await drawerButton.click()
      await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeVisible()
    } else {
      await expect(page.getByRole('complementary', { name: 'Filtros' })).toBeVisible()
    }
  })
})
