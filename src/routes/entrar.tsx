import { createFileRoute, redirect } from '@tanstack/react-router'

// O login é um modal sobre a página atual; a rota existe só para o link direto.
export const Route = createFileRoute('/entrar')({
  beforeLoad: () => {
    // o router sinaliza redirecionamento por throw; redirect() não é um Error
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ to: '/', search: { auth: 'login' }, replace: true })
  },
})
