/*
 * Auditoria de performance reprodutível.
 *
 * Três medições por página e perfil, reportando a MEDIANA. Uma execução só
 * não serve de evidência: a variação entre rodadas no mesmo computador chega
 * a 10 pontos, e quem roda depois acha que o número foi inventado. A mediana
 * descarta a rodada fria e a rodada azarada.
 *
 * A configuração mora aqui, versionada, e não na linha de comando: é o que
 * permite comparar duas execuções separadas por semanas.
 */
import { mkdir, writeFile } from 'node:fs/promises'

import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const BASE_URL = process.env.LH_BASE_URL ?? 'http://localhost:4174'
const RUNS = Number(process.env.LH_RUNS ?? 3)

/** As duas páginas que um visitante abre primeiro, e que carregam dados. */
const PAGES = [
  { id: 'home', path: '/' },
  { id: 'detalhe', path: '/mercado/emerald-ape-042' },
]

/** Perfis padrão do Lighthouse, sem ajuste: números comparáveis com o resto do mundo. */
const PROFILES = [
  { id: 'desktop', formFactor: 'desktop', screenEmulation: { disabled: true }, throttling: null },
  { id: 'mobile', formFactor: 'mobile', screenEmulation: undefined, throttling: undefined },
]

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']
const METRICS = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
]

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

async function ensureServerUp() {
  const response = await fetch(BASE_URL).catch(() => null)
  if (!response?.ok) {
    throw new Error(`Nada respondendo em ${BASE_URL}. Rode "npm run build && npm run preview".`)
  }
}

async function runOnce(url, profile, port) {
  const options = {
    port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: CATEGORIES,
    formFactor: profile.formFactor,
    ...(profile.screenEmulation ? { screenEmulation: profile.screenEmulation } : {}),
    ...(profile.throttling === null ? { throttlingMethod: 'provided' } : {}),
  }

  const { lhr } = await lighthouse(url, options)
  return {
    categories: Object.fromEntries(
      CATEGORIES.map((key) => [key, Math.round((lhr.categories[key].score ?? 0) * 100)]),
    ),
    metrics: Object.fromEntries(METRICS.map((key) => [key, lhr.audits[key].numericValue ?? 0])),
    version: lhr.lighthouseVersion,
  }
}

function formatMetric(key, value) {
  if (key === 'cumulative-layout-shift') return value.toFixed(3)
  if (value >= 1000) return `${(value / 1000).toFixed(1)} s`
  return `${Math.round(value)} ms`
}

async function main() {
  await ensureServerUp()

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] })
  const results = []
  let version = ''

  try {
    for (const page of PAGES) {
      for (const profile of PROFILES) {
        const runs = []
        for (let i = 0; i < RUNS; i += 1) {
          runs.push(await runOnce(`${BASE_URL}${page.path}`, profile, chrome.port))
        }
        version = runs[0].version

        results.push({
          page: page.id,
          profile: profile.id,
          categories: Object.fromEntries(
            CATEGORIES.map((key) => [key, median(runs.map((run) => run.categories[key]))]),
          ),
          metrics: Object.fromEntries(
            METRICS.map((key) => [key, median(runs.map((run) => run.metrics[key]))]),
          ),
          runs: runs.map((run) => run.categories.performance),
        })
      }
    }
  } finally {
    await chrome.kill()
  }

  const lines = [
    '# Lighthouse',
    '',
    `Mediana de ${RUNS} medições por página e perfil. Lighthouse ${version}, Chrome headless,`,
    `build de produção servido por \`npm run preview\` em ${BASE_URL}.`,
    '',
    `Gerado por \`npm run lighthouse\` (\`scripts/lighthouse.mjs\`) em ${new Date().toISOString().slice(0, 10)}.`,
    '',
    '## Categorias (mediana)',
    '',
    '| Página | Perfil | Performance | Acessibilidade | Boas práticas | SEO | Execuções (perf.) |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...results.map(
      (row) =>
        `| ${row.page} | ${row.profile} | ${row.categories.performance} | ${row.categories.accessibility} | ${row.categories['best-practices']} | ${row.categories.seo} | ${row.runs.join(', ')} |`,
    ),
    '',
    '## Métricas (mediana)',
    '',
    '| Página | Perfil | FCP | LCP | TBT | CLS |',
    '| --- | --- | --- | --- | --- | --- |',
    ...results.map(
      (row) =>
        `| ${row.page} | ${row.profile} | ${formatMetric('first-contentful-paint', row.metrics['first-contentful-paint'])} | ${formatMetric('largest-contentful-paint', row.metrics['largest-contentful-paint'])} | ${formatMetric('total-blocking-time', row.metrics['total-blocking-time'])} | ${formatMetric('cumulative-layout-shift', row.metrics['cumulative-layout-shift'])} |`,
    ),
    '',
  ]

  await mkdir('docs', { recursive: true })
  await writeFile('docs/lighthouse-resultados.md', lines.join('\n'), 'utf8')
  await writeFile('docs/lighthouse-resultados.json', JSON.stringify({ version, results }, null, 2))

  console.log(lines.join('\n'))
}

await main()
