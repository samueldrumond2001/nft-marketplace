import { Link } from '@tanstack/react-router'
import { Fragment } from 'react'

export interface Crumb {
  label: string
  to?: '/' | '/mercado'
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="text-foreground flex flex-wrap items-center gap-2 text-xs">
        {items.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && (
              <li aria-hidden className="text-text-secondary">
                /
              </li>
            )}
            <li>
              {item.to ? (
                <Link to={item.to} className="hover:text-text-accent transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}
