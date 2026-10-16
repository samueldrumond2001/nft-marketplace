import { useMutation } from '@tanstack/react-query'
import { createFileRoute, Link, Outlet, redirect, useNavigate } from '@tanstack/react-router'
import {
  CircleCheck,
  Download,
  Heart,
  KeyRound,
  LogOut,
  MapPin,
  ShoppingBag,
  TriangleAlert,
  User,
} from 'lucide-react'

import { Container } from '@/components/layout/Container'
import { meQuery, useLogout } from '@/features/auth'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/perfil')({
  // a sessão é verificada antes de montar, então a tela protegida nunca
  // chega a piscar para quem não está logado
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(meQuery)
    if (!user) {
      // o router sinaliza redirecionamento por throw; redirect() não é um Error
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: '/', search: { auth: 'login' }, replace: true })
    }
    return { location }
  },
  component: ProfileLayout,
})

const ITEMS = [
  { to: '/perfil', label: 'Dados do perfil', icon: User, exact: true },
  { to: '/perfil/carteiras', label: 'Carteiras', icon: MapPin, exact: false },
  { to: '/perfil/seguranca', label: 'Segurança', icon: KeyRound, exact: false },
] as const

// O design lista mais oito entradas; as que ainda não têm tela ficam visíveis
// e desabilitadas, em vez de sumirem do menu.
const PLACEHOLDERS = [
  { label: 'Atividade', icon: ShoppingBag },
  { label: 'Lista de interesse', icon: Heart },
  { label: 'Ofertas', icon: CircleCheck },
  { label: 'Arquivos baixados', icon: Download },
  { label: 'Suporte', icon: TriangleAlert },
] as const

function ProfileLayout() {
  const navigate = useNavigate()
  const logout = useLogout()

  const signOut = useMutation({
    mutationFn: async () => {
      await logout.mutateAsync()
    },
    onSuccess: () => void navigate({ to: '/' }),
  })

  return (
    <Container className="pt-6 pb-20">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,310px)_1fr]">
        <nav aria-label="Meu perfil" className="bg-surface-card rounded-card h-fit py-5">
          <h2 className="text-foreground px-6 text-base font-bold">Meu perfil</h2>

          <ul className="mt-4">
            {ITEMS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="group text-text-secondary hover:text-text-accent data-[status=active]:text-text-accent relative flex items-center gap-3 py-2.5 pr-6 pl-6 text-sm transition-colors"
                >
                  <span className="bg-primary absolute inset-y-0 left-0 w-[3px] opacity-0 group-data-[status=active]:opacity-100" />
                  <item.icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              </li>
            ))}

            {PLACEHOLDERS.map((item) => (
              <li key={item.label}>
                <span
                  aria-disabled
                  title="Em breve"
                  className="text-text-secondary/50 flex cursor-not-allowed items-center gap-3 py-2.5 pr-6 pl-6 text-sm"
                >
                  <item.icon className="size-4" strokeWidth={1.75} />
                  {item.label}
                </span>
              </li>
            ))}

            <li className="border-border mt-2 border-t pt-2">
              <Button
                variant="ghost"
                onClick={() => signOut.mutate()}
                disabled={signOut.isPending}
                className={cn(
                  'text-text-accent h-auto w-full justify-start gap-3 rounded-none py-2.5 pr-6 pl-6 text-sm',
                  'hover:bg-surface-dark/40 hover:text-text-accent',
                )}
              >
                <LogOut className="size-4" strokeWidth={1.75} />
                Sair
              </Button>
            </li>
          </ul>
        </nav>

        <Outlet />
      </div>
    </Container>
  )
}
