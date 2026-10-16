import { expect, test } from '@playwright/test'

import { ACCOUNTS, signIn } from './helpers'

test.describe('conta', () => {
  test('cadastro com e-mail já existente responde 409 no campo', async ({ page }) => {
    await page.goto('/?auth=register')

    const dialog = page.getByRole('dialog', { name: 'Criar conta' })
    await dialog.getByLabel('Nome de usuário').fill('ana2')
    await dialog.getByLabel('E-mail').fill(ACCOUNTS.ana.email)
    await dialog.getByLabel('Senha', { exact: true }).fill('kurio1234')
    await dialog.getByRole('textbox', { name: 'Confirmar senha' }).fill('kurio1234')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()

    await expect(dialog.getByText('E-mail já cadastrado')).toBeVisible()
    // continua no diálogo: nada foi criado
    await expect(dialog).toBeVisible()
  })

  test('cadastro novo entra direto', async ({ page }) => {
    await page.goto('/?auth=register')

    const dialog = page.getByRole('dialog', { name: 'Criar conta' })
    await dialog.getByLabel('Nome de usuário').fill('carla.mint')
    await dialog.getByLabel('E-mail').fill('carla@kurio.dev')
    await dialog.getByLabel('Senha', { exact: true }).fill('kurio1234')
    await dialog.getByRole('textbox', { name: 'Confirmar senha' }).fill('kurio1234')
    await dialog.getByRole('button', { name: 'Criar conta', exact: true }).click()

    await expect(dialog).toBeHidden()
    // confere pela tela de perfil, que existe nas duas larguras: no celular
    // o header do desktop não aparece
    await page.goto('/perfil')
    await expect(page.getByRole('textbox', { name: 'Nome de usuário' })).toHaveValue('carla.mint')
  })

  test('troca a senha e recusa a senha atual errada', async ({ page }) => {
    await signIn(page)
    await page.goto('/perfil/seguranca')

    await expect(page.getByRole('heading', { name: 'Segurança', exact: true })).toBeVisible()

    // senha atual errada: o erro volta no campo que a causou
    await page.getByRole('textbox', { name: 'Senha atual' }).fill('errada123')
    await page.getByRole('textbox', { name: 'Nova senha', exact: true }).fill('kurio5678')
    await page.getByRole('textbox', { name: 'Confirmar nova senha' }).fill('kurio5678')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha atual incorreta')).toBeVisible()

    // validação local: confirmação diferente nem chega ao servidor
    await page.getByRole('textbox', { name: 'Senha atual' }).fill(ACCOUNTS.ana.password)
    await page.getByRole('textbox', { name: 'Confirmar nova senha' }).fill('outra-coisa')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('As senhas não conferem')).toBeVisible()

    await page.getByRole('textbox', { name: 'Confirmar nova senha' }).fill('kurio5678')
    await page.getByRole('button', { name: 'Alterar senha' }).click()
    await expect(page.getByText('Senha alterada.')).toBeVisible()
  })

  test('escolhe um avatar e ele fica salvo', async ({ page }) => {
    await signIn(page)
    await page.goto('/perfil')

    const avatars = page.getByRole('radiogroup', { name: 'Avatar' })
    await avatars.getByRole('radio', { name: 'sage nomad' }).click()
    await expect(avatars.getByRole('radio', { name: 'sage nomad' })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await page.reload()
    await expect(
      page.getByRole('radiogroup', { name: 'Avatar' }).getByRole('radio', { name: 'sage nomad' }),
    ).toHaveAttribute('aria-checked', 'true')
  })

  test('edita uma carteira já cadastrada', async ({ page }) => {
    await signIn(page)
    await page.goto('/perfil/carteiras')

    await page.getByRole('button', { name: 'Editar Principal' }).click()
    const form = page.getByRole('form', { name: 'Editar Principal' })
    await form.getByLabel('Apelido').fill('Carteira fria')
    await form.getByRole('button', { name: 'Salvar' }).click()

    await expect(page.getByText('Carteira fria')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Carteira fria')).toBeVisible()
  })

  test('o perfil de um usuário não vaza para o outro', async ({ page }) => {
    await signIn(page, ACCOUNTS.ana.email)
    await page.goto('/perfil/carteiras')
    await expect(page.getByRole('button', { name: 'Editar Principal' })).toBeVisible()

    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair' }).click()
    // o header some no celular; o que vale em toda largura é ter saído
    await expect(page).toHaveURL(/\/$/)

    await signIn(page, ACCOUNTS.bruno.email)
    await page.goto('/perfil/carteiras')
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()
    await page.goto('/perfil')
    await expect(page.getByRole('textbox', { name: 'Nome de exibição' })).toHaveValue(
      ACCOUNTS.bruno.name,
    )
  })
})
