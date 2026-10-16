import { expect, test } from '@playwright/test'

test.describe('detalhe do NFT', () => {
  test('abre a partir do card e mostra preço, edições e atributos', async ({ page }) => {
    await page.goto('/')

    const grid = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await grid.getByRole('link', { name: 'Emerald Ape #042' }).click()

    await expect(page).toHaveURL(/\/mercado\/emerald-ape-042/)
    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page.getByText('1.19 ETH')).toBeVisible()
    await expect(page.getByText('Óculos, Esmeralda, Raro')).toBeVisible()
    await expect(page.getByRole('button', { name: 'COMPRAR' })).toBeEnabled()
  })

  test('troca a edição e a quantidade', async ({ page }) => {
    await page.goto('/mercado/emerald-ape-042')

    const editions = page.getByRole('radiogroup', { name: 'Edição' })
    await expect(editions.getByRole('radio', { name: '1/50', exact: true })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await editions.getByRole('radio', { name: '1/1', exact: true }).click()
    await expect(editions.getByRole('radio', { name: '1/1', exact: true })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await expect(editions.getByRole('radio', { name: '1/50', exact: true })).toHaveAttribute(
      'aria-checked',
      'false',
    )

    // 1/1 é peça única: o contador não passa de um
    await expect(page.getByText('Última unidade desta edição')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeDisabled()

    await editions.getByRole('radio', { name: '1/50', exact: true }).click()
    await expect(page.getByText('22 unidades nesta edição')).toBeVisible()

    const quantity = page.getByRole('spinbutton', { name: /Quantidade/ })
    await expect(quantity).toHaveValue('1')
    await page.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(quantity).toHaveValue('2')

    // não desce abaixo do mínimo
    await page.getByRole('button', { name: 'Diminuir quantidade' }).click()
    await expect(quantity).toHaveValue('1')
    await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()
  })

  test('as abas são operáveis por teclado', async ({ page }) => {
    await page.goto('/mercado/emerald-ape-042')

    const tabs = page.getByRole('tablist', { name: 'Informações do NFT' })
    const details = tabs.getByRole('tab', { name: 'Detalhes do NFT' })
    const reviews = tabs.getByRole('tab', { name: /Avaliações de colecionadores/ })

    await expect(details).toHaveAttribute('aria-selected', 'true')
    await details.focus()
    await page.keyboard.press('ArrowRight')
    await expect(reviews).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByText(/19 avaliações, média/)).toBeVisible()
  })

  test('mostra o carrossel de relacionados', async ({ page }) => {
    await page.goto('/mercado/emerald-ape-042')

    const carousel = page.getByRole('region', { name: 'Mais desta coleção' })
    await expect(carousel.getByRole('listitem')).toHaveCount(15)
    // três grupos de cinco, como os pontos do design
    await expect(carousel.getByRole('button', { name: /Ir para o grupo/ })).toHaveCount(3)
  })
})
