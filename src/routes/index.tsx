import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Container } from '@/components/layout/Container'
import {
  CatalogSection,
  Hero,
  JournalSection,
  MobileSearchBar,
  PromoCards,
  catalogSearchSchema,
  toCatalogFilters,
} from '@/features/marketplace'
import type { CatalogFilterPatch } from '@/features/marketplace'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: HomePage,
})

function HomePage() {
  const filters = toCatalogFilters(Route.useSearch())
  const navigate = useNavigate({ from: '/' })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const patch = (next: CatalogFilterPatch) =>
    void navigate({ search: (prev) => ({ ...prev, ...next }), resetScroll: false })

  return (
    <Container className="pb-20">
      <MobileSearchBar
        value={filters.q ?? ''}
        onSearch={(q) => patch({ q: q || undefined, page: 1 })}
        onOpenFilters={() => setFiltersOpen(true)}
      />
      <Hero />
      <CatalogSection
        filters={filters}
        onChange={patch}
        featured
        filtersOpen={filtersOpen}
        onCloseFilters={() => setFiltersOpen(false)}
      />
      <PromoCards />
      <JournalSection />
    </Container>
  )
}
