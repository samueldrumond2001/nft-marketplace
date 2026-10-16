import { expect, test } from '@playwright/test'

import { ACCOUNTS, addToCart, signIn } from './helpers'

test.describe('carrinho e sessão', () => {
  test('o carrinho montado como visitante sobrevive ao login', async ({ page }) => {
    await page.goto('/')
    await addToCart(page, 'Emerald Ape #042', 1)

    await signIn(page)

    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()
    await page.goto('/carrinho')
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  })

  test('o carrinho de um usuário não aparece para o outro', async ({ page }) => {
    await page.goto('/')
    await signIn(page, ACCOUNTS.ana.email)
    await addToCart(page, 'Emerald Ape #042', 1)

    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair' }).click()
    // o header some no celular; o que vale em toda largura é ter saído
    await expect(page).toHaveURL(/\/$/)

    await signIn(page, ACCOUNTS.bruno.email)
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible()
  })

  test('remover um item não leva o outro junto', async ({ page }) => {
    await page.goto('/')
    await signIn(page)

    await addToCart(page, 'Emerald Ape #042', 1)
    await addToCart(page, 'Sage Nomad #009', 2)

    await page.goto('/carrinho')
    await page.getByRole('button', { name: /Remover Sage Nomad #009/ }).click()

    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()
    await expect(page.getByText('Emerald Ape #042')).toBeVisible()
  })
})
