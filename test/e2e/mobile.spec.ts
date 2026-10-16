import { expect, test } from '@playwright/test'

// roda no projeto e2e-mobile, que já define o aparelho
test.describe('mobile', () => {
  test('usa a navegação inferior e a gaveta de filtros', async ({ page }) => {
    await page.goto('/')

    // o header do desktop some; quem navega é a barra de baixo
    await expect(page.getByRole('banner')).toBeHidden()
    const bottom = page.getByRole('navigation', { name: 'Navegação do rodapé' })
    await expect(bottom).toBeVisible()

    // os filtros ficam escondidos até alguém abrir
    // no celular a sidebar vira gaveta: um diálogo, com foco preso dentro
    await page.getByRole('button', { name: 'Abrir filtros' }).click()
    const filters = page.getByRole('dialog', { name: 'Filtros' })
    await expect(filters).toBeInViewport()

    await filters.getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/collection=musica/)

    await page.getByRole('button', { name: 'Fechar filtros' }).click()
    await expect(
      page.getByRole('region', { name: 'Catálogo de NFTs' }).getByRole('article'),
    ).toHaveCount(3)
  })

  test('o layout não rola na horizontal', async ({ page }) => {
    for (const path of ['/', '/mercado/emerald-ape-042', '/carrinho']) {
      await page.goto(path)
      await expect(page.getByRole('contentinfo')).toBeVisible()

      // innerWidth e não clientWidth: na emulação de aparelho os dois diferem
      // em alguns pixels mesmo sem conteúdo vazando
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `${path} tem rolagem horizontal`).toBeLessThanOrEqual(1)
    }
  })

  test('compra pelo celular, do card à confirmação', async ({ page }) => {
    await page.goto('/mercado/emerald-ape-042')
    await page.getByRole('button', { name: 'COMPRAR' }).click()
    await expect(page).toHaveURL(/\/carrinho/)

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/pagamento/)

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

    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({ timeout: 15_000 })
  })

  test('login ocupa a tela inteira e troca pelo rodapé', async ({ page }) => {
    // sem header no celular, o login vem pelo link direto
    await page.goto('/entrar')

    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await expect(dialog).toBeVisible()

    // tela cheia: sem as abas do desktop, com o logo e a troca no rodapé
    await expect(dialog.getByRole('tab')).toHaveCount(0)
    const box = await dialog.boundingBox()
    const width = await page.evaluate(() => window.innerWidth)
    expect(box?.width).toBe(width)

    await dialog.getByRole('button', { name: 'Crie uma conta' }).click()
    const signUp = page.getByRole('dialog', { name: 'Criar conta' })
    await expect(signUp).toBeVisible()
    await expect(signUp.getByRole('textbox', { name: 'Confirmar senha' })).toBeVisible()

    await signUp.getByRole('button', { name: 'Entre' }).click()
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()
  })

  test('a busca do topo filtra o catálogo', async ({ page }) => {
    await page.goto('/')

    const grid = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(grid.getByRole('article')).toHaveCount(9)

    await page.getByRole('searchbox', { name: 'Explorar coleções' }).fill('golden')

    // o campo tem debounce de 350ms antes de virar busca
    await expect(page).toHaveURL(/q=golden/)
    await expect(grid.getByRole('article')).toHaveCount(3)
    await expect(grid.getByRole('heading', { name: 'Golden Beat #207' })).toBeVisible()

    await page.getByRole('button', { name: 'Limpar busca' }).click()
    await expect(page).not.toHaveURL(/q=golden/)
    await expect(grid.getByRole('article')).toHaveCount(9)
  })
})
