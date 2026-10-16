import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsDesktop } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'
import type { CatalogFilterPatch, CatalogFilters, Facet, Network } from '../model/nft'
import { PriceRange } from './PriceRange'

interface FiltersSidebarProps {
  collections: Facet[]
  networks: Facet[]
  bounds: { min: number; max: number }
  filters: CatalogFilters
  onChange: (patch: CatalogFilterPatch) => void
  /** no mobile a sidebar é uma gaveta; no desktop fica sempre visível */
  open?: boolean
  onClose?: (() => void) | undefined
}

/*
 * Os dois formatos renderizam o mesmo painel, nunca ao mesmo tempo: o
 * `useIsDesktop` escolhe qual entra na árvore. Antes era um nó só, escondido
 * por CSS, o que deixava a versão fechada do celular ainda tabulável e sem
 * armadilha de foco. O Sheet resolve as duas coisas de uma vez — foco preso,
 * Esc, rolagem travada — e manter um nó só evita rótulo duplicado na página.
 */
export function FiltersSidebar({ open = false, onClose, ...panel }: FiltersSidebarProps) {
  const isDesktop = useIsDesktop()

  if (isDesktop) {
    return (
      <aside aria-label="Filtros" className="bg-surface-card rounded-card h-fit p-6">
        <FilterPanel {...panel} />
      </aside>
    )
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose?.()
      }}
    >
      <SheetContent
        side="left"
        closeLabel="Fechar filtros"
        aria-label="Filtros"
        className="bg-surface-card w-[85%] max-w-[320px] overflow-y-auto p-6"
      >
        <SheetTitle className="sr-only">Filtros</SheetTitle>
        <FilterPanel {...panel} />
      </SheetContent>
    </Sheet>
  )
}

type FilterPanelProps = Omit<FiltersSidebarProps, 'open' | 'onClose'>

function FilterPanel({ collections, networks, bounds, filters, onChange }: FilterPanelProps) {
  // local até o "Aplicar": arrastar não pode disparar busca por pixel
  const [range, setRange] = useState({
    min: filters.priceMin ? Number(filters.priceMin) : bounds.min,
    max: filters.priceMax ? Number(filters.priceMax) : bounds.max,
  })

  useEffect(() => {
    setRange({
      min: filters.priceMin ? Number(filters.priceMin) : bounds.min,
      max: filters.priceMax ? Number(filters.priceMax) : bounds.max,
    })
  }, [filters.priceMin, filters.priceMax, bounds.min, bounds.max])

  return (
    <>
      <FacetGroup
        title="Coleções"
        facets={collections}
        selected={filters.collection}
        onSelect={(value) => onChange({ collection: value, page: 1 })}
      />

      <h2 className="text-foreground mt-8 text-base font-bold">Faixa de preço</h2>
      <div className="mt-4">
        <PriceRange bounds={bounds} value={range} onChange={setRange} />
        <Button
          size="sm"
          onClick={() =>
            onChange({
              priceMin: range.min.toFixed(2),
              priceMax: range.max.toFixed(2),
              page: 1,
            })
          }
          className="mt-4 px-4 text-xs font-medium"
        >
          Aplicar
        </Button>
      </div>

      <FacetGroup
        className="mt-8"
        title="Rede"
        facets={networks}
        selected={filters.network}
        onSelect={(value) => onChange({ network: value as Network | undefined, page: 1 })}
      />
    </>
  )
}

interface FacetGroupProps {
  title: string
  facets: Facet[]
  selected: string | undefined
  onSelect: (value: string | undefined) => void
  className?: string
}

function FacetGroup({ title, facets, selected, onSelect, className }: FacetGroupProps) {
  return (
    <div className={className}>
      <h2 className="text-foreground text-base font-bold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {facets.map((facet) => {
          const isSelected = selected === facet.value
          return (
            <li key={facet.value}>
              <Button
                variant="ghost"
                // clicar no ativo limpa; o design não tem "limpar filtros"
                onClick={() => onSelect(isSelected ? undefined : facet.value)}
                aria-pressed={isSelected}
                className={cn(
                  'h-auto w-full justify-between p-0 text-sm',
                  isSelected ? 'text-text-accent' : 'text-text-secondary hover:text-text-accent',
                )}
              >
                <span>{facet.label}</span>
                <span className="tabular">({facet.count})</span>
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
