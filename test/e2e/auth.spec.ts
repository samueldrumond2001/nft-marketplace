import { expect, test } from '@playwright/test'

import { signIn } from './helpers'

test.describe('autenticação', () => {
  // o diálogo troca de forma no celular: abas no desktop, título e link no
  // rodapé no mobile. A versão mobile é coberta em mobile.spec.ts.
  test.skip(({ isMobile }) => !!isMobile, 'layout do desktop')

  test('entra, aparece no header e sai', async ({ page }) => {
    await page.goto('/')
    await signIn(page)

    await expect(page.getByRole('link', { name: /Ana Ribeiro/ })).toBeVisible()

    await page.getByRole('link', { name: /Ana Ribeiro/ }).click()
    await expect(page).toHaveURL(/\/perfil/)

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('o diálogo recusa credencial inválida e troca para cadastro', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Entrar' }).click()

    const dialog = page.getByRole('dialog', { name: 'Entrar' })
    await dialog.getByLabel('E-mail').fill('nao-e-email')
    await dialog.getByLabel('Senha', { exact: true }).fill('123')
    await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(dialog.getByText('E-mail inválido')).toBeVisible()
    await expect(dialog.getByText('A senha tem no mínimo 8 caracteres')).toBeVisible()

    // o nome acessível do diálogo acompanha a aba, então a referência muda
    await dialog.getByRole('tab', { name: 'Criar conta' }).click()
    const signUp = page.getByRole('dialog', { name: 'Criar conta' })
    await expect(signUp).toBeVisible()
    await expect(signUp.getByRole('textbox', { name: 'Confirmar senha' })).toBeVisible()
  })

  test('o perfil exige sessão e volta com o carrinho intacto', async ({ page }) => {
    // deslogado, /perfil manda para a home com o login aberto
    await page.goto('/perfil')
    await expect(page).toHaveURL(/auth=login/)
    await expect(page.getByRole('dialog', { name: 'Entrar' })).toBeVisible()

    // o carrinho montado antes do login continua lá depois dele
    await page.getByRole('button', { name: 'Fechar' }).click()
    const card = page.getByRole('article').filter({ hasText: 'Emerald Ape #042' })
    await card.hover()
    await card.getByRole('button', { name: /Adicionar .* ao carrinho/ }).click()
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()

    await signIn(page)
    await expect(page.getByRole('link', { name: /^Carrinho, 1 item/ })).toBeVisible()

    await page.goto('/perfil')
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
  })

  test('salva o perfil e cadastra uma carteira', async ({ page }) => {
    await page.goto('/')
    await signIn(page)
    await page.goto('/perfil')

    await page.getByLabel('Nome de exibição').fill('Samuel Drumond')
    await page.getByLabel('Nome ENS').fill('samueld')
    await page.getByLabel('Apelido da carteira').fill('Principal')
    await page.getByRole('button', { name: 'Salvar' }).click()
    await expect(page.getByRole('status')).toHaveText('Perfil salvo.')

    await page.getByRole('link', { name: 'Carteiras' }).click()
    await expect(page).toHaveURL(/\/perfil\/carteiras/)

    // as duas telas têm "Apelido da carteira": esperar a de carteiras montar
    const wallets = page.getByRole('region', { name: 'Carteiras' })
    await expect(wallets.getByRole('heading', { name: 'Carteira principal' })).toBeVisible()

    await wallets.getByLabel('Apelido da carteira').fill('Reserva')
    await wallets.getByLabel('Nome do perfil').fill('Kurio')
    await wallets.getByLabel('Rede').selectOption('polygon')
    await wallets
      .getByLabel('Endereço da carteira')
      .fill('0x1234567890abcdef1234567890ABCDEF12345678')
    await wallets.getByRole('button', { name: 'Salvar carteira' }).click()

    await expect(wallets.getByText('Reserva')).toBeVisible()
    await expect(wallets.getByText('principal', { exact: true })).toBeVisible()
  })
})
