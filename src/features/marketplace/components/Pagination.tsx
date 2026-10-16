import { ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  total: number
  limit: number
  onChange: (page: number) => void
}

export function Pagination({ page, total, limit, onChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / limit))
  if (pageCount <= 1) return null

  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)

  return (
    <nav aria-label="Paginação" className="flex items-center justify-end gap-2">
      <ul className="flex items-center gap-2">
        {pages.map((value) => {
          const isCurrent = value === page
          return (
            <li key={value}>
              <Button
                variant={isCurrent ? 'solid' : 'ghost'}
                size="icon"
                onClick={() => onChange(value)}
                aria-current={isCurrent ? 'page' : undefined}
                aria-label={`Página ${value}`}
                className={cn(
                  'rounded-input size-7 text-xs',
                  isCurrent ? 'font-bold' : 'hover:text-text-accent',
                )}
              >
                {value}
              </Button>
            </li>
          )
        })}
      </ul>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange(Math.min(page + 1, pageCount))}
        disabled={page >= pageCount}
        aria-label="Próxima página"
        className="border-border hover:text-text-accent rounded-input size-7 border"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  )
}
