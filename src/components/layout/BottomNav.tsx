import { Link } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, User } from 'lucide-react'

const ITEMS = [
  { to: '/', label: 'Início', icon: Home, exact: true },
  { to: '/favoritos', label: 'Favoritos', icon: Heart, exact: false },
  { to: '/carrinho', label: 'Carrinho', icon: ShoppingCart, exact: false },
  { to: '/perfil', label: 'Perfil', icon: User, exact: false },
] as const

/** Barra inferior do mobile, com o botão central em destaque, como no design. */
export function BottomNav({ cartCount = 0 }: { cartCount?: number }) {
  return (
    <nav
      aria-label="Navegação do rodapé"
      className="bg-surface-card border-border fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
      // respeita a área segura dos aparelhos com barra inferior
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="relative mx-auto flex max-w-[480px] items-center justify-between px-8 py-3">
        {ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <li className="w-14" aria-hidden />

        {ITEMS.slice(2).map((item) => (
          <NavItem
            key={item.to}
            {...item}
            badge={item.to === '/carrinho' ? cartCount : undefined}
          />
        ))}
      </ul>

      <Link
        to="/mercado"
        aria-label="Explorar o mercado"
        className="bg-primary text-ink absolute -top-6 left-1/2 flex size-14 -translate-x-1/2 items-center justify-center rounded-full shadow-lg"
      >
        <ScanLine className="size-6" strokeWidth={1.75} />
      </Link>
    </nav>
  )
}

function NavItem({
  to,
  label,
  icon: Icon,
  exact,
  badge,
}: {
  to: (typeof ITEMS)[number]['to']
  label: string
  icon: typeof Home
  exact: boolean
  badge?: number | undefined
}) {
  return (
    <li>
      <Link
        to={to}
        activeOptions={{ exact }}
        // sempre anuncia a contagem, inclusive zero: quem usa leitor de tela
        // precisa saber que o carrinho está vazio, não só quando tem algo
        aria-label={
          badge === undefined ? label : `${label}, ${badge} ${badge === 1 ? 'item' : 'itens'}`
        }
        className="text-text-secondary data-[status=active]:text-text-accent relative flex flex-col items-center gap-1 transition-colors"
      >
        <Icon className="size-5" strokeWidth={1.75} />
        {badge ? (
          <span className="bg-primary text-ink text-micro absolute -top-1.5 right-0 flex size-[15px] items-center justify-center rounded-full font-bold">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  )
}
