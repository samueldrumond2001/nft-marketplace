import { expect, test } from '@playwright/test'

test.describe('catálogo', () => {
  test('filtra por coleção, ordena e pagina', async ({ page }) => {
    await page.goto('/')

    const grid = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(grid.getByRole('article').first()).toBeVisible()

    // os nove primeiros itens são os do Figma
    await expect(grid.getByRole('heading', { name: 'Emerald Ape #042' })).toBeVisible()

    // filtrar por coleção reduz a grade e vai para a URL
    await page.getByRole('button', { name: /^Música/ }).click()
    await expect(page).toHaveURL(/collection=musica/)
    await expect(grid.getByRole('article')).toHaveCount(3)
    await expect(grid.getByRole('heading', { name: 'Golden Beat #207' })).toBeVisible()

    // clicar de novo no filtro ativo limpa
    await page.getByRole('button', { name: /^Música/ }).click()
    await expect(page).not.toHaveURL(/collection=musica/)
    await expect(grid.getByRole('article')).toHaveCount(9)

    // ordenar por menor preço
    await page.getByLabel('Ordenar por:').selectOption('price-asc')
    await expect(page).toHaveURL(/sort=price-asc/)
    // a grade segue exibindo a página anterior enquanto busca; esperar o
    // aria-busy baixar é o que garante que a asserção vê o dado novo
    await expect(grid.getByRole('list', { name: 'Resultados' })).toHaveAttribute(
      'aria-busy',
      'false',
    )
    const firstPrice = await grid.getByRole('article').first().innerText()
    const lastPrice = await grid.getByRole('article').last().innerText()
    const parse = (text: string) => Number(/([\d.]+) ETH/.exec(text)?.[1] ?? '0')
    expect(parse(firstPrice)).toBeLessThanOrEqual(parse(lastPrice))

    // paginar
    await page.getByRole('button', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await expect(grid.getByRole('article').first()).toBeVisible()
  })

  test('a busca na URL sobrevive ao recarregamento', async ({ page }) => {
    await page.goto('/?collection=musica&sort=price-desc&page=1')
    const grid = page.getByRole('region', { name: 'Catálogo de NFTs' })

    await expect(grid.getByRole('article')).toHaveCount(3)
    await page.reload()
    await expect(grid.getByRole('article')).toHaveCount(3)
    await expect(page.getByRole('button', { name: /^Música/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
