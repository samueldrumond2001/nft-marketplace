import { expect, test, type Page } from '@playwright/test'

import { cardOf, pressCardAction, signIn } from './helpers'

/*
 * Espera a resposta do servidor, não só o coração mudar de cor: a mutação é
 * otimista, e navegar antes de ela chegar cancelaria a requisição — o teste
 * passaria na tela e falharia no estado.
 */
async function toggleFavorite(page: Page, name: string, action: 'Favoritar' | 'Desfavoritar') {
  const settled = page.waitForResponse(
    (response) => response.url().includes('/api/favorites/') && response.status() === 200,
  )
  await pressCardAction(page, name, action)
  await settled
  return cardOf(page, name)
}

test.describe('favoritos', () => {
  test('visitante é mandado para o login antes de favoritar', async ({ page }) => {
    await page.goto('/')

    await pressCardAction(page, 'Sage Nomad #009', 'Favoritar')

    await expect(page).toHaveURL(/auth=login/)
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
  })

  test('favorita, aparece na lista e desfavorita', async ({ page }) => {
    await page.goto('/')
    await signIn(page)

    const card = await toggleFavorite(page, 'Sage Nomad #009', 'Favoritar')
    await expect(card.getByRole('button', { name: /^Desfavoritar/ })).toBeVisible()

    await page.goto('/favoritos')
    const list = page.getByRole('list', { name: 'NFTs favoritados' })
    // a conta de teste já nasce com o Emerald Ape favoritado
    await expect(list.getByRole('article')).toHaveCount(2)
    await expect(list.getByText('Sage Nomad #009')).toBeVisible()

    await toggleFavorite(page, 'Sage Nomad #009', 'Desfavoritar')
    await expect(list.getByRole('article')).toHaveCount(1)
  })

  test('sobrevive ao refresh, porque mora no servidor', async ({ page }) => {
    await page.goto('/')
    await signIn(page)

    const card = await toggleFavorite(page, 'Ivory Baron #088', 'Favoritar')
    await expect(card.getByRole('button', { name: /^Desfavoritar/ })).toBeVisible()

    await page.reload()
    await expect(
      cardOf(page, 'Ivory Baron #088').getByRole('button', { name: /^Desfavoritar/ }),
    ).toBeVisible()
  })

  test('falha de mutation desfaz o coração', async ({ page }) => {
    // espera uma ida e volta que falha de propósito, com a latência variável
    // do mock por cima; com a suíte inteira em paralelo o orçamento padrão
    // fica apertado
    test.slow()

    await page.goto('/')
    await signIn(page)

    // cenário em que o PUT falha; a lista continua respondendo normalmente
    await page.goto('/?scenario=favorite-error')
    await expect(cardOf(page, 'Golden Beat #207')).toBeVisible()

    const failed = page.waitForResponse(
      (response) => response.url().includes('/api/favorites/') && response.status() === 500,
    )
    await pressCardAction(page, 'Golden Beat #207', 'Favoritar')

    // pisca marcado pelo otimista e volta sozinho quando a mutação falha
    await failed
    await expect(
      cardOf(page, 'Golden Beat #207').getByRole('button', { name: /^Favoritar/ }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('cada usuário vê a própria lista', async ({ page }) => {
    await page.goto('/')
    await signIn(page)
    await page.goto('/favoritos')
    await expect(page.getByRole('list', { name: 'NFTs favoritados' })).toBeVisible()

    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair' }).click()
    // o header some no celular; o que vale em toda largura é ter saído
    await expect(page).toHaveURL(/\/$/)

    await signIn(page, 'bruno@kurio.dev')
    await page.goto('/favoritos')
    await expect(page.getByText('Você ainda não favoritou nenhum NFT.')).toBeVisible()
  })
})
