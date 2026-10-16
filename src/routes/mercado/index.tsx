import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { Container } from '@/components/layout/Container'
import {
  CatalogSection,
  MobileSearchBar,
  catalogSearchSchema,
  toCatalogFilters,
} from '@/features/marketplace'
import type { CatalogFilterPatch } from '@/features/marketplace'

export const Route = createFileRoute('/mercado/')({
  validateSearch: catalogSearchSchema,
  component: MarketPage,
})

// Mesma listagem da home, sem o hero e sem o destaque: aqui a pessoa veio
// para procurar, não para ser apresentada ao site.
function MarketPage() {
  const filters = toCatalogFilters(Route.useSearch())
  const navigate = useNavigate({ from: '/mercado/' })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const patch = (next: CatalogFilterPatch) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), resetScroll: false })

  return (
    <Container className="pt-6 pb-20">
      <Breadcrumb items={[{ label: 'Início', to: '/' }, { label: 'Mercado' }]} />
      <h1 className="text-foreground text-heading mt-4">Mercado</h1>
      <MobileSearchBar
        value={filters.q ?? ''}
        onSearch={(q) => patch({ q: q || undefined, page: 1 })}
        onOpenFilters={() => setFiltersOpen(true)}
      />
      <CatalogSection
        filters={filters}
        onChange={patch}
        filtersOpen={filtersOpen}
        onCloseFilters={() => setFiltersOpen(false)}
      />
    </Container>
  )
}
