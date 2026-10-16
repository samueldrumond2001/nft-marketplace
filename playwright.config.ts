import { defineConfig, devices } from '@playwright/test'

const PORT = 4174
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './test',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : [['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // regressão visual: tolerância baixa, mas não zero — antialiasing de fonte
  // difere entre máquinas e zero daria falso positivo em toda execução
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },

  projects: [
    {
      name: 'e2e-desktop',
      testDir: './test/e2e',
      // mobile.spec é específico do aparelho; roda só no projeto mobile
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'e2e-mobile',
      testDir: './test/e2e',
      // catalog.spec clica no filtro direto; no celular ele mora na gaveta,
      // e esse caminho é coberto por mobile.spec
      testIgnore: /catalog\.spec\.ts/,
      // Pixel 5 é Chromium: evita baixar o WebKit e cobre o navegador
      // móvel mais usado
      use: { ...devices['Pixel 5'] },
    },
    {
      // 768 é a largura onde o layout troca de forma: o header volta, a
      // sidebar sai da gaveta. É o ponto em que as duas regras se encostam,
      // então é o que mais quebra.
      name: 'e2e-tablet',
      testDir: './test/e2e',
      testMatch: /(layout|catalog)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'visual',
      testDir: './test/visual',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
