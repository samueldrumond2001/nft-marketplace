import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { CatalogFilterPatch, CatalogFilters, SortOption } from '../model/nft'
import { CATALOG_TABS, SORT_OPTIONS } from '../model/nft'

interface CatalogToolbarProps {
  filters: CatalogFilters
  onChange: (patch: CatalogFilterPatch) => void
}

export function CatalogToolbar({ filters, onChange }: CatalogToolbarProps) {
  return (
    <div className="border-border flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div role="tablist" aria-label="Recorte do catálogo" className="flex items-center gap-6">
        {CATALOG_TABS.map((tab) => {
          const isActive = filters.tab === tab.value
          return (
            <Button
              key={tab.value}
              variant="ghost"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange({ tab: tab.value, page: 1 })}
              className={cn(
                'relative h-auto shrink-0 p-0 pb-2 text-sm whitespace-nowrap',
                isActive ? 'text-text-accent' : 'text-foreground hover:text-text-accent',
              )}
            >
              {tab.label}
              {isActive && (
                <span className="bg-primary absolute inset-x-0 -bottom-[13px] h-[2px]" />
              )}
            </Button>
          )
        })}
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:pb-2">
        <Label htmlFor="sort" className="text-text-secondary text-xs">
          Ordenar por:
        </Label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(event) => onChange({ sort: event.target.value as SortOption, page: 1 })}
          className="text-foreground rounded-input bg-transparent py-1 text-xs"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface-card">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
