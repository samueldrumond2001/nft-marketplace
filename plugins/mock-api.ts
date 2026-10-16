import type { IncomingMessage } from 'node:http'

import type { Plugin } from 'vite'

/**
 * Fallback para quando o service worker do MSW não registra (navegador
 * embutido, modo privativo). Sem ele /api cai no fallback da SPA e volta HTML.
 * Com o worker registrado isto aqui nunca roda.
 */
interface MockRouterModule {
  routeMockRequest: (request: {
    method: string
    pathname: string
    params: URLSearchParams
    body: Record<string, unknown>
    headers: Record<string, string | undefined>
    scenario: string
  }) => { status: number; body: unknown } | null
}

async function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  if (req.method === 'GET' || req.method === 'DELETE') return {}

  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
  } catch {
    return {}
  }
}

export function mockApi(): Plugin {
  return {
    name: 'kurio:mock-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        void (async () => {
          const send = (status: number, body: unknown) => {
            res.statusCode = status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }

          try {
            // tipado à mão: `typeof import()` arrastaria src pro tsconfig de Node
            const { routeMockRequest } = (await server.ssrLoadModule(
              '/src/mocks/api/router.ts',
            )) as unknown as MockRouterModule

            const url = new URL(req.url ?? '/', 'http://localhost')
            const result = routeMockRequest({
              method: req.method ?? 'GET',
              pathname: url.pathname,
              params: url.searchParams,
              body: await readBody(req),
              headers: req.headers as Record<string, string | undefined>,
              scenario: url.searchParams.get('scenario') ?? 'happy',
            })

            if (!result) {
              send(404, { error: { code: 'NOT_FOUND', message: 'Rota não mockada.' } })
              return
            }

            send(result.status, result.body)
          } catch (error) {
            send(500, { error: { code: 'MOCK_FAILED', message: (error as Error).message } })
          }
        })()
      })
    },
  }
}
