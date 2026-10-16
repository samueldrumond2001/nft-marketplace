import { expect, type Page } from '@playwright/test'

/** Credenciais das contas de fábrica do mock; estão também no README. */
export const ACCOUNTS = {
  ana: { email: 'ana@kurio.dev', password: 'kurio1234', name: 'Ana Ribeiro' },
  bruno: { email: 'bruno@kurio.dev', password: 'kurio1234', name: 'Bruno Alencar' },
} as const

/**
 * Entra pelo diálogo, do mesmo jeito que uma pessoa entraria. Escrever o
 * token direto no storage seria mais rápido e testaria menos: o caminho real
 * passa pelo formulário, pelo 200 e pela troca de estado no header.
 */
export async function signIn(page: Page, email: string = ACCOUNTS.ana.email) {
  const account = Object.values(ACCOUNTS).find((item) => item.email === email) ?? ACCOUNTS.ana

  // o diálogo é um parâmetro de busca, então abrir por URL funciona igual no
  // desktop e no celular — e não depende do header, que some no mobile.
  // O caminho pelo botão é coberto à parte, em auth.spec.ts.
  await page.goto('/?auth=login')

  const dialog = page.getByRole('dialog', { name: 'Entrar' })
  await dialog.getByLabel('E-mail').fill(account.email)
  await dialog.getByLabel('Senha', { exact: true }).fill(account.password)
  await dialog.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(dialog).toBeHidden()
}

/** Volta o mock ao estado de fábrica: duas contas, nenhum carrinho. */
export async function resetMocks(page: Page) {
  // pela página, não por page.request: quem responde é o service worker do
  // MSW, que só existe dentro dela
  await page.evaluate(() => fetch('/api/__mock/reset', { method: 'POST' }))
}

export function cardOf(page: Page, name: string) {
  return page.getByRole('article').filter({ hasText: name })
}

/*
 * As ações do card aparecem no hover e no foco. Os testes usam o teclado:
 * além de não depender de coordenada — o header é sticky e rouba o clique de
 * um card rolado —, é o caminho que precisa funcionar para quem não usa mouse.
 */
export async function pressCardAction(page: Page, name: string, action: string) {
  const button = cardOf(page, name).getByRole('button', { name: new RegExp(`^${action}`) })
  await button.focus()
  await page.keyboard.press('Enter')
}

/** Adiciona ao carrinho e espera o contador do header, que confirma o POST. */
export async function addToCart(page: Page, name: string, expected: number) {
  await pressCardAction(page, name, 'Adicionar')
  const label = expected === 1 ? '1 item' : `${expected} itens`
  await expect(page.getByRole('link', { name: new RegExp(`^Carrinho, ${label}`) })).toBeVisible()
}
