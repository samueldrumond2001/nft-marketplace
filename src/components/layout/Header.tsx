import { Link } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart, User as UserIcon } from 'lucide-react'

import type { User } from '@/features/auth'
import { Container } from './Container'
import { Button } from '@/components/ui/button'

const NAV = [
  { to: '/', label: 'Início' },
  { to: '/mercado', label: 'Mercado' },
  { to: '/criadores', label: 'Criadores' },
  { to: '/aprenda', label: 'Aprenda' },
] as const

interface HeaderProps {
  cartCount?: number
  user?: User | null
  onSignIn?: () => void
}

export function Header({ cartCount = 0, user = null, onSignIn }: HeaderProps) {
  return (
    <header
      // no celular o design não tem header: a navegação é a barra de baixo e
      // o topo é a busca. Mantê-lo aqui também duplicaria o link do carrinho.
      className="border-border bg-ink sticky top-0 z-40 border-b max-md:hidden"
    >
      <Container className="relative flex h-[75px] items-center justify-between gap-4">
        <Link
          to="/"
          className="text-foreground shrink-0 text-base font-bold tracking-[0.18em]"
          aria-label="Kurio, página inicial"
        >
          KURIO
        </Link>

        <nav aria-label="Principal" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-10">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="group text-foreground hover:text-text-accent data-[status=active]:text-text-accent relative flex h-[75px] items-center text-base transition-colors"
                  activeOptions={{ exact: item.to === '/' }}
                >
                  {item.label}
                  <span className="bg-primary absolute inset-x-0 bottom-0 h-[3px] opacity-0 group-data-[status=active]:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-6">
          <Button variant="ghost" size="icon" className="text-foreground" aria-label="Buscar">
            <Search className="size-5" strokeWidth={1.75} />
          </Button>

          <Link
            to="/carrinho"
            className="text-foreground hover:text-text-accent relative transition-colors"
            aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
          >
            <ShoppingCart className="size-5" strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="bg-primary text-ink text-micro absolute -top-2 -right-2 flex size-[18px] items-center justify-center rounded-full font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link
              to="/perfil"
              className="border-primary text-primary hover:bg-primary hover:text-ink rounded-btn flex items-center gap-1.5 border px-3 py-1.5 text-sm transition-colors"
            >
              <UserIcon className="size-4" strokeWidth={1.75} />
              <span className="max-w-[90px] truncate">{user.displayName}</span>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={onSignIn}>
              <LogIn className="size-4" strokeWidth={1.75} />
              Entrar
            </Button>
          )}
        </div>
      </Container>
    </header>
  )
}
